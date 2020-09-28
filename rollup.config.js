import { getBabelOutputPlugin } from '@rollup/plugin-babel';
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const nodePolyfills = require('rollup-plugin-node-polyfills');
import typescript from '@rollup/plugin-typescript';

// Entry point of the library
const input = './src/bson.ts';

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
      typescript({ tsconfig: './tsconfig.rollup.json' }),
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
      typescript({ tsconfig: './tsconfig.rollup.json' }),
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
    // Notice the external buffer, and preferBuiltins false,
    // this bundle doesn't pull in 'buffer' or Map from 'core-js'
    external: ['buffer'],
    plugins: [
      typescript({ tsconfig: './tsconfig.rollup.json' }),
      nodeResolve({ preferBuiltins: true }),
      commonjs()
    ]
  }
];
