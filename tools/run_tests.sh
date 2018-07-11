#!/bin/bash

# node path variable
node=node

# get node version
node_version=$($node --version)

# if no arguments run both tests
if [ $# -eq 0 ]; then

    # run node tests
    mocha ./test/node &&

    # check if Node version > 4.x.x
    if [[ $node_version != v4* ]] ; then
      # run karma tests
      ./node_modules/karma/bin/karma start karma.conf.js
    else 
      echo "Karma tests skipped; Node version 4 not supported"
    fi

elif [ $1 = "node" ]; then
    # run node tests
    mocha ./test/node

elif [[ $node_version == v4* ]]; then
    echo "Karma tests not supported on Node version 4.x.x. Use a higher version of Node."

else
     # run karma tests
    ./node_modules/karma/bin/karma start karma.conf.js

fi
