#!/bin/bash

set -eu

BRANCH=$1
RELEASE=$(echo "$1" | sed 's/^[a-zA-Z]*//')
echo "Preparing BRANCH branch ${BRANCH}"

SKIP_LICENSE_UPDATE="${2:-false}" # optional - for lts releases we don't update the license timestamp

git checkout -b ${BRANCH}
./tools/bump-versions.sh ${RELEASE}

if [[ "$SKIP_LICENSE_UPDATE" == "false" ]];
then
    node ./tools/update-release-info.js
fi

NEW_VERSION=$(node ./tools/calculate-next-version.js)
./tools/bump-versions.sh ${NEW_VERSION}
node ./tools/readme/sync-readme.js
node ./tools/updateVersionsData.js version

git commit -a -m "BRANCH prep for ${NEW_VERSION}" --no-verify
git push --set-upstream origin $BRANCH
