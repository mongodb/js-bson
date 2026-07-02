'use strict';

const nodeOptions = ['experimental-vm-modules'];
const [major] = process.versions.node.split('.');
if (Number(major) >= 23) {
  nodeOptions.push('no-experimental-strip-types');
}

/** @type {import("mocha").MochaOptions} */
module.exports = {
  require: ['source-map-support/register', 'ts-node/register'],
  extension: ['js', 'ts'],
  recursive: true,
  timeout: 10000,
  failZero: true,
  sort: true,
  color: true,
  'node-option': nodeOptions
};
