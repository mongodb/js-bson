import { expect } from 'chai';
import * as BSON from '../register-bson';
import type { Code, Document } from '../..';
import { inspect, types } from 'node:util';
import { DBRef } from '../register-bson';

const EJSON = BSON.EJSON;

function setOn(object: Document | unknown[] | Map<string, unknown>, value: unknown) {
  if (Array.isArray(object)) {
    object[Math.floor(Math.random() * object.length)] = value;
  } else if (types.isMap(object)) {
    // @ts-expect-error: "readonly" map case does not apply
    object.set('a', value);
  } else {
    object.a = value;
  }
}

function* generateTests() {
  for (const makeRoot of [() => new Map(), () => ({})]) {
    for (const makeNestedType of [() => new Map(), () => ({}), () => []]) {
      const root = makeRoot();
      const nested = makeNestedType();
      setOn(root, nested);
      setOn(nested, root);

      yield {
        title: `root that is a ${types.isMap(root) ? 'map' : 'object'} with a nested ${
          types.isMap(nested) ? 'map' : Array.isArray(nested) ? 'array' : 'object'
        } with a circular reference to the root throws`,
        input: root
      };
    }
  }
}

describe('Cyclic reference detection', () => {
  context('fuzz BSON circular references', () => {
    for (const test of generateTests()) {
      it(test.title, () => {
        expect(() => BSON.serialize(test.input), inspect(test.input)).to.throw(/circular/);
      });
    }
  });

  context('in Code with scope', () => {
    it('throws if code.scope is circular', () => {
      const root: { code: Code | null } = { code: null };
      root.code = new BSON.Code('function() {}', { a: root });
      expect(() => BSON.serialize(root)).to.throw(/circular/);
    });
  });

  context('in DBRef with fields', () => {
    it('throws if dbref.fields is circular', () => {
      const root: { dbref: DBRef | null } = { dbref: null };
      root.dbref = new BSON.DBRef('test', new BSON.ObjectId(), 'test', { a: root });
      expect(() => BSON.serialize(root)).to.throw(/circular/);
    });
  });

  context('EJSON circular references', () => {
    it('should throw a helpful error message for input with circular references', function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = {
        some: {
          property: {
            array: []
          }
        }
      };
      obj.some.property.array.push(obj.some);
      expect(() => EJSON.serialize(obj)).to.throw(`\
Converting circular structure to EJSON:
    (root) -> some -> property -> array -> index 0
                \\-----------------------------/`);
    });

    it('should throw a helpful error message for input with circular references, one-level nested', function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = {};
      obj.obj = obj;
      expect(() => EJSON.serialize(obj)).to.throw(`\
Converting circular structure to EJSON:
    (root) -> obj
       \\-------/`);
    });

    it('should throw a helpful error message for input with circular references, one-level nested inside base object', function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = {};
      obj.obj = obj;
      expect(() => EJSON.serialize({ foo: obj })).to.throw(`\
Converting circular structure to EJSON:
    (root) -> foo -> obj
               \\------/`);
    });

    it('should throw a helpful error message for input with circular references, pointing back to base object', function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = { foo: {} };
      obj.foo.obj = obj;
      expect(() => EJSON.serialize(obj)).to.throw(`\
Converting circular structure to EJSON:
    (root) -> foo -> obj
       \\--------------/`);
    });
  });
});
