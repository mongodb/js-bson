#!/usr/bin/env bash

source $DRIVERS_TOOLS/.evergreen/init-node-and-npm-env.sh

npx mocha test/s390x/big_endian.test.ts
