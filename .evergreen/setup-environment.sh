#! /usr/bin/env bash

if [ -z "$NODE_MAJOR_VERSION" ]; then
  echo "NODE_MAJOR_VERSION environment variable must be specified"
  exit 1
fi

# Get the current unique version of this checkout
if [ "${is_patch}" = "true" ]; then
    CURRENT_VERSION=$(git describe)-patch-${version_id}
else
    CURRENT_VERSION=latest
fi
export PROJECT_DIRECTORY="$(pwd)"

latest_version_for_node_major() {
  local __NODE_MAJOR_VERSION=$1
  local NODE_DOWNLOAD_URI="https://nodejs.org/download/release/latest-v${__NODE_MAJOR_VERSION}.x/SHASUMS256.txt"

  if [ $__NODE_MAJOR_VERSION == 'latest' ]
  then
    NODE_DOWNLOAD_URI="https://nodejs.org/download/release/latest/SHASUMS256.txt"
  fi

  # check that the requested version does exist
  curl --silent --fail $NODE_DOWNLOAD_URI &> /dev/null

  echo $(curl --retry 8 --retry-delay 5  --max-time 50 --silent -o- $NODE_DOWNLOAD_URI | head -n 1 | awk '{print $2};' | cut -d- -f2)
}

NODE_VERSION=$(latest_version_for_node_major $NODE_MAJOR_VERSION)

echo "LATEST NODE ${NODE_MAJOR_VERSION}.x = $NODE_VERSION"

cat <<EOT > expansion.yml
CURRENT_VERSION: "$CURRENT_VERSION"
PROJECT_DIRECTORY: "$PROJECT_DIRECTORY"
NODE_VERSION: "$NODE_VERSION"
PREPARE_SHELL: |
    set -o errexit
    set -o xtrace
    export PROJECT_DIRECTORY="$PROJECT_DIRECTORY"
    export NODE_VERSION="$NODE_VERSION"
EOT
# See what we've done
cat expansion.yml
