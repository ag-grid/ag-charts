import pluginJs from '@eslint/js';
// TODO: Add after eslint upgrade to v9.x
// import eslintImportX from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
    { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            // 'import-x': eslintImportX
        },
    },
    {
        ignores: ['node_modules/', 'dist/'],
    },
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],
            // 'import-x/consistent-type-specifier-style': 'error',
            '@typescript-eslint/no-this-alias': 'off',
            'no-restricted-imports': [
                'error',
                {
                    patterns: ['community-modules/*', 'enterprise-modules/*', '*/main'],
                },
            ],
        },
    },
];
