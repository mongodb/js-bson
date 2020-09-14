// BSON MAX VALUES
export const BSON_INT32_MAX = 0x7fffffff;
export const BSON_INT32_MIN = -0x80000000;

export const BSON_INT64_MAX = Math.pow(2, 63) - 1;
export const BSON_INT64_MIN = -Math.pow(2, 63);

// JS MAX PRECISE VALUES
export const JS_INT_MAX = 0x20000000000000; // Any integer up to 2^53 can be precisely represented by a double.
export const JS_INT_MIN = -0x20000000000000; // Any integer down to -2^53 can be precisely represented by a double.

/**
 * Number BSON Type
 *
 * @classconstant BSON_DATA_NUMBER
 **/
export const BSON_DATA_NUMBER = 1;

/**
 * String BSON Type
 *
 * @classconstant BSON_DATA_STRING
 **/
export const BSON_DATA_STRING = 2;

/**
 * Object BSON Type
 *
 * @classconstant BSON_DATA_OBJECT
 **/
export const BSON_DATA_OBJECT = 3;

/**
 * Array BSON Type
 *
 * @classconstant BSON_DATA_ARRAY
 **/
export const BSON_DATA_ARRAY = 4;

/**
 * Binary BSON Type
 *
 * @classconstant BSON_DATA_BINARY
 **/
export const BSON_DATA_BINARY = 5;

/**
 * Binary BSON Type
 *
 * @classconstant BSON_DATA_UNDEFINED
 **/
export const BSON_DATA_UNDEFINED = 6;

/**
 * ObjectId BSON Type
 *
 * @classconstant BSON_DATA_OID
 **/
export const BSON_DATA_OID = 7;

/**
 * Boolean BSON Type
 *
 * @classconstant BSON_DATA_BOOLEAN
 **/
export const BSON_DATA_BOOLEAN = 8;

/**
 * Date BSON Type
 *
 * @classconstant BSON_DATA_DATE
 **/
export const BSON_DATA_DATE = 9;

/**
 * null BSON Type
 *
 * @classconstant BSON_DATA_NULL
 **/
export const BSON_DATA_NULL = 10;

/**
 * RegExp BSON Type
 *
 * @classconstant BSON_DATA_REGEXP
 **/
export const BSON_DATA_REGEXP = 11;

/**
 * Code BSON Type
 *
 * @classconstant BSON_DATA_DBPOINTER
 **/
export const BSON_DATA_DBPOINTER = 12;

/**
 * Code BSON Type
 *
 * @classconstant BSON_DATA_CODE
 **/
export const BSON_DATA_CODE = 13;

/**
 * Symbol BSON Type
 *
 * @classconstant BSON_DATA_SYMBOL
 **/
export const BSON_DATA_SYMBOL = 14;

/**
 * Code with Scope BSON Type
 *
 * @classconstant BSON_DATA_CODE_W_SCOPE
 **/
export const BSON_DATA_CODE_W_SCOPE = 15;

/**
 * 32 bit Integer BSON Type
 *
 * @classconstant BSON_DATA_INT
 **/
export const BSON_DATA_INT = 16;

/**
 * Timestamp BSON Type
 *
 * @classconstant BSON_DATA_TIMESTAMP
 **/
export const BSON_DATA_TIMESTAMP = 17;

/**
 * Long BSON Type
 *
 * @classconstant BSON_DATA_LONG
 **/
export const BSON_DATA_LONG = 18;

/**
 * Long BSON Type
 *
 * @classconstant BSON_DATA_DECIMAL128
 **/
export const BSON_DATA_DECIMAL128 = 19;

/**
 * MinKey BSON Type
 *
 * @classconstant BSON_DATA_MIN_KEY
 **/
export const BSON_DATA_MIN_KEY = 0xff;

/**
 * MaxKey BSON Type
 *
 * @classconstant BSON_DATA_MAX_KEY
 **/
export const BSON_DATA_MAX_KEY = 0x7f;

/**
 * Binary Default Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_DEFAULT
 **/
export const BSON_BINARY_SUBTYPE_DEFAULT = 0;

/**
 * Binary Function Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_FUNCTION
 **/
export const BSON_BINARY_SUBTYPE_FUNCTION = 1;

/**
 * Binary Byte Array Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_BYTE_ARRAY
 **/
export const BSON_BINARY_SUBTYPE_BYTE_ARRAY = 2;

/**
 * Binary UUID Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_UUID
 **/
export const BSON_BINARY_SUBTYPE_UUID = 3;

/**
 * Binary MD5 Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_MD5
 **/
export const BSON_BINARY_SUBTYPE_MD5 = 4;

/**
 * Binary User Defined Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_USER_DEFINED
 **/
export const BSON_BINARY_SUBTYPE_USER_DEFINED = 128;
