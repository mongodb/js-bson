#!/usr/bin/env bash

source $DRIVERS_TOOLS/.evergreen/init-node-and-npm-env.sh
set -o xtrace
TARGET_FILE=$TARGET_FILE

node ./.evergreen/perf_send.mjs $TARGET_FILE
