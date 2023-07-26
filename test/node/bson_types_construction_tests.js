'use strict';
const BSON = require('../register-bson');

describe('Constructing BSON types', function () {
  it('with new keyword should not throw', function () {
    expect(() => new BSON.ObjectId()).to.not.throw();
    expect(() => new BSON.BSONRegExp('aaa')).to.not.throw();
    expect(() => new BSON.BSONSymbol('aaa')).to.not.throw();
    expect(() => new BSON.Binary(new Uint8Array())).to.not.throw();
    expect(() => new BSON.Code(function () {})).to.not.throw();
    expect(() => new BSON.Decimal128('123')).to.not.throw();
    expect(() => new BSON.Double(2.3)).to.not.throw();
    expect(() => new BSON.Int32(1)).to.not.throw();
    expect(() => new BSON.Long(0, 0)).to.not.throw();
    expect(() => new BSON.Timestamp({ t: 0, i: 0 })).to.not.throw();
    expect(() => new BSON.MaxKey()).to.not.throw();
    expect(() => new BSON.MinKey()).to.not.throw();

    const oid = new BSON.ObjectId();
    expect(() => BSON.DBRef('test', oid)).to.throw(TypeError, /cannot be invoked/);
  });

  it('without new keyword should throw a TypeError', function () {
    expect(() => BSON.ObjectId()).to.throw(TypeError, /cannot be invoked/);
    expect(() => BSON.BSONRegExp('aaa')).to.throw(TypeError, /cannot be invoked/);
    expect(() => BSON.BSONSymbol('aaa')).to.throw(TypeError, /cannot be invoked/);
    expect(() => BSON.Binary('aaa')).to.throw(TypeError, /cannot be invoked/);
    expect(() => BSON.Code(function () {})).to.throw(TypeError, /cannot be invoked/);
    expect(() => BSON.Decimal128('123')).to.throw(TypeError, /cannot be invoked/);
    expect(() => BSON.Double(2.3)).to.throw(TypeError, /cannot be invoked/);
    expect(() => BSON.Int32(1)).to.throw(TypeError, /cannot be invoked/);
    expect(() => BSON.Long(0, 0)).to.throw(TypeError, /cannot be invoked/);
    expect(() => BSON.Timestamp({ t: 0, i: 0 })).to.throw(TypeError, /cannot be invoked/);
    expect(() => BSON.MaxKey()).to.throw(TypeError, /cannot be invoked/);
    expect(() => BSON.MinKey()).to.throw(TypeError, /cannot be invoked/);

    const oid = new BSON.ObjectId();
    expect(() => BSON.DBRef('test', oid)).to.throw(TypeError, /cannot be invoked/);
  });
});
