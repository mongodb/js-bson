const pkg = require('./package.json');
const commonjs = require('rollup-plugin-commonjs');
const nodeBuiltins = require('rollup-plugin-node-builtins');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { babel } = require('@rollup/plugin-babel');
const typescript = require('@rollup/plugin-typescript');

const tsConfig = {
  allowJs: false,
  checkJs: false,
  strict: true,
  alwaysStrict: true,
  target: 'ES2017',
  module: 'commonjs',
  moduleResolution: 'node',
  lib: ['ES2017', 'ES2020.BigInt', 'ES2017.TypedArrays'],
  // We don't make use of tslib helpers
  importHelpers: true,
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
const input = 'src/bson.ts';

const plugins = [
  typescript(tsConfig),
  nodeResolve({ preferBuiltins: false }),
  commonjs({ extensions: ['.js', '.ts'] }),
  nodeBuiltins(),
  babel({
    babelHelpers: 'external',
    plugins: ['@babel/plugin-external-helpers'],
    presets: [['@babel/env', { modules: false }]]
  })
];

const external = Object.keys(pkg.dependencies || {});

const defaultName = 'BSON';

module.exports = [
  {
    input,
    output: {
      file: 'dist/bson.esm.js',
      format: 'es',
      name: defaultName,
      exports: 'named',
      sourcemap: true
    },
    plugins,
    external
  },
  {
    input,
    output: [
      {
        file: 'dist/bson.browser.umd.js',
        format: 'umd',
        name: defaultName,
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/bson.browser.esm.js',
        format: 'es',
        name: defaultName,
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/bson.bundle.js',
        format: 'iife',
        name: defaultName,
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins
  }
];
