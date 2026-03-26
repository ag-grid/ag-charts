#!/bin/bash

set -eu

fw=vue3
fw_package=vue
dev_port=5173
patch_subdir=modules

function install_fw {
    echo ">>> npx create-vue"
    npx create-vue --default --ts vue-${version}-test

    cd vue-${version}-test
    npm i

    git init
}

function build_fw {
    echo ">>> npm run build"
    npm run build
}

function serve_fw {
    echo ">>> npm run dev"
    npm run dev --host
}

# NOTE: This gets inlined when running in Docker for simplicity of execution.
source $(readlink -f $(dirname $0))/../shared/run.sh
