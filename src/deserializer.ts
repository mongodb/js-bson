import { type DeserializeOptions, Int32, type Document, BSONValue, BSONError } from './bson';
import { BSON_DATA_INT, BSON_DATA_STRING } from './constants';
import { type BSONElement, parseToElements } from './parser/on_demand/parse_to_elements';
import { ByteUtils } from './utils/byte_utils';
import { NumberUtils } from './utils/number_utils';

/**
 * Type for reviver functions.
 */
export type BSONReviver = (key: string, bytes: Uint8Array, element: BSONElement) => unknown;

/**
 * Deserializer interface.
 */
export interface BSONDeserializer {
  deserialize(buffer: Uint8Array, reviver?: BSONReviver): Document;
}

// Reviver that returns Int32 boxed type.
export const boxedInt32Reviver = (key: string, bytes: Uint8Array, element: BSONElement) => {
  const [offset] = element;
  return new Int32(NumberUtils.getInt32LE(bytes, offset));
};

// Reviver that returns numbers.
export const nativeInt32Reviver = (key: string, bytes: Uint8Array, element: BSONElement) => {
  const [offset] = element;
  return NumberUtils.getInt32LE(bytes, offset);
};

// Reviver that returns strings.
export const stringReviver = (key: string, bytes: Uint8Array, element: BSONElement) => {
  return BSONString.fromElement(bytes, element).toNative();
};

// Reviver that returns strings or temporals based on the key.
export const customStringReviver = (key: string, bytes: Uint8Array, element: BSONElement) => {
  const value = BSONString.fromElement(bytes, element).toNative();
  if (key === 'date') {
    // Temporal not supported by Node.js at this time.
    // return Temporal.PlainDate.from(value);
    return value;
  }
  return value;
};

// Example boxed revivers map.
export const BOXED_REVIVERS = new Map<number, BSONReviver>();
BOXED_REVIVERS.set(BSON_DATA_INT, boxedInt32Reviver);
BOXED_REVIVERS.set(BSON_DATA_STRING, stringReviver);
Object.freeze(BOXED_REVIVERS);

// Example native revivers map.
export const NATIVE_REVIVERS = new Map<number, BSONReviver>();
NATIVE_REVIVERS.set(BSON_DATA_INT, nativeInt32Reviver);
NATIVE_REVIVERS.set(BSON_DATA_STRING, stringReviver);
Object.freeze(NATIVE_REVIVERS);

/**
 * Deserialize the provided buffer.
 * @param buffer - The buffer.
 * @param reviver - The optional reviver.
 */
export function deserialize(buffer: Uint8Array, options?: DeserializeOptions): Document {
  return new RevivingBSONDeserializer(options).deserialize(buffer);
}

export class MissingReviverError extends BSONError {
  get name(): 'MissingReviverError' {
    return 'MissingReviverError';
  }
}

export class RevivingBSONDeserializer implements BSONDeserializer {
  revivers: Map<number, BSONReviver>;

  constructor(options?: DeserializeOptions) {
    if (options?.reviverMap) {
      this.revivers = options.reviverMap;
    } else {
      this.revivers = buildRevivers(options);
    }
  }

  deserialize(buffer: Uint8Array): Document {
    const document: Document = {};
    // Go through the buffer and deserialize the elements to BSON boxed types.
    // If a reviver map is provided, use that to deserialize each element,
    // otherwise use the internal reviver for each type.
    for (const element of parseToElements(buffer)) {
      // For each of the BSONElements create the key, get the reviver for the specific type
      // and call it with the key, the buffer, and the offset of the value in the buffer.
      // Set the return value of the revivier on the document.
      const [type, nameOffset, nameLength] = element;
      const key = ByteUtils.toUTF8(buffer, nameOffset, nameOffset + nameLength, false);
      const reviver = this.revivers.get(type);
      if (!reviver) {
        throw new MissingReviverError(`No reviver found for type ${type}.`);
      }
      document[key] = reviver(key, buffer, element);
    }
    return document;
  }
}

// Build the reviver map based on the user provided BSON options.
export function buildRevivers(options?: DeserializeOptions): Map<number, BSONReviver> {
  const reviverMap = new Map(BOXED_REVIVERS);
  // Example map population based on options.
  if (options?.promoteValues) {
    reviverMap.set(BSON_DATA_INT, nativeInt32Reviver);
  }
  return reviverMap;
}

export class BSONString extends BSONValue {
  get _bsontype(): 'BSONString' {
    return 'BSONString';
  }

  value: string;

  constructor(value: string) {
    super();
    this.value = value;
  }

  static fromElement(bytes: Uint8Array, element: BSONElement): BSONString {
    const [offset, length] = element;
    return new BSONString(ByteUtils.toUTF8(bytes, offset, length, false));
  }

  toNative(): string {
    return this.value;
  }

  inspect(): string {
    return `new BSONString(${this.value})`;
  }

  /** @internal */
  toExtendedJSON(): string {
    return this.value;
  }
}
