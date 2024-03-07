import { expect } from 'chai';

import * as BSON from '../../../register-bson';

import { bufferFromHexArray, stringToUTF8HexBytes, int32LEToHex } from '../../tools/utils';

const parseToElements = BSON.onDemand.parseToElements;
const BSONOffsetError = BSON.onDemand.BSONOffsetError;

describe('parseToElements()', () => {
  context('when given less than 5 bytes', () => {
    it('throws an error indicating minimum required size', () => {
      const test = () => parseToElements(new Uint8Array(0));
      expect(test).to.throw(/at least 5 bytes/i);
      expect(test).to.throw(BSONOffsetError);
    });
  });

  context('when a document has a size smaller than the input', () => {
    it('throws an error that it found a 0 type byte at an offset before document end', () => {
      const test = () => parseToElements(new Uint8Array([6, 0, 0, 0, 0, 0, 0])); // given 7 bytes, but says 6
      expect(test).to.throw(/Invalid 0x00 type byte. offset: 5/i);
      expect(test).to.throw(BSONOffsetError);
    });
  });

  context('when given a document that does not end with a null terminator', () => {
    it('throws an error that documents must end in 0x00', () => {
      for (const test of [
        () => parseToElements(new Uint8Array([5, 0, 0, 0, 1])),
        () => parseToElements(new Uint8Array([0, 5, 0, 0, 0, 1]), 1)
      ]) {
        expect(test).to.throw(/documents must end in 0x00/i);
        expect(test).to.throw(BSONOffsetError);
      }
    });
  });

  context('when given a document that has a size larger than the input', () => {
    it('throws an error that the size and length do not match', () => {
      const test = () => parseToElements(new Uint8Array([6, 0, 0, 0, 0])); // only 5 bytes, but says 6
      expect(test).to.throw(/does not match input length/i);
      expect(test).to.throw(BSONOffsetError);
    });

    context('and an offset is provided', () => {
      it('throws an error that the size and length do not match', () => {
        const test = () => parseToElements(new Uint8Array([0, 6, 0, 0, 0, 0]), 1); // is 6 bytes, but offset is 1
        expect(test).to.throw(/does not match input length/i);
        expect(test).to.throw(BSONOffsetError);
      });
    });
  });

  context('when an element name has no null terminator', () => {
    it('throws an error indicating null terminator not found', () => {
      const test = () =>
        parseToElements(bufferFromHexArray(['10', '61', int32LEToHex(0x7fff_ffff)]));
      expect(test).to.throw(/Null terminator not found/i);
      expect(test).to.throw(BSONOffsetError);
    });
  });

  context('when given a negative size', () => {
    context('in a document', () => {
      it('throws an error that a size cannot be negative', () => {
        const testNegativeMax = () => parseToElements(new Uint8Array([0, 0, 0, 0x80, 0]));
        const testNegative1 = () => parseToElements(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0]));
        expect(testNegativeMax).to.throw(/BSON size cannot be negative/i);
        expect(testNegativeMax).to.throw(BSONOffsetError);
        expect(testNegative1).to.throw(/BSON size cannot be negative/i);
        expect(testNegative1).to.throw(BSONOffsetError);
      });
    });

    const sizedTypes = [
      // The array is in order of [TypeByte, ElementName, Int32Size, ElementValue]
      { type: 'string', input: ['02', '6100', '00000080', '6100'] },
      { type: 'binary', input: ['05', '6100', '00000080', '01'] },
      { type: 'dbpointer', input: ['05', '6100', '00000080', '6100', '00'.repeat(12)] },
      { type: 'code', input: ['05', '6100', '00000080', '6100'] },
      { type: 'symbol', input: ['05', '6100', '00000080', '6100'] },
      { type: 'object', input: ['05', '6100', '00000080', '00'] },
      { type: 'array', input: ['05', '6100', '00000080', '00'] },
      { type: 'code_w_scope', input: ['05', '6100', '00000080', '010000006100', '05000000'] }
    ];

    for (const sizedType of sizedTypes) {
      context(`in a ${sizedType.type}`, () => {
        it('throws an error that a size cannot be negative', () => {
          const test = () => parseToElements(bufferFromHexArray(sizedType.input));
          expect(test).to.throw(/BSON size cannot be negative/i);
          expect(test).to.throw(BSONOffsetError);
        });
      });
    }
  });

  context('when an sized element reports a size larger than document', () => {
    const sizedTypes = [
      // The array is in order of [TypeByte, ElementName, Int32Size, ElementValue]
      { type: 'string', input: ['02', '6100', '00000070', '6100'] },
      { type: 'binary', input: ['05', '6100', '00000070', '01'] },
      { type: 'dbpointer', input: ['05', '6100', '00000070', '6100', '00'.repeat(12)] },
      { type: 'code', input: ['05', '6100', '00000070', '6100'] },
      { type: 'symbol', input: ['05', '6100', '00000070', '6100'] },
      { type: 'object', input: ['05', '6100', '00000070', '00'] },
      { type: 'array', input: ['05', '6100', '00000070', '00'] },
      { type: 'code_w_scope', input: ['05', '6100', '00000070', '010000006100', '05000000'] }
    ];

    for (const sizedType of sizedTypes) {
      context(`for ${sizedType.type}`, () => {
        it('throws an error that a size cannot be larger than the document', () => {
          const test = () => parseToElements(bufferFromHexArray(sizedType.input));
          expect(test).to.throw(/larger than document/i);
          expect(test).to.throw(BSONOffsetError);
        });
      });
    }
  });

  context('when given an empty bson document', () => {
    it('returns no elements', () => {
      expect(parseToElements(bufferFromHexArray([]))).to.deep.equal([]);
    });
  });

  context('when given a document with an invalid type', () => {
    it('throws an error that there is an invalid type', () => {
      const test = () => parseToElements(bufferFromHexArray(['14', '6100']));
      expect(test).to.throw(/Invalid 0x14 type byte/i);
      expect(test).to.throw(BSONOffsetError);
    });
  });

  context('when given a regexp', () => {
    context('with no null terminator for the pattern', () => {
      it('throws an error', () => {
        const regexp = [
          Buffer.from('abc').toString('hex'),
          // '00',
          Buffer.from('imx').toString('hex'),
          '00'
        ].join('');
        const test = () => parseToElements(bufferFromHexArray(['0B', '6100', regexp]));
        expect(test).to.throw(/Null terminator not found/i);
        expect(test).to.throw(BSONOffsetError);
      });
    });

    context('with no null terminator for the flags', () => {
      it('throws an error', () => {
        const regexp = [
          Buffer.from('abc').toString('hex'),
          '00',
          Buffer.from('imx').toString('hex')
          // '00'
        ].join('');
        const test = () => parseToElements(bufferFromHexArray(['0B', '6100', regexp]));
        expect(test).to.throw(/Null terminator not found/i);
        expect(test).to.throw(BSONOffsetError);
      });
    });
  });

  const common = { nameOffset: 5, nameLength: 1, offset: 7 };
  const regexp = [
    Buffer.from('abc').toString('hex'),
    '00',
    Buffer.from('imx').toString('hex'),
    '00'
  ].join('');
  const code_w_scope = [
    int32LEToHex(13 + 5 + 4), // code is 13, document is 5, 4 for leading int
    stringToUTF8HexBytes('() => {}'),
    int32LEToHex(5),
    '00'
  ].join('');
  const tableTest = [
    {
      name: 'double',
      input: ['01', '6100', '0100000000000000'],
      output: { type: 1, length: 8 }
    },
    {
      name: 'string',
      input: ['02', '6100', stringToUTF8HexBytes('hello')],
      output: { type: 2, length: 'hello'.length + 4 + 1 } // 4 for the size, 1 for the null
    },
    {
      name: 'object',
      input: ['03', '6100', int32LEToHex(5), '00'],
      output: { type: 3, length: 5 }
    },
    {
      name: 'array',
      input: ['04', '6100', int32LEToHex(5), '00'],
      output: { type: 4, length: 5 }
    },
    {
      name: 'binary',
      input: ['05', '6100', int32LEToHex(5), '23', '00'],
      output: { type: 5, length: 10 }
    },
    {
      name: 'undefined',
      input: ['06', '6100'],
      output: { type: 6, length: 0 }
    },
    {
      name: 'objectId',
      input: ['07', '6100', '00'.repeat(12)],
      output: { type: 7, length: 12 }
    },
    {
      name: 'boolean',
      input: ['08', '6100', '45'],
      output: { type: 8, length: 1 }
    },
    {
      name: 'date',
      input: ['09', '6100', '00'.repeat(8)],
      output: { type: 9, length: 8 }
    },
    {
      name: 'null',
      input: ['0A', '6100'],
      output: { type: 10, length: 0 }
    },
    {
      name: 'regexp',
      input: ['0B', '6100', regexp],
      output: { type: 11, length: 8 }
    },
    {
      name: 'dbpointer',
      input: ['0C', '6100', stringToUTF8HexBytes('db.coll'), '00'.repeat(12)],
      output: { type: 12, length: 'db.coll'.length + 4 + 1 + 12 }
    },
    {
      name: 'code',
      input: ['0D', '6100', stringToUTF8HexBytes('() => {}')],
      output: { type: 13, length: '() => {}'.length + 4 + 1 }
    },
    {
      name: 'symbol',
      input: ['0E', '6100', stringToUTF8HexBytes('symbol')],
      output: { type: 14, length: 'symbol'.length + 4 + 1 }
    },
    {
      name: 'code_w_scope',
      input: ['0F', '6100', code_w_scope],
      output: { type: 15, length: '() => {}'.length + 4 + 1 + 5 + 4 }
    },
    {
      name: 'int',
      input: ['10', '6100', int32LEToHex(320)],
      output: { type: 16, length: 4 }
    },
    {
      name: 'timestamp',
      input: ['11', '6100', '00'.repeat(8)],
      output: { type: 17, length: 8 }
    },
    {
      name: 'long',
      input: ['12', '6100', '00'.repeat(8)],
      output: { type: 18, length: 8 }
    },
    {
      name: 'decimal128',
      input: ['13', '6100', '00'.repeat(16)],
      output: { type: 19, length: 16 }
    },
    {
      name: 'minkey',
      input: ['FF', '6100'],
      output: { type: 255, length: 0 }
    },
    {
      name: 'maxkey',
      input: ['7F', '6100'],
      output: { type: 127, length: 0 }
    }
  ];

  context(`when given a bson document`, () => {
    for (const test of tableTest) {
      context(`with one ${test.name} element`, () => {
        it(`returns one element with type=${test.output.type} and length=${test.output.length}`, () => {
          const output = { ...common, ...test.output };
          expect(parseToElements(bufferFromHexArray(test.input))).to.deep.equal([
            [output.type, output.nameOffset, output.nameLength, output.offset, output.length]
          ]);
        });
      });
    }
  });
});
