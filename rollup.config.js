import pkg from './package.json';
import commonjs from 'rollup-plugin-commonjs';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const input = 'index.js';
const plugins = [
  nodeResolve(),
  commonjs(),
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
const browserPlugins = [
  nodeResolve({
    browser: true,
    preferBuiltins: false
  }),
  commonjs(),
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
const defaultName = 'BSON';

export default [
  {
    input,
    output: {
      file: 'dist/bson.esm.js',
      format: 'es',
      name: defaultName,
      exports: 'default'
    },
    plugins,
    external
  },
  {
    input,
    output: {
      file: 'dist/bson.browser.umd.js',
      format: 'umd',
      name: defaultName,
      exports: 'default',
      globals: {
        buffer: 'Buffer'
      }
    },
    plugins: browserPlugins,
    external
  },
  {
    input,
    output: {
      file: 'dist/bson.browser.esm.js',
      format: 'es',
      name: defaultName,
      exports: 'default'
    },
    plugins: browserPlugins,
    external
  },
  {
    input,
    output: {
      file: 'dist/bson.bundle.js',
      format: 'iife',
      name: defaultName,
      exports: 'default'
    },
    plugins: browserPlugins
  }
];
