#!/bin/sh

set -eu

RELEASE=$1
echo "Preparing release branch ${RELEASE}"

git fetch origin latest
git switch ${RELEASE}
git merge origin/latest
NEW_VERSION=$(node ./tools/calculate-next-version.js)
./tools/bump-versions.sh ${NEW_VERSION}
git commit -a -m "Release prep for ${NEW_VERSION}"
git tag latest-beta-version -f

read -p "Ready to push to ${RELEASE}? " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]] ; then
    git push -f origin ${RELEASE} latest-beta-version
else
    echo
    echo "Run this command when ready:"
    echo "  git push -f origin ${RELEASE} latest-beta-version"
fi
