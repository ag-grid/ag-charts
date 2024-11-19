#!/bin/bash

read -p "This will clean the entire repo of all modifications, are you sure (y/N)? " confirm

if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]] ; then
    exit 1
fi

echo "Removing all node_modules..."
rm -rf node_modules **/node_modules

echo "Cleaning the repo..."
git clean -dXf

echo "Repo cleaned, run 'yarn' to reinitialise."
nx daemon --stop
