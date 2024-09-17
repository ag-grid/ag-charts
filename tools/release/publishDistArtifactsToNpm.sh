#!/usr/bin/env bash


publishModules()
{
  local directory=$1

  for moduleDirectory in `ls $directory`;
  do
    local modulePath="$directory/$moduleDirectory/package"

    echo "PUBLISHING TO NPM: $modulePath"
    npm publish $modulePath

    if [ $? -ne 0 ]; then
        echo "Error publishing $modulePath"
        exit 1;
    else
        echo "$modulePath published to npm"
    fi
  done
}

publishModules "dist/packages/contents"
