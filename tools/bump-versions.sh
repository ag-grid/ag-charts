#!/bin/bash

# Usage:
# ./tools/bump-versions.sh 9.0.0-beta.7

set -eu

NEW_VERSION="$1"
TOOLS_DIR=$(dirname $0)
SKIP_FORMAT="${2:-no}"

# generate-react-seed.mjs below imports prettier, so the bump needs the workspace's packages even on
# a bare checkout, such as the job that makes the "Release X.Y.Z Prep" commit. Install them here,
# before any package.json is bumped, while the committed yarn.lock still matches.
if ! node -e "require.resolve('prettier')" >/dev/null 2>&1; then
    echo "prettier is not installed - running yarn install for the demo seed tooling"
    yarn install --frozen-lockfile --ignore-scripts --prefer-offline
fi

PACKAGES=(
    ag-charts
    ag-charts-core
    ag-charts-community
    ag-charts-enterprise
    ag-charts-types
    ag-charts-locale
    ag-charts-angular
    ag-charts-react
    ag-charts-vue3
    ag-charts-server-side
    ag-charts-test
    ag-charts-generate-example-files
    ag-charts-generate-code-reference-files
    ag-charts-generate-chart-thumbnail
    ag-charts-demos
)

for package in ${PACKAGES[@]}; do
    node ${TOOLS_DIR}/update-package-json-deps.js $package "$NEW_VERSION"
done

# The demo seed projects pin ag-charts-* by version, whatever the branch (readPinnedChartsVersion in
# packages/ag-charts-demos/tools/seeds/seed-common.mjs): X.Y.Z for a plain X.Y.Z version, the npm
# "latest" dist-tag for a pre-release. Between bumps the seed tooling keeps a release pin that a
# merge-back from a release branch carried in; --reset-pin drops it, so every bump, the weekly beta
# bump and the release-branch cut included, writes the pin the new version calls for.
node ./packages/ag-charts-demos/tools/seeds/generate-react-seed.mjs --reset-pin
# The framework ports are hand-written rather than generated, so their pins are rewritten in place.
node ./packages/ag-charts-demos/tools/seeds/pin-ports.mjs --reset-pin

echo >./packages/ag-charts-community/src/version.ts "// DO NOT UPDATE MANUALLY: Generated from script during build time
export const VERSION = '${NEW_VERSION}';"

for envFile in ./packages/ag-charts-website/.env* ./.env ; do
    echo "Updating ${envFile}"
    if [[ $(uname) == "Darwin" ]] ; then
        sed -i "" -e '/PUBLIC_PACKAGE_VERSION=/ d' ${envFile}
    else
        sed -i"" -e '/PUBLIC_PACKAGE_VERSION=/ d' ${envFile}
    fi
    echo "PUBLIC_PACKAGE_VERSION=${NEW_VERSION}" >>${envFile}
done

# Update grid version
GRID_VERSION=$(node ${TOOLS_DIR}/calculate-grid-version.js "$NEW_VERSION")
node ${TOOLS_DIR}/update-grid-version.js "$GRID_VERSION"

PACKAGE_FILES=$(git status -s | grep package.json | awk '{ print $2 }')

if [ "$SKIP_FORMAT" != "yes" ] && [ -n "$PACKAGE_FILES" ]
  then
    # Ensure consistent package.json formatting.
    npx prettier -w $PACKAGE_FILES
fi

