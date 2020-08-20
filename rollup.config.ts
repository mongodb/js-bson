import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import sucrase from '@rollup/plugin-sucrase';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import pkg from './package.json';

const input = 'src/bson.ts';

function listPlugins(browser = false, morePlugins = []) {
  return [
    ...morePlugins,
    resolve({
      extensions: ['.js', '.ts'],
      browser,
      preferBuiltins: !browser
    }),
    sucrase({
      exclude: ['node_modules/**'],
      transforms: ['typescript']
    }),
    globals(),
    builtins(),
    commonjs()
  ];
}

export default [
  {
    input,
    output: {
      file: 'dist/bundle.js',
      format: 'cjs'
    },
    external: Object.keys(pkg.dependencies || {}),
    plugins: listPlugins()
  },
  {
    input,
    output: {
      file: 'dist/bson.esm.js',
      format: 'es',
      exports: 'named'
    },
    external: Object.keys(pkg.dependencies || {}),
    plugins: listPlugins()
  },
  {
    input,
    output: {
      file: 'dist/bson.browser.esm.js',
      format: 'es',
      exports: 'named'
    },
    external: Object.keys(pkg.dependencies || {}),
    plugins: listPlugins(true)
  },
  {
    input,
    output: {
      file: 'dist/bson.umd.js',
      format: 'esm',
      name: 'BSON',
      exports: 'named',
      globals: {
        buffer: 'Buffer'
      }
    },
    external: Object.keys(pkg.dependencies || {}),
    plugins: listPlugins(true, [
      getBabelOutputPlugin({
        // babelHelpers: 'runtime',
        presets: [['@babel/preset-env', { modules: 'umd' }]],
        plugins: ['@babel/plugin-transform-modules-umd']
      })
    ])
  },
  {
    input,
    output: {
      file: 'dist/bson.bundle.js',
      format: 'iife',
      exports: 'named',
      name: 'BSON'
    },
    external: Object.keys(pkg.dependencies || {}),
    plugins: listPlugins(true)
  }
];
