import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

/** @type {typescript.RollupTypescriptOptions} */
const tsConfig = {
  allowJs: false,
  checkJs: false,
  strict: true,
  alwaysStrict: true,
  target: 'es2020',
  module: 'esnext',
  moduleResolution: 'node',
  removeComments: true,
  lib: ['es2020'],
  importHelpers: false,
  noEmitHelpers: false,
  noEmitOnError: true,
  // make use of import type where applicable
  importsNotUsedAsValues: 'error',
  // Generate separate source maps files with sourceContent included
  sourceMap: true,
  inlineSourceMap: false,
  inlineSources: false,
  // API-extractor makes use of the declarations, npm script should be cleaning these up
  declaration: false,
  types: [],
  tsconfig: false,
  include: ['src/**/*']
};
const input = 'src/index.ts';

/** @type {import('rollup').RollupOptions} */
const config = [
  {
    input,
    plugins: [typescript(tsConfig), nodeResolve({ resolveOnly: [] })],
    output: [
      {
        file: 'lib/bson.cjs',
        format: 'commonjs',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'lib/bson.bundle.js',
        format: 'iife',
        name: 'BSON',
        exports: 'named',
        indent: false,
        sourcemap: true
      }
    ]
  },
  {
    input,
    plugins: [typescript(tsConfig), nodeResolve({ resolveOnly: [] })],
    output: {
      file: 'lib/bson.mjs',
      format: 'esm',
      sourcemap: true
    }
  }
];

export default config;
