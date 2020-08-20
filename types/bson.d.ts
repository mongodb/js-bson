/// <reference types="node" />

/**
 * A class representation of the BSON Binary type.
 */
export declare class Binary {
    static readonly BUFFER_SIZE = 256;
    /**
     * Default BSON type
     *
     * @classconstant SUBTYPE_DEFAULT
     **/
    static readonly SUBTYPE_DEFAULT = 0;
    /**
     * Function BSON type
     *
     * @classconstant SUBTYPE_DEFAULT
     **/
    static readonly SUBTYPE_FUNCTION = 1;
    /**
     * Byte Array BSON type
     *
     * @classconstant SUBTYPE_DEFAULT
     **/
    static readonly SUBTYPE_BYTE_ARRAY = 2;
    /**
     * OLD UUID BSON type
     *
     * @classconstant SUBTYPE_DEFAULT
     **/
    static readonly SUBTYPE_UUID_OLD = 3;
    /**
     * UUID BSON type
     *
     * @classconstant SUBTYPE_DEFAULT
     **/
    static readonly SUBTYPE_UUID = 4;
    /**
     * MD5 BSON type
     *
     * @classconstant SUBTYPE_DEFAULT
     **/
    static readonly SUBTYPE_MD5 = 5;
    /**
     * User BSON type
     *
     * @classconstant SUBTYPE_DEFAULT
     **/
    static readonly SUBTYPE_USER_DEFINED = 128;
    buffer: any;
    sub_type: number;
    position: number;
    /**
     * Create a Binary type
     *
     * Sub types
     *  - **BSON.BSON_BINARY_SUBTYPE_DEFAULT**, default BSON type.
     *  - **BSON.BSON_BINARY_SUBTYPE_FUNCTION**, BSON function type.
     *  - **BSON.BSON_BINARY_SUBTYPE_BYTE_ARRAY**, BSON byte array type.
     *  - **BSON.BSON_BINARY_SUBTYPE_UUID**, BSON uuid type.
     *  - **BSON.BSON_BINARY_SUBTYPE_MD5**, BSON md5 type.
     *  - **BSON.BSON_BINARY_SUBTYPE_USER_DEFINED**, BSON user defined type.
     *
     * @param {Buffer} buffer a buffer object containing the binary data.
     * @param {Number} [subType] the option binary type.
     * @return {Binary}
     */
    constructor(buffer: any, subType: any);
    /**
     * Updates this binary with byte_value.
     *
     * @method
     * @param {string} byte_value a single byte we wish to write.
     */
    put(byte_value: any): void;
    /**
     * Writes a buffer or string to the binary.
     *
     * @method
     * @param {(Buffer|string)} string a string or buffer to be written to the Binary BSON object.
     * @param {number} offset specify the binary of where to write the content.
     * @return {null}
     */
    write(string: any, offset: any): void;
    /**
     * Reads **length** bytes starting at **position**.
     *
     * @method
     * @param {number} position read from the given position in the Binary.
     * @param {number} length the number of bytes to read.
     * @return {Buffer}
     */
    read(position: any, length: any): any;
    /**
     * Returns the value of this binary as a string.
     *
     * @method
     * @return {string}
     */
    value(asRaw: any): any;
    /**
     * Length.
     *
     * @method
     * @return {number} the length of the binary.
     */
    length(): number;
    /**
     * @ignore
     */
    toJSON(): any;
    /**
     * @ignore
     */
    toString(format: any): any;
    /**
     * @ignore
     */
    toExtendedJSON(options: any): {
        $binary: string;
        $type: string;
    } | {
        $binary: {
            base64: string;
            subType: string;
        };
        $type?: undefined;
    };
    /**
     * @ignore
     */
    static fromExtendedJSON(doc: any, options: any): Binary;
}

/**
 * Binary Byte Array Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_BYTE_ARRAY
 **/
export declare const BSON_BINARY_SUBTYPE_BYTE_ARRAY = 2;

/**
 * Binary Default Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_DEFAULT
 **/
export declare const BSON_BINARY_SUBTYPE_DEFAULT = 0;

/**
 * Binary Function Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_FUNCTION
 **/
export declare const BSON_BINARY_SUBTYPE_FUNCTION = 1;

/**
 * Binary MD5 Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_MD5
 **/
export declare const BSON_BINARY_SUBTYPE_MD5 = 4;

/**
 * Binary User Defined Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_USER_DEFINED
 **/
export declare const BSON_BINARY_SUBTYPE_USER_DEFINED = 128;

