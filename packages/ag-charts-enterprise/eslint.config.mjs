import base, { sonarjsConfig, testDefaults } from '../../eslint.config.mjs';

export default [
    ...sonarjsConfig,
    ...base,
    {
        ...testDefaults,
        files: ['**/benchmarks/**/*'],
        rules: {
            ...testDefaults.rules,
            'sonarjs/no-empty-test-file': 0,
        },
    },
    {
        files: ['**/typings.test.d.ts'],
        rules: {
            'sonarjs/no-empty-test-file': 0,
        },
    },
];
