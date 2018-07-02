#!/bin/bash

# run node tests
node ./tools/loadTestFiles.js && mocha ./test/node

node_exit_code=$?

# if node exit status not ok, run cleanup and exit with code
if [[ $node_exit_code != 0 ]] ; then node ./tools/deleteTestFiles.js && exit $node_exit_code ; fi

# run karma tests
./node_modules/karma/bin/karma start karma.conf.js

karma_exit_code=$?

# run cleanup script no matter what
node ./tools/deleteTestFiles.js

# exit with code if not ok
if [[ $karma_exit_code != 0 ]] ; then exit $karma_exit_code ; fi
