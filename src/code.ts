import type { Document } from './bson';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CodeFunction = (...args: any[]) => any;

/** A class representation of the BSON Code type. */
export class Code {
  _bsontype!: 'Code';

  code: string | CodeFunction;
  scope?: Document;
  /**
   * @param code - a string or function.
   * @param scope - an optional scope for the function.
   */
  constructor(code: string | CodeFunction, scope?: Document) {
    this.code = code;
    this.scope = scope;
  }

  /** @internal */
  toJSON(): { code: string | CodeFunction; scope?: Document } {
    return { code: this.code, scope: this.scope };
  }

  /** @internal */
  toExtendedJSON(): { $code: string | CodeFunction; $scope?: Document } {
    if (this.scope) {
      return { $code: this.code, $scope: this.scope };
    }

    return { $code: this.code };
  }

  /** @internal */
  static fromExtendedJSON(doc: { $code: string | CodeFunction; $scope?: Document }): Code {
    return new Code(doc.$code, doc.$scope);
  }
}

Object.defineProperty(Code.prototype, '_bsontype', { value: 'Code' });
