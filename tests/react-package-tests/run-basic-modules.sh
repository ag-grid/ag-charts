#!/bin/bash

set -eu

fw=react
fw_package=react
dev_port=5173
patch_subdir=basic-modules

function install_fw {
    # Pinned: create-vite 9.3.2 was published without its templates.
    npm create -y vite@9.3.1 react-${version}-basic-test -- --template react-ts

    cd react-${version}-basic-test
    npm i react@${version} react-dom@${version}
    npm i

    git init
}

function build_fw {
    echo ">>> npm run build"
    npm run build
}

function serve_fw {
    echo ">>> npm run dev"
    npm run dev
}

# NOTE: This gets inlined when running in Docker for simplicity of execution.
source $(readlink -f $(dirname $0))/../shared/run.sh
