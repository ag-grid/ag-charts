#!/bin/bash

# Usage:
# ./tools/bump-versions.sh 9.0.0-beta.7

set -eu

NEW_VERSION="$1"
TOOLS_DIR=$(dirname $0)
SKIP_FORMAT="${2:-no}"

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

# The demo seed projects pin ag-charts-* by branch: X.Y.Z on a bX.Y.Z release branch or for a plain
# X.Y.Z version, the npm "latest" dist-tag everywhere else (readPinnedChartsVersion in
# packages/ag-charts-demos/tools/seeds/seed-common.mjs). The branch being bumped is the one checked
# out, which the release scripts create or switch to before calling this, so it is named outright:
# otherwise a CI variable naming the branch the job started on would take precedence. A detached
# HEAD names nothing, and the seed tooling falls back to its CI variables.
if [ -z "${AG_CHARTS_SEED_BRANCH:-}" ]; then
    CHECKED_OUT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CHECKED_OUT_BRANCH" != "HEAD" ]; then
        export AG_CHARTS_SEED_BRANCH="$CHECKED_OUT_BRANCH"
    fi
fi
echo "Pinning the demo seeds for branch ${AG_CHARTS_SEED_BRANCH:-(none checked out)}"
node ./packages/ag-charts-demos/tools/seeds/generate-react-seed.mjs
# The framework ports are hand-written rather than generated, so their pins are rewritten in place.
node ./packages/ag-charts-demos/tools/seeds/pin-ports.mjs

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