/**
 * Binary UUID Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_UUID
 **/
export declare const BSON_BINARY_SUBTYPE_UUID = 3;

/**
 * Array BSON Type
 *
 * @classconstant BSON_DATA_ARRAY
 **/
export declare const BSON_DATA_ARRAY = 4;

/**
 * Binary BSON Type
 *
 * @classconstant BSON_DATA_BINARY
 **/
export declare const BSON_DATA_BINARY = 5;

/**
 * Boolean BSON Type
 *
 * @classconstant BSON_DATA_BOOLEAN
 **/
export declare const BSON_DATA_BOOLEAN = 8;

/**
 * Code BSON Type
 *
 * @classconstant BSON_DATA_CODE
 **/
export declare const BSON_DATA_CODE = 13;

/**
 * Code with Scope BSON Type
 *
 * @classconstant BSON_DATA_CODE_W_SCOPE
 **/
export declare const BSON_DATA_CODE_W_SCOPE = 15;

/**
 * Date BSON Type
 *
 * @classconstant BSON_DATA_DATE
 **/
export declare const BSON_DATA_DATE = 9;

/**
 * Code BSON Type
 *
 * @classconstant BSON_DATA_DBPOINTER
 **/
export declare const BSON_DATA_DBPOINTER = 12;

/**
 * Long BSON Type
 *
 * @classconstant BSON_DATA_DECIMAL128
 **/
export declare const BSON_DATA_DECIMAL128 = 19;

/**
 * 32 bit Integer BSON Type
 *
 * @classconstant BSON_DATA_INT
 **/
export declare const BSON_DATA_INT = 16;

/**
 * Long BSON Type
 *
 * @classconstant BSON_DATA_LONG
 **/
export declare const BSON_DATA_LONG = 18;

/**
 * MaxKey BSON Type
 *
 * @classconstant BSON_DATA_MAX_KEY
 **/
export declare const BSON_DATA_MAX_KEY = 127;

/**
 * MinKey BSON Type
 *
 * @classconstant BSON_DATA_MIN_KEY
 **/
export declare const BSON_DATA_MIN_KEY = 255;

/**
 * null BSON Type
 *
 * @classconstant BSON_DATA_NULL
 **/
export declare const BSON_DATA_NULL = 10;

/**
 * Number BSON Type
 *
 * @classconstant BSON_DATA_NUMBER
 **/
export declare const BSON_DATA_NUMBER = 1;

/**
 * Object BSON Type
 *
 * @classconstant BSON_DATA_OBJECT
 **/
export declare const BSON_DATA_OBJECT = 3;

/**
 * ObjectId BSON Type
 *
 * @classconstant BSON_DATA_OID
 **/
export declare const BSON_DATA_OID = 7;

/**
 * RegExp BSON Type
 *
 * @classconstant BSON_DATA_REGEXP
 **/
export declare const BSON_DATA_REGEXP = 11;

/**
 * String BSON Type
 *
 * @classconstant BSON_DATA_STRING
 **/
export declare const BSON_DATA_STRING = 2;

/**
 * Symbol BSON Type
 *
 * @classconstant BSON_DATA_SYMBOL
 **/
export declare const BSON_DATA_SYMBOL = 14;

/**
 * Timestamp BSON Type
 *
 * @classconstant BSON_DATA_TIMESTAMP
 **/
export declare const BSON_DATA_TIMESTAMP = 17;

/**
 * Binary BSON Type
 *
 * @classconstant BSON_DATA_UNDEFINED
 **/
export declare const BSON_DATA_UNDEFINED = 6;

export declare const BSON_INT32_MAX = 2147483647;

export declare const BSON_INT32_MIN = -2147483648;

export declare const BSON_INT64_MAX: number;

export declare const BSON_INT64_MIN: number;

/**
 * A class representation of the BSON RegExp type.
 */
export declare class BSONRegExp {
    pattern: string;
    options: string;
    /**
     * Create a RegExp type
     *
     * @param {string} pattern The regular expression pattern to match
     * @param {string} options The regular expression options
     */
    constructor(pattern?: string, options?: string);
    static parseOptions(options: any): any;
    /**
     * @ignore
     */
    toExtendedJSON(options: any): {
        $regex: string;
        $options: string;
        $regularExpression?: undefined;
    } | {
        $regularExpression: {
            pattern: string;
            options: string;
        };
        $regex?: undefined;
        $options?: undefined;
    };
    /**
     * @ignore
     */
    static fromExtendedJSON(doc: any): any;
}

