#!/bin/bash

if [ "$#" -ne 1 ]
  then
    echo "You must supply the charts version"
    echo "For example: ./tools/release/updateSecurityMarkdown.sh 15.0.0"
    exit 1
fi

NEW_CHARTS_VERSION=$1

npx tsx external/ag-shared/scripts/security/update-security-versions.ts --type latest --version $NEW_CHARTS_VERSION --file SECURITY.md
