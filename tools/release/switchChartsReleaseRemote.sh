#!/bin/bash

##########################################################################################
## This script is meant to live on ag-grid.com and be invoked by someone doing a deployment
## It's in a separate script as occasionally multiple "ssh -i" from a devs machine would
## result in some of the commands being rejected. Extracting these multiple commands into one
## should alleviate that
##########################################################################################

if [ "$#" -lt 1 ]
  then
    echo "You must supply a timestamp"
    echo "For example: ./tools/release/switchChartsReleaseRemote.sh 20191210"
    exit 1
fi

TIMESTAMP=$1

PUBLIC_HTML_PATH="@CHARTS_PUBLIC_HTML_PATH@"
WORKING_DIR_ROOT="@WORKING_DIR_ROOT@"

# create a backup of the charts folder ONLY if it doesn't already exist - this handles the situation where multiple deployments are done on the same day
# in that case we only want to backup the original chart folder, not the subsequent attempts (for rollback)
if [ -d "$WORKING_DIR_ROOT/charts_$TIMESTAMP" ];
then
  # if this block is run then it means that this is not the first deployment done today
  echo "$WORKING_DIR_ROOT/charts_$TIMESTAMP already exists - not backing up existing html folder"

  # move archives from the previous "live" to the original html backup: charts_$TIMESTAMP
  # this will in turn be moved to the new html folder down below
  mv $PUBLIC_HTML_PATH/archive $WORKING_DIR_ROOT/charts_$TIMESTAMP/archive

  # it's unlikely we'd need the version we're replacing, but just in case
  CURRENT_BACKUP_DIR="charts_`date '+%Y%m%d_%H%M'`"
  mv $PUBLIC_HTML_PATH $WORKING_DIR_ROOT/$CURRENT_BACKUP_DIR
else
  mv $PUBLIC_HTML_PATH $WORKING_DIR_ROOT/charts_$TIMESTAMP
fi

mv $WORKING_DIR_ROOT/charts_tmp $PUBLIC_HTML_PATH

# we don't copy the archives - it's too big
#mv $WORKING_DIR_ROOT/charts_$TIMESTAMP/archive $PUBLIC_HTML_PATH/
