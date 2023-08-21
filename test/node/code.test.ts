import { expect } from 'chai';
import * as BSON from '../register-bson';
import { inspect } from 'util';

describe('class Code', () => {
  it('defines a nodejs inspect method', () => {
    expect(BSON.Code.prototype)
      .to.have.property(Symbol.for('nodejs.util.inspect.custom'))
      .that.is.a('function');
  });

  it('prints re-evaluatable output for Code that contains quotes', () => {
    const codeStringInput = new BSON.Code('function a(){ return "asdf"; }');
    expect(inspect(codeStringInput)).to.equal(
      String.raw`new Code("function a(){ return \"asdf\"; }")`
    );
  });

  describe('new Code()', () => {
    it('defines a code property that is a string', () => {
      const codeStringInput = new BSON.Code('function a(){}');
      expect(codeStringInput).to.have.property('code').that.is.a('string');

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const codeFunctionInput = new BSON.Code(function a() {});
      expect(codeFunctionInput).to.have.property('code').that.is.a('string');
    });

    it('defines a scope property that is null or an object', () => {
      const scope = { a: 1 };

      const codeWScope = new BSON.Code('function a(){}', scope);
      expect(codeWScope).to.have.property('scope').that.equals(scope);

      const codeWNoSecondArg = new BSON.Code('function a(){}');
      expect(codeWNoSecondArg).to.have.property('scope').that.is.null;

      const codeWNullScope = new BSON.Code('function a(){}', null);
      expect(codeWNullScope).to.have.property('scope').that.is.null;
    });
  });

  describe('toJSON()', () => {
    it('returns an object with only code defined if scope is null', () => {
      const code = new BSON.Code('() => {}');
      expect(code.toJSON()).to.have.all.keys(['code']);
      expect(code.toJSON()).to.have.property('code', '() => {}');
    });

    it('returns an object with exactly code and scope if scope is non-null', () => {
      const scope = { a: 1 };
      const code = new BSON.Code('() => {}', scope);
      expect(code.toJSON()).to.have.all.keys(['code', 'scope']);
      expect(code.toJSON()).to.have.property('code', '() => {}');
      expect(code.toJSON()).to.have.property('scope', scope);
    });
  });

  describe('toExtendedJSON()', () => {
    it('returns an object with only $code defined if scope is null', () => {
      const code = new BSON.Code('() => {}');
      expect(code.toExtendedJSON()).to.have.all.keys(['$code']);
      expect(code.toExtendedJSON()).to.have.property('$code', '() => {}');
    });

    it('returns an object with exactly $code and $scope if scope is non-null', () => {
      const scope = { a: 1 };
      const code = new BSON.Code('() => {}', scope);
      expect(code.toExtendedJSON()).to.have.all.keys(['$code', '$scope']);
      expect(code.toExtendedJSON()).to.have.property('$code', '() => {}');
      expect(code.toExtendedJSON()).to.have.property('$scope', scope);
    });
  });

  describe('static fromExtendedJSON()', () => {
    it('creates a Code instance from a {$code, $scope} object', () => {
      const ejsonDoc = { $code: 'function a() {}', $scope: { a: 1 } };
      const code = BSON.Code.fromExtendedJSON(ejsonDoc);
      expect(code).to.have.property('code', ejsonDoc.$code);
      expect(code).to.have.property('scope', ejsonDoc.$scope);
    });
  });
});
