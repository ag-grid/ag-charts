#!/usr/bin/env bash

echo "Cleaning current charts staging"
rm -rf @WWW_ROOT_DIR@/charts/*
mv @FILENAME@ @WWW_ROOT_DIR@/charts/

echo "Unzipping new charts staging"
unzip -q @WWW_ROOT_DIR@/charts/@FILENAME@ -d @WWW_ROOT_DIR@/charts/
