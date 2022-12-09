import * as BSON from '../../register-bson';
import { expect } from 'chai';
import { bufferFromHexArray } from '../tools/utils';

describe('deserializer()', () => {
  describe('when the fieldsAsRaw options is present and has a value that corresponds to a key in the object', () => {
    it('ignores non-own properties set on the options object', () => {
      const bytes = BSON.serialize({ someKey: [1] });
      const options = { fieldsAsRaw: { someKey: true } };
      Object.setPrototypeOf(options, { promoteValues: false });
      const result = BSON.deserialize(bytes, options);
      expect(result).to.have.property('someKey').that.is.an('array');
      expect(
        result.someKey[0],
        'expected promoteValues option set on options object prototype to be ignored, but it was not'
      ).to.not.have.property('_bsontype', 'Int32');
    });
  });

  describe('when passing an evalFunctions option', () => {
    const codeTypeBSON = bufferFromHexArray([
      '0D', // javascript type
      '6100', // 'a\x00'
      // 29 chars + null byte
      '1E000000',
      Buffer.from('function iLoveJavascript() {}\x00', 'utf8').toString('hex')
    ]);
    const codeWithScopeTypeBSON = bufferFromHexArray([
      '0F', // javascript code with scope type
      '6100', // 'a\x00'

      // Code with scope size, we don't have a hex helper here so this is
      // 29 bytes for the code + 1 null byte
      // 4 bytes for the code with scope total size
      // 4 bytes for the string size
      // 9 bytes for the scope doc
      // (29 + 1 + 4 + 4 + 9).toString(16)
      '2F000000',
      // 29 chars + null byte
      '1E000000',
      Buffer.from('function iLoveJavascript() {}\x00', 'utf8').toString('hex'),
      bufferFromHexArray(['08', '6200', '01']).toString('hex') // scope: { b: true }
    ]);

    it('only returns Code instances', () => {
      // @ts-expect-error: Checking removed options
      const resultCode = BSON.deserialize(codeTypeBSON, { evalFunctions: true });
      expect(resultCode).to.have.nested.property('a._bsontype', 'Code');
      expect(resultCode).to.have.nested.property('a.code', 'function iLoveJavascript() {}');

      // @ts-expect-error: Checking removed options
      const resultCodeWithScope = BSON.deserialize(codeWithScopeTypeBSON, { evalFunctions: true });
      expect(resultCodeWithScope).to.have.nested.property('a._bsontype', 'Code');
      expect(resultCodeWithScope).to.have.nested.property(
        'a.code',
        'function iLoveJavascript() {}'
      );
      expect(resultCodeWithScope).to.have.deep.nested.property('a.scope', { b: true });
    });
  });
});
