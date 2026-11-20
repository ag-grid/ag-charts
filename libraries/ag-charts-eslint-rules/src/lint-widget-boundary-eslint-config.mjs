// -*- Mode: js -*-
import tseslint from 'typescript-eslint';

import widgetBoundary, { widgetBoundaryDirectives } from '../rules/widget-boundary.mjs';

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
                    'widget-boundary-directives': widgetBoundaryDirectives,
                },
            },
        },
        rules: {
            'aglint/widget-boundary': 2,
            'aglint/widget-boundary-directives': 2,
            'no-console': 2,
        },
    },
];
