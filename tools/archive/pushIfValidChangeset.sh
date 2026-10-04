#!/usr/bin/env bash

if [ "$#" -lt 2 ]
  then
    echo "You must supply a release version and release branch"
    exit 1
fi

RELEASE_BRANCH=$1

# The bump rewrites dependency versions in package.json files, so yarn.lock has to be regenerated
# in the same commit. CI runs `yarn install --immutable` and fails every job on the branch when the
# lockfile is stale, so run the same check here before the push. `--immutable` aborts without
# writing anything when the lockfile would need to change, so it doubles as a staleness probe.
# The fallback install needs YARN_ENABLE_IMMUTABLE_INSTALLS=false on CI agents, where Yarn 4
# otherwise defaults to immutable installs.
if ! yarn install --immutable > /dev/null 2>&1; then
  echo "yarn.lock is out of step with the bumped package.json files - running yarn install"
  yarn install || {
    echo "yarn install failed - check that the bumped dependency versions have been published"
    exit 1
  }
  yarn install --immutable || exit 1
fi

NON_PACKAGE_JSON_COUNT=`git status --porcelain | grep -Ev "package.json|yarn.lock|version.t|.env.*|*.zip" | wc -l`

if [ $NON_PACKAGE_JSON_COUNT -ne 0 ];
then
  echo "Only package.json, version.ts, yarn.lock files  should be updated - please verify changeset.."
  git status --porcelain
  exit 1
fi

git add -- . ':!*.zip'
git commit -am "Version Bump" --no-verify
git push -u origin "$RELEASE_BRANCH" --no-verify
