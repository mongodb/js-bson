const { rules } = require('../index');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2020 } });

ruleTester.run('no-bigint-literals', rules['no-bigint-literals'], {
  valid: [{
    name: 'Accepts calls to BigInt constructor',
    code: 'let bigint = BigInt(10);'
  }],
  invalid: [{
    name: 'Rejects use of bigint literals',
    code: 'let bigint = 10n;',
    errors: 1
  }],
});
