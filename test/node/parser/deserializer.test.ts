import * as BSON from '../../register-bson';
import { expect } from 'chai';

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
});
