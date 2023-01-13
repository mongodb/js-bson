import { expect } from 'chai';
import { loadESModuleBSON } from '../load_bson';

import { __isWeb__, BSONError, BSONVersionError } from '../register-bson';

const instanceOfChecksWork = !__isWeb__;

describe('BSONError', function () {
  describe('isBSONError()', () => {
    it('returns true for BSONError instances', () => {
      const error = new BSONError('ah!');
      if (instanceOfChecksWork) expect(error).to.be.instanceOf(BSONError);
      expect(BSONError.isBSONError(error)).to.be.true;
    });

    it('returns true for BSONError created from another vm', async () => {
      const {
        exports: { BSONError: BSONErrorFromAnotherVM }
      } = await loadESModuleBSON();
      const error = new BSONErrorFromAnotherVM('ah!');

      // Instanceof here is false but the helper still returns true
      if (instanceOfChecksWork) expect(error).to.not.be.instanceOf(BSONError);
      expect(BSONError.isBSONError(error)).to.be.true;
    });

    it('returns true for for any object that meets the required API bsonError:true and name,message,stack properties', () => {
      expect(
        BSONError.isBSONError({
          bsonError: true,
          name: 'BSONError',
          message: 'ah!',
          stack: 'at line X'
        })
      ).to.be.true;
      // The types can be wrong for name,message,stack.
      // isBSONError does not access the stack getter to avoid triggering generating it
      expect(BSONError.isBSONError({ bsonError: true, name: Symbol(), message: false, stack: 2 }))
        .to.be.true;
    });

    it('returns false for objects that are almost shaped like BSONError', () => {
      expect(BSONError.isBSONError({ bsonError: true })).to.be.false;
      expect(BSONError.isBSONError({ bsonError: false })).to.be.false;
      expect(BSONError.isBSONError({ bsonError: true, name: 'BSONError' })).to.be.false;
      expect(BSONError.isBSONError({ bsonError: true, name: 'BSONError', message: 'ah!' })).to.be
        .false;
      expect(
        BSONError.isBSONError({
          bsonError: false,
          name: 'BSONError',
          message: 'ah!',
          stack: 'at line X'
        })
      ).to.be.false;
    });

    it('returns false for nullish and non-object inputs', async () => {
      expect(BSONError.isBSONError(null)).to.be.false;
      expect(BSONError.isBSONError(undefined)).to.be.false;
      expect(BSONError.isBSONError(3)).to.be.false;
      expect(BSONError.isBSONError(true)).to.be.false;
      expect(BSONError.isBSONError(new Function())).to.be.false;
    });
  });

  it('should evaluate true on instanceof BSONError and Error', function () {
    const bsonErr = new BSONError('ah!');
    if (instanceOfChecksWork) {
      expect(bsonErr instanceof BSONError).to.be.true;
      expect(bsonErr instanceof Error).to.be.true;
      expect(bsonErr).to.be.instanceOf(BSONError);
      expect(bsonErr).to.be.instanceOf(Error);
    } else {
      expect(bsonErr).to.have.property('name', 'BSONError');
      expect(Object.getPrototypeOf(BSONError.prototype)).to.have.property('name', 'Error');
    }
  });

  it('should correctly set BSONError name and message properties', function () {
    const bsonErr = new BSONError('This is a BSONError message');
    expect(bsonErr.name).equals('BSONError');
    expect(bsonErr.message).equals('This is a BSONError message');
  });

  describe('class BSONVersionError', () => {
    it('is a BSONError instance', () => {
      expect(BSONError.isBSONError(new BSONVersionError())).to.be.true;
    });

    it('has a name property equal to "BSONVersionError"', () => {
      expect(new BSONVersionError()).to.have.property('name', 'BSONVersionError');
    });
  });
});
