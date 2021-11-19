'use strict';

const { Buffer } = require('buffer');
const BSON = require('../register-bson');
const { isNode6, isBrowser } = require('./tools/utils');
const BSONError = BSON.BSONError;

describe('UTF8 validation', function () {
  // Test both browser shims and node which have different replacement mechanisms
  const replacementChar = isNode6() || isBrowser() ? '\u{FFFD}\u{FFFD}\u{FFFD}' : '\u{FFFD}';
  const replacementString = `hi${replacementChar}bye`;
  const twoCharReplacementStr = `${replacementChar}${replacementChar}bye`;
  const sampleValidUTF8 = BSON.serialize({
    a: '😎',
    b: 'valid utf8',
    c: 12345
  });

  it('should throw error if true and false mixed for validation option passed in with valid utf8 example', function () {
    const mixedTrueFalse1 = { validation: { utf8: { a: false, b: true } } };
    const mixedTrueFalse2 = { validation: { utf8: { a: true, b: true, c: false } } };
    expect(() => BSON.deserialize(sampleValidUTF8, mixedTrueFalse1)).to.throw(
      BSONError,
      'Invalid UTF-8 validation option - keys must be all true or all false'
    );
    expect(() => BSON.deserialize(sampleValidUTF8, mixedTrueFalse2)).to.throw(
      BSONError,
      'Invalid UTF-8 validation option - keys must be all true or all false'
    );
  });

  it('should correctly handle validation if validation option contains all T or all F with valid utf8 example', function () {
    const allTrue = { validation: { utf8: { a: true, b: true, c: true } } };
    const allFalse = { validation: { utf8: { a: false, b: false, c: false, d: false } } };
    expect(() => BSON.deserialize(sampleValidUTF8, allTrue)).to.not.throw();
    expect(() => BSON.deserialize(sampleValidUTF8, allFalse)).to.not.throw();
  });

  it('should throw error if empty utf8 validation option passed in', function () {
    const doc = { a: 'validation utf8 option cant be empty' };
    const serialized = BSON.serialize(doc);
    const emptyUTF8validation = { validation: { utf8: {} } };
    expect(() => BSON.deserialize(serialized, emptyUTF8validation)).to.throw(
      BSONError,
      'UTF-8 validation setting cannot be empty'
    );
  });

  it('should throw error if non-boolean utf8 field for validation option is specified for a key', function () {
    const utf8InvalidOptionObj = { validation: { utf8: { a: { a: true } } } };
    const utf8InvalidOptionArr = {
      validation: { utf8: { a: ['should', 'be', 'boolean'], b: true } }
    };
    const utf8InvalidOptionStr = { validation: { utf8: { a: 'bad value', b: true } } };

    expect(() => BSON.deserialize(sampleValidUTF8, utf8InvalidOptionObj)).to.throw(
      BSONError,
      'Invalid UTF-8 validation option, must specify boolean values'
    );
    expect(() => BSON.deserialize(sampleValidUTF8, utf8InvalidOptionArr)).to.throw(
      BSONError,
      'Invalid UTF-8 validation option, must specify boolean values'
    );
    expect(() => BSON.deserialize(sampleValidUTF8, utf8InvalidOptionStr)).to.throw(
      BSONError,
      'Invalid UTF-8 validation option, must specify boolean values'
    );
  });

  const testInputs = [
    {
      description: 'object with valid utf8 top level keys',
      buffer: Buffer.from(
        '2e0000000276616c69644b65794368617200060000006162636465001076616c69644b65794e756d003930000000',
        'hex'
      ),
      expectedObjectWithReplacementChars: {
        validKeyChar: 'abcde',
        validKeyNum: 12345
      },
      containsInvalid: false,
      testCases: []
    },
    {
      description: 'object with invalid utf8 top level key',
      buffer: Buffer.from(
        '420000000276616c69644b657943686172000600000061626364650002696e76616c696455746638546f704c6576656c4b657900090000006869f09f906279650000',
        'hex'
      ),
      expectedObjectWithReplacementChars: {
        validKeyChar: 'abcde',
        invalidUtf8TopLevelKey: replacementString
      },
      containsInvalid: true,
      testCases: [
        {
          validation: { validation: { utf8: { validKeyChar: false } } },
          behavior: 'throw error when only valid toplevel key has validation disabled'
        },
        {
          validation: { validation: { utf8: { invalidUtf8TopLevelKey: false } } },
          behavior: 'not throw error when only invalid toplevel key has validation disabled'
        },
        {
          validation: {
            validation: { utf8: { validKeyChar: false, invalidUtf8TopLevelKey: false } }
          },
          behavior:
            'not throw error when both valid and invalid toplevel keys have validation disabled'
        },
        {
          validation: { validation: { utf8: { validKeyChar: true } } },
          behavior: 'not throw error when only valid toplevel key has validation enabled'
        },
        {
          validation: { validation: { utf8: { invalidUtf8TopLevelKey: true } } },
          behavior: 'throw error when only invalid toplevel key has validation enabled'
        },
        {
          validation: {
            validation: { utf8: { validKeyChar: true, invalidUtf8TopLevelKey: true } }
          },
          behavior: 'throw error when both valid and invalid toplevel keys have validation enabled'
        }
      ]
    },
    {
      description: 'object with invalid utf8 in nested key object',
      buffer: Buffer.from(
        '460000000276616c69644b657943686172000600000061626364650003746f704c766c4b6579001e00000002696e76616c69644b657900090000006869f09f90627965000000',
        'hex'
      ),
      expectedObjectWithReplacementChars: {
        validKeyChar: 'abcde',
        topLvlKey: {
          invalidKey: replacementString
        }
      },
      containsInvalid: true,
      testCases: [
        {
          validation: { validation: { utf8: { validKeyChar: false } } },
          behavior: 'throw error when only valid toplevel key has validation disabled'
        },
        {
          validation: { validation: { utf8: { topLvlKey: false } } },
          behavior:
            'not throw error when only toplevel key with invalid subkey has validation disabled'
        },
        {
          validation: { validation: { utf8: { invalidKey: false } } },
          behavior:
            'throw error when specified invalid key for disabling validation is not a toplevel key'
        },
        {
          validation: { validation: { utf8: { validKeyChar: false, topLvlKey: false } } },
          behavior:
            'not throw error when both valid toplevel key and toplevel key with invalid subkey have validation disabled'
        },
        {
          validation: { validation: { utf8: { validKeyChar: true } } },
          behavior: 'not throw error when only valid toplevel key has validation enabled'
        },
        {
          validation: { validation: { utf8: { topLvlKey: true } } },
          behavior:
            'throw error when only toplevel key containing nested invalid key has validation enabled'
        },
        {
          validation: { validation: { utf8: { validKeyChar: true, topLvlKey: true } } },
          behavior:
            'throw error when both valid key and nested invalid toplevel keys have validation enabled'
        }
      ]
    },
    {
      description: 'object with invalid utf8 in two top level keys',
      buffer: Buffer.from(
        '5e0000000276616c69644b65794368617200040000006162630002696e76616c696455746638546f704c766c3100090000006869f09f906279650002696e76616c696455746638546f704c766c32000a000000f09f90f09f906279650000',
        'hex'
      ),
      expectedObjectWithReplacementChars: {
        validKeyChar: 'abc',
        invalidUtf8TopLvl1: replacementString,
        invalidUtf8TopLvl2: twoCharReplacementStr
      },
      containsInvalid: true,
      testCases: [
        {
          validation: { validation: { utf8: { invalidUtf8TopLvl1: false } } },
          behavior:
            'throw error when only one of two invalid top level keys has validation disabled'
        },
        {
          validation: {
            validation: { utf8: { invalidUtf8TopLvl1: false, invalidUtf8TopLvl2: false } }
          },
          behavior: 'not throw error when all invalid top level keys have validation disabled'
        },
        {
          validation: { validation: { utf8: { validKeyChar: true } } },
          behavior: 'not throw error when only the valid top level key has enabled validation'
        },
        {
          validation: { validation: { utf8: { validKeyChar: true, invalidUtf8TopLvl1: true } } },
          behavior:
            'throw error when only the valid toplevel key and one of the invalid keys has enabled validation'
        }
      ]
    },
    {
      description: 'object with valid utf8 in top level key array',
      buffer: Buffer.from(
        '4a0000000276616c69644b657943686172000600000061626364650004746f704c766c41727200220000000230000300000068690002310005000000f09f988e00103200393000000000',
        'hex'
      ),
      expectedObjectWithReplacementChars: {
        validKeyChar: 'abcde',
        topLvlArr: ['hi', '😎', 12345]
      },
      containsInvalid: false,
      testCases: [
        {
          validation: { validation: { utf8: { validKeyChar: false, topLvlArr: false } } },
          behavior: 'not throw error when both valid top level keys have validation disabled'
        },
        {
          validation: { validation: { utf8: { validKeyChar: true, topLvlArr: true } } },
          behavior: 'not throw error when both valid top level keys have validation enabled'
        }
      ]
    },
    {
      description: 'object with invalid utf8 in top level key array',
      buffer: Buffer.from(
        '4e0000000276616c69644b657943686172000600000061626364650004746f704c766c417272002600000002300003000000686900023100090000006869f09f9062796500103200393000000000',
        'hex'
      ),
      expectedObjectWithReplacementChars: {
        validKeyChar: 'abcde',
        topLvlArr: ['hi', replacementString, 12345]
      },
      containsInvalid: true,
      testCases: [
        {
          validation: { validation: { utf8: { topLvlArr: false } } },
          behavior: 'not throw error when invalid toplevel key array has validation disabled'
        },
        {
          validation: { validation: { utf8: { topLvlArr: true } } },
          behavior: 'throw error when invalid toplevel key array has validation enabled'
        },
        {
          validation: { validation: { utf8: { validKeyChar: true, topLvlArr: true } } },
          behavior: 'throw error when both valid and invalid toplevel keys have validation enabled'
        }
      ]
    },
    {
      description: 'object with invalid utf8 in nested key array',
      buffer: Buffer.from(
        '5a0000000276616c69644b657943686172000600000061626364650003746f704c766c4b65790032000000046e65737465644b6579417272001f00000002300003000000686900023100090000006869f09f9062796500000000',
        'hex'
      ),
      expectedObjectWithReplacementChars: {
        validKeyChar: 'abcde',
        topLvlKey: {
          nestedKeyArr: ['hi', replacementString]
        }
      },
      containsInvalid: true,
      testCases: [
        {
          validation: { validation: { utf8: { topLvlKey: false } } },
          behavior:
            'not throw error when toplevel key for array with invalid key has validation disabled'
        },
        {
          validation: { validation: { utf8: { topLvlKey: true } } },
          behavior:
            'throw error when toplevel key for array with invalid key has validation enabled'
        },
        {
          validation: { validation: { utf8: { nestedKeyArr: false } } },
          behavior:
            'throw error when specified invalid key for disabling validation is not a toplevel key'
        },
        {
          validation: { validation: { utf8: { validKeyChar: true, topLvlKey: true } } },
          behavior:
            'throw error when both toplevel key and key with nested key with invalid array have validation enabled'
        }
      ]
    }
  ];

  for (const {
    description,
    containsInvalid,
    buffer,
    expectedObjectWithReplacementChars
  } of testInputs) {
    const behavior = 'validate utf8 if no validation option given';
    it(`should ${behavior} for ${description}`, function () {
      if (containsInvalid) {
        expect(() => BSON.deserialize(buffer)).to.throw(
          BSONError,
          'Invalid UTF-8 string in BSON document'
        );
      } else {
        expect(BSON.deserialize(buffer)).to.deep.equals(expectedObjectWithReplacementChars);
      }
    });
  }

  for (const { description, buffer, expectedObjectWithReplacementChars } of testInputs) {
    const behavior = 'not validate utf8 and not throw an error';
    it(`should ${behavior} for ${description} with global utf8 validation disabled`, function () {
      const validation = Object.freeze({ validation: Object.freeze({ utf8: false }) });
      expect(BSON.deserialize(buffer, validation)).to.deep.equals(
        expectedObjectWithReplacementChars
      );
    });
  }

  for (const {
    description,
    containsInvalid,
    buffer,
    expectedObjectWithReplacementChars
  } of testInputs) {
    const behavior = containsInvalid ? 'throw error' : 'validate utf8 with no errors';
    it(`should ${behavior} for ${description} with global utf8 validation enabled`, function () {
      const validation = Object.freeze({ validation: Object.freeze({ utf8: true }) });
      if (containsInvalid) {
        expect(() => BSON.deserialize(buffer, validation)).to.throw(
          BSONError,
          'Invalid UTF-8 string in BSON document'
        );
      } else {
        expect(BSON.deserialize(buffer, validation)).to.deep.equals(
          expectedObjectWithReplacementChars
        );
      }
    });
  }

  for (const { description, buffer, expectedObjectWithReplacementChars, testCases } of testInputs) {
    for (const { behavior, validation } of testCases) {
      it(`should ${behavior} for ${description}`, function () {
        Object.freeze(validation);
        Object.freeze(validation.utf8);
        if (behavior.substring(0, 3) === 'not') {
          expect(BSON.deserialize(buffer, validation)).to.deep.equals(
            expectedObjectWithReplacementChars
          );
        } else {
          expect(() => BSON.deserialize(buffer, validation)).to.throw(
            BSONError,
            'Invalid UTF-8 string in BSON document'
          );
        }
      });
    }
  }
});
