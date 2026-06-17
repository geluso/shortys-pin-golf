#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$ROOT/data"

if [[ ! -f "$ROOT/data/entries.json" ]]; then
  printf '[]\n' > "$ROOT/data/entries.json"
  echo "Created data/entries.json"
else
  echo "data/entries.json already exists"
fi

if [[ ! -f "$ROOT/data/.htaccess" ]]; then
  printf 'Deny from all\n' > "$ROOT/data/.htaccess"
  echo "Created data/.htaccess"
else
  echo "data/.htaccess already exists"
fi

chmod 755 "$ROOT/data"
chmod 644 "$ROOT/data/entries.json" "$ROOT/data/.htaccess"

echo "Done. data/ is ready for score storage."
