import type { Document } from './bson';
import { BSONValue } from './bson_value';
import { getStylizeFunction } from './parser/utils';

/** @public */
export interface CodeExtended {
  $code: string;
  $scope?: Document;
}

/**
 * A class representation of the BSON Code type.
 * @public
 * @category BSONType
 */
export class Code extends BSONValue {
  get _bsontype(): 'Code' {
    return 'Code';
  }

  code: string;

  // a code instance having a null scope is what determines whether
  // it is BSONType 0x0D (just code) / 0x0F (code with scope)
  scope: Document | null;

  /**
   * @param code - a string or function.
   * @param scope - an optional scope for the function.
   */
  constructor(code: string | Function, scope?: Document | null) {
    super();
    this.code = code.toString();
    this.scope = scope ?? null;
  }

  toJSON(): { code: string; scope?: Document } {
    if (this.scope != null) {
      return { code: this.code, scope: this.scope };
    }

    return { code: this.code };
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

  /** @internal */
  [Symbol.for('nodejs.util.inspect.custom')](
    depth?: number,
    options?: unknown,
    inspect?: (value: unknown, options: unknown) => string
  ): string {
    return this.inspect(depth, options, inspect);
  }

  inspect(
    depth?: number,
    options?: unknown,
    inspect?: (value: unknown, options: unknown) => string
  ): string {
    inspect ??= v => JSON.stringify(v);
    let parametersString = inspect(this.code, options);
    const multiLineFn = parametersString.includes('\n');
    if (this.scope != null) {
      parametersString += `,${multiLineFn ? '\n' : ' '}${inspect(this.scope, options)}`;
    }
    return `new Code(${multiLineFn ? '\n' : ''}${parametersString}${multiLineFn ? '\n' : ''})`;
  }
}
