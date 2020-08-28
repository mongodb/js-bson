// We have an ES6 Map available, return the native instance

let bsonMap: MapConstructor;

const check = function (potentialGlobal: any) {
  // eslint-disable-next-line eqeqeq
  return potentialGlobal && potentialGlobal.Math == Math && potentialGlobal;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
function getGlobal() {
  // eslint-disable-next-line no-undef
  return (
    check(typeof globalThis === 'object' && globalThis) ||
    check(typeof window === 'object' && window) ||
    check(typeof self === 'object' && self) ||
    check(typeof global === 'object' && global) ||
    Function('return this')()
  );
}

const bsonGlobal = getGlobal();
if (Object.prototype.hasOwnProperty.call(bsonGlobal, 'Map')) {
  bsonMap = bsonGlobal.Map;
} else {
  // We will return a polyfill
  bsonMap = (function Map(array) {
    this._keys = [];
    this._values = {};

    for (let i = 0; i < array.length; i++) {
      if (array[i] == null) continue; // skip null and undefined
      const entry = array[i];
      const key = entry[0];
      const value = entry[1];
      // Add the key to the list of keys in order
      this._keys.push(key);
      // Add the key and value to the values dictionary with a point
      // to the location in the ordered keys list
      this._values[key] = { v: value, i: this._keys.length - 1 };
    }
  } as unknown) as MapConstructor;

  bsonMap.prototype.clear = function () {
    this._keys = [];
    this._values = {};
  };

  bsonMap.prototype.delete = function (key) {
    const value = this._values[key];
    if (value == null) return false;
    // Delete entry
    delete this._values[key];
    // Remove the key from the ordered keys list
    this._keys.splice(value.i, 1);
    return true;
  };

  bsonMap.prototype.entries = function () {
    let index = 0;

    return {
      next: () => {
        const key = this._keys[index++];
        return {
          value: key !== undefined ? [key, this._values[key].v] : undefined,
          done: key !== undefined ? false : true
        };
      }
    };
  } as any;

  bsonMap.prototype.forEach = function (callback, self) {
    self = self || this;

    for (let i = 0; i < this._keys.length; i++) {
      const key = this._keys[i];
      // Call the forEach callback
      callback.call(self, this._values[key].v, key, self);
    }
  };

  bsonMap.prototype.get = function (key) {
    return this._values[key] ? this._values[key].v : undefined;
  };

  bsonMap.prototype.has = function (key) {
    return this._values[key] != null;
  };

  bsonMap.prototype.keys = function () {
    let index = 0;

    return {
      next: () => {
        const key = this._keys[index++];
        return {
          value: key !== undefined ? key : undefined,
          done: key !== undefined ? false : true
        };
      }
    };
  } as any;

  bsonMap.prototype.set = function (key, value) {
    if (this._values[key]) {
      this._values[key].v = value;
      return this;
    }

    // Add the key to the list of keys in order
    this._keys.push(key);
    // Add the key and value to the values dictionary with a point
    // to the location in the ordered keys list
    this._values[key] = { v: value, i: this._keys.length - 1 };
    return this;
  };

  bsonMap.prototype.values = function () {
    let index = 0;

    return {
      next: () => {
        const key = this._keys[index++];
        return {
          value: key !== undefined ? this._values[key].v : undefined,
          done: key !== undefined ? false : true
        };
      }
    };
  } as any;

  Object.defineProperty(Map.prototype, 'size', {
    enumerable: true,
    get: function () {
      return this._keys.length;
    }
  });
}

export { bsonMap as Map };
