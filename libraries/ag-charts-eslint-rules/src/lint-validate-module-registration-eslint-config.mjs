// -*- Mode: js -*-
import globals from 'globals';
import tseslint from 'typescript-eslint';

import validateModuleRegistration from '../rules/validate-module-registration.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ['**/lint-validate-module-registration.data.ts'],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                project: './src/lint-validate-module-registration-tsconfig.json',
            },
        },
        plugins: {
            aglint: {
                rules: {
                    'validate-module-registration': validateModuleRegistration,
                },
            },
        },
        rules: {
            'aglint/validate-module-registration': [2, { warnOverRegistration: true }],
            '@typescript-eslint/no-explicit-any': 0,
            '@typescript-eslint/no-unused-vars': 0,
        },
    },
];
