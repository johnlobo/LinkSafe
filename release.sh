#!/bin/bash
set -e

# --- Commit message ---
read -p "Commit message: " MSG
if [ -z "$MSG" ]; then
  echo "Error: commit message cannot be empty."
  exit 1
fi

# --- Git add, commit, push ---
git add -A
git commit -m "$MSG"
git push

# --- Bump version in package.json ---
npm version patch --no-git-tag-version

NEW_VERSION=$(node -p "require('./package.json').version")

git add package.json package-lock.json
git commit -m "chore: bump version to v$NEW_VERSION"
git tag "v$NEW_VERSION"
git push origin HEAD "v$NEW_VERSION"

echo ""
echo "Released v$NEW_VERSION"
