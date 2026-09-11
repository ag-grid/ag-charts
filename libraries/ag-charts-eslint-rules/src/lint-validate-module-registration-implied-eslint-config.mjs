// -*- Mode: js -*-
import globals from 'globals';
import tseslint from 'typescript-eslint';

import validateModuleRegistration from '../rules/validate-module-registration.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    {
        files: ['**/lint-validate-module-registration-implied.data.ts'],
        languageOptions: {
            globals: globals.browser,
            parser: tseslint.parser,
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
        },
    },
];
