import { BSONValue } from './bson_value';
import { getStylizeFunction } from './parser/utils';

/** @public */
export interface BSONSymbolExtended {
  $symbol: string;
}

/**
 * A class representation of the BSON Symbol type.
 * @public
 * @category BSONType
 */
export class BSONSymbol extends BSONValue {
  get _bsontype(): 'BSONSymbol' {
    return 'BSONSymbol';
  }

  value!: string;
  /**
   * @param value - the string representing the symbol.
   */
  constructor(value: string) {
    super();
    this.value = value;
  }

  /** Access the wrapped string value. */
  valueOf(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

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

  /** @internal */
  [Symbol.for('nodejs.util.inspect.custom')](depth?: number, options?: unknown): string {
    return this.inspect(depth, options);
  }

  inspect(depth?: number, options?: unknown): string {
    const stylize = getStylizeFunction(options);
    return `new BSONSymbol(${stylize(`"${this.value}"`, 'string')})`;
  }
}
