/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import { createHistogram } from 'perf_hooks';
import { readFile } from 'fs/promises';
import { cpus, totalmem } from 'os';
import { exec as execCb } from 'child_process';
import { promisify, types } from 'util';
import { writeFile } from 'fs/promises';
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
  return await Promise.all([
    (async () => {
      const { stdout } = await exec('git rev-parse --short HEAD');
      const hash = stdout.trim();
      return {
        name: 'local',
        lib: await import('../../lib/bson.js'),
        version: hash
      };
    })(),
    (async () => ({
      name: 'released',
      lib: await import('../../node_modules/bson_latest/lib/bson.js'),
      version: (await readJSONFile('../../node_modules/bson_latest/package.json')).version
    }))(),
    (async () => {
      const legacyBSON = (await import('../../node_modules/bson_legacy/index.js')).default;
      return {
        name: 'previous major',
        lib: { ...legacyBSON, ...legacyBSON.prototype },
        version: (await readJSONFile('../../node_modules/bson_legacy/package.json')).version
      };
    })()
    // BSON-EXT is EOL so we do not need to keep testing it, and it has issues installing it
    // in this no-save way on M1 currently that are not worth fixing.
    // (async () => ({
    //   name: 'bson-ext',
    //   lib: await import('../../node_modules/bson_ext/lib/index.js'),
    //   version: (await readJSONFile('../../node_modules/bson_ext/package.json')).version
    // }))()
  ]).catch(error => {
    console.error(error);
    console.error(
      `Please run:\n${[
        'npm run build',
        'npm install --no-save bson_ext@npm:bson-ext@4 bson_legacy@npm:bson@1 bson_latest@npm:bson@latest'
      ].join('\n')}`
    );
    process.exit(1);
  });
}

const printHistogram = (name, h) => {
  const makeReadableTime = nanoseconds => (nanoseconds / 1e6).toFixed(3).padStart(7, ' ');
  console.log();
  console.log(chalk.green(name));
  console.log('-'.repeat(155));
  process.stdout.write(`|  ${chalk.cyan('max')}:    ${chalk.red(makeReadableTime(h.max))} ms |`);
  process.stdout.write(`  ${chalk.cyan('min')}:    ${chalk.red(makeReadableTime(h.min))} ms |`);
  process.stdout.write(`  ${chalk.cyan('mean')}:   ${chalk.red(makeReadableTime(h.mean))} ms |`);
  process.stdout.write(`  ${chalk.cyan('stddev')}: ${chalk.red(makeReadableTime(h.stddev))} ms |`);
  process.stdout.write(
    `  ${chalk.cyan('p90th')}:  ${chalk.red(makeReadableTime(h.percentile(90)))} ms |`
  );
  process.stdout.write(
    `  ${chalk.cyan('p95th')}:  ${chalk.red(makeReadableTime(h.percentile(95)))} ms |`
  );
  process.stdout.write(
    `  ${chalk.cyan('p99th')}:  ${chalk.red(makeReadableTime(h.percentile(99)))} ms |`
  );
  console.log('\n' + '-'.repeat(155));
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

  console.log('-'.repeat(155));

  for (const bson of BSONLibs) {
    const profileName = `${bson.name}_${name}`;
    v8Profiler.startProfiling(profileName, true);
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
