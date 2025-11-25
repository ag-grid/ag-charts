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
        // Ignore generated/transformed framework example files, but NOT main.ts (vanilla source)
        ignores: [
            '.astro/',
            '**/_examples/*/_gen/',
            '**/_examples/*/angular/',
            '**/_examples/*/react/',
            '**/_examples/*/vue/',
            '**/_examples/*/vue3/',
            '**/_examples/*/reactFunctional/',
            '**/_examples/*/reactFunctionalTs/',
            '**/_examples/*/typescript/',
            'scripts/showcase-github/tmp/',
            '**/.angular',
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
    // Example runner boilerplate files
    {
        files: ['public/example-runner/**/*[.js|.ts]'],
        languageOptions: {
            globals: {
                System: 'readonly',
                systemJsPaths: 'readonly',
                boilerplatePath: 'readonly',
                appLocation: 'readonly',
                systemJsMap: 'readonly',
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
    // Example files - validate module registrations
    {
        files: ['src/content/**/_examples/*/main.ts'],
        languageOptions: {
            parserOptions: {
                projectService: false,
                project: 'packages/ag-charts-website/tsconfig.examples.json',
                tsconfigRootDir: import.meta.dirname + '/../..',
            },
        },
        rules: {
            'aglint/validate-module-registration': [2, { warnOverRegistration: true }],
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
];
