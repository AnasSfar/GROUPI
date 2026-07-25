// Minimal, NestJS-appropriate ESLint flat config for apps/api.
// Intentionally not overly strict: decorators, DI constructors and Prisma's
// generated types produce plenty of legitimate patterns that stricter presets
// (e.g. `recommendedTypeChecked`) would flag as errors.
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'test/**', '**/*.spec.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      sourceType: 'module',
    },
    rules: {
      // NestJS relies heavily on decorators with empty constructor bodies,
      // DTO classes with no members yet, etc.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
);
