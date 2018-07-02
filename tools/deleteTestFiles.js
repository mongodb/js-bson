'use strict';

const fs = require('fs');
const paths = ['./tools/scenarios.json', './tools/gsWeirdBugData.json'];
let count = 0;

paths.forEach(path => {
  fs.stat(path, function(err) {
    if (err) {
      return console.error(err);
    }
    fs.unlink(path, function(err) {
      if (err) return console.log(err);
      count += 1;
      if (count === 2) {
        if (process.argv[2]) {
          process.exit(1);
        }
      }
    });
  });
});
