import { Binary, UUID } from '../register-bson';
import { inspect } from 'util';
import { validate as uuidStringValidate, version as uuidStringVersion } from 'uuid';
import { BSON, BSONError } from '../register-bson';
const BSON_DATA_BINARY = BSON.BSONType.binData;
import { BSON_BINARY_SUBTYPE_UUID_NEW } from '../../src/constants';
import { expect } from 'chai';

// Test values
const UPPERCASE_DASH_SEPARATED_UUID_STRING = 'AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA';
const UPPERCASE_VALUES_ONLY_UUID_STRING = 'AAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAA';
const LOWERCASE_DASH_SEPARATED_UUID_STRING = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const LOWERCASE_VALUES_ONLY_UUID_STRING = 'aaaaaaaaaaaa4aaaaaaaaaaaaaaaaaaa';

describe('UUID', () => {
  it('should correctly generate a valid UUID v4 from empty constructor', () => {
    const uuid = new UUID();
    const uuidHexStr = uuid.toHexString();
    expect(uuidStringValidate(uuidHexStr)).to.be.true;
    expect(uuidStringVersion(uuidHexStr)).to.equal(Binary.SUBTYPE_UUID);
  });

  it('should correctly create UUIDs from UPPERCASE & lowercase 36 char dash-separated hex string', () => {
    const uuid1 = new UUID(UPPERCASE_DASH_SEPARATED_UUID_STRING);
    expect(uuid1.equals(UPPERCASE_DASH_SEPARATED_UUID_STRING)).to.be.true;
    expect(uuid1.toString()).to.equal(LOWERCASE_DASH_SEPARATED_UUID_STRING);

    const uuid2 = new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING);
    expect(uuid2.equals(LOWERCASE_DASH_SEPARATED_UUID_STRING)).to.be.true;
    expect(uuid2.toString()).to.equal(LOWERCASE_DASH_SEPARATED_UUID_STRING);
  });

  it('should correctly create UUIDs from UPPERCASE & lowercase 32 char hex string (no dash separators)', () => {
    const uuid1 = new UUID(UPPERCASE_VALUES_ONLY_UUID_STRING);
    expect(uuid1.equals(UPPERCASE_VALUES_ONLY_UUID_STRING)).to.be.true;
    expect(uuid1.toHexString(false)).to.equal(LOWERCASE_VALUES_ONLY_UUID_STRING);

    const uuid2 = new UUID(LOWERCASE_VALUES_ONLY_UUID_STRING);
    expect(uuid2.equals(LOWERCASE_VALUES_ONLY_UUID_STRING)).to.be.true;
    expect(uuid2.toHexString(false)).to.equal(LOWERCASE_VALUES_ONLY_UUID_STRING);
  });

  it('should correctly create UUID from Buffer', () => {
    const uuid1 = new UUID(Buffer.from(UPPERCASE_VALUES_ONLY_UUID_STRING, 'hex'));
    expect(uuid1.equals(UPPERCASE_DASH_SEPARATED_UUID_STRING)).to.be.true;
    expect(uuid1.toString()).to.equal(LOWERCASE_DASH_SEPARATED_UUID_STRING);

    const uuid2 = new UUID(Buffer.from(LOWERCASE_VALUES_ONLY_UUID_STRING, 'hex'));
    expect(uuid2.equals(LOWERCASE_DASH_SEPARATED_UUID_STRING)).to.be.true;
    expect(uuid2.toString()).to.equal(LOWERCASE_DASH_SEPARATED_UUID_STRING);
  });

  it('should correctly create UUID from UUID (copying existing buffer)', () => {
    const org = new UUID();
    const copy = new UUID(org);
    expect(org.id).to.not.equal(copy.id);
    expect(org.id).to.deep.equal(copy.id);
  });

  it('should throw if passed invalid 36-char uuid hex string', () => {
    expect(() => new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING)).to.not.throw();
    expect(() => new UUID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).to.throw(BSONError);
    // Note: The version is missing here ^
  });

  it('should throw if passed unsupported argument', () => {
    expect(() => new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING)).to.not.throw();
    expect(() => new UUID({})).to.throw(BSONError);
  });

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

  it('should correctly convert to and from a Binary instance', () => {
    const uuid = new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING);
    expect(UUID.isValid(uuid)).to.be.true;

    const bin = uuid.toBinary();
    expect(bin).to.be.instanceOf(Binary);

    const uuid2 = bin.toUUID();
    expect(uuid2.toHexString()).to.equal(LOWERCASE_DASH_SEPARATED_UUID_STRING);
  });

  it('should correctly convert to and from a Binary instance', () => {
    const uuid = new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING);
    expect(UUID.isValid(uuid)).to.be.true;

    const bin = uuid.toBinary();
    expect(bin).to.be.instanceOf(Binary);

    const uuid2 = bin.toUUID();
    expect(uuid.equals(uuid2)).to.be.true;
  });

  it('should throw when converted from an incompatible Binary instance', () => {
    const validRandomBuffer = Buffer.from('Hello World!');
    const binRand = new Binary(validRandomBuffer);

    expect(() => binRand.toUUID()).to.throw(BSONError);

    const validUuidV3String = '25f0d698-15b9-3a7a-96b1-a573061e29c9';
    const validUuidV3Buffer = Buffer.from(validUuidV3String.replace(/-/g, ''), 'hex');
    const binV3 = new Binary(validUuidV3Buffer, Binary.SUBTYPE_UUID_OLD);

    expect(() => binV3.toUUID()).to.throw(BSONError);

    const validUuidV4String = 'bd2d74fe-bad8-430c-aeac-b01d073a1eb6';
    const validUuidV4Buffer = Buffer.from(validUuidV4String.replace(/-/g, ''), 'hex');
    const binV4 = new Binary(validUuidV4Buffer, Binary.SUBTYPE_UUID);

    expect(() => binV4.toUUID()).to.not.throw();
  });

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

  context('createFromHexString()', () => {
    context('when called with a hex sequence', () => {
      it('returns a UUID instance with the decoded bytes', () => {
        const bytes = Buffer.from(UPPERCASE_VALUES_ONLY_UUID_STRING, 'hex');

        const uuidDashed = UUID.createFromHexString(UPPERCASE_DASH_SEPARATED_UUID_STRING);
        expect(uuidDashed).to.have.deep.property('buffer', bytes);
        expect(uuidDashed).to.be.instanceOf(UUID);

        const uuidNoDashed = UUID.createFromHexString(UPPERCASE_VALUES_ONLY_UUID_STRING);
        expect(uuidNoDashed).to.have.deep.property('buffer', bytes);
        expect(uuidNoDashed).to.be.instanceOf(UUID);
      });
    });

    context('when called with an incorrect length string', () => {
      it('throws an error indicating the expected length of 32 or 36 characters', () => {
        expect(() => UUID.createFromHexString('')).to.throw(/32 or 36 character/);
      });
    });
  });

  context('createFromBase64()', () => {
    context('when called with a base64 sequence', () => {
      it('returns a UUID instance with the decoded bytes', () => {
        const bytes = Buffer.from(UPPERCASE_VALUES_ONLY_UUID_STRING, 'hex');
        const uuid = UUID.createFromBase64(bytes.toString('base64'));
        expect(uuid).to.have.deep.property('buffer', bytes);
        expect(uuid).to.be.instanceOf(UUID);
      });
    });

    context('when called with an incorrect length string', () => {
      it('throws an error indicating the expected length of 16 byte Buffer', () => {
        expect(() => UUID.createFromBase64('')).to.throw(/16 byte Buffer/);
      });
    });
  });
});