/**
 * A class representation of the BSON Symbol type.
 */
export declare class BSONSymbol {
    value: string;
    /**
     * Create a Symbol type
     *
     * @param {string} value the string representing the symbol.
     */
    constructor(value: string);
    /**
     * Access the wrapped string value.
     *
     * @method
     * @return {String} returns the wrapped string.
     */
    valueOf(): string;
    /**
     * @ignore
     */
    toString(): string;
    /**
     * @ignore
     */
    inspect(): string;
    /**
     * @ignore
     */
    toJSON(): string;
    /**
     * @ignore
     */
    toExtendedJSON(): {
        $symbol: string;
    };
    /**
     * @ignore
     */
    static fromExtendedJSON(doc: any): BSONSymbol;
}

/**
 * Calculate the bson size for a passed in Javascript object.
 *
 * @param {Object} object the Javascript object to calculate the BSON byte size for.
 * @param {Boolean} [options.serializeFunctions=false] serialize the javascript functions **(default:false)**.
 * @param {Boolean} [options.ignoreUndefined=true] ignore undefined fields **(default:true)**.
 * @return {Number} returns the number of bytes the BSON object will take up.
 */
export declare function calculateObjectSize(object: any, options: any): number;

/**
 * A class representation of the BSON Code type.
 */
export declare class Code {
    code: string | Function;
    scope: Document_2;
    /**
     * Create a Code type
     *
     * @param {(string|function)} code a string or function.
     * @param {Object} [scope] an optional scope for the function.
     * @return {Code}
     */
    constructor(code: string | Function, scope?: Document_2);
    /**
     * @ignore
     */
    toJSON(): {
        scope: Document_2;
        code: TimerHandler;
    };
    /**
     * @ignore
     */
    toExtendedJSON(): {
        $code: TimerHandler;
        $scope: Document_2;
    } | {
        $code: TimerHandler;
        $scope?: undefined;
    };
    /**
     * @ignore
     */
    static fromExtendedJSON(doc: any): Code;
}

/**
 * A class representation of the BSON DBRef type.
 */
export declare class DBRef {
    collection: string;
    oid: ObjectId;
    db: string;
    fields: any;
    /**
     * Create a DBRef type
     *
     * @param {string} collection the collection name.
     * @param {ObjectId} oid the reference ObjectId.
     * @param {string} [db] optional db name, if omitted the reference is local to the current db.
     * @return {DBRef}
     */
    constructor(collection: any, oid: any, db?: string, fields?: any);
    /**
     * @ignore
     * @api private
     */
    toJSON(): any;
    /**
     * @ignore
     */
    toExtendedJSON(options: any): DBRefShape;
    /**
     * @ignore
     */
    static fromExtendedJSON(doc: any): DBRef;
}

declare interface DBRefShape {
    $ref: string;
    $id: ObjectId;
    $db?: string;
}

/**
 * A class representation of the BSON Decimal128 type.
 *
 * @class
 * @param {Buffer} bytes a buffer containing the raw Decimal128 bytes.
 * @return {Double}
 */
export declare function Decimal128(bytes: any): void;

export declare namespace Decimal128 {
    var fromString: (string: any) => any;
    var fromExtendedJSON: (doc: any) => any;
}

/**
 * Deserialize data as BSON.
 *
 * @param {Buffer} buffer the buffer containing the serialized set of BSON documents.
 * @param {Object} [options.evalFunctions=false] evaluate functions in the BSON document scoped to the object deserialized.
 * @param {Object} [options.cacheFunctions=false] cache evaluated functions for reuse.
 * @param {Object} [options.cacheFunctionsCrc32=false] use a crc32 code for caching, otherwise use the string of the function.
 * @param {Object} [options.promoteLongs=true] when deserializing a Long will fit it into a Number if it's smaller than 53 bits
 * @param {Object} [options.promoteBuffers=false] when deserializing a Binary will return it as a node.js Buffer instance.
 * @param {Object} [options.promoteValues=false] when deserializing will promote BSON values to their Node.js closest equivalent types.
 * @param {Object} [options.fieldsAsRaw=null] allow to specify if there what fields we wish to return as unserialized raw buffer.
 * @param {Object} [options.bsonRegExp=false] return BSON regular expressions as BSONRegExp instances.
 * @param {boolean} [options.allowObjectSmallerThanBufferSize=false] allows the buffer to be larger than the parsed BSON object
 * @return {Object} returns the deserialized Javascript Object.
 */
export declare function deserialize(buffer: any, options: any): {};

