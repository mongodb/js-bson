'use strict';
const fs = require('fs');

const filepath = './tools/scenarios.json';

fs.stat(filepath, function(err) {
  if (err) {
    return console.error(err);
  }
  fs.unlink(filepath, function(err) {
    if (err) return console.log(err);
  });
});
