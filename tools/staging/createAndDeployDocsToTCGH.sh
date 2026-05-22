#!/usr/bin/env bash

ZIP_PREFIX=`date +%Y%m%d`

echo "Deploying Docs to Staging"

if [ ! -d "dist/packages/ag-charts-website" ];
then
  echo "dist/packages/ag-charts-website does NOT EXIST. Exiting with error."
  exit 1
fi

cd dist/packages/ag-charts-website

FILENAME=charts-staging_"$ZIP_PREFIX"_v"$ZIP_PREFIX".zip
echo "Creating $FILENAME"
zip -qr ../../../$FILENAME *

cd ../../../

echo "Uploading $FILENAME"
scp -i $SSH_KEY_LOCATION -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $FILENAME $SSH_USER@$SSH_HOST:$WWW_ROOT_DIR/

sed "s#\@WWW_ROOT_DIR\@#$WWW_ROOT_DIR#g" ./tools/staging/updateChartsStagingRemote.sh | sed "s#\@FILENAME\@#$FILENAME#g" > /tmp/updateChartsStagingRemote.sh

scp -i $SSH_KEY_LOCATION -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null /tmp/updateChartsStagingRemote.sh $SSH_USER@$SSH_HOST:$WWW_ROOT_DIR/

echo "Updating Charts Staging with $FILENAME"
ssh -i $SSH_KEY_LOCATION -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "cd $WWW_ROOT_DIR && chmod +x updateChartsStagingRemote.sh && ./updateChartsStagingRemote.sh"
