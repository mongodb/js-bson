module.exports = {
  rules: {
    "no-bigint-literals": {
      create: function(context) {
        return {
          Literal(node) {
            if (node.bigint && /n$/.test(node.raw)) {
              context.report(
                {
                  node,
                  message: "BigInt literals not allowed"
                }
              )
            }
          }
        }
      }
    }
  }
}
