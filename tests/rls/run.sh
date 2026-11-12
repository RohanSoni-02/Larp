#!/usr/bin/env bash
# RLS integration tests against a LOCAL Supabase instance.
# Usage: supabase start && supabase db reset && ./tests/rls/run.sh
set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

run_file() {
  if command -v psql >/dev/null 2>&1; then
    psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$1"
  else
    # No local psql: pipe through the Supabase DB container instead.
    local container
    container="$(docker ps --filter "name=supabase_db_" --format '{{.Names}}' | head -n 1)"
    if [ -z "$container" ]; then
      echo "No psql and no supabase_db_* container found. Start Supabase first." >&2
      exit 1
    fi
    docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q < "$1"
  fi
}

for f in "$(dirname "$0")"/*.sql; do
  echo "▶ $f"
  run_file "$f"
done

echo "All RLS tests passed."
