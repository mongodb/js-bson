/* eslint-disable @typescript-eslint/no-var-requires */
import { performance } from 'perf_hooks';
import { runner, systemInfo, getCurrentLocalBSON } from './lib_runner.mjs';

const iterations = 1_000_000;
const startedEntireRun = performance.now();
console.log(systemInfo(iterations));
console.log();

////////////////////////////////////////////////////////////////////////////////////////////////////
await runner({
  skip: false,
  name: 'deserialize({ oid, string }, { validation: { utf8: false } })',
  iterations,
  setup(libs) {
    const bson = getCurrentLocalBSON(libs);
    return Array.from({ length: iterations }, () =>
      bson.lib.serialize({
        _id: new bson.lib.ObjectId(),
        field1: 'value1'
      })
    );
  },
  run(i, bson, documents) {
    bson.lib.deserialize(documents[i], { validation: { utf8: false } });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////
await runner({
  skip: true,
  name: 'new Oid(buf)',
  iterations,
  setup() {
    return Buffer.from('00'.repeat(12), 'hex');
  },
  run(i, bson, oidBuffer) {
    new bson.lib.ObjectId(oidBuffer);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////
await runner({
  skip: true,
  name: 'BSON.deserialize(largeDocument)',
  iterations,
  setup(libs) {
    const bson = getCurrentLocalBSON(libs);
    const entries = Array.from({ length: 10 }, (_, i) => [
      `${i}_${'a'.repeat(10)}`,
      'b'.repeat(10)
    ]);
    const document = Object.fromEntries(entries);
    const bytes = bson.lib.serialize(document);
    console.log(`largeDocument { byteLength: ${bytes.byteLength} }`);
    return bytes;
  },
  run(i, bson, largeDocument) {
    new bson.lib.deserialize(largeDocument);
  }
});

// End
console.log(
  'Total time taken to benchmark:',
  (performance.now() - startedEntireRun).toLocaleString(),
  'ms'
);
