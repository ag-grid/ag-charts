// -*- Mode: js -*-
import globals from 'globals';
import tseslint from 'typescript-eslint';

import requireSharedRenderer from '../rules/require-shared-renderer.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ['**/lint-require-shared-renderer.data.ts'],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                project: './src/lint-require-shared-renderer-tsconfig.json',
            },
        },
        plugins: {
            aglint: {
                rules: {
                    'require-shared-renderer': requireSharedRenderer,
                },
            },
        },
        rules: {
            'aglint/require-shared-renderer': 2,
            '@typescript-eslint/no-unused-vars': 0,
            '@typescript-eslint/no-empty-object-type': 0,
        },
    },
];
