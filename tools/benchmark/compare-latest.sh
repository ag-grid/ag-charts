
#!/bin/bash

set -eu

export NX_DAEMON=false
yarn nx daemon --stop

base_name=${1:-latest}
base=$(git merge-base HEAD origin/${base_name})
head=$(git rev-parse HEAD)
branch=$(git rev-parse --abbrev-ref HEAD)
tools_dir=$(dirname "$0")
root=$(git rev-parse --show-toplevel)

trap 'git checkout ${branch}' INT TERM ERR EXIT

if [[ ${branch} == "${base_name}" ]] ; then
    echo "You are on the ${base_name} branch, please switch to a different branch to run this script."
    exit 1
fi

echo "Running benchmarks on ${branch} against ${base_name}"
echo "${base} (${base_name}) vs ${head} (${branch})"

git checkout ${base}
yarn nx run-many -t benchmark --parallel 1 --exclude all
yarn nx run-many -t benchmark --parallel 1 --exclude all
node ${tools_dir}/collate-reports.js "${base_name}-${base}"

git checkout ${head}
yarn nx run-many -t benchmark --parallel 1 --exclude all
yarn nx run-many -t benchmark --parallel 1 --exclude all
node ${tools_dir}/collate-reports.js "${branch}-${head}"

node ${tools_dir}/compare-versions.js --report-only --base ${base_name}-${base} --compare ${branch}-${head} >${root}/reports/benchmark.log
cat ${root}/reports/benchmark.log
echo "Benchmark results saved to ${root}/reports/benchmark.log"
