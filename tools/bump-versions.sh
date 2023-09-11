#!/bin/sh

# Usage:
# ./tools/bump-versions.sh 9.0.0-beta.7

set -eu

NEW_VERSION="$1"
TOOLS_DIR=$(dirname $0)

PACKAGES=(
    ag-charts-community
    ag-charts-enterprise
    ag-charts-angular
    ag-charts-react
    ag-charts-vue
    ag-charts-vue3
)

for package in ${PACKAGES[@]}; do
    node ${TOOLS_DIR}/bump-repo-dep.js $package "$NEW_VERSION"
done

# Ensure consistent package.json formatting.
npx nx format
