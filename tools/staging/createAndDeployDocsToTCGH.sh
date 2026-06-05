#!/usr/bin/env bash

set -euo pipefail

: "${SSH_KEY_LOCATION:?SSH_KEY_LOCATION is required}"
: "${SSH_USER:?SSH_USER is required}"
: "${SSH_HOST:?SSH_HOST is required}"
: "${WWW_ROOT_DIR:?WWW_ROOT_DIR is required}"

ZIP_PREFIX=$(date +%Y%m%d)

echo "Deploying Docs to Staging"

if [ ! -d "dist/packages/ag-charts-website" ]; then
    echo "dist/packages/ag-charts-website does NOT EXIST. Exiting with error."
    exit 1
fi

FILENAME="charts-staging_${ZIP_PREFIX}_v${ZIP_PREFIX}.zip"

echo "Creating $FILENAME"
(
    set -e
    cd dist/packages/ag-charts-website
    zip -qr "../../../$FILENAME" *
    # The glob above skips dotfiles, so add the generated .htaccess explicitly (present on staging/production builds)
    if [ -f .htaccess ]; then
        zip -q "../../../$FILENAME" .htaccess
    fi
)

REMOTE_SCRIPT=/tmp/updateChartsStagingRemote.sh
sed -e "s#@WWW_ROOT_DIR@#${WWW_ROOT_DIR}#g" -e "s#@FILENAME@#${FILENAME}#g" \
    ./tools/staging/updateChartsStagingRemote.sh > "$REMOTE_SCRIPT"

SCP_OPTS=(-i "$SSH_KEY_LOCATION" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null)
SSH_OPTS=(-i "$SSH_KEY_LOCATION" -o StrictHostKeyChecking=no)

echo "Uploading $FILENAME"
scp "${SCP_OPTS[@]}" "$FILENAME" "${SSH_USER}@${SSH_HOST}:${WWW_ROOT_DIR}/"

echo "Uploading remote update script"
scp "${SCP_OPTS[@]}" "$REMOTE_SCRIPT" "${SSH_USER}@${SSH_HOST}:${WWW_ROOT_DIR}/"

echo "Updating Charts Staging with $FILENAME"
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" \
    "cd '${WWW_ROOT_DIR}' && chmod +x updateChartsStagingRemote.sh && ./updateChartsStagingRemote.sh"
