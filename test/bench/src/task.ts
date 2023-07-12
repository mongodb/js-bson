import { type Suite } from './suite';
import { convertToPerfSendFormat } from './util';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { performance } from 'perf_hooks';

export class Task {
  name: string;
  parent: Suite;
  data: any;
  fn: (data: any) => void;
  iterations: number;
  transform?: (x: number) => number;
  resultUnit: string;
  args?: Record<string, string>;

  constructor(
    parent: Suite,
    name: string,
    data: any,
    fn: (data: any) => void,
    iterations: number,
    resultUnit?: string,
    transform?: (x: number) => number,
    args?: Record<string, string>
  ) {
    this.parent = parent;
    this.name = name;
    this.iterations = iterations;
    this.data = data;
    this.fn = fn;
    this.transform = transform;
    this.args = args;
    this.resultUnit = resultUnit ? resultUnit : 'ms';
  }

  // TODO: Ensure that each task runs on a separate node process
  run() {
    console.log(`\t ${this.name} - iters: ${this.iterations}`);
    const data = this.data;
    const fn = this.fn;
    // Warmup
    for (let i = 0; i < this.iterations; i++) {
      fn(data);
    }
    const results: number[] = [];

    for (let i = 0; i < this.iterations; i++) {
      const start = performance.now();
      fn(data);
      const end = performance.now();
      results.push(end - start); // ms
    }
    this.parent.results.push(
      convertToPerfSendFormat(
        this.name,
        [
          {
            name: this.resultUnit,
            results: this.transform ? results.map(this.transform) : results
          }
        ],
        this.args
      )
    );
  }
}
