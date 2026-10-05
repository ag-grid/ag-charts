#!/bin/bash

set -euo pipefail

if [ "$#" -lt 2 ]
  then
    echo "You must supply a release version and host"
    echo "For example: ./tools/archive/uploadAndUnzipArchive.sh 14.1.0 user@host"
    echo ""
    echo "Run it once per host, primary and mirror, as the grid archive upload is."
    echo ""
    echo "Before it changes anything on the host, it exempts this archive from caching while it is"
    echo "under test, in the in-flight block of the root .htaccess under \$GRID_ROOT_DIR, and stops"
    echo "if that fails. A production docs deploy restores normal caching."
    echo ""
    echo "Requires \$SSH_FILE, \$SSH_PORT, \$CHARTS_ROOT_DIR and \$GRID_ROOT_DIR."
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

# Exempt this release candidate from caching before any of it is served, as the grid upload does
# for its own: the in-flight rule matches on path alone, so it can be set before the files exist,
# and if it fails nothing has been removed or uploaded yet. Mirrors the remote steps of ag-grid's
# scripts/deployments/prep_and_archive/patchUncachedArchives.sh, for the charts rule alone.
# Only one deploy or release runs at a time, so nothing else writes the root .htaccess while this runs.
if [ -z "$GRID_ROOT_DIR" ]
then
      echo "\$GRID_ROOT_DIR is not set: the grid docroot, whose root .htaccess marks this archive in flight"
      exit 1;
fi

PATCHER="$(dirname "$0")/markChartsArchiveInFlight.mjs"
checkFileExists "$PATCHER"

LIVE_HTACCESS=$(mktemp)
REMOTE=".htaccess"
STAGED="$GRID_ROOT_DIR/.htaccess.new-$$"
BACKUP="$GRID_ROOT_DIR/.htaccess.bak-$(date +%Y%m%d%H%M%S)"

function patchFailed {
    echo "$1";
    echo "The live root .htaccess has NOT been changed, and nothing has been uploaded.";
    rm -f "$LIVE_HTACCESS";
    ssh -i $SSH_LOCATION -p $SSH_PORT $CURRENT_HOST "rm -f $STAGED" 2>/dev/null;
    exit 1;
}

if ! scp -i $SSH_LOCATION -P $SSH_PORT $CURRENT_HOST:$GRID_ROOT_DIR/$REMOTE "$LIVE_HTACCESS"
then
    patchFailed "Could not fetch the live root .htaccess.";
fi

# sha256sum on the hosts and CI agents; shasum where it is missing (macOS).
function sha256 {
    if command -v sha256sum > /dev/null; then sha256sum | cut -d' ' -f1; else shasum -a 256 | cut -d' ' -f1; fi
}

SNAPSHOT_SHA=$(sha256 < "$LIVE_HTACCESS")
OUTCOME=$(node "$PATCHER" "$LIVE_HTACCESS" "$VERSION") || patchFailed "Patching failed."
PATCHED_SHA=$(sha256 < "$LIVE_HTACCESS")

# Already in flight: leave the live file alone rather than uploading the same bytes back.
if [ "$PATCHED_SHA" != "$SNAPSHOT_SHA" ]
then
    # Upload beside the live file and rename over it: mv within a directory is atomic, so a reader
    # sees either the old file or the new one, never a truncated transfer.
    if ! scp -i $SSH_LOCATION -P $SSH_PORT "$LIVE_HTACCESS" $CURRENT_HOST:$STAGED
    then
        patchFailed "Could not upload the patched root .htaccess.";
    fi
    # Swap in only the bytes that were built here, keeping a timestamped copy so a bad patch is one
    # cp away from being undone. The same command as ag-grid's patchUncachedArchives.sh.
    SWAP="cd $GRID_ROOT_DIR || exit 5; \
        [ \"\$(sha256sum < $STAGED | cut -d' ' -f1)\" = $PATCHED_SHA ] || { echo 'uploaded file does not match the patched one'; exit 4; }; \
        cp -p $REMOTE $BACKUP && chmod 644 $STAGED && mv $STAGED $REMOTE"
    ssh -i $SSH_LOCATION -p $SSH_PORT $CURRENT_HOST "$SWAP"
    case $? in
        0) ;;
        4) patchFailed "The upload did not arrive intact. Re-run this.";;
        *) patchFailed "Could not move the patched root .htaccess into place.";;
    esac
    OUTCOME="$OUTCOME (previous copy at $BACKUP)"
fi
rm -f "$LIVE_HTACCESS"
echo "$GRID_ROOT_DIR/$REMOTE: $OUTCOME"

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



