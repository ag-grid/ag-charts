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

# Execute a command silently, only showing output if it fails
run_silent() {
    local temp_file
    temp_file=$(mktemp)
    if ! "$@" > "$temp_file" 2>&1; then
        log_error "Command failed: $*"
        cat "$temp_file"
        rm "$temp_file"
        return 1
    fi
    rm "$temp_file"
    return 0
}


export NX_DAEMON=false
pause=false
failed=false
all=false
data_file=packages/ag-charts-website/src/content/docs/benchmarks/_examples/summary/data.ts
repeat_count=1
latest_version=false

while getopts "par:l" opt; do
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
    l)
      latest_version=true
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
git add $0 # Add this script to the git working tree to ensure it is not modified
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
    log_info "Cleaning up"
    run_silent git add ${data_file}
    run_silent git checkout HEAD -- ${included_files[@]}
    run_silent git reset HEAD -- ${included_files[@]}
    run_silent git clean -fd -- ${included_files[@]}
}

prebuild() {
    log_info "Building dependencies & test infrastructure"
    run_silent yarn nx run-many -t build -p ag-charts-core,ag-charts-test
    run_silent yarn nx run-many -t benchmark -c build
}

build() {
    log_info "Building dependencies for $version"

    # Workaround for package not existing at some historical versions
    if [[ ! -e packages/ag-charts-types/src/main.ts || ! -e packages/ag-charts-types/src/main-scene.ts ]] ; then
        mkdir -p packages/ag-charts-types/src
        touch packages/ag-charts-types/src/{main,main-scene}.ts
    fi
    if [[ ! -e packages/ag-charts-core/src/main.ts ]] ; then
        mkdir -p packages/ag-charts-core/src
        touch packages/ag-charts-core/src/main.ts
    fi
    run_silent yarn nx run-many -t build -p ag-charts-core
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
            export AG_LIBRARY_VERSION=$(echo "$1" | sed 's/^origin\///')
            if [[ $latest_version == "true" && $AG_LIBRARY_VERSION == ${versions[0]} ]] ; then
                export AG_BENCHMARK_LATEST_VERSION=1
            else
                export AG_BENCHMARK_LATEST_VERSION=0
            fi

            # Run the benchmark with the current version of the files
            if (
                ! run_silent node \
                    --expose-gc ./node_modules/jest/bin/jest.js \
                    --config packages/ag-charts-community/jest.config.ts \
                    --runInBand \
                    --testPathPattern '.*/benchmarks/.*' || \
                ! run_silent node \
                    --expose-gc ./node_modules/jest/bin/jest.js \
                    --config packages/ag-charts-enterprise/jest.config.ts \
                    --runInBand \
                    --testPathPattern '.*/benchmarks/.*'
            ) ; then
                failed=true
                log_warning "Benchmarks failed, continuing..."
                repeat=false
            fi

            run_silent node "$(dirname $0)/collate-reports.js" --name "$(echo "$version" | sed 's/^origin\///')"
            run_silent git add ${data_file}
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

prebuild
for version in "${versions[@]}"; do
    # Checkout files in the specified input file set (removing any files that have been added since then)
    # Note: Using git checkout instead of git restore to handle case-sensitive filename changes on macOS
    run_silent git checkout "$version" -- ${included_files[@]}
    build ${version}
    # Benchmark
    benchmark ${version}
    # Reset the working tree and staging area to HEAD state
    run_silent git checkout HEAD -- ${included_files[@]}
    run_silent git reset HEAD -- ${included_files[@]}
    # Remove any files that don't exist in HEAD (e.g., files only in old versions)
    run_silent git clean -fd -- ${included_files[@]}
done

if $($failed) ; then 
    log_error "Benchmarks failed, check output."
    exit 1
fi
