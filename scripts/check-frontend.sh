#!/bin/bash
# Confirm the market console is present, then prove a data-only copy
# leaves index.html, app.js and style.css byte-for-byte unchanged.
# Does not fetch market data and does not touch the published site.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
need() {
  local file=$1 needle=$2
  if ! grep -F -q -- "$needle" "$file"; then
    echo "missing marker in ${file#$root/}: $needle" >&2
    exit 1
  fi
}
need "$root/app.js" "function dashView"
need "$root/app.js" "stockking.watchlist.v1"
need "$root/app.js" "function dkSpark"
need "$root/style.css" ".dk-ev"
need "$root/style.css" ".tone-amber"
need "$root/index.html" "仁禾管理顧問"
need "$root/index.html" "renhe74123@gmail.com"
need "$root/index.html" "LINE 官方帳號：@891tcxhu"
need "$root/index.html" "不構成投資建議"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/repo/data" "$tmp/snap/data"
cp "$root/index.html" "$root/app.js" "$root/style.css" "$tmp/repo/"
cp -a "$root/data/." "$tmp/repo/data/"
cp -a "$root/data/." "$tmp/snap/data/"
python3 - "$tmp/snap/data/all.json" << 'PY'
import json, sys
p = sys.argv[1]
with open(p) as f:
    d = json.load(f)
d["meta"]["built"] = "1999-01-01 00:00"
with open(p, "w") as f:
    json.dump(d, f, ensure_ascii=False)
PY
before=$(mktemp -d)
cp "$tmp/repo/index.html" "$tmp/repo/app.js" "$tmp/repo/style.css" "$before/"
bash "$root/scripts/apply-data-snapshot.sh" "$tmp/snap" "$tmp/repo"
cmp "$before/index.html" "$tmp/repo/index.html"
cmp "$before/app.js" "$tmp/repo/app.js"
cmp "$before/style.css" "$tmp/repo/style.css"
python3 - "$tmp/repo/data/all.json" << 'PY'
import json, sys
d = json.load(open(sys.argv[1]))
assert d["meta"]["built"] == "1999-01-01 00:00", d["meta"]["built"]
PY
if bash "$root/scripts/apply-data-snapshot.sh" "$root" "$tmp/repo" 2>"$tmp/err"; then
  echo "snapshot containing frontend files should have been refused" >&2
  exit 1
fi
echo "frontend markers present; data-only copy left the UI unchanged"