/**
 * Deserializes an Extended JSON object into a plain JavaScript object with native/BSON types
 *
 * @memberof EJSON
 * @param {object} ejson The Extended JSON object to deserialize
 * @param {object} [options] Optional settings passed to the parse method
 * @return {object}
 */
declare function deserialize_2(ejson: any, options: any): any;

/**
 * Deserialize stream data as BSON documents.
 *
 * @param {Buffer} data the buffer containing the serialized set of BSON documents.
 * @param {Number} startIndex the start index in the data Buffer where the deserialization is to start.
 * @param {Number} numberOfDocuments number of documents to deserialize.
 * @param {Array} documents an array where to store the deserialized documents.
 * @param {Number} docStartIndex the index in the documents array from where to start inserting documents.
 * @param {Object} [options] additional options used for the deserialization.
 * @param {Object} [options.evalFunctions=false] evaluate functions in the BSON document scoped to the object deserialized.
 * @param {Object} [options.cacheFunctions=false] cache evaluated functions for reuse.
 * @param {Object} [options.cacheFunctionsCrc32=false] use a crc32 code for caching, otherwise use the string of the function.
 * @param {Object} [options.promoteLongs=true] when deserializing a Long will fit it into a Number if it's smaller than 53 bits
 * @param {Object} [options.promoteBuffers=false] when deserializing a Binary will return it as a node.js Buffer instance.
 * @param {Object} [options.promoteValues=false] when deserializing will promote BSON values to their Node.js closest equivalent types.
 * @param {Object} [options.fieldsAsRaw=null] allow to specify if there what fields we wish to return as unserialized raw buffer.
 * @param {Object} [options.bsonRegExp=false] return BSON regular expressions as BSONRegExp instances.
 * @return {Number} returns the next index in the buffer after deserialization **x** numbers of documents.
 */
export declare function deserializeStream(data: any, startIndex: any, numberOfDocuments: any, documents: any, docStartIndex: any, options: any): any;

declare interface Document_2 {
    [key: string]: any;
}

/**
 * A class representation of the BSON Double type.
 */
export declare class Double {
    value: number;
    /**
     * Create a Double type
     *
     * @param {number|Number} value the number we want to represent as a double.
     * @return {Double}
     */
    constructor(value: any);
    /**
     * Access the number value.
     *
     * @method
     * @return {number} returns the wrapped double number.
     */
    valueOf(): number;
    /**
     * @ignore
     */
    toJSON(): number;
    /**
     * @ignore
     */
    toExtendedJSON(options: any): number | {
        $numberDouble: any;
    };
    /**
     * @ignore
     */
    static fromExtendedJSON(doc: any, options: any): number | Double;
}

export declare const EJSON: {
    parse: typeof parse;
    stringify: typeof stringify;
    serialize: typeof serialize_2;
    deserialize: typeof deserialize_2;
};

/**
 * A class representation of a BSON Int32 type.
 */
export declare class Int32 {
    value: number;
    /**
     * Create an Int32 type
     *
     * @param {*} value the number we want to represent as an int32.
     * @return {Int32}
     */
    constructor(value: any);
    /**
     * Access the number value.
     *
     * @method
     * @return {number} returns the wrapped int32 number.
     */
    valueOf(): number;
    /**
     * @ignore
     */
    toJSON(): number;
    /**
     * @ignore
     */
    toExtendedJSON(options: any): number | {
        $numberInt: string;
    };
    /**
     * @ignore
     */
    static fromExtendedJSON(doc: any, options: any): number | Int32;
}

export declare const JS_INT_MAX = 9007199254740992;

export declare const JS_INT_MIN = -9007199254740992;

/**
 * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
 *  See the from* functions below for more convenient ways of constructing Longs.
 * @exports Long
 * @class A Long class for representing a 64 bit two's-complement integer value.
 * @param {number} low The low (signed) 32 bits of the long
 * @param {number} high The high (signed) 32 bits of the long
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @constructor
 */
