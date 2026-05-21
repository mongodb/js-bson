import * as child_process from 'node:child_process';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { promisify } from 'node:util';
import { expect } from 'chai';

describe('snapshot support', () => {
  let tmpdir: string;

  beforeEach(async () => {
    tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'js-bson-snapshot-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpdir, { recursive: true, force: true });
  });

  // Regression test for https://jira.mongodb.org/browse/MONGOSH-3277
  it('should reset relevant state when using startup snapshot', async () => {
    // Build a startup snapshot including the BSON library and an example ObjectId
    const bsonBundleSource = path.join(__dirname, '..', '..', 'lib', 'bson.bundle.js');
    await fs.writeFile(
      path.join(tmpdir, 'snapshot_main.cjs'),
      `
    ${await fs.readFile(bsonBundleSource, 'utf8')}
    const { startupSnapshot } = require('v8');
    globalThis.pid = new BSON.ObjectId();
    startupSnapshot.setDeserializeMainFunction(() => {
      console.log(globalThis.pid.toHexString());
      console.log(new BSON.ObjectId().toHexString());
    });
    `
    );
    await promisify(child_process.execFile)(
      process.execPath,
      ['--snapshot-blob', 'snapshot.blob', '--build-snapshot', 'snapshot_main.cjs'],
      {
        cwd: tmpdir,
        encoding: 'utf8'
      }
    );

    // Run the resulting snapshot twice to compare
    const stdout1 = (
      await promisify(child_process.execFile)(
        process.execPath,
        ['--snapshot-blob', 'snapshot.blob'],
        {
          cwd: tmpdir,
          encoding: 'utf8'
        }
      )
    ).stdout
      .trim()
      .split('\n');
    const stdout2 = (
      await promisify(child_process.execFile)(
        process.execPath,
        ['--snapshot-blob', 'snapshot.blob'],
        {
          cwd: tmpdir,
          encoding: 'utf8'
        }
      )
    ).stdout
      .trim()
      .split('\n');

    // Each process should print two values
    expect(stdout1).to.have.lengthOf(2);
    expect(stdout2).to.have.lengthOf(2);

    // The in-snapshot ObjectId is persisted
    expect(stdout1[0]).to.equal(stdout2[0]);

    // We get different per-process values (counter and process unique)
    // created after deserialization
    const [oid1, oid2] = [stdout1[1], stdout2[1]].map(
      oid => oid.match(/^(?<ts>\w{8})(?<uniq>\w{10})(?<counter>\w{6})$/)!.groups!
    );

    // Less than 20 seconds between timestamps should be plenty of leeway
    expect(Math.abs(parseInt(oid2.ts, 16) - parseInt(oid1.ts, 16))).to.be.lessThan(20);
    // Distinct process unique values
    expect(oid1.uniq).to.not.equal(oid2.uniq);
    // Distinct counter values
    expect(oid1.counter).to.not.equal(oid2.counter);
  });
});
