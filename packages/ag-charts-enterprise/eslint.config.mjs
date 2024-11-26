import base, { testDefaults } from '../../eslint.config.mjs';

export default [
    ...base,
    {
        ...testDefaults,
        files: ['**/benchmarks/**/*'],
        rules: {
            ...testDefaults.rules,
            'sonarjs/no-empty-test-file': 0,
        },
    },
];
