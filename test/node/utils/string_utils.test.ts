import { expect } from 'chai';
import * as StringUtils from '../../../src/utils/string_utils';

describe('removeLeadingZerosAndExplicitPlus()', function () {
  const inputs: [testName: string, str: string, expectedStr: string][] = [
    ['a string with zero with leading zeros', '000000', '0'],
    ['a string with positive leading zeros', '000000867', '867'],
    ['a string with explicity positive leading zeros', '+000000867', '867'],
    ['a string with negative leading zeros', '-00007', '-7'],
    ['a string with explicit positive zeros', '+000000', '0'],
    ['a string explicit positive no leading zeros', '+32', '32'],
    ['a string explicit positive no leading zeros and letters', '+ab00', 'ab00']
  ];

  for (const [testName, str, expectedStr] of inputs) {
    context(`when the input is ${testName}`, () => {
      it(`should return a input string`, () => {
        expect(StringUtils.removeLeadingZerosAndExplicitPlus(str)).to.equal(expectedStr);
      });
    });
  }
});

describe('validateStringCharacters()', function () {
  const successInputs: [testName: string, str: string, radix: number][] = [
    ['radix does allows given alphabet letter', 'eEe', 15],
    ['empty string', '', 2],
    ['all possible hexadecimal characters', '12efabc689873dADCDEF', 16],
    ['leading zeros', '0000000004567e', 16],
    ['explicit positive no leading zeros', '+32', 10]
  ];

  const failureInputs = [
    ['multiple decimal points', '..', 30],
    ['non a-z or numeric string', '~~', 36],
    ['alphabet in radix < 10', 'a', 4],
    ['radix does not allow all alphabet letters', 'eee', 14]
  ];

  for (const [testName, str, radix] of successInputs) {
    context(`when the input is ${testName}`, () => {
      it(`should return a input string`, () => {
        expect(StringUtils.validateStringCharacters(str, radix)).to.equal(str);
      });
    });
  }

  for (const [testName, str, radix] of failureInputs) {
    context(`when the input is ${testName}`, () => {
      it(`should return false`, () => {
        expect(StringUtils.validateStringCharacters(str, radix)).to.equal(false);
      });
    });
  }
});
