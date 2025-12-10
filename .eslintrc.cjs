module.exports = {
  env: {
    browser: true,
    node: true,
    es2024: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
  },
};
