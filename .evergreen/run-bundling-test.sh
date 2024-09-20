#! /usr/bin/env bash

source ./.drivers-tools/.evergreen/init-node-and-npm-env.sh

set -o xtrace
set -o errexit

pushd test/bundling/webpack

npm install
npm run install:bson
npm run build
