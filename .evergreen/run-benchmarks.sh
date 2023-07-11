#!/usr/bin/env bash

source "${PROJECT_DIRECTORY}/.evergreen/init-node-and-npm-env.sh"

case $1 in
  "node")
    export WEB=false
    npm run check:bench
    ;;
  "web")
    export WEB=true
    npm run check:bench
    ;;
  *)
    echo 'Must specify environment as "web" or "node"'
    exit 1
    ;;
esac


