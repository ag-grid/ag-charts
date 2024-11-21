#!/usr/bin/env bash
set -euo pipefail

pause=false
failed=false

while getopts "p" opt; do
  case $opt in
    p)
      pause=true
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done
shift $((OPTIND - 1))

# Read an array of versions to benchmark from the argument list, exiting with an error if no versions were provided
versions=("$@")
if [[ ${#versions[@]} -eq 0 ]]; then
    echo "Usage: $0 [-p] <version> [<version> ...]"
    echo "Example: $0 origin/latest origin/b9.2.0"
    echo
    echo "Options:"
    echo " -p - pause after each benchmark run"
    exit 1
fi

# Files to check out for each version
included_files=(
    "libraries/ag-charts-test/src"
    "packages/ag-charts-types/src"
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

benchmark() {
    # Remove intermediate test results
    if [[ -d ./reports ]] ; then 
        rm -rf ./reports
    fi

    repeat=true
    while $($repeat) ; do
        # Run the benchmark with the current version of the files
        if (
            AG_LIBRARY_VERSION=$(echo "$1" | sed 's/^origin\///') \
            node \
                --expose-gc ./node_modules/jest/bin/jest.js \
                --config packages/ag-charts-community/jest.config.ts \
                --runInBand \
                --testPathPattern '.*/benchmarks/.*'
        ) ; then
            node "$(dirname $0)/collate-reports.js" "$(echo "$version" | sed 's/^origin\///')"
        else
            failed=true
            echo "Benchmarks failed, continuing..."
        fi
        repeat=false

        if $($pause) ; then
            read -p "Paused at ${version}, continue? (Y/n/[r]epeat) " confirm
            if [[ "${confirm}" =~ ^[Rr]$ ]] ; then
                repeat=true
            elif [[ "${confirm}" =~ ^[Nn]$ ]] ; then
                exit 1
            fi
        fi
    done
}

# Reset the working tree state if an error is encountered
trap 'git restore --source HEAD -- ${included_files[@]} && git clean -fd' ERR EXIT

for version in "${versions[@]}"; do
    echo "Benchmarking $version"
    # Checkout files in the specified input file set (removing any files that have been added since then)
    git restore --source "$version" -- ${included_files[@]}
    # Checkout any excluded files from the current version
    git checkout HEAD -- ${excluded_files[@]}
    benchmark ${version}
    # Remove any untracked files created during this benchmark run
    git clean -fd
    # Reset the working tree state
    git restore --source HEAD -- ${included_files[@]}
done

if $($failed) ; then 
    echo "Benchmarks failed, check output."
    exit 1
fi
