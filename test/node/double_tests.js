'use strict';

const BSON = require('../register-bson');
const Double = BSON.Double;

describe('BSON Double Precision', function () {
  context('class Double', function () {
    describe('constructor()', function () {
      const value = 42.3456;

      it('Primitive number', function (done) {
        expect(new Double(value).valueOf()).to.equal(value);
        done();
      });

      it('Number object', function (done) {
        expect(new Double(new Number(value)).valueOf()).to.equal(value);
        done();
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
    { name: 'Infinity', input: new Double(Infinity) },
    { name: '-Infinity', input: new Double(-Infinity) },
    { name: 'Number.EPSILON', input: new Double(Number.EPSILON) },
    { name: 'Zero', input: new Double(0) },
    { name: 'Double (Negative Zero)', input: new Double(-0) }
  ];

  for (const { name, input } of testCases) {
    it(`should return Double from serialize-deserialize roundtrip when value is: ${name}`, () => {
      const outcome = serializeThenDeserialize(input);
      expect(outcome.value).to.equal(input.value);
      expect(Object.is(outcome.value, input.value)).to.be.true;
    });
  }

  it('should preserve NaN value in serialize-deserialize roundtrip', () => {
    const value = NaN;
    const newVal = serializeThenDeserialize(value);
    expect(Number.isNaN(newVal.value)).to.equal(true);
  });

  context('NaN with Payload', function () {
    const NanPayloadBuffer = Buffer.from('120000000000F87F', 'hex');
    const NanPayloadDV = new DataView(
      NanPayloadBuffer.buffer,
      NanPayloadBuffer.byteOffset,
      NanPayloadBuffer.byteLength
    );
    const NanPayloadDouble = NanPayloadDV.getFloat64(0, true);
    const serializedNanPayloadDouble = BSON.serialize({ d: NanPayloadDouble });

    it('should keep payload in serialize-deserialize roundtrip', function () {
      expect(serializedNanPayloadDouble.subarray(7, 15)).to.deep.equal(NanPayloadBuffer);
    });

    it('should preserve NaN value in serialize-deserialize roundtrip', function () {
      const { d: newVal } = BSON.deserialize(serializedNanPayloadDouble, { promoteValues: true });
      expect(Number.isNaN(newVal)).to.equal(true);
    });
  });
  it('NODE-4335: does not preserve -0 in serialize-deserialize roundtrip if JS number is used', () => {
    // TODO (NODE-4335): -0 should be serialized as double
    const value = -0;
    const serializedDouble = BSON.serialize({ d: value });
    const type = serializedDouble[4];
    expect(type).to.not.equal(BSON.BSON_DATA_NUMBER);
    expect(type).to.equal(BSON.BSON_DATA_INT);
  });
});
