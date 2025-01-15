#!/bin/bash

set -eu

npx rimraf -g dist/ 'packages/*/dist/' 'libraries/*/dist/' 'plugins/*/dist/' 'external/*/dist/' 'packages/ag-charts-website/node_modules/.vite/'
nx reset --only-cache && rimraf .nx/
echo Cleaned
