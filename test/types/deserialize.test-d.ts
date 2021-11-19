import { expectType, expectError } from 'tsd';
import { deserialize, serialize } from '../../bson';

const sampleValidUTF8 = serialize({
  a: '😎',
  b: 'valid utf8',
  c: 12345
});

expectError(deserialize(sampleValidUTF8, { validation: { utf8: { a: false, b: true } } }));
expectError(deserialize(sampleValidUTF8, { validation: { utf8: { a: true, b: true, c: false } } }));

// all true and all false validation utf8 options are valid
deserialize(sampleValidUTF8, { validation: { utf8: { a: true, b: true, c: true } } });
deserialize(sampleValidUTF8, { validation: { utf8: { a: false, b: false, c: false} } });
deserialize(sampleValidUTF8, { validation: { utf8: true } });
deserialize(sampleValidUTF8, { validation: { utf8: false } });
