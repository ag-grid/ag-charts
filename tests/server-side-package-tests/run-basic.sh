#!/bin/bash

set -eu

test_type=ssr
patch_subdir=basic

ssr_test_deps="tsx pixelmatch pngjs"
ssr_test_entry="app.ts"
ssr_packages="ag-charts-types ag-charts-locale ag-charts-community ag-charts-core ag-charts-server-side"

function install_fw {
    npm init -y >/dev/null
}

function build_fw {
    :
}

function run_ssr_test {
    echo ">>> running SSR rendering test..."
    npx tsx ${ssr_test_entry} $(${update} && echo "--update" || echo "")
}

source $(readlink -f $(dirname $0))/../shared/run.sh
