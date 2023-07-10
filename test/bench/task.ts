import { Suite } from './suite';
import { convertToPerfSendFormat } from './util';

export class Task {
  name: string;
  parent: Suite;
  data: any;
  fn: (data: any) => void;
  iterations: number;
  args?: Record<string, any>;

  constructor(
    parent: Suite,
    name: string,
    data: any,
    fn: (data: any) => void,
    iterations: number,
    args?: Record<string, any>
  ) {
    this.parent = parent;
    this.name = name;
    this.iterations = iterations;
    this.data = data;
    this.fn = fn;
    this.args = args;
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

      const bytesPerSec = this.data.byteLength / ((end - start) / 1000);
      results.push(bytesPerSec / 1024 ** 2); // MiB/s
    }
    this.parent.results.push(
      convertToPerfSendFormat(this.name, [{ name: 'megabytes_per_second', results }], this.args)
    );
  }
}
