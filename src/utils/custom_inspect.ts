function getSymbol() {
  if ('Deno' in globalThis) {
    // Deno
    return Symbol.for('Deno.customInspect');
  }

  // Node.js as Default
  return Symbol.for('nodejs.util.inspect.custom');
}

/** @internal */
export const kInspect = getSymbol();
