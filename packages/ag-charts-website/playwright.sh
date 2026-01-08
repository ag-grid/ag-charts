#!/bin/bash

set -eu

cd $(dirname $0)

function report_flaky_tests {
  local report_file='./reports/ag-charts-website-e2e.json'

  # Find all flaky tests recursively and output annotations.
  jq -c '
  def walk_suites($suite):
    $suite.specs[]?.tests[]? // empty,
    ($suite.suites[]? | walk_suites(.)) // empty;
  .suites[]
  | walk_suites(.)
  | select(.status == "flaky")
  | .results[]
  | select(.status == "failed")
  | .error
  | { file: .location.file, line: .location.line, column: .location.column }
' "$report_file" | while read test; do
    FILE=$(echo "$test" | jq -r '.file')
    LINE=$(echo "$test" | jq -r '.line')
    COLUMN=$(echo "$test" | jq -r '.column')
    
    echo "::warning file=$FILE,line=$LINE,col=$COLUMN::Flaky test detected"
  done
}


export $(cat .env.test:e2e.docker | grep -v '^#' | xargs)
EXTRA_DOCKER_ARGS=
if [ "${CI:-}" != "" ] ; then
    export PUBLIC_SITE_URL=http://172.17.0.1:4601
else
    EXTRA_DOCKER_ARGS="-p 8080:8080 -p 9323:9323"
fi

if [ "$1" == "--host" ] ; then
  shift

  dockerBin=$(which docker)
  if [[ ! -e ${dockerBin} ]] ; then
    echo Docker CLI not found!

    if [[ $(uname) == "Darwin" ]] ; then
      echo
      echo Run the following commands to install and launch Colima for MacOS:
      echo \$ brew install colima docker
      echo \$ colima start
    fi

    exit 1
  fi

  existingContainers=$(docker ps --format "{{.Names}}" | grep "playwright-e2e-" || echo "")
  if [[ $existingContainers != "" ]] ; then
    echo "Stopping existing containers: ${existingContainers}"
    docker stop ${existingContainers}
  fi

  if (pgrep -f "astro dev --port=4601" >/dev/null) ; then
    echo "Astro already running on port 4601, killing."
    pkill -f "astro dev --port=4601"
    sleep 1
  fi

  if [ "${CI:-}" == "" ] ; then
    if (lsof -i :4601 >/dev/null) ; then
      echo "Port 4601 already in use, killing..."
      lsof -i :4601 | awk 'NR>1 {print $2}' | xargs kill -9
      sleep 3
    fi

    if (lsof -i :8080 >/dev/null) ; then
      echo "Port 8080 already in use, killing..."
      lsof -i :8080 | awk 'NR>1 {print $2}' | xargs kill -9
      sleep 3
    fi

    if (lsof -i :4601 >/dev/null || lsof -i :8080 >/dev/null) ; then
      echo "Ports 4601 and 8080 already in use, unable to start Playwright tests."
    fi
  fi

  npx astro dev --port=4601 --host &
  astro_pid=$!
  container_name=playwright-e2e-$$

  function cleanup {
    echo Stopping Astro...
    kill -9 ${astro_pid} 2>/dev/null || true
    echo Stopping Docker...
    docker stop ${container_name} 2>/dev/null || true
  }

  trap cleanup SIGINT SIGTERM ERR EXIT

  cd $(git rev-parse --show-toplevel)
  docker run -d --rm --ipc=host --init \
    -v $(pwd):/data:ro \
    -v $(pwd)/reports:/data/reports \
    -v $(pwd)/packages/ag-charts-website:/data/packages/ag-charts-website \
    -w /data/packages/ag-charts-website \
    -e HOSTNAME=docker-desktop \
    -e CI \
    -e NX_PARALLEL \
    -e NX_BASE \
    -e AG_FORCE_ALL_TESTS \
    -e AG_SKIP_NATIVE_DEP_VERSION_CHECK \
    ${EXTRA_DOCKER_ARGS} \
    --name ${container_name} \
    mcr.microsoft.com/playwright:v1.57.0-jammy \
    /bin/bash -l playwright.sh $@

  docker logs -f ${container_name} &
  
  exit_code=$(docker wait ${container_name})
  echo "Exit code from docker wait: $exit_code"

  if [[ "${CI:-}" != "" ]] ; then
    report_flaky_tests
  fi

  exit $exit_code
fi

echo "Waiting for connection to ${PUBLIC_SITE_URL}..."
npx wait-on ${PUBLIC_SITE_URL}
echo "Connected to ${PUBLIC_SITE_URL}!"
npx playwright $@
