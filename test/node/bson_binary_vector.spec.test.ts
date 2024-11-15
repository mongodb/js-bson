import * as fs from 'fs';
import * as path from 'path';
import { BSON, BSONError, Binary } from '../register-bson';
import { expect } from 'chai';

const { toHex, fromHex } = BSON.onDemand.ByteUtils;

const FLOAT = new Float64Array(1);
const FLOAT_BYTES = new Uint8Array(FLOAT.buffer, 0, 8);

FLOAT[0] = -1;
// Little endian [0, 0, 0, 0, 0, 0,  240, 191]
// Big endian    [191, 240, 0, 0, 0, 0, 0, 0]
const isBigEndian = FLOAT_BYTES[7] === 0;

type VectorHexType = '0x03' | '0x27' | '0x10';
type VectorTest = {
  description: string;
  vector: (number | string)[];
  valid: boolean;
  dtype_hex: VectorHexType;
  padding?: number;
  canonical_bson?: string;
};
type VectorSuite = { description: string; test_key: string; tests: VectorTest[] };

function validateVector(vector: Binary): void {
  const VECTOR_TYPE = Object.freeze({
    Int8: 0x03,
    Float32: 0x27,
    PackedBit: 0x10
  } as const);

  if (vector.sub_type !== 9) return;

  const size = vector.position;
  const d_type = vector.buffer[0] ?? 0;
  const padding = vector.buffer[1] ?? 0;

  if ((d_type === VECTOR_TYPE.Float32 || d_type === VECTOR_TYPE.Int8) && padding !== 0) {
    throw new BSONError('Invalid Vector: padding must be zero for int8 and float32 vectors');
  }

  if (d_type === VECTOR_TYPE.PackedBit && padding !== 0 && size === 2) {
    throw new BSONError(
      'Invalid Vector: padding must be zero for packed bit vectors that are empty'
    );
  }

  if (d_type === VECTOR_TYPE.PackedBit && padding > 7) {
    throw new BSONError(
      `Invalid Vector: padding must be a value between 0 and 7. found: ${padding}`
    );
  }
}

function fixFloats(f: string | number): number {
  if (typeof f === 'number') {
    return f;
  }
  if (f === 'inf') {
    return Infinity;
  }
  if (f === '-inf') {
    return -Infinity;
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

function make(vector: (number | string)[], dtype_hex: VectorHexType, padding?: number): Binary {
  let binary: Binary;
  switch (dtype_hex) {
    case '0x10': /* packed_bit */
    case '0x03': /* int8 */ {
      const array = new Int8Array(vector.map(dtype_hex === '0x03' /* int8 */ ? fixInt8s : fixBits));
      const buffer = new Uint8Array(array.byteLength + 2);
      buffer.set(new Uint8Array(array.buffer), 2);
      binary = new Binary(buffer, 9);
      break;
    }

    case '0x27': /* float32 */ {
      const array = new Float32Array(vector.map(fixFloats));
      const buffer = new Uint8Array(array.byteLength + 2);
      if (isBigEndian) {
        for (let i = 0; i < array.length; i++) {
          const bytes = new Uint8Array(array.buffer, i * 4, 4);
          bytes.reverse();
          buffer.set(bytes, i * 4 + 2);
        }
      } else {
        buffer.set(new Uint8Array(array.buffer), 2);
      }
      binary = new Binary(buffer, 9);
      break;
    }

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
  // skipped
  .set('Overflow Vector PACKED_BIT', false)
  .set('Underflow Vector PACKED_BIT', false)
  .set('Overflow Vector INT8', false)
  .set('Underflow Vector INT8', false)
  .set('INT8 with float inputs', false)
  // duplicate test! but also skipped.
  .set('Vector with float values PACKED_BIT', false)
  .set('Vector with float values PACKED_BIT', false);

describe('BSON Binary Vector spec tests', () => {
  const tests: Record<string, VectorSuite> = Object.create(null);

  for (const file of fs.readdirSync(path.join(__dirname, 'specs/bson-binary-vector'))) {
    tests[path.basename(file, '.json')] = JSON.parse(
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
          it(`encode ${test.description}`, function () {
            const bin = make(test.vector, test.dtype_hex, test.padding);

            const buffer = BSON.serialize({ [suite.test_key]: bin });
            expect(toHex(buffer)).to.equal(test.canonical_bson!.toLowerCase());
          });

          it(`decode ${test.description}`, function () {
            const canonical_bson = fromHex(test.canonical_bson!.toLowerCase());
            const doc = BSON.deserialize(canonical_bson);

            expect(doc[suite.test_key].sub_type).to.equal(0x09);
            expect(doc[suite.test_key].buffer[0]).to.equal(+test.dtype_hex);
            expect(doc[suite.test_key].buffer[1]).to.equal(test.padding);
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

          it(`bson: ${test.description}`, function () {
            let thrownError: Error | undefined;
            try {
              const bin = make(test.vector, test.dtype_hex, test.padding);
              BSON.serialize({ bin });
              // TODO(NODE-6537): The following validation MUST be a part of serialize
              validateVector(bin);
            } catch (error) {
              thrownError = error;
            }

            if (thrownError?.message.startsWith('unsupported_error')) {
              expect(
                expectedErrorMessage,
                'We expect a certain error message but got an unsupported error'
              ).to.be.false;
              this.skip();
            }

            expect(thrownError).to.be.instanceOf(BSONError);
            expect(thrownError?.message).to.match(new RegExp(expectedErrorMessage));
          });

          it(`extended json: ${test.description}`, function () {
            let thrownError: Error | undefined;
            try {
              const bin = make(test.vector, test.dtype_hex, test.padding);
              BSON.EJSON.stringify({ bin });
              // TODO(NODE-6537): The following validation MUST be a part of stringify
              validateVector(bin);
            } catch (error) {
              thrownError = error;
            }

            if (thrownError?.message.startsWith('unsupported_error')) {
              expect(
                expectedErrorMessage,
                'We expect a certain error message but got an unsupported error'
              ).to.be.false;
              this.skip();
            }

            expect(thrownError).to.be.instanceOf(BSONError);
            expect(thrownError?.message).to.match(new RegExp(expectedErrorMessage));
          });
        }
      });
    });
  }
});
