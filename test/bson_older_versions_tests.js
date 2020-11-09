'use strict';

const newBSON = require('./register-bson');
const fs = require('fs');
const fetch = require('node-fetch').default;
const rimraf = require('rimraf');
const cp = require('child_process');

const OLD_VERSIONS = ['v1.1.5', 'v1.1.4'];
const getZipUrl = ver => `https://github.com/mongodb/js-bson/archive/${ver}.zip`;
const getImportPath = ver => `../bson-${ver}/js-bson-${ver.substring(1)}`;

function downloadZip(version, done) {
  fetch(getZipUrl(version))
    .then(r => {
      return r.arrayBuffer();
    })
    .then(r => {
      fs.writeFileSync(`bson-${version}.zip`, new Uint8Array(r));
      try {
        cp.execSync(`unzip bson-${version}.zip -d bson-${version}`);
      } catch (err) {
        return done(err);
      }
      done();
    });
}

describe('Current version', function () {
  OLD_VERSIONS.forEach(version => {
    before(function (done) {
      if (Number(process.version.split('.')[0].substring(1)) < 8) {
        this.skip();
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

    it(`serializes correctly against ${version} Binary class`, function () {
      const oldBSON = require(getImportPath(version));
      const binFromNew = {
        binary: new newBSON.Binary('aaaa')
      };
      const binFromOld = {
        binary: new oldBSON.Binary('aaaa')
      };
      expect(oldBSON.prototype.serialize(binFromNew).toString('hex')).to.equal(
        newBSON.serialize(binFromOld).toString('hex')
      );
    });
  });
});
