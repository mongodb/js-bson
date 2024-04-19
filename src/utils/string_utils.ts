/**
 * @internal
 * Removes leading zeros from textual representation of a number.
 */
export function removeLeadingZeros(str: string): string {
  return !/[^0]+/.test(str)
    ? str.replace(/^0+/, '0') // all zeros case
    : str[0] === '-'
      ? str.replace(/^-0+/, '-') // negative number with leading zeros
      : str.replace(/^\+?0+/, '');
}
