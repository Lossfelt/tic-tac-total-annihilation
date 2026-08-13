// ESLint flat config. Erstatter .eslintrc.json og .eslintignore, som ikke
// leses av ESLint 9 og nyere.
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
  {
    // Tilsvarer den gamle .eslintignore.
    ignores: ['node_modules/**', 'dist/**'],
  },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  // Prettier sist, slik at den slår av formateringsregler fra configene over.
  prettier,
  {
    // Uten .jsx her hopper `eslint src` stille over alle JSX-filene, og
    // rapporterer grønt uten å ha sett på dem.
    files: ['**/*.{js,mjs,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'prettier/prettier': 'error',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
];
