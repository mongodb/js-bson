import { expect } from 'chai';
import { Binary } from '../register-bson';
import * as constants from '../../src/constants';

describe('BSON Constants', () => {
  describe('.BSON_MAJOR_VERSION', () => {
    it('returns the current major version', async () => {
      const package_json = await import('../../package.json');
      const current_major = Number(package_json.version.split('.')[0]);
      expect(constants.BSON_MAJOR_VERSION).to.equal(current_major);
    });
  });

  context('Binary Subtype', () => {
    /*
     subtype	::=
     |  "\x00"  Generic binary subtype
     |  "\x01"  Function
     |  "\x02"  Binary (Old)
     |  "\x03"  UUID (Old)
     |  "\x04"  UUID
     |  "\x05"  MD5
     |  "\x06"  Encrypted BSON value
     |  "\x07"  Column BSON value
     |  "\x08"  Sensitive BSON value
     |  "\x80"  User defined
    */
    it('Default should be 0', () => {
      expect(constants.BSON_BINARY_SUBTYPE_DEFAULT).to.equal(0);
      expect(Binary.SUBTYPE_DEFAULT).to.equal(0);
    });
    it('Function should be 1', () => {
      expect(constants.BSON_BINARY_SUBTYPE_FUNCTION).to.equal(1);
      expect(Binary.SUBTYPE_FUNCTION).to.equal(1);
    });
    it('Binary (Old) should be 2', () => {
      expect(constants.BSON_BINARY_SUBTYPE_BYTE_ARRAY).to.equal(2);
      expect(Binary.SUBTYPE_BYTE_ARRAY).to.equal(2);
    });
    it('UUID (Old) should be 3', () => {
      expect(constants.BSON_BINARY_SUBTYPE_UUID).to.equal(3);
      expect(Binary.SUBTYPE_UUID_OLD).to.equal(3);
    });
    it('UUID should be 4', () => {
      expect(constants.BSON_BINARY_SUBTYPE_UUID_NEW).to.equal(4);
      expect(Binary.SUBTYPE_UUID).to.equal(4);
    });
    it('MD5 should be 5', () => {
      expect(constants.BSON_BINARY_SUBTYPE_MD5).to.equal(5);
      expect(Binary.SUBTYPE_MD5).to.equal(5);
    });

    it('Encrypted should be 6', () => {
      expect(constants.BSON_BINARY_SUBTYPE_ENCRYPTED).to.equal(6);
      expect(Binary.SUBTYPE_ENCRYPTED).to.equal(6);
    });

    it('Column should be 7', () => {
      expect(constants.BSON_BINARY_SUBTYPE_COLUMN).to.equal(7);
      expect(Binary.SUBTYPE_COLUMN).to.equal(7);
    });

    it('Sensitive should be 8', () => {
      expect(constants.BSON_BINARY_SUBTYPE_SENSITIVE).to.equal(8);
      expect(Binary.SUBTYPE_SENSITIVE).to.equal(8);
    });
  });
  context('BSON Type indicators', () => {
    /*
      | "\x01" 64-bit binary floating point
      | "\x02" UTF-8 string
      | "\x03" Embedded document
      | "\x04" Array
      | "\x05" Binary data
      | "\x06" Undefined (value) — Deprecated
      | "\x07" ObjectId
      | "\x08" Boolean
      | "\x09" UTC date time
      | "\x0A" Null value
      | "\x0B" Regular expression
      | "\x0C" DBPointer — Deprecated
      | "\x0D" JavaScript code
      | "\x0E" Symbol. — Deprecated
      | "\x0F" JavaScript code w/ scope — Deprecated
      | "\x10" 32-bit integer
      | "\x11" Timestamp
      | "\x12" 64-bit integer
      | "\x13" 128-bit decimal floating point
      | "\xFF" Min key
      | "\x7F" Max key
     */

    it('64-bit binary floating point should be 0x01', () => {
      expect(constants.BSON_DATA_NUMBER).to.equal(0x01);
    });
    it('UTF-8 string should be 0x02', () => {
      expect(constants.BSON_DATA_STRING).to.equal(0x02);
    });
    it('Embedded document should be 0x03', () => {
      expect(constants.BSON_DATA_OBJECT).to.equal(0x03);
    });
    it('Array should be 0x04', () => {
      expect(constants.BSON_DATA_ARRAY).to.equal(0x04);
    });
    it('Binary data should be 0x05', () => {
      expect(constants.BSON_DATA_BINARY).to.equal(0x05);
    });
    it('Undefined (value) — Deprecated should be 0x06', () => {
      expect(constants.BSON_DATA_UNDEFINED).to.equal(0x06);
    });
    it('ObjectId should be 0x07', () => {
      expect(constants.BSON_DATA_OID).to.equal(0x07);
    });
    it('Boolean should be 0x08', () => {
      expect(constants.BSON_DATA_BOOLEAN).to.equal(0x08);
    });
    it('UTC date time should be 0x09', () => {
      expect(constants.BSON_DATA_DATE).to.equal(0x09);
    });
    it('Null value should be 0x0A', () => {
      expect(constants.BSON_DATA_NULL).to.equal(0x0a);
    });
    it('Regular expression should be 0x0B', () => {
      expect(constants.BSON_DATA_REGEXP).to.equal(0x0b);
    });
    it('DBPointer — Deprecated should be 0x0C', () => {
      expect(constants.BSON_DATA_DBPOINTER).to.equal(0x0c);
    });
    it('JavaScript code should be 0x0D', () => {
      expect(constants.BSON_DATA_CODE).to.equal(0x0d);
    });
    it('Symbol. — Deprecated should be 0x0E', () => {
      expect(constants.BSON_DATA_SYMBOL).to.equal(0x0e);
    });
    it('JavaScript code w/ scope — Deprecated should be 0x0F', () => {
      expect(constants.BSON_DATA_CODE_W_SCOPE).to.equal(0x0f);
    });
    it('32-bit integer should be 0x10', () => {
      expect(constants.BSON_DATA_INT).to.equal(0x10);
    });
    it('Timestamp should be 0x11', () => {
      expect(constants.BSON_DATA_TIMESTAMP).to.equal(0x11);
    });
    it('64-bit integer should be 0x12', () => {
      expect(constants.BSON_DATA_LONG).to.equal(0x12);
    });
    it('128-bit decimal floating point should be 0x13', () => {
      expect(constants.BSON_DATA_DECIMAL128).to.equal(0x13);
    });
    it('Min key should be 0xFF', () => {
      expect(constants.BSON_DATA_MIN_KEY).to.equal(0xff);
    });
    it('Max key should be 0x7F', () => {
      expect(constants.BSON_DATA_MAX_KEY).to.equal(0x7f);
    });
  });

  describe('BSONType enum', () => {
    it('double equals 1', () => expect(constants.BSONType.double).to.equal(1));
    it('string equals 2', () => expect(constants.BSONType.string).to.equal(2));
    it('object equals 3', () => expect(constants.BSONType.object).to.equal(3));
    it('array equals 4', () => expect(constants.BSONType.array).to.equal(4));
    it('binData equals 5', () => expect(constants.BSONType.binData).to.equal(5));
    it('undefined equals 6', () => expect(constants.BSONType.undefined).to.equal(6));
    it('objectId equals 7', () => expect(constants.BSONType.objectId).to.equal(7));
    it('bool equals 8', () => expect(constants.BSONType.bool).to.equal(8));
    it('date equals 9', () => expect(constants.BSONType.date).to.equal(9));
    it('null equals 10', () => expect(constants.BSONType.null).to.equal(10));
    it('regex equals 11', () => expect(constants.BSONType.regex).to.equal(11));
    it('dbPointer equals 12', () => expect(constants.BSONType.dbPointer).to.equal(12));
    it('javascript equals 13', () => expect(constants.BSONType.javascript).to.equal(13));
    it('symbol equals 14', () => expect(constants.BSONType.symbol).to.equal(14));
    it('javascriptWithScope equals 15', () =>
      expect(constants.BSONType.javascriptWithScope).to.equal(15));
    it('int equals 16', () => expect(constants.BSONType.int).to.equal(16));
    it('timestamp equals 17', () => expect(constants.BSONType.timestamp).to.equal(17));
    it('long equals 18', () => expect(constants.BSONType.long).to.equal(18));
    it('decimal equals 19', () => expect(constants.BSONType.decimal).to.equal(19));
    it('minKey equals -1', () => expect(constants.BSONType.minKey).to.equal(-1));
    it('maxKey equals  27', () => expect(constants.BSONType.maxKey).to.equal(127));

    it('minKey equals 255 when used in Uint8Array', () => {
      const byte = new Uint8Array(1);
      byte[0] = constants.BSONType.minKey;
      expect(byte[0]).to.equal(255);
    });

    it('minKey equals 255 when used in DataView in unsigned way', () => {
      const dv = new DataView(new ArrayBuffer(1));
      dv.setUint8(0, constants.BSONType.minKey);
      expect(dv.getUint8(0)).to.equal(255);
      expect(new Uint8Array(dv.buffer, 0, 1)[0]).to.equal(255);
    });
  });
});
