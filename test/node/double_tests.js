'use strict';

const BSON = require('../register-bson');
const Double = BSON.Double;
const inspect = require('util').inspect;

describe('BSON Double Precision', function () {
  context('class Double', function () {
    describe('constructor()', function () {
      const value = 42.3456;

      it('Primitive number', function () {
        expect(new Double(value).valueOf()).to.equal(value);
      });

      it('Number object', function () {
        expect(new Double(new Number(value)).valueOf()).to.equal(value);
      });
    });

    describe('#toString()', () => {
      it('should serialize to a string', () => {
        const testNumber = Math.random() * Number.MAX_VALUE;
        const double = new Double(testNumber);
        expect(double.toString()).to.equal(testNumber.toString());
      });

      const testRadices = [2, 8, 10, 16, 22];

      for (const radix of testRadices) {
        it(`should support radix argument: ${radix}`, () => {
          const testNumber = Math.random() * Number.MAX_VALUE;
          const double = new Double(testNumber);
          expect(double.toString(radix)).to.equal(testNumber.toString(radix));
        });
      }
    });

    describe('.toExtendedJSON()', () => {
      const tests = [
        {
          title: 'returns "0.0" when input is a number 0',
          input: 0,
          output: { $numberDouble: '0.0' }
        },
        {
          title: 'returns "-0.0" when input is a number -0',
          input: -0,
          output: { $numberDouble: '-0.0' }
        },
        {
          title: 'returns "0.0" when input is a string "-0.0"',
          input: '-0.0',
          output: { $numberDouble: '-0.0' }
        },
        {
          title: 'returns "3.0" when input is a number 3',
          input: 3,
          output: { $numberDouble: '3.0' }
        },
        {
          title: 'returns "-3.0" when input is a number -3',
          input: -3,
          output: { $numberDouble: '-3.0' }
        },
        {
          title: 'returns "3.4" when input is a number 3.4',
          input: 3.4,
          output: { $numberDouble: '3.4' }
        },
        {
          title: 'returns "2.220446049250313e-16" when input is Number.EPSILON',
          input: Number.EPSILON,
          output: { $numberDouble: '2.220446049250313e-16' }
        },
        {
          title: 'returns "123450000000.0" when input is a number 12345e7',
          input: 12345e7,
          output: { $numberDouble: '123450000000.0' }
        },
        {
          title: 'returns "1234.5" when input is a number 12345e-1',
          input: 12345e-1,
          output: { $numberDouble: '1234.5' }
        },
        {
          title: 'returns "-1234.5" when input is a number -12345e-1',
          input: -12345e-1,
          output: { $numberDouble: '-1234.5' }
        },
        {
          title: 'returns "Infinity" when input is a number Infinity',
          input: Infinity,
          output: { $numberDouble: 'Infinity' }
        },
        {
          title: 'returns "-Infinity" when input is a number -Infinity',
          input: -Infinity,
          output: { $numberDouble: '-Infinity' }
        },
        {
          title: 'returns "NaN" when input is a number NaN',
          input: NaN,
          output: { $numberDouble: 'NaN' }
        },
        {
          title: 'returns "1.7976931348623157e+308" when input is a number Number.MAX_VALUE',
          input: Number.MAX_VALUE,
          output: { $numberDouble: '1.7976931348623157e+308' }
        },
        {
          title: 'returns "5e-324" when input is a number Number.MIN_VALUE',
          input: Number.MIN_VALUE,
          output: { $numberDouble: '5e-324' }
        },
        {
          title: 'returns "-1.7976931348623157e+308" when input is a number -Number.MAX_VALUE',
          input: -Number.MAX_VALUE,
          output: { $numberDouble: '-1.7976931348623157e+308' }
        },
        {
          title: 'returns "-5e-324" when input is a number -Number.MIN_VALUE',
          input: -Number.MIN_VALUE,
          output: { $numberDouble: '-5e-324' }
        },
        {
          // Reference: https://docs.oracle.com/cd/E19957-01/806-3568/ncg_math.html
          // min positive normal number
          title:
            'returns "2.2250738585072014e-308" when input is a number the minimum positive normal value',
          input: '2.2250738585072014e-308',
          output: { $numberDouble: '2.2250738585072014e-308' }
        },
        {
          // max subnormal number
          title:
            'returns "2.225073858507201e-308" when input is a number the maximum positive subnormal value',
          input: '2.225073858507201e-308',
          output: { $numberDouble: '2.225073858507201e-308' }
        },
        {
          // min positive subnormal number (NOTE: JS does not output same input string, but numeric values are equal)
          title: 'returns "5e-324" when input is a number the minimum positive subnormal value',
          input: '4.9406564584124654e-324',
          output: { $numberDouble: '5e-324' }
        },
        {
          // https://262.ecma-international.org/13.0/#sec-number.prototype.tofixed
          // Note: calling toString on this integer returns 1000000000000000100, so toFixed is more precise
          // This test asserts we do not change _current_ behavior, however preserving this value is not
          // something that is possible in BSON, if a future version of this library were to emit
          // "1000000000000000100.0" instead, it would not be incorrect from a BSON/MongoDB/Double precision perspective,
          //  it would just constrain the string output to what is possible with 8 bytes of floating point precision
          title:
            'returns "1000000000000000128.0" when input is an int-like number beyond 8-byte double precision',
          input: '1000000000000000128',
          output: { $numberDouble: '1000000000000000128.0' }
        }
      ];

      for (const test of tests) {
        const input = test.input;
        const output = test.output;
        const title = test.title;
        it(title, () => {
          const inputAsDouble = new Double(input);
          expect(inputAsDouble.toExtendedJSON({ relaxed: false })).to.deep.equal(output);
          if (!Number.isNaN(inputAsDouble.value)) {
            expect(Number(inputAsDouble.toExtendedJSON({ relaxed: false }).$numberDouble)).to.equal(
              inputAsDouble.value
            );
          }
        });

        it(`preserves the byte wise value of ${input} (${typeof input}) after stringification`, () => {
          // Asserts the same bytes can be reconstructed from the generated string,
          // sometimes the string changes "4.9406564584124654e-324" -> "5e-324"
          // but both represent the same ieee754 double bytes
          const ejsonDoubleString = new Double(input).toExtendedJSON().$numberDouble;
          const bytesFromInput = (() => {
            const b = Buffer.alloc(8);
            b.writeDoubleBE(Number(input));
            return b.toString('hex');
          })();

          const bytesFromOutput = (() => {
            const b = Buffer.alloc(8);
            b.writeDoubleBE(Number(ejsonDoubleString));
            return b.toString('hex');
          })();

          expect(bytesFromOutput).to.equal(bytesFromInput);
        });
      }
    });
  });

  function serializeThenDeserialize(value) {
    const serializedDouble = BSON.serialize({ d: value });
    const deserializedDouble = BSON.deserialize(serializedDouble, { promoteValues: false });
    return deserializedDouble.d;
  }

  const testCases = [
    { name: 'Infinity', doubleVal: new Double(Infinity), testVal: Infinity },
    { name: '-Infinity', doubleVal: new Double(-Infinity), testVal: -Infinity },
    { name: 'Number.EPSILON', doubleVal: new Double(Number.EPSILON), testVal: Number.EPSILON },
    { name: 'Zero', doubleVal: new Double(0), testVal: 0 },
    { name: 'Negative Zero', doubleVal: new Double(-0), testVal: -0 },
    { name: 'NaN', doubleVal: new Double(NaN), testVal: NaN }
  ];

  for (const { name, doubleVal, testVal } of testCases) {
    it(`should preserve the input value ${name} in Double serialize-deserialize roundtrip`, () => {
      const roundTrippedVal = serializeThenDeserialize(doubleVal);
      expect(Object.is(doubleVal.value, testVal)).to.be.true;
      expect(Object.is(roundTrippedVal.value, doubleVal.value)).to.be.true;
    });
  }

  context('NaN with Payload', function () {
    const NanPayloadBuffer = Buffer.from('120000000000F87F', 'hex');
    const NanPayloadDV = new DataView(
      NanPayloadBuffer.buffer,
      NanPayloadBuffer.byteOffset,
      NanPayloadBuffer.byteLength
    );
    const NanPayloadDouble = NanPayloadDV.getFloat64(0, true);
    // Using promoteValues: false (returning raw BSON) in order to be able to check that payload remains intact
    const serializedNanPayloadDouble = BSON.serialize({ d: NanPayloadDouble });

    it('should keep payload in serialize-deserialize roundtrip', function () {
      expect(serializedNanPayloadDouble.subarray(7, 15)).to.deep.equal(NanPayloadBuffer);
    });

    it('should preserve NaN value in serialize-deserialize roundtrip', function () {
      const { d: newVal } = BSON.deserialize(serializedNanPayloadDouble, { promoteValues: true });
      expect(newVal).to.be.NaN;
    });
  });

  it('NODE-4335: does not preserve -0 in serialize-deserialize roundtrip if JS number is used', function () {
    // TODO (NODE-4335): -0 should be serialized as double
    // This test is demonstrating the behavior of -0 being serialized as an int32 something we do NOT want to unintentionally change, but may want to change in the future, which the above ticket serves to track.
    const value = -0;
    const serializedDouble = BSON.serialize({ d: value });
    const type = serializedDouble[4];
    expect(type).to.not.equal(BSON.BSON_DATA_NUMBER);
    expect(type).to.equal(BSON.BSON_DATA_INT);
  });
});
