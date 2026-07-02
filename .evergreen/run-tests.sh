#!/usr/bin/env bash

source $DRIVERS_TOOLS/.evergreen/init-node-and-npm-env.sh

case "${TEST_TARGET}" in
  "node")
    npm run check:coverage
    ;;
  "web")
    export WEB="true"
    npm run check:web
    ;;
  *)
    npm test
    ;;
esac
