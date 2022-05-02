/* eslint-disable @typescript-eslint/no-var-requires */
import { performance } from 'perf_hooks';
import { readFile } from 'fs/promises';

const readJSONFile = async path =>
  JSON.parse(await readFile(new URL(path, import.meta.url), { encoding: 'utf8' }));

const ITERATIONS = 10_000;

function average(array) {
  let sum = 0;
  for (const value of array) sum += value;
  return sum / array.length;
}

function testPerformance(fn, iterations = ITERATIONS) {
  let measurements = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn(i);
    const end = performance.now();
    measurements.push(end - start);
  }
  return average(measurements).toFixed(8);
}

async function main() {
  const [currentBSON, currentReleaseBSON, legacyBSONLib] = await Promise.all([
    (async () => ({
      lib: await import('../../lib/bson.js'),
      version: 'current local'
    }))(),
    (async () => ({
      lib: await import('../../node_modules/bson_latest/lib/bson.js'),
      version: (await readJSONFile('../../node_modules/bson_latest/package.json')).version
    }))(),
    (async () => {
      const legacyBSON = (await import('../../node_modules/bson_legacy/index.js')).default;
      return {
        lib: { ...legacyBSON, ...legacyBSON.prototype },
        version: (await readJSONFile('../../node_modules/bson_legacy/package.json')).version
      };
    })()
  ]).catch(error => {
    console.error(error);
    console.error(
      `Please run:\n${[
        'npm run build',
        'npm install --no-save bson_legacy@npm:bson@1 bson_latest@npm:bson@latest'
      ].join('\n')}`
    );
    process.exit(1);
  });

  const documents = Array.from({ length: ITERATIONS }, () =>
    currentReleaseBSON.lib.serialize({
      _id: new currentReleaseBSON.lib.ObjectId(),
      field1: 'value1'
    })
  );

  console.log(`\nIterations: ${ITERATIONS}`);

  for (const bson of [currentBSON, currentReleaseBSON, legacyBSONLib]) {
    console.log(`\nBSON@${bson.version}`);
    console.log(
      `deserialize({ oid, string }, { validation: { utf8: false } }) takes ${testPerformance(i =>
        bson.lib.deserialize(documents[i], { validation: { utf8: false } })
      )}ms on average`
    );

    const oidBuffer = Buffer.from('00'.repeat(12), 'hex');
    console.log(
      `new Oid(buf) take ${testPerformance(() => new bson.lib.ObjectId(oidBuffer))}ms on average`
    );
  }

  console.log();
}

main()
  .then(() => null)
  .catch(error => console.error(error));
