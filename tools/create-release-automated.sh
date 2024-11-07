#!/bin/bash

set -eu

BRANCH=$1
RELEASE=$(echo "$1" | sed 's/^[a-zA-Z]*//')
echo "Preparing BRANCH branch ${BRANCH}"

SKIP_PROMPT=${2:-prompt} # optional

git checkout -b ${BRANCH}
./tools/bump-versions.sh ${RELEASE}
node ./tools/update-release-info.js

NEW_VERSION=$(node ./tools/calculate-next-version.js)
./tools/bump-versions.sh ${NEW_VERSION}
node ./tools/readme/sync-readme.js

git commit -a -m "BRANCH prep for ${NEW_VERSION}"
git push --set-upstream origin $BRANCH
