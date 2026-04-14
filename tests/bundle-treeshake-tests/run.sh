#!/bin/bash

set -eu

update=false
if [[ "${1:-}" == "-u" ]]; then
    update=true
fi

script_dir=$(cd "$(dirname "$0")" && pwd)
repo_dir=$(cd "${script_dir}/../.." && pwd)

# Create temp directory
mkdir -p "${script_dir}/.tmp"
if [[ $(uname) == "Darwin" ]]; then
    tmp_dir=$(mktemp -d "${script_dir}/.tmp/tmp.XXXXXXXX")
else
    tmp_dir=$(mktemp -d -p "${script_dir}/.tmp")
fi
echo ">>> temp dir: ${tmp_dir}"

# Copy test files
cp "${script_dir}/test-treeshake.mjs" "${tmp_dir}/"
cp "${script_dir}/scenarios.mjs" "${tmp_dir}/"
cp -R "${script_dir}/bundlers" "${tmp_dir}/"

# Copy tarballs
for pkg in ag-charts-types ag-charts-locale ag-charts-core ag-charts-community ag-charts-enterprise; do
    cp "${repo_dir}/dist/packages/${pkg}.tgz" "${tmp_dir}/"
done

# Install packages and bundler dependencies in temp dir
cd "${tmp_dir}"
npm init -y >/dev/null 2>&1
echo ">>> installing tarballs and bundler dependencies..."
npm install --no-audit --no-fund \
    ./ag-charts-types.tgz \
    ./ag-charts-locale.tgz \
    ./ag-charts-core.tgz \
    ./ag-charts-community.tgz \
    ./ag-charts-enterprise.tgz \
    esbuild 'vite@^7' webpack 2>&1

echo ">>> running bundle tree-shake tests..."
update_flag=""
if ${update}; then
    update_flag="--update --scenarios-path ${script_dir}/scenarios.mjs"
fi
node test-treeshake.mjs ${update_flag}
