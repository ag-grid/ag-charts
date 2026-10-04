#!/usr/bin/env bash

##########################################################################################
## Runs a deployment script once per production host, in parallel.
##
## Usage: ./tools/release/runOnHosts.sh <script> [args...]
##
## Hosts are read from DEPLOY_HOSTS (space separated), e.g. in TeamCity:
##   env.DEPLOY_HOSTS="%env.HOST% %env.HOST_2%"
##
## The host is appended as the LAST argument, so
##   ./tools/release/runOnHosts.sh ./tools/release/uploadReleaseZip.sh 13.1.0
## runs `./tools/release/uploadReleaseZip.sh 13.1.0 <host>` for each host. Scripts that fit:
##   tools/release/uploadReleaseZip.sh <version> <host>
##   tools/release/archiveCurrentRelease.sh <host>
##   tools/release/prepareNewChartsDeployment.sh <version> <host>
##   tools/release/switchRelease.sh skipWarning <host>
##   tools/archive/uploadAndUnzipArchive.sh <version> <host>
##
## Exceptions:
##   - switchRelease.sh must be given `skipWarning`: without it the host would land in $1,
##     and the script would wait for a y/n answer that never comes.
##   - downloadChangelog.sh <host> takes the host last too, but it runs the JIRA reports on the
##     host it's given, so it probably only needs one host - run it directly.
##   - *Remote.sh scripts run on the hosts themselves and createDocsReleaseBundle.sh takes no
##     host; none of them belong here.
##
## Arguments are joined into a single command line by parallel without extra quoting, so
## they must not contain spaces or shell metacharacters (versions and flags are fine).
##
## Each job is limited to 900 seconds. The job log is printed at the end, and the exit status
## is parallel's: 0 if every host succeeded, otherwise the number of failed jobs.
##########################################################################################

set -euo pipefail

if [ "$#" -lt 1 ]
  then
    echo "You must supply a script to run on each host"
    echo "For example: ./tools/release/runOnHosts.sh ./tools/release/uploadReleaseZip.sh 13.1.0"
    exit 1
fi

hosts=${DEPLOY_HOSTS:-}

if [[ -z "${hosts//[[:space:]]/}" ]]
then
    echo "\$DEPLOY_HOSTS is not set or empty - it must contain the space separated hosts to deploy to"
    exit 1
fi

SCRIPT=$1
shift

if ! [[ -x "$SCRIPT" ]]
then
    echo "Script [$SCRIPT] doesn't exist or isn't executable - exiting script."
    exit 1
fi

JOBLOG="$(mktemp)"
trap 'rm -f "$JOBLOG"' EXIT

status=0
# $hosts is deliberately unquoted so that it splits into one argument per host
parallel --will-cite --tagstring '[{}]' --timeout 900 --joblog "$JOBLOG" "$SCRIPT" "$@" {} ::: $hosts || status=$?

echo "Job log:"
cat "$JOBLOG"

exit $status
