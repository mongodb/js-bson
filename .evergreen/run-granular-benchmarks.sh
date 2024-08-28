#!/usr/bin/env bash

if [[ -z "${PROJECT_DIRECTORY}" ]]; then echo "PROJECT_DIRECTORY is unset" && exit 1; fi
source "${PROJECT_DIRECTORY}/.evergreen/init-node-and-npm-env.sh"

set -o xtrace
WARMUP=$WARMUP
ITERATIONS=$ITERATIONS

WARMUP=$WARMUP ITERATIONS=$ITERATIONS LIBRARY=$PROJECT_DIRECTORY npm run check:granular-bench
