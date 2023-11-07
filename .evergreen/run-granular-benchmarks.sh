#!/usr/bin/env bash

source "${PROJECT_DIRECTORY}/.evergreen/init-node-and-npm-env.sh"

export WARMUP=1
export ITERATIONS=100
npm run check:bench-granular
