#!/usr/bin/env bash
# Dedicated local Postgres for The Zora Files (separate from deem_api's
# cluster in ~/.pgsql/data). Uses the Postgres 17 binaries in ~/.pgsql/17.
#
#   bash scripts/db/local-db.sh init     # one time: create cluster + empty zorafiles DB + schema
#   bash scripts/db/local-db.sh start
#   bash scripts/db/local-db.sh stop
#   bash scripts/db/local-db.sh status
#
# Listens on localhost:5433 only, trust auth, superuser "zora".
# .env.local:  DATABASE_URL=postgresql://zora@localhost:5433/zorafiles
set -euo pipefail

BIN="${PG_BIN:-$HOME/.pgsql/17/bin}"
DATA="${ZORA_PGDATA:-$HOME/.pgsql-zora/data}"
LOG="$HOME/.pgsql-zora/server.log"
PORT=5433
HERE="$(cd "$(dirname "$0")/.." && pwd)"   # website/scripts

exe() { if [ -x "$BIN/$1.exe" ]; then echo "$BIN/$1.exe"; else echo "$BIN/$1"; fi; }
PSQL="$(exe psql)"

start() {
  if "$(exe pg_ctl)" -D "$DATA" status >/dev/null 2>&1; then echo "already running"; return; fi
  # Detach fully so the calling shell doesn't hang on the server's stdio.
  "$(exe pg_ctl)" -D "$DATA" -o "-p $PORT -c listen_addresses=localhost" -l "$LOG" start >/dev/null 2>&1 &
  for _ in $(seq 1 30); do
    "$(exe pg_isready)" -h localhost -p $PORT -q && { echo "running on localhost:$PORT"; return; }
    sleep 1
  done
  echo "did not start; see $LOG" >&2; exit 1
}

case "${1:-status}" in
  init)
    if [ -f "$DATA/PG_VERSION" ]; then echo "cluster already exists at $DATA"; exit 0; fi
    mkdir -p "$(dirname "$DATA")"
    "$(exe initdb)" -D "$DATA" -U zora --auth=trust -E UTF8 --locale=C >/dev/null
    start
    "$(exe createdb)" -h localhost -p $PORT -U zora zorafiles
    # Roles Supabase policies refer to, so a production dump restores cleanly.
    "$PSQL" -h localhost -p $PORT -U zora -d zorafiles -q -c \
      "do \$\$ begin
         if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
         if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
         if not exists (select from pg_roles where rolname='service_role') then create role service_role nologin; end if;
       end \$\$;"
    "$PSQL" -h localhost -p $PORT -U zora -d zorafiles -q -v ON_ERROR_STOP=1 \
      -f "$HERE/setup-db.sql" -f "$HERE/add-episode-media.sql" -f "$HERE/setup-stays.sql"
    "$PSQL" -h localhost -p $PORT -U zora -d zorafiles -q -c \
      "alter table discoveries add column if not exists detection_method text not null default 'photographed';"
    echo "initialized zorafiles (empty episodes; run copy-prod-to-local.sh for real data)"
    ;;
  start) start ;;
  stop) "$(exe pg_ctl)" -D "$DATA" stop -m fast ;;
  status) "$(exe pg_ctl)" -D "$DATA" status || true ;;
  *) echo "usage: $0 init|start|stop|status" >&2; exit 2 ;;
esac
