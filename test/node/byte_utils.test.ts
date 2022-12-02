import { types, inspect } from 'node:util';
import { expect } from 'chai';
import { isBufferOrUint8Array } from './tools/utils';
import { ByteUtils } from '../../src/utils/byte_utils';
import { nodeJsByteUtils } from '../../src/utils/node_byte_utils';
import { webByteUtils } from '../../src/utils/web_byte_utils';
import * as sinon from 'sinon';
import { loadBSONWithGlobal } from '../load_bson';

type ByteUtilTest<K extends keyof ByteUtils> = {
  name: string;
  inputs: Parameters<ByteUtils[K]>;
  expectation: (result: {
    web: boolean;
    output: ReturnType<ByteUtils[K]> | null;
    error: Error | null;
  }) => void;
};

const isNode14OrLower = (() => {
  let [majorVersion] = process.version.split('.');
  majorVersion = majorVersion.slice(1); // drop 'v'
  return Number.parseInt(majorVersion, 10) <= 14;
})();

const testArrayBuffer = new ArrayBuffer(8);

const toLocalBufferTypeTests: ByteUtilTest<'toLocalBufferType'>[] = [
  {
    name: 'should transform to local type',
    inputs: [new Uint8Array()],
    expectation({ web, output }) {
      if (web) {
        expect(types.isUint8Array(output), 'expected output to be a Uint8Array').to.be.true;
      } else {
        expect(Buffer.isBuffer(output), 'expected output to be a Buffer').to.be.true;
      }
    }
  },
  {
    name: 'should account for the input view byteLength and byteOffset',
    inputs: [new Uint8Array(testArrayBuffer, 1, 3)],
    expectation({ web, output, error }) {
      expect(error).to.be.null;
      if (web) {
        expect(types.isUint8Array(output), 'expected output to be a Uint8Array').to.be.true;
      } else {
        expect(Buffer.isBuffer(output), 'expected output to be a Buffer').to.be.true;
      }
      expect(output).to.have.property('byteLength', 3);
      expect(output).to.have.property('byteOffset', 1);
    }
  },
  ...[
    Uint8Array,
    Int8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array
  ].map(TypedArray => {
    return {
      name: `should create view if input is typed array ${TypedArray.name}`,
      inputs: [new TypedArray(testArrayBuffer)],
      expectation({ output, error }) {
        expect(error).to.be.null;
        expect(
          isBufferOrUint8Array(output),
          `expected output to be instanceof buffer or uint8Array`
        ).to.be.true;
        expect(output).to.have.property('byteLength', testArrayBuffer.byteLength);
      }
    } as ByteUtilTest<'toLocalBufferType'>;
  }),
  ...[0, 12, -1, '', 'foo', null, undefined, ['list'], {}, /x/].map(item => {
    return {
      name: `should throw if input is ${typeof item}: ${inspect(item)}`,
      inputs: [item],
      expectation({ output, error }) {
        expect(output).to.be.null;
        expect(error).to.have.property('name', 'BSONError');
      }
    } as ByteUtilTest<'toLocalBufferType'>;
  })
];
const allocateTests: ByteUtilTest<'allocate'>[] = [
  {
    name: 'should return a byteArray with byteLength equal to size',
    inputs: [3],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.have.property('byteLength', 3);
      output?.set([1, 2, 3], 0);
      expect([...(output ?? [])]).to.deep.equal([1, 2, 3]);
    }
  },
  {
    name: 'should throw if argument is invalid size',
    inputs: [-1],
    expectation({ error }) {
      expect(error).to.have.property('name', 'RangeError');
    }
  },
  {
    name: 'should throw if no argument is supplied',
    // @ts-expect-error: testing bad input
    inputs: [],
    expectation({ error }) {
      expect(error).to.have.property('name', 'TypeError');
    }
  },
  {
    name: 'should throw if invalid typed argument is supplied',
    // @ts-expect-error: testing bad input
    inputs: ['abc'],
    expectation({ error }) {
      expect(error).to.have.property('name', 'TypeError');
    }
  },
  {
    name: 'should handle zero sized allocation',
    inputs: [0],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.have.property('byteLength', 0);
    }
  }
];
const equalsTests: ByteUtilTest<'equals'>[] = [
  {
    name: 'should return true for zero sized buffers',
    inputs: [new Uint8Array(), new Uint8Array()],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.be.true;
    }
  },
  {
    name: 'should return true for equal buffers',
    inputs: [Uint8Array.from([1, 2, 3]), Uint8Array.from([1, 2, 3])],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.be.true;
    }
  },
  {
    name: 'should return true for different Buffer instances whose contents are equal',
    inputs: [Uint8Array.from([1, 2, 3]), Buffer.from([1, 2, 3])],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.be.true;
    }
  },
  {
    name: 'should return false for buffers with a different length',
    inputs: [Uint8Array.from([1, 2]), Uint8Array.from([1, 2, 3])],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.be.false;
    }
  },
  {
    name: 'should return false for buffers with different content',
    inputs: [Uint8Array.from([1, 2, 3]), Uint8Array.from([1, 2, 4])],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.be.false;
    }
  }
];
const fromNumberArrayTests: ByteUtilTest<'fromNumberArray'>[] = [
  {
    name: 'should construct a buffer from an array with numbers',
    inputs: [[1, 2, 3]],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from([1, 2, 3]));
    }
  },
  {
    name: 'should construct an empty buffer from an empty array',
    inputs: [[]],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.have.property('byteLength', 0);
    }
  }
];
const fromBase64Tests: ByteUtilTest<'fromBase64'>[] = [
  {
    name: 'should create buffer from base64 input',
    inputs: [Buffer.from('abc\u{1f913}', 'utf8').toString('base64')],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abc\u{1f913}', 'utf8'));
    }
  },
  {
    name: 'should return empty buffer for empty string input',
    inputs: [''],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.have.property('byteLength', 0);
    }
  }
];
const toBase64Tests: ByteUtilTest<'toBase64'>[] = [
  {
    name: 'should create base64 string from buffer input',
    inputs: [Buffer.from('abc\u{1f913}', 'utf8')],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abc\u{1f913}', 'utf8').toString('base64'));
    }
  },
  {
    name: 'should return empty string for empty buffer input',
    inputs: [Buffer.alloc(0)],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.be.a('string').with.lengthOf(0);
    }
  }
];
const fromHexTests: ByteUtilTest<'fromHex'>[] = [
  {
    name: 'should create buffer from hex input',
    inputs: [Buffer.from('abc\u{1f913}', 'utf8').toString('hex')],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abc\u{1f913}', 'utf8'));
    }
  },
  {
    name: 'should return empty buffer for empty string input',
    inputs: [''],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.have.property('byteLength', 0);
    }
  },
  {
    name: 'should use leading valid hex characters',
    inputs: ['abxxcd'],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abxxcd', 'hex'));
      expect(output).to.deep.equal(Buffer.from('ab', 'hex'));
    }
  },
  {
    name: 'should slice input strings down to nearest even length (len: 1)',
    inputs: ['a'],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('a', 'hex'));
      expect(output).to.deep.equal(Buffer.alloc(0));
      expect(output).to.have.property('byteLength', 0);
    }
  },
  {
    name: 'should slice input strings down to nearest even length (len: 5)',
    inputs: ['abcde'],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abcde', 'hex'));
      expect(output).to.have.property('byteLength', 2);
      expect(output).to.have.property('0', 0xab);
      expect(output).to.have.property('1', 0xcd);
      expect(output).to.not.have.property('2');
    }
  },
  {
    name: 'should return empty buffer when no characters are valid hex',
    inputs: ['xxxx'],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('xxxx', 'hex'));
      expect(output).to.have.property('byteLength', 0);
    }
  },
  {
    name: 'should ignore double digit hex subsequence that ends with invalid character',
    inputs: ['abcx'],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abcx', 'hex'));
      expect(output).to.have.property('byteLength', 1);
      expect(output).to.have.property('0', 0xab);
    }
  },
  {
    name: 'should ignore double digit hex subsequence that starts with invalid character',
    inputs: ['abxc'],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abxc', 'hex'));
      expect(output).to.have.property('byteLength', 1);
      expect(output).to.have.property('0', 0xab);
    }
  }
];
const toHexTests: ByteUtilTest<'toHex'>[] = [
  {
    name: 'should create hex string from buffer input',
    inputs: [Buffer.from('abc\u{1f913}', 'utf8')],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abc\u{1f913}', 'utf8').toString('hex'));
    }
  },
  {
    name: 'should return empty string for empty buffer input',
    inputs: [Buffer.alloc(0)],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.be.a('string').with.lengthOf(0);
    }
  }
];
const fromISO88591Tests: ByteUtilTest<'fromISO88591'>[] = [
  {
    name: 'should create buffer from ISO-8859-1 input',
    inputs: [Buffer.from('abc\u{1f913}', 'utf8').toString('latin1')],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abc\u{1f913}', 'utf8'));
    }
  },
  {
    name: 'should return empty buffer for empty string input',
    inputs: [''],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.have.property('byteLength', 0);
    }
  }
];
const toISO88591Tests: ByteUtilTest<'toISO88591'>[] = [
  {
    name: 'should create latin1 string from buffer input',
    inputs: [Buffer.from('abc\u{1f913}', 'utf8')],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abc\u{1f913}', 'utf8').toString('latin1'));
    }
  },
  {
    name: 'should return empty string for empty buffer input',
    inputs: [Buffer.alloc(0)],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.be.a('string').with.lengthOf(0);
    }
  }
];
const fromUTF8Tests: ByteUtilTest<'fromUTF8'>[] = [
  {
    name: 'should create buffer from utf8 input',
    inputs: [Buffer.from('abc\u{1f913}', 'utf8').toString('utf8')],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abc\u{1f913}', 'utf8'));
    }
  },
  {
    name: 'should return empty buffer for empty string input',
    inputs: [''],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.have.property('byteLength', 0);
    }
  },
  {
    name: 'should return bytes with replacement character if string is not encodable',
    inputs: ['\u{1f913}'.slice(0, 1)],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.have.property('byteLength', 3);
      expect(output).to.have.property('0', 0xef);
      expect(output).to.have.property('1', 0xbf);
      expect(output).to.have.property('2', 0xbd);
      const backToString = Buffer.from(output!).toString('utf8');
      const replacementCharacter = '\u{fffd}';
      expect(backToString).to.equal(replacementCharacter);
    }
  }
];
const toUTF8Tests: ByteUtilTest<'toUTF8'>[] = [
  {
    name: 'should create utf8 string from buffer input',
    inputs: [Buffer.from('abc\u{1f913}', 'utf8')],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abc\u{1f913}', 'utf8').toString('utf8'));
    }
  },
  {
    name: 'should return empty string for empty buffer input',
    inputs: [Buffer.alloc(0)],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.be.a('string').with.lengthOf(0);
    }
  }
];
const utf8ByteLengthTests: ByteUtilTest<'utf8ByteLength'>[] = [
  {
    name: 'should return zero for empty string',
    inputs: [''],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.equal(0);
    }
  },
  {
    name: 'should return zero for empty string',
    inputs: ['abc\u{1f913}'],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.equal(7);
    }
  }
];
const randomBytesTests: ByteUtilTest<'randomBytes'>[] = [
  {
    name: 'when byteLength is 0 returns zero byteLength buffer',
    inputs: [0],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.be.instanceOf(Uint8Array);
      expect(output).to.have.property('byteLength', 0);
    }
  },
  {
    name: 'when byteLength is 10 returns ten byteLength buffer',
    inputs: [10],
    expectation({ output, error }) {
      expect(error).to.be.null;
      expect(output).to.be.instanceOf(Uint8Array);
      expect(output).to.have.property('byteLength', 10);
    }
  }
];

