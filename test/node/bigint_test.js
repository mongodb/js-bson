/* globals BigInt */
'use strict';

var createBSON = require('../utils');
var BSON = require('../..');
var bson = createBSON();

try {
  BigInt(0);

  // will throw on the line above if BigInt is not supported in the runtime

  exports['Should error on serialize bigint'] = function (test) {
    var testDoc = { b: BigInt(32) };
    try {
      bson.serialize(testDoc)
      test.ok(false);
    } catch (error) {
      test.ok(error instanceof TypeError);
      test.ok(error.message === 'Unsupported type BigInt, please use Decimal128');
    }
    test.done();
  };

  exports['Should error on serialize bigint inside array'] = function (test) {
    var testDoc = { b: [0, 1, BigInt(0x1ffffffff)] };
    try {
      bson.serialize(testDoc)
      test.ok(false);
    } catch (error) {
      test.ok(error instanceof TypeError);
      test.ok(error.message === 'Unsupported type BigInt, please use Decimal128');
    }
    test.done();
  };

  exports['Should error on serialize bigint inside subdocument'] = function (test) {
    var testDoc = { b: { a: BigInt(0x1ffffffff) } };
    try {
      bson.serialize(testDoc)
      test.ok(false);
    } catch (error) {
      test.ok(error instanceof TypeError);
      test.ok(error.message === 'Unsupported type BigInt, please use Decimal128');
    }
    test.done();
  };

  exports['Should support conversion on Long type'] = function (test) {
    var long = BSON.Long.fromBigInt(BigInt(200));
    test.ok(long._bsontype === 'Long');
    test.ok(long.toNumber() === 200);
    test.ok(long.toBigInt() === BigInt(200));
    test.done();
  }

} catch (_) {
  // 'JS VM does not support BigInt'
}
