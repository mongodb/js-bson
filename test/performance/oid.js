'use strict';

const BSON = require('../../lib/bson.js');

let BSONv1Lib;
try {
  BSONv1Lib = require('../../node_modules/bsonv1');
} catch (error) {
  console.log('Please run: \nnpm install --no-save bsonv1@npm:bson@1');
  process.exit(1);
}

const BSONv1 = { ...BSONv1Lib.prototype, ...BSONv1Lib };

const { performance } = require('perf_hooks');

const ITERATIONS = 50000;

const documents = Array.from({ length: 50000 }, () =>
  BSON.serialize({ _id: new BSON.ObjectId(), field1: 'value1' })
);

function average(array) {
  let sum = 0;
  for (const value of array) sum += value;
  return sum / array.length;
}

function testPerformance(fn, iterations = ITERATIONS) {
  let measurements = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn(i);
    const end = performance.now();
    measurements.push(end - start);
  }
  return average(measurements);
}

console.log(
  `BSON v4 { oid, string } ${testPerformance(i =>
    BSON.deserialize(documents[i], { validation: { utf8: false } })
  )}ms`
);
console.log(`BSON v1 { oid, string } ${testPerformance(i => BSONv1.deserialize(documents[i]))}ms`);

const oidBuffer = Buffer.from('00'.repeat(12), 'hex');
console.log(`BSON v4 oid ${testPerformance(() => new BSON.ObjectId(oidBuffer))}ms`);
console.log(`BSON v1 oid ${testPerformance(() => new BSONv1.ObjectId(oidBuffer))}ms`);
