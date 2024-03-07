#!/bin/bash

set -eu

NX_DAEMON_PID_FILE=.nx/cache/d/server-process.json
maybeRestartDaemon() {
  if [ -f ${NX_DAEMON_PID_FILE} ] ; then
    pid=$(grep -o "\([0-9]*\)" .nx/cache/d/server-process.json)
    uptime=$(ps -o etime= -p "$pid")

    if [[ ! "${uptime}" =~ "0:[0-9][0-9]" ]] ; then
      echo "*** Daemon uptime ${uptime}, stopping..."
      nx daemon --stop
    else
        echo "*** Nx daemon recently started, skipping restart."
    fi
  else
    echo "*** Nx daemon not running, can't stop."
  fi
}

DEV_COMMAND=$(dirname $0)/dev.sh

while true ; do
  echo "*** Starting watch."
  nx watch --all -- ${DEV_COMMAND} \${NX_PROJECT_NAME} || echo "*** Stopped watch."
  sleep 1
  maybeRestartDaemon
done
