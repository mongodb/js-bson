export function isAnyArrayBuffer(value: unknown): value is ArrayBuffer {
  return (
    typeof value === 'object' &&
    value != null &&
    Symbol.toStringTag in value &&
    (value[Symbol.toStringTag] === 'ArrayBuffer' ||
      value[Symbol.toStringTag] === 'SharedArrayBuffer')
  );
}

export function isUint8Array(value: unknown): value is Uint8Array {
  return (
    typeof value === 'object' &&
    value != null &&
    Symbol.toStringTag in value &&
    value[Symbol.toStringTag] === 'Uint8Array'
  );
}

export function isBigInt64Array(value: unknown): value is BigInt64Array {
  return (
    typeof value === 'object' &&
    value != null &&
    Symbol.toStringTag in value &&
    value[Symbol.toStringTag] === 'BigInt64Array'
  );
}

export function isBigUInt64Array(value: unknown): value is BigUint64Array {
  return (
    typeof value === 'object' &&
    value != null &&
    Symbol.toStringTag in value &&
    value[Symbol.toStringTag] === 'BigUint64Array'
  );
}

export function isRegExp(d: unknown): d is RegExp {
  return Object.prototype.toString.call(d) === '[object RegExp]';
}

export function isMap(value: unknown): value is Map<unknown, unknown> {
  return (
    typeof value === 'object' &&
    value != null &&
    Symbol.toStringTag in value &&
    value[Symbol.toStringTag] === 'Map'
  );
}

export function isDate(d: unknown): d is Date {
  return Object.prototype.toString.call(d) === '[object Date]';
}

export type InspectFn = (x: unknown, options?: unknown) => string;
export function defaultInspect(x: unknown, _options?: unknown): string {
  return JSON.stringify(x, (k: string, v: unknown) => {
    if (typeof v === 'bigint') {
      return { $numberLong: `${v}` };
    } else if (isMap(v)) {
      return Object.fromEntries(v);
    }
    return v;
  });
}

/** @internal */
type StylizeFunction = (x: string, style: string) => string;
/** @internal */
export function getStylizeFunction(options?: unknown): StylizeFunction | undefined {
  const stylizeExists =
    options != null &&
    typeof options === 'object' &&
    'stylize' in options &&
    typeof options.stylize === 'function';

  if (stylizeExists) {
    return options.stylize as StylizeFunction;
  }
}
