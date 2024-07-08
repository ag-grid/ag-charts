#!/bin/sh

set -eu

BRANCH=$1
RELEASE=$(echo "$1" | sed 's/^[a-zA-Z]*//')
echo "Preparing BRANCH branch ${BRANCH}"

git checkout -b ${BRANCH}
./tools/bump-versions.sh ${RELEASE}
node ./tools/update-release-info.js

NEW_VERSION=$(node ./tools/calculate-next-version.js)
./tools/bump-versions.sh ${NEW_VERSION}
./tools/readme/sync-readme.js
git commit -a -m "BRANCH prep for ${NEW_VERSION}"
git tag latest-beta-version -f

read -p "Ready to push to ${BRANCH}? " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]] ; then
    git push -f origin ${BRANCH} latest-beta-version
else
    echo
    echo "Run this command when ready:"
    echo "  git push -f origin ${BRANCH} latest-beta-version"
fi
