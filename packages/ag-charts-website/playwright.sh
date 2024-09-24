#!/bin/sh

set -eu

cd $(dirname $0)
export $(cat .env.test:e2e.docker | grep -v '^#' | xargs)

if [ "$1" == "--host" ] ; then
  shift

  npx astro dev --port=4601 --host &

  cd ../..
  docker run -it --rm --ipc=host --network=host \
    -v $(pwd):/data:ro \
    -v $(pwd)/reports:/data/reports \
    -v $(pwd)/packages/ag-charts-website/e2e/:/data/packages/ag-charts-website/e2e/ \
    mcr.microsoft.com/playwright:v1.47.2-noble-arm64 \
    /bin/bash -il /data/packages/ag-charts-website/playwright.sh $@

  exit $?
fi

npm i -g @playwright/test@1.47.2 wait-on@8.0.1
npx wait-on ${PUBLIC_SITE_URL}
npx playwright $@
