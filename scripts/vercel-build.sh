#!/usr/bin/env bash
# Vercel build. Production builds migrate the database and sync the official
# guide images *before* exporting the app, so a new client never goes live
# against an old schema. If either step fails, the build fails and the current
# deployment stays up.
set -euo pipefail

DB_URL="${POSTGRES_URL_NON_POOLING:-}"

if [ "${VERCEL_ENV:-}" = "production" ]; then
  if [ -z "$DB_URL" ]; then
    echo "POSTGRES_URL_NON_POOLING is not set; connect the Supabase integration in Vercel." >&2
    exit 1
  fi
  npx supabase db push --remote "$DB_URL" --yes
  node scripts/sync-official-media.mjs
elif [ -n "$DB_URL" ]; then
  # Preview builds share the production database: report, never apply.
  npx supabase db push --remote "$DB_URL" --dry-run || echo "Could not check pending migrations." >&2
fi

npx expo export --platform web --output-dir dist
