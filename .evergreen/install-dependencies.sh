#!/bin/bash
if [ -z "$NODE_VERSION" ]; then
  echo "NODE_VERSION environment variable must be specified"
  exit 1
fi

set -o errexit  # Exit the script with error if any of the commands fail

NODE_ARTIFACTS_PATH="${PROJECT_DIRECTORY}/node-artifacts"
NPM_CACHE_DIR="${NODE_ARTIFACTS_PATH}/npm"
NPM_TMP_DIR="${NODE_ARTIFACTS_PATH}/tmp"
BIN_DIR="$(pwd)/bin"
NVM_URL="https://raw.githubusercontent.com/creationix/nvm/v0.38.0/install.sh"

# this needs to be explicitly exported for the nvm install below
export NVM_DIR="${NODE_ARTIFACTS_PATH}/nvm"

# create node artifacts path if needed
mkdir -p "${NODE_ARTIFACTS_PATH}"
mkdir -p "${NPM_CACHE_DIR}"
mkdir -p "${NPM_TMP_DIR}"
mkdir -p "${BIN_DIR}"
mkdir -p "${NVM_DIR}"

# Add mongodb toolchain to path
export PATH="${BIN_DIR}:${PATH}"

# install Node.js
echo "Installing Node ${NODE_LTS_NAME}"

set +o xtrace

echo "  Downloading nvm"
curl -o- $NVM_URL | bash
[ -s "${NVM_DIR}/nvm.sh" ] && \. "${NVM_DIR}/nvm.sh"

echo "Running: nvm install --lts --latest-npm"
nvm install --lts --latest-npm
echo "Running: nvm install ${NODE_VERSION}"
nvm install "${NODE_VERSION}"
echo "Running: nvm use --lts"
nvm use --lts

set -o xtrace

# install node dependencies
npm install

set +o xtrace
echo "Running: nvm use ${NODE_VERSION}"
nvm use "${NODE_VERSION}" # Switch to the node version we want to test against
echo "Success: switched to node $(node -v)"
set -o xtrace
