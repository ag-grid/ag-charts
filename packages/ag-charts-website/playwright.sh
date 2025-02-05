#!/bin/bash

set -eu

cd $(dirname $0)

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
      echo Run the following commands to install and launch Docker Desktop for MacOS:
      echo \$ brew install --cask docker
      echo \$ open /Applications/Docker.app
    fi

    exit 1
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
  docker run -d --rm --ipc=host \
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
    mcr.microsoft.com/playwright:v1.45.0-jammy \
    /bin/bash -l playwright.sh $@

  docker logs -f ${container_name} &
  
  exit_code=$(docker wait ${container_name})
  echo "Exit code from docker wait: $exit_code"
  exit $exit_code
fi

echo "Waiting for connection to ${PUBLIC_SITE_URL}..."
npx wait-on ${PUBLIC_SITE_URL}
echo "Connected to ${PUBLIC_SITE_URL}!"
npx playwright $@
