#!/bin/bash

 # run setup script
node ./tools/loadTestFiles.js && 

# if no arguments run both tests
if [ $# -eq 0 ]; then

    # run node tests
    mocha ./test/node

    node_exit_code=$?

    # if node exit status not ok, run cleanup and exit with code
    if [[ $node_exit_code != 0 ]] ; then node ./tools/deleteTestFiles.js && exit $node_exit_code ; fi

    # run karma tests
    ./node_modules/karma/bin/karma start karma.conf.js

elif [ $1 = "node" ]; then
    # run node tests
    mocha ./test/node

else 
     # run karma tests
    ./node_modules/karma/bin/karma start karma.conf.js

fi

exit_code=$?

# run cleanup script no matter what
node ./tools/deleteTestFiles.js

# exit with code
exit $exit_code
