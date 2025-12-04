import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow unused variables with underscore prefix
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      // Allow explicit any in some cases (reduce from error to warn)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable react-refresh for component exports (common pattern)
      'react-refresh/only-export-components': 'off',
      // Disable triple slash reference (needed for type declarations)
      '@typescript-eslint/triple-slash-reference': 'off',
      // Warn instead of error for non-null assertions on optional chains
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
    },
  },
])
