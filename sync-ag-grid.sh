#!/bin/bash

set -eu

if [[ -d .git ]] ; then
    echo "Run this scipt outside the ag-charts repo."
    exit 1
fi

if [[ -d ag-charts-sync ]] ; then
    rm -rf ag-charts-sync
fi

git clone --no-local ./ag-grid-tertiary ag-charts-sync -b latest
cd ag-charts-sync
git filter-repo \
    --path charts-community-modules/ag-charts-community \
    --path charts-enterprise-modules/ag-charts-enterprise \
    --path charts-packages/ag-charts-community \
    --path grid-packages/grid-charts \
    --path grid-packages/charts \
    --path-glob 'grid-packages/ag-grid-docs/documentation/doc-pages/charts-**' \
    --path-rename charts-community-modules/ag-charts-community:packages/ag-charts-community \
    --path-rename charts-enterprise-modules/ag-charts-enterprise:packages/ag-charts-enterprise
git filter-repo \
    --invert-paths \
    --path-glob '**/dist/**' \
    --path-glob '**/typings/**' \
    --path-glob '**/__image_snapshots__/**'

echo "Now run the following commands in the ag-charts repo:"
echo "git checkout track-ag-grid"
echo "git fetch local-sync latest"
echo "git merge local-sync/latest --allow-unrelated-histories"
