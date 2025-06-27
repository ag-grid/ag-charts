// -*- Mode: js -*-
import globals from 'globals';
import tseslint from 'typescript-eslint';

import requireExplicitGeneric from '../rules/require-explicit-generic.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ['**/lint-require-explicit-generic.data.ts'],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                project: './src/lint-require-explicit-generic-tsconfig.json',
            },
        },
        plugins: {
            aglint: {
                rules: {
                    'require-explicit-generic': requireExplicitGeneric,
                },
            },
        },
        rules: {
            'aglint/require-explicit-generic': 2,
            '@typescript-eslint/no-unused-vars': 0,
            '@typescript-eslint/no-empty-object-type': 0,
        },
    },
];
