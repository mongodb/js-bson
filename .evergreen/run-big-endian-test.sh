#!/usr/bin/env bash

source ./.drivers-tools/.evergreen/init-node-and-npm-env.sh

npx mocha test/s390x/big_endian.test.ts
