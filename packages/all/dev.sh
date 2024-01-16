#!/bin/bash

MODIFIED=$1

if [[ "${MODIFIED}" == "ag-charts-community" ]] ; then
  nx run-many -p ag-charts-community,ag-charts-enterprise -t build:types,build:package,build:umd,docs-resolved-interfaces -c watch
elif [[ "${MODIFIED}" == "ag-charts-enterprise" ]] ; then
  nx run-many -p ${MODIFIED} -t build:types,build:package,build:umd -c watch
else
  echo $NX_FILE_CHANGES
  nx run-many -p ${MODIFIED} -t build
fi
