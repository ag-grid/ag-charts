#!/usr/bin/env bash

##########################################################################################
## This script is meant to live on ag-grid.com and be invoked by someone doing a deployment
## It's in a separate script as occasionally multiple "ssh -i" from a devs machine would
## result in some of the commands being rejected. Extracting these multiple commands into one
## should alleviate that
##########################################################################################

if [ "$#" -lt 1 ]
  then
    echo "You must supply a release version"
    echo "For example: deployAgGridReleaseRemote.sh 9.0.0"
    exit 1
fi

RAW_VERSION=$1
VERSION=""${RAW_VERSION//./}""
TIMESTAMP=`date +%Y%m%d`
FILENAME=charts-release_"$TIMESTAMP"_v"$VERSION".zip

PUBLIC_HTML_FOLDER="@CHARTS_HTML_FOLDER_NAME@"
WORKING_DIR_ROOT="@WORKING_DIR_ROOT@"

cd $WORKING_DIR_ROOT

# delete old temp folder if it exists
rm -rf charts_tmp > /dev/null

# create a new folder - this will become $CHARTS_HTML_FOLDER_NAME
mkdir charts_tmp

# unzip release
echo "Unzipping release archive"
mv ./$FILENAME charts_tmp/
cd charts_tmp/ && unzip $FILENAME
cd ..

# copy non versioned files & directories over
echo "Copying non-versioned directories"
cp -R ./$PUBLIC_HTML_FOLDER/robots.txt charts_tmp/

#update folder permissions (default is 777 - change to 755)
echo "Updating folder permissions"
find charts_tmp -maxdepth 1 -not \( -path charts_tmp/archive -prune \) -type d -exec chmod -R 755 {} \;
