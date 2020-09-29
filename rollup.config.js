import { getBabelOutputPlugin } from '@rollup/plugin-babel';
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const nodePolyfills = require('rollup-plugin-node-polyfills');
import typescript from '@rollup/plugin-typescript';

// Entry point of the library
const input = './src/bson.ts';

const tsConfig = {
  allowJs: false,
  checkJs: false,
  strict: true,
  alwaysStrict: true,
  target: 'ES2017',
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

export default [
  {
    input,
    /* Browser ESM bundle */
    output: {
      file: 'dist/bson.browser.esm.js',
      format: 'esm',
      exports: 'named',
      sourcemap: true
    },
    plugins: [
      typescript(tsConfig),
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
      nodePolyfills(),
      getBabelOutputPlugin({
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              targets: { ie: 8, node: 6 }
            }
          ]
        ]
      })
    ]
  },
  {
    input,
    output: [
      /* Browser UMD bundle */
      {
        file: 'dist/bson.browser.umd.js',
        format: 'esm',
        name: 'BSON',
        sourcemap: true
      },
      /* Browser IIFE bundle */ {
        file: 'dist/bson.bundle.js',
        format: 'esm',
        name: 'BSON',
        sourcemap: true
      }
    ],
    plugins: [
      typescript(tsConfig),
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
      nodePolyfills(),
      getBabelOutputPlugin({
        allowAllFormats: true,
        moduleId: 'BSON', // names the IIFE/UMD module
        // babelHelpers: 'bundled',
        presets: [
          [
            '@babel/preset-env',
            {
              modules: 'umd',
              targets: { ie: 8, node: 6 }
            }
          ]
        ]
      })
    ]
  },
  /* ESM bundle with externals */
  {
    input,
    output: [
      {
        file: 'dist/bson.esm.js',
        format: 'esm',
        exports: 'named',
        sourcemap: true
      }
    ],
    external: ['buffer'], // don't bundle 'buffer'
    plugins: [typescript(tsConfig), nodeResolve({ preferBuiltins: true }), commonjs()]
  }
];
