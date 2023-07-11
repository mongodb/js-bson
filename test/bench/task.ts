import { Suite } from './suite';
import { convertToPerfSendFormat } from './util';
import { performance } from 'perf_hooks';

export class Task {
  name: string;
  parent: Suite;
  data: any;
  fn: (data: any) => void;
  iterations: number;
  transform?: (x: number) => number;
  resultUnit: string;
  args?: Record<string, any>;

  constructor(
    parent: Suite,
    name: string,
    data: any,
    fn: (data: any) => void,
    iterations: number,
    resultUnit?: string,
    transform?: (x: number) => number,
    args?: Record<string, any>
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

  run() {
    console.log(`\t ${this.name}`);
    // Warmup
    for (let i = 0; i < this.iterations; i++) {
      this.fn(this.data);
    }
    const results: number[] = [];

    for (let i = 0; i < this.iterations; i++) {
      const start = performance.now();
      this.fn(this.data);
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
