import { expect } from 'chai';
import { BSON, Double } from '../register-bson';

import { BSON_DATA_NUMBER, BSON_DATA_INT } from '../../src/constants';

describe('BSON Double Precision', function () {
  context('class Double', function () {
    describe('constructor()', function () {
      const value = 42.3456;

      it('Primitive number', function () {
        expect(new Double(value).valueOf()).to.equal(value);
      });

      it('Number object', function () {
        // @ts-expect-error: A number object is not supported by the types
        // but the constructor at runtime should keep handling it correctly
        expect(new Double(new Number(value)).valueOf()).to.equal(value);
      });

      context('when providing a stringified number', () => {
        it('sets the proper value', () => {
          expect(new Double('1').valueOf()).to.equal(1);
          expect(new Double('-0.0').valueOf()).to.equal(-0);
        });
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
          title: 'preserves zero with a decimal point when value is 0',
          input: 0,
          output: { $numberDouble: '0.0' }
        },
        {
          title: 'preserves negative zero when value is negative zero',
          input: -0,
          output: { $numberDouble: '-0.0' }
        },
        {
          title: 'preserves a small integer-like value',
          input: 3,
          output: { $numberDouble: '3.0' }
        },
        {
          title: 'preserves a small negative integer-like value',
          input: -3,
          output: { $numberDouble: '-3.0' }
        },
        {
          title: 'preserves a small fractional value',
          input: 3.4,
          output: { $numberDouble: '3.4' }
        },
        {
          title: 'preserves a the smallest fractional increment (epsilon)',
          input: Number.EPSILON,
          output: { $numberDouble: '2.220446049250313e-16' }
        },
        {
          title: 'preserves the value of an integer was written in scientific notation',
          input: 12345e7,
          output: { $numberDouble: '123450000000.0' }
        },
        {
          title: 'preserves the value of a fraction that was written in scientific notation',
          input: 12345e-1,
          output: { $numberDouble: '1234.5' }
        },
        {
          title:
            'preserves the value of a negative fraction that was written in scientific notation',
          input: -12345e-1,
          output: { $numberDouble: '-1234.5' }
        },
        {
          title: 'preserves positive infinity',
          input: Infinity,
          output: { $numberDouble: 'Infinity' }
        },
        {
          title: 'preserves negative infinity',
          input: -Infinity,
          output: { $numberDouble: '-Infinity' }
        },
        {
          title: 'preserves NaN',
          input: NaN,
          output: { $numberDouble: 'NaN' }
        },
        {
          title:
            'preserves the maximum possible value for 8 byte floats provided by Number.MAX_VALUE',
          input: Number.MAX_VALUE,
          output: { $numberDouble: '1.7976931348623157e+308' }
        },
        {
          title:
            'preserves the minimum possible value for 8 byte floats provided by Number.MIN_VALUE',
          input: Number.MIN_VALUE,
          output: { $numberDouble: '5e-324' }
        },
        {
          title:
            'preserves the maximum possible negative value for 8 byte floats provided by -Number.MAX_VALUE',
          input: -Number.MAX_VALUE,
          output: { $numberDouble: '-1.7976931348623157e+308' }
        },
        {
          title:
            'preserves the minimum possible negative value for 8 byte floats provided by -Number.MIN_VALUE',
          input: -Number.MIN_VALUE,
          output: { $numberDouble: '-5e-324' }
        },
        {
          // Reference: https://docs.oracle.com/cd/E19957-01/806-3568/ncg_math.html
          // min positive normal number
          title: 'preserves the minimum possible stringified normal value',
          input: '2.2250738585072014e-308',
          output: { $numberDouble: '2.2250738585072014e-308' }
        },
        {
          // max subnormal number
          title: 'preserves the max possible stringified subnormal value',
          input: '2.225073858507201e-308',
          output: { $numberDouble: '2.225073858507201e-308' }
        },
        {
          // min positive subnormal number (NOTE: JS does not output same input string, but numeric values are equal)
          title: 'simplifies but preserves the minimum possible subnormal value',
          input: '4.9406564584124654e-324',
          output: { $numberDouble: '5e-324' }
        }
      ];

      context('returns a stringified value that', () => {
        for (const test of tests) {
          const input = test.input;
          const output = test.output;
          const title = test.title;
          it(title, () => {
            const inputAsDouble = new Double(input);
            expect(inputAsDouble.toExtendedJSON({ relaxed: false })).to.deep.equal(output);
            if (!Number.isNaN(inputAsDouble.value)) {
              expect(
                Number(inputAsDouble.toExtendedJSON({ relaxed: false }).$numberDouble)
              ).to.equal(inputAsDouble.value);
            }
          });

          it(`preserves the byte wise value of ${input} (${typeof input})`, () => {
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

      context('when provided an integer beyond the precision of an 8-byte float', () => {
        // https://262.ecma-international.org/13.0/#sec-number.prototype.tofixed
        // Note: calling toString on this integer returns 1000000000000000100, so toFixed is more precise
        // This test asserts we do not change _current_ behavior, however preserving this value is not
        // something that is possible in BSON, if a future version of this library were to emit
        // "1000000000000000100.0" instead, it would not be incorrect from a BSON/MongoDB/Double precision perspective,
        //  it would just constrain the string output to what is possible with 8 bytes of floating point precision
        const integer = 1000000000000000128;
        const integerString = `${integer}`;

        it('passes equality when the number is beyond the presision', () => {
          expect(new Double(integerString).value).to.equal(1000000000000000128);
          expect(new Double(integerString).value).to.equal(1000000000000000100);
        });

        it('preserves the string value', () => {
          // The following shows the when the string is an input the EJSON output still preserves the ending "28"
          expect(new Double(integerString).toExtendedJSON({ relaxed: false })).to.deep.equal({
            $numberDouble: '1000000000000000128.0'
          });
          // The same is true when the input is a JS number
          expect(new Double(integer).toExtendedJSON({ relaxed: false })).to.deep.equal({
            $numberDouble: '1000000000000000128.0'
          });
        });
      });
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

  it('does preserve -0 in serialize as a double', function () {
    const serializedDouble = BSON.serialize({ d: -0 });
    const type = serializedDouble[4];
    expect(type).to.equal(BSON_DATA_NUMBER);
    expect(type).to.not.equal(BSON_DATA_INT);
    expect(serializedDouble.subarray(7, 15)).to.deep.equal(
      new Uint8Array(new Float64Array([-0]).buffer)
    );
  });

  describe('extended JSON', () => {
    describe('stringify()', () => {
      it('preserves negative zero in canonical format', () => {
        const result = BSON.EJSON.stringify({ a: -0.0 }, { relaxed: false });
        expect(result).to.equal(`{"a":{"$numberDouble":"-0.0"}}`);
      });

      it('loses negative zero in relaxed format', () => {
        const result = BSON.EJSON.stringify({ a: -0.0 }, { relaxed: true });
        expect(result).to.equal(`{"a":0}`);
      });
    });

    describe('parse()', () => {
      it('preserves negative zero in deserialization with relaxed false', () => {
        const result = BSON.EJSON.parse(`{ "a": -0.0 }`, { relaxed: false });
        expect(result.a).to.have.property('_bsontype', 'Double');
      });

      it('preserves negative zero in deserialization with relaxed true', () => {
        const result = BSON.EJSON.parse(`{ "a": -0.0 }`, { relaxed: true });
        expect(Object.is(result.a, -0), 'expected prop a to be negative zero').to.be.true;
      });
    });
  });
});
