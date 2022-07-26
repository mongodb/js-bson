#! /usr/bin/env bash

export PATH="/opt/mongodbtoolchain/v2/bin:$PATH"
NODE_ARTIFACTS_PATH="${PROJECT_DIRECTORY}/node-artifacts"
export NVM_DIR="${NODE_ARTIFACTS_PATH}/nvm"

[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

export NODE_OPTIONS="--trace-deprecation --trace-warnings"
