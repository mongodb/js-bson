'use strict';

const commonjs = require('rollup-plugin-commonjs');
const nodeGlobals = require('rollup-plugin-node-globals');
const nodeBuiltins = require('rollup-plugin-node-builtins');
const nodeResolve = require('rollup-plugin-node-resolve');
const jsonPlugin = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');
const path = require('path');
const fs = require('fs');
// const dataToEsm = require('rollup-pluginutils').dataToEsm;
// const bsonCorpusPlugin = require('./tools/bson_corpus_plugin');

const scenariosPlugin = options => { // eslint-disable-line
  return {
    name: 'scenarios',
    transform(json, id) {
      if (id.slice(-9) === 'scenarios') {
        const filepath = './test/node/specs/bson-corpus';
        const scenarios = fs
          .readdirSync(path.join(__dirname, filepath))
          .filter(x => x.indexOf('json') !== -1)
          .map(x => JSON.parse(fs.readFileSync(path.join(__dirname, filepath, x), 'utf8')));
        // if (Object.prototype.toString.call(scenarios) !== '[object Object]') {
        //   return { code: `export default ${json};\n`, map: { mappings: '' } };
        // }
        return {
          code: scenarios,
          map: { mappings: '' }
        };
      }
    }
  };
};

module.exports = {
  input: 'index.js',
  output: {
    file: 'dist/bson.js',
    format: 'umd',
    name: 'bson'
  },
  plugins: [
    scenariosPlugin(),
    jsonPlugin(),
    nodeBuiltins(),
    nodeResolve(),
    commonjs(),
    nodeGlobals(),
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
