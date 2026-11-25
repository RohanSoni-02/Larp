// Uploads supabase/seed-media/official/** to the public `official` storage
// bucket (overwriting objects with the same path). Hosted projects don't run
// the local `[storage.buckets]` seeding, so production builds run this instead.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../supabase/seed-media/official/', import.meta.url));
const BUCKET = 'official';
const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(ROOT).filter((f) => TYPES[extname(f).toLowerCase()]);
let failed = 0;
for (const file of files) {
  const objectPath = relative(ROOT, file).split('\\').join('/');
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': TYPES[extname(file).toLowerCase()],
      'Cache-Control': 'max-age=3600',
      'x-upsert': 'true',
    },
    body: readFileSync(file),
  });
  if (!res.ok) {
    failed++;
    console.error(`✗ ${objectPath}: ${res.status} ${await res.text()}`);
  }
}
console.log(`Synced ${files.length - failed}/${files.length} official images to the '${BUCKET}' bucket.`);
if (failed > 0) process.exit(1);
