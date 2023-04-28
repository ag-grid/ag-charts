#!/bin/bash

set -eu

LOCAL_REPO_ROOT=$(git rev-parse --show-superproject-working-tree)
if [[ $LOCAL_REPO_ROOT == "" ]] ; then
    LOCAL_REPO_ROOT=$(git rev-parse --show-toplevel)
fi
MODULE_PATH=$(echo $PWD | sed s:${LOCAL_REPO_ROOT}/::)
MODULE_NAME=$(basename $MODULE_PATH)
CHARTS_PATH=charts-community-modules/ag-charts-community
ENTERPRISE_PATH=charts-enterprise-modules/ag-charts-enterprise

DOCKER_REPO_ROOT=/workspace/ag-grid
DOCKER_MODULE_PATH=${DOCKER_REPO_ROOT}/${MODULE_PATH}
DOCKER_CHARTS_PATH=${DOCKER_REPO_ROOT}/${CHARTS_PATH}
DOCKER_ENTERPRISE_PATH=${DOCKER_REPO_ROOT}/${ENTERPRISE_PATH}

CHARTS_NODE_MODULES_PATH=${DOCKER_CHARTS_PATH}/node_modules
ENTERPRISE_NODE_MODULES_PATH=${DOCKER_ENTERPRISE_PATH}/node_modules
NODE_MODULES_PATH=${DOCKER_MODULE_PATH}/node_modules

EXTRA_VOL_MOUNTS=""
case "$MODULE_NAME" in
    ag-charts-community)
        SCOPE="ag-charts-community"
        INIT_CMD="npm i --no-package-lock"
    ;;

    ag-charts-enterprise)
        SCOPE="ag-charts-enterprise"
        INIT_CMD="npx lerna bootstrap --include-dependencies --scope=${SCOPE}"
    ;;

    *)
        EXTRA_VOL_MOUNTS="-v charts-${MODULE_NAME}-nm:${NODE_MODULES_PATH} -v ${LOCAL_REPO_ROOT}/${MODULE_PATH}:${DOCKER_MODULE_PATH}"

        if [[ ${MODULE_PATH} == charts-enterprise-modules/* ]] ; then
            SCOPE="@ag-charts-enterprise/${MODULE_NAME}"
        elif [[ ${MODULE_PATH} == charts-community-modules/* ]] ; then
            SCOPE="@ag-charts-community/${MODULE_NAME}"
        fi

        INIT_CMD="npx lerna bootstrap --include-dependencies --scope=${SCOPE}"
    ;;
esac

DOCKER_OPTS="--rm"
if [ -t 0 ] ; then
    # If run from a terminal, enable interactive mode.
    DOCKER_OPTS="${DOCKER_OPTS} -it"
fi

case $1 in
    init)
        # More FS write access is needed during init, as lerna temporarily modifies package.json.
        docker run ${DOCKER_OPTS} \
            -v ${LOCAL_REPO_ROOT}:${DOCKER_REPO_ROOT}:ro \
            -v ${LOCAL_REPO_ROOT}/${CHARTS_PATH}:${DOCKER_CHARTS_PATH} \
            -v ${LOCAL_REPO_ROOT}/${ENTERPRISE_PATH}:${DOCKER_ENTERPRISE_PATH} \
            -v charts-nm:${CHARTS_NODE_MODULES_PATH} \
            -v charts-enterprise-nm:${ENTERPRISE_NODE_MODULES_PATH} \
            ${EXTRA_VOL_MOUNTS} \
            -w ${DOCKER_MODULE_PATH} \
            charts:latest \
            ${INIT_CMD}
    ;;

    run)
        shift 1
        # Local repo is mounted read-only, except the module being tested (allows snapshot writing).
        docker run ${DOCKER_OPTS} \
            --cap-add=SYS_PTRACE \
            -v ${LOCAL_REPO_ROOT}:${DOCKER_REPO_ROOT}:ro \
            -v ${LOCAL_REPO_ROOT}/${MODULE_PATH}:${DOCKER_MODULE_PATH} \
            -v charts-nm:${CHARTS_NODE_MODULES_PATH} \
            -v charts-enterprise-nm:${ENTERPRISE_NODE_MODULES_PATH} \
            ${EXTRA_VOL_MOUNTS} \
            -w ${DOCKER_MODULE_PATH} \
            --name ${MODULE_NAME}-test \
            charts:latest \
            $@
    ;;

    clean)
        docker volume ls | grep charts | while read fs volumename ; do
            docker volume rm ${volumename}
        done
        if (docker image ls | grep charts:latest 2>/dev/null >/dev/null) ; then
            docker image rm charts:latest
        fi
        docker system prune -f
    ;;

    *)
        echo "Unknown command $1"
    ;;
esac
