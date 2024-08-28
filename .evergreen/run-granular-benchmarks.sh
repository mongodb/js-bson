#!/usr/bin/env bash

source "${PROJECT_DIRECTORY}/.evergreen/init-node-and-npm-env.sh"
set -o xtrace

export LIBRARY=$PWD

if ! npm run build; then exit 1; fi

npm run check:spec-bench

WARMUP=$WARMUP
ITERATIONS=$ITERATIONS

WARMUP=$WARMUP ITERATIONS=$ITERATIONS npm run check:granular-bench
