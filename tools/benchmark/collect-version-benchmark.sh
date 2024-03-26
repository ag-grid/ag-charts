#!/usr/bin/env bash
set -euo pipefail

# Read an array of versions to benchmark from the argument list, exiting with an error if no versions were provided
versions=("$@")
if [[ ${#versions[@]} -eq 0 ]]; then
    echo "Usage: $0 <version> [<version> ...]"
    echo "Example: $0 origin/latest origin/b9.2.0"
    exit 1
fi

# Benchmark command
command="./node_modules/.bin/nx run-many --skip-nx-cache --target=benchmark --parallel=false -- --updateSnapshot"

# Files to check out for each version
included_files=(
    "packages/ag-charts-community/src"
    "packages/ag-charts-community-examples/src"
    "packages/ag-charts-enterprise/src"
)
# Files to retain from the current state of the repository
excluded_files=("packages/ag-charts-community/src/util/test/mockCanvas.ts")

# Bail out if there are uncommitted changes in the git working tree
if ! git diff --quiet; then
    echo "There are uncommitted changes in the working tree. Please commit or stash them before running this script."
    exit 1
fi

# Bail out if there are untracked files in the git working tree
if [[ -n $(git ls-files --others --exclude-standard) ]]; then
    echo "There are untracked files in the working tree. Please commit or stash them before running this script."
    exit 1
fi

# Reset the working tree state if an error is encountered
trap 'git restore --source HEAD -- ${included_files[@]} && git clean -fd' ERR

for version in "${versions[@]}"; do
    echo "Benchmarking $version"
    # Checkout files in the specified input file set (removing any files that have been added since then)
    git restore --source "$version" -- ${included_files[@]}
    # Checkout any excluded files from the current version
    git checkout HEAD -- ${excluded_files[@]}
    # Run the benchmark with the current version of the files
    $command
    # Update the benchmark results for the current version (stripping any "origin/" prefix)
    node "$(dirname $0)/collate-reports.js" "$(echo "$version" | sed 's/^origin\///')"
    # Remove any untracked files created during this benchmark run
    git clean -fd
    # Reset the working tree state
    git restore --source HEAD -- ${included_files[@]}
done
