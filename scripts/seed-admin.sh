#!/usr/bin/env bash
set -euo pipefail

# Allow passing a custom SQL file as first argument
SEED_FILE="${1:-db/seeds/insert-admin.sql}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL not set; skipping seed. Set DATABASE_URL to seed database." >&2
  exit 0
fi

if [[ ! -f "$SEED_FILE" ]]; then
  echo "Seed file not found: $SEED_FILE" >&2
  exit 1
fi

url="$DATABASE_URL"
url_no_proto="${url#postgres://}"
userpass="${url_no_proto%@*}"
hostportdb="${url_no_proto#*@}"
user="${userpass%%:*}"
pass="${userpass#*:}"
hostport="${hostportdb%%/*}"
host="${hostport%%:*}"
port="${hostport##*:}"
# Handle case where port might be missing
if [[ "$hostport" != *":"* ]]; then
  host="$hostport"
  port="5432"
fi
db="${url_no_proto#*/}"

echo "Seeding database with $SEED_FILE to $db@$host:$port as $user"
export PGPASSWORD="$pass"
psql -h "$host" -p "$port" -U "$user" -d "$db" -f "$SEED_FILE"

echo "Seed complete (if no errors)."
