#!/usr/bin/env bash

# Usage: validateDistFolders.sh [ENV] (default: prod), run from the repository root once the packages are extracted
# to dist/packages/contents. The TeamCity archive deploy runs this too, so keep its path and arguments stable.

set -Eeuo pipefail

ENV=${1:-prod}
script_dir=$(dirname "$0")
failed=0

# check all expected modules and packages are there
node "$script_dir/validatePackageFolderContents.js" "$ENV" || failed=1

# check each package's dist artefacts against its package.json exports
node "$script_dir/validateDistArtefacts.js" dist/packages/contents || failed=1

exit "$failed"
