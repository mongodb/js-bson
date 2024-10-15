#!/usr/bin/env bash

set -o errexit

source $DRIVERS_TOOLS/.evergreen/init-node-and-npm-env.sh

cd etc/eslint/no-bigint-usage
npm install
npm run test
