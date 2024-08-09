#!/usr/bin/env bash

source "${PROJECT_DIRECTORY}/.evergreen/init-node-and-npm-env.sh"
set -o xtrace
WARMUP=$WARMUP
ITERATIONS=$ITERATIONS

LIBRARY=$(git rev-parse --short HEAD) WARMUP=$WARMUP ITERATIONS=$ITERATIONS npm run check:granular-bench
