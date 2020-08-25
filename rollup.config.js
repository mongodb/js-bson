const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');
const { readFileSync } = require('fs');
const JSON5 = require('json5');
const { terser } = require('rollup-plugin-terser');

// TSConfig has comments so we need a json5 parser
const { compilerOptions, include } = JSON5.parse(
  readFileSync('./tsconfig.json', { encoding: 'utf8' })
);

// Modify ts config options for use with rollup
// remove all settings relating to declarations
delete compilerOptions.declarationDir;
delete compilerOptions.emitDeclarationOnly;
delete compilerOptions.outDir;

const allTSSettings = {
  ...compilerOptions,
  sourceMap: false,
  inlineSourceMap: false,
  inlineSources: false,
  declarationMap: false,
  declaration: false,
  // rollup understands esm modules
  module: 'esnext',
  // old browsers
  target: 'es3',
  tsconfig: false,
  include
};

// Entry point of the library
const input = './src/bson.ts';

module.exports = [
  {
    input,
    output: [
      /* Browser ESM bundle */
      {
        sourcemap: false,
        sourcemapExcludeSources: false,
        file: 'dist/bson.browser.esm.js',
        format: 'es'
      },
      /* Browser UMD bundle */
      {
        sourcemap: false,
        sourcemapExcludeSources: false,
        file: 'dist/bson.browser.umd.js',
        format: 'umd',
        name: 'BSON'
      },
      /* Browser IIFE bundle */
      {
        sourcemap: false,
        sourcemapExcludeSources: false,
        file: 'dist/bson.bundle.js',
        format: 'iife',
        name: 'BSON'
      }
    ],
    plugins: [
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
      typescript(allTSSettings),
      terser()
    ]
  },
  /* ESM bundle with externals */
  {
    input,
    output: {
      sourcemap: false,
      sourcemapExcludeSources: false,
      file: 'dist/bson.esm.js',
      format: 'es'
    },
    // Notice the external buffer, and preferBuiltins false,
    // this bundle doesn't pull in 'buffer' or Map from 'core-js'
    external(id) {
      return id === 'buffer' || id.includes('core-js');
    },
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      commonjs(),
      typescript(allTSSettings),
      terser()
    ]
  }
];
