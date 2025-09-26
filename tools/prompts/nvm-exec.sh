#!/bin/sh

set -euo pipefail

if [[ ! -d $HOME/.nvm ]]; then
    echo "nvm not installed, cannot continue"
    exit 1
fi

source $HOME/.nvm/nvm.sh

nvm exec "$@"
