var Benchmarks = require('../shared/benchmarks'),
  mod = require('../../alternate_parsers/faster_bson');

// Create a serializer
var bson = {
  serialize: mod.serialize,
  deserialize: mod.deserializeFast
};

// Export Benchmarks
module.exports = new Benchmarks(bson);
