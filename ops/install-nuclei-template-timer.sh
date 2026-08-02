#!/usr/bin/env bash
set -Eeuo pipefail

[[ "${EUID}" -eq 0 ]] || { echo "Run as root." >&2; exit 1; }

readonly APP_DIR="/opt/pentor/app"
readonly SERVICE_FILE="/etc/systemd/system/pentor-nuclei-templates.service"
readonly TIMER_FILE="/etc/systemd/system/pentor-nuclei-templates.timer"

[[ -f "${APP_DIR}/compose.yml" ]] || { echo "Pentor compose.yml not found at ${APP_DIR}." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is not installed." >&2; exit 1; }
command -v flock >/dev/null 2>&1 || { echo "flock is not installed." >&2; exit 1; }

cat > "$SERVICE_FILE" <<'EOF'
[Unit]
Description=Update Pentor Nuclei templates
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target
ConditionPathExists=/opt/pentor/app/compose.yml

[Service]
Type=oneshot
WorkingDirectory=/opt/pentor/app
ExecStart=/usr/bin/flock -n /run/pentor-nuclei-update.lock /usr/bin/docker compose exec -T api nuclei -update-templates -update-template-dir /home/node/nuclei-templates
TimeoutStartSec=15min
Nice=10
IOSchedulingClass=best-effort
IOSchedulingPriority=7
EOF

cat > "$TIMER_FILE" <<'EOF'
[Unit]
Description=Daily Pentor Nuclei template update

[Timer]
OnCalendar=*-*-* 03:17:00 UTC
RandomizedDelaySec=45m
Persistent=true
Unit=pentor-nuclei-templates.service

[Install]
WantedBy=timers.target
EOF

chmod 0644 "$SERVICE_FILE" "$TIMER_FILE"
systemctl daemon-reload
systemctl enable --now pentor-nuclei-templates.timer

echo
echo "Pentor Nuclei template timer installed."
systemctl list-timers pentor-nuclei-templates.timer --no-pager
echo
echo "Manual test: systemctl start pentor-nuclei-templates.service"
echo "Logs: journalctl -u pentor-nuclei-templates.service -n 100 --no-pager"

