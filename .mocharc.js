'use strict';


const nodeOptions = ["experimental-vm-modules"];
const [major, _minor, _patch] = process.versions.node.split('.');
if (Number(major) >= 23) {
  nodeOptions.push('no-experimental-strip-types');
}

module.exports =
{
  $schema: "https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/mocharc.json",
  require: [
    "source-map-support/register",
    "ts-node/register"
  ],
  extension: [
    "js",
    "ts"
  ],
  recursive: true,
  timeout: 10000,
  failZero: true,
  sort: true,
  color: true,
  "node-option": nodeOptions
}
