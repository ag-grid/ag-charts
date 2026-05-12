#!/bin/bash

set -eu

RED='\033[0;31m'
GREEN='\033[0;32m'
RESET='\033[0m'

PASS=true

checkVersion() {
    local brewPkg=$1
    local aptPkg=$2
    local expectedBrew=$3
    local expectedApt=${4:-3}
    local helpMessage=

    local expected
    local actual
    local pkg
    if (which brew >/dev/null) ; then
        pkg=$brewPkg
        expected=$expectedBrew
        actual=$(brew list --versions $brewPkg || echo "")
        helpMessage="Try running one of these to fix:\n    brew install ${brewPkg}\n    brew upgrade ${brewPkg}"
    elif (which apt-cache >/dev/null) ; then
        pkg=$aptPkg
        expected=$expectedApt
        actual=$(apt-cache policy $aptPkg | grep "Installed" | awk '{ print $2 }')
    fi

    if [[ ${actual} =~ ${expected} ]] ; then
        echo -e "${GREEN}Installed version of ${pkg} matched ${actual}${RESET}"
    else
        PASS=false
        echo -e "${RED}Installed version of ${pkg} !== ${expected}, found ${actual}${RESET}"
        echo -e "$helpMessage"
    fi
}

if [[ ${AG_SKIP_NATIVE_DEP_VERSION_CHECK:-} != "" ]] ; then
    echo -e "${RED}Native version checks skipped.${RESET}"
    exit 0
fi

## On Debian/Ubuntu the package providing fontconfig is named `libfontconfig1`.
## Check for that package name as well to avoid false negatives on apt systems.
if (which apt-cache >/dev/null) ; then
    checkVersion fontconfig libfontconfig1 "2..*" "2..*"
else
    checkVersion fontconfig libfontconfig "2..*" "2..*"
fi

## sharp (used by ag-charts-generate-chart-thumbnail) probes for a system
## libvips via pkg-config and, if found, builds from source against it. An
## incompatible host libvips is a common cause of cryptic `yarn install`
## failures in `node_modules/sharp`. Force prebuilt binaries unless the
## developer has explicitly opted in to the global build path.
if [[ -z ${SHARP_IGNORE_GLOBAL_LIBVIPS:-} && -z ${SHARP_FORCE_GLOBAL_LIBVIPS:-} ]] ; then
    if (which pkg-config >/dev/null 2>&1) && pkg-config --exists vips 2>/dev/null ; then
        vipsVersion=$(pkg-config --modversion vips 2>/dev/null || echo "unknown")
        PASS=false
        echo -e "${RED}Detected system libvips ${vipsVersion} on PATH.${RESET}"
        echo -e "sharp will try to build from source against it, which often fails."
        echo -e "Re-run with prebuilt binaries:"
        echo -e "    SHARP_IGNORE_GLOBAL_LIBVIPS=true yarn install"
        echo -e "Or set SHARP_IGNORE_GLOBAL_LIBVIPS=true in your shell profile."
    fi
fi

if [[ $PASS == "false" ]] ; then
    exit 1
fi