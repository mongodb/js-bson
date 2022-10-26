/* eslint-disable @typescript-eslint/no-var-requires */
import { performance } from 'perf_hooks';
import { runner, systemInfo, getCurrentLocalBSON } from './lib_runner.mjs';

const iterations = 100;
const startedEntireRun = performance.now();
console.log(systemInfo(iterations));
console.log();

////////////////////////////////////////////////////////////////////////////////////////////////////
await runner({
  skip: true,
  name: 'deserialize an objectId and a string without utf8 validation',
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
  name: 'objectId constructor',
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
  name: 'deserialize a large document',
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

await runner({
  skip: true,
  name: 'Double Serialization',
  iterations,
  run(i, bson) {
    bson.lib.serialize({ d: 2.3 });
  }
});

await runner({
  skip: true,
  name: 'Double Deserialization',
  iterations,
  setup(libs) {
    const bson = getCurrentLocalBSON(libs);
    return bson.lib.serialize({ d: 2.3 });
  },
  run(i, bson, serialized_double) {
    bson.lib.deserialize(serialized_double);
  }
});

await runner({
  skip: true,
  name: 'Many Doubles Deserialization',
  iterations,
  setup(libs) {
    const bson = getCurrentLocalBSON(libs);
    let doubles = Object.fromEntries(
      Array.from({ length: 1000 }, i => {
        return [`a_${i}`, 2.3];
      })
    );
    return bson.lib.serialize(doubles);
  },
  run(i, bson, serialized_doubles) {
    bson.lib.deserialize(serialized_doubles);
  }
});

/// Batch full of user doc with 20 char strings w/ 20 strings
/// nextBatch simulate
/// nextBatch: [ { string * 20 } * 1000 ] /// Garbage call
await runner({
  skip: false,
  name: 'deserialize a large batch of documents each with an array of many strings',
  iterations,
  setup(libs) {
    const bson = libs[0].lib;
    return bson.serialize({
      nextBatch: Array.from({ length: 1000 }, () => ({
        _id: new bson.ObjectId(),
        arrayField: Array.from({ length: 20 }, (_, i) => '5e99f3f5d3ab06936d36000' + i)
      }))
    });
  },
  async run(i, bson, document) {
    await Promise.all(
      Array.from(
        { length: 100 },
        (_, i) =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve(bson.lib.deserialize(document, { validation: { utf8: false } }));
            }, 20);
          })
      )
    );
  }
});

// End
console.log(
  'Total time taken to benchmark:',
  (performance.now() - startedEntireRun).toLocaleString(),
  'ms'
);
