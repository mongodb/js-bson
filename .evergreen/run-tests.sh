#!/bin/bash
if [ -z "$NODE_VERSION" ]; then
  echo "NODE_VERSION environment variable must be specified"
  exit 1
fi

NODE_ARTIFACTS_PATH="${PROJECT_DIRECTORY}/node-artifacts"

if [ "$OS" == "Windows_NT" ]; then
    export NVM_HOME=`cygpath -w "$NODE_ARTIFACTS_PATH/nvm"`
    export NVM_SYMLINK=`cygpath -w "$NODE_ARTIFACTS_PATH/bin"`
    export PATH=`cygpath $NVM_SYMLINK`:`cygpath $NVM_HOME`:$PATH
else
    export PATH="/opt/mongodbtoolchain/v2/bin:$PATH"
    export NVM_DIR="${NODE_ARTIFACTS_PATH}/nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

case $1 in
  "node")
    npm run lint && npm run test-node
    ;;
  "browser")
    npm run lint && npm run test-browser
    ;;
  *)
    npm test
    ;;
esac
