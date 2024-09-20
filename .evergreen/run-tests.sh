#!/usr/bin/env bash

source ./.drivers-tools/.evergreen/init-node-and-npm-env.sh

case "${TEST_TARGET}" in
  "node")
    npm run check:coverage
    ;;
  "web")
    export WEB="true"
    export NO_BIGINT="${NO_BIGINT:-false}"
    npm run check:web
    ;;
  *)
    npm test
    ;;
esac
