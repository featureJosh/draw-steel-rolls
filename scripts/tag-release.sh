#!/usr/bin/env bash
# Creates an annotated semver tag and pushes it to origin (triggers .github/workflows/release.yml).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

read -r -p "Release version [v]X.Y.Z (e.g. v1.2.3): " raw_version
trimmed="$(echo "$raw_version" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
if [[ -z "$trimmed" ]]; then
  echo "No version entered; aborting." >&2
  exit 1
fi

if [[ "$trimmed" != v* ]]; then
  tag="v${trimmed}"
else
  tag="$trimmed"
fi

if [[ ! "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid tag '$tag'. Use semver like v1.2.3 (digits only in each segment)." >&2
  exit 1
fi

if git rev-parse "$tag" >/dev/null 2>&1; then
  echo "Tag '$tag' already exists locally." >&2
  exit 1
fi

echo ""
echo "Will create annotated tag: $tag"
read -r -p "Continue and push to origin? [y/N] " confirm
case "$confirm" in
  [yY]|[yY][eE][sS]) ;;
  *)
    echo "Aborted."
    exit 0
    ;;
esac

git tag -a "$tag" -m "Release $tag"
git push origin "$tag"

echo ""
echo "Pushed $tag — GitHub Actions should create the release shortly."
echo "Open your repo on GitHub → Actions → Release workflow if you want to watch it run."
