'use strict';

const fs = require('fs');
const path = require('path');

const scenarios = fs
  .readdirSync(path.join(__dirname, '../test/node/specs/bson-corpus'))
  .filter(x => x.indexOf('json') !== -1)
  .map(x =>
    JSON.parse(fs.readFileSync(path.join(__dirname, '../test/node/specs/bson-corpus', x), 'utf8'))
  );

fs.writeFile('./tools/scenarios.json', JSON.stringify(scenarios, null, 2), function(err) {
  if (err) {
    return console.log(err);
  }
});

// const gsWeirdBugData = fs.readFileSync('test/node/data/test_gs_weird_bug.png', 'binary');

// fs.writeFile('./tools/gsWeirdBugData.bson', gsWeirdBugData, 'binary', function(err) {
//   if (err) {
//     return console.log(err);
//   }
// });
