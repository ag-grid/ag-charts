
#!/bin/bash

set -eu

export NX_DAEMON=false
yarn nx daemon --stop

format=table

while getopts "j" opt; do
  case $opt in
    j)
      format=json
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

base_name=${1:-latest}
if [[ ${base_name} =~ ^b[0-9]+(\.[0-9]+){2}$ ]] ; then
    base="${base_name}"
else
    base=$(git merge-base HEAD ${base_name} || echo "${base_name}")
fi
head=$(git rev-parse HEAD)
branch=$(git rev-parse --abbrev-ref HEAD)
tools_dir=$(dirname "$0")
root=$(git rev-parse --show-toplevel)

if [[ ${branch} == "${base_name}" ]] ; then
    echo "You are on the ${base_name} branch, please switch to a different branch to run this script."
    exit 1
fi

function logStarBox() {
    local message=$1
    local max_length=0

    # Find max line length
    while IFS= read -r line; do
        (( ${#line} > max_length )) && max_length=${#line}
    done <<< "$message"

    # Create border of stars
    local border=$(printf '%*s' "$((max_length + 8))" | tr ' ' '*')
    
    # Print top border
    echo "$border"

    # Print message lines with stars
    while IFS= read -r line; do
        printf "*** %-${max_length}s ***\n" "$line"
    done <<< "$message"

    # Print bottom border
    echo "$border"
}

echo "Running benchmarks on ${branch} against ${base_name}"
echo "${base} (${base_name}) vs ${head} (${branch})"

./tools/benchmark/collect-version-benchmark.sh -l ${head} ${base} || (if [[ $AG_BENCHMARK_SOFT_FAIL == "true" ]] ; then echo "Failed to run benchmarks, continuing..." ; else exit 1 ; fi)

output=${root}/reports/benchmark.log
if [[ ${format} == "json" ]] ; then
    output=${root}/reports/benchmark.json
fi
if [[ ${base#origin/} == ${base_name#origin/} && ${format} != "json" ]] ; then
    logStarBox "No merge-base found, comparing '${branch}' against '${base_name}' branch directly" >${output}
elif [[ -f ${output} ]] ; then
    rm ${output}
fi
node ${tools_dir}/compare-versions.js \
    --report-only \
    --base ${base#origin/} \
    --compare ${head} \
    --format ${format} \
    >>${output}
cat ${output}
echo "Benchmark results saved to ${output}"
