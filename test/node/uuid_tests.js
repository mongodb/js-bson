'use strict';

const { Buffer } = require('buffer');
const BSON = require('../register-bson');
const util = require('util');
const { validate, version } = require('uuid');
const UUID = BSON.UUID;

// Test values
const UPPERCASE_UUID_STRING = 'AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA';
const UPPERCASE_HEX_STRING = UPPERCASE_UUID_STRING.replace(/-/g, '');
const LOWERCASE_UUID_STRING = UPPERCASE_UUID_STRING.toLowerCase();
const LOWERCASE_HEX_STRING = LOWERCASE_UUID_STRING.replace(/-/g, '');
const BASE64_STRING = Buffer.from(LOWERCASE_HEX_STRING, 'hex').toString('base64');

describe('UUID', function () {
  /**
   * @ignore
   */
  it('should correctly generate a valid UUID v4 from empty constructor', function (done) {
    const uuid = new UUID();
    const uuidHexStr = uuid.toHexString();
    expect(validate(uuidHexStr)).to.be.true;
    expect(version(uuidHexStr)).to.equal(BSON.Binary.SUBTYPE_UUID);

    done();
  });

  /**
   * @ignore
   */
  it('should correctly create UUID from UPPERCASE hex string', function (done) {
    const uuid = new UUID(UPPERCASE_UUID_STRING);
    expect(uuid.equals(UPPERCASE_UUID_STRING)).to.be.true;
    expect(uuid.toString()).to.equal(LOWERCASE_UUID_STRING);

    done();
  });

  /**
   * @ignore
   */
  it('should correctly create UUID from lowercase hex string', function (done) {
    const uuid = new UUID(LOWERCASE_UUID_STRING);
    expect(uuid.equals(LOWERCASE_UUID_STRING)).to.be.true;
    expect(uuid.toString()).to.equal(LOWERCASE_UUID_STRING);

    done();
  });

  /**
   * @ignore
   */
  it('should correctly create UUID from Buffer', function (done) {
    if (!Buffer.from) return done();

    const uuid1 = new UUID(Buffer.from(UPPERCASE_HEX_STRING, 'hex'));
    expect(uuid1.equals(UPPERCASE_UUID_STRING)).to.be.true;
    expect(uuid1.toString()).to.equal(LOWERCASE_UUID_STRING);

    const uuid2 = new UUID(Buffer.from(LOWERCASE_HEX_STRING, 'hex'));
    expect(uuid2.equals(LOWERCASE_UUID_STRING)).to.be.true;
    expect(uuid2.toString()).to.equal(LOWERCASE_UUID_STRING);

    done();
  });

  /**
   * @ignore
   */
  it('should correctly create UUID from UUID (copying existing buffer)', function (done) {
    const org = new UUID();
    const copy = new UUID(org);
    expect(org.id).to.not.equal(copy.id);
    expect(org.id.equals(copy.id)).to.be.true;

    done();
  });

  /**
   * @ignore
   */
  it('should throw if passed invalid 36-char uuid hex string', function (done) {
    expect(() => new UUID(LOWERCASE_UUID_STRING)).to.not.throw();
    expect(() => new UUID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).to.throw(TypeError);
    // Note: The version is missing here ^

    done();
  });

  /**
   * @ignore
   */
  it('should throw if passed unsupported argument', function (done) {
    expect(() => new UUID(LOWERCASE_UUID_STRING)).to.not.throw();
    expect(() => new UUID({})).to.throw(TypeError);

    done();
  });

  /**
   * @ignore
   */
  it('should correctly check if a buffer isValid', function (done) {
    const validBuffer = Buffer.from(UPPERCASE_HEX_STRING, 'hex');
    const invalidBuffer = Buffer.alloc(16);

    expect(validBuffer.length).to.equal(invalidBuffer.length);
    expect(UUID.isValid(invalidBuffer)).to.be.false;
    expect(UUID.isValid(validBuffer)).to.be.true;

    done();
  });

  /**
   * @ignore
   */
  it('should parse UUIDExtended via fromExtendedJSON', function (done) {
    const ejson = { $uuid: LOWERCASE_UUID_STRING };

    const parseEjson = () => UUID.fromExtendedJSON(ejson);
    expect(parseEjson).to.not.throw;

    const uuid = parseEjson();
    expect(uuid.equals(LOWERCASE_UUID_STRING)).to.be.true;

    done();
  });

  /**
   * @ignore
   */
  it('should parse BinaryExtended via fromExtendedJSON', function (done) {
    const ejson = { $binary: { base64: BASE64_STRING, subType: '04' } };

    const parseEjson = () => UUID.fromExtendedJSON(ejson);
    expect(parseEjson).to.not.throw;

    const uuid = parseEjson();
    expect(uuid.equals(LOWERCASE_UUID_STRING)).to.be.true;

    done();
  });

  /**
   * @ignore
   */
  it('should parse BinaryExtendedLegacy via fromExtendedJSON', function (done) {
    const ejson = { $binary: BASE64_STRING, $type: '04' };

    const parseEjson = () => UUID.fromExtendedJSON(ejson, { legacy: true });
    expect(parseEjson).to.not.throw;

    const uuid = parseEjson();
    expect(uuid.equals(LOWERCASE_UUID_STRING)).to.be.true;

    done();
  });

  /**
   * @ignore
   */
  it('should generate valid UUIDExtended via toExtendedJSON', function (done) {
    const uuid = new UUID(UPPERCASE_UUID_STRING);
    const ejson = uuid.toExtendedJSON();
    expect(ejson.$uuid).to.equal(LOWERCASE_UUID_STRING);

    done();
  });

  /**
   * @ignore
   */
  xit('should generate valid BinaryExtended via toExtendedJSON', function (done) {
    // TODO: Unsure how this will work, EJSONOptions does not seem to contain an option for this case?
    done();
  });

  /**
   * @ignore
   */
  xit('should generate valid BinaryExtendedLegacy via toExtendedJSON', function (done) {
    // TODO: Unsure how this will work, EJSONOptions does not seem to contain an option for this case?
    done();
  });

  /**
   * @ignore
   */
  it('should correctly allow for node.js inspect to work with UUID', function (done) {
    const uuid = new UUID(UPPERCASE_UUID_STRING);
    expect(util.inspect(uuid)).to.equal(`new UUID("${LOWERCASE_UUID_STRING}")`);

    done();
  });
});
