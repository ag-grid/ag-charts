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
        ignores: ['.astro/', '**/_examples/', 'scripts/showcase-github/tmp/', '**/.angular'],
    },
    {
        rules: {
            'no-eval': 'error',
            'no-console': 'error',
            'import-x/consistent-type-specifier-style': 'off',
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
    {
        rules: {
            // TODO: Remove these
            '@typescript-eslint/no-shadow': 'warn',
            '@typescript-eslint/require-await': 'warn',
            '@typescript-eslint/no-unused-expressions': 'warn',
            '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
            '@typescript-eslint/prefer-optional-chain': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/prefer-nullish-coalescing': 'warn',
            '@typescript-eslint/restrict-template-expressions': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/ban-ts-comment': 'warn',
            '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
            '@typescript-eslint/unbound-method': 'warn',
            '@typescript-eslint/await-thenable': 'warn',
        },
    },
    {
        // TODO: Remove these
        ignores: [
            '*.mjs',
            'public/example-runner/**/*.{js,ts}',
            'e2e/fixture.ts',
            'tools/compare-gallery-thumbnails.js',
            'update-algolia.js',
        ],
    },
];
