#!/usr/bin/env bash

source "${PROJECT_DIRECTORY}/.evergreen/init-node-and-npm-env.sh"

case $1 in
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
