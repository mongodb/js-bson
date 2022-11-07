'use strict';

const { Buffer } = require('buffer');
const { Binary, UUID } = require('../register-bson');
const { inspect } = require('util');
const { validate: uuidStringValidate, version: uuidStringVersion } = require('uuid');
const BSON = require('../register-bson');
const BSONTypeError = BSON.BSONTypeError;
const BSON_DATA_BINARY = BSON.BSON_DATA_BINARY;
const BSON_BINARY_SUBTYPE_UUID_NEW = BSON.BSON_BINARY_SUBTYPE_UUID_NEW;

// Test values
const UPPERCASE_DASH_SEPARATED_UUID_STRING = 'AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA';
const UPPERCASE_VALUES_ONLY_UUID_STRING = 'AAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAA';
const LOWERCASE_DASH_SEPARATED_UUID_STRING = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const LOWERCASE_VALUES_ONLY_UUID_STRING = 'aaaaaaaaaaaa4aaaaaaaaaaaaaaaaaaa';

describe('UUID', () => {
  /**
   * @ignore
   */
  it('should correctly generate a valid UUID v4 from empty constructor', () => {
    const uuid = new UUID();
    const uuidHexStr = uuid.toHexString();
    expect(uuidStringValidate(uuidHexStr)).to.be.true;
    expect(uuidStringVersion(uuidHexStr)).to.equal(Binary.SUBTYPE_UUID);
  });

  /**
   * @ignore
   */
  it('should correctly create UUIDs from UPPERCASE & lowercase 36 char dash-separated hex string', () => {
    const uuid1 = new UUID(UPPERCASE_DASH_SEPARATED_UUID_STRING);
    expect(uuid1.equals(UPPERCASE_DASH_SEPARATED_UUID_STRING)).to.be.true;
    expect(uuid1.toString()).to.equal(LOWERCASE_DASH_SEPARATED_UUID_STRING);

    const uuid2 = new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING);
    expect(uuid2.equals(LOWERCASE_DASH_SEPARATED_UUID_STRING)).to.be.true;
    expect(uuid2.toString()).to.equal(LOWERCASE_DASH_SEPARATED_UUID_STRING);
  });

  /**
   * @ignore
   */
  it('should correctly create UUIDs from UPPERCASE & lowercase 32 char hex string (no dash separators)', () => {
    const uuid1 = new UUID(UPPERCASE_VALUES_ONLY_UUID_STRING);
    expect(uuid1.equals(UPPERCASE_VALUES_ONLY_UUID_STRING)).to.be.true;
    expect(uuid1.toHexString(false)).to.equal(LOWERCASE_VALUES_ONLY_UUID_STRING);

    const uuid2 = new UUID(LOWERCASE_VALUES_ONLY_UUID_STRING);
    expect(uuid2.equals(LOWERCASE_VALUES_ONLY_UUID_STRING)).to.be.true;
    expect(uuid2.toHexString(false)).to.equal(LOWERCASE_VALUES_ONLY_UUID_STRING);
  });

  /**
   * @ignore
   */
  it('should correctly create UUID from Buffer', () => {
    const uuid1 = new UUID(Buffer.from(UPPERCASE_VALUES_ONLY_UUID_STRING, 'hex'));
    expect(uuid1.equals(UPPERCASE_DASH_SEPARATED_UUID_STRING)).to.be.true;
    expect(uuid1.toString()).to.equal(LOWERCASE_DASH_SEPARATED_UUID_STRING);

    const uuid2 = new UUID(Buffer.from(LOWERCASE_VALUES_ONLY_UUID_STRING, 'hex'));
    expect(uuid2.equals(LOWERCASE_DASH_SEPARATED_UUID_STRING)).to.be.true;
    expect(uuid2.toString()).to.equal(LOWERCASE_DASH_SEPARATED_UUID_STRING);
  });

  /**
   * @ignore
   */
  it('should correctly create UUID from UUID (copying existing buffer)', () => {
    const org = new UUID();
    const copy = new UUID(org);
    expect(org.id).to.not.equal(copy.id);
    expect(org.id).to.deep.equal(copy.id);
  });

  /**
   * @ignore
   */
  it('should throw if passed invalid 36-char uuid hex string', () => {
    expect(() => new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING)).to.not.throw();
    expect(() => new UUID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).to.throw(BSONTypeError);
    // Note: The version is missing here ^
  });

  /**
   * @ignore
   */
  it('should throw if passed unsupported argument', () => {
    expect(() => new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING)).to.not.throw();
    expect(() => new UUID({})).to.throw(BSONTypeError);
  });

  /**
   * @ignore
   */
  it('should correctly check if a buffer isValid', () => {
    const validBuffer = Buffer.from(UPPERCASE_VALUES_ONLY_UUID_STRING, 'hex');
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
  it('should correctly convert to and from a Binary instance', () => {
    const uuid = new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING);
    expect(UUID.isValid(uuid)).to.be.true;

    const bin = uuid.toBinary();
    expect(bin).to.be.instanceOf(Binary);

    const uuid2 = bin.toUUID();
    expect(uuid2.toHexString()).to.equal(LOWERCASE_DASH_SEPARATED_UUID_STRING);
  });

  /**
   * @ignore
   */
  it('should correctly convert to and from a Binary instance', () => {
    const uuid = new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING);
    expect(UUID.isValid(uuid)).to.be.true;

    const bin = uuid.toBinary();
    expect(bin).to.be.instanceOf(Binary);

    const uuid2 = bin.toUUID();
    expect(uuid.equals(uuid2)).to.be.true;
  });

  /**
   * @ignore
   */
  it('should throw when converted from an incompatible Binary instance', () => {
    const validRandomBuffer = Buffer.from('Hello World!');
    const binRand = new Binary(validRandomBuffer);

    expect(() => binRand.toUUID()).to.throw();

    const validUuidV3String = '25f0d698-15b9-3a7a-96b1-a573061e29c9';
    const validUuidV3Buffer = Buffer.from(validUuidV3String.replace(/-/g, ''), 'hex');
    const binV3 = new Binary(validUuidV3Buffer, Binary.SUBTYPE_UUID_OLD);

    expect(() => binV3.toUUID()).to.throw();

    const validUuidV4String = 'bd2d74fe-bad8-430c-aeac-b01d073a1eb6';
    const validUuidV4Buffer = Buffer.from(validUuidV4String.replace(/-/g, ''), 'hex');
    const binV4 = new Binary(validUuidV4Buffer, Binary.SUBTYPE_UUID);

    expect(() => binV4.toUUID()).to.not.throw();
  });

  /**
   * @ignore
   */
  it('should correctly allow for node.js inspect to work with UUID', () => {
    const uuid = new UUID(UPPERCASE_DASH_SEPARATED_UUID_STRING);
    expect(inspect(uuid)).to.equal(`new UUID("${LOWERCASE_DASH_SEPARATED_UUID_STRING}")`);
  });

  describe('serialize', () => {
    it('should serialize BSON.UUID() input the same as BSON.UUID().toBinary()', () => {
      const exampleUUID = new BSON.UUID();
      const toBinarySerialization = BSON.serialize({ uuid: exampleUUID.toBinary() });
      const plainUUIDSerialization = BSON.serialize({ uuid: exampleUUID });
      expect(plainUUIDSerialization).to.deep.equal(toBinarySerialization);
    });

    it('should have a valid UUID _bsontype with Object input without error', () => {
      const output = BSON.serialize({ uuid: new BSON.UUID() });
      expect(output[4]).to.equal(BSON_DATA_BINARY);
      expect(output[14]).to.equal(BSON_BINARY_SUBTYPE_UUID_NEW);
    });

    it('should have a valid UUID _bsontype with Map input without error', () => {
      const output = BSON.serialize(new Map([['uuid', new BSON.UUID()]]));
      expect(output[4]).to.equal(BSON_DATA_BINARY);
      expect(output[14]).to.equal(BSON_BINARY_SUBTYPE_UUID_NEW);
    });

    it('should have as a valid UUID _bsontype with Array input without error', () => {
      const output = BSON.serialize({ a: [new BSON.UUID()] });
      expect(output[11]).to.equal(BSON_DATA_BINARY);
      expect(output[18]).to.equal(BSON_BINARY_SUBTYPE_UUID_NEW);
    });
  });

  describe('deserialize', () => {
    it('should return UUID object when deserializing UUID subtype', () => {
      const exampleUUID = new BSON.UUID('878dac12-01cc-4830-b271-cbc8518e63ad');
      const serializedUUID = BSON.serialize({ uuid: exampleUUID });
      const deserializedUUID = BSON.deserialize(serializedUUID);
      const expectedResult = {
        uuid: new UUID('878dac12-01cc-4830-b271-cbc8518e63ad')
      };
      expect(deserializedUUID).to.deep.equal(expectedResult);
    });
  });
});
