'use strict';

const { Buffer } = require('buffer');
const BSON = require('../register-bson');
const { isBrowser, bufferFromHexArray, stringToUTF8HexBytes } = require('./tools/utils');
const BSONError = BSON.BSONError;

describe.only('UTF8 validation', function () {
  it('should throw error if true and false mixed for validation option passed in', function () {
    let mixedTrueFalse1 = { validation: { utf8: { a: false, b: true } } };
    let mixedTrueFalse2 = { validation: { utf8: { a: true, b: true, c: false } } };
    let allTrue = { validation: { utf8: { a: true, b: true, c: true } } };
    let allFalse = { validation: { utf8: { a: false, b: false, c: false, d: false } } };
    let sampleValidUTF8 = BSON.serialize('abcdedede');
    expect(() => BSON.deserialize(sampleValidUTF8, mixedTrueFalse1)).to.throw(
      BSONError,
      'Invalid UTF-8 validation option - keys must be all true or all false'
    );
    expect(() => BSON.deserialize(sampleValidUTF8, mixedTrueFalse2)).to.throw(
      BSONError,
      'Invalid UTF-8 validation option - keys must be all true or all false'
    );
    expect(() => BSON.deserialize(sampleValidUTF8, allTrue)).to.not.throw();
    expect(() => BSON.deserialize(sampleValidUTF8, allFalse)).to.not.throw();
  });

  it('should throw error if empty utf8 validation option passed in', function () {
    var doc = { a: 'validation utf8 option cant be empty' };
    let emptyUTF8validation = { validation: { utf8: {} } };
    const serialized = BSON.serialize(doc);
    expect(() => BSON.deserialize(serialized, emptyUTF8validation)).to.throw(
      BSONError,
      'validation option is empty'
    );
  });

  // Invalid utf8 examples
  const invalidUtf8 = bufferFromHexArray([
    '02', // utf8 type
    '696e76616c69647574663800', // key 'invalidutf8'
    '09000000', // size of bytes + null
    '6869f09f90627965', // value 'hi' + broken byte sequence + 'bye'
    '00'
  ]);
  const invalidUTF8str1 = Buffer.from('0E00000002610002000000E90000', 'hex');
  const invalidUTF8str2 = Buffer.from(
    '1A0000000C610002000000E90056E1FC72E0C917E9C471416100',
    'hex'
  );
  const invalidUtf8SingleKey = [invalidUtf8, invalidUTF8str1, invalidUTF8str2];

  it('should enforce UTF8 validation by default if no validation option specified', function () {
    for (const example of invalidUtf8SingleKey) {
      expect(() => BSON.deserialize(example)).to.throw(
        BSONError,
        'Invalid UTF-8 string in BSON document'
      );
    }
  });

  it('should disable UTF8 validation on any single key if validation option sets utf8: false', function () {
    let validationOption = { validation: { utf8: false } };
    for (const example of invalidUtf8SingleKey) {
      expect(() => BSON.deserialize(example, validationOption)).to.not.throw();
    }
  });

  it('should enable UTF8 validation on any key if validation option sets utf8: true', function () {
    let validationOption = { validation: { utf8: true } };
    for (const example of invalidUtf8SingleKey) {
      expect(() => BSON.deserialize(example, validationOption)).to.throw(
        BSONError,
        'Invalid UTF-8 string in BSON document'
      );
    }
  });

  const invalidUtf8ManyKeys = bufferFromHexArray([
    '02', // utf8 type
    Buffer.from('validUtf8Chars', 'utf8').toString('hex') + '00',
    stringToUTF8HexBytes('abc'),
    '02',
    Buffer.from('invalidUtf8', 'utf8').toString('hex') + '00',
    '090000006869f09f9062796500', // value 'hi' + broken byte sequence + 'bye'
    '02',
    Buffer.from('invalidUtf82', 'utf8').toString('hex') + '00',
    '0a000000f09f90f09f9062796500' // 2 broken byte sequences + 'bye'
  ]);

  const expectedObjWithReplacements = {
    validUtf8Chars: 'abc',
    invalidUtf8: 'hi�bye',
    invalidUtf82: '��bye'
  };

  const testOutputObjects = [
    {
      behavior: 'enable global UTF8 validation',
      validation: { validation: { utf8: true } },
      errorExpect: true
    },
    {
      behavior: 'globally disable UTF8 validation',
      validation: { validation: { utf8: false } },
      errorExpect: false
    },
    {
      behavior: 'enable UTF8 validation for specified key and disable for other keys',
      validation: { validation: { utf8: { invalidUtf8: true } } },
      errorExpect: true
    },
    {
      behavior: 'disable UTF8 validation for specified key and enable for other keys',
      validation: { validation: { utf8: { invalidUtf82: false } } },
      errorExpect: true
    },
    {
      behavior: 'disable UTF8 validation for all specified keys',
      validation: { validation: { utf8: { invalidUtf8: false, invalidUtf82: false } } },
      errorExpect: false
    }
  ];

  for (const { behavior, validation, errorExpect } of testOutputObjects) {
    it(`should ${behavior} for object with invalid utf8 in top level keys`, function () {
      if (isBrowser()) this.skip();
      const encodedObj = invalidUtf8ManyKeys;
      if (errorExpect) {
        expect(() => BSON.deserialize(encodedObj, validation)).to.throw(
          BSONError,
          'Invalid UTF-8 string in BSON document'
        );
      } else {
        expect(BSON.deserialize(encodedObj, validation)).to.deep.equals(
          expectedObjWithReplacements
        );
      }
    });
  }

  const invalidUtf8NestedKeys = bufferFromHexArray([
    '03' + Buffer.from('a', 'utf8').toString('hex') + '00', // key a
    '3a000000',
    '03' + Buffer.from('a1', 'utf8').toString('hex') + '00', // subkey a1
    '31000000',
    '02' + Buffer.from('a11', 'utf8').toString('hex') + '00', // nested subkeys
    stringToUTF8HexBytes('abcdefg'),
    '02' + Buffer.from('invalidUtf81', 'utf8').toString('hex') + '00',
    '090000006869f09f9062796500',
    '00',
    '00',
    '03' + Buffer.from('b', 'utf8').toString('hex') + '00', // key b
    '30000000',
    '02' + Buffer.from('b1', 'utf8').toString('hex') + '00', // subkey b1
    stringToUTF8HexBytes('abcdefg'),
    '02' + Buffer.from('invalidUtf82', 'utf8').toString('hex') + '00', // subkey invalidUtf82
    '090000006869f09f9062796500' + '00',
    '02' + Buffer.from('invalidUtf83', 'utf8').toString('hex') + '00', // key invalidUtf83
    '090000006869f09f9062796500'
  ]);

  const expectedNestedKeysObj = {
    a: {
      a1: {
        a11: 'abcdefg',
        invalidUtf81: 'hi�bye'
      }
    },
    b: {
      b1: 'abcdefg',
      invalidUtf82: 'hi�bye'
    },
    invalidUtf83: 'hi�bye'
  };

  const testOutputObjectsNested = [
    {
      behavior: 'enable global UTF8 validation',
      validation: { validation: { utf8: true } },
      errorExpect: true
    },
    {
      behavior: 'globally disable UTF8 validation',
      validation: { validation: { utf8: false } },
      errorExpect: false
    },
    {
      behavior: 'disable UTF8 validation for specified key and enable for other keys',
      validation: { validation: { utf8: { a: false } } },
      errorExpect: true
    },
    {
      behavior: 'enable UTF8 validation for specified key and disable for other keys',
      validation: { validation: { utf8: { a: true } } },
      errorExpect: true
    },
    {
      behavior: 'disable UTF8 validation on specified invalid keys',
      validation: { validation: { utf8: { a: false, b: false } } },
      errorExpect: true
    },
    {
      behavior: 'disable UTF8 validation on all invalid keys',
      validation: {
        validation: {
          utf8: { a: false, b: false, invalidUtf83: false }
        }
      },
      errorExpect: false
    }
  ];

  for (const { behavior, validation, errorExpect } of testOutputObjectsNested) {
    it(`should ${behavior} for object with invalid utf8 in nested keys`, function () {
      if (isBrowser()) this.skip();
      if (errorExpect) {
        expect(() => BSON.deserialize(invalidUtf8NestedKeys, validation)).to.throw(
          BSONError,
          'Invalid UTF-8 string in BSON document'
        );
      } else {
        expect(BSON.deserialize(invalidUtf8NestedKeys, validation)).to.deep.equals(
          expectedNestedKeysObj
        );
      }
    });
  }
});
