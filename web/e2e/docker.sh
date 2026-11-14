#!/bin/sh
# The browser tests in the image CI runs them in (Playwright's, at the version in package.json), so
# screenshots are taken and compared on one system. Takes Playwright's arguments, e.g.
# --update-snapshots to approve new looks.
set -e
cd "$(dirname "$0")/.."
repo=$(cd .. && pwd)
version=$(node -p "require('@playwright/test/package.json').version")
exec docker run --rm --ipc=host --user "$(id -u):$(id -g)" -e HOME=/tmp \
    -v "$repo:$repo" -w "$repo/web" "mcr.microsoft.com/playwright:v$version-noble" \
    sh -c 'mkdir -p /tmp/bin && corepack enable --install-directory /tmp/bin && PATH="/tmp/bin:$PATH" node_modules/.bin/playwright test "$@"' sh "$@"
