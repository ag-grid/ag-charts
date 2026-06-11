import base, { sonarjsConfig } from '../../eslint.config.mjs';

export default [
    ...sonarjsConfig,
    ...base,
    {
        files: ['**/typings.test.d.ts'],
        rules: {
            'sonarjs/no-empty-test-file': 0,
        },
    },
];
