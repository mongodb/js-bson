#!/bin/bash

# get node version
node_version=$(node --version)

 # run setup script
node ./tools/loadTestFiles.js && 

# if no arguments run both tests
if [ $# -eq 0 ]; then

    # run node tests
    npx mocha ./test/node

    node_exit_code=$?

    # if node exit status not ok, run cleanup and exit with code
    if [[ $node_exit_code != 0 ]] ; then node ./tools/deleteTestFiles.js; exit $node_exit_code ; fi

    # check if Node version > 4.x.x
    if [[ $node_version != v4* ]] ; then
      # run karma tests
      ./node_modules/karma/bin/karma start karma.conf.js
    else 
      echo "Karma tests skipped; Node version 4 not supported"
    fi

elif [ $1 = "node" ]; then
    # run node tests
    npx mocha ./test/node

elif [[ $node_version == v4* ]]; then
    echo "Karma tests not supported on Node version 4.x.x. Use a higher version of Node."

else
     # run karma tests
    ./node_modules/karma/bin/karma start karma.conf.js

fi

exit_code=$?

# run cleanup script no matter what
node ./tools/deleteTestFiles.js &&

# exit with code
exit $exit_code