declare class Long_2 {
    __isLong__: true;
    _bsontype: string;
    constructor(low?: number, high?: number, unsigned?: boolean);
    /**
     * Maximum unsigned value.
     */
    static MAX_UNSIGNED_VALUE: Long_2;
    /**
     * Maximum signed value.
     */
    static MAX_VALUE: Long_2;
    /**
     * Minimum signed value.
     */
    static MIN_VALUE: Long_2;
    /**
     * Signed negative one.
     */
    static NEG_ONE: Long_2;
    /**
     * Signed one.
     */
    static ONE: Long_2;
    /**
     * Unsigned one.
     */
    static UONE: Long_2;
    /**
     * Unsigned zero.
     */
    static UZERO: Long_2;
    /**
     * Signed zero
     */
    static ZERO: Long_2;
    /**
     * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits. Each is assumed to use 32 bits.
     */
    static fromBits: (lowBits: number, highBits: number, unsigned?: boolean) => Long_2;
    /**
     * Returns a Long representing the given 32 bit integer value.
     */
    static fromInt: (value: number, unsigned?: boolean) => Long_2;
    /**
     * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
     */
    static fromNumber: (value: number, unsigned?: boolean) => Long_2;
    /**
     * Returns a Long representation of the given string, written using the specified radix.
     */
    static fromString: (str: string, unsigned?: boolean | number, radix?: number) => Long_2;
    /**
     * Creates a Long from its byte representation.
     */
    static fromBytes: (bytes: number[], unsigned?: boolean, le?: boolean) => Long_2;
    /**
     * Creates a Long from its little endian byte representation.
     */
    static fromBytesLE: (bytes: number[], unsigned?: boolean) => Long_2;
    /**
     * Creates a Long from its little endian byte representation.
     */
    static fromBytesBE: (bytes: number[], unsigned?: boolean) => Long_2;
    /**
     * Tests if the specified object is a Long.
     */
    static isLong: (obj: any) => obj is Long_2;
    /**
     * Converts the specified value to a Long.
     */
    static fromValue: (val: Long_2 | number | string | {
        low: number;
        high: number;
        unsigned: boolean;
    }) => Long_2;
    /**
     * The high 32 bits as a signed value.
     */
    high: number;
    /**
     * The low 32 bits as a signed value.
     */
    low: number;
    /**
     * Whether unsigned or not.
     */
    unsigned: boolean;
    /**
     * Returns the sum of this and the specified Long.
     */
    add: (addend: number | Long_2 | string) => Long_2;
    /**
     * Returns the bitwise AND of this Long and the specified.
     */
    and: (other: Long_2 | number | string) => Long_2;
    /**
     * Compares this Long's value with the specified's.
     */
    compare: (other: Long_2 | number | string) => number;
    /**
     * Compares this Long's value with the specified's.
     */
    comp: (other: Long_2 | number | string) => number;
    /**
     * Returns this Long divided by the specified.
     */
    divide: (divisor: Long_2 | number | string) => Long_2;
    /**
     * Returns this Long divided by the specified.
     */
    div: (divisor: Long_2 | number | string) => Long_2;
    /**
     * Tests if this Long's value equals the specified's.
     */
    equals: (other: Long_2 | number | string) => boolean;
    /**
     * Tests if this Long's value equals the specified's.
     */
    eq: (other: Long_2 | number | string) => boolean;
    /**
     * Gets the high 32 bits as a signed integer.
     */
    getHighBits: () => number;
    /**
     * Gets the high 32 bits as an unsigned integer.
     */
    getHighBitsUnsigned: () => number;
    /**
     * Gets the low 32 bits as a signed integer.
     */
    getLowBits: () => number;
    /**
     * Gets the low 32 bits as an unsigned integer.
     */
    getLowBitsUnsigned: () => number;
    /**
     * Gets the number of bits needed to represent the absolute value of this Long.
     */
    getNumBitsAbs: () => number;
    /**
     * Tests if this Long's value is greater than the specified's.
     */
    greaterThan: (other: Long_2 | number | string) => boolean;
    /**
     * Tests if this Long's value is greater than the specified's.
     */
    gt: (other: Long_2 | number | string) => boolean;
    /**
     * Tests if this Long's value is greater than or equal the specified's.
     */
    greaterThanOrEqual: (other: Long_2 | number | string) => boolean;
    /**
     * Tests if this Long's value is greater than or equal the specified's.
     */
    gte: (other: Long_2 | number | string) => boolean;
    /**
     * Tests if this Long's value is even.
     */
    isEven: () => boolean;
    /**
     * Tests if this Long's value is negative.
     */
    isNegative: () => boolean;
    /**
     * Tests if this Long's value is odd.
     */
    isOdd: () => boolean;
    /**
     * Tests if this Long's value is positive.
     */
    isPositive: () => boolean;
    /**
     * Tests if this Long's value equals zero.
     */
    isZero: () => boolean;
    /**
     * Tests if this Long's value is less than the specified's.
     */
    lessThan: (other: Long_2 | number | string) => boolean;
    /**
     * Tests if this Long's value is less than the specified's.
     */
    lt: (other: Long_2 | number | string) => boolean;
    /**
     * Tests if this Long's value is less than or equal the specified's.
     */
    lessThanOrEqual: (other: Long_2 | number | string) => boolean;
    /**
     * Tests if this Long's value is less than or equal the specified's.
     */
    lte: (other: Long_2 | number | string) => boolean;
    /**
     * Returns this Long modulo the specified.
     */
    modulo: (other: Long_2 | number | string) => Long_2;
    /**
     * Returns this Long modulo the specified.
     */
    mod: (other: Long_2 | number | string) => Long_2;
    /**
     * Returns the product of this and the specified Long.
     */
    multiply: (multiplier: Long_2 | number | string) => Long_2;
    /**
     * Returns the product of this and the specified Long.
     */
    mul: (multiplier: Long_2 | number | string) => Long_2;
    /**
     * Negates this Long's value.
     */
    negate: () => Long_2;
    /**
     * Negates this Long's value.
     */
    neg: () => Long_2;
    /**
     * Returns the bitwise NOT of this Long.
     */
    not: () => Long_2;
    /**
     * Tests if this Long's value differs from the specified's.
     */
    notEquals: (other: Long_2 | number | string) => boolean;
    /**
     * Tests if this Long's value differs from the specified's.
     */
    neq: (other: Long_2 | number | string) => boolean;
    /**
     * Returns the bitwise OR of this Long and the specified.
     */
    or: (other: Long_2 | number | string) => Long_2;
    /**
     * Returns this Long with bits shifted to the left by the given amount.
     */
    shiftLeft: (numBits: number | Long_2) => Long_2;
    /**
     * Returns this Long with bits shifted to the left by the given amount.
     */
    shl: (numBits: number | Long_2) => Long_2;
    /**
     * Returns this Long with bits arithmetically shifted to the right by the given amount.
     */
    shiftRight: (numBits: number | Long_2) => Long_2;
    /**
     * Returns this Long with bits arithmetically shifted to the right by the given amount.
     */
    shr: (numBits: number | Long_2) => Long_2;
    /**
     * Returns this Long with bits logically shifted to the right by the given amount.
     */
    shiftRightUnsigned: (numBits: number | Long_2) => Long_2;
    /**
     * Returns this Long with bits logically shifted to the right by the given amount.
     */
    shru: (numBits: number | Long_2) => Long_2;
    /**
     * Returns the difference of this and the specified Long.
     */
    subtract: (subtrahend: number | Long_2 | string) => Long_2;
    /**
     * Returns the difference of this and the specified Long.
     */
    sub: (subtrahend: number | Long_2 | string) => Long_2;
    /**
     * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
     */
    toInt: () => number;
    /**
     * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
     */
    toNumber: () => number;
    /**
     * Converts this Long to its byte representation.
     */
    toBytes: (le?: boolean) => number[];
    /**
     * Converts this Long to its little endian byte representation.
     */
    toBytesLE: () => number[];
    /**
     * Converts this Long to its big endian byte representation.
     */
    toBytesBE: () => number[];
    /**
     * Converts this Long to signed.
     */
    toSigned: () => typeof Long_2;
    /**
     * Converts the Long to a string written in the specified radix.
     */
    toString: (radix?: number) => string;
    /**
     * Converts this Long to unsigned.
     */
    toUnsigned: () => Long_2;
    /**
     * Returns the bitwise XOR of this Long and the given one.
     */
    xor: (other: Long_2 | number | string) => Long_2;
    eqz: Long_2['isZero'];
    ne: Long_2['notEquals'];
    le: Long_2['lessThanOrEqual'];
    ge: Long_2['greaterThanOrEqual'];
    rem: Long_2['modulo'];
    shr_u: Long_2['shiftRightUnsigned'];
    toExtendedJSON(options: any): any;
    static fromExtendedJSON(doc: any, options: any): number | Long_2;
}
export { Long_2 as Long }

