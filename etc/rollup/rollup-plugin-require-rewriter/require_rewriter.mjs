import MagicString from 'magic-string';

const CRYPTO_IMPORT_ESM_SRC = `const nodejsRandomBytes = await (async () => {
    try {
        return (await import('crypto')).randomBytes;`;

export class RequireRewriter {
  /**
   * Take the compiled source code input; types are expected to already have been removed
   * Look for the function that depends on crypto, replace it with a top-level await
   * and dynamic import for the crypto module.
   *
   * @param {string} code - source code of the module being transformed
   * @param {string} id - module id (usually the source file name)
   * @returns {{ code: string; map: import('magic-string').SourceMap }}
   */
  transform(code, id) {
    if (!id.includes('node_byte_utils')) {
      return;
    }
    if (!code.includes('const nodejsRandomBytes')) {
      throw new Error(`Unexpected! 'const nodejsRandomBytes' is missing from ${id}`);
    }

    const start = code.indexOf('const nodejsRandomBytes');
    const endString = `return require('crypto').randomBytes;`;
    const end = code.indexOf(endString) + endString.length;

    if (start < 0 || end < 0) {
      throw new Error(
        `Unexpected! 'const nodejsRandomBytes' or 'return require('crypto').randomBytes;' not found`
      );
    }

    // MagicString lets us edit the source code and still generate an accurate source map
    const magicString = new MagicString(code);
    magicString.overwrite(start, end, CRYPTO_IMPORT_ESM_SRC);

    return {
      code: magicString.toString(),
      map: magicString.generateMap({ hires: true })
    };
  }
}
