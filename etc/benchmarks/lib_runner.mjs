/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import { performance } from 'perf_hooks';
import { readFile } from 'fs/promises';
import { cpus, totalmem } from 'os';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';
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

function average(array) {
  let sum = 0;
  for (const value of array) sum += value;
  return sum / array.length;
}

function testPerformance(lib, [fn, arg], iterations) {
  let measurements = [];
  let thrownError = null;
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      fn(i, lib, arg);
    } catch (error) {
      thrownError = error;
      break;
    }
    const end = performance.now();
    measurements.push(end - start);
  }
  return { result: average(measurements).toFixed(8), thrownError };
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
    })(),
    (async () => ({
      name: 'bson-ext',
      lib: await import('../../node_modules/bson_ext/lib/index.js'),
      version: (await readJSONFile('../../node_modules/bson_ext/package.json')).version
    }))()
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

  console.log(`\ntesting: ${name}`);

  for (const bson of BSONLibs) {
    const { result: perf, thrownError } = testPerformance(bson, [run, setupResult], iterations);
    if (thrownError != null) {
      console.log(
        `${bson.name.padEnd(14, ' ')} - v ${bson.version.padEnd(8, ' ')} - error ${thrownError}`
      );
    } else {
      console.log(
        `${bson.name.padEnd(14, ' ')} - v ${bson.version.padEnd(8, ' ')} - avg ${perf}ms`
      );
    }
  }

  console.log();
}
