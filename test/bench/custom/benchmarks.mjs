/* eslint-disable strict */
import { BSON } from '../../../lib/bson.mjs';

const ObjectId_isValid = {
  name: 'ObjectId_isValid',
  tags: ['alerting-benchmark', 'objectid'],
  benchmarks: [
    function objectid_isvalid_wrong_string_length() {
      BSON.ObjectId.isValid('a');
    },
    /** wrong character at the start, could be the most short circuited code path */
    function objectid_isvalid_invalid_hex_at_start() {
      BSON.ObjectId.isValid('g6e84ebdc96f4c0772f0cbbf');
    },
    /** wrong character at the end, could be the least short circuited code path */
    function objectid_isvalid_invalid_hex_at_end() {
      BSON.ObjectId.isValid('66e84ebdc96f4c0772f0cbbg');
    },
    function objectid_isvalid_valid_hex_string() {
      BSON.ObjectId.isValid('66e84ebdc96f4c0772f0cbbf');
    }
  ]
};

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
const CPUBaseline = {
  name: 'CPUBaseline',
  tags: [],
  benchmarks: [
    function cpuBaseline() {
      sieveOfEratosthenes(1_000_000);
    }
  ]
};

// Add benchmarks here:
export const suites = [ObjectId_isValid, CPUBaseline];
