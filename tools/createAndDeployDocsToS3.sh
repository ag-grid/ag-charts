#!/usr/bin/env bash

if [ "$#" -lt 1 ]
  then
    echo "You must supply a jira number"
    exit 1
fi

TARGET_DIRECTORY=$1

cd dist/packages/ag-charts-website

aws s3 cp dist s3://testing.ag-grid.com/$TARGET_DIRECTORY --recursive

