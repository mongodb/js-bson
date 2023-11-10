#!/usr/bin/env bash

source "${PROJECT_DIRECTORY}/.evergreen/init-node-and-npm-env.sh"
WARMUP=$WARMUP
ITERATIONS=$ITERATIONS

WARMUP=$WARMUP ITERATIONS=$ITERATIONS npm run check:granular-bench
