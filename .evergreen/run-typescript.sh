#!/usr/bin/env bash
set -o errexit # Exit the script with error if any of the commands fail

source "${PROJECT_DIRECTORY}/.evergreen/init-nvm.sh"

set -o xtrace

function get_current_ts_version {
    node -e "console.log(require('./package-lock.json').packages['node_modules/typescript'].version)"
}

CURRENT_TS_VERSION=$(get_current_ts_version)

export TSC="./node_modules/typescript/bin/tsc"
export TS_VERSION=${TS_VERSION:=$CURRENT_TS_VERSION}

# On old versions of TS we need to put the node types back to 18.11.19
npm install --no-save --force typescript@"$TS_VERSION" "$(if [[ $TS_VERSION == '4.1.6' ]]; then echo "@types/node@18.11.19"; else echo ""; fi)"

echo "Typescript $($TSC -v)"

# check resolution uses the default latest types
echo "import * as BSON from '.'" > file.ts && node $TSC --noEmit --traceResolution file.ts | grep 'bson.d.ts' && rm file.ts

# check compilation
rm -rf node_modules/@types/eslint # not a dependency we use, but breaks the build :(
node $TSC bson.d.ts

if [[ $TRY_COMPILING_LIBRARY != "false" ]]; then
    npm run build:ts
fi
