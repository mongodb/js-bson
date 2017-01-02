var BSON = require('../..');
var ObjectId = BSON.ObjectID;

/**
 * @ignore
 */
exports['should correctly handle objectId timestamps'] = function(test) {
  // var test_number = {id: ObjectI()};
  var a = ObjectId.createFromTime(1);
  test.deepEqual(new Buffer([0, 0, 0, 1]), a.id.slice(0, 4));
  test.equal(1000, a.getTimestamp().getTime())

  var b = new ObjectId();
  b.generationTime = 1;
  test.deepEqual(new Buffer([0, 0, 0, 1]), b.id.slice(0, 4));
  test.equal(1, b.generationTime);
  test.equal(1000, b.getTimestamp().getTime())

  test.done();
}

/**
 * @ignore
 */
exports['should correctly create ObjectId from uppercase hexstring'] = function(test) {
  var a = 'AAAAAAAAAAAAAAAAAAAAAAAA';
  var b = new ObjectId(a);
  var c = b.equals(a); // => false
  test.equal(true, c);

  var a = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  var b = new ObjectId(a);
  var c = b.equals(a); // => true
  test.equal(true, c);
  test.equal(a, b.toString());

  test.done();
}

/**
 * @ignore
 */
exports['should correctly create ObjectId from Buffer'] = function(test) {
  if(!Buffer.from) return test.done();
  var a = 'AAAAAAAAAAAAAAAAAAAAAAAA';
  var b = new ObjectId(Buffer.from(a, 'hex'));
  var c = b.equals(a); // => false
  test.equal(true, c);

  var a = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  var b = new ObjectId(Buffer.from(a, 'hex'));
  var c = b.equals(a); // => true
  test.equal(a, b.toString());
  test.equal(true, c);
  test.done();
}
