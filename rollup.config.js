import pkg from './package.json';
import commonjs from 'rollup-plugin-commonjs';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import nodeGlobals from 'rollup-plugin-node-globals';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const input = 'index.js';
const plugins = [
  nodeResolve(),
  commonjs(),
  nodeGlobals(),
  nodeBuiltins(),
  babel({
    plugins: [ 'external-helpers' ],
    presets: [
      [
        'env',
        {
          modules: false
        }
      ]
    ]
  })
];
const external = Object.keys(pkg.dependencies || {});
const defaultName = 'bson';

export default [
  {
    input,
    output: {
      file: 'dist/bson.esm.js',
      format: 'es',
      name: defaultName,
      exports: 'named'
    },
    plugins,
    external
  },
  {
    input,
    output: {
      file: 'dist/bson.umd.js',
      format: 'umd',
      name: defaultName,
      exports: 'named',
      globals: {
        bson: 'BSON'
      }
    },
    plugins,
    external
  },
  {
    input,
    output: {
      file: 'dist/bson.browser.js',
      format: 'iife',
      name: defaultName,
      exports: 'named'
    },
    plugins
  }
];
