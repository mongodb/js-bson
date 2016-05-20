# BSON Corpus

This BSON test data corpus consists of a JSON file for each BSON type, plus
a `top.json` file for testing the overall, enclosing document.

Top level keys include:

* `description`: human-readable description of what is in the file
* `bson_type`: hex string of the first byte of a BSON element (e.g. "0x01"
  for type "double"); this will be the synthetic value "0x00" for `top.json`.
* `test_key`: name of a field in a `valid` test case `extjson` document
  should be checked against the case's `string` field.
* `valid` (optional): an array of valid test cases (see below).
* `decodeErrors` (optional): an array of decode error cases (see below).
* `parseErrors` (optional): an array of type-specific parse error case (see
  below).

Valid test case keys include:

* `description`: human-readable test case label.
* `subject`: an (uppercase) big-endian hex representation of a BSON byte
  string.  Be sure to mangle the case as appropriate in any roundtrip
  tests.
* `string`: (optional) a representation of an element in the `extjson`
  field that can be checked to verify correct extjson decoding.  How to
  check is language and bson-type specific.
* `extjson`: a document representing the decoded extended JSON document
  equivalent to the subject.
* `decodeOnly` (optional): if true, indicates that the BSON can not
  roundtrip; decoding the BSON in 'subject' and re-encoding the result will
  not generate identical BSON; otherwise, encode(decode(subject)) should be
  the same as the subject.

Decode error cases provide an invalid BSON document or field that
should result in an error. For each case, keys include:

* `description`: human-readable test case label.
* `subject`: an (uppercase) big-endian hex representation of an invalid
  BSON string that should fail to decode correctly.

Parse error cases are type-specific and represent some input that can not
be encoded to the `bson_type` under test.  For each case, keys include:

* `description`: human-readable test case label.
* `subject`: a text or numeric representation of an input that can't be
  encoded.

## Extended JSON extensions

The extended JSON documentation doesn't include extensions for all BSON
types.  These are supported by `mongoexport`:

    # Javascript
    { "$code": "<code here>" }

    # Javascript with scope
    { "$code": "<code here>": "$scope": { "x":1, "y":1 } }

    # Int32
    { "$numberInt": "<number>" }

However, this corpus extends JSON further to include the following:

    # Double (needed for NaN, etc.)
    { "$numberDouble": "<value|NaN|Inf|-Inf>" }

    # DBpointer (deprecated): <id> is 24 hex chars
    { "$dbpointer": "<id>", "$ns":"<namespace>" }

    # Symbol (deprecated)
    { "$symbol": "<text>" }

## Visualizing BSON

The directory includes a Perl script `bsonview`, which will decompose and
highlight elements of a BSON document.  It may be used like this:

    echo "0900000010610005000000" | perl bsonview -x

## Open Questions

These issues are still TBD:

* Can "-0.0" be represented "canonically" in bson?  Some languages might
  not round-trip it.  (Do we need a "lossy_bson" field to capture this?)

* How should DBPointer round-trip? Should we expect it to be turned into a
  DBRef or round-trip faithfully?

* How should Symbol roundtrip?  Should we expect it to be turned into a
  string?

* How should Undefined roundtrip? Should we expect it to be turned into a
  null?

* Should we flag cases where extjson is lossy compared to bson?
