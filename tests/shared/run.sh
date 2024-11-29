#!/bin/bash

set -eu

editor=false
mode=docker
interactive=false
update=false
production=false
it_opts=$([[ ${TTY:-} -ne "" ]] && echo "-it" || echo "")

passthrough_opts=-n

while getopts ":eniup" opt; do
  case $opt in
    e)
      editor=true
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
    i)
      interactive=true
      passthrough_opts="${passthrough_opts} -i"
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

if [[ ${mode} == "docker" ]] ; then
    repo_dir=$(git rev-parse --show-toplevel)
    project_dir=$(readlink -f $(dirname $0))
    project_script=$(basename $0)
    temp_dir=$(mktemp -d)

    cp -R ${project_dir}/../shared/* $temp_dir/
    cp -R ${project_dir}/* $temp_dir/
    cp dist/packages/*.tgz $temp_dir/

    cd ${project_dir}
    sed -e '/source .*\/run.sh$/r ../shared/run.sh' ${project_dir}/${project_script} >${temp_dir}/run.sh
    sed -i '' -e '/source .*\/run.sh$/d' ${temp_dir}/run.sh
    cd ${temp_dir}

    if ${editor} ; then
        code . &
    fi
    port_spec=
    if ${interactive} ; then
        port_spec=-p 4200:4200
    fi
    echo ">>> docker run ..."
    mkdir -p ./npm-cache
    docker run ${it_opts} --rm --ipc=host \
        -v $(pwd):/project \
        $port_spec \
        mcr.microsoft.com/playwright:v1.45.0-jammy \
        /bin/bash -il /project/run.sh ${passthrough_opts} ${version}
    exitCode=$?

    if ${update} ; then
        cp -R */e2e/*-snapshots ${project_dir}/e2e/
    fi

    exit ${exitCode}
fi

cd /project

echo ">>> git config"
git config --global init.defaultBranch latest
git config --global user.email "me@ag-grid.com"
git config --global user.name "myself"

npm config set cache /project/.npm-cache
install_fw

if ${production} ; then
    echo ">>> npm i ag-charts-${fw} (production)"
    npm i ag-charts-${fw} @playwright/test@1.45.0
else
    echo ">>> npm i ../ag-charts*.tgz"
    npm i ../ag-charts-types.tgz ../ag-charts-locale.tgz ../ag-charts-community.tgz ../ag-charts-enterprise.tgz ../ag-charts-${fw}.tgz @playwright/test@1.45.0
fi
git add .
git commit -m "Initial commit"

for filename in ../patches/* ; do
    ext=${filename##*.}

    if [[ ${ext} == 'sed' ]] ; then
        target=$(find src/ -name "$(basename ${filename%.*})")
        echo ">>> Modifying ${target}"
        sed -i'' -f $filename $(pwd)/$target
    else
        target=$(find src/ -name "$(basename $filename)")
        echo ">>> Updating ${target}"
        cp $filename $target
    fi
done

mv ../e2e ../playwright.config.ts ./

export FW_VERSION=${version}
export FW_TYPE=${fw}
if ${production} ; then
    export FW_VERSION=production-$FW_VERSION
fi

if ${interactive} ; then
    serve_fw
    npx playwright test $(${update} && echo "-u" || echo "") || echo "Tests failed"
    /bin/bash -il
else
    build_fw
    echo ">>> playwright test"
    npx playwright test $(${update} && echo "-u" || echo "")
fi