declare let Map_2: MapConstructor;
export { Map_2 as Map }

/**
 * A class representation of the BSON MaxKey type.
 */
export declare class MaxKey {
    /**
     * @ignore
     */
    toExtendedJSON(): {
        $maxKey: number;
    };
    /**
     * @ignore
     */
    static fromExtendedJSON(): MaxKey;
}

/**
 * A class representation of the BSON MinKey type.
 */
export declare class MinKey {
    /**
     * @ignore
     */
    toExtendedJSON(): {
        $minKey: number;
    };
    /**
     * @ignore
     */
    static fromExtendedJSON(): MinKey;
}

/**
 * A class representation of the BSON ObjectId type.
 */
declare class ObjectId {
    /** @internal */
    static index: number;
    static cacheHexString?: boolean;
    id: string | Buffer;
    __id?: string;
    /**
     * Create an ObjectId type
     *
     * @param {(string|Buffer|number)} id Can be a 24 byte hex string, 12 byte binary Buffer, or a Number.
     * @property {number} generationTime The generation time of this ObjectId instance
     * @return {ObjectId} instance of ObjectId.
     */
    constructor(id?: string | Buffer | number);
    /**
     * Return the ObjectId id as a 24 byte hex string representation
     *
     * @method
     * @return {string} return the 24 byte hex string representation.
     */
    toHexString(): string;
    /**
     * Update the ObjectId index used in generating new ObjectId's on the driver
     *
     * @method
     * @return {number} returns next index value.
     * @ignore
     */
    static getInc(): number;
    /**
     * Generate a 12 byte id buffer used in ObjectId's
     *
     * @method
     * @param {number} [time] optional parameter allowing to pass in a second based timestamp.
     * @return {Buffer} return the 12 byte id buffer string.
     */
    static generate(time: any): Buffer;
    /**
     * Converts the id into a 24 byte hex string for printing
     *
     * @param {String} format The Buffer toString format parameter.
     * @return {String} return the 24 byte hex string representation.
     * @ignore
     */
    toString(format?: string): string;
    /**
     * Converts to its JSON representation.
     *
     * @return {String} return the 24 byte hex string representation.
     * @ignore
     */
    toJSON(): string;
    /**
     * Compares the equality of this ObjectId with `otherID`.
     *
     * @method
     * @param {object} otherId ObjectId instance to compare against.
     * @return {boolean} the result of comparing two ObjectId's
     */
    equals(otherId: any): boolean;
    /**
     * Returns the generation date (accurate up to the second) that this ID was generated.
     *
     * @method
     * @return {Date} the generation date
     */
    getTimestamp(): Date;
    /**
     * @ignore
     */
    static createPk(): ObjectId;
    /**
     * Creates an ObjectId from a second based number, with the rest of the ObjectId zeroed out. Used for comparisons or sorting the ObjectId.
     *
     * @method
     * @param {number} time an integer number representing a number of seconds.
     * @return {ObjectId} return the created ObjectId
     */
    static createFromTime(time: any): ObjectId;
    /**
     * Creates an ObjectId from a hex string representation of an ObjectId.
     *
     * @method
     * @param {string} hexString create a ObjectId from a passed in 24 byte hexstring.
     * @return {ObjectId} return the created ObjectId
     */
    static createFromHexString(string: any): ObjectId;
    /**
     * Checks if a value is a valid bson ObjectId
     *
     * @method
     * @param {*} id ObjectId instance to validate.
     * @return {boolean} return true if the value is a valid bson ObjectId, return false otherwise.
     */
    static isValid(id: any): boolean;
    /**
     * @ignore
     */
    toExtendedJSON(): {
        $oid: string;
    };
    /**
     * @ignore
     */
    static fromExtendedJSON(doc: any): ObjectId;
}
export { ObjectId as ObjectID }
export { ObjectId }

