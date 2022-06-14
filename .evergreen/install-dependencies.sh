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
NVM_WINDOWS_URL="https://github.com/coreybutler/nvm-windows/releases/download/1.1.9/nvm-noinstall.zip"
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
if [ "$OS" == "Windows_NT" ]; then
  set +o xtrace

  export NVM_HOME=`cygpath -w "$NVM_DIR"`
  export NVM_SYMLINK=`cygpath -w "$NODE_ARTIFACTS_PATH/bin"`
  export PATH=`cygpath $NVM_SYMLINK`:`cygpath $NVM_HOME`:$PATH

  # download and install nvm
  curl -L $NVM_WINDOWS_URL -o nvm.zip
  unzip -d $NVM_DIR nvm.zip
  rm nvm.zip

  chmod 777 $NVM_DIR
  chmod -R a+rx $NVM_DIR

  cat <<EOT > $NVM_DIR/settings.txt
root: $NVM_HOME
path: $NVM_SYMLINK
EOT

  echo "Running: nvm install lts"
  nvm install lts
  echo "Running: nvm install ${NODE_VERSION}"
  nvm install "${NODE_VERSION}"
  echo "Running: nvm use lts"
  nvm use lts
  echo "Running: npm install -g npm@8.3.1"
  npm install -g npm@8.3.1 # https://github.com/npm/cli/issues/4341
  set -o xtrace
else
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
fi



# setup npm cache in a local directory
cat <<EOT > .npmrc
devdir=${NPM_CACHE_DIR}/.node-gyp
init-module=${NPM_CACHE_DIR}/.npm-init.js
cache=${NPM_CACHE_DIR}
tmp=${NPM_TMP_DIR}
registry=https://registry.npmjs.org
EOT

# install node dependencies
npm install # npm prepare runs after install and will compile the library
nvm use "${NODE_VERSION}" # Switch to the node version we want to test against
