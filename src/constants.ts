// BSON MAX VALUES
export const BSON_INT32_MAX = 0x7fffffff;
export const BSON_INT32_MIN = -0x80000000;

export const BSON_INT64_MAX = Math.pow(2, 63) - 1;
export const BSON_INT64_MIN = -Math.pow(2, 63);

// JS MAX PRECISE VALUES
// Any integer up to 2^53 can be precisely represented by a double.
export const JS_INT_MAX = Number.MAX_SAFE_INTEGER + 1;
// Any integer down to -2^53 can be precisely represented by a double.
export const JS_INT_MIN = Number.MIN_SAFE_INTEGER - 1;

/** Number BSON Type */
export const BSON_DATA_NUMBER = 1;

/** String BSON Type */
export const BSON_DATA_STRING = 2;

/** Object BSON Type */
export const BSON_DATA_OBJECT = 3;

/** Array BSON Type */
export const BSON_DATA_ARRAY = 4;

/** Binary BSON Type */
export const BSON_DATA_BINARY = 5;

/** Binary BSON Type */
export const BSON_DATA_UNDEFINED = 6;

/** ObjectId BSON Type */
export const BSON_DATA_OID = 7;

/** Boolean BSON Type */
export const BSON_DATA_BOOLEAN = 8;

/** Date BSON Type */
export const BSON_DATA_DATE = 9;

/** null BSON Type */
export const BSON_DATA_NULL = 10;

/** RegExp BSON Type */
export const BSON_DATA_REGEXP = 11;

/** Code BSON Type */
export const BSON_DATA_DBPOINTER = 12;

/** Code BSON Type */
export const BSON_DATA_CODE = 13;

/** Symbol BSON Type */
export const BSON_DATA_SYMBOL = 14;

/** Code with Scope BSON Type */
export const BSON_DATA_CODE_W_SCOPE = 15;

/** 32 bit Integer BSON Type */
export const BSON_DATA_INT = 16;

/** Timestamp BSON Type */
export const BSON_DATA_TIMESTAMP = 17;

/** Long BSON Type */
export const BSON_DATA_LONG = 18;

/** Decimal128 BSON Type */
export const BSON_DATA_DECIMAL128 = 19;

/** MinKey BSON Type */
export const BSON_DATA_MIN_KEY = 0xff;

/** MaxKey BSON Type */
export const BSON_DATA_MAX_KEY = 0x7f;

/** Binary Default Type */
export const BSON_BINARY_SUBTYPE_DEFAULT = 0;

/** Binary Function Type */
export const BSON_BINARY_SUBTYPE_FUNCTION = 1;

/** Binary Byte Array Type */
export const BSON_BINARY_SUBTYPE_BYTE_ARRAY = 2;

/** Binary Deprecated UUID Type @deprecated Please use BSON_BINARY_SUBTYPE_UUID_NEW */
export const BSON_BINARY_SUBTYPE_UUID = 3;

/** Binary UUID Type */
export const BSON_BINARY_SUBTYPE_UUID_NEW = 4;

/** Binary MD5 Type */
export const BSON_BINARY_SUBTYPE_MD5 = 5;

/** Binary User Defined Type */
export const BSON_BINARY_SUBTYPE_USER_DEFINED = 128;
