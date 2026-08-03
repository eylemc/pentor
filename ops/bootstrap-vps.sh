#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

readonly APP_NAME="pentor"
readonly APP_USER="pentor-deploy"
readonly APP_ROOT="/opt/pentor"
readonly APP_DIR="${APP_ROOT}/app"
readonly REPO_URL="https://github.com/eylemc/pentor.git"
readonly EXPECTED_IP="95.179.169.114"

log() { printf '\n\033[1;32m[PENTOR]\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33m[PENTOR WARNING]\033[0m %s\n' "$*" >&2; }
die() { printf '\n\033[1;31m[PENTOR ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

on_error() {
  local exit_code=$?
  printf '\n\033[1;31m[PENTOR ERROR]\033[0m Bootstrap failed at line %s (exit %s).\n' "${BASH_LINENO[0]}" "$exit_code" >&2
  exit "$exit_code"
}
trap on_error ERR

[[ "${EUID}" -eq 0 ]] || die "Run this script as root."
[[ -r /etc/os-release ]] || die "Cannot identify this operating system."

# shellcheck disable=SC1091
source /etc/os-release
[[ "${ID:-}" == "ubuntu" ]] || die "Ubuntu is required; detected: ${ID:-unknown}."
[[ "${VERSION_ID:-}" == "24.04" ]] || warn "Designed for Ubuntu 24.04; detected ${VERSION_ID:-unknown}."

available_kb=$(df -Pk / | awk 'NR==2 {print $4}')
[[ "$available_kb" -ge 4194304 ]] || die "At least 4 GB of free disk space is required."

log "Preparing Ubuntu packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  fail2ban \
  git \
  jq \
  openssl \
  sudo \
  unattended-upgrades \
  ufw

log "Installing Docker Engine and Compose"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu %s stable\n' \
  "$(dpkg --print-architecture)" "${VERSION_CODENAME}" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

install -d -m 0755 /etc/docker
if [[ ! -e /etc/docker/daemon.json ]]; then
  cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true
}
JSON
else
  warn "/etc/docker/daemon.json already exists; preserving it."
fi
systemctl enable --now docker
systemctl restart docker

log "Creating the non-root deployment account"
if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash --groups docker "$APP_USER"
fi
usermod -aG docker "$APP_USER"

# Preserve the current key-based access for the deployment account, without
# disabling root access during the first bootstrap.
if [[ -s /root/.ssh/authorized_keys ]]; then
  install -d -m 0700 -o "$APP_USER" -g "$APP_USER" "/home/${APP_USER}/.ssh"
  install -m 0600 -o "$APP_USER" -g "$APP_USER" \
    /root/.ssh/authorized_keys "/home/${APP_USER}/.ssh/authorized_keys"
else
  warn "No root authorized_keys found. Root SSH remains unchanged."
fi

log "Configuring firewall"
ufw default deny incoming
ufw default allow outgoing
ufw limit OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

log "Configuring Fail2ban and automatic security updates"
cat > /etc/fail2ban/jail.d/pentor-sshd.conf <<'EOF'
[sshd]
enabled = true
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
systemctl enable --now unattended-upgrades

log "Adding conservative network hardening"
cat > /etc/sysctl.d/99-pentor.conf <<'EOF'
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.tcp_syncookies = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.log_martians = 1
EOF
sysctl --system >/dev/null

log "Ensuring swap exists for the 2 GB VPS"
if ! swapon --show=NAME --noheadings | grep -q .; then
  if [[ ! -e /swapfile ]]; then
    fallocate -l 2G /swapfile
    chmod 0600 /swapfile
    mkswap /swapfile >/dev/null
  fi
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || printf '/swapfile none swap sw 0 0\n' >> /etc/fstab
fi

log "Cloning or updating Pentor"
install -d -m 0755 -o "$APP_USER" -g "$APP_USER" "$APP_ROOT"
if [[ ! -d "${APP_DIR}/.git" ]]; then
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
else
  if [[ -n "$(sudo -u "$APP_USER" git -C "$APP_DIR" status --porcelain)" ]]; then
    die "${APP_DIR} has local changes. Refusing to overwrite them."
  fi
  sudo -u "$APP_USER" git -C "$APP_DIR" pull --ff-only
fi

log "Building and starting the Pentor frontend"
cd "$APP_DIR"
docker compose up -d --build --remove-orphans

log "Running health checks"
for attempt in {1..30}; do
  if curl -fsS http://127.0.0.1/healthz >/dev/null; then
    break
  fi
  [[ "$attempt" -lt 30 ]] || {
    docker compose logs --tail=100 web
    die "Pentor did not become healthy."
  }
  sleep 2
done

public_ip=$(curl -4fsS --max-time 5 https://api.ipify.org || true)
if [[ -n "$public_ip" && "$public_ip" != "$EXPECTED_IP" ]]; then
  warn "Public IP is ${public_ip}; expected ${EXPECTED_IP}. Verify that this is the intended VPS."
fi

log "Bootstrap completed successfully"
printf '\nPentor URL: http://%s\n' "${public_ip:-$EXPECTED_IP}"
printf 'Health:    http://%s/healthz\n' "${public_ip:-$EXPECTED_IP}"
printf 'Deploy user: %s\n' "$APP_USER"
printf '\nUseful commands:\n'
printf '  cd %s && docker compose ps\n' "$APP_DIR"
printf '  cd %s && docker compose logs -f --tail=100\n' "$APP_DIR"
printf '  cd %s && sudo -u %s git pull --ff-only && docker compose up -d --build\n' "$APP_DIR" "$APP_USER"
printf '\nRoot SSH has NOT been disabled. Verify key login as %s before hardening SSH further.\n' "$APP_USER"
