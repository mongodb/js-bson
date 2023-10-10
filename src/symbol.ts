import { BSONValue } from './bson_value';
import { type InspectParameterFn, basicInspectParameterFn } from './parser/utils';

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
  [Symbol.for('nodejs.util.inspect.custom')](
    depth?: number,
    options?: unknown,
    inspect?: InspectParameterFn
  ): string {
    return this.inspect(depth, options, inspect);
  }

  inspect(depth?: number, options?: unknown, inspect?: InspectParameterFn): string {
    const addQuotes = !inspect;
    inspect ??= basicInspectParameterFn;
    if (addQuotes) {
      return `new BSONSymbol('${inspect(this.value, options)}')`;
    }
    return `new BSONSymbol(${inspect(this.value, options)})`;
  }
}
