// -*- Mode: js -*-
import changeDetection from '../../../../../eslint-rules/change-detection.mjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ['**/lint-change-detection.data.ts'],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                project: './tsconfig.base.json',
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
        },
    },
];
