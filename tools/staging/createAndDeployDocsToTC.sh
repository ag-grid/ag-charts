#!/usr/bin/env bash

ZIP_PREFIX=`date +%Y%m%d`

echo "Creating Staging Archive"
FILENAME=charts-staging_"$ZIP_PREFIX"_v"$VERSION".zip
cd ./dist/packages/ag-charts-website
zip -r ../../../$FILENAME .

rm -rf /var/www/charts/*
mv ../../../$FILENAME /var/www/charts/
unzip -q /var/www/charts/$FILENAME -d /var/www/charts/

