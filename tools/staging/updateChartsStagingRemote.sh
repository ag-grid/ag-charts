#!/usr/bin/env bash

set -euo pipefail

STAGING_DIR="@WWW_ROOT_DIR@/charts"
ZIP_PATH="@WWW_ROOT_DIR@/@FILENAME@"
STAGING_NEW="${STAGING_DIR}.new.$$"
STAGING_OLD="${STAGING_DIR}.old"

echo "Validating uploaded archive at ${ZIP_PATH}"
if [ ! -f "${ZIP_PATH}" ]; then
    echo "ERROR: ${ZIP_PATH} not found"
    exit 1
fi
unzip -tq "${ZIP_PATH}"

echo "Extracting to ${STAGING_NEW}"
mkdir -p "${STAGING_NEW}"
unzip -q "${ZIP_PATH}" -d "${STAGING_NEW}"

echo "Swapping into ${STAGING_DIR}"
rm -rf "${STAGING_OLD}"
if [ -d "${STAGING_DIR}" ]; then
    mv "${STAGING_DIR}" "${STAGING_OLD}"
fi
mv "${STAGING_NEW}" "${STAGING_DIR}"

echo "Cleaning up"
rm -rf "${STAGING_OLD}" "${ZIP_PATH}"
