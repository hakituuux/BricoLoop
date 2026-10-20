import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    ignores: ['client/**', 'node_modules/**', 'dist/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    // fichiers React : JSX + globals navigateur (document, window, fetch...)
    files: ['src/**/*.jsx'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
  },
];
