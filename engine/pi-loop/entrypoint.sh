#!/usr/bin/env bash
# Entrypoint for Pi agent loop container
set -u
PI_HOME="${PI_HOME:-/root/.pi/agent}"
mkdir -p "$PI_HOME"

# Prevent git "dubious ownership" error when host UID differs from container root
git config --global --add safe.directory /workspace 2>/dev/null || true

# Install Python dependencies for engine if requirements.txt exists
if [ -f "/workspace/requirements.txt" ]; then
  echo "[entrypoint] Ensuring Python dependencies with uv..."
  uv pip install --system -r /workspace/requirements.txt -r /workspace/requirements-dev.txt >/dev/null 2>&1 || true
fi

# Install Pi packages listed in settings.json (if any)
if [ -f "$PI_HOME/settings.json" ]; then
  for pkg in $(jq -r '.packages[]? ' "$PI_HOME/settings.json"); do
    echo "[entrypoint] pi install $pkg"
    pi install "$pkg" || echo "[entrypoint] WARN: install $pkg failed (continuing)"
  done
fi

exec "$@"
