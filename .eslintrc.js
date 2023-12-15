module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
    es2020: true,
    es2021: true,
    es2022: true,
  },
  plugins: [
    'react',
    'jsx-a11y',
    '@typescript-eslint',
  ],
  root: true,
  parser: '@typescript-eslint/parser',
  'extends': [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic',
    'plugin:jsx-a11y/recommended',
  ],
  settings: {
    'react': {
      'version': 'detect',
    },
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      'jsx': true,
    },
  },
  rules: {
    'logical-assignment-operators': 2,
    'no-new-func': 2,
    'no-new-object': 2,
    'no-new-wrappers': 2,
    'no-var': 2,
    'prefer-const': 2,
    'no-misleading-character-class': 2,
    'no-template-curly-in-string': 2,
    'require-atomic-updates': 2,
    'curly': 2,
    'linebreak-style': 0,
    'indent': [
      2,
      2,
      {
        SwitchCase: 1,
      },
    ],
    'semi': [
      2,
      'always',
    ],
    'no-console': 0,
    'no-unused-vars': [
      1,
      {
        varsIgnorePattern: '^_',
      },
    ],
    'no-redeclare': 1,
    'no-unreachable': 1,
    'no-inner-declarations': 0,
    'no-unneeded-ternary': 2,
    'comma-dangle': [
      1,
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'never',
        exports: 'never',
        functions: 'never',
      },
    ],
    'eqeqeq': 2,
    'dot-notation': 2,
    'no-else-return': 2,
    'no-extra-bind': 2,
    'no-labels': 2,
    'no-floating-decimal': 2,
    'no-lone-blocks': 2,
    'no-loop-func': 2,
    'no-magic-numbers': 0,
    'no-multi-spaces': 2,
    'no-param-reassign': 2,
    'quotes': [
      1,
      'single',
    ],
    'jsx-quotes': [
      1,
      'prefer-single',
    ],
    'quote-props': [
      1,
      'as-needed',
      {
        keywords: true,
        unnecessary: true,
        numbers: false,
      },
    ],
    'no-empty': [
      2,
      {
        allowEmptyCatch: true,
      },
    ],
    'arrow-spacing': [
      2,
      {
        before: true,
        after: true,
      },
    ],
    'prefer-arrow-callback': 2,
    'prefer-spread': 2,
    'prefer-template': 2,
    'prefer-rest-params': 2,
    'prefer-exponentiation-operator': 2,
    'require-await': 2,
    'arrow-parens': 2,
    'no-use-before-define': 2,
    'prefer-destructuring': 2,
    'react/jsx-indent': [2, 2],
    'react/jsx-indent-props': [2, 2],
    'react/jsx-max-props-per-line': [
      2,
      {
        maximum: 1,
        when: 'multiline',
      },
    ],
    'react/jsx-closing-bracket-location': 2,
    'react/self-closing-comp': 2,
    'react/jsx-boolean-value': 2,
    'react/jsx-fragments': 2,
    'react/no-unused-state': 2,
    'react/no-arrow-function-lifecycle': 2,
    'react/jsx-no-useless-fragment': 2,
    'react/jsx-no-target-blank': 2,
    'react/jsx-tag-spacing': 2,
    'react/prop-types': 0,
    'jsx-a11y/click-events-have-key-events': 0,
    'jsx-a11y/no-noninteractive-element-interactions': 0,
    'jsx-a11y/no-static-element-interactions': 0,
  },
  overrides: [
    {
      files: '*.{js,cjs,mjs}',
      rules: {
        '@typescript-eslint/no-var-requires': 0,
        'quote-props': 0,
      },
    },
  ],
};