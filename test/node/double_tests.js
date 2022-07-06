'use strict';

const BSON = require('../register-bson');
const Double = BSON.Double;

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