const utils = new Map([
  ['nodeJsByteUtils', nodeJsByteUtils],
  ['webByteUtils', webByteUtils]
]);

const table = new Map<keyof ByteUtils, ByteUtilTest<keyof ByteUtils>[]>([
  ['toLocalBufferType', toLocalBufferTypeTests],
  ['allocate', allocateTests],
  ['equals', equalsTests],
  ['fromNumberArray', fromNumberArrayTests],
  ['fromBase64', fromBase64Tests],
  ['toBase64', toBase64Tests],
  ['fromHex', fromHexTests],
  ['toHex', toHexTests],
  ['fromISO88591', fromISO88591Tests],
  ['toISO88591', toISO88591Tests],
  ['fromUTF8', fromUTF8Tests],
  ['toUTF8', toUTF8Tests],
  ['utf8ByteLength', utf8ByteLengthTests],
  ['randomBytes', randomBytesTests]
]);

describe('ByteUtils', () => {
  it('should be set to the nodeJsByteUtils when run on Node.js', () => {
    // The import at the top of our Mocha tests will always be the nodejs version
    // since the import will happen in an environment the defines a global Buffer
    expect(ByteUtils).to.equal(nodeJsByteUtils);
  });

  describe('toLocalBufferType special cases', () => {
    let objectProtoToStringSpy;
    beforeEach(() => {
      objectProtoToStringSpy = sinon.spy(Object.prototype, 'toString');
    });

    afterEach(() => {
      sinon.restore();
    });

    class MyArrayBufferWithNullishToStringTag extends ArrayBuffer {
      calls = 0;
      // @ts-expect-error: checking to see if we fallback to Object.prototype.toString
      get [Symbol.toStringTag]() {
        this.calls++;
        if (this.calls === 1) {
          return null;
        }
        return super[Symbol.toStringTag];
      }
    }

    class MyArrayBufferWithNormalToStringTag extends ArrayBuffer {
      calls = 0;
      get [Symbol.toStringTag]() {
        this.calls++;
        return super[Symbol.toStringTag];
      }
    }

    describe('nodejs', () => {
      it('should return input instance if it is already the correct type', () => {
        const nodejsBuffer = Buffer.from('abc', 'utf8');
        expect(nodeJsByteUtils.toLocalBufferType(nodejsBuffer)).to.equal(nodejsBuffer);
      });

      it('should create a view on a SharedArrayBuffer', function () {
        const arrayBufferIn = new SharedArrayBuffer(3);
        const bufferOut = nodeJsByteUtils.toLocalBufferType(arrayBufferIn);
        expect(bufferOut).to.be.an.instanceOf(Buffer);
        expect(bufferOut.buffer).to.equal(arrayBufferIn);
      });

      it('should use toStringTag getter defined on ArrayBuffer', () => {
        const input = new MyArrayBufferWithNormalToStringTag(0);
        const result = nodeJsByteUtils.toLocalBufferType(input);
        expect(Buffer.isBuffer(result), 'expected nodejs Buffer instance').to.be.true;
        expect(input.calls).to.equal(1);
        expect(objectProtoToStringSpy).to.not.have.been.called;
      });

      it('should attempt fallback to Object.prototype.toString call if toStringTag does not exist on ArrayBuffer', () => {
        const input = new MyArrayBufferWithNullishToStringTag(0);
        // @ts-expect-error: Checking a custom type that overrides toStringTag behavior
        const result = nodeJsByteUtils.toLocalBufferType(input);
        expect(Buffer.isBuffer(result), 'expected nodejs Buffer instance').to.be.true;
        expect(objectProtoToStringSpy).to.be.calledOnce;
      });
    });

    describe('web', () => {
      it('should return input instance if it is already the correct type', () => {
        const uint8array = new Uint8Array(8);
        expect(webByteUtils.toLocalBufferType(uint8array)).to.equal(uint8array);
      });

      it('should create a view on a SharedArrayBuffer', function () {
        const arrayBufferIn = new SharedArrayBuffer(3);
        const bufferOut = webByteUtils.toLocalBufferType(arrayBufferIn);
        expect(types.isUint8Array(bufferOut), 'expected Uint8Array instance').to.be.true;
        expect(bufferOut.buffer).to.equal(arrayBufferIn);
      });

      it('should use toStringTag getter defined on ArrayBuffer', () => {
        const input = new MyArrayBufferWithNormalToStringTag(0);
        const result = webByteUtils.toLocalBufferType(input);
        expect(types.isUint8Array(result), 'expected Uint8Array instance').to.be.true;
        expect(input.calls).to.equal(1);
        expect(objectProtoToStringSpy).to.not.have.been.called;
      });

      it('should attempt fallback to Object.prototype.toString call if toStringTag does not exist on ArrayBuffer', () => {
        const input = new MyArrayBufferWithNullishToStringTag(0);
        // @ts-expect-error: Checking a custom type that overrides toStringTag behavior
        const result = webByteUtils.toLocalBufferType(input);
        expect(types.isUint8Array(result), 'expected a Uint8Array instance').to.be.true;
        expect(objectProtoToStringSpy).to.be.calledOnce;
      });
    });
  });

  describe('randomBytes fallback case', () => {
    let bsonWithNoCrypto;
    before(function () {
      bsonWithNoCrypto = loadBSONWithGlobal({
        crypto: null,
        // if we don't add a copy of Math here then we cannot spy on it for the test
        Math: {
          pow: Math.pow,
          floor: Math.floor,
          random: Math.random
        }
      });
    });

    after(function () {
      sinon.restore();
      bsonWithNoCrypto = null;
    });

    it('should fall back to Math.random implementation for random bytes if crypto is not present', () => {
      const randomSpy = sinon.spy(bsonWithNoCrypto.Math, 'random');
      new bsonWithNoCrypto.BSON.UUID();
      expect(randomSpy).to.have.callCount(16);
    });
  });

  for (const [byteUtilsName, byteUtils] of utils) {
    for (const [utility, tests] of table) {
      const maybeDescribe = isNode14OrLower && /base64/i.test(utility) ? describe.skip : describe;
      maybeDescribe(`${byteUtilsName}.${utility}()`, () => {
        for (const test of tests) {
          it(test.name, function () {
            expect(byteUtils).to.have.property(utility).that.is.a('function');
            let output = null;
            let error = null;

            try {
              output = byteUtils[utility].call(null, ...test.inputs);
            } catch (thrownError) {
              error = thrownError;
            }

            if (error != null) {
              expect(output).to.be.null;
            }

            if (output != null) {
              expect(error).to.be.null;
            }

            test.expectation({ web: byteUtilsName === 'webByteUtils', output, error });
          });
        }
      });
    }
  }
});
