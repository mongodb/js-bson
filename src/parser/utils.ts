const map = new WeakMap<object, string>();

/**
 * Retrieves the prototype.toString() of a value.
 * If the value is an object, it will cache the result in a WeakMap for future use.
 */
function getPrototypeString(value: unknown): string {
  let str = map.get(value as object);

  if (!str) {
    str = Object.prototype.toString.call(value);
    if (value !== null && typeof value === 'object') {
      map.set(value, str);
    }
  }
  return str;
}

export function isAnyArrayBuffer(value: unknown): value is ArrayBuffer {
  const type = getPrototypeString(value);
  return ['[object ArrayBuffer]', '[object SharedArrayBuffer]'].includes(type);
}

export function isUint8Array(value: unknown): value is Uint8Array {
  const type = getPrototypeString(value);
  return type === '[object Uint8Array]';
}

export function isBigInt64Array(value: unknown): value is BigInt64Array {
  const type = getPrototypeString(value);
  return type === '[object BigInt64Array]';
}

export function isBigUInt64Array(value: unknown): value is BigUint64Array {
  const type = getPrototypeString(value);
  return type === '[object BigUint64Array]';
}

export function isRegExp(d: unknown): d is RegExp {
  const type = getPrototypeString(d);
  return type === '[object RegExp]';
}

export function isMap(d: unknown): d is Map<unknown, unknown> {
  const type = getPrototypeString(d);
  return type === '[object Map]';
}

export function isDate(d: unknown): d is Date {
  const type = getPrototypeString(d);
  return type === '[object Date]';
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
