var libDir = '../../lib/bson';

var Benchmark = require('benchmark'),
  f = require('util').format
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

// Contains all the benchmarks
var Benchmarks = require('../shared/benchmarks');

// Get the parser
var BSON = require(f('%s/../../alternate_parsers/bson', __dirname)).BSON;

// Create a serializer
var bson = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]);

// Export Benchmarks
module.exports = new Benchmarks(bson);
