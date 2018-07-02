'use strict';

const fs = require('fs');
const paths = ['./tools/scenarios.json', './tools/gsWeirdBugData.json'];

paths.forEach(path => {
  fs.stat(path, function(err) {
    if (err) {
      return console.error(err);
    }
    fs.unlink(path, function(err) {
      if (err) return console.log(err);
    });
  });
});
