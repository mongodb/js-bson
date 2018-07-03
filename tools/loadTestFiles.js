'use strict';

const fs = require('fs');
const path = require('path');
const gsWeirdBugData = fs.readFileSync('test/node/data/test_gs_weird_bug.png', 'binary');
const bugDataObj = { data: gsWeirdBugData };

const scenarios = fs
  .readdirSync(path.join(__dirname, '../test/node/specs/bson-corpus'))
  .filter(x => x.indexOf('json') !== -1)
  .map(x =>
    JSON.parse(fs.readFileSync(path.join(__dirname, '../test/node/specs/bson-corpus', x), 'utf8'))
  );

fs.writeFile('./tools/scenarios.json', JSON.stringify(scenarios, null, 2), function(err) {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
});

fs.writeFile('./tools/gsWeirdBugData.json', JSON.stringify(bugDataObj, null, 2), function(err) {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
});
