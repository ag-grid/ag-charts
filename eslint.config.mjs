import pluginJs from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import lintChangeDetection from './libraries/ag-charts-eslint-rules/rules/change-detection.mjs';
import requireExplicitGeneric from './libraries/ag-charts-eslint-rules/rules/require-explicit-generic.mjs';
import validateModuleRegistration from './libraries/ag-charts-eslint-rules/rules/validate-module-registration.mjs';

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

export const sonarjsConfig = [
    sonarjs.configs.recommended,
    {
        files: ['**/*.{js,ts}'],
        rules: {
            // Rules moved from sonarjs to @typescript-eslint.
            '@typescript-eslint/no-redeclare': 1,

            // Make these warnings only; ideally only shown in IDE and PRs - but unused rule errors happen otherwise if not enabled.
            'sonarjs/cognitive-complexity': 1,
            'sonarjs/no-duplicate-string': 1,
            'sonarjs/todo-tag': 1,
            'sonarjs/fixme-tag': 1,
            'sonarjs/function-return-type': 1,
            'sonarjs/no-selector-parameter': 1,
            'sonarjs/redundant-type-aliases': 1,

            // We don't really care about these.
            'sonarjs/new-cap': 0,

            // Duplicates @typescript-eslint
            'sonarjs/sonar-no-unused-vars': 0,
            'sonarjs/no-redundant-type-constituents': 0,
            'sonarjs/sonar-prefer-optional-chain': 0,
            'sonarjs/no-base-to-string': 0,
            'sonarjs/no-misused-promises': 0,

            // Unicorn rules, as referenced from the SonarCloud documentation.
            'unicorn/prefer-export-from': 2,
            'unicorn/prefer-math-trunc': 2,
            'unicorn/prefer-at': 2,
            'unicorn/prefer-number-properties': 2,
            'unicorn/no-array-for-each': 2,
            'unicorn/prefer-dom-node-remove': 2,
            'unicorn/prefer-global-this': 2,
            'unicorn/prefer-includes': 2,
            'unicorn/no-zero-fractions': 2,
        },
    },
];

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
            '**/.dependency-cruiser.js',
            '**/.size-limit.js',
        ],
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
            },
        },
    },
    {
        files: ['**/src/**/*'],
        ignores: ['**/src/pages/**', '**/_examples/**'], // Ignore astro pages and example files
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
        files: ['**/*.{js,ts,tsx,mjs}'],
        plugins: {
            aglint: {
                rules: {
                    'require-explicit-generic': requireExplicitGeneric,
                    'change-detection': lintChangeDetection,
                    'validate-module-registration': validateModuleRegistration,
                },
            },
            unicorn,
        },
        rules: {
            'no-lonely-if': 2,
            'unicorn/no-negated-condition': 2,
            'no-nested-ternary': 2,
            'no-unneeded-ternary': 2,
            'no-eval': 2,
            'no-console': 2,
            'no-unused-vars': 0,
            'no-case-declarations': 0,
            'aglint/change-detection': 2,
            '@typescript-eslint/no-explicit-any': 0,
            '@typescript-eslint/consistent-type-imports': 0,
            '@typescript-eslint/no-redundant-type-constituents': 2,
            '@typescript-eslint/no-floating-promises': 2,
            '@typescript-eslint/no-implied-eval': 2,
            '@typescript-eslint/no-shadow': 2,
            '@typescript-eslint/prefer-as-const': 2,
            '@typescript-eslint/prefer-nullish-coalescing': 2,
            '@typescript-eslint/prefer-optional-chain': 2,
            '@typescript-eslint/prefer-readonly': 2,
            '@typescript-eslint/prefer-ts-expect-error': 2,
            '@typescript-eslint/prefer-literal-enum-member': ['error', { allowBitwiseExpressions: true }],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-for-in-array': 2,
            '@typescript-eslint/restrict-template-expressions': [
                'error',
                {
                    allowArray: true,
                    allowBoolean: true,
                    allowNumber: true,
                    allow: ['Date'],
                },
            ],
            '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'always' }],

            // We don't really care about these.
            '@typescript-eslint/no-unsafe-return': 0,
            '@typescript-eslint/no-unsafe-call': 0,
            '@typescript-eslint/no-unsafe-assignment': 0,
            '@typescript-eslint/no-unsafe-function-type': 0,
            '@typescript-eslint/no-unsafe-argument': 0,
            '@typescript-eslint/no-unsafe-member-access': 0,
            '@typescript-eslint/no-base-to-string': 0,
            '@typescript-eslint/no-this-alias': 0,
        },
    },
    {
        files: ['**/*.{js,ts,tsx}'],
        ignores: ['**/*.{spec,test}.ts'],
        rules: {
            'no-restricted-properties': [
                'error',
                {
                    object: 'Object',
                    property: 'entries',
                    message: 'Prefer Object.keys() to Object.entries() for performance reasons.',
                },
            ],
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
