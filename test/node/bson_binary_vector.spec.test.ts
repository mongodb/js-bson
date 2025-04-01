import * as util from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'node:assert/strict';
import { BSON, BSONError, Binary, EJSON } from '../register-bson';
import { expect } from 'chai';

const { toHex, fromHex } = BSON.onDemand.ByteUtils;

type VectorHexType = '0x03' | '0x27' | '0x10';
type VectorTest = {
  description: string;
  vector?: number[];
  valid: boolean;
  dtype_hex: VectorHexType;
  padding?: number;
  canonical_bson?: string;
};
type VectorSuite = { description: string; test_key: string; tests: VectorTest[] };

function fixFloats(f: string | number): number {
  // Should be nothing to "fix" but validates we didn't get
  // an unexpected type so we don't silently fail on it during the test
  if (typeof f === 'number') {
    return f;
  }
  throw new Error(`test format error: unknown float value: ${f}`);
}

function fixInt8s(f: number | string): number {
  if (typeof f !== 'number') throw new Error('test format error: unexpected test data');

  if (f < -128 || f > 127) {
    // Javascript Int8Array only supports values from -128 to 127
    throw new Error(`unsupported_error: int8 out of range: ${f}`);
  }
  return f;
}

function fixBits(f: number | string): number {
  if (typeof f !== 'number') throw new Error('test format error: unexpected test data');

  if (f > 255 || f < 0 || !Number.isSafeInteger(f)) {
    // Javascript Uint8Array only supports values from 0 to 255
    throw new Error(`unsupported_error: bit out of range: ${f}`);
  }
  return f;
}

function dtypeToHelper(dtype_hex: string) {
  switch (dtype_hex) {
    case '0x10' /* packed_bit */:
      return 'fromPackedBits';
    case '0x03' /* int8 */:
      return 'fromInt8Array';
    case '0x27' /* float32 */:
      return 'fromFloat32Array';
    default:
      throw new Error(`Unknown dtype_hex: ${dtype_hex}`);
  }
}

function make(vector: number[], dtype_hex: VectorHexType, padding?: number): Binary {
  let binary: Binary;
  switch (dtype_hex) {
    case '0x10' /* packed_bit */:
      binary = Binary.fromPackedBits(new Uint8Array(vector.map(fixBits)), padding);
      break;
    case '0x03' /* int8 */:
      binary = Binary.fromInt8Array(new Int8Array(vector.map(fixInt8s)));
      break;
    case '0x27' /* float32 */:
      binary = Binary.fromFloat32Array(new Float32Array(vector.map(fixFloats)));
      break;
    default:
      throw new Error(`Unknown dtype_hex: ${dtype_hex}`);
  }

  binary.buffer[0] = +dtype_hex;
  binary.buffer[1] = padding ?? 0;

  return binary;
}

const invalidTestExpectedError = new Map()
  .set('FLOAT32 with padding', 'Invalid Vector: padding must be zero for int8 and float32 vectors')
  .set('INT8 with padding', 'Invalid Vector: padding must be zero for int8 and float32 vectors')
  .set(
    'Padding specified with no vector data PACKED_BIT',
    'Invalid Vector: padding must be zero for packed bit vectors that are empty'
  )
  .set(
    'Padding specified with no vector data PACKED_BIT',
    'Invalid Vector: padding must be zero for packed bit vectors that are empty'
  )
  .set(
    'Exceeding maximum padding PACKED_BIT',
    'Invalid Vector: padding must be a value between 0 and 7'
  )
  .set('Negative padding PACKED_BIT', 'Invalid Vector: padding must be a value between 0 and 7')
  .set(
    'Insufficient vector data FLOAT32',
    'Invalid Vector: Float32 vector must contain a multiple of 4 bytes'
  )
  // These are not possible given the constraints of the input types allowed:
  // our helpers will throw an "unsupported_error" for these
  .set('Overflow Vector PACKED_BIT', 'unsupported_error')
  .set('Underflow Vector PACKED_BIT', 'unsupported_error')
  .set('Overflow Vector INT8', 'unsupported_error')
  .set('Underflow Vector INT8', 'unsupported_error')
  .set('INT8 with float inputs', 'unsupported_error')
  .set('Vector with float values PACKED_BIT', 'unsupported_error');

const invalidTestsWhereHelpersDoNotThrow = new Set()
  .add('FLOAT32 with padding')
  .add('INT8 with padding');

function catchError<T>(
  fn: () => T
): { status: 'returned'; result: T } | { status: 'thrown'; result: Error } {
  try {
    return { status: 'returned', result: fn() };
  } catch (error) {
    return { status: 'thrown', result: error };
  }
}

function testVectorInvalidInputValues(test: VectorTest, expectedErrorMessage: string) {
  describe('when creating a BSON Vector given invalid input values', () => {
    const binaryCreation = catchError(make.bind(null, test.vector!, test.dtype_hex, test.padding));
    const bsonBytesCreation =
      binaryCreation.status !== 'thrown'
        ? catchError(BSON.serialize.bind(null, { bin: binaryCreation.result }))
        : undefined;
    const ejsonStringCreation =
      binaryCreation.status !== 'thrown'
        ? catchError(BSON.EJSON.stringify.bind(null, { bin: binaryCreation.result }))
        : undefined;

    const binaryHelperValidations = [
      'Padding specified with no vector data PACKED_BIT',
      'Exceeding maximum padding PACKED_BIT',
      'Negative padding PACKED_BIT',
      ...Array.from(invalidTestExpectedError.entries())
        .filter(([, v]) => v === 'unsupported_error')
        .map(([k]) => k)
    ];

    const errorType = expectedErrorMessage === 'unsupported_error' ? Error : BSONError;
    const errorName = expectedErrorMessage === 'unsupported_error' ? 'Error' : 'BSONError';

    const check = outcome => {
      expect(outcome).to.exist;
      expect(outcome.status).to.equal('thrown');
      expect(outcome.result).to.be.instanceOf(errorType);
      expect(outcome.result)
        .to.have.property('message')
        .that.matches(new RegExp(expectedErrorMessage));
    };

    if (binaryHelperValidations.includes(test.description)) {
      it(`Binary.${dtypeToHelper(test.dtype_hex)}() throws a ${errorName}`, function () {
        check(binaryCreation);
      });
    } else {
      expect(errorName).to.equal('BSONError'); // unsupported_error are only when making vectors

      it(`Binary.${dtypeToHelper(test.dtype_hex)}() does not throw`, function () {
        expect(binaryCreation).to.have.property('status', 'returned');
      });

      it(`BSON.serialize() throws a BSONError`, function () {
        check(bsonBytesCreation);
      });

      it(`EJSON.stringify() throws a BSONError`, function () {
        check(ejsonStringCreation);
      });
    }
  });
}

