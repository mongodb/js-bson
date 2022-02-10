'use strict';

const BSON = require('../register-bson');
const BSONRegExp = BSON.BSONRegExp;

describe('BSON Corpus Prose Tests', function () {
  /**
   * The BSON spec uses null-terminated strings to represent document field names and
   * regex components (i.e. pattern and flags/options). Drivers MUST assert that null
   * bytes are prohibited in the following contexts when encoding BSON (i.e. creating
   * raw BSON bytes or constructing BSON-specific type classes):
   * - Field name within a root document
   * - Field name within a sub-document
   * - Pattern for a regular expression
   * - Flags/options for a regular expression
   * Depending on how drivers implement BSON encoding, they MAY expect an error when
   * constructing a type class (e.g. BSON Document or Regex class) or when encoding a
   * language representation to BSON (e.g. converting a dictionary, which might allow
   * null bytes in its keys, to raw BSON bytes).
   */
  describe('1. Prohibit null bytes in null-terminated strings when encoding BSON', () => {
    it('Field name within a root document', () => {
      expect(() => BSON.serialize({ 'a\x00b': 1 })).to.throw(/null bytes/);
    });

    it('Field name within a sub-document', () => {
      expect(() => BSON.serialize({ a: { 'a\x00b': 1 } })).to.throw(/null bytes/);
    });

    it('Pattern for a regular expression', () => {
      // eslint-disable-next-line no-control-regex
      expect(() => BSON.serialize({ a: new RegExp('a\x00b') })).to.throw(/null bytes/);
      expect(() => BSON.serialize({ a: new BSONRegExp('a\x00b') })).to.throw(/null bytes/);
    });

    it('Flags/options for a regular expression', () => {
      expect(() => BSON.serialize({ a: new BSONRegExp('a', 'i\x00m') })).to.throw(/null bytes/);

      // eslint-disable-next-line no-invalid-regexp
      expect(() => new RegExp('a', 'i\x00m')).to.throw(SyntaxError);
    });
  });
});
