/** @public */
export interface BSONSymbolExtended {
  $symbol: string;
}

/**
 * A class representation of the BSON Symbol type.
 * @public
 */
export class BSONSymbol {
  _bsontype!: 'Symbol';

  value: string;
  /**
   * @param value - the string representing the symbol.
   */
  constructor(value: string) {
    this.value = value;
  }

  /** Access the wrapped string value. */
  valueOf(): string {
    return this.value;
  }

  /** @internal */
  toString(): string {
    return this.value;
  }

  /** @internal */
  inspect(): string {
    return `BSONSymbol("${this.value}")`;
  }

  /** @internal */
  toJSON(): string {
    return this.value;
  }

  /** @internal */
  toExtendedJSON(): BSONSymbolExtended {
    return { $symbol: this.value };
  }

  /** @internal */
  static fromExtendedJSON(doc: BSONSymbolExtended): BSONSymbol {
    return new BSONSymbol(doc.$symbol);
  }

  /** @internal */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.inspect();
  }
}

Object.defineProperty(BSONSymbol.prototype, '_bsontype', { value: 'Symbol' });
