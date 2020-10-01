/**
 * UUID regular expression pattern copied from `uuid` npm module.
 * @see https://github.com/uuidjs/uuid/blob/master/src/regex.js
 */
const UUID_RX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

/** @public */
export interface UUIDExtended {
  $uuid: string;
}

/**
 * Parser function copied from `uuid` npm module.
 * @see https://github.com/uuidjs/uuid/blob/master/src/parse.js
 * @internal
 */
export function parseUUID(uuid: string): Uint8Array {
  if (typeof uuid !== 'string') {
    throw new TypeError('Invalid type for UUID, expected string but got ' + typeof uuid);
  }

  if (!UUID_RX.test(uuid)) {
    throw new TypeError('Invalid format for UUID: ' + uuid);
  }

  let v;
  const arr = new Uint8Array(16);

  // Parse ########-....-....-....-............
  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = (v >>> 16) & 0xff;
  arr[2] = (v >>> 8) & 0xff;
  arr[3] = v & 0xff;

  // Parse ........-####-....-....-............
  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 0xff;

  // Parse ........-....-####-....-............
  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 0xff;

  // Parse ........-....-....-####-............
  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 0xff;

  // Parse ........-....-....-....-############
  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)
  arr[10] = ((v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000) & 0xff;
  arr[11] = (v / 0x100000000) & 0xff;
  arr[12] = (v >>> 24) & 0xff;
  arr[13] = (v >>> 16) & 0xff;
  arr[14] = (v >>> 8) & 0xff;
  arr[15] = v & 0xff;

  return arr;
}
