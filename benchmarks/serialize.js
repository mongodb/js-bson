const Benchmark = require('benchmark');

const bigboard = require('./bigboard.json');
const serialize = require('../lib/bson').serialize;


new Benchmark.Suite()
  .add('serialize', function() {
    serialize(bigboard)
  })
  .on('cycle', function(e) {
    const s = String(e.target);
    console.log(s);
  })
  .run();

