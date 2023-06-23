/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import { createHistogram } from 'perf_hooks';
import { readFile } from 'fs/promises';
import { cpus, totalmem } from 'os';
import { exec as execCb } from 'child_process';
import { promisify, types } from 'util';
import { writeFile } from 'fs/promises';
import * as semver from 'semver';
import v8Profiler from 'v8-profiler-next';
import chalk from 'chalk';
const exec = promisify(execCb);

const hw = cpus();
const ram = totalmem() / 1024 ** 3;
const platform = { name: hw[0].model, cores: hw.length, ram: `${ram}GB` };

export const systemInfo = iterations =>
  [
    `\n- cpu: ${platform.name}`,
    `- cores: ${platform.cores}`,
    `- os: ${process.platform}`,
    `- ram: ${platform.ram}`,
    `- iterations: ${iterations.toLocaleString()}`
  ].join('\n');

export const readJSONFile = async path =>
  JSON.parse(await readFile(new URL(path, import.meta.url), { encoding: 'utf8' }));

async function testPerformance(lib, [fn, arg], iterations) {
  let thrownError = null;
  const histogram = createHistogram();
  for (let i = 0; i < iterations; i++) {
    try {
      if (types.isAsyncFunction(fn)) {
        histogram.recordDelta();
        await fn(i, lib, arg);
        histogram.recordDelta();
      } else {
        histogram.recordDelta();
        fn(i, lib, arg);
        histogram.recordDelta();
      }
    } catch (error) {
      thrownError = error;
      break;
    }
  }
  return { histogram, thrownError };
}

export function getCurrentLocalBSON(libs) {
  return libs.filter(({ name }) => name === 'local')[0];
}

export async function getLibs() {
  const bsonVersions = await readJSONFile('./bson_versions.json');
  const entries = bsonVersions.versions.map(async (version) => {
    const bsonPath = `../../node_modules/bson${version.replaceAll('.', '')}`;
    const packageVersion = (await readJSONFile(`${bsonPath}/package.json`)).version;
    if (semver.lte(semver.coerce(version), '3.0.0')) {
      const legacy = (await import(`${bsonPath}/index.js`)).default;
      return {
        name: version,
        lib: { ...legacy, ...legacy.prototype },
        version: packageVersion
      };
    } else if (semver.gte(semver.coerce(version), '5.0.0')) {
      return {
        name: version,
        lib: await import(`${bsonPath}/lib/bson.cjs`),
        version: packageVersion
      };
    } else {
      return {
        name: version,
        lib: await import(`${bsonPath}/lib/bson.js`),
        version: packageVersion
      };
    }
  });

  entries.unshift({
    name: 'local',
    lib: await import('../../lib/bson.cjs'),
    version: (await readJSONFile('../../package.json')).version
  });

  return await Promise.all(entries).catch(e => {
    console.error(e);
    console.error('Run\n\tnpm run build\n\t,./etc/benchmarks/install_bson_versions.sh');
    process.exit(1);
  });
}

const printHistogram = (name, h) => {
  const makeReadableTime = nanoseconds => (nanoseconds / 1e6).toFixed(3).padStart(7, ' ');
  const line = [
    `| ${chalk.green(name.replaceAll(' ', '-'))} | ${chalk.cyan('max')}:    ${chalk.red(makeReadableTime(h.max))} ms |`,
    `  ${chalk.cyan('min')}:    ${chalk.red(makeReadableTime(h.min))} ms |`,
    `  ${chalk.cyan('mean')}:   ${chalk.red(makeReadableTime(h.mean))} ms |`,
    `  ${chalk.cyan('stddev')}: ${chalk.red(makeReadableTime(h.stddev))} ms |`,
    `  ${chalk.cyan('p90th')}:  ${chalk.red(makeReadableTime(h.percentile(90)))} ms |`,
    `  ${chalk.cyan('p95th')}:  ${chalk.red(makeReadableTime(h.percentile(95)))} ms |`,
    `  ${chalk.cyan('p99th')}:  ${chalk.red(makeReadableTime(h.percentile(99)))} ms |`
  ].join('');
  console.log();
  console.log('-'.repeat(235));
  console.log(line);
  console.log('-'.repeat(235));
};

/**
 * ```ts
 * interface {
 *   iterations?: number;
 *   setup: (lib: any[]) => any;
 *   name: string;
 *   run:(index: number, bson: typeof import('../../src/bson'), setupRes: any) => any )
 * }
 * ```
 */
export async function runner({ iterations, setup, name, run, skip }) {
  if (skip) {
    console.log(`skipped ${name}\n`);
    return;
  }
  const BSONLibs = await getLibs();
  const setupResult = setup?.(BSONLibs) ?? null;

  console.log('-'.repeat(235));

  for (const bson of BSONLibs) {
    const profileName = `${bson.name}_${name.replaceAll(' ', '-')}`;
    v8Profiler.startProfiling(profileName, true);
    v8Profiler.setGenerateType(1);
    const { histogram, thrownError } = await testPerformance(bson, [run, setupResult], iterations);
    if (thrownError != null) {
      console.log(
        `${bson.name.padEnd(14, ' ')} - v ${bson.version.padEnd(8, ' ')} - error ${thrownError}`
      );
    } else {
      printHistogram(`${chalk.greenBright(bson.name)} - ${chalk.blue(name)}`, histogram);
    }
    const profile = v8Profiler.stopProfiling(profileName);
    const result = await promisify(profile.export.bind(profile))();
    await writeFile(`${profileName}.cpuprofile`, result);
    profile.delete();
  }

  console.log();
}
