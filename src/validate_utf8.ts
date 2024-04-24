import { BSONError } from './error';

type TextDecoder = {
  readonly encoding: string;
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;
  decode(input?: Uint8Array): string;
};
type TextDecoderConstructor = {
  new (label: 'utf8', options: { fatal: boolean; ignoreBOM?: boolean }): TextDecoder;
};

type TextEncoder = {
  readonly encoding: string;
  encode(input?: string): Uint8Array;
};
type TextEncoderConstructor = {
  new (): TextEncoder;
};

// validate utf8 globals
declare const TextDecoder: TextDecoderConstructor;
declare const TextEncoder: TextEncoderConstructor;

const TextDecoderFatal: TextDecoder = new TextDecoder('utf8', { fatal: true });
const TextDecoderNonFatal: TextDecoder = new TextDecoder('utf8', { fatal: false });

/**
 * Determines if the passed in bytes are valid utf8
 * @param bytes - An array of 8-bit bytes. Must be indexable and have length property
 * @param start - The index to start validating
 * @param end - The index to end validating
 */
export function validateUtf8(
  buffer: Uint8Array,
  start: number,
  end: number,
  fatal: boolean
): string {
  if (fatal) {
    try {
      return TextDecoderFatal.decode(buffer.slice(start, end));
    } catch (cause) {
      throw new BSONError('Invalid UTF-8 string in BSON document', { cause });
    }
  }
  return TextDecoderNonFatal.decode(buffer.slice(start, end));
}
