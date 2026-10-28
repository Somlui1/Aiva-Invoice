#!/bin/sh
set -e
mkdir -p /app/data /app/cache

# Database schema.
#  - SQLite (DATABASE_URL=file:…): create / update the schema in place. The database starts EMPTY —
#    no demo invoices are copied in any more; documents arrive from the Engine.
#  - PostgreSQL (DATABASE_URL=postgres://… or postgresql://…): push schema.
#  - SQL Server (sqlserver://…): apply versioned migrations (prisma/migrations).
case "${DATABASE_URL:-}" in
  file:*)
    echo "[aiva-init] prisma db push (SQLite)"
    npx prisma db push --skip-generate
    ;;
  postgres:*|postgresql:*)
    echo "[aiva-init] prisma db push (PostgreSQL)"
    npx prisma db push --skip-generate
    ;;
  sqlserver:*)
    if [ -d /app/prisma/migrations ]; then
      echo "[aiva-init] prisma migrate deploy (SQL Server)"
      npx prisma migrate deploy
    else
      echo "[aiva-init] ERROR: SQL Server needs prisma/migrations (see production-hardening plan)" >&2
      exit 1
    fi
    ;;
  *)
    echo "[aiva-init] ERROR: DATABASE_URL is not set" >&2
    exit 1
    ;;
esac

exec "$@"
