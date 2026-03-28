#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL not set; skipping seed. Set DATABASE_URL to seed admin." >&2
  exit 0
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
db="${url_no_proto#*/}"

echo "Seeding admin to $db@$host:$port as $user"
export PGPASSWORD="$pass"
psql -h "$host" -p "$port" -U "$user" -d "$db" -f db/seeds/insert-admin.sql

echo "Seed complete (if no errors)."
