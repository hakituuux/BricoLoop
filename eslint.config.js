import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    ignores: ['client/**', 'node_modules/**', 'dist/**'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
]
