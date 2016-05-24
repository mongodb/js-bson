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

  // Create decimal from string value 0
  var result = Decimal128.fromString("0");
  var bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value -0
  var result = Decimal128.fromString("-0");
  var bytes = new Buffer([0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value -1
  var result = Decimal128.fromString("-1");
  var bytes = new Buffer([0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 12345678901234567
  var result = Decimal128.fromString("12345678901234567");
  var bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x2b, 0xdc, 0x54, 0x5d, 0x6b, 0x4b, 0x87].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 989898983458
  var result = Decimal128.fromString("989898983458");
  var bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0xe6, 0x7a, 0x93, 0xc8, 0x22].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value -12345678901234567
  var result = Decimal128.fromString("-12345678901234567");
  var bytes = new Buffer([0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x2b, 0xdc, 0x54, 0x5d, 0x6b, 0x4b, 0x87].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 0.12345
  var result = Decimal128.fromString("0.12345");
  var bytes = new Buffer([0x30, 0x36, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x39].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 0.0012345
  var result = Decimal128.fromString("0.0012345");
  var bytes = new Buffer([0x30, 0x32, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x39].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 00012345678901234567
  var result = Decimal128.fromString("00012345678901234567");
  var bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x2b, 0xdc, 0x54, 0x5d, 0x6b, 0x4b, 0x87].reverse());
  test.deepEqual(bytes, result.bytes);
  test.done();
}

exports['fromString scientific format'] = function(test) {
  // Create decimal from string value 10e0
  var result = Decimal128.fromString("10e0");
  var bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0a].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 1e1
  var result = Decimal128.fromString("1e1");
  var bytes = new Buffer([0x30, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 10e-1
  var result = Decimal128.fromString("10e-1");
  var bytes = new Buffer([0x30, 0x3e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0a].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 12345678901234567e6111
  var result = Decimal128.fromString("12345678901234567e6111");
  var bytes = new Buffer([0x5f, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x2b, 0xdc, 0x54, 0x5d, 0x6b, 0x4b, 0x87].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 1e-6176
  var result = Decimal128.fromString("1e-6176");
  var bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value "-100E-10
  var result = Decimal128.fromString("-100E-10");
  var bytes = new Buffer([0xb0, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x64].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 10.50E8
  var result = Decimal128.fromString("10.50E8");
  var bytes = new Buffer([0x30, 0x4c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x1a].reverse());
  test.deepEqual(bytes, result.bytes);

  // console.log("======================================= 0")
  // console.dir(bytes)
  // console.log("======================================= 1")
  // console.dir(result)

  test.done();
}
