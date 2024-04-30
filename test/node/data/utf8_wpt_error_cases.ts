// extra error cases copied from wpt/encoding/textdecoder-fatal.any.js
// commit sha: 7c9f867
// link: https://github.com/web-platform-tests/wpt/commit/7c9f8674d9809731e8919073d957d6233f6e0544

export const utf8WebPlatformSpecTests = [
  { encoding: 'utf-8', input: [0xff], name: 'invalid code' },
  { encoding: 'utf-8', input: [0xc0], name: 'ends early' },
  { encoding: 'utf-8', input: [0xe0], name: 'ends early 2' },
  { encoding: 'utf-8', input: [0xc0, 0x00], name: 'invalid trail' },
  { encoding: 'utf-8', input: [0xc0, 0xc0], name: 'invalid trail 2' },
  { encoding: 'utf-8', input: [0xe0, 0x00], name: 'invalid trail 3' },
  { encoding: 'utf-8', input: [0xe0, 0xc0], name: 'invalid trail 4' },
  { encoding: 'utf-8', input: [0xe0, 0x80, 0x00], name: 'invalid trail 5' },
  { encoding: 'utf-8', input: [0xe0, 0x80, 0xc0], name: 'invalid trail 6' },
  { encoding: 'utf-8', input: [0xfc, 0x80, 0x80, 0x80, 0x80, 0x80], name: '> 0x10ffff' },
  { encoding: 'utf-8', input: [0xfe, 0x80, 0x80, 0x80, 0x80, 0x80], name: 'obsolete lead byte' },

  // Overlong encodings
  { encoding: 'utf-8', input: [0xc0, 0x80], name: 'overlong U+0000 - 2 bytes' },
  { encoding: 'utf-8', input: [0xe0, 0x80, 0x80], name: 'overlong U+0000 - 3 bytes' },
  { encoding: 'utf-8', input: [0xf0, 0x80, 0x80, 0x80], name: 'overlong U+0000 - 4 bytes' },
  { encoding: 'utf-8', input: [0xf8, 0x80, 0x80, 0x80, 0x80], name: 'overlong U+0000 - 5 bytes' },
  {
    encoding: 'utf-8',
    input: [0xfc, 0x80, 0x80, 0x80, 0x80, 0x80],
    name: 'overlong U+0000 - 6 bytes'
  },

  { encoding: 'utf-8', input: [0xc1, 0xbf], name: 'overlong U+007f - 2 bytes' },
  { encoding: 'utf-8', input: [0xe0, 0x81, 0xbf], name: 'overlong U+007f - 3 bytes' },
  { encoding: 'utf-8', input: [0xf0, 0x80, 0x81, 0xbf], name: 'overlong U+007f - 4 bytes' },
  { encoding: 'utf-8', input: [0xf8, 0x80, 0x80, 0x81, 0xbf], name: 'overlong U+007f - 5 bytes' },
  {
    encoding: 'utf-8',
    input: [0xfc, 0x80, 0x80, 0x80, 0x81, 0xbf],
    name: 'overlong U+007f - 6 bytes'
  },

  { encoding: 'utf-8', input: [0xe0, 0x9f, 0xbf], name: 'overlong U+07ff - 3 bytes' },
  { encoding: 'utf-8', input: [0xf0, 0x80, 0x9f, 0xbf], name: 'overlong U+07ff - 4 bytes' },
  { encoding: 'utf-8', input: [0xf8, 0x80, 0x80, 0x9f, 0xbf], name: 'overlong U+07ff - 5 bytes' },
  {
    encoding: 'utf-8',
    input: [0xfc, 0x80, 0x80, 0x80, 0x9f, 0xbf],
    name: 'overlong U+07ff - 6 bytes'
  },

  { encoding: 'utf-8', input: [0xf0, 0x8f, 0xbf, 0xbf], name: 'overlong U+ffff - 4 bytes' },
  { encoding: 'utf-8', input: [0xf8, 0x80, 0x8f, 0xbf, 0xbf], name: 'overlong U+ffff - 5 bytes' },
  {
    encoding: 'utf-8',
    input: [0xfc, 0x80, 0x80, 0x8f, 0xbf, 0xbf],
    name: 'overlong U+ffff - 6 bytes'
  },

  { encoding: 'utf-8', input: [0xf8, 0x84, 0x8f, 0xbf, 0xbf], name: 'overlong U+10ffff - 5 bytes' },
  {
    encoding: 'utf-8',
    input: [0xfc, 0x80, 0x84, 0x8f, 0xbf, 0xbf],
    name: 'overlong U+10ffff - 6 bytes'
  },

  // UTf-16 surrogates encoded as code points in UTf-8
  { encoding: 'utf-8', input: [0xed, 0xa0, 0x80], name: 'lead surrogate' },
  { encoding: 'utf-8', input: [0xed, 0xb0, 0x80], name: 'trail surrogate' },
  { encoding: 'utf-8', input: [0xed, 0xa0, 0x80, 0xed, 0xb0, 0x80], name: 'surrogate pair' }
];
