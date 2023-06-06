#!/usr/bin/env bash

set -o errexit

source "${PROJECT_DIRECTORY}/.evergreen/init-node-and-npm-env.sh"

cd etc/eslint/no-bigint-usage
npm install
npm run test
