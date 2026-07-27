#!/bin/bash

set -eu

cd $(dirname $0)

astro_port=4601
astro_pid_file="${RUNNER_TEMP:-/tmp}/ag-charts-astro-dev.pid"
astro_log_file="${RUNNER_TEMP:-/tmp}/ag-charts-astro-dev.log"

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

# Astro compiles pages on first request, so the index costs about a second the first
# time it is hit. Requesting it in the background overlaps that compile with the test
# container's start-up instead of paying it inside the container's readiness wait.
function warm_astro_index {
  (
    trap - EXIT # Inherited from the caller; this subshell must not run its cleanup.
    for _ in $(seq 1 60) ; do
      if curl -fs -o /dev/null --max-time 30 "http://localhost:${astro_port}/" ; then
        break
      fi
      sleep 1
    done
  ) >/dev/null 2>&1 </dev/null &
}

# Spawns the Astro dev server, recording it in ${astro_pid}. Pass --detached to send
# its output to ${astro_log_file} so the calling shell (a CI step) can exit at once.
#
# The binary is invoked directly rather than through `npx`, because with `npx` the
# recorded PID is the wrapper and the real server survives cleanup — where it holds
# the CI step's stdout open. Job control additionally puts the server in its own
# process group, so cleanup can signal the whole tree.
function start_astro {
  # Astro is a declared dependency of this workspace, so yarn always links it here.
  if [ ! -e ./node_modules/.bin/astro ] ; then
    echo "Astro not found at ./node_modules/.bin/astro — has node_modules been installed?"
    exit 1
  fi

  set -m
  if [ "${1:-}" == "--detached" ] ; then
    nohup ./node_modules/.bin/astro dev --port=${astro_port} --host \
      > "${astro_log_file}" 2>&1 < /dev/null &
  else
    ./node_modules/.bin/astro dev --port=${astro_port} --host &
  fi
  astro_pid=$!
  set +m

  warm_astro_index
}

function stop_astro {
  # Negative PID targets the process group, so any child goes with the server.
  kill -9 -- "-${astro_pid}" 2>/dev/null || kill -9 "${astro_pid}" 2>/dev/null || true
}

export $(cat .env.test:e2e.docker | grep -v '^#' | xargs)
EXTRA_DOCKER_ARGS=
if [ "${CI:-}" != "" ] ; then
    export PUBLIC_SITE_URL=http://172.17.0.1:4601
else
    EXTRA_DOCKER_ARGS="-p 8080:8080 -p 9323:9323"
fi

# Pre-start mode, used by CI so the dev server's boot and first-request compile
# overlap earlier job steps. The subsequent --host run adopts the server via
# ${astro_pid_file} rather than spawning its own.
if [ "${1:-}" == "--start-dev-server" ] ; then
  start_astro --detached
  echo "${astro_pid}" > "${astro_pid_file}"
  echo "Astro dev server starting in the background (pid ${astro_pid}, log ${astro_log_file})."
  exit 0
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

  # Matching the command line, not just liveness: a stale PID file left by an
  # interrupted run would otherwise adopt whatever process inherited that PID.
  reuse_astro=no
  if [ -f "${astro_pid_file}" ] \
      && ps -o command= -p "$(cat "${astro_pid_file}")" 2>/dev/null \
      | grep -q "astro dev --port=${astro_port}" ; then
    astro_pid=$(cat "${astro_pid_file}")
    reuse_astro=yes
    echo "Reusing pre-started Astro dev server (pid ${astro_pid})."
  fi

  if [ "${reuse_astro}" == "no" ] ; then
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

    start_astro
  fi

  container_name=playwright-e2e-$$

  function cleanup {
    echo Stopping Astro...
    stop_astro
    rm -f "${astro_pid_file}"
    echo Stopping Docker...
    docker stop ${container_name} 2>/dev/null || true
    # The log follower inherits this step's stdout, so leaving it running holds the
    # step open after the tests have finished.
    if [ -n "${logs_pid:-}" ] ; then
      kill "${logs_pid}" 2>/dev/null || true
    fi
  }

  trap cleanup SIGINT SIGTERM ERR EXIT

  cd $(git rev-parse --show-toplevel)

  playwright_image=mcr.microsoft.com/playwright:v1.60.0-jammy
  if ! docker image inspect ${playwright_image} >/dev/null 2>&1 ; then
    pull_attempts=4
    for attempt in $(seq 1 ${pull_attempts}) ; do
      if docker pull ${playwright_image} ; then
        break
      fi
      if [[ ${attempt} -eq ${pull_attempts} ]] ; then
        echo "Failed to pull ${playwright_image} after ${pull_attempts} attempts."
        exit 1
      fi
      backoff=$((attempt * 15))
      jitter=$((RANDOM % 10))
      echo "Pull attempt ${attempt} failed, retrying in $((backoff + jitter))s..."
      sleep $((backoff + jitter))
    done
  fi

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
    -e AG_SCENE_SNAPSHOTS \
    -e AG_SKIP_NATIVE_DEP_VERSION_CHECK \
    ${EXTRA_DOCKER_ARGS} \
    --name ${container_name} \
    ${playwright_image} \
    /bin/bash -l playwright.sh $@

  docker logs -f ${container_name} &
  logs_pid=$!

  exit_code=$(docker wait ${container_name})
  echo "Exit code from docker wait: $exit_code"

  if [[ "${CI:-}" != "" ]] ; then
    report_flaky_tests
  fi

  exit $exit_code
fi

echo "Waiting for connection to ${PUBLIC_SITE_URL}..."
# A plain poll rather than `npx wait-on`: npx costs over a second to start in the
# container, and wait-on fires overlapping HEAD requests every 250ms — each of which
# Astro compiles separately when the index is cold.
for attempt in $(seq 1 600) ; do
  if curl -fs -o /dev/null --max-time 30 "${PUBLIC_SITE_URL}" ; then
    break
  fi
  if [[ ${attempt} -eq 600 ]] ; then
    echo "Timed out waiting for ${PUBLIC_SITE_URL}."
    exit 1
  fi
  if [[ $((attempt % 40)) -eq 0 ]] ; then
    echo "  still waiting (attempt ${attempt})..."
  fi
  sleep 0.25
done
echo "Connected to ${PUBLIC_SITE_URL}!"
npx playwright $@
