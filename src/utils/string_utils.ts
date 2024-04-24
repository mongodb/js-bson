/**
 * @internal
 * Removes leading zeros and explicit plus from textual representation of a number.
 */
export function removeLeadingZerosandExplicitPlus(str: string): string {
  return !/[^+?0]+/.test(str)
    ? str.replace(/^\+?0+/, '0') // all zeros case (remove explicit plus if it exists)
    : str[0] === '-'
      ? str.replace(/^-0+/, '-') // negative number with leading zeros
      : str.replace(/^\+?0*/, ''); // remove explicit plus
}

/**
 * @internal
 * Returns false for an string that contains invalid characters for its radix, else returns the original string.
 * @param str - The textual representation of the Long
 * @param radix - The radix in which the text is written (2-36), defaults to 10
 */
export function validateStringCharacters(str: string, radix?: number): false | string {
  radix = radix ?? 10;
  const validCharacters = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, radix);
  // regex is case insensitive and checks that each character within the string is one of the validCharacters
  const regex = new RegExp(`[^-+${validCharacters}]`, 'i');
  return regex.test(str) ? false : str;
}
