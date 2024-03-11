import * as sinon from 'sinon';
import { expect } from 'chai';
import { Code, onDemand } from '../../../register-bson';
import { ByteUtils } from '../../../../src/utils/byte_utils';

import { bufferFromHexArray, stringToUTF8HexBytes, int32LEToHex } from '../../tools/utils';

const parseToStructure = onDemand.parseToStructure;

const enum e {
  type = 0,
  nameOffset = 1,
  nameLength = 2,
  offset = 3,
  length = 4
}

describe('parseToStructure()', () => {
  context('when called with an empty document sequence', () => {
    it('returns an object with no properties', () => {
      const res = parseToStructure(new Uint8Array([5, 0, 0, 0, 0]));
      expect(res).to.deep.equal(Object.create(null));
    });

    it('returns an object with a null prototype', () => {
      const res = parseToStructure(new Uint8Array([5, 0, 0, 0, 0]));
      expect(Object.getPrototypeOf(res)).to.be.null;
    });

    it('never calls reviver', () => {
      const spy = sinon.spy();
      parseToStructure(new Uint8Array([5, 0, 0, 0, 0]), undefined, undefined, spy);
      expect(spy).to.not.have.been.called;
    });

    it('returns given root container', () => {
      const dest = new Map();
      const res = parseToStructure(new Uint8Array([5, 0, 0, 0, 0]), undefined, {
        kind: 'map',
        dest
      });
      // instance eq check
      expect(res).to.equal(dest);
    });
  });

  context('when called with a single element sequence', () => {
    const bsonBytes = bufferFromHexArray([
      '10', // int32 type
      '6100', // 'a' key with key null terminator
      '01000000' // little endian int32
    ]);

    it('calls the reviver with the same instance of the input bytes', () => {
      const spy = sinon.spy();
      parseToStructure(bsonBytes, undefined, undefined, spy);
      expect(spy).to.have.been.calledWith(sinon.match.same(bsonBytes));
    });

    it('calls the reviver with default object container', () => {
      const spy = sinon.spy();
      parseToStructure(bsonBytes, undefined, undefined, spy);
      expect(spy).to.have.been.calledWith(
        sinon.match.any,
        sinon.match({ kind: 'object', dest: {} })
      );
    });

    it('calls the reviver with the int element', () => {
      const spy = sinon.spy();
      parseToStructure(bsonBytes, undefined, undefined, spy);
      expect(spy).to.have.been.calledWith(
        sinon.match.any,
        sinon.match.any,
        sinon.match(
          Object.values({
            type: 0x10, // int
            nameOffset: 5,
            nameLength: 1,
            offset: 7,
            length: 4
          })
        )
      );
    });
  });

  context(`when given a bson document`, () => {
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
        name: 'empty object',
        input: ['03', '6100', int32LEToHex(5), '00'],
        output: { type: 3, length: 5 }
      },
      {
        name: 'empty array',
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
        name: 'empty code_w_scope',
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

    context('when reviver returns null', () => {
      it('does not iterate the embedded documents', () => {
        const embedded = bufferFromHexArray([
          '03', // object
          '6200', // 'b'
          bufferFromHexArray(['01', '6100', '0100000000000000']).toString('hex')
        ]);

        const spy = sinon.stub().returns(null);
        const res = parseToStructure(embedded, undefined, { kind: 'custom' }, spy);
        expect(spy).to.have.been.calledOnceWith(
          sinon.match.same(embedded),
          sinon.match({ kind: 'custom' }),
          sinon.match(
            Object.values({ type: 3, nameOffset: 5, nameLength: 1, offset: 7, length: 16 })
          )
        );
        expect(res).to.be.undefined;
      });
    });

    for (const test of tableTest) {
      context(`with one ${test.name} element`, () => {
        it(`calls reviver with bytes, container, and element with type=${test.output.type} and length=${test.output.length}`, () => {
          const bsonBytes = bufferFromHexArray(test.input);
          const output = { ...common, ...test.output };
          const spy = sinon.spy();
          parseToStructure(bsonBytes, undefined, undefined, spy);
          expect(spy).to.have.been.calledWith(
            sinon.match.same(bsonBytes),
            sinon.match({ kind: 'object', dest: {} }),
            sinon.match([
              output.type,
              output.nameOffset,
              output.nameLength,
              output.offset,
              output.length
            ])
          );
        });
      });
    }

    for (const test of tableTest) {
      context(`with embedded document that contains ${test.name}`, () => {
        const embedded = bufferFromHexArray([
          '03', // object
          '6200', // 'b'
          bufferFromHexArray(test.input).toString('hex')
        ]);

        const makeReviverSpy = () =>
          sinon.stub().callsFake(function myReviver(bytes, container, element) {
            const key = ByteUtils.toUTF8(
              bytes,
              element[e.nameOffset],
              element[e.nameOffset] + element[e.nameLength],
              true
            );
            if (element[0] === 3 && key === 'b') {
              // key is 'b' and element is object (top-level)

              container.dest[key] = Object.create(null);
              return {
                kind: 'object',
                dest: container.dest[key]
              };
            }

            container.dest[key] = element;
          });

        it(`calls reviver with embedded element`, () => {
          const output = Object.values({
            type: test.output.type,
            // 4 size bytes + doc type byte + 2 'b\x00' + 4 size bytes + value type byte == 12
            nameOffset: 12,
            nameLength: 1,
            offset: 14, // 12 + 'a\x00'
            length: test.output.length
          });
          const spy = makeReviverSpy();
          const res = parseToStructure(embedded, undefined, undefined, spy);
          expect(res).to.deep.equal({ b: { a: output } });
        });
      });

      context(`with embedded array that contains ${test.name}`, () => {
        const embedded = bufferFromHexArray([
          '04', // array
          '6200', // 'b'
          bufferFromHexArray(test.input).toString('hex')
        ]);

        const makeReviverSpy = () =>
          sinon.stub().callsFake(function myReviver(bytes, container, element) {
            if (element[0] === 4) {
              const key = ByteUtils.toUTF8(
                bytes,
                element[e.nameOffset],
                element[e.nameOffset] + element[e.nameLength],
                true
              );
              if (key === 'b') {
                // key is 'b' and element is array (top-level)

                container.dest[key] = [];
                return {
                  kind: 'array',
                  dest: container.dest[key]
                };
              }
            }

            // wow! no key parsing necessary!
            container.dest.push(element);
          });

        it(`calls reviver with embedded element`, () => {
          const output = Object.values({
            type: test.output.type,
            // 4 size bytes + doc type byte + 2 'b\x00' + 4 size bytes + value type byte == 12
            nameOffset: 12,
            nameLength: 1,
            offset: 14, // 12 + 'a\x00'
            length: test.output.length
          });
          const spy = makeReviverSpy();
          const res = parseToStructure(embedded, undefined, undefined, spy);
          expect(res).to.deep.equal({ b: [output] });
        });
      });

      context(`with embedded code_w_scope that contains ${test.name}`, () => {
        const scope = bufferFromHexArray(test.input);
        const embedded = bufferFromHexArray([
          '0F', // code_w_scope
          '6200', // 'b'
          int32LEToHex(13 + scope.length + 4), // code is 13, document is scope.length, 4 for leading int
          stringToUTF8HexBytes('() => {}'),
          scope.toString('hex')
        ]);

        const makeReviverSpy = () =>
          sinon.stub().callsFake(function myReviver(bytes, container, element) {
            const key = ByteUtils.toUTF8(
              bytes,
              element[e.nameOffset],
              element[e.nameOffset] + element[e.nameLength],
              true
            );
            if (element[0] === 15 && key === 'b') {
              // key is 'b' and element is code_w_scope (top-level)
              const offset = element[e.offset];
              const functionStringLength =
                bytes[offset + 4] |
                (bytes[offset + 5] << 8) |
                (bytes[offset + 6] << 16) |
                (bytes[offset + 7] << 24);
              const start = offset + 4 + 4;
              const end = start + functionStringLength - 1;
              const codeString = ByteUtils.toUTF8(bytes, start, end, true);
              const code = new Code(codeString, Object.create(null));
              container.dest[key] = code;
              return {
                kind: 'code',
                dest: container.dest[key]
              };
            }

            // wow! no key parsing necessary!
            container.dest.scope[key] = element;
          });

        it(`calls reviver with embedded element`, () => {
          const output = Object.values({
            type: test.output.type,
            /**
             * 29 comes from:
             * - 4 bytes for the embedded document
             * - 1 type byte
             * - etc... todo math
             */
            nameOffset: 29,
            nameLength: 1,
            offset: 31, // 12 + 'a\x00'
            length: test.output.length
          });
          const spy = makeReviverSpy();
          const res = parseToStructure(embedded, undefined, undefined, spy);
          expect(res).to.deep.equal({ b: new Code('() => {}', { a: output }) });
        });
      });
    }
  });

  context('when given a bson document with an array that has 100 items', () => {
    it('calls the reviver 101 times, 1 for the document, 100 for the array items', () => {
      // Cheating by making an array of 0 length keys
      const intValue = ['10', '00', int32LEToHex(1)].join('');
      const bsonBytes = bufferFromHexArray([
        '04', // array
        '6100', // 'a' key with key null terminator
        bufferFromHexArray([intValue.repeat(100)]).toString('hex')
      ]);

      const spy = sinon.stub().returnsArg(1);
      parseToStructure(bsonBytes, undefined, undefined, spy);
      expect(spy).to.have.callCount(101);
    });
  });
});
