#!/bin/sh
set -e

# Ensure runtime directories exist
mkdir -p /app/data /app/cache

# If persistent SQLite database does not exist, seed from initial dev.db
if [ ! -f /app/data/aiva.db ] && [ -f /app/prisma/dev.db ]; then
  echo "[aiva-init] Initializing persistent database at /app/data/aiva.db from dev.db template..."
  cp /app/prisma/dev.db /app/data/aiva.db
  chmod 664 /app/data/aiva.db || true
  echo "[aiva-init] Database initialized successfully."
fi

# Execute main process
exec "$@"
