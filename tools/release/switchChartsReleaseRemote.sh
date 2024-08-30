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

CHARTS_ROOT_DIR="@CHARTS_ROOT_DIR@"
WWW_ROOT_DIR="@WWW_ROOT_DIR@"

# create a backup of the charts folder ONLY if it doesn't already exist - this handles the situation where multiple deployments are done on the same day
# in that case we only want to backup the original chart folder, not the subsequent attempts (for rollback)
if [ -d "$WWW_ROOT_DIR/charts_$TIMESTAMP" ];
then
  # if this block is run then it means that this is not the first deployment done today
  echo "$WWW_ROOT_DIR/charts_$TIMESTAMP already exists - not backing up existing html folder"

  # move archives from the previous "live" to the original html backup: charts_$TIMESTAMP
  # this will in turn be moved to the new html folder down below
  mv $CHARTS_ROOT_DIR/archive $WWW_ROOT_DIR/charts_$TIMESTAMP/archive

  # it's unlikely we'd need the version we're replacing, but just in case
  CURRENT_BACKUP_DIR="charts_`date '+%Y%m%d_%H%M'`"
  mv $CHARTS_ROOT_DIR $WWW_ROOT_DIR/$CURRENT_BACKUP_DIR
else
  mv $CHARTS_ROOT_DIR $WWW_ROOT_DIR/charts_$TIMESTAMP
fi

mv $WWW_ROOT_DIR/charts_tmp $CHARTS_ROOT_DIR

# we don't copy the archives - it's too big
mv $WWW_ROOT_DIR/charts_$TIMESTAMP/archive $CHARTS_ROOT_DIR/
