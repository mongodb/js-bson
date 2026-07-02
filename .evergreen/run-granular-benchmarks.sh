#!/usr/bin/env bash

source $DRIVERS_TOOLS/.evergreen/init-node-and-npm-env.sh

set -euxo pipefail

export WARMUP=$WARMUP
export ITERATIONS=$ITERATIONS

npm run check:granular-bench
