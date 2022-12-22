import { BSONError } from './error';
import { ByteUtils } from './utils/byte_utils';

// Validation regex for v4 uuid (validates with or without dashes)
const VALIDATION_REGEX =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15})$/i;

export const uuidValidateString = (str: string): boolean =>
  typeof str === 'string' && VALIDATION_REGEX.test(str);

export const uuidHexStringToBuffer = (hexString: string): Uint8Array => {
  if (!uuidValidateString(hexString)) {
    throw new BSONError(
      'UUID string representations must be a 32 or 36 character hex string (dashes excluded/included). Format: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" or "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".'
    );
  }

  const sanitizedHexString = hexString.replace(/-/g, '');
  return ByteUtils.fromHex(sanitizedHexString);
};

export function bufferToUuidHexString(buffer: Uint8Array, includeDashes = true): string {
  if (includeDashes) {
    return [
      ByteUtils.toHex(buffer.subarray(0, 4)),
      ByteUtils.toHex(buffer.subarray(4, 6)),
      ByteUtils.toHex(buffer.subarray(6, 8)),
      ByteUtils.toHex(buffer.subarray(8, 10)),
      ByteUtils.toHex(buffer.subarray(10, 16))
    ].join('-');
  }
  return ByteUtils.toHex(buffer);
}
