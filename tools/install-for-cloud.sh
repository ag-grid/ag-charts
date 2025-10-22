#!/bin/bash

if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  echo "Not a remote session, skipping install"
  exit 0
fi

function install_yarn() {
    echo "Installing yarn@1 && initial dependencies"
    cat >.yarnrc <<EOF
--install.ignore-engines true
--run.ignore-engines true
EOF
    npm i -g --force yarn@1
    yarn install --ci
}

function install_dependencies() {
    echo "Installing dependencies"
    if (yarn check --integrity) ; then
        echo "Dependencies already installed, skipping install"
        yarn postinstall
    else
        echo "Installing dependencies"
        yarn install --ci
    fi
}

if [ -d node_modules ]; then
    install_dependencies
else
    install_yarn
fi
