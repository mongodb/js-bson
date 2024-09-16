/* eslint-disable strict */

import util from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import benchmark from 'benchmark';
import { BSON } from '../../../lib/bson.mjs';

const hw = os.cpus();
const ram = os.totalmem() / 1024 ** 3;
const platform = { name: hw[0].model, cores: hw.length, ram: `${ram}GB` };

const systemInfo = () =>
  [
    `\n- cpu: ${platform.name}`,
    `- cores: ${platform.cores}`,
    `- arch: ${os.arch()}`,
    `- os: ${process.platform} (${os.release()})`,
    `- ram: ${platform.ram}\n`
  ].join('\n');
console.log(systemInfo());

const suite = new benchmark.Suite();

benchmark.options = {
  async: false,
  defer: false,
  initCount: 1000,
  minSamples: 1000
};

suite
  .add('objectid_isvalid_strlen', function objectid_isvalid_strlen() {
    BSON.ObjectId.isValid('a');
  })
  .add('objectid_isvalid_bestcase_false', function objectid_isvalid_bestcase_false() {
    BSON.ObjectId.isValid('g6e84ebdc96f4c0772f0cbbf');
  })
  .add('objectid_isvalid_worstcase_false', function objectid_isvalid_worstcase_false() {
    BSON.ObjectId.isValid('66e84ebdc96f4c0772f0cbbg');
  })
  .add('objectid_isvalid_true', function objectid_isvalid_true() {
    BSON.ObjectId.isValid('66e84ebdc96f4c0772f0cbbf');
  })
  .on('cycle', function logBenchmark(event) {
    console.log(String(event.target));
  })
  .on('complete', function outputPerfSend() {
    const data = Array.from(this).map(bench => ({
      info: { test_name: bench.name },
      metrics: [{ name: 'ops_per_sec', value: bench.hz }]
    }));
    console.log(util.inspect(data, { depth: Infinity, colors: true }));
    fs.writeFileSync('results.json', JSON.stringify(data), 'utf8');
  })
  .run();
