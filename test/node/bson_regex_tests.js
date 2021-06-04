'use strict';
const BSON = require('../register-bson');
const BSONRegExp = BSON.BSONRegExp;

describe('BSONRegExp', () => {
  it('Should alphabetize options', () => {
    const b = new BSONRegExp('cba', 'mix');
    expect(b.options).to.equal('imx');
  });
});
