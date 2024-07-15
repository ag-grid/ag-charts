#!/bin/bash

set -eu

PACKAGE_ROOT=$1
INPUT_TAR="dist/$PACKAGE_ROOT.tgz"
OUTPUT_DIR="dist/${PACKAGE_ROOT/packages/packages/contents}"

echo "Extracting package ${PACKAGE_ROOT}"
echo "  ${INPUT_TAR} => ${OUTPUT_DIR}"

rm -rf ${OUTPUT_DIR} && \
mkdir -p ${OUTPUT_DIR} && \
tar -xzf ${INPUT_TAR} -C ${OUTPUT_DIR}
