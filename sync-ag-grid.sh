#!/bin/bash

set -eu

REPO_CLONE_SOURCE=../ag-grid
REPO_CLONE_TARGET=../ag-charts-sync

git checkout track-ag-grid
START_CWD=$(pwd)

function checkout {
    cd ${START_CWD}

    if [[ ! -d .git ]] ; then
        echo "Run this scipt from the root of the ag-charts repo."
        exit 1
    fi

    if [[ ! -d ${REPO_CLONE_SOURCE} ]] ; then
        echo "Source repo checkout not found: ${REPO_CLONE_SOURCE}"
        exit 1
    fi

    if [[ -d ${REPO_CLONE_TARGET}${1:-} ]] ; then
        rm -rf ${REPO_CLONE_TARGET}${1:-}
    fi

    if (git remote | grep local-sync${1:-}$$ >/dev/null) ; then
        git remote add local-sync${1:-} ${REPO_CLONE_TARGET}${1:-}
    fi

    git clone --no-local ${REPO_CLONE_SOURCE} ${REPO_CLONE_TARGET}${1:-} -b latest
    cd ${REPO_CLONE_TARGET}${1:-}
}

checkout

git filter-repo \
    --path charts-community-modules/ag-charts-community \
    --path charts-enterprise-modules/ag-charts-enterprise \
    --path charts-packages/ag-charts-community \
    --path grid-packages/grid-charts \
    --path grid-packages/charts \
    --path-glob 'grid-packages/ag-grid-docs/documentation/doc-pages/charts-**' \
    --path-rename charts-community-modules/:packages/ \
    --path-rename charts-enterprise-modules/:packages/
git filter-repo \
    --invert-paths \
    --path-glob '**/dist/**' \
    --path-glob '**/typings/**' \
    --path-glob '**/__image_snapshots__/**'

cd ${START_CWD}
git fetch local-sync latest
# cp -PR ${IMAGE_SNAPSHOT_TMPDIR}/* ./

checkout 2

git filter-repo \
    --path charts-community-modules/ag-charts-angular \
    --path charts-community-modules/ag-charts-react \
    --path charts-community-modules/ag-charts-vue \
    --path charts-community-modules/ag-charts-vue3 \
    --path charts-packages/ag-charts-angular \
    --path charts-packages/ag-charts-react \
    --path charts-packages/ag-charts-vue \
    --path charts-packages/ag-charts-vue3 \
    --path-rename charts-community-modules/:packages/
git filter-repo \
    --invert-paths \
    --path-glob 'charts-community-modules/*/lib/**' \
    --path-glob 'charts-community-modules/*/dist/**' \
    --path-glob 'charts-community-modules/*/umd/**' \
    --path-glob 'charts-community-modules/*/typings/**' \
    --path-glob 'charts-packages/*/lib/**' \
    --path-glob 'charts-packages/*/dist/**' \
    --path-glob 'charts-packages/*/umd/**' \
    --path-glob 'charts-packages/*/typings/**'

cd ${START_CWD}
git checkout track-ag-grid
git fetch local-sync latest
git fetch local-sync2 latest

git merge local-sync/latest --allow-unrelated-histories
git merge local-sync2/latest --allow-unrelated-histories
