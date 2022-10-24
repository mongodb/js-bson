import { expect } from 'chai';
import { types } from 'node:util';
import { ByteUtils } from '../../src/utils/byte_utils';
import { nodeJsByteUtils } from '../../src/utils/node_byte_utils';
import { webByteUtils } from '../../src/utils/web_byte_utils';

type ByteUtilTest<K extends keyof ByteUtils> = {
  name: string;
  inputs: Parameters<ByteUtils[K]>;
  expectation: (result: {
    web: boolean;
    output: ReturnType<ByteUtils[K]> | null;
    error: Error | null;
  }) => void;
};

const isNode16OrLater = (() => {
  let [major] = process.version.split('.');
  major = major.slice(1); // drop leading 'v'
  return Number.parseInt(major, 10) >= 16;
})();

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
  }
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
    expectation({ web, output, error }) {
      if (!isNode16OrLater && web) {
        // Skip reason: btoa and atob were not made globals until node 16
        expect(error).to.be.instanceOf(ReferenceError);
        return;
      }
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abc\u{1f913}', 'utf8'));
    }
  },
  {
    name: 'should return empty buffer for empty string input',
    inputs: [''],
    expectation({ web, output, error }) {
      if (!isNode16OrLater && web) {
        // Skip reason: btoa and atob were not made globals until node 16
        expect(error).to.be.instanceOf(ReferenceError);
        return;
      }
      expect(output).to.have.property('byteLength', 0);
    }
  }
];
const toBase64Tests: ByteUtilTest<'toBase64'>[] = [
  {
    name: 'should create base64 string from buffer input',
    inputs: [Buffer.from('abc\u{1f913}', 'utf8')],
    expectation({ web, output, error }) {
      if (!isNode16OrLater && web) {
        // Skip reason: btoa and atob were not made globals until node 16
        expect(error).to.be.instanceOf(ReferenceError);
        return;
      }
      expect(error).to.be.null;
      expect(output).to.deep.equal(Buffer.from('abc\u{1f913}', 'utf8').toString('base64'));
    }
  },
  {
    name: 'should return empty string for empty buffer input',
    inputs: [Buffer.alloc(0)],
    expectation({ web, output, error }) {
      if (!isNode16OrLater && web) {
        // Skip reason: btoa and atob were not made globals until node 16
        expect(error).to.be.instanceOf(ReferenceError);
        return;
      }
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
const fromTextTests: ByteUtilTest<'fromText'>[] = [
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
  }
];
const toTextTests: ByteUtilTest<'toText'>[] = [
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
  ['fromText', fromTextTests],
  ['toText', toTextTests],
  ['utf8ByteLength', utf8ByteLengthTests]
]);

describe('ByteUtils', () => {
  it('should be set to the nodeJsByteUtils', () => {
    expect(ByteUtils).to.equal(nodeJsByteUtils);
  });

  for (const [byteUtilsName, byteUtils] of utils) {
    describe(byteUtilsName, () => {
      for (const [utility, tests] of table) {
        describe(utility, () => {
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
    });
  }
});
