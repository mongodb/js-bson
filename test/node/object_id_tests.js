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
