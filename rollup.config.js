import babel from '@rollup/plugin-babel';
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const nodePolyfills = require('rollup-plugin-node-polyfills');

// Entry point of the library
const input = './lib/bson.js';

export default [
  {
    input,
    output: [
      /* Browser ESM bundle */
      {
        file: 'dist/bson.browser.esm.js',
        format: 'es'
      },
      /* Browser UMD bundle */
      {
        file: 'dist/bson.browser.umd.js',
        format: 'umd',
        name: 'BSON'
      },
      /* Browser IIFE bundle */
      {
        file: 'dist/bson.bundle.js',
        format: 'iife',
        name: 'BSON'
      }
    ],

    plugins: [
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
      nodePolyfills({ include: ['buffer'] }),
      babel({
        babelHelpers: 'bundled',
        presets: [
          [
            '@babel/env',
            {
              modules: false
            }
          ]
        ]
      })
    ]
  },
  /* ESM bundle with externals */
  {
    input,
    output: {
      file: 'dist/bson.esm.js',
      format: 'es'
    },
    // Notice the external buffer, and preferBuiltins false,
    // this bundle doesn't pull in 'buffer' or Map from 'core-js'
    external: ['buffer'],
    plugins: [nodeResolve({ preferBuiltins: true }), commonjs()]
  }
];
