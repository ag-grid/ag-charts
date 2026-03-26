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
    if [[ ${version} == "latest" ]] ; then
        echo ">>> npm i -g @angular/cli@latest"
        npm i -g @angular/cli
    else
        echo ">>> npm i -g @angular/cli@^${version}.0.0"
        npm i -g @angular/cli@^${version}.0.0
    fi
    echo ">>> ng new angular-${version}-test"
    echo "" | ng new angular-${version}-test --defaults=true --strict --prefix=app --style=scss --package-manager=npm --routing=false --interactive=false

    cd angular-${version}-test
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
