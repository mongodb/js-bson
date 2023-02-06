const { rules } = require('../index');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2020 } });

ruleTester.run('no-calls-to-BigInt-methods', rules['no-calls-to-BigInt-methods'], {
  valid: [
    {
      name: 'Accepts calls to non-top-level BigInt modules',
      code: 'custom.BigInt(10);'
    },
  ],
  invalid: [
    {
      name: 'Rejects use of BigInt constructor',
      code: 'let x = BigInt(10)',
      errors: 1
    },
    {
      name: 'Rejects calls BigInt static methods',
      code: `
      let x = BigInt.asIntN(64, 10n);
      x = BigInt.asUintN(64, 10n);
      x = BigInt.toString(10n);
      x = BigInt.valueOf(10n);
      x = BigInt.whatever();
      `,
      errors: 5
    }
  ]
});
