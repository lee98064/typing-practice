#!/usr/bin/env bash
# Build with the GitHub Pages sub-path and publish dist/ to the gh-pages branch.
# (Used instead of the Actions workflow while Actions is unavailable on the account.)
set -euo pipefail
cd "$(dirname "$0")/.."
REPO_URL="$(git remote get-url origin)"
NAME="$(basename -s .git "$REPO_URL")"
BASE="/${NAME}/" pnpm build
TMP="$(mktemp -d)"
cp -R dist/. "$TMP"/
touch "$TMP/.nojekyll"   # Vite emits files starting with "_" — keep Jekyll away
cd "$TMP"
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(git -C "$OLDPWD" rev-parse --short HEAD)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -q -f "$REPO_URL" gh-pages
echo "Deployed to gh-pages"
