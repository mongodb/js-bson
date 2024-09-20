#! /usr/bin/env bash

# Only set errexit and xtrace if shell is NOT interactive
[[ $- == *i* ]] || set -o xtrace
[[ $- == *i* ]] || set -o errexit

export PROJECT_DIRECTORY="$(pwd)"
export DRIVERS_TOOLS="$PROJECT_DIRECTORY/.drivers-tools"



if [ ! -d "$DRIVERS_TOOLS" ]; then
  # Only clone driver tools if it does not exist
  git clone --depth=1 "https://github.com/mongodb-labs/drivers-evergreen-tools.git" "${DRIVERS_TOOLS}"
fi

echo "installed DRIVERS_TOOLS from commit $(git -C "${DRIVERS_TOOLS}" rev-parse HEAD)"

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
