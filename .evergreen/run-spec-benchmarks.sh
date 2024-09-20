#!/usr/bin/env bash

source ./.drivers-tools/.evergreen/init-node-and-npm-env.sh

npm run check:spec-bench
