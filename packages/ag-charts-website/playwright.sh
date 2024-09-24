#!/bin/bash

set -eu

cd $(dirname $0)
export $(cat .env.test:e2e.docker | grep -v '^#' | xargs)

if [ "$1" == "--host" ] ; then
  shift

  npx astro dev --port=4601 --host &

  cd $(git rev-parse --show-toplevel)
  docker run -t --rm --ipc=host --network=host \
    -v $(pwd):/data:ro \
    -v $(pwd)/reports:/data/reports \
    -v $(pwd)/packages/ag-charts-website/e2e/:/data/packages/ag-charts-website/e2e/ \
    mcr.microsoft.com/playwright:v1.47.2-noble \
    /bin/bash -l /data/packages/ag-charts-website/playwright.sh $@

  exit $?
fi

npm i -g @playwright/test@1.47.2 wait-on@8.0.1
npx wait-on ${PUBLIC_SITE_URL}
npx playwright $@
