'use strict';

const BSON = require('../../lib/bson.js');
const BSONv1 = require('bson');
const { performance } = require('perf_hooks');

const ITERATIONS = 50000;

const documents = Array.from({ length: 50000 })
  .fill(null)
  .map(() => BSON.serialize({ _id: new BSON.ObjectId(), field1: 'value1' }));

function average(array) {
  let sum = array.reduce((acc, item) => (acc += item), 0);
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

// console.log(`BSON v4 ${testPerformance(i => BSON.deserialize(documents[i]))}ms`);
// console.log(`BSON v1 ${testPerformance(i => BSONv1.prototype.deserialize(documents[i]))}ms`);

const oidBuffer = Buffer.from('00'.repeat(12), 'hex');
console.log(`BSON v4 OID ${testPerformance(() => new BSON.ObjectId(oidBuffer))}ms`);
console.log(`BSON v1 OID ${testPerformance(() => new BSONv1.ObjectId(oidBuffer))}ms`);
