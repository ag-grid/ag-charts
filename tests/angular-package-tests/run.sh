#!/bin/bash

set -eu

editor=false
mode=docker
interactive=false
update=false
it_opts=$([[ ${TTY:-} -ne "" ]] && echo "-it" || echo "")

passthrough_opts=-n

while getopts ":eniu" opt; do
  case $opt in
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
    temp_dir=$(mktemp -d)


    cp -R ${project_dir}/* $temp_dir/
    cp dist/packages/*.tgz $temp_dir/
    cd $temp_dir

    if ${editor} ; then
        code . &
    fi
    echo ">>> docker run ..."
    mkdir -p ./npm-cache
    docker run ${it_opts} --rm --ipc=host \
        -v $(pwd):/project \
        -p 4200:4200 \
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

echo ">>> npm i -g @angular/cli@^${version}.0.0"
npm config set cache $(pwd)/.npm-cache
npm i -g @angular/cli@^${version}.0.0
echo ">>> ng new angular-${version}-test"
echo "" | ng new angular-${version}-test --defaults=true --strict --prefix=app --style=scss --package-manager=npm --routing=false --interactive=false

cd angular-${version}-test

echo ">>> npm i ../ag-charts*.tgz"
npm i ../ag-charts-types.tgz ../ag-charts-locale.tgz ../ag-charts-community.tgz ../ag-charts-enterprise.tgz ../ag-charts-angular.tgz @playwright/test@1.45.0
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
export ANGULAR_VERSION=${version}

if ${interactive} ; then
    echo ">>> ng serve"
    ng serve --host 0.0.0.0 &
    npx playwright test $(${update} && echo "-u" || echo "") || echo "Tests failed"
    /bin/bash -il
else
    echo ">>> ng build"
    ng build
    echo ">>> playwright test"
    npx playwright test $(${update} && echo "-u" || echo "")
fi
