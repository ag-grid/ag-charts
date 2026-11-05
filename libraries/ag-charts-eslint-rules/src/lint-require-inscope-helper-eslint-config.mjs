// -*- Mode: js -*-
import tseslint from 'typescript-eslint';

import requireInScopeHelper from '../rules/require-inscope-helper.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    {
        files: ['**/lint-require-inscope-helper.data.ts'],
        languageOptions: {
            parser: tseslint.parser,
            sourceType: 'module',
        },
        plugins: {
            aglint: {
                rules: {
                    'require-inscope-helper': requireInScopeHelper,
                },
            },
        },
        rules: {
            'aglint/require-inscope-helper': [2, { handlers: ['test_CorrectHandler', 'test_CorrectHandlerOnly'] }],
        },
    },
];
