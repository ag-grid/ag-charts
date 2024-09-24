#!/bin/bash

set -eu

cd $(dirname $0)

export $(cat .env.test:e2e.docker | grep -v '^#' | xargs)
if [ "${CI:-}" != "" ] ; then
    export PUBLIC_SITE_URL=http://172.17.0.1:4601
fi

if [ "$1" == "--host" ] ; then
  shift

  npx astro dev --port=4601 --host &

  cd $(git rev-parse --show-toplevel)
  docker run -t --rm --ipc=host --network=host \
    -v $(pwd):/data:ro \
    -v $(pwd)/reports:/data/reports \
    -v $(pwd)/packages/ag-charts-website/e2e/:/data/packages/ag-charts-website/e2e/ \
    -e CI \
    -e NX_PARALLEL \
    -e NX_BASE \
    -e AG_FORCE_ALL_TESTS \
    -e AG_SKIP_NATIVE_DEP_VERSION_CHECK \
    mcr.microsoft.com/playwright:v1.47.2-noble \
    /bin/bash -l /data/packages/ag-charts-website/playwright.sh $@

  exit $?
fi

echo "Waiting for connection to ${PUBLIC_SITE_URL}..."
npx wait-on ${PUBLIC_SITE_URL}
echo "Connected to ${PUBLIC_SITE_URL}!"
npx playwright $@