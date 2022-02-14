const Benchmark = require('benchmark');

const bigboard = require('./bigboard.json');
const checkitem = require('./checkitem.json');
const serialize = require('../lib/bson').serialize;
const deserialize = require('../lib/bson').deserialize;

const bigboardBSON = serialize(bigboard);
const checkitemBSON = serialize(checkitem);

new Benchmark.Suite()
  .add('deserialize bigboard', function () {
    deserialize(bigboardBSON)
  })
  .add('deserialize checkitem', function () {
    deserialize(checkitemBSON)
  })
  .on('cycle', function (e) {
    const s = String(e.target);
    console.log(s);
  })
  .run();

