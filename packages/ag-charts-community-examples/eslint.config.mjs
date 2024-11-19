import base from '../../eslint.config.mjs';

export default [
    ...base,
    {
        rules: {
            'sonarjs/pseudo-random': 1,
            'sonarjs/slow-regex': 1,
            'check-file/folder-naming-convention': 0,
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_|chart' }],
        },
    },
];
