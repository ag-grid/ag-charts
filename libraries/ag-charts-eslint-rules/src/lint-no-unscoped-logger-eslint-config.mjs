// -*- Mode: js -*-
import tseslint from 'typescript-eslint';

import noUnscopedLogger from '../rules/no-unscoped-logger.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    {
        files: ['**/lint-no-unscoped-logger.data.ts'],
        languageOptions: {
            parser: tseslint.parser,
        },
        plugins: {
            aglint: {
                rules: {
                    'no-unscoped-logger': noUnscopedLogger,
                },
            },
        },
        rules: {
            'aglint/no-unscoped-logger': [2, { allowNewIn: [], checkStatic: true, allowAmbientIn: [] }],
        },
    },
];
