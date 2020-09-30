import type { Document } from './bson';

/** @public */
export interface CodeExtended {
  $code: string | Function;
  $scope?: Document;
}

/**
 * A class representation of the BSON Code type.
 * @public
 */
export class Code {
  _bsontype!: 'Code';

  code: string | Function;
  scope?: Document;
  /**
   * @param code - a string or function.
   * @param scope - an optional scope for the function.
   */
  constructor(code: string | Function, scope?: Document) {
    this.code = code;
    this.scope = scope;
  }

  /** @internal */
  toJSON(): { code: string | Function; scope?: Document } {
    return { code: this.code, scope: this.scope };
  }

  /** @internal */
  toExtendedJSON(): CodeExtended {
    if (this.scope) {
      return { $code: this.code, $scope: this.scope };
    }

    return { $code: this.code };
  }

  /** @internal */
  static fromExtendedJSON(doc: CodeExtended): Code {
    return new Code(doc.$code, doc.$scope);
  }
}

Object.defineProperty(Code.prototype, '_bsontype', { value: 'Code' });
