#!/usr/bin/env bash

if [ "$#" -lt 2 ]
  then
    echo "You must supply a release version and release branch"
    exit 1
fi

RELEASE_VERSION=$1
RELEASE_BRANCH=$2

# The bump rewrites dependency versions in package.json files, so yarn.lock has to be regenerated
# in the same commit. CI runs `yarn check --integrity` on an exact node_modules cache hit and fails
# every job on the branch when the lockfile is stale, so run the same check here before the push.
# (`yarn install --frozen-lockfile` is not a reliable probe: Yarn 1 passes it on a stale lockfile.)
if ! yarn check --integrity > /dev/null 2>&1; then
  echo "yarn.lock is out of step with the bumped package.json files - running yarn install"
  yarn install --prefer-offline || {
    echo "yarn install failed - check that the bumped dependency versions have been published"
    exit 1
  }
  yarn check --integrity || exit 1
fi

NON_PACKAGE_JSON_COUNT=`git status --porcelain | grep -Ev "package.json|yarn.lock|version.ts|.seed-manifest.json|packages/ag-charts-enterprise/src/license/licenseManager.ts|.env.*|README.md|ag-charts-versions.json" | wc -l`

if [ $NON_PACKAGE_JSON_COUNT -ne 0 ];
then
  echo "Only package.json, version.ts, yarn.lock, seed manifests, root env files and licenseManager files should be updated - please verify changeset.."
  git status --porcelain
  exit 1
fi

git add .
git commit -am "Release $RELEASE_VERSION Prep"  --no-verify
git push -u origin "$RELEASE_BRANCH"  --no-verify
