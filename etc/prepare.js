#! /usr/bin/env node
var cp = require('child_process');
var fs = require('fs');

if (fs.existsSync('src')) {
  cp.spawn('npm', ['run', 'build'], { stdio: 'inherit' });
} else {
  if (!fs.existsSync('lib')) {
    console.warn('BSON: No compiled javascript present, the library is not installed correctly.');
  }
}
