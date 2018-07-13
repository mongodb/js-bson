'use strict';

const commonjs = require('rollup-plugin-commonjs');
const nodeBuiltins = require('rollup-plugin-node-builtins');
const nodeResolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');

module.exports = {
  input: 'index.js',
  output: {
    file: 'dist/bson.js',
    format: 'umd',
    name: 'bson'
  },
  plugins: [
    nodeBuiltins(),
    nodeResolve(),
    commonjs(),
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
  ]
};
