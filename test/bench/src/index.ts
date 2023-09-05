import { getStringDeserializationSuite } from './suites/string_deserialization';
import { getObjectIdSerializationSuite } from './suites/objectid_serialization';
import { type PerfSendData } from './util';
import { writeFile } from 'fs';
import { cpus, totalmem } from 'os';

const hw = cpus();
const platform = { name: hw[0].model, cores: hw.length, ram: `${totalmem() / 1024 ** 3}GiB` };

const results: PerfSendData[][] = [];

console.log(
  [
    `\n- cpu: ${platform.name}`,
    `- cores: ${platform.cores}`,
    `- os: ${process.platform}`,
    `- ram: ${platform.ram}`
  ].join('\n')
);

for (const suite of [getStringDeserializationSuite(), getObjectIdSerializationSuite()]) {
  suite.run();
  results.push(suite.results);
}

writeFile('benchmarks.json', JSON.stringify(results.flat()), err => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log('Wrote results to benchmarks.json');
});
