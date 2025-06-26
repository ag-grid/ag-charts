// -*- Mode: js -*-
import globals from 'globals';
import tseslint from 'typescript-eslint';

import changeDetection from '../../change-detection.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ['**/lint-change-detection.data.ts'],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                project: './src/lint-change-detection-tsconfig.json',
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
