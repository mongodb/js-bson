import { expect } from 'chai';
import * as BSON from '../register-bson';
import type { Document } from '../..';
import { inspect } from 'node:util';
import { isMap } from 'node:util/types';

const EJSON = BSON.EJSON;

function setOn(object: Document | unknown[] | Map<string, unknown>, value: unknown) {
  if (Array.isArray(object)) {
    object[Math.floor(Math.random() * 250)] = value;
  } else if (isMap(object)) {
    // @ts-expect-error: "readonly" map case does not apply
    object.set('a', value);
  } else {
    object.a = value;
  }
}

function* generateTests() {
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
          ? []
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
  context('BSON circular references', () => {
    for (const test of generateTests()) {
      it(test.title, () => {
        expect(() => BSON.serialize(test.input), inspect(test.input)).to.throw(/circular/);
      });
    }
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
