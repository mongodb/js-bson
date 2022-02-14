const Benchmark = require('benchmark');

const bigboard = require('./bigboard.json');
const serialize = require('../lib/bson').serialize;
const deserialize = require('../lib/bson').deserialize;

const data = serialize(bigboard);

new Benchmark.Suite()
  .add('deserialize', function() {
    deserialize(data)
  })
  .on('cycle', function(e) {
    const s = String(e.target);
    console.log(s);
  })
  .run();

