#!/usr/bin/env bash
set -euo pipefail
 
SUMMARY_FILE=./dist/generated-examples/ag-charts-website/docs/benchmarks/_examples/summary/plain/vanilla/contents.json

versions=$(jq -r '.files["_options.json"]' ${SUMMARY_FILE} | jq -r '.myChart1.data | map("origin/" + .name) | join(" ")')

echo "Updating versions: ${versions}"
./tools/benchmark/collect-version-benchmark.sh $@ ${versions}
