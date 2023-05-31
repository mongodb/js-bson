import MagicString from 'magic-string';

const REQUIRE_TEXT_ENCODING =
  `const { TextEncoder, TextDecoder } = require('../vendor/text-encoding');
const { encode: btoa, decode: atob } = require('../vendor/base64');\n`

export class RequireVendor {
  /**
   * Take the compiled source code input; types are expected to already have been removed.
   * Add the TextEncoder, TextDecoder, atob, btoa requires.
   *
   * @param {string} code - source code of the module being transformed
   * @param {string} id - module id (usually the source file name)
   * @returns {{ code: string; map: import('magic-string').SourceMap }}
   */
  transform(code, id) {
    if (!id.includes('web_byte_utils')) {
      return;
    }

    // MagicString lets us edit the source code and still generate an accurate source map
    const magicString = new MagicString(code);
    magicString.prepend(REQUIRE_TEXT_ENCODING);

    return {
      code: magicString.toString(),
      map: magicString.generateMap({ hires: true })
    };
  }
}
