#!/usr/bin/env bash

source "${PROJECT_DIRECTORY}/.evergreen/init-node-and-npm-env.sh"

npx mocha test/s390x/big_endian.test.ts
