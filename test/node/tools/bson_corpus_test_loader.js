'use strict';

const path = require('path');
const fs = require('fs');

function findScenarios() {
  return fs
    .readdirSync(path.join(__dirname, '../specs/bson-corpus'))
    .filter(x => x.indexOf('json') !== -1)
    .map(x => JSON.parse(fs.readFileSync(path.join(__dirname, '../specs/bson-corpus', x), 'utf8')));
}

module.exports = findScenarios();
