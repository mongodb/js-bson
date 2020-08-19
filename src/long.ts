import Long = require('long');

/**
 * @ignore
 */
(Long as any).prototype.toExtendedJSON = function (options) {
  if (options && options.relaxed) return this.toNumber();
  return { $numberLong: this.toString() };
};

/**
 * @ignore
 */
(Long as any).fromExtendedJSON = function (doc, options) {
  const result = Long.fromString(doc.$numberLong);
  return options && options.relaxed ? result.toNumber() : result;
};

Object.defineProperty(Long.prototype, '_bsontype', { value: 'Long' });

export { Long };
