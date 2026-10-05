#!/usr/bin/env bash
set -o errexit  # Exit the script with error if any of the commands fail

# allowed values:
## a nodejs major version (i.e., 16)
## 'latest'
## a full nodejs version, in the format v<major>.<minor>.patch
export NODE_LTS_VERSION=${NODE_LTS_VERSION:-20.19.0}
# Use the npm bundled with the installed Node.js release instead of upgrading to
# npm@latest. The bundled npm is version-matched to the Node release; upgrading to
# npm@latest (currently 12) breaks `npm install` of git dependencies (EALLOWGIT).
# TODO(NODE-7677): revisit disabling the npm upgrade once our git dependency
# (dbx-js-tools) can be installed under npm 12 — e.g. by publishing bson-bench to a
# registry — at which point we can drop this flag and test on npm@latest again.
export SKIP_NPM_UPGRADE=true
source $DRIVERS_TOOLS/.evergreen/install-node.sh

npm install "${NPM_OPTIONS}"

npm ls
