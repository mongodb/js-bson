'use strict';

const pkg = require('./package.json');
const commonjs = require('rollup-plugin-commonjs');
const nodeBuiltins = require('rollup-plugin-node-builtins');
const nodeResolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');

const input = 'index.js';
const plugins = [
  nodeResolve(),
  commonjs(),
  nodeBuiltins(),
  babel({
    plugins: ['external-helpers'],
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
    plugins: ['external-helpers'],
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

module.exports = [
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
