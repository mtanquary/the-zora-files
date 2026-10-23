#!/usr/bin/env bash
# Copy the production Supabase database (public schema) into the local
# zorafiles database on localhost:5433. READ-ONLY against production:
# it only runs pg_dump there.
#
#   bash scripts/db/copy-prod-to-local.sh
#
# Needs SUPABASE_DB_URL in website/.env.local (Supabase > Connect >
# Session pooler URI, password filled in). The local DB is dropped and
# recreated, then the lookout tables and seed are reloaded.
#
# Skipped: member tables tied to Supabase Auth (profiles,
# member_submissions). They reference auth.users, which only exists in
# Supabase, and hold member emails we don't need locally.
set -euo pipefail

WEB="$(cd "$(dirname "$0")/../.." && pwd)"
BIN="${PG_BIN:-$HOME/.pgsql/17/bin}"
exe() { if [ -x "$BIN/$1.exe" ]; then echo "$BIN/$1.exe"; else echo "$BIN/$1"; fi; }
LOCAL="postgresql://zora@localhost:5433"

SUPABASE_DB_URL="${SUPABASE_DB_URL:-$(grep -E '^SUPABASE_DB_URL=' "$WEB/.env.local" | head -1 | cut -d= -f2-)}"
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "SUPABASE_DB_URL is not set in website/.env.local" >&2; exit 1
fi

bash "$WEB/scripts/db/local-db.sh" start >/dev/null

DUMP="$(mktemp -d)/zorafiles.dump"
echo "1/4  Dumping production public schema (read-only)…"
"$(exe pg_dump)" "$SUPABASE_DB_URL" --schema=public --no-owner --no-privileges \
  --exclude-table=public.profiles --exclude-table=public.member_submissions \
  --format=custom --file="$DUMP"

echo "2/4  Recreating local zorafiles…"
"$(exe psql)" "$LOCAL/postgres" -q -c "drop database if exists zorafiles with (force);" -c "create database zorafiles;"
# The dump recreates the public schema itself, so start from none.
"$(exe psql)" "$LOCAL/zorafiles" -q -c "drop schema public cascade;"

echo "3/4  Restoring…"
"$(exe pg_restore)" --dbname="$LOCAL/zorafiles" --no-owner --no-privileges "$DUMP" || \
  echo "     (pg_restore reported warnings above; Supabase-only objects are expected to skip)"
rm -f "$DUMP"

echo "4/4  Lookout tables + seed…"
"$(exe psql)" "$LOCAL/zorafiles" -q -v ON_ERROR_STOP=1 -f "$WEB/scripts/setup-stays.sql"
(cd "$WEB" && DATABASE_URL="$LOCAL/zorafiles" node scripts/stays/load-lookouts.mjs)

"$(exe psql)" "$LOCAL/zorafiles" -At -c \
  "select 'episodes: ' || count(*) from episodes union all select 'discoveries: ' || count(*) from discoveries union all select 'lookouts: ' || count(*) from stay_sites;"
echo "Done. DATABASE_URL in .env.local should be $LOCAL/zorafiles"
