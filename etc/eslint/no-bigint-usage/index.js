function noBigIntLiterals(context) {
  return {
    Literal(node) {
      if (node.bigint && /n$/.test(node.raw)) {
        context.report(
          {
            node,
            message: 'BigInt literals not allowed'
          }
        )
      }
    }
  };
}

module.exports = {
  rules: {
    'no-bigint-literals': { create: noBigIntLiterals }
  }
}
