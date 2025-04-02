#!/bin/bash
set -euo pipefail

if [[ -f '.env.local' ]]; then
    source .env.local
fi

repo=${1:-""}
if [[ -z "${repo}" ]]; then
    echo "Usage: $0 <repo>"
    echo "Example: $0 ag-charts"
    exit 1
fi

if [[ "${RUNNER_TOKEN:-}" == "" ]]; then
    echo "RUNNER_TOKEN is not set. Please set it in .env.local or export it as an environment variable."
    echo "Get a new runner token from: https://github.com/ag-grid/${repo}/settings/actions/runners/new?arch=arm64&os=linux"
    exit 1
fi

workdir=$(mktemp -d)
echo "Using workdir: ${workdir}"

trap "docker stop github-runner gha-cache-server && rm -rf ${workdir}" EXIT

docker run -d --rm --name gha-cache-server \
    -e API_BASE_URL="http://localhost:3000" \
    -p 3000:3000 \
    -v cache-data:/app/.data \
    ghcr.io/falcondev-oss/github-actions-cache-server:latest

docker run -d --rm --name github-runner \
  -e REPO_URL="https://github.com/ag-grid/${repo}" \
  -e RUNNER_NAME="$(hostname)" \
  -e RUNNER_TOKEN="${RUNNER_TOKEN}" \
  -e RUNNER_SCOPE="repo" \
  -e RUNNER_GROUP="default" \
  -e ACTIONS_RESULTS_URL="http://localhost:3000" \
  -e RUNNER_WORKDIR="/tmp/github-runner-your-repo" \
  -e LABELS="ubuntu-debug,ubuntu-debug-${RUNNER_NAME}" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ${workdir}:/tmp/github-runner-your-repo \
  myoung34/github-runner:latest

sleep 2
docker exec -it -w /tmp/github-runner-your-repo github-runner bash -il
