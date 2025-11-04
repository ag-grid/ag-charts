#!/bin/bash

set -eu

editor=false
mode=docker
interactive=false
update=false
production=false
it_opts=
passthrough_opts=
playwright_version=1.52.0

function sed_inplace {
    if [[ $(uname) == "Darwin" ]] ; then
        sed -i '' "$@"
    else
        sed -i'' "$@"
    fi
}

function snapshot_versions {
    if ${production} ; then
        grep 'ag-charts-' package.json >./e2e/${fw}-${version}-${patch_subdir:-basic}-version.txt
        grep ${fw_package} package.json >>./e2e/${fw}-${version}-${patch_subdir:-basic}-version.txt
    fi
}

while getopts ":eniupc" opt; do
  case $opt in
    i)
      interactive=true
      editor=true
      mode=native
      ;;
    e)
      editor=true
      ;;
    c)
      mode=container
      ;;
    n)
      mode=native
      ;;
    p)
      production=true
      passthrough_opts="${passthrough_opts} -p"
      ;;
    u)
      update=true
      passthrough_opts="${passthrough_opts} -u"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$opt requires an argument." >&2
      exit 1
      ;;
  esac
done
shift $((OPTIND - 1))

version=$1
project=${2:-/project}

if declare -F init_fw >/dev/null ; then
    init_fw
fi

if [[ ${mode} == "container" ]] ; then
    echo ">>> using prepared temporary project folder..."
    cd ${project}
else
    echo ">>> preparing temporary project folder..."
    repo_dir=$(git rev-parse --show-toplevel)
    project_dir=$(readlink -f $(dirname $0))
    project_script=$(basename $0)

    mkdir -p $(pwd)/.tmp
    if [[ $(uname) == "Darwin" ]] ; then
        project=$(mktemp -d $(pwd)/.tmp/tmp.XXXXXXXX)
    else
        project=$(mktemp -d -p $(pwd)/.tmp)
    fi

    cp -R ${project_dir}/../shared/* $project/
    cp -R ${project_dir}/* $project/
    cp dist/packages/*.tgz $project/

    cd ${project_dir}
    sed -e '/source .*\/run.sh$/r ../shared/run.sh' ${project_dir}/${project_script} >${project}/run.sh
    sed_inplace -e '/source .*\/run.sh$/d' ${project}/run.sh
    cd ${project}

    echo ">>> temporary project folder: ${project}"
fi

if ${editor} ; then
    code . &
fi

if [[ ${mode} == "docker" ]] ; then
    echo ">>> docker run ..."
    port_spec=
    if ${interactive} ; then
        port_spec="-p ${dev_port}:${dev_port}"
    fi
    mkdir -p ./npm-cache
    docker run ${it_opts} --rm --ipc=host \
        -v $(pwd):/project \
        $port_spec \
        mcr.microsoft.com/playwright:v1.52.0 \
        /bin/bash -il /project/run.sh -c ${passthrough_opts} ${version} /project
    exitCode=$?

    if ${update} ; then
        cp -R */e2e/*-snapshots ${project_dir}/e2e/
        cp */e2e/*.txt ${project_dir}/e2e/ || true
    fi

    exit ${exitCode}
fi

echo ">>> git config"
git config --global init.defaultBranch latest
git config --global user.email "me@ag-grid.com"
git config --global user.name "myself"

npm config set cache ${project}/.npm-cache
install_fw

if ${production} ; then
    echo ">>> npm i ag-charts-${fw} (production)"
    npm i ag-charts-${fw} @playwright/test@${playwright_version}
else
    echo ">>> npm i ../ag-charts*.tgz"
    npm i ../ag-charts-types.tgz ../ag-charts-locale.tgz ../ag-charts-community.tgz ../ag-charts-core.tgz ../ag-charts-enterprise.tgz ../ag-charts-${fw}.tgz @playwright/test@${playwright_version}
fi
git config --global --add safe.directory $(pwd)
git add .
git commit -m "Initial commit"

patch_dir=../patches
if [[ "${patch_subdir:-}" != "" ]] ; then
    patch_dir=${patch_dir}/${patch_subdir}
fi
for filename in ${patch_dir}/* ; do
    if [ ! -f "$filename" ] ; then
        continue
    fi

    ext=${filename##*.}

    if [[ ${ext} == 'sed' ]] ; then
        target=$(find . -not \( -path ./node_modules -prune \) -name "$(basename ${filename%.*})" -type f)
        echo ">>> Modifying ${target}"
        sed_inplace -f $filename $(pwd)/$target
    else
        target=$(find . -not \( -path ./node_modules -prune \) -name "$(basename $filename)" -type f)
        echo ">>> Updating ${target}"
        cp $filename $target
    fi
done

mv ../e2e ../playwright.config.ts ./

export FW_VERSION=${version}
export FW_TYPE=${fw}
export FW_DEV_PORT=${dev_port}
if ${production} ; then
    export FW_VERSION=production-$FW_VERSION
fi
if [[ "${patch_subdir:-}" != "" ]] ; then
    export FW_PATCH_TYPE=${patch_subdir}
fi

build_fw
if ${interactive} ; then
    serve_fw
    npx playwright test $(${update} && echo "-u" || echo "") || echo "Tests failed"
    /bin/bash -il
else
    echo ">>> playwright test"
    npx playwright test $(${update} && echo "-u" || echo "")
fi

snapshot_versions

if [[ ${mode} == 'native' && ${update} == 'true' ]] ; then
    cp -R */e2e/*-snapshots ${project_dir}/e2e/
    cp */e2e/*.txt ${project_dir}/e2e/ || true
fi
