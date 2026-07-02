'use strict';
const fs = require('fs');
const { join } = require('path');
const benchmark = require('benchmark');

const stableRegionMean = 42.82;
const taskSize = 3.1401000000000003 / stableRegionMean; // ~3MB worth of work scaled down by the mean of the current stable region in CI to bring this value to roughly 1

function sieveOfEratosthenes(n) {
  // Create a boolean array "prime[0..n]" and initialize
  // all entries as true. A value in prime[i] will
  // become false if i is Not a prime
  const prime = Array.from({ length: n + 1 }, () => true);

  // We know 0 and 1 are not prime
  prime[0] = false;
  prime[1] = false;

  for (let p = 2; p * p <= n; p++) {
    // If prime[p] is not changed, then it is a prime
    if (prime[p] === true) {
      // Update all multiples of p as false
      for (let i = p * p; i <= n; i += p) {
        prime[i] = false;
      }
    }
  }

  // Collecting all prime numbers
  const primes = [];
  for (let i = 2; i <= n; i++) {
    if (prime[i] === true) {
      primes.push(i);
    }
  }

  return primes;
}

new benchmark.Suite()
  .add('cpuBaseline', function () {
    sieveOfEratosthenes(1_000_000);
  })
  .on('complete', function () {
    const data = {};
    for (const b of Array.from(this)) {
      if (b.name !== 'cpuBaseline') continue;
      data.name = b.name;
      data.stats = b.stats;
      data.times = b.times;
      data.hz = b.hz;
      data.count = b.count;
      data.cycles = b.cycles;
      data.megabytes_per_second = taskSize / b.stats.mean;
    }

    console.log(data);
    const path = join(__dirname, 'cpuBaseline.json');
    fs.writeFileSync(path, JSON.stringify(data));

    console.log('Wrote to ', path);
  })
  .run();
