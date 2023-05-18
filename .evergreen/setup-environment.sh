#! /usr/bin/env bash

if [ -z "$NODE_LTS_VERSION" ]; then
  echo "NODE_LTS_VERSION environment variable must be specified"
  exit 1
fi

# Get the current unique version of this checkout
if [ "${is_patch}" = "true" ]; then
    CURRENT_VERSION=$(git describe)-patch-${version_id}
else
    CURRENT_VERSION=latest
fi
export PROJECT_DIRECTORY="$(pwd)"

cat <<EOT > expansion.yml
CURRENT_VERSION: "$CURRENT_VERSION"
PROJECT_DIRECTORY: "$PROJECT_DIRECTORY"
NODE_LTS_VERSION: "$NODE_LTS_VERSION"
PREPARE_SHELL: |
    set -o errexit
    set -o xtrace
    export PROJECT_DIRECTORY="$PROJECT_DIRECTORY"
    export NODE_LTS_VERSION="$NODE_LTS_VERSION"
EOT
# See what we've done
cat expansion.yml
