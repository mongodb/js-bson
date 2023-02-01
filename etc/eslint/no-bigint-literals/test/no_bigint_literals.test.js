const { rules } = require('../index');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2020 } });

ruleTester.run("no-bigint-literals", rules['no-bigint-literals'], {
  valid: [{
    code: "let bigint = BigInt(10);"
  }],
  invalid: [{
    code: "let bigint = 10n;",
    errors: 1
  }],
});
