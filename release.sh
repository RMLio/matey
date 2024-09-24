#!/usr/bin/env bash
set -e

TAG=$1
RELEASE_BRANCH="master"

if [ -z "$1" ]; then
    echo "Supply release tag as 'X.Y.Z'. For example: ./release.sh 1.0.0"
    exit 1
fi

# Dependencies and branch
echo "Installing dependencies and branch..."

if ! changefrog --help > /dev/null; then
	npm install -g changefrog > /dev/null
fi
git checkout "$RELEASE_BRANCH"

# Update NPM package
echo "Updating NPM package release"
npm config set git-tag-version false
npm version "$TAG" > /dev/null

# Update CHANGELOG.md
echo "Updating CHANGELOG.md"
changefrog -n "$TAG" > /dev/null

# Create release commit
echo "Creating git commit and tag"
git add .
git commit -m "release v$TAG"
git tag "v$TAG"

# Push to branches
echo "Pushing branches..."
git push origin "$RELEASE_BRANCH"
git push --tags origin

# NPM
echo "Uploading release to NPM"

# Check if logging in is needed
set +e
if ! npm whoami; then
	echo "NPM requires login to publish release."
	npm login
fi
set -e

# Upload release to NPM
npm publish

echo "Done!"
