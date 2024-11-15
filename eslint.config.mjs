import pluginJs from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

let env = 'unknown';
if (process.env.CI != null) {
    env = 'ci';
} else if (process.env.NX_TASK_TARGET_PROJECT != null) {
    env = 'nx-task';
}

export const testDefaults = {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/*.test.jsx'],
    languageOptions: {
        globals: {
            ...globals.jest,
        },
    },
    rules: {
        'no-console': 0,
        '@typescript-eslint/no-for-in-array': 0,
        '@typescript-eslint/no-unsafe-assignment': 0,
        '@typescript-eslint/no-unsafe-argument': 0,
        '@typescript-eslint/no-unsafe-call': 0,
        '@typescript-eslint/no-unsafe-member-access': 0,
        'sonarjs/slow-regex': 0,
        'sonarjs/no-duplicate-string': 0,
        'sonarjs/no-nested-functions': 0,
        'sonarjs/use-type-alias': 0,
        'sonarjs/pseudo-random': 0,
    },
};

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ['**/*.{js,mjs,cjs,ts}'], linterOptions: { reportUnusedDisableDirectives: 'error' } },
    {
        ignores: [
            '**/node_modules',
            '**/dist',
            '**/typings',
            '**/eslint.config.mjs',
            '**/jest.*.{cjs,js}',
            '.dependency-cruiser.js',
        ],
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                // projectService: true,
                project: './tsconfig.lint.json',
                tsconfigRootDir: process.cwd(),
            },
        },
    },
    sonarjs.configs.recommended,
    {
        files: ['**/src/**/*'],
        plugins: {
            'check-file': checkFile,
        },
        rules: {
            'check-file/folder-naming-convention': [
                'error',
                {
                    'src/**/!(__mocks__)/': 'KEBAB_CASE',
                },
            ],
        },
    },
    {
        files: ['**/*.{js,ts}'],
        rules: {
            'no-lonely-if': 2,
            'no-negated-condition': 1,
            'no-nested-ternary': 2,
            'no-unneeded-ternary': 2,
            'no-eval': 2,
            'no-console': 2,
            'no-unused-vars': 0,
            'no-case-declarations': 0,
            '@typescript-eslint/no-explicit-any': 0,
            '@typescript-eslint/consistent-type-imports': 0,
            '@typescript-eslint/no-redundant-type-constituents': 1,
            '@typescript-eslint/no-floating-promises': 2,
            '@typescript-eslint/no-implied-eval': 2,
            '@typescript-eslint/no-shadow': 2,
            '@typescript-eslint/prefer-as-const': 2,
            '@typescript-eslint/prefer-nullish-coalescing': 2,
            '@typescript-eslint/prefer-optional-chain': 2,
            '@typescript-eslint/prefer-readonly': 2,
            '@typescript-eslint/prefer-ts-expect-error': 1,
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-for-in-array': 2,
            // Show this warning in IDE and PRs, but not when running at command line (to reduce clutter).
            'sonarjs/cognitive-complexity': env !== 'nx-task' ? 1 : 0,
            'sonarjs/no-duplicate-string': env !== 'nx-task' ? 1 : 0,

            // We don't really care about these.
            '@typescript-eslint/no-base-to-string': 0,

            // For review - actual bugs?
            'sonarjs/no-inverted-boolean-check': 1,
            'sonarjs/no-misused-promises': 1,
            // For review - new for eslint 9.
            '@typescript-eslint/no-unsafe-member-access': 1,
            '@typescript-eslint/restrict-template-expressions': 1,
            '@typescript-eslint/no-unsafe-return': 1,
            '@typescript-eslint/no-unsafe-call': 1,
            '@typescript-eslint/no-unsafe-assignment': 1,
            '@typescript-eslint/no-unsafe-function-type': 1,
            '@typescript-eslint/no-unsafe-argument': 1,
            '@typescript-eslint/no-empty-object-type': 1,
            '@typescript-eslint/ban-ts-comment': 1,
            '@typescript-eslint/require-await': 1,
            '@typescript-eslint/no-this-alias': 1,
            'sonarjs/public-static-readonly': 1,
            'sonarjs/no-redeclare': 1,
            'sonarjs/new-cap': 1,
            'sonarjs/updated-loop-counter': 1,
            'sonarjs/todo-tag': 1,
            'sonarjs/function-return-type': 1,
            'sonarjs/sonar-max-params': 1,
            'sonarjs/no-redundant-type-constituents': 1,
            'sonarjs/fixme-tag': 1,
            'sonarjs/no-selector-parameter': 1,
            'sonarjs/redundant-type-aliases': 0,

            // Duplicates @typescript-eslint
            'sonarjs/sonar-no-unused-vars': 0,
            'sonarjs/no-redundant-type-constituents': 0,
            'sonarjs/sonar-prefer-optional-chain': 0,
            'sonarjs/no-base-to-string': 0,
        },
    },
    testDefaults,
    {
        files: ['packages/*/tools/*.ts'],
        rules: {
            '@typescript-eslint/consistent-type-imports': 0,
            'no-console': 0,
        },
    },
];