/**
 * Parse an Extended JSON string, constructing the JavaScript value or object described by that
 * string.
 *
 * @memberof EJSON
 * @param {string} text
 * @param {object} [options] Optional settings
 * @param {boolean} [options.relaxed=true] Attempt to return native JS types where possible, rather than BSON types (if true)
 * @return {object}
 *
 * @example
 * ```js
 * const { EJSON } = require('bson');
 * const text = '{ "int32": { "$numberInt": "10" } }';
 *
 * // prints { int32: { [String: '10'] _bsontype: 'Int32', value: '10' } }
 * console.log(EJSON.parse(text, { relaxed: false }));
 *
 * // prints { int32: 10 }
 * console.log(EJSON.parse(text));
 * ```
 */
declare function parse(text: any, options: any): any;

/**
 * Serialize a Javascript object.
 *
 * @param {Object} object the Javascript object to serialize.
 * @param {Boolean} [options.checkKeys] the serializer will check if keys are valid.
 * @param {Boolean} [options.serializeFunctions=false] serialize the javascript functions **(default:false)**.
 * @param {Boolean} [options.ignoreUndefined=true] ignore undefined fields **(default:true)**.
 * @return {Buffer} returns the Buffer object containing the serialized object.
 */
export declare function serialize(object: any, options: any): Buffer;

