#!/usr/bin/env bash

echo "Cleaning current charts staging"
rm -rf @WWW_ROOT_DIR@/html/*
mv @FILENAME@ @WWW_ROOT_DIR@/html/

echo "Unzipping new charts staging"
unzip -q @WWW_ROOT_DIR@/html/@FILENAME@ -d @WWW_ROOT_DIR@/html/
