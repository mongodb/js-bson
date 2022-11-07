'use strict';

const currentNodeBSON = require('../register-bson');
const vm = require('vm');
const fs = require('fs');
const rimraf = require('rimraf');
const cp = require('child_process');
const { __isWeb__ } = require('../register-bson');

// node-fetch is an es-module
let fetch;

/*
 * This file tests that previous versions of BSON
 * serialize and deserialize correctly in the most recent version of BSON,
 * and that the different distributions (browser, Node.js, etc.) of the
 * most recent version are mutually compatible as well.
 *
 * This is an unusual situation to run into as users should be using one BSON lib version
 * but it does arise with sub deps etc. and we wish to protect against unexpected behavior
 *
 * If backwards compatibility breaks there should be clear warnings/failures
 * rather than empty or zero-ed values.
 */
const OLD_VERSIONS = ['v1.1.5', 'v1.1.4'];
const getZipUrl = ver => `https://github.com/mongodb/js-bson/archive/${ver}.zip`;
const getImportPath = ver => `../../bson-${ver}/js-bson-${ver.substring(1)}`;

function downloadZip(version, done) {
  // downloads a zip of previous BSON version
  fetch(getZipUrl(version))
    .then(r => {
      return r.arrayBuffer();
    })
    .then(r => {
      fs.writeFileSync(`bson-${version}.zip`, new Uint8Array(r));
      try {
        // unzips the code, right now these test won't handle versions written in TS
        cp.execSync(`unzip bson-${version}.zip -d bson-${version}`);
      } catch (err) {
        return done(err);
      }
      done();
    });
}

