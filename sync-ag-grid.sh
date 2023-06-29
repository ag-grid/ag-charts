#!/bin/bash

set -eu

git clone --no-local ./ag-grid-tertiary ag-charts-sync
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
