import Long = require('long');

Object.defineProperty(Long.prototype, '_bsontype', {
  value: 'Long'
});

Object.defineProperty(Long.prototype, 'toExtendedJSON', {
  value: function (options) {
    if (options && options.relaxed) return this.toNumber();
    return { $numberLong: this.toString() };
  }
});

Object.defineProperty(Long, 'fromExtendedJSON', {
  value: function (doc, options) {
    const result = Long.fromString(doc.$numberLong);
    return options && options.relaxed ? result.toNumber() : result;
  }
});

export { Long };
