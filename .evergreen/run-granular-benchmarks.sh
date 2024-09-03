#!/usr/bin/env bash

source "${PROJECT_DIRECTORY}/.evergreen/init-node-and-npm-env.sh"
set -o xtrace
WARMUP=$WARMUP
ITERATIONS=$ITERATIONS

WARMUP=$WARMUP ITERATIONS=$ITERATIONS LIBRARY=$(pwd) npm run check:granular-bench
