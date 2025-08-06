#!/usr/bin/env bash

PACKAGE_DIRECTORY="./dist/packages"

if [ "$#" -ne 1 ]
then
    echo "You must supply the GPG public key as the first argument"
    exit 1
fi

if [ -z "$1" ];
then
    echo "The GPG public key supplied is empty"
    exit 1
fi

for package in `ls $PACKAGE_DIRECTORY/*.tgz`;
do
  gpg --sign --detach-sign --interactive --verbose --digest-algo sha512 -o $package.sig $package
done

echo "$1"  > "$PACKAGE_DIRECTORY/gpg-pub.asc"
