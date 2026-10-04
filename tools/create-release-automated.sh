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

    # lts releases don't advance the latest supported version - that row is updated manually
    ./tools/release/updateSecurityMarkdown.sh ${RELEASE}
fi

NEW_VERSION=$(node ./tools/calculate-next-version.js)
./tools/bump-versions.sh ${NEW_VERSION}
node ./tools/readme/sync-readme.js
node ./tools/updateVersionsData.js version

# The bumps rewrite dependency versions in package.json files, so yarn.lock has to be regenerated in
# the same commit - CI runs `yarn install --immutable` and fails every job on the branch when the
# lockfile is stale. The plain install needs YARN_ENABLE_IMMUTABLE_INSTALLS=false on CI agents, where
# Yarn 4 otherwise defaults to immutable installs; the explicit --immutable re-check is unaffected.
AG_SKIP_NATIVE_DEP_VERSION_CHECK=1 yarn install
AG_SKIP_NATIVE_DEP_VERSION_CHECK=1 yarn install --immutable

git commit -a -m "BRANCH prep for ${NEW_VERSION}" --no-verify
git push --set-upstream origin $BRANCH --no-verify
