'use strict';

var data = {
  description: 'Corrupted BSON',
  documents: [
    {
      encoded: '0400000000',
      error: 'basic'
    },
    {
      encoded: '0500000001',
      error: 'basic'
    },
    {
      encoded: '05000000',
      error: 'basic'
    },
    {
      encoded: '0700000002610078563412',
      error: 'basic'
    },
    {
      encoded: '090000001061000500',
      error: 'basic'
    },
    {
      encoded: '00000000000000000000',
      error: 'basic'
    },
    {
      encoded: '1300000002666f6f00040000006261720000',
      error: 'basic'
    },
    {
      encoded: '1800000003666f6f000f0000001062617200ffffff7f0000',
      error: 'basic'
    },
    {
      encoded: '1500000003666f6f000c0000000862617200010000',
      error: 'basic'
    },
    {
      encoded: '1c00000003666f6f001200000002626172000500000062617a000000',
      error: 'basic',
      skip: true
    },
    {
      encoded: '1000000002610004000000616263ff00',
      error: 'string is not null-terminated'
    },
    {
      encoded: '0c0000000200000000000000',
      error: 'bad_string_length'
    },
    {
      encoded: '120000000200ffffffff666f6f6261720000',
      error: 'bad_string_length'
    },
    {
      encoded: '0c0000000e00000000000000',
      error: 'bad_string_length'
    },
    {
      encoded: '120000000e00ffffffff666f6f6261720000',
      error: 'bad_string_length'
    },
    {
      encoded: '180000000c00fa5bd841d6585d9900',
      error: ''
    },
    {
      encoded: '1e0000000c00ffffffff666f6f626172005259b56afa5bd841d6585d9900',
      error: 'bad_string_length'
    },
    {
      encoded: '0c0000000d00000000000000',
      error: 'bad_string_length'
    },
    {
      encoded: '0c0000000d00ffffffff0000',
      error: 'bad_string_length'
    },
    {
      encoded: '1c0000000f001500000000000000000c000000020001000000000000',
      error: 'bad_string_length'
    },
    {
      encoded: '1c0000000f0015000000ffffffff000c000000020001000000000000',
      error: 'bad_string_length'
    },
    {
      encoded: '1c0000000f001500000001000000000c000000020000000000000000',
      error: 'bad_string_length'
    },
    {
      encoded: '1c0000000f001500000001000000000c0000000200ffffffff000000',
      error: 'bad_string_length'
    },
    {
      encoded: '0100000000',
      error:
        "An object size that's too small to even include the object size, but is correctly encoded, along with a correct EOO (and no data)"
    },
    {
      encoded: '05000000',
      error: 'One object, missing the EOO at the end'
    },
    {
      encoded: '05000000ff',
      error: "One object, sized correctly, with a spot for an EOO, but the EOO isn't 0x00"
    }
  ]
};

module.exports = data;
