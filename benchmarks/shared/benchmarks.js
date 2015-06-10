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
  // Benchmark: Serialize {'hello': 'world', n: 0, doc: { a: 1}}
  //
  var doc2 = {'hello': 'world', n: 0, doc: { a: 1, b: { 'hello': 'again' }}};

  benchmarks.push(Benchmark("{'hello': 'world', n: 0, doc: { a: 1, b: { 'hello': 'again' }}}", function() {
    bson.serialize(doc2, true);
  }, options)); 

  // Export Benchmarks
  return benchmarks;  
}
