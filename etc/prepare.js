#! /usr/bin/env node
var cp = require('child_process');
var fs = require('fs');

var nodeMajorVersion = +process.version.match(/^v(\d+)\.\d+/)[1];

// Point git at the checked in hooks (see .githooks/pre-commit). Not shipped to
// consumers: .githooks is excluded from the published package files.
if (fs.existsSync('.githooks')) {
  for (var hook of fs.readdirSync('.githooks')) {
    fs.chmodSync('.githooks/' + hook, 0o755);
  }
  cp.spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
}

if (fs.existsSync('src') && nodeMajorVersion >= 10) {
  cp.spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
} else {
  if (!fs.existsSync('lib')) {
    console.warn('BSON: No compiled javascript present, the library is not installed correctly.');
    if (nodeMajorVersion < 10) {
      console.warn(
        'This library can only be compiled in nodejs version 10 or later, currently running: ' +
          nodeMajorVersion
      );
    }
  }
}
