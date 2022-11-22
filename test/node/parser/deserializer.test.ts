import * as BSON from '../../register-bson';
import { expect } from 'chai';

describe('deserializer()', () => {
  it('should only enumerate own property keys from input options', () => {
    const bytes = BSON.serialize({ someKey: [1] });
    const options = { fieldsAsRaw: { someKey: true } };
    Object.setPrototypeOf(options, { promoteValues: false });
    const result = BSON.deserialize(bytes, options);
    expect(result).to.have.property('someKey').that.is.an('array');
    expect(result.someKey[0]).to.not.have.property('_bsontype', 'Int32');
  });
});
