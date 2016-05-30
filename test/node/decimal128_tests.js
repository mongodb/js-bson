var Decimal128 = require('../../lib/bson/decimal128');
var NAN = new Buffer([0x7c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
var INF_NEGATIVE_BUFFER = new Buffer([0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
var INF_POSITIVE_BUFFER = new Buffer([0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());

var shouldFail = function() {
  try {

  } catch(e) {
    return false
  }
}

/**
 * @ignore
 */
exports['fromString invalid input'] = function(test) {
  test.throws(function() { Decimal128.fromString('E02'); });
  test.throws(function() { Decimal128.fromString('E+02'); });
  test.throws(function() { Decimal128.fromString('e+02'); });
  test.throws(function() { Decimal128.fromString('.'); });
  test.throws(function() { Decimal128.fromString('.e'); });
  test.throws(function() { Decimal128.fromString(''); });
  test.throws(function() { Decimal128.fromString('invalid'); });
  test.throws(function() { Decimal128.fromString('in'); });
  test.throws(function() { Decimal128.fromString('i'); });
  test.throws(function() { Decimal128.fromString('..1'); });
  test.throws(function() { Decimal128.fromString('1abcede'); });
  test.throws(function() { Decimal128.fromString('1.24abc'); });
  test.throws(function() { Decimal128.fromString('1.24abcE+02'); });
  test.throws(function() { Decimal128.fromString('1.24E+02abc2d'); });
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
  test.done();
}

exports['fromString large format'] = function(test) {
  // Create decimal from string value 12345689012345789012345
  var result = Decimal128.fromString("12345689012345789012345");
  var bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x02, 0x9d
    , 0x42, 0xda, 0x3a, 0x76, 0xf9, 0xe0, 0xd9, 0x79].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 1234567890123456789012345678901234
  var result = Decimal128.fromString("1234567890123456789012345678901234");
  var bytes = new Buffer([0x30, 0x40, 0x3c, 0xde, 0x6f, 0xff, 0x97, 0x32
    , 0xde, 0x82, 0x5c, 0xd0, 0x7e, 0x96, 0xaf, 0xf2].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 9.999999999999999999999999999999999E+6144
  var result = Decimal128.fromString("9.999999999999999999999999999999999E+6144");
  var bytes = new Buffer([0x5f, 0xff, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0
    , 0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff, 0xff].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 9.999999999999999999999999999999999E-6143
  var result = Decimal128.fromString("9.999999999999999999999999999999999E-6143");
  var bytes = new Buffer([0x00, 0x01, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0
    , 0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff, 0xff].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 5.192296858534827628530496329220095E+33
  var result = Decimal128.fromString("5.192296858534827628530496329220095E+33");
  var bytes = new Buffer([0x30, 0x40, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff
    , 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff].reverse());
  test.deepEqual(bytes, result.bytes);
  test.done();
}

exports['fromString exponent normalization'] = function(test) {
  // Create decimal from string value 1000000000000000000000000000000000000000
  var result = Decimal128.fromString("1000000000000000000000000000000000000000");
  var bytes = new Buffer([0x30, 0x4c, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93
    , 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 10000000000000000000000000000000000
  var result = Decimal128.fromString("10000000000000000000000000000000000");
  var bytes = new Buffer([0x30, 0x42, 0x31, 0x4d, 0xc6,0x44, 0x8d, 0x93
    , 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 1000000000000000000000000000000000
  var result = Decimal128.fromString("1000000000000000000000000000000000");
  var bytes = new Buffer([0x30, 0x40, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93
    , 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  var str =  "100000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "000000000000000000000000000000000000000000000000000000000000000000000"
      + "0000000000000000000000000000000000";

  // Create decimal from string value str
  var result = Decimal128.fromString(str);
  var bytes = new Buffer([0x37, 0xcc, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93
    , 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 1E-6177
  var result = Decimal128.fromString("1E-6177");
  var bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);
  test.done();
}

exports['fromString from string zeros'] = function(test) {
  // Create decimal from string value 0
  var result = Decimal128.fromString("0");
  var bytes = new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 0e-611
  var result = Decimal128.fromString("0e-611");
  var bytes = new Buffer([0x2b, 0x7a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 0e+6000
  var result = Decimal128.fromString("0e+6000");
  var bytes = new Buffer([0x5f, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 1E-6177
  var result = Decimal128.fromString("-0e-1");
  var bytes = new Buffer([0xb0, 0x3e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);
  test.done();
}

exports['fromString from string round'] = function(test) {
  // Create decimal from string value 10E-6177
  var result = Decimal128.fromString("10E-6177");
  var bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 15E-6177
  var result = Decimal128.fromString("15E-6177");
  var bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02].reverse());
  test.deepEqual(bytes, result.bytes);

  // var array = new Array(6179);
  // for(var i = 0; i < array.length; i++) array[i] = '0';
  // array[1] = '.';
  // array[6177] = '1';
  // array[6178] = '5';
  // // Create decimal from string value array
  // var result = Decimal128.fromString(array.join(''));
  // var bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  //   , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02].reverse());
  // test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 251E-6178
  var result = Decimal128.fromString("251E-6178");
  var bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 250E-6178
  var result = Decimal128.fromString("250E-6178");
  var bytes = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 10000000000000000000000000000000006
  var result = Decimal128.fromString("10000000000000000000000000000000006");
  var bytes = new Buffer([0x30, 0x42, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93
    , 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x01].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 10000000000000000000000000000000003
  var result = Decimal128.fromString("10000000000000000000000000000000003");
  var bytes = new Buffer([0x30, 0x42, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93
    , 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 10000000000000000000000000000000005
  var result = Decimal128.fromString("10000000000000000000000000000000005");
  var bytes = new Buffer([0x30, 0x42, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93
    , 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 100000000000000000000000000000000051
  var result = Decimal128.fromString("100000000000000000000000000000000051");
  var bytes = new Buffer([0x30, 0x44, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93
    , 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x01].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 10000000000000000000000000000000006E6111
  var result = Decimal128.fromString("10000000000000000000000000000000006E6111");
  var bytes = new Buffer([0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 12980742146337069071326240823050239
  var result = Decimal128.fromString("12980742146337069071326240823050239");
  var bytes = new Buffer([0x30, 0x42, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 99999999999999999999999999999999999
  var result = Decimal128.fromString("99999999999999999999999999999999999");
  var bytes = new Buffer([0x30, 0x44, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93
    , 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999
  var result = Decimal128.fromString("9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999");
  var bytes = new Buffer([0x30, 0xc6, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93
    , 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 9999999999999999999999999999999999E6111
  var result = Decimal128.fromString("9999999999999999999999999999999999E6111");
  var bytes = new Buffer([0x5f, 0xff, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0
    , 0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff, 0xff].reverse());
  test.deepEqual(bytes, result.bytes);

  // Create decimal from string value 99999999999999999999999999999999999E6144
  var result = Decimal128.fromString("99999999999999999999999999999999999E6144");
  var bytes = new Buffer([0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());
  test.deepEqual(bytes, result.bytes);
  test.done();
}

exports['toString infinity'] = function(test) {
  var decimal = new Decimal128(new Buffer([0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
  test.equal('Infinity', decimal.toString());

  var decimal = new Decimal128(new Buffer([0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
  test.equal('-Infinity', decimal.toString());
  test.done();
}

exports['toString NaN'] = function(test) {
  var decimal = new Decimal128(new Buffer([0x7c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
  test.equal('NaN', decimal.toString());

  var decimal = new Decimal128(new Buffer([0xfc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
  test.equal('NaN', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x7e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
  test.equal('NaN', decimal.toString());

  var decimal = new Decimal128(new Buffer([0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
  test.equal('NaN', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x7e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x12].reverse()));
  test.equal('NaN', decimal.toString());
  test.done();
}

exports['toString regular'] = function(test) {
  var decimal = new Decimal128(new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse()));
  test.equal('1', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
  test.equal('0', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02].reverse()));
  test.equal('2', decimal.toString());

  var decimal = new Decimal128(new Buffer([0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse()));
  test.equal('-1', decimal.toString());

  var decimal = new Decimal128(new Buffer([0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
  test.equal('-0', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x30, 0x3e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse()));
  test.equal('0.1', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x30, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0xd2].reverse()));
  test.equal('0.001234', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x1c, 0xbe, 0x99, 0x1a, 0x14].reverse()));
  test.equal('123456789012', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x30, 0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x07, 0x5a, 0xef, 0x40].reverse()));
  test.equal('0.00123400000', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x2f, 0xfc, 0x3c, 0xde, 0x6f, 0xff, 0x97, 0x32,
    0xde, 0x82, 0x5c, 0xd0, 0x7e, 0x96, 0xaf, 0xf2].reverse()));
  test.equal('0.1234567890123456789012345678901234', decimal.toString());
  test.done();
}

exports['toString scientific'] = function(test) {
  var decimal = new Decimal128(new Buffer([0x5f, 0xfe, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93,
    0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00, 0x00].reverse()));
  test.equal('1.000000000000000000000000000000000E+6144', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse()));
  test.equal('1E-6176', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse()));
  test.equal('-1E-6176', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x31, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x09, 0x18, 0x4d, 0xb6, 0x3e, 0xb1].reverse()));
  test.equal('9.999987654321E+112', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x5f, 0xff, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0,
    0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff, 0xff].reverse()));
  test.equal('9.999999999999999999999999999999999E+6144', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x00, 0x01, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0,
    0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff, 0xff].reverse()));
  test.equal('9.999999999999999999999999999999999E-6143', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x30, 0x40, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff].reverse()));
  test.equal('5192296858534827628530496329220095', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x30, 0x4c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x1a].reverse()));
  test.equal('1.050E+9', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x30, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x1a].reverse()));
  test.equal('1.050E+4', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x69].reverse()));
  test.equal('105', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x30, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x69].reverse()));
  test.equal('1.05E+3', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x30, 0x46, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01].reverse()));
  test.equal('1E+3', decimal.toString());
  test.done();
}

exports['toString zeros'] = function(test) {
  var decimal = new Decimal128(new Buffer([0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
  test.equal('0', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x32, 0x98, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
  test.equal('0E+300', decimal.toString());

  var decimal = new Decimal128(new Buffer([0x2b, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse()));
  test.equal('0E-600', decimal.toString());
  test.done();
}

exports['Serialize and Deserialize tests'] = function(test) {
  var BSON = require('../../lib/bson/bson');
  var bson = new BSON();

  // Test all methods around a simple serialization at object top level
  var doc = {value: Decimal128.fromString("1")};
  var buffer = bson.serialize(doc, false, true, true, 0, true)
  var size = bson.calculateObjectSize(doc);
  var back = bson.deserialize(buffer);

  test.equal(buffer.length, size);
  test.deepEqual(doc, back);
  test.equal("1", doc.value.toString());
  test.equal('{"value":{"$numberDecimal":"1"}}', JSON.stringify(doc, null));

  // Test all methods around a simple serialization at array top level
  var doc = {value: [Decimal128.fromString("1")]};
  var buffer = bson.serialize(doc, false, true, true, 0, true)
  var size = bson.calculateObjectSize(doc);
  var back = bson.deserialize(buffer);

  test.equal(buffer.length, size);
  test.deepEqual(doc, back);
  test.equal("1", doc.value[0].toString());

  // Test all methods around a simple serialization at nested object
  var doc = {value: { a: Decimal128.fromString("1") } };
  var buffer = bson.serialize(doc, false, true, true, 0, true)
  var size = bson.calculateObjectSize(doc);
  var back = bson.deserialize(buffer);

  test.equal(buffer.length, size);
  test.deepEqual(doc, back);
  test.equal("1", doc.value.a.toString());
  test.done();
}

exports['Support toBSON and toObject methods for custom mapping'] = function(test) {
  var BSON = require('../../lib/bson/bson');
  var bson = new BSON();

  // Create a custom object
  var MyCustomDecimal = function(value) {
    this.value = value instanceof Decimal128 ? value.toString() : value;
  }

  MyCustomDecimal.prototype.toBSON = function() {
    return Decimal128.fromString(this.value);
  }

  // Add a custom mapper for the type
  Decimal128.prototype.toObject = function() {
    return new MyCustomDecimal(this);
  }

  // Test all methods around a simple serialization at object top level
  var doc = {value: new MyCustomDecimal("1")};
  var buffer = bson.serialize(doc, false, true, true, 0, true)
  var back = bson.deserialize(buffer);
  test.ok(back.value instanceof MyCustomDecimal);
  test.equal("1", back.value.value);
  test.done();
}
