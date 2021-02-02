import { Buffer } from 'buffer';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

// Internally the version-check executes validate as well, but docs describes this way:
// https://www.npmjs.com/package/uuid#uuidvalidatestr
export const uuidHexStringValidateV4 = (hexString: string): boolean =>
  uuidValidate(hexString) && uuidVersion(hexString) === 4;

export const uuidHexStringToBuffer = (hexString: string): Buffer => {
  if (!uuidHexStringValidateV4(hexString)) {
    throw new TypeError(
      'UUID string representations must be a 36 character hex string (dashes included). Format: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".'
    );
  }

  const sanitizedHexString = hexString.replace(/-/g, '');
  return Buffer.from(sanitizedHexString, 'hex');
};

export const bufferToUuidHexString = (buffer: Buffer): string =>
  buffer.toString('hex', 0, 4) +
  '-' +
  buffer.toString('hex', 4, 6) +
  '-' +
  buffer.toString('hex', 6, 8) +
  '-' +
  buffer.toString('hex', 8, 10) +
  '-' +
  buffer.toString('hex', 10, 16);