/**
 * Serializes an object to an Extended JSON string, and reparse it as a JavaScript object.
 *
 * @memberof EJSON
 * @param {object} bson The object to serialize
 * @param {object} [options] Optional settings passed to the `stringify` function
 * @return {object}
 */
declare function serialize_2(bson: any, options: any): any;

/**
 * Serialize a Javascript object using a predefined Buffer and index into the buffer, useful when pre-allocating the space for serialization.
 *
 * @param {Object} object the Javascript object to serialize.
 * @param {Buffer} buffer the Buffer you pre-allocated to store the serialized BSON object.
 * @param {Boolean} [options.checkKeys] the serializer will check if keys are valid.
 * @param {Boolean} [options.serializeFunctions=false] serialize the javascript functions **(default:false)**.
 * @param {Boolean} [options.ignoreUndefined=true] ignore undefined fields **(default:true)**.
 * @param {Number} [options.index] the index in the buffer where we wish to start serializing into.
 * @return {Number} returns the index pointing to the last written byte in the buffer.
 */
export declare function serializeWithBufferAndIndex(object: any, finalBuffer: any, options: any): number;

/**
 * Sets the size of the internal serialization buffer.
 *
 * @method
 * @param {number} size The desired size for the internal serialization buffer
 */
export declare function setInternalBufferSize(size: any): void;

/**
 * Converts a BSON document to an Extended JSON string, optionally replacing values if a replacer
 * function is specified or optionally including only the specified properties if a replacer array
 * is specified.
 *
 * @memberof EJSON
 * @param {object} value The value to convert to extended JSON
 * @param {function|array} [replacer] A function that alters the behavior of the stringification process, or an array of String and Number objects that serve as a whitelist for selecting/filtering the properties of the value object to be included in the JSON string. If this value is null or not provided, all properties of the object are included in the resulting JSON string
 * @param {string|number} [space] A String or Number object that's used to insert white space into the output JSON string for readability purposes.
 * @param {object} [options] Optional settings
 * @param {boolean} [options.relaxed=true] Enabled Extended JSON's `relaxed` mode
 * @param {boolean} [options.legacy=false] Output using the Extended JSON v1 spec
 * @returns {string}
 *
 * @example
 * const { EJSON } = require('bson');
 * const Int32 = require('mongodb').Int32;
 * const doc = { int32: new Int32(10) };
 *
 * // prints '{"int32":{"$numberInt":"10"}}'
 * console.log(EJSON.stringify(doc, { relaxed: false }));
 *
 * // prints '{"int32":10}'
 * console.log(EJSON.stringify(doc));
 */
declare function stringify(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number, options?: any): string;

/**
 * @class
 * @param {number} low  the low (signed) 32 bits of the Timestamp.
 * @param {number} high the high (signed) 32 bits of the Timestamp.
 * @return {Timestamp}
 */
export declare class Timestamp extends Long_2 {
    constructor(low: number | Long_2, high?: number);
    /**
     * Return the JSON value.
     *
     * @method
     * @return {String} the JSON representation.
     */
    toJSON(): {
        $timestamp: string;
    };
    /**
     * Returns a Timestamp represented by the given (32-bit) integer value.
     *
     * @method
     * @param {number} value the 32-bit integer in question.
     * @return {Timestamp} the timestamp.
     */
    static fromInt(value: any): Timestamp;
    /**
     * Returns a Timestamp representing the given number value, provided that it is a finite number. Otherwise, zero is returned.
     *
     * @method
     * @param {number} value the number in question.
     * @return {Timestamp} the timestamp.
     */
    static fromNumber(value: any): Timestamp;
    /**
     * Returns a Timestamp for the given high and low bits. Each is assumed to use 32 bits.
     *
     * @method
     * @param {number} lowBits the low 32-bits.
     * @param {number} highBits the high 32-bits.
     * @return {Timestamp} the timestamp.
     */
    static fromBits(lowBits: any, highBits: any): Timestamp;
    /**
     * Returns a Timestamp from the given string, optionally using the given radix.
     *
     * @method
     * @param {String} str the textual representation of the Timestamp.
     * @param {number} [opt_radix] the radix in which the text is written.
     * @return {Timestamp} the timestamp.
     */
    static fromString(str: any, opt_radix: any): Timestamp;
    /**
     * @ignore
     */
    toExtendedJSON(options: any): any;
    /**
     * @ignore
     */
    static fromExtendedJSON(doc: any): Timestamp;
}

export { }
