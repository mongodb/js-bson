import * as BSON from '../../register-bson';
import { expect } from 'chai';
import { BSONVersionError } from '../../register-bson';

describe('calculateSize()', () => {
  it('should only enumerate own property keys from input objects', () => {
    const input = { a: 1 };
    Object.setPrototypeOf(input, { b: 2 });
    expect(BSON.calculateObjectSize(input)).to.equal(12);
  });

  it(`throws if Symbol.for('@@mdb.bson.version') is the wrong version`, () => {
    expect(() =>
      BSON.calculateObjectSize({
        a: { _bsontype: 'Int32', value: 2, [Symbol.for('@@mdb.bson.version')]: 1 }
      })
    ).to.throw(BSONVersionError, /Unsupported BSON version/i);
  });
});
