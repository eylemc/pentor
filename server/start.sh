#!/bin/sh
set -eu

TEMPLATE_DIR="/home/node/nuclei-templates"

if ! find "$TEMPLATE_DIR" -type f \( -name '*.yaml' -o -name '*.yml' \) -print -quit | grep -q .; then
  echo "[PENTOR] Nuclei templates are missing; downloading the signed official template bundle..."
  nuclei -update-templates -update-template-dir "$TEMPLATE_DIR"
fi

if ! find "$TEMPLATE_DIR" -type f \( -name '*.yaml' -o -name '*.yml' \) -print -quit | grep -q .; then
  echo "[PENTOR] Nuclei template bootstrap failed." >&2
  exit 1
fi

echo "[PENTOR] Nuclei templates are ready. Starting API."
exec node index.mjs

