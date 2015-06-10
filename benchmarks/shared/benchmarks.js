var Benchmark = require('benchmark');

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

  // Export Benchmarks
  return benchmarks;  
}
