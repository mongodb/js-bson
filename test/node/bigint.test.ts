import { BSON } from '../register-bson';
import { bufferFromHexArray } from './tools/utils';
import { BSON_DATA_LONG } from '../../src/constants';
import { expect } from 'chai';

describe("BSON BigInt deserialization support", function() {
  it.only('Throws error when useBigInt==true and promoteValues==false', function() {
    const testSerializedDoc = bufferFromHexArray( // {a : 0n}
      [
        '12',
        '6100',
        '00000000'
      ]
    );
    expect(() => {
      BSON.deserialize(testSerializedDoc, {useBigInt: true, promoteValues: false});
    }).to.throw;
  });

  it('Sets useBigInt to false by default', function() { });

  it('Deserializes int64 to BSON.Long when useBigInt == false', function() { });

  it('Deserializes int64 to BigInt when useBigInt == true', function() { });
});
