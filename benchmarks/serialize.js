const Benchmark = require('benchmark');

const bigboard = require('./data/bigboard.json');
const checkitem = require('./data/checkitem.json');
const serialize = require('../lib/bson').serialize;

new Benchmark.Suite()
  .add('serialize bigboard', function () {
    serialize(bigboard)
  })
  .add('serialize checkitem', function () {
    serialize(checkitem)
  })
  .on('cycle', function (e) {
    const s = String(e.target);
    console.log(s);
  })
  .run();

