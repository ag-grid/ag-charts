
#!/bin/bash

set -eu

export NX_DAEMON=false
yarn nx daemon --stop

base=$(git merge-base HEAD latest)
head=$(git rev-parse HEAD)
branch=$(git rev-parse --abbrev-ref HEAD)
tools_dir=$(dirname "$0")
root=$(git rev-parse --show-toplevel)

trap 'git checkout ${branch}' INT TERM ERR EXIT

if [[ ${branch} == "latest" ]] ; then
    echo "You are on the latest branch, please switch to a different branch to run this script."
    exit 1
fi

echo "Running benchmarks on ${branch} against latest"
echo "${base} (latest) vs ${head} (${branch})"

git checkout ${base}
yarn nx run-many -t benchmark --parallel 1 --exclude all
yarn nx run-many -t benchmark --parallel 1 --exclude all
node ${tools_dir}/collate-reports.js "latest-${base}"

git checkout ${head}
yarn nx run-many -t benchmark --parallel 1 --exclude all
yarn nx run-many -t benchmark --parallel 1 --exclude all
node ${tools_dir}/collate-reports.js "${branch}-${head}"

node ${tools_dir}/compare-versions.js --report-only --base latest-${base} --compare ${branch}-${head} >${root}/reports/benchmark.log
cat ${root}/reports/benchmark.log
echo "Benchmark results saved to ${root}/reports/benchmark.log"
