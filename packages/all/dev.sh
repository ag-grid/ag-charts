#!/bin/bash

MODIFIED=$1

if [[ "${MODIFIED}" == "ag-charts-community" ]] ; then
  nx build ag-charts-community:build:package,ag-charts-community:build:umd,ag-charts-community:docs-resolved-interfaces,ag-charts-enterprise:build:package,ag-charts-enterprise:build:umd --configuration watch
else
  nx build ${MODIFIED}:build:package,${MODIFIED}:build:umd --configuration watch
fi
