#!/usr/bin/env bash

source $DRIVERS_TOOLS/.evergreen/init-node-and-npm-env.sh

set -euxo pipefail

npm run check:spec-bench
