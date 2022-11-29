#! /usr/bin/env bash

# Get the current unique version of this checkout
if [ "${is_patch}" = "true" ]; then
    CURRENT_VERSION=$(git describe)-patch-${version_id}
else
    CURRENT_VERSION=latest
fi
export PROJECT_DIRECTORY="$(pwd)"

get_node_version() {
    local NODE_DOWNLOAD_URI="nodejs.org/download/release/latest-v${NODE_MAJOR_VERSION}.x/SHASUMS256.txt"

    if [ "$NODE_MAJOR_VERSION" == 'latest' ]; then 
        NODE_DOWNLOAD_URI="nodejs.org/download/release/latest/SHASUMS256.txt"
    fi

    # get the latest version of node for given major version
    echo $(curl -sL $NODE_DOWNLOAD_URI -o - | head -n 1 | tr -s ' ' | cut -d' ' -f2 | cut -d- -f2 | cut -dv -f2)
}

NODE_VERSION=$(get_node_version)

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
