#!/bin/bash

set -eu

fw=angular
fw_package="@angular/cli"
dev_port=4200

function init_fw {
    if [[ ${version} == "latest" || ${version} -ge 20 ]] ; then
        patch_subdir=post-20-modules
    else
        patch_subdir=pre-20-modules
    fi
}

function install_fw {
    # The newest Angular starter pulls in vitest, whose optional peer graph
    # crashes npm 10's resolver ("Cannot read properties of null (reading
    # 'edgesOut')"). Scaffold without installing and install the starter's own
    # dependencies with peer resolution disabled; the ag-charts packages are
    # still installed afterwards with npm's default resolver, so what this test
    # actually covers is unchanged.
    ng_new_opts=
    if [[ ${version} == "latest" ]] ; then
        echo ">>> npm i -g @angular/cli@latest"
        npm i -g @angular/cli
        ng_new_opts=--skip-install
    else
        echo ">>> npm i -g @angular/cli@^${version}.0.0"
        npm i -g @angular/cli@^${version}.0.0
    fi
    echo ">>> ng new angular-${version}-test"
    echo "" | ng new angular-${version}-test --defaults=true --strict --prefix=app --style=scss --package-manager=npm --routing=false --interactive=false ${ng_new_opts}

    cd angular-${version}-test

    if [[ -n ${ng_new_opts} ]] ; then
        echo ">>> npm install --legacy-peer-deps"
        npm install --legacy-peer-deps
    fi
}

function build_fw {
    echo ">>> ng build"
    ng build
}

function serve_fw {
    echo ">>> ng serve"
    ng serve --host 0.0.0.0 &
}

# NOTE: This gets inlined when running in Docker for simplicity of execution.
source $(readlink -f $(dirname $0))/../shared/run.sh
