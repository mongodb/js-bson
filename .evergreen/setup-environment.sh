#! /bin/bash

# Get the current unique version of this checkout
if [ "${is_patch}" = "true" ]; then
    CURRENT_VERSION=$(git describe)-patch-${version_id}
else
    CURRENT_VERSION=latest
fi
export PROJECT_DIRECTORY="$(pwd)"

if [ -z "$NODE_MAJOR_VERSION" ]; then
    echo "node major version was NOT set"
    exit 1
fi

if [ "$NODE_MAJOR_VERSION" == 'latest' ]; then 
    NODE_VERSION='node'
    echo "using latest node version"
else 
    # get the latest version of node for given major version
    NODE_VERSION=$(curl -sL nodejs.org/download/release/latest-v${NODE_MAJOR_VERSION}.x/SHASUMS256.txt -o - | head -n 1 | tr -s ' ' | cut -d' ' -f2 | cut -d- -f2 | cut -dv -f2)
    echo "LATEST NODE ${NODE_MAJOR_VERSION}.x = $NODE_VERSION"
fi

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