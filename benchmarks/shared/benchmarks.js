var libDir = '../../lib/bson',
  Benchmark = require('benchmark'),
  Long = require(libDir).Long,
  ObjectID = require(libDir).ObjectID,
  Binary = require(libDir).Binary,
  Code = require(libDir).Code,
  DBRef = require(libDir).DBRef,
  Symbol = require(libDir).Symbol,
  Double = require(libDir).Double,
  MaxKey = require(libDir).MaxKey,
  MinKey = require(libDir).MinKey,
  Timestamp = require(libDir).Timestamp;

module.exports = function(bson) {
  var benchmarks = [];
  var options = {initCount: 1000};

  //
  // Benchmark: Serialize {'hello': 'world', n: 0}
  //
  var doc0 = {'hello': 'world', n: 0};

  benchmarks.push(Benchmark("{'hello': 'world', n: 0}", function() {
    bson.serialize(doc0, true);
  }, options));

  //
  // Benchmark: Serialize {'hello': 'world', n: 0, doc: { a: 1}}
  //
  var doc1 = {'hello': 'world', n: 0, doc: { a: 1}};

  benchmarks.push(Benchmark("{'hello': 'world', n: 0, doc: { a: 1}}", function() {
    bson.serialize(doc1, true);
  }, options));

  //
  // Benchmark: Serialize {'hello': 'world', n: 0, doc: { a: 1, b: { 'hello': 'again' }}};
  //
  var doc2 = {'hello': 'world', n: 0, doc: { a: 1, b: { 'hello': 'again' }}};

  benchmarks.push(Benchmark("{'hello': 'world', n: 0, doc: { a: 1, b: { 'hello': 'again' }}}", function() {
    bson.serialize(doc2, true);
  }, options));

  //
  // Benchmark: Serialize {'hello': 'world', n: 0, doc: { a: 1, b: { 'hello': 'again' }}};
  //
  var doc3 = {'hello': 'world', n: 0,  a: 1, c: 1, 'hello1': 'again' };

  benchmarks.push(Benchmark("{'hello': 'world', n: 0,  a: 1, c: 1, 'hello1': 'again' }", function() {
    bson.serialize(doc3, true);
  }, options));

  // Pre serialized results
  var doc0serialize = bson.serialize(doc0, true);
  var doc1serialize = bson.serialize(doc1, true);
  var doc2serialize = bson.serialize(doc2, true);

  // //
  // // Benchmark: DeSerialize {'hello': 'world', n: 0}
  // //
  // benchmarks.push(Benchmark("deserialize {'hello': 'world', n: 0}", function() {
  //   bson.deserialize(doc0serialize);
  // }, options));

  // //
  // // Benchmark: DeSerialize {'hello': 'world', n: 0, doc: { a: 1}}
  // //
  // benchmarks.push(Benchmark("deserialize {'hello': 'world', n: 0, doc: { a: 1}}", function() {
  //   bson.deserialize(doc1serialize);
  // }, options));

  // //
  // // Benchmark: DeSerialize {'hello': 'world', n: 0, doc: { a: 1}}
  // //
  // benchmarks.push(Benchmark("deserialize {'hello': 'world', n: 0, doc: { a: 1, b: { 'hello': 'again' }}}", function() {
  //   bson.deserialize(doc2serialize);
  // }, options));

  // Export Benchmarks
  return benchmarks;
}
