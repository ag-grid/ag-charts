#!/bin/bash

set -eu

START_CWD=$(pwd)

if [[ ! -d ../ag-charts-sync && ! -d .git ]] ; then
    echo "Run this scipt from the root of the ag-charts repo."
    exit 1
fi

if [[ -d ../ag-charts-sync ]] ; then
    rm -rf ../ag-charts-sync
fi

IMAGE_SNAPSHOT_TMPDIR=$(mktemp -d)

git clone --no-local ../ag-grid-tertiary ../ag-charts-sync -b latest
cd ../ag-charts-sync

find . -name "__image_snapshots__" | ( while read DIR ; do
  TARGET_DIR=${DIR/.\/charts-community-modules\//packages\/}
  TARGET_DIR=${TARGET_DIR/.\/charts-enterprise-modules\//packages\/}
  mkdir -p ${IMAGE_SNAPSHOT_TMPDIR}/${TARGET_DIR}
  cp -P $DIR/* ${IMAGE_SNAPSHOT_TMPDIR}/${TARGET_DIR}/
done )

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

cd ${START_CWD}
git checkout track-ag-grid
git fetch local-sync latest
git merge local-sync/latest --allow-unrelated-histories
cp -PR ${IMAGE_SNAPSHOT_TMPDIR}/* ./
