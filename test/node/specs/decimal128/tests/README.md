# BSON Decimal128 Value Object Tests

These tests follow the (Work In Progress) `"BSON Corpus"` format, more or less.

See:
  https://github.com/10gen/specifications/blob/bson-corpus/source/bson-corpus/README.md

In pseudo-code, the tests should look like the following:

```
B  = decode_hex( case["bson"] )
E  = case["extjson"]

if "canonical_bson" in case:
    cB = decode_hex( case["canonical_bson"] )
else:
    cB = B

if "canonical_extjson" in case:
    cE = decode_hex( case["canonical_extjson"] )
else:
    cE = E

// Baseline tests
assert encode_bson(decode_bson(B)) == cB        // B->B
assert encode_extjson(decode_bson(B)) == cE     // B->E
assert encode_extjson(decode_extjson(E)) == cE  // E->E
if "lossy" not in case:
    assert encode_bson(decode_extjson(E)) == cB // E->B

// Double check canonical BSON if provided
if B != cB:
    assert encode_bson(decode_bson(cB)) == cB    // B->B
    assert encode_extjson(decode_bson(cB)) == cE // B->E

// Double check canonical ExtJSON if provided
if E != cE:
    assert encode_extjson(decode_extjson(cB)) == cE // E->E
    if "lossy" not in case:
        assert encode_bson(decode_extjson(cE)) == cB // E->B
```
