#!/bin/sh

set -eu

NEW_VERSION=$(node ./tools/calculate-next-version.js)
./tools/bump-versions.sh ${NEW_VERSION}
node ./tools/readme/sync-readme.js
git commit -a -m "Package bump prep for ${NEW_VERSION}"
git tag latest-beta-version -f

read -p "Ready to push to ${BRANCH}? " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]] ; then
    git push origin latest
    git push -f origin latest-beta-version
else
    echo
    echo "Run this command when ready:"
    echo "  git push -f origin latest latest-beta-version"
fi
