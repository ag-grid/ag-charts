#!/bin/bash
#
# Replace the dev-served library bundles in a built website dist with the UMD
# bundles produced by packing the LOCAL workspace packages (head).
#
# This is the head-side mirror of swap-published-lib.sh: that script installs the
# *published* tarball's UMD for the base, this one installs the *locally-packed*
# tarball's UMD for head. Running both means head and base are each served from a
# `<pkg>.tgz` produced by the same pack pipeline — eliminating the build-asymmetry
# that otherwise inflates head's apparent cost (a locally `nx build`-served bundle
# vs a release-packed published bundle are not like-for-like).
#
# Usage:
#   ./tools/benchmark/swap-local-lib.sh <site-dist-dir>
#
# Example:
#   ./tools/benchmark/swap-local-lib.sh dist/packages/ag-charts-website

set -euo pipefail

site_dir=${1:?Usage: swap-local-lib.sh <site-dist-dir>}

if [[ ! -d "${site_dir}/dev" ]]; then
    echo "ERROR: ${site_dir}/dev not found — is this a built website dist?" >&2
    exit 1
fi

root=$(git rev-parse --show-toplevel)
export NX_DAEMON=false

for pkg in ag-charts-community ag-charts-enterprise ag-charts-locale; do
    echo "[swap-local-lib] Packing local ${pkg} (production)..." >&2
    # Pack the publishable artifact; production config matches the published bundle
    # (sourcemaps off, debug asserts dropped) so head and base differ only in source.
    npx nx pack "${pkg}" --configuration production >&2

    tgz="${root}/dist/packages/${pkg}.tgz"
    if [[ ! -f "${tgz}" ]]; then
        echo "ERROR: expected packed tarball not found at ${tgz}" >&2
        exit 1
    fi

    extract_dir="$(mktemp -d)/${pkg}"
    mkdir -p "${extract_dir}"
    tar -xzf "${tgz}" -C "${extract_dir}"

    if [[ ! -f "${extract_dir}/package/dist/umd/${pkg}.js" ]]; then
        echo "ERROR: local ${pkg} tarball has no dist/umd/${pkg}.js" >&2
        exit 1
    fi

    dest="${site_dir}/dev/${pkg}/dist/umd"
    rm -rf "${dest}"
    mkdir -p "${dest}"
    cp "${extract_dir}/package/dist/umd/"* "${dest}/"
    rm -rf "$(dirname "${extract_dir}")"
    echo "[swap-local-lib] Installed locally-packed ${pkg} into ${dest}" >&2
done

echo "[swap-local-lib] Done: ${site_dir} now serves locally-packed head bundles" >&2
