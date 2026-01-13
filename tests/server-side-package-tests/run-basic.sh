#!/bin/bash

set -eu

mode=docker
editor=false
update=false

while getopts ":neu" opt; do
  case $opt in
    e)
      editor=true
      ;;
    n)
      mode=native
      ;;
    u)
      update=true
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done
shift $((OPTIND - 1))

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

cd ${project}

# Initialize Node.js project
echo ">>> initializing Node.js project..."
npm init -y >/dev/null

# Install dependencies from absolute paths to dist/packages
echo ">>> installing dependencies..."
npm i tsx pixelmatch pngjs >/dev/null
npm i ${repo_dir}/dist/packages/ag-charts-*.tgz

# Run the test with optional update flag
echo ">>> running SSR rendering test..."
if ${update} ; then
    npx tsx app.ts --update
else
    npx tsx app.ts
fi

# Verify output
if [ -f output.png ]; then
    echo ""
    echo "======================================"
    echo "SUCCESS: SSR rendering test passed"
    echo "======================================"
    echo ""
    echo "Output file: ${project}/output.png"

    # Check file size as a sanity check
    size=$(stat -f%z output.png 2>/dev/null || stat -c%s output.png 2>/dev/null)
    echo "File size: ${size} bytes"

    if ${editor} ; then
        echo "Opening output in default viewer..."
        if [[ $(uname) == "Darwin" ]] ; then
            open output.png
        else
            xdg-open output.png 2>/dev/null || echo "Unable to open image automatically"
        fi
    fi

    # Copy updated snapshots back to source if in update mode
    if ${update} && [ -d "${project}/snapshots" ]; then
        echo ""
        echo ">>> copying updated snapshots back to source..."
        mkdir -p ${snapshots_dir}
        cp -r ${project}/snapshots/* ${snapshots_dir}/
        echo "Snapshots updated in: ${snapshots_dir}"
    fi
else
    echo ""
    echo "======================================"
    echo "FAILURE: SSR rendering test failed"
    echo "======================================"
    echo ""
    echo "No output.png file was created"
    exit 1
fi

# Cleanup temp project unless in editor mode
if ! ${editor} ; then
    cd ${project_dir}
    rm -rf ${project}
fi
