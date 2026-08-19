import reactHooksPlugin from 'eslint-plugin-react-hooks';

import base from '../../eslint.config.mjs';

export default [
    ...base,
    {
        plugins: {
            'react-hooks': reactHooksPlugin,
        },
        rules: reactHooksPlugin.configs.recommended.rules,
    },
    {
        ignores: [
            '.astro/',
            '**/_examples/',
            '**/_shared/',
            'scripts/',
            // Standalone classic browser scripts served verbatim from public/;
            // not part of any tsconfig project, so excluded from type-aware
            // linting (as with public/example-runner below).
            'public/scripts/**',
            // Downloadable calendar files served verbatim from public/; the
            // non-standard .ics extension is not part of any tsconfig project.
            '**/*.ics',
            '**/.angular',
            '**/benchmarkHarness.ts',
            '**/benchmarkUtils.ts',
        ],
    },
    {
        rules: {
            'no-eval': 'error',
            'no-console': 'error',
            'import-x/consistent-type-specifier-style': 'off',
            '@typescript-eslint/no-redundant-type-constituents': 'warn',
        },
    },
    {
        files: ['*-boilerplate/*'],
        env: {
            es6: true,
        },
    },
    // Test files
    {
        files: ['**/*.test.ts'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                test: 'readonly',
                vi: 'readonly',
            },
        },
    },
    // Public files
    {
        files: ['public/**/*[.js|.ts]'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            'no-console': 'off',
        },
    },
    // env.d.ts
    {
        files: ['src/env.d.ts'],
        rules: {
            '@typescript-eslint/triple-slash-reference': 'off',
        },
    },
    // Root scripts
    {
        files: ['*.mjs', '*.cjs', 'markdoc.config.ts'],
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-var-requires': 'off',
        },
    },
    {
        // TODO: Remove these
        ignores: [
            '*.mjs',
            'public/example-runner/**/*.{js,ts}',
            'e2e/fixture.ts',
            'e2e/generated/**',
            'tools/compare-gallery-thumbnails.js',
            'update-algolia.js',
        ],
    },
    {
        // Astro's ClientRouter stores its history index and scroll offsets in `history.state`.
        // A raw write replaces them, after which its popstate handler either bails out or reads
        // every traversal as a "back", silently breaking back/forward for the whole page.
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'CallExpression > MemberExpression.callee[property.name=/^(pushState|replaceState)$/]',
                    message:
                        'Use replaceHistoryUrl() from @ag-website-shared/utils/historyUrl - a raw history write discards the router state that back/forward depends on.',
                },
            ],
        },
    },
];
