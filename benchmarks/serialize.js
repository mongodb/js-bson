const Benchmark = require('benchmark');

const bigboard = require('./bigboard.json');
const checkitem = require('./checkitem.json');
const serialize = require('../lib/bson').serialize;

// while(true) {
//   serialize(checkitem)
// }

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