function testVectorInvalidBSONBytes(test: VectorTest, expectedErrorMessage: string) {
  describe('when creating a Binary Vector instance from invalid bytes', () => {
    it(`BSON.serialize() throw a BSONError`, function () {
      let thrownError: Error | undefined;
      const bin = BSON.deserialize(Buffer.from(test.canonical_bson!, 'hex'));

      try {
        BSON.serialize(bin);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError, thrownError?.stack).to.be.instanceOf(BSONError);
      expect(thrownError?.message).to.match(new RegExp(expectedErrorMessage));
    });

    const toHelper = dtypeToHelper(test.dtype_hex).replace('from', 'to');
    it(`Binary.${toHelper}() throw a BSONError`, function () {
      let thrownError: Error | undefined;
      const bin = BSON.deserialize(Buffer.from(test.canonical_bson!, 'hex'));

      try {
        bin.vector[toHelper]();
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError, thrownError?.stack).to.be.instanceOf(BSONError);
      expect(thrownError?.message).to.match(new RegExp(expectedErrorMessage));
    });

    if (toHelper === 'toPackedBits') {
      it(`Binary.toBits() throw a BSONError`, function () {
        let thrownError: Error | undefined;
        const bin = BSON.deserialize(Buffer.from(test.canonical_bson!, 'hex'));

        try {
          bin.vector.toBits();
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError, thrownError?.stack).to.be.instanceOf(BSONError);
        expect(thrownError?.message).to.match(new RegExp(expectedErrorMessage));
      });
    }

    it(`EJSON.stringify() throw a BSONError`, function () {
      let thrownError: Error | undefined;
      const bin = BSON.deserialize(Buffer.from(test.canonical_bson!, 'hex'));

      try {
        EJSON.stringify(bin);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError, thrownError?.stack).to.be.instanceOf(BSONError);
      expect(thrownError?.message).to.match(new RegExp(expectedErrorMessage));
    });
  });
}

describe('BSON Binary Vector spec tests', () => {
  const tests: Record<string, VectorSuite> = Object.create(null);

  for (const file of fs.readdirSync(path.join(__dirname, 'specs/bson-binary-vector'))) {
    tests[path.basename(file, '.json')] = EJSON.parse(
      fs.readFileSync(path.join(__dirname, 'specs/bson-binary-vector', file), 'utf8')
    );
  }

  for (const [suiteName, suite] of Object.entries(tests)) {
    describe(suiteName, function () {
      const valid = suite.tests.filter(t => t.valid);
      const invalid = suite.tests.filter(t => !t.valid);
      describe('valid', function () {
        /**
         * 1. encode a document from the numeric values, dtype, and padding, along with the "test_key", and assert this matches the canonical_bson string.
         * 2. decode the canonical_bson into its binary form, and then assert that the numeric values, dtype, and padding all match those provided in the JSON.
         *
         * > Note: For floating point number types, exact numerical matches may not be possible.
         * > Drivers that natively support the floating-point type being tested (e.g., when testing float32 vector values in a driver that natively supports float32),
         * > MUST assert that the input float array is the same after encoding and decoding.
         */
        for (const test of valid) {
          describe(test.description, () => {
            it(`calling Binary.${dtypeToHelper(test.dtype_hex)}() with input numbers and serializing it does not throw`, function () {
              const bin = make(test.vector!, test.dtype_hex, test.padding);

              const buffer = BSON.serialize({ [suite.test_key]: bin });
              expect(toHex(buffer)).to.equal(test.canonical_bson!.toLowerCase());
            });

            it(`creating a Binary instance from BSON bytes does not throw`, function () {
              const canonical_bson = fromHex(test.canonical_bson!.toLowerCase());
              const doc = BSON.deserialize(canonical_bson);

              expect(doc[suite.test_key].sub_type).to.equal(0x09);
              expect(doc[suite.test_key].buffer[0]).to.equal(+test.dtype_hex);
              expect(doc[suite.test_key].buffer[1]).to.equal(test.padding);
            });
          });
        }
      });

      describe('invalid', function () {
        /**
         * To prove correct in an invalid case (valid:false),
         * one MUST raise an exception when attempting to encode
         * a document from the numeric values, dtype, and padding.
         */
        for (const test of invalid) {
          const expectedErrorMessage = invalidTestExpectedError.get(test.description);

          describe(test.description, () => {
            if (test.canonical_bson != null) {
              testVectorInvalidBSONBytes(test, expectedErrorMessage);
            }

            if (test.vector != null) {
              testVectorInvalidInputValues(test, expectedErrorMessage);
            }

            if (test.vector == null && test.canonical_bson == null) {
              throw new Error('not testing anything for: ' + util.inspect(test));
            }
          });
        }
      });
    });
  }
});
