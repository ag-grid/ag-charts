#!/usr/bin/env bash

excluded=("ag-charts-react" "ag-charts-vue3" "ag-charts-angular" "ag-charts-locale")
frameworks=("ag-charts-react" "ag-charts-vue3" "ag-charts-angular")
expected_package_files=(
  "dist/packages/ag-charts-vue3.tgz"
  "dist/packages/ag-charts-react.tgz"
  "dist/packages/ag-charts-types.tgz"
  "dist/packages/ag-charts-angular.tgz"
  "dist/packages/ag-charts-locale.tgz"
  "dist/packages/ag-charts-enterprise.tgz"
  "dist/packages/ag-charts-community.tgz"
  "dist/packages/contents/ag-charts-angular"
  "dist/packages/contents/ag-charts-community"
  "dist/packages/contents/ag-charts-react"
  "dist/packages/contents/ag-charts-vue3"
  "dist/packages/contents/ag-charts-types"
  "dist/packages/contents/ag-charts-locale"
  "dist/packages/contents/ag-charts-enterprise"
)

validatePackageJsonExists()
{
  local directory=$1

  if [[ ! -s $directory/package.json  ]]
  then
    echo "ERROR: $directory/package.json empty or does not exist"
    exit 1
  fi
}

checkFilesExist() {
  local -n expected_files=$1
  local missing_files=()
  
  for file in "${expected_files[@]}"; do
    if [[ ! -e "$file" ]]; then
      missing_files+=("$file")
    fi
  done

  if [[ ${#missing_files[@]} -eq 0 ]]; then
    return 0
  else
    echo "The following expected files or directories are missing:"
    printf "%s\n" "${missing_files[@]}"
    return 1
  fi
}

validateCommonDist()
{
  local directory=$1

  if [[ ! -d "$directory" ]]
  then
    echo "ERROR: $directory doesn't exist"
    exit 1
  fi

  validatePackageJsonExists $directory

  if [[ ! -d "$directory/dist" ]]
  then
    echo "ERROR: $directory/dist doesn't exist"
    exit 1
  fi

  local expected_count=4
  if [[ "$directory" == "dist/packages/contents/ag-charts-community/package" ]]
  then
      expected_count=8
  fi
  if [[ "$directory" == "dist/packages/contents/ag-charts-enterprise/package" ]]
  then
      expected_count=8
  fi
  
  local count=`find "$directory/dist/package" -type f | wc -l | tr -d ' '`;
  if [[ $count -ne $expected_count ]]
  then
    echo "ERROR: $directory/dist/package should have $expected_count artefacts but has $count"
    exit 1
  fi

  local count=`find "$directory/dist/types" -type f | grep .d.ts | wc -l | tr -d ' '`;
  if [[ $count -eq 0 ]]
  then
    echo "ERROR: $directory/dist/types should have at type files - none found"
    exit 1
  fi
}

validateModules()
{
  local packagesDir=$1

  for directory in `ls $packagesDir`;
  do
    if [[ ! ${excluded[@]} =~ $directory ]]
    then
      # a core modules
      validateCommonDist "$packagesDir/$directory/package"
    elif [[ ${frameworks[@]} =~ $directory ]]
    then
      # a framework
      package_dir=$packagesDir/$directory/package

      validatePackageJsonExists $package_dir

      count=`tree $package_dir | grep -v .d.ts | wc -l | tr -d ' '`;
      if [[ $count -le 5 ]]
      then
        echo "ERROR: $package_dir should have at least 5 artefacts"
        exit 1
      fi
    fi
  done
}

validatePackages()
{
  local packagesDir=$1

  for directory in `ls $packagesDir`;
  do
    if [[ ! ${excluded[@]} =~ $directory ]]
    then
      # a core package
      current_root_dir="$packagesDir/$directory/package"
      validateCommonDist "$current_root_dir"

      current_dist=$current_root_dir/dist
      count=`find $current_dist -name *.js -maxdepth 1 | wc -l | tr -d ' '`
      if [[ $count -ne 4 ]]
      then
        echo "ERROR: $current_dist should have 4 umd files"
        exit 1
      fi
    elif [[ ${frameworks[@]} =~ $directory ]]
    then
      # a framework - here we're just checking there are files in the package as a sanity check
      package_dir=$packagesDir/$directory/package

      validatePackageJsonExists $package_dir

      count=`tree $package_dir | grep .d.ts | wc -l | tr -d ' '`;
      if [[ $count -le 5 ]]
      then
        echo "ERROR: $package_dir should have at least 5 artefacts"
        exit 1
      fi
    fi
  done
}

validateLocale()
{
  local directory=$1
  validatePackageJsonExists $directory

  count=`find "$directory/dist" | wc -l | tr -d ' '`
  if [[ $count -le 30 ]] # just checking files exist
  then
    echo "ERROR: $directory/dist should have files"
    exit 1
  fi
}

# check all expected modules & packages are there
checkFilesExist expected_package_files # NOTE: Send expected as a reference, not by value
validateModules "dist/packages/contents"
validateLocale "dist/packages/contents/ag-charts-locale/package"


