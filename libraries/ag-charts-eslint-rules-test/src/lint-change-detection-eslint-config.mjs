// -*- Mode: js -*-
import globals from 'globals';
import tseslint from 'typescript-eslint';

import changeDetection from '../../../../../eslint-rules/change-detection.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ['**/lint-change-detection.data.ts'],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                project: './tsconfig.change-detection.json',
            },
        },
        plugins: {
            aglint: {
                rules: {
                    'change-detection': changeDetection,
                },
            },
        },
        rules: {
            'aglint/change-detection': 2,
            '@typescript-eslint/no-explicit-any': 0,
            '@typescript-eslint/no-unused-vars': 0,
        },
    },
];
