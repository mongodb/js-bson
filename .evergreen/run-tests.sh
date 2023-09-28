#!/usr/bin/env bash

source "${PROJECT_DIRECTORY}/.evergreen/init-node-and-npm-env.sh"

case $1 in
  "node")
    npm run test-node
    ;;
  "browser")
    npm run test-browser
    ;;
  *)
    npm test
    ;;
esac
