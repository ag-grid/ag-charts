#!/usr/bin/env bash

if [ "$#" -lt 1 ]
  then
    echo "You must supply a release version"
    echo "For example: ./tools/release/deployAgGridRelease.sh 9.0.0"
    exit 1
fi

SSH_LOCATION=$SSH_FILE

if [ -z "$SSH_LOCATION" ]
then
      echo "\$SSH_LOCATION is not set"
      exit 1;
fi

function checkFileExists {
    file=$1
    if ! [[ -f "$file" ]]
    then
        echo "File [$file] doesn't exist - exiting script.";
        exit 1;
    fi
}

checkFileExists $SSH_LOCATION

VERSION=$1

# replace tokens in prepareNewChartsDeploymentRemote.sh with env variables - we'll transfer the newly tokenised file to prod
sed "s#\@CHARTS_HTML_FOLDER_NAME\@#$CHARTS_HTML_FOLDER_NAME#g" ./tools/release/prepareNewChartsDeploymentRemote.sh | sed "s#\@WORKING_DIR_ROOT\@#$WORKING_DIR_ROOT#g" > /tmp/prepareNewChartsDeploymentRemote.sh

scp -i $SSH_LOCATION -P $SSH_PORT "/tmp/prepareNewChartsDeploymentRemote.sh" $HOST:$WORKING_DIR_ROOT/prepareNewChartsDeploymentRemote.sh
ssh -i $SSH_LOCATION -p $SSH_PORT $HOST "chmod +x $WORKING_DIR_ROOT/prepareNewChartsDeploymentRemote.sh"

# backup the old html folder, unzip the new release and update permissions etc
# we do this via a remote script as there are many steps and doing so one by one remotely times out occasionally
#ssh -i $SSH_LOCATION -p $SSH_PORT $HOST "cd $WORKING_DIR_ROOT && ./prepareNewChartsDeploymentRemote.sh $VERSION"

