var Decimal128 = require('../../lib/bson/Decimal128');
var NAN = new Buffer([0x7c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
var INF_NEGATIVE_BUFFER = new Buffer([0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
var INF_POSITIVE_BUFFER = new Buffer([0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

/**
 * @ignore
 */
exports['fromString invalid input'] = function(test) {
  var result = Decimal128.fromString('.');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('.e');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('invalid');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('in');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('i');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('E02');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('..1');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('1abcede');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('1.24abc');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('1.24abcE+02');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('1.24E+02abc2d');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('E+02');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('e+02');
  test.deepEqual(NAN, result.bytes);
  test.done();
}

exports['fromString NaN input'] = function(test) {
  var result = Decimal128.fromString('NaN');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('+NaN');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('-NaN');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('-nan');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('1e');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('+nan');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('nan');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('Nan');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('+Nan');
  test.deepEqual(NAN, result.bytes);
  var result = Decimal128.fromString('-Nan');
  test.deepEqual(NAN, result.bytes);
  test.done();
}

exports['fromString infinity input'] = function(test) {
  var result = Decimal128.fromString('Infinity');
  test.deepEqual(INF_POSITIVE_BUFFER, result.bytes);
  var result = Decimal128.fromString('+Infinity');
  test.deepEqual(INF_POSITIVE_BUFFER, result.bytes);
  var result = Decimal128.fromString('+Inf');
  test.deepEqual(INF_POSITIVE_BUFFER, result.bytes);
  var result = Decimal128.fromString('-Inf');
  test.deepEqual(INF_NEGATIVE_BUFFER, result.bytes);
  var result = Decimal128.fromString('-Infinity');
  test.deepEqual(INF_NEGATIVE_BUFFER, result.bytes);
  test.done();
}

exports['fromString simple'] = function(test) {
  // Create decimal from string value 1
  var result = Decimal128.fromString("1");
  var bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse());
  test.deepEqual(bytes, result.bytes);


  console.log("======================================= 0")
  console.dir(bytes)
  console.log("======================================= 1")
  console.dir(result)

  test.done();
}
