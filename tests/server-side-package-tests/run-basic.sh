#!/bin/bash

set -eu

mode=docker
editor=false
update=false
passthrough_opts=""

while getopts ":cneu" opt; do
  case $opt in
    c)
      mode=container
      ;;
    e)
      editor=true
      ;;
    n)
      mode=native
      ;;
    u)
      update=true
      passthrough_opts="${passthrough_opts} -u"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done
shift $((OPTIND - 1))

# Container mode: running inside Docker, project path passed as argument
if [[ ${mode} == "container" ]] ; then
    project=${1:-/project}
    cd ${project}

    # Initialize Node.js project
    echo ">>> initializing Node.js project..."
    npm init -y >/dev/null

    # Install dependencies from local tgz files
    echo ">>> installing dependencies..."
    npm i tsx pixelmatch pngjs >/dev/null
    npm i ./ag-charts-*.tgz

    # Run the test with optional update flag
    echo ">>> running SSR rendering test..."
    if ${update} ; then
        npx tsx app.ts --update
    else
        npx tsx app.ts
    fi

    exit 0
fi

# Host mode: prepare temp folder and optionally run in Docker
repo_dir=$(git rev-parse --show-toplevel)
project_dir=$(readlink -f $(dirname $0))
snapshots_dir=${project_dir}/snapshots

echo ">>> preparing temporary project folder..."
mkdir -p ${project_dir}/.tmp
if [[ $(uname) == "Darwin" ]] ; then
    project=$(mktemp -d ${project_dir}/.tmp/tmp.XXXXXXXX)
else
    project=$(mktemp -d -p ${project_dir}/.tmp)
fi

echo ">>> temporary project folder: ${project}"

# Copy test app files
cp ${project_dir}/patches/basic/*.ts ${project}/

# Copy snapshots if they exist
if [ -d "${snapshots_dir}" ]; then
    echo ">>> copying expected snapshots..."
    cp -r ${snapshots_dir} ${project}/
fi

# Copy dist packages for installation
echo ">>> copying packaged tgz files..."
cp ${repo_dir}/dist/packages/ag-charts-*.tgz ${project}/

# Copy this script for Docker execution
cp ${project_dir}/run-basic.sh ${project}/

if [[ ${mode} == "docker" ]] ; then
    echo ">>> docker run ..."
    docker run --rm --ipc=host \
        -v ${project}:/project \
        mcr.microsoft.com/playwright:v1.52.0 \
        /bin/bash /project/run-basic.sh -c ${passthrough_opts} /project
    exitCode=$?

    # Copy updated snapshots back to source if in update mode
    if ${update} && [ -d "${project}/snapshots" ]; then
        echo ""
        echo ">>> copying updated snapshots back to source..."
        mkdir -p ${snapshots_dir}
        cp -r ${project}/snapshots/* ${snapshots_dir}/
        echo "Snapshots updated in: ${snapshots_dir}"
    fi

    exit ${exitCode}
fi

# Native mode: run directly on host
cd ${project}

# Initialize Node.js project
echo ">>> initializing Node.js project..."
npm init -y >/dev/null

# Install dependencies from local tgz files
echo ">>> installing dependencies..."
npm i tsx pixelmatch pngjs >/dev/null
npm i ./ag-charts-*.tgz

# Run the test with optional update flag
echo ">>> running SSR rendering test..."
if ${update} ; then
    npx tsx app.ts --update
else
    npx tsx app.ts
fi

# Cleanup temp project unless in editor mode
if ! ${editor} ; then
    cd ${project_dir}
    rm -rf ${project}
fi
