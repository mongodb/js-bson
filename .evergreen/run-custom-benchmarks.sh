#!/usr/bin/env bash

source ./.drivers-tools/.evergreen/init-node-and-npm-env.sh
set -o xtrace

npm run check:custom-bench
