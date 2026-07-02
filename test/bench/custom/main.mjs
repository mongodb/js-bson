/* eslint-disable strict */

import util from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import benchmark from 'benchmark';
import { suites } from './benchmarks.mjs';

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

function logBenchmark(event) {
  console.log(String(event.target));
}

function processBenchmarkResult(bench, metadata) {
  return {
    info: { test_name: bench.name },
    metrics: [{ name: 'ops_per_sec', value: bench.hz, metadata }]
  };
}

let completedSuites = 0;
async function completeSuite() {
  const metadata = { improvement_direction: 'up' };
  if (++completedSuites >= collectedSuites.length) {
    let cpuBaselineResults;
    try {
      cpuBaselineResults = await import('../etc/cpuBaseline.json', {
        with: { type: 'json' }
      });
    } catch (cause) {
      throw new Error("Couldn't find baseline results", { cause });
    }

    cpuBaselineResults = cpuBaselineResults.default;
    const cpuBaselineResult = cpuBaselineResults.hz;
    if (typeof cpuBaselineResult !== 'number') {
      throw new Error("Couldn't find baseline result");
    }

    const data = [];
    for (const { suite, suiteConfig } of collectedSuites) {
      const { tags } = suiteConfig;
      for (const bench of Array.from(suite)) {
        const result = processBenchmarkResult(bench, { ...metadata, tags });
        result.metrics.push({
          name: 'normalized_throughput',
          value: bench.hz / cpuBaselineResult,
          metadata: { ...metadata, tags }
        });
        data.push(result);
      }

      data.push({
        info: { test_name: 'cpuBaseline' },
        metrics: [{ name: 'ops_per_sec', value: cpuBaselineResult, metadata }]
      });

      console.log(util.inspect(data, { depth: Infinity, colors: true }));
      fs.writeFileSync('customBenchmarkResults.json', JSON.stringify(data), 'utf8');
    }
  }
}

function processSuite(suiteModule, cycleHandler, completeHandler) {
  let suite = new benchmark.Suite(suiteModule.name);
  for (const b of suiteModule.benchmarks) {
    suite.add(b.name, b);
  }

  suite = suite.on('cycle', cycleHandler).on('complete', completeHandler).run({ async: true });

  return { suite, suiteConfig: suiteModule };
}

const collectedSuites = [];
for (const suite of suites) {
  const newSuite = processSuite(suite, logBenchmark, completeSuite);
  collectedSuites.push(newSuite);
}
