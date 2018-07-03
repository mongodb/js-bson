'use strict';

const fs = require('fs');
const paths = ['./tools/scenarios.json', './tools/gsWeirdBugData.json'];

paths.forEach(path => {
  fs.stat(path, function(err) {
    if (err) {
      console.error(err.message);
      process.exit(1);
    }
    fs.unlink(path, function(err) {
      if (err) {
        console.error(err.message);
        process.exit(1);
      }
    });
  });
});
