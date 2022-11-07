import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import { readFile } from 'fs/promises';

const pkg = JSON.parse(await readFile('./package.json', { encoding: 'utf8' }));

const tsConfig = {
  allowJs: false,
  checkJs: false,
  strict: true,
  alwaysStrict: true,
  target: 'es5',
  module: 'esnext',
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

const plugins = (options = { browser: false }) => {
  return [
    typescript(tsConfig),
    nodeResolve({ preferBuiltins: false }),
    replace({
      preventAssignment: true,
      values: {
        'process.browser': options.browser
      }
    }),
    commonjs({ extensions: ['.js', '.ts'] }),
    babel({
      babelHelpers: 'external',
      plugins: ['@babel/plugin-external-helpers'],
      presets: [['@babel/env', { modules: false }]]
    })
  ];
};

const external = Object.keys(pkg.dependencies || {});

const defaultName = 'BSON';

export default [
  {
    input,
    output: {
      file: 'dist/bson.esm.js',
      format: 'es',
      name: defaultName,
      exports: 'named',
      sourcemap: true
    },
    plugins: plugins(),
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
    plugins: plugins({ browser: true })
  }
];
