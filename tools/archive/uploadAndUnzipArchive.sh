#!/bin/bash

set -euo pipefail

if [ "$#" -lt 2 ]
  then
    echo "You must supply a release version and host"
    echo "For example: ./scripts/release/uploadAndUnzipArchive.sh 9.0.0"
    exit 1
fi

function checkFileExists {
    file=$1
    if ! [[ -f "$file" ]]
    then
        echo "File [$file] doesn't exist - exiting script.";
        exit 1;
    fi
}

VERSION=$1
CURRENT_HOST=$2

export SSH_LOCATION=${SSH_FILE:-}

# a few safety checks
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
then
    echo "Version isn't in the expected format. Valid format is: Number.Number.number. For example 19.1.2";
    exit 1;
fi

if [ -z "$SSH_LOCATION" ]
then
      echo "\$SSH_LOCATION is not set"
      exit 1;
fi

FILE_VERSION=""${VERSION//./}""
ARCHIVE="charts-release_`date +%Y%m%d`_v$FILE_VERSION.zip"

# delete dir if it exists
echo "ssh -i $SSH_LOCATION -p $SSH_PORT $CURRENT_HOST \"if [[ -d $CHARTS_ROOT_DIR/archive/$VERSION ]]; then rm -r $CHARTS_ROOT_DIR/archive/$VERSION; fi\""
ssh -i $SSH_LOCATION -p $SSH_PORT $CURRENT_HOST "if [[ -d $CHARTS_ROOT_DIR/archive/$VERSION ]]; then rm -r $CHARTS_ROOT_DIR/archive/$VERSION; fi"

# upload file
echo "ssh -i $SSH_LOCATION -p $SSH_PORT $CURRENT_HOST \"mkdir -p $CHARTS_ROOT_DIR/archive/$VERSION\""
ssh -i $SSH_LOCATION -p $SSH_PORT $CURRENT_HOST "mkdir -p $CHARTS_ROOT_DIR/archive/$VERSION"
echo "scp -i $SSH_LOCATION -P $SSH_PORT $ARCHIVE $CURRENT_HOST:$CHARTS_ROOT_DIR/archive/$VERSION/"
scp -i $SSH_LOCATION -P $SSH_PORT $ARCHIVE $CURRENT_HOST:$CHARTS_ROOT_DIR/archive/$VERSION/

# unzip archive
echo "ssh -i $SSH_LOCATION -p $SSH_PORT $CURRENT_HOST \"cd $CHARTS_ROOT_DIR/archive/$VERSION && tar -m -xf $ARCHIVE\""
ssh -i $SSH_LOCATION -p $SSH_PORT $CURRENT_HOST "cd $CHARTS_ROOT_DIR/archive/$VERSION && unzip $ARCHIVE"

#update folder permissions (default is 777 - change to 755)
echo "ssh -i $SSH_LOCATION -p $SSH_PORT $CURRENT_HOST \"chmod -R 755 $CHARTS_ROOT_DIR/archive/$VERSION\""
ssh -i $SSH_LOCATION -p $SSH_PORT $CURRENT_HOST "chmod -R 755 $CHARTS_ROOT_DIR/archive/$VERSION"



