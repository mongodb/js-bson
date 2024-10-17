import { expect } from 'chai';
import { bufferFromHexArray } from './tools/utils';
import { BSON } from '../register-bson';
import { BSON_DATA_NULL } from '../../src/constants';

describe('BSON undefined', () => {
  const KEY_A = '6100';
  const KEY_0 = '3000';
  const KEY_1 = '3100';
  const KEY_2 = '3200';
  const bsonDocWithUndefined = bufferFromHexArray([
    '06', // BSON undefined
    KEY_A
  ]);

  describe('when deserialize is given BSON bytes with undefined value', function () {
    it('returns a javascript undefined value', () => {
      const doc = BSON.deserialize(bsonDocWithUndefined);
      expect(doc).to.have.own.property('a').that.is.undefined;
    });
  });

  describe('when serialize is given a javascript object that contains undefined', () => {
    describe('when ignoreUndefined is set to false', function () {
      it('serializes to document with a set to BSON null (type=10)', () => {
        const jsObject = BSON.deserialize(bsonDocWithUndefined);
        const bytes = BSON.serialize(jsObject, { ignoreUndefined: false });
        expect(bytes).to.have.lengthOf(8);
        expect(bytes).to.have.own.property('4', BSON_DATA_NULL);
      });
    });

    describe('when ignoreUndefined is set to true', function () {
      it('serializes to empty document', () => {
        const jsObject = BSON.deserialize(bsonDocWithUndefined);
        const bytes = BSON.serialize(jsObject, { ignoreUndefined: true });
        expect(bytes).to.deep.equal(Uint8Array.of(5, 0, 0, 0, 0));
      });
    });

    describe('when ignoreUndefined is unset', function () {
      it('serializes to empty document', () => {
        const jsObject = BSON.deserialize(bsonDocWithUndefined);
        const bytes = BSON.serialize(jsObject);
        expect(bytes).to.deep.equal(Uint8Array.of(5, 0, 0, 0, 0));
      });
    });
  });

  describe('when undefined appears inside an array', function () {
    describe('when ignoreUndefined is set to true', function () {
      it('does not ignore undefined values', function () {
        // because this would change the size of the array
        const doc = { a: [1, undefined, 3] };
        const bytes = BSON.serialize(doc, { ignoreUndefined: true });
        expect(bytes).to.deep.equal(
          bufferFromHexArray([
            '04', // array
            KEY_A,
            bufferFromHexArray([
              ...['10', KEY_0, '01000000'], // int "0" = 1
              ...['0A', KEY_1], // null "1"
              ...['10', KEY_2, '03000000'] // int "2" = 3
            ]).toString('hex')
          ])
        );
      });
    });

    describe('when ignoreUndefined is set to false', function () {
      it('serializes undefined values as null', function () {
        const doc = { a: [1, undefined, 3] };
        const bytes = BSON.serialize(doc, { ignoreUndefined: false });
        expect(bytes).to.deep.equal(
          bufferFromHexArray([
            '04', // array
            KEY_A,
            bufferFromHexArray([
              ...['10', KEY_0, '01000000'], // int "0" = 1
              ...['0A', KEY_1], // null "1"
              ...['10', KEY_2, '03000000'] // int "2" = 3
            ]).toString('hex')
          ])
        );
      });
    });

    describe('when ignoreUndefined is unset', function () {
      it('serializes undefined values as null', function () {
        const doc = { a: [1, undefined, 3] };
        const bytes = BSON.serialize(doc);
        expect(bytes).to.deep.equal(
          bufferFromHexArray([
            '04', // array
            KEY_A,
            bufferFromHexArray([
              ...['10', KEY_0, '01000000'], // int "0" = 1
              ...['0A', KEY_1], // null "1"
              ...['10', KEY_2, '03000000'] // int "2" = 3
            ]).toString('hex')
          ])
        );
      });
    });
  });
});