describe('Mutual version and distribution compatibility', function () {
  before(function () {
    if (__isWeb__) this.skip();
  });

  before(async () => {
    fetch = await import('node-fetch').then(mod => mod.default);
  });

  OLD_VERSIONS.forEach(version => {
    before(function (done) {
      this.timeout(30000); // Downloading may take a few seconds.
      if (Number(process.version.split('.')[0].substring(1)) < 8) {
        // WHATWG fetch doesn't download correctly prior to node 8
        // but we should be safe by testing on node 8 +
        return done();
      }
      if (fs.existsSync(`bson-${version}.zip`)) {
        fs.unlinkSync(`bson-${version}.zip`);
        rimraf(`./bson-${version}`, err => {
          if (err) done(err);

          // download old versions
          downloadZip(version, done);
        });
      } else {
        // download old versions
        downloadZip(version, done);
      }
    });

    after(function (done) {
      try {
        fs.unlinkSync(`bson-${version}.zip`);
      } catch (e) {
        // ignore
      }
      rimraf(`./bson-${version}`, err => {
        if (err) done(err);
        done();
      });
    });
  });

  // Node.js requires an .mjs filename extension for loading ES modules.
  before(() => {
    try {
      fs.writeFileSync(
        './bson.browser.esm.mjs',
        fs.readFileSync(__dirname + '/../../dist/bson.browser.esm.js')
      );
      fs.writeFileSync('./bson.esm.mjs', fs.readFileSync(__dirname + '/../../dist/bson.esm.js'));
    } catch (e) {
      // bundling fails in CI on Windows, no idea why, hence also the
      // process.platform !== 'win32' check below
    }
  });

  after(() => {
    try {
      fs.unlinkSync('./bson.browser.esm.mjs');
      fs.unlinkSync('./bson.esm.mjs');
    } catch (e) {
      // ignore
    }
  });

  const variants = OLD_VERSIONS.map(version => ({
    name: `legacy ${version}`,
    load: () => {
      const bson = require(getImportPath(version));
      bson.serialize = bson.prototype.serialize;
      bson.deserialize = bson.prototype.deserialize;
      return Promise.resolve(bson);
    },
    legacy: true
  })).concat([
    {
      name: 'Node.js lib/bson',
      load: () => Promise.resolve(currentNodeBSON)
    },
    {
      name: 'Browser ESM',
      // eval because import is a syntax error in earlier Node.js versions
      // that are still supported in CI
      load: () => eval(`import("${__dirname}/../../bson.browser.esm.mjs")`),
      usesBufferPolyfill: true
    },
    {
      name: 'Browser UMD',
      load: () => Promise.resolve(require('../../dist/bson.browser.umd.js')),
      usesBufferPolyfill: true
    },
    {
      name: 'Generic bundle',
      load: () => {
        const source = fs.readFileSync(__dirname + '/../../dist/bson.bundle.js', 'utf8');
        return Promise.resolve(vm.runInNewContext(`${source}; BSON`, { global, process }));
      },
      usesBufferPolyfill: true
    },
    {
      name: 'Node.js ESM',
      load: () => eval(`import("${__dirname}/../../bson.esm.mjs")`)
    }
  ]);

  const makeObjects = bson => [
    new bson.ObjectId('5f16b8bebe434dc98cdfc9ca'),
    new bson.DBRef('a', new bson.ObjectId('5f16b8bebe434dc98cdfc9cb'), 'db'),
    new bson.MinKey(),
    new bson.MaxKey(),
    new bson.Timestamp(1, 100),
    new bson.Code('abc'),
    bson.Decimal128.fromString('1'),
    bson.Long.fromString('1'),
    new bson.Binary(Buffer.from('abcäbc🎉'), 128),
    new Date('2021-05-04T15:49:33.000Z'),
    /match/
  ];

  for (const from of variants) {
    for (const to of variants) {
      describe(`serializing objects from ${from.name} using ${to.name}`, () => {
        let fromObjects;
        let fromBSON;
        let toBSON;

        before(function () {
          // Load the from/to BSON versions asynchronously because e.g. ESM
          // requires asynchronous loading.
          return Promise.resolve()
            .then(() => {
              return from.load();
            })
            .then(loaded => {
              fromBSON = loaded;
              return to.load();
            })
            .then(loaded => {
              toBSON = loaded;
            })
            .then(
              () => {
                if (from.usesBufferPolyfill || to.usesBufferPolyfill) {
                  // TODO(NODE-3555): The buffer polyfill does not correctly identify ArrayBuffers, will be fixed by removing
                  return this.skip();
                }
                fromObjects = makeObjects(fromBSON);
              },
              err => {
                if (+process.version.slice(1).split('.')[0] >= 12) {
                  throw err; // On Node.js 12+, all loading is expected to work.
                } else {
                  this.skip(); // Otherwise, e.g. ESM can't be loaded, so just skip.
                }
              }
            );
        });

        it('serializes in a compatible way', function () {
          for (const object of fromObjects) {
            // If the object in question uses Buffers in its serialization, and
            // its Buffer was created using the polyfill, and we're serializing
            // using a legacy version that uses buf.copy(), then that fails
            // because the Buffer polyfill's typechecking is buggy, so we
            // skip these cases.
            // This is tracked as https://jira.mongodb.org/browse/NODE-2848
            // and would be addressed by https://github.com/feross/buffer/pull/285
            // if that is merged at some point.
            if (from.usesBufferPolyfill || to.usesBufferPolyfill) {
              // TODO(NODE-3555): The buffer polyfill does not correctly identify ArrayBuffers, will be fixed by removing
              return this.skip();
            }
            if (
              from.usesBufferPolyfill &&
              to.legacy &&
              ['ObjectId', 'Decimal128', 'DBRef', 'Binary'].includes(object.constructor.name)
            ) {
              continue;
            }

            try {
              // Check that both BSON versions serialize to equal Buffers
              expect(toBSON.serialize({ object })).to.deep.equal(fromBSON.serialize({ object }));
              if (!from.legacy) {
                // Check that serializing using one version and deserializing using
                // the other gives back the original object.
                const cloned = fromBSON.deserialize(toBSON.serialize({ object })).object;
                expect(fromBSON.EJSON.serialize(cloned)).to.deep.equal(
                  fromBSON.EJSON.serialize(object)
                );
              }
            } catch (err) {
              // If something fails, note the object type in the error message
              // for easier debugging.
              err.message += ` (${object.constructor.name})`;
              throw err;
            }
          }
        });
      });
    }
  }
});
