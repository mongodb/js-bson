import { BSON } from '../register-bson';
import { expect } from 'chai';
import * as corpus from './tools/bson_corpus_test_loader';

const Decimal128 = BSON.Decimal128;
const BSONError = BSON.BSONError;

const NAN = Buffer.from(
  [
    0x7c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ].reverse()
);
const INF_NEGATIVE_BUFFER = Buffer.from(
  [
    0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ].reverse()
);
const INF_POSITIVE_BUFFER = Buffer.from(
  [
    0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ].reverse()
);

describe('Decimal128', function () {
  /**
   * @ignore
   */
  it('fromString invalid input', function (done) {
    expect(function () {
      Decimal128.fromString('E02');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('E+02');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('e+02');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('.');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('.e');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('invalid');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('in');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('i');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('..1');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('1abcede');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('1.24abc');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('1.24abcE+02');
    }).to.throw;
    expect(function () {
      Decimal128.fromString('1.24E+02abc2d');
    }).to.throw;
    done();
  });

  context('fromString NaN input', function () {
    const inputs = ['NaN', '+NaN', '-NaN', '-nan', '+nan', 'nan', 'Nan', '+Nan', '-Nan'];
    for (const input of inputs) {
      it(`returns NAN when input is "${input}"`, function () {
        const result = Decimal128.fromString(input);
        expect(NAN).to.deep.equal(result.bytes);
      });
    }
  });

  context('fromString inifity input', function () {
    const positiveInputs = ['Infinity', '+Infinity', '+Inf'];
    const negativeInputs = ['-Inf', '-Infinity'];

    for (const input of positiveInputs) {
      it(`returns positive infinity when input is "${input}"`, function () {
        const result = Decimal128.fromString(input);
        expect(INF_POSITIVE_BUFFER).to.deep.equal(result.bytes);
      });
    }

    for (const input of negativeInputs) {
      it(`returns negative infinity when input is "${input}"`, function () {
        const result = Decimal128.fromString(input);
        expect(INF_NEGATIVE_BUFFER).to.deep.equal(result.bytes);
      });
    }
  });

  context('fromString simple', function () {
    const tests: { input: string; result: Buffer }[] = [
      {
        input: '1',
        result: Buffer.from(
          [
            0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x01
          ].reverse()
        )
      },
      {
        input: '0',
        result: Buffer.from(
          [
            0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00
          ].reverse()
        )
      },
      {
        input: '-0',
        result: Buffer.from(
          [
            0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00
          ].reverse()
        )
      },
      {
        input: '-1',
        result: Buffer.from(
          [
            0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x01
          ].reverse()
        )
      },
      {
        input: '12345678901234567',
        result: Buffer.from(
          [
            0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2b, 0xdc, 0x54, 0x5d, 0x6b,
            0x4b, 0x87
          ].reverse()
        )
      },
      {
        input: '989898983458',
        result: Buffer.from(
          [
            0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xe6, 0x7a, 0x93,
            0xc8, 0x22
          ].reverse()
        )
      },
      {
        input: '-12345678901234567',
        result: Buffer.from(
          [
            0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2b, 0xdc, 0x54, 0x5d, 0x6b,
            0x4b, 0x87
          ].reverse()
        )
      },
      {
        input: '0.12345',
        result: Buffer.from(
          [
            0x30, 0x36, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x30, 0x39
          ].reverse()
        )
      },
      {
        input: '0.0012345',
        result: Buffer.from(
          [
            0x30, 0x32, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x30, 0x39
          ].reverse()
        )
      },
      {
        input: '00012345678901234567',
        result: Buffer.from(
          [
            0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2b, 0xdc, 0x54, 0x5d, 0x6b,
            0x4b, 0x87
          ].reverse()
        )
      }
    ];

    for (const test of tests) {
      it(`returns Decimal128 with bytes content: '[${test.result.join(',')}]' with input "${
        test.input
      }"`, function () {
        const result = Decimal128.fromString(test.input);
        expect(result.bytes).to.deep.equal(test.result);
      });
    }
  });

  context('fromString scientific format', function () {
    const tests: { input: string; result: Buffer }[] = [
      {
        input: '10e0',
        result: Buffer.from(
          [
            0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x0a
          ].reverse()
        )
      },

      {
        input: '1e1',
        result: Buffer.from(
          [
            0x30, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x01
          ].reverse()
        )
      },
      {
        input: '10e-1',
        result: Buffer.from(
          [
            0x30, 0x3e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x0a
          ].reverse()
        )
      },
      {
        input: '12345678901234567e6111',
        result: Buffer.from(
          [
            0x5f, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2b, 0xdc, 0x54, 0x5d, 0x6b,
            0x4b, 0x87
          ].reverse()
        )
      },
      {
        input: '1e-6176',
        result: Buffer.from(
          [
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x01
          ].reverse()
        )
      },
      {
        input: '-100E-10',
        result: Buffer.from(
          [
            0xb0, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x64
          ].reverse()
        )
      },
      {
        input: '10.50E8',
        result: Buffer.from(
          [
            0x30, 0x4c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x04, 0x1a
          ].reverse()
        )
      }
    ];

    for (const test of tests) {
      it(`returns Decimal128 with bytes content: '[${test.result.join(',')}]' with input "${
        test.input
      }"`, function () {
        const result = Decimal128.fromString(test.input);
        expect(result.bytes).to.deep.equal(test.result);
      });
    }
  });

  it('fromString large format', function (done) {
    // Create decimal from string value 12345689012345789012345
    let result = Decimal128.fromString('12345689012345789012345');
    let bytes = Buffer.from(
      [
        0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x02, 0x9d, 0x42, 0xda, 0x3a, 0x76, 0xf9, 0xe0, 0xd9,
        0x79
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);

    // Create decimal from string value 1234567890123456789012345678901234
    result = Decimal128.fromString('1234567890123456789012345678901234');
    bytes = Buffer.from(
      [
        0x30, 0x40, 0x3c, 0xde, 0x6f, 0xff, 0x97, 0x32, 0xde, 0x82, 0x5c, 0xd0, 0x7e, 0x96, 0xaf,
        0xf2
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);

    // Create decimal from string value 9.999999999999999999999999999999999E+6144
    result = Decimal128.fromString('9.999999999999999999999999999999999E+6144');
    bytes = Buffer.from(
      [
        0x5f, 0xff, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0, 0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff,
        0xff
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);

    // Create decimal from string value 9.999999999999999999999999999999999E-6143
    result = Decimal128.fromString('9.999999999999999999999999999999999E-6143');
    bytes = Buffer.from(
      [
        0x00, 0x01, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0, 0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff,
        0xff
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);

    // Create decimal from string value 5.192296858534827628530496329220095E+33
    result = Decimal128.fromString('5.192296858534827628530496329220095E+33');
    bytes = Buffer.from(
      [
        0x30, 0x40, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);
    done();
  });

  it('fromString exponent normalization', function (done) {
    // Create decimal from string value 1000000000000000000000000000000000000000

    let result = Decimal128.fromString('1000000000000000000000000000000000000000');
    let bytes = Buffer.from(
      [
        0x30, 0x4c, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00,
        0x00
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);

    // Create decimal from string value 10000000000000000000000000000000000
    result = Decimal128.fromString('10000000000000000000000000000000000');
    bytes = Buffer.from(
      [
        0x30, 0x42, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00,
        0x00
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);

    // Create decimal from string value 1000000000000000000000000000000000
    result = Decimal128.fromString('1000000000000000000000000000000000');
    bytes = Buffer.from(
      [
        0x30, 0x40, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00,
        0x00
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);

    const str =
      '100000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000';

    // Create decimal from string value str

    result = Decimal128.fromString(str);
    bytes = Buffer.from(
      [
        0x37, 0xcc, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00,
        0x00
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);

    // this should throw error according to spec.
    // Create decimal from string value 1E-6177

    // var result = Decimal128.fromString('1E-6177');
    // var bytes = Buffer.from(
    //   [
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);
    done();
  });

  it('fromString from string zeros', function (done) {
    // Create decimal from string value 0
    let result = Decimal128.fromString('0');
    let bytes = Buffer.from(
      [
        0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);

    // Create decimal from string value 0e-611
    result = Decimal128.fromString('0e-611');
    bytes = Buffer.from(
      [
        0x2b, 0x7a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);

    // Create decimal from string value 0e+6000
    result = Decimal128.fromString('0e+6000');
    bytes = Buffer.from(
      [
        0x5f, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);

    // Create decimal from string value 1E-6177
    result = Decimal128.fromString('-0e-1');
    bytes = Buffer.from(
      [
        0xb0, 0x3e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00
      ].reverse()
    );
    expect(bytes).to.deep.equal(result.bytes);
    done();
  });

  it('fromString from string round', function (done) {
    // Create decimal from string value 10E-6177
    const result = Decimal128.fromString('10E-6177');
    const bytes = Buffer.from(
      [
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x01
      ].reverse()
    );

    expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 15E-6177
    // result = Decimal128.fromString('15E-6177');
    // bytes = Buffer.from(
    //   [
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x02
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    // // var array = new Array(6179);
    // // for(var i = 0; i < array.length; i++) array[i] = '0';
    // // array[1] = '.';
    // // array[6177] = '1';
    // // array[6178] = '5';
    // // // Create decimal from string value array
    // // result = Decimal128.fromString(array.join(''));
    // // bytes = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    // //   , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02].reverse());
    // // expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 251E-6178
    // result = Decimal128.fromString('251E-6178');
    // bytes = Buffer.from(
    //   [
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x03
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 250E-6178
    // result = Decimal128.fromString('250E-6178');
    // bytes = Buffer.from(
    //   [
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x02
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 10000000000000000000000000000000006
    // result = Decimal128.fromString('10000000000000000000000000000000006');
    // bytes = Buffer.from(
    //   [
    //     0x30,
    //     0x42,
    //     0x31,
    //     0x4d,
    //     0xc6,
    //     0x44,
    //     0x8d,
    //     0x93,
    //     0x38,
    //     0xc1,
    //     0x5b,
    //     0x0a,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x01
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 10000000000000000000000000000000003
    // result = Decimal128.fromString('10000000000000000000000000000000003');
    // bytes = Buffer.from(
    //   [
    //     0x30,
    //     0x42,
    //     0x31,
    //     0x4d,
    //     0xc6,
    //     0x44,
    //     0x8d,
    //     0x93,
    //     0x38,
    //     0xc1,
    //     0x5b,
    //     0x0a,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 10000000000000000000000000000000005
    // result = Decimal128.fromString('10000000000000000000000000000000005');
    // bytes = Buffer.from(
    //   [
    //     0x30,
    //     0x42,
    //     0x31,
    //     0x4d,
    //     0xc6,
    //     0x44,
    //     0x8d,
    //     0x93,
    //     0x38,
    //     0xc1,
    //     0x5b,
    //     0x0a,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 100000000000000000000000000000000051
    // result = Decimal128.fromString('100000000000000000000000000000000051');
    // bytes = Buffer.from(
    //   [
    //     0x30,
    //     0x44,
    //     0x31,
    //     0x4d,
    //     0xc6,
    //     0x44,
    //     0x8d,
    //     0x93,
    //     0x38,
    //     0xc1,
    //     0x5b,
    //     0x0a,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x01
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 10000000000000000000000000000000006E6111
    // result = Decimal128.fromString('10000000000000000000000000000000006E6111');
    // bytes = Buffer.from(
    //   [
    //     0x78,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 12980742146337069071326240823050239
    // result = Decimal128.fromString('12980742146337069071326240823050239');
    // bytes = Buffer.from(
    //   [
    //     0x30,
    //     0x42,
    //     0x40,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 99999999999999999999999999999999999
    // result = Decimal128.fromString('99999999999999999999999999999999999');
    // bytes = Buffer.from(
    //   [
    //     0x30,
    //     0x44,
    //     0x31,
    //     0x4d,
    //     0xc6,
    //     0x44,
    //     0x8d,
    //     0x93,
    //     0x38,
    //     0xc1,
    //     0x5b,
    //     0x0a,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999
    // result = Decimal128.fromString(
    //   '9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999'
    // );
    // bytes = Buffer.from(
    //   [
    //     0x30,
    //     0xc6,
    //     0x31,
    //     0x4d,
    //     0xc6,
    //     0x44,
    //     0x8d,
    //     0x93,
    //     0x38,
    //     0xc1,
    //     0x5b,
    //     0x0a,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 9999999999999999999999999999999999E6111
    // result = Decimal128.fromString('9999999999999999999999999999999999E6111');
    // bytes = Buffer.from(
    //   [
    //     0x5f,
    //     0xff,
    //     0xed,
    //     0x09,
    //     0xbe,
    //     0xad,
    //     0x87,
    //     0xc0,
    //     0x37,
    //     0x8d,
    //     0x8e,
    //     0x63,
    //     0xff,
    //     0xff,
    //     0xff,
    //     0xff
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    // // Create decimal from string value 99999999999999999999999999999999999E6144
    // result = Decimal128.fromString('99999999999999999999999999999999999E6144');
    // bytes = Buffer.from(
    //   [
    //     0x78,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00
    //   ].reverse()
    // );
    // expect(bytes).to.deep.equal(result.bytes);

    done();
  });

  it('toString infinity', function (done) {
    let decimal = new Decimal128(
      Buffer.from(
        [
          0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00
        ].reverse()
      )
    );
    expect('Infinity').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00
        ].reverse()
      )
    );
    expect('-Infinity').to.equal(decimal.toString());
    done();
  });

  it('toString NaN', function (done) {
    let decimal = new Decimal128(
      Buffer.from(
        [
          0x7c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00
        ].reverse()
      )
    );
    expect('NaN').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0xfc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00
        ].reverse()
      )
    );
    expect('NaN').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x7e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00
        ].reverse()
      )
    );
    expect('NaN').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00
        ].reverse()
      )
    );
    expect('NaN').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x7e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x12
        ].reverse()
      )
    );
    expect('NaN').to.equal(decimal.toString());
    done();
  });

  it('toString regular', function (done) {
    let decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x01
        ].reverse()
      )
    );
    expect('1').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00
        ].reverse()
      )
    );
    expect('0').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x02
        ].reverse()
      )
    );
    expect('2').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x01
        ].reverse()
      )
    );
    expect('-1').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0xb0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00
        ].reverse()
      )
    );
    expect('-0').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x3e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x01
        ].reverse()
      )
    );
    expect('0.1').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04,
          0xd2
        ].reverse()
      )
    );
    expect('0.001234').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1c, 0xbe, 0x99, 0x1a,
          0x14
        ].reverse()
      )
    );
    expect('123456789012').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0x5a, 0xef,
          0x40
        ].reverse()
      )
    );
    expect('0.00123400000').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x2f, 0xfc, 0x3c, 0xde, 0x6f, 0xff, 0x97, 0x32, 0xde, 0x82, 0x5c, 0xd0, 0x7e, 0x96, 0xaf,
          0xf2
        ].reverse()
      )
    );
    expect('0.1234567890123456789012345678901234').to.equal(decimal.toString());
    done();
  });

  it('toString scientific', function (done) {
    let decimal = new Decimal128(
      Buffer.from(
        [
          0x5f, 0xfe, 0x31, 0x4d, 0xc6, 0x44, 0x8d, 0x93, 0x38, 0xc1, 0x5b, 0x0a, 0x00, 0x00, 0x00,
          0x00
        ].reverse()
      )
    );
    expect('1.000000000000000000000000000000000E+6144').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x01
        ].reverse()
      )
    );
    expect('1E-6176').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x01
        ].reverse()
      )
    );
    expect('-1E-6176').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x31, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0x18, 0x4d, 0xb6, 0x3e,
          0xb1
        ].reverse()
      )
    );
    expect('9.999987654321E+112').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x5f, 0xff, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0, 0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff,
          0xff
        ].reverse()
      )
    );
    expect('9.999999999999999999999999999999999E+6144').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x00, 0x01, 0xed, 0x09, 0xbe, 0xad, 0x87, 0xc0, 0x37, 0x8d, 0x8e, 0x63, 0xff, 0xff, 0xff,
          0xff
        ].reverse()
      )
    );
    expect('9.999999999999999999999999999999999E-6143').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x40, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
          0xff
        ].reverse()
      )
    );
    expect('5192296858534827628530496329220095').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x4c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04,
          0x1a
        ].reverse()
      )
    );
    expect('1.050E+9').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04,
          0x1a
        ].reverse()
      )
    );
    expect('1.050E+4').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x69
        ].reverse()
      )
    );
    expect('105').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x69
        ].reverse()
      )
    );
    expect('1.05E+3').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x46, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x01
        ].reverse()
      )
    );
    expect('1E+3').to.equal(decimal.toString());
    done();
  });

  it('toString zeros', function (done) {
    let decimal = new Decimal128(
      Buffer.from(
        [
          0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00
        ].reverse()
      )
    );
    expect('0').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x32, 0x98, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00
        ].reverse()
      )
    );
    expect('0E+300').to.equal(decimal.toString());

    decimal = new Decimal128(
      Buffer.from(
        [
          0x2b, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00
        ].reverse()
      )
    );
    expect('0E-600').to.equal(decimal.toString());
    done();
  });

  it('Serialize and Deserialize tests', function (done) {
    // Test all methods around a simple serialization at object top level
    let doc = { value: Decimal128.fromString('1') };
    let buffer = BSON.serialize(doc);
    let size = BSON.calculateObjectSize(doc);
    let back = BSON.deserialize(buffer);

    expect(buffer.length).to.equal(size);
    expect(doc).to.deep.equal(back);
    expect('1').to.equal(doc.value.toString());
    expect('{"value":{"$numberDecimal":"1"}}').to.equal(JSON.stringify(doc, null));

    // Test all methods around a simple serialization at array top level
    doc = { value: [Decimal128.fromString('1')] };
    buffer = BSON.serialize(doc);
    size = BSON.calculateObjectSize(doc);
    back = BSON.deserialize(buffer);

    expect(buffer.length).to.equal(size);
    expect(doc).to.deep.equal(back);
    expect('1').to.equal(doc.value[0].toString());

    // Test all methods around a simple serialization at nested object
    doc = { value: { a: Decimal128.fromString('1') } };
    buffer = BSON.serialize(doc);
    size = BSON.calculateObjectSize(doc);
    back = BSON.deserialize(buffer);

    expect(buffer.length).to.equal(size);
    expect(doc).to.deep.equal(back);
    expect('1').to.equal(doc.value.a.toString());
    done();
  });

  it('accepts strings in the constructor', () => {
    expect(new Decimal128('0').toString()).to.equal('0');
    expect(new Decimal128('00').toString()).to.equal('0');
    expect(new Decimal128('0.5').toString()).to.equal('0.5');
    expect(new Decimal128('-0.5').toString()).to.equal('-0.5');
    expect(new Decimal128('-0.0097').toString()).to.equal('-0.0097');
    expect(new Decimal128('-0.0011').toString()).to.equal('-0.0011');
    expect(new Decimal128('-0.00110').toString()).to.equal('-0.00110');
    expect(new Decimal128('0.0011').toString()).to.equal('0.0011');
    expect(new Decimal128('0.00110').toString()).to.equal('0.00110');
    expect(new Decimal128('-1e400').toString()).to.equal('-1E+400');
  });

  it('throws correct error for invalid constructor argument type', () => {
    const constructorArgErrMsg = 'Decimal128 must take a Buffer or string';

    // ts-ignore
    expect(() => new Decimal128(-0)).to.throw(constructorArgErrMsg);
    expect(() => new Decimal128(-1)).to.throw(constructorArgErrMsg);
    expect(() => new Decimal128(10)).to.throw(constructorArgErrMsg);
    expect(() => new Decimal128(1111111111111111)).to.throw(constructorArgErrMsg);
  });

  it('throws correct error for an invalid Buffer constructor argument', () => {
    const byteLengthErrMsg = 'Decimal128 must take a Buffer of 16 bytes';

    expect(() => new Decimal128(new Uint8Array(0))).to.throw(byteLengthErrMsg);
    expect(() => new Decimal128(Buffer.alloc(0))).to.throw(byteLengthErrMsg);
    expect(() => new Decimal128(new Uint8Array(3))).to.throw(byteLengthErrMsg);
    expect(() => new Decimal128(Buffer.alloc(3))).to.throw(byteLengthErrMsg);
    expect(() => new Decimal128(new Uint8Array(17))).to.throw(byteLengthErrMsg);
    expect(() => new Decimal128(Buffer.alloc(17))).to.throw(byteLengthErrMsg);
  });

  it('does not throw error for an empty Buffer of correct length constructor argument', () => {
    expect(() => new Decimal128(Buffer.alloc(16))).to.not.throw();
    expect(() => new Decimal128(new Uint8Array(16))).to.not.throw();
  });

  context('fromString()', function () {
    context("when input has leading '+' and has more than 34 significant digits", function () {
      it('throws BSON error on inexact rounding', function () {
        expect(() =>
          Decimal128.fromString('+100000000000000000000000000000000000000000000001')
        ).to.throw(BSON.BSONError, /inexact rounding/);
      });
    });

    context(
      'when input has 1 significant digits, 34 total digits and an exponent greater than exponent_max',
      function () {
        it('throws BSON error reporting overflow', function () {
          expect(() => Decimal128.fromString('1000000000000000000000000000000000e6112')).to.throw(
            BSON.BSONError,
            /overflow/
          );
        });
      }
    );

    describe('fromStringWithRounding', function () {
      context('Corpus tests', function () {
        // Filter for only Decimal128 tests
        for (const { description, valid, _filename, parseErrors } of corpus.filter(s =>
          /Decimal128/.test(s.description)
        )) {
          const scenarioName = `${description} (${_filename})`;
          describe(scenarioName, function () {
            if (valid) {
              // We only care about the extended json inputs because the bson inputs will not test the
              // fromString or fromStringWithRounding code paths
              const inputs = [
                'canonical_extjson',
                'degenerate_extjson',
                'relaxed_extjson',
                'converted_extjson'
              ];
              for (const validTest of valid) {
                context(`Valid Test: ${validTest.description}`, function () {
                  for (const input of inputs) {
                    if (validTest[input]) {
                      describe(`with ${input} input`, function () {
                        it('has same output as fromString', function () {
                          const extJSONString: string = JSON.parse(validTest[input]).d
                            .$numberDecimal;
                          expect(Decimal128.fromStringWithRounding(extJSONString)).to.deep.equal(
                            Decimal128.fromString(extJSONString)
                          );
                        });
                      });
                    }
                  }
                });
              }
            }
            if (parseErrors) {
              // Filter out the inexact rounding tests
              for (const parseErrorTest of parseErrors.filter(
                p => !/Inexact/.test(p.description)
              )) {
                context(`ParseError - ${parseErrorTest.description}`, function () {
                  it('emits the same error as fromString', function () {
                    const errorOrNull = (f: () => void) => {
                      try {
                        f();
                      } catch (err) {
                        return err;
                      }
                      return null;
                    };
                    const fromStringError = errorOrNull(() =>
                      Decimal128.fromString(parseErrorTest.string)
                    );
                    const fromStringWithRoundingError = errorOrNull(() =>
                      Decimal128.fromStringWithRounding(parseErrorTest.string)
                    );

                    expect(fromStringError).to.be.instanceOf(BSONError);
                    expect(fromStringWithRoundingError).to.be.instanceOf(BSONError);

                    expect(fromStringWithRoundingError).to.deep.equal(fromStringError);
                  });
                });
              }
            }
          });
        }
      });

      context('when the input has more than 34 significant digits', function () {
        it('does not throw an error', function () {
          expect(() =>
            Decimal128.fromStringWithRounding('37.499999999999999196428571428571375')
          ).to.not.throw();
        });
        context('when the digit to round is >= 5', function () {
          it('rounds up correctly', function () {
            const result = Decimal128.fromStringWithRounding(
              '37.499999999999999196428571428571375'
            );
            expect(result.toString()).to.deep.equal('37.49999999999999919642857142857138');
          });
        });
        context('when the digit to round is < 5', function () {
          it('rounds down correctly', function () {
            const result = Decimal128.fromStringWithRounding(
              '37.499999999999999196428571428571374'
            );
            expect(result.toString()).to.deep.equal('37.49999999999999919642857142857137');
          });
        });

        context('when the digit to round is 9', function () {
          it('rounds up and carries correctly', function () {
            const result = Decimal128.fromStringWithRounding(
              '37.4999999999999999196428571428571399'
            );
            expect(result.toString()).to.deep.equal('37.49999999999999991964285714285714');
          });
        });
      });
    });
  });
});
