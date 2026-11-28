#!/bin/bash
# Copy ONLY data/ from a snapshot directory onto a git checkout.
# This does not commit, push, delete history, or replace the frontend.
# The daily publisher that replaces main with a parentless commit does not
# call this script; it lives outside this repository.
set -euo pipefail
if [[ $# -ne 2 ]]; then
  echo "usage: $0 <snapshot-dir> <repo-dir>" >&2
  exit 2
fi
src=$(cd "$1" && pwd)
dst=$(cd "$2" && pwd)
if [[ ! -d "$src/data" ]]; then
  echo "snapshot has no data/" >&2
  exit 2
fi
for forbidden in index.html app.js style.css CNAME; do
  if [[ -e "$src/$forbidden" ]]; then
    echo "refusing snapshot that also contains $forbidden; data-only updates must not replace the frontend" >&2
    exit 3
  fi
done
mkdir -p "$dst/data"
cp -a "$src/data/." "$dst/data/"
echo "copied data/ only"
