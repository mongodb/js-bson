import { expect } from 'chai';
import * as BSON from '../register-bson';
import type { Code, Document } from '../..';
import { inspect } from 'node:util';
import { isMap } from 'node:util/types';
import { DBRef } from '../register-bson';

const EJSON = BSON.EJSON;

function setOn(object: Document | unknown[] | Map<string, unknown>, value: unknown) {
  if (Array.isArray(object)) {
    object[Math.floor(Math.random() * object.length)] = value;
  } else if (isMap(object)) {
    // @ts-expect-error: "readonly" map case does not apply
    object.set('a', value);
  } else {
    object.a = value;
  }
}

function* generateTests() {
  // arbitrarily depth choice here... it could fail at 26! but is that worth testing?
  const levelsOfDepth = 25;
  for (let lvl = 2; lvl < levelsOfDepth; lvl++) {
    const isRootMap = Math.random() < 0.5;
    const root = isRootMap ? new Map() : {};

    let lastReference = root;
    for (let depth = 1; depth < lvl; depth++) {
      const referenceChoice = Math.random();
      const newLevel =
        referenceChoice < 0.3
          ? {}
          : referenceChoice > 0.3 && referenceChoice < 0.6
          ? // Just making an arbitrarily largish non-sparse array here
            Array.from({ length: Math.floor(Math.random() * 255) + 5 }, () => null)
          : new Map();

      setOn(lastReference, newLevel);
      lastReference = newLevel;
    }

    // Add the cycle
    setOn(lastReference, root);

    yield {
      title: `cyclic reference nested ${lvl} levels will cause the serializer to throw`,
      input: root
    };
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
