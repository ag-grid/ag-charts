#!/bin/bash

set -eu

RED=$(echo -e "\033[0;31m")
GREEN=$(echo -e "\033[0;32m")
YELLOW=$(echo -e "\033[0;33m")
RESET=$(echo -e "\033[0m")

success() {
  echo "*** ${GREEN}$@${RESET}"
}
warning() {
  echo "*** ${YELLOW}$@${RESET}"
}
error() {
  echo "*** ${RED}$@${RESET}"
}

NX_DAEMON_PID_FILE=.nx/cache/d/server-process.json
maybeRestartDaemon() {
  if [ -f ${NX_DAEMON_PID_FILE} ] ; then
    pid=$(grep -o "\([0-9]*\)" .nx/cache/d/server-process.json)
    uptime=$(ps -o etime= -p "$pid")

    if [[ ! "${uptime}" =~ "^00:[0-9][0-9]" ]] ; then
      warning "Daemon uptime ${uptime}, stopping..."
      nx daemon --stop
    else
        success "Nx daemon recently started, skipping restart."
    fi
  else
    success "Nx daemon not running, can't stop."
  fi
}

DEV_COMMAND=$(dirname $0)/dev.sh

while true ; do
  success "Starting watch."
  nx --output-style compact watch --all -- ${DEV_COMMAND} \${NX_PROJECT_NAME} || success "Stopped watch."
  sleep 1
  maybeRestartDaemon
done
