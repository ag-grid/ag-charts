// -*- Mode: js -*-
import tseslint from 'typescript-eslint';

import widgetBoundary from '../rules/widget-boundary.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    {
        files: ['**/lint-widget-boundary.data.ts'],
        languageOptions: {
            parser: tseslint.parser,
        },
        linterOptions: { reportUnusedDisableDirectives: 'error' },
        plugins: {
            aglint: {
                rules: {
                    'widget-boundary': widgetBoundary,
                },
            },
        },
        rules: {
            'aglint/widget-boundary': 2,
        },
    },
];
