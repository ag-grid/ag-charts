#!/bin/bash

# Usage:
# ./tools/tidy-nx-cache.sh

set -eu

find .nx/cache -name "ag-charts-website" | grep packages | while read filename ; do
    cacheHash=$(echo "${filename}" | awk -F '/' '{ print $3 }')
    size=$(du -sh .nx/cache/${cacheHash} | awk '{ print $1 }')
    rm -rf .nx/cache/${cacheHash}{,.commit}
    echo "Removed cache entry of size ${size} with hash ${cacheHash}"
done
