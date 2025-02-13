import MagicString from 'magic-string';

const CRYPTO_IMPORT_ESM_SRC = `import { randomBytes as nodejsRandomBytes } from 'crypto';`;
const BROWSER_ESM_SRC = `const nodejsRandomBytes = nodejsMathRandomBytes;`;
const CODE_TO_REPLACE = `const nodejsRandomBytes = (() => {
    try {
        return require('crypto').randomBytes;
    }
    catch {
        return nodejsMathRandomBytes;
    }
})();`;

export function requireRewriter({ isBrowser = false } = {}) {
  return {
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
      const start = code.indexOf(CODE_TO_REPLACE);
      if (start === -1) {
        throw new Error(`Unexpected! Code meant to be replaced is missing from ${id}`);
      }

      const end = start + CODE_TO_REPLACE.length;

      // MagicString lets us edit the source code and still generate an accurate source map
      const magicString = new MagicString(code);
      magicString.overwrite(start, end, isBrowser ? BROWSER_ESM_SRC : CRYPTO_IMPORT_ESM_SRC);

      return {
        code: magicString.toString(),
        map: magicString.generateMap({ hires: true })
      };
    }
  };
}
