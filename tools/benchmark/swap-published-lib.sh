#!/bin/bash
#
# Replace the dev-served library bundles in a built website dist with the UMD
# bundles of a published npm version. Example pages load the chart library via
# /dev/<pkg>/dist/umd/<pkg>.js, so after the swap the (head-built) example set
# runs against the published library version — no website build at the old ref
# is needed.
#
# Usage:
#   ./tools/benchmark/swap-published-lib.sh <npm-version> <site-dist-dir>
#
# Example:
#   ./tools/benchmark/swap-published-lib.sh 13.3.1 /tmp/site-base

set -euo pipefail

version=${1:?Usage: swap-published-lib.sh <npm-version> <site-dist-dir>}
site_dir=${2:?Usage: swap-published-lib.sh <npm-version> <site-dist-dir>}

if [[ ! -d "${site_dir}/dev" ]]; then
    echo "ERROR: ${site_dir}/dev not found — is this a built website dist?" >&2
    exit 1
fi

tmp_dir=$(mktemp -d)
trap 'rm -rf "${tmp_dir}"' EXIT

for pkg in ag-charts-community ag-charts-enterprise ag-charts-locale; do
    echo "[swap-published-lib] Fetching ${pkg}@${version}..." >&2
    npm pack "${pkg}@${version}" --pack-destination "${tmp_dir}" --silent > /dev/null

    extract_dir="${tmp_dir}/${pkg}"
    mkdir -p "${extract_dir}"
    tar -xzf "${tmp_dir}/${pkg}-${version}.tgz" -C "${extract_dir}"

    if [[ ! -f "${extract_dir}/package/dist/umd/${pkg}.js" ]]; then
        echo "ERROR: ${pkg}@${version} tarball has no dist/umd/${pkg}.js" >&2
        exit 1
    fi

    dest="${site_dir}/dev/${pkg}/dist/umd"
    rm -rf "${dest}"
    mkdir -p "${dest}"
    cp "${extract_dir}/package/dist/umd/"* "${dest}/"
    echo "[swap-published-lib] Installed ${pkg}@${version} into ${dest}" >&2
done

echo "[swap-published-lib] Done: ${site_dir} now serves published v${version} bundles" >&2
