#!/usr/bin/env bash

if [ "$#" -lt 2 ]
  then
    echo "You must supply a release version and release branch"
    exit 1
fi

RELEASE_BRANCH=$1

NON_PACKAGE_JSON_COUNT=`git status --porcelain | grep -Ev "package.json|yarn.lock|version.t" | wc -l`

if [ $NON_PACKAGE_JSON_COUNT -ne 0 ];
then
  echo "Only package.json, version.ts, yarn.lock files  should be updated - please verify changeset.."
  git status --porcelain
  exit 1
fi

#git add .
#git commit -am "Version Bump"
#git push -u origin "$RELEASE_BRANCH"
