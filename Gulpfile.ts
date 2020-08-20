import { spawnSync } from 'child_process';
import * as gulp from 'gulp';
import * as ts from 'gulp-typescript';

import tsConfig = require('./tsconfig.json');
const run = (cmd: string) => {
  const [program, ...args] = cmd.split(' ');
  return spawnSync(program, args, { stdio: 'inherit' });
};

gulp.task('api-extractor', done => {
  run('npx api-extractor run --local');
  run('npx rimraf lib/*.d.ts lib/**/*.d.ts');
  done();
});

gulp.task('compile', () => {
  return gulp.src('./src/**/*.ts').pipe(ts(tsConfig.compilerOptions)).pipe(gulp.dest('./lib'));
});

gulp.task('bundle', done => {
  run('rollup -c rollup.config.ts');
  done();
});

gulp.task('definition', gulp.series('compile', 'api-extractor'));
gulp.task('default', gulp.series('compile', 'bundle', 'api-extractor'));
