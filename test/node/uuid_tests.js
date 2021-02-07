'use strict';

const { Buffer } = require('buffer');
const { Binary, UUID } = require('../register-bson');
const { inspect } = require('util');
const { validate: uuidStringValidate, version: uuidStringVersion } = require('uuid');

// Test values
const UPPERCASE_UUID_STRING = 'AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA';
const UPPERCASE_HEX_STRING = UPPERCASE_UUID_STRING.replace(/-/g, '');
const LOWERCASE_UUID_STRING = UPPERCASE_UUID_STRING.toLowerCase();
const LOWERCASE_HEX_STRING = LOWERCASE_UUID_STRING.replace(/-/g, '');

describe('UUID', () => {
  /**
   * @ignore
   */
  it('should correctly generate a valid UUID v4 from empty constructor', () => {
    // NOTE: non-deterministic test
    const uuid = new UUID();
    const uuidHexStr = uuid.toHexString();
    expect(uuidStringValidate(uuidHexStr)).to.be.true;
    expect(uuidStringVersion(uuidHexStr)).to.equal(Binary.SUBTYPE_UUID);
  });

  /**
   * @ignore
   */
  it('should correctly create UUID from UPPERCASE hex string', () => {
    const uuid = new UUID(UPPERCASE_UUID_STRING);
    expect(uuid.equals(UPPERCASE_UUID_STRING)).to.be.true;
    expect(uuid.toString()).to.equal(LOWERCASE_UUID_STRING);
  });

  /**
   * @ignore
   */
  it('should correctly create UUID from lowercase hex string', () => {
    const uuid = new UUID(LOWERCASE_UUID_STRING);
    expect(uuid.equals(LOWERCASE_UUID_STRING)).to.be.true;
    expect(uuid.toString()).to.equal(LOWERCASE_UUID_STRING);
  });

  /**
   * @ignore
   */
  it('should correctly create UUID from Buffer', () => {
    const uuid1 = new UUID(Buffer.from(UPPERCASE_HEX_STRING, 'hex'));
    expect(uuid1.equals(UPPERCASE_UUID_STRING)).to.be.true;
    expect(uuid1.toString()).to.equal(LOWERCASE_UUID_STRING);

    const uuid2 = new UUID(Buffer.from(LOWERCASE_HEX_STRING, 'hex'));
    expect(uuid2.equals(LOWERCASE_UUID_STRING)).to.be.true;
    expect(uuid2.toString()).to.equal(LOWERCASE_UUID_STRING);
  });

  /**
   * @ignore
   */
  it('should correctly create UUID from UUID (copying existing buffer)', () => {
    const org = new UUID();
    const copy = new UUID(org);
    expect(org.id).to.not.equal(copy.id);
    expect(org.id.equals(copy.id)).to.be.true;
  });

  /**
   * @ignore
   */
  it('should throw if passed invalid 36-char uuid hex string', () => {
    expect(() => new UUID(LOWERCASE_UUID_STRING)).to.not.throw();
    expect(() => new UUID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).to.throw(TypeError);
    // Note: The version is missing here ^
  });

  /**
   * @ignore
   */
  it('should throw if passed unsupported argument', () => {
    expect(() => new UUID(LOWERCASE_UUID_STRING)).to.not.throw();
    expect(() => new UUID({})).to.throw(TypeError);
  });

  /**
   * @ignore
   */
  it('should correctly check if a buffer isValid', () => {
    const validBuffer = Buffer.from(UPPERCASE_HEX_STRING, 'hex');
    const invalidBuffer1 = Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'hex');
    const invalidBuffer2 = Buffer.alloc(16);

    expect(validBuffer.length).to.equal(invalidBuffer1.length);
    expect(validBuffer.length).to.equal(invalidBuffer2.length);
    expect(UUID.isValid(invalidBuffer1)).to.be.false;
    expect(UUID.isValid(invalidBuffer2)).to.be.false;
    expect(UUID.isValid(validBuffer)).to.be.true;
  });

  /**
   * @ignore
   */
  it('should correctly allow for node.js inspect to work with UUID', () => {
    const uuid = new UUID(UPPERCASE_UUID_STRING);
    expect(inspect(uuid)).to.equal(`new UUID("${LOWERCASE_UUID_STRING}")`);
  });
});
