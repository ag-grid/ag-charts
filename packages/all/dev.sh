#!/bin/bash

set -eu

MODIFIED=$1
CHANGED_FILES=$(echo "${NX_FILE_CHANGES}" | xargs -n 1)

IGNORED_PROJECTS=(
  all
  ag-charts-website
)

if [[ "${BUILD_FWS:-0}" == "1" ]] ; then
  IGNORED_PROJECTS+=(
    ag-charts-angular
    ag-charts-react
    ag-charts-vue
    ag-charts-vue3
  )
fi

if [[ "${IGNORED_PROJECTS[@]}" =~ "${MODIFIED}" ]] ; then
  for filename in ${CHANGED_FILES} ; do
    echo "*** [ignored] [${MODIFIED}] ${filename}"
  done
  exit 0
fi

VALID_FILE_COUNT=0
VALID_FILES=""
IGNORED_FILE_COUNT=0
IGNORED_FILES=""
for filename in ${CHANGED_FILES} ; do
  if [[ ${filename} =~ "/dist/" ]] ; then
    IGNORED_FILE_COUNT=$((IGNORED_FILE_COUNT+1))
    IGNORED_FILES="${IGNORED_FILES} $filename"
  elif [[ ${filename} =~ "/node_modules/" ]] ; then
    IGNORED_FILE_COUNT=$((IGNORED_FILE_COUNT+1))
    IGNORED_FILES="${IGNORED_FILES} $filename"
  else
    VALID_FILE_COUNT=$((VALID_FILE_COUNT+1))
    VALID_FILES="${VALID_FILES} $filename"
  fi
done

echo "*** [project] ${MODIFIED}"
if [[ ${IGNORED_FILE_COUNT} -gt 0 ]] ; then
  echo "*** [ignored] [${MODIFIED}] ${IGNORED_FILES}"
fi

if [[ "${MODIFIED}" == "ag-charts-community" ]] ; then
  nx run-many -p ag-charts-community,ag-charts-enterprise -t build:types,build:package,build:umd,docs-resolved-interfaces -c watch
elif [[ "${MODIFIED}" == "ag-charts-enterprise" ]] ; then
  nx run-many -p ${MODIFIED} -t build:types,build:package,build:umd -c watch
elif [[ "${MODIFIED}" =~ "ag-charts-website-" ]] ; then
  nx run-many -p ${MODIFIED} -t generate -c watch
elif [[ "${VALID_FILE_COUNT}" -gt 0 ]] ; then
  echo "[changed]${VALID_FILES}"
  nx run-many -p ${MODIFIED} -t build
# else
#   echo "[changed] no valid changed files"
fi
