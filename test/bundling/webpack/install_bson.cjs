'use strict';

const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const xtrace = (...args) => {
  console.log(`running: ${args[0]}`);
  return execSync(...args);
};

const bsonRoot = resolve(__dirname, '../../..');
console.log(`bson package root: ${bsonRoot}`);

const bsonVersion = JSON.parse(
  readFileSync(resolve(bsonRoot, 'package.json'), { encoding: 'utf8' })
).version;
console.log(`bsonVersion: ${bsonVersion}`);

xtrace('npm pack --pack-destination test/bundling/webpack', { cwd: bsonRoot });

xtrace(`npm install --no-save bson-${bsonVersion}.tgz`);

console.log('bson installed!');
