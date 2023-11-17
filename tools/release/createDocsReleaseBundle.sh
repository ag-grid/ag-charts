#!/usr/bin/env bash

if [ "$#" -lt 1 ]
  then
    echo "You must supply a release version number"
    echo "For example: ./tools/release/createDocsReleaseBundle.sh 9.0.0"
    exit 1
fi

RAW_VERSION=$1

ZIP_PREFIX=`date +%Y%m%d`
VERSION=""${RAW_VERSION//./}""

echo "Creating Release Archive"
FILENAME=release_"$ZIP_PREFIX"_v"$VERSION".zip
cd ./dist/packages/ag-charts-website
zip -r ../../../$FILENAME .

