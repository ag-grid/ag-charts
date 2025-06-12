#!/usr/bin/env bash
set -euo pipefail

# Print a message in green
log_success() {
    echo -e "\033[32m$1\033[0m"
}

# Print a message in yellow
log_warning() {
    echo -e "\033[33m$1\033[0m" 
}

# Print a message in red
log_error() {
    echo -e "\033[31m$1\033[0m"
}

# Print a message in blue
log_info() {
    echo -e "\033[34m$1\033[0m"
}

# Print a divider line
log_divider() {
    echo "----------------------------------------"
}


pause=false
failed=false
all=false
data_file=packages/ag-charts-website/src/content/docs/benchmarks/_examples/summary/data.ts
repeat_count=1

while getopts "par:" opt; do
  case $opt in
    p)
      pause=true
      ;;
    a)
      all=true
      ;;
    r)
      repeat_count=$OPTARG
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
if $all ; then
    readarray -t versions < <(
        npx ts-node <<EOF
            let { getData } = require('./${data_file}');
            const versions = getData()
                .map((r: any) => 'origin/' + r.name)
                .filter((r: string) => r !== 'origin/latest')
                .join('\n');
            console.log(versions);
EOF
    )
    echo "Running benchmarks for all versions: ${versions[@]}"
elif [[ ${#versions[@]} -eq 0 ]]; then
    echo "Usage: $0 [-p] <version> [<version> ...]"
    echo "Example: $0 origin/latest origin/b9.2.0"
    echo
    echo "Options:"
    echo " -p - pause after each benchmark run"
    exit 1
fi

# Files to check out for each version
included_files=(
    "packages/ag-charts-types/src"
    "packages/ag-charts-locale/src"
    "packages/ag-charts-core/src"
    "packages/ag-charts-community/src"
    "packages/ag-charts-community-examples/src"
    "packages/ag-charts-enterprise/src"
)

# Bail out if there are uncommitted changes in the git working tree
if ! git diff --quiet; then
    log_error "There are uncommitted changes in the working tree. Please commit or stash them before running this script."
    exit 1
fi

# Bail out if there are untracked files in the git working tree
if [[ -n $(git ls-files --others --exclude-standard) ]]; then
    log_error "There are untracked files in the working tree. Please commit or stash them before running this script."
    exit 1
fi

cleanup() {
    git add ${data_file}
    git restore --source HEAD -- ${included_files[@]}
    git clean -fd
}

build() {
    NX_DAEMON=false nx run-many -t build -p ag-charts-core,ag-charts-test
}

benchmark() {
    # Remove intermediate test results
    if [[ -d ./reports ]] ; then 
        rm -rf ./reports
    fi


    repeat=true
    while $($repeat) ; do
        count=0
        while $($repeat) && [[ $count -lt $repeat_count ]] ; do
            count=$((count + 1))

            log_info "Benchmarking $version ($count of $repeat_count)"

            # Run the benchmark with the current version of the files
            if (
                AG_LIBRARY_VERSION=$(echo "$1" | sed 's/^origin\///') \
                node \
                    --expose-gc ./node_modules/jest/bin/jest.js \
                    --config packages/ag-charts-community/jest.config.ts \
                    --runInBand \
                    --testPathPattern '.*/benchmarks/.*'
                node \
                    --expose-gc ./node_modules/jest/bin/jest.js \
                    --config packages/ag-charts-enterprise/jest.config.ts \
                    --runInBand \
                    --testPathPattern '.*/benchmarks/.*'
            ) ; then
                node "$(dirname $0)/collate-reports.js" --name "$(echo "$version" | sed 's/^origin\///')"
                git add ${data_file}
            else
                failed=true
                echo "Benchmarks failed, continuing..."
                repeat=false
            fi
        done

        repeat=false
        if $($pause) ; then
            read -p "Paused at ${version}, continue? (Y/n/[r]epeat) " confirm
            if [[ "${confirm}" =~ ^[Rr]$ ]] ; then
                repeat=true
            elif [[ "${confirm}" =~ ^[Nn]$ ]] ; then
                cleanup
                exit 1
            fi
        fi
    done
}

# Reset the working tree state if an error is encountered
trap 'cleanup' ERR EXIT

for version in "${versions[@]}"; do
    # Checkout files in the specified input file set (removing any files that have been added since then)
    git restore --source "$version" -- ${included_files[@]}
    # Build & benchmark
    build
    benchmark ${version}
    # Remove any untracked files created during this benchmark run
    git clean -fd
    # Reset the working tree state
    git restore --source HEAD -- ${included_files[@]}
done

if $($failed) ; then 
    log_error "Benchmarks failed, check output."
    exit 1
fi
