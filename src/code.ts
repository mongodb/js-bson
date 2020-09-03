import type { BSONDocument } from './bson';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CodeFunction = (...args: any[]) => any;

/** A class representation of the BSON Code type. */
export class Code {
  _bsontype!: 'Code';

  code: string | CodeFunction;
  scope?: BSONDocument;
  /**
   * @param code - a string or function.
   * @param scope - an optional scope for the function.
   */
  constructor(code: string | CodeFunction, scope?: BSONDocument) {
    this.code = code;
    this.scope = scope;
  }

  /** @internal */
  toJSON(): { code: string | CodeFunction; scope?: BSONDocument } {
    return { code: this.code, scope: this.scope };
  }

  /** @internal */
  toExtendedJSON(): { $code: string | CodeFunction; $scope?: BSONDocument } {
    if (this.scope) {
      return { $code: this.code, $scope: this.scope };
    }

    return { $code: this.code };
  }

  /** @internal */
  static fromExtendedJSON(doc: { $code: string | CodeFunction; $scope?: BSONDocument }): Code {
    return new Code(doc.$code, doc.$scope);
  }
}

Object.defineProperty(Code.prototype, '_bsontype', { value: 'Code' });
