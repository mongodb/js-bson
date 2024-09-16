/* eslint-disable strict */

import util from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import benchmark from 'benchmark';
import { benchmarks } from './benchmarks.mjs';

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

for (const bench of benchmarks) suite.add(bench.name, bench);

suite
  .on('cycle', function logBenchmark(event) {
    console.log(String(event.target));
  })
  .on('complete', function outputPerfSend() {
    const data = Array.from(this).map(bench => ({
      info: { test_name: bench.name },
      metrics: [{ name: 'ops_per_sec', value: bench.hz }]
    }));
    console.log(util.inspect(data, { depth: Infinity, colors: true }));
    fs.writeFileSync('customBenchmarkResults.json', JSON.stringify(data), 'utf8');
  })
  .run();
