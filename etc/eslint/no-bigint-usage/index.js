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

function noCallsToBigIntMethods(context) {
  return {
    CallExpression(node) {
      if (node.callee.type === 'Identifier' && node.callee.name === 'BigInt') {
        context.report({
          node,
          message: 'Calls to BigInt not allowed'
        });
      } else if (node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier'
        && node.callee.object.name === 'BigInt'
      ) {
        context.report({
          node,
          message: 'Calls to BigInt static methods not allowed'
        });
      }
    }
  };
}

module.exports = {
  rules: {
    'no-bigint-literals': { create: noBigIntLiterals },
    'no-calls-to-BigInt-methods': { create: noCallsToBigIntMethods }
  }
}
