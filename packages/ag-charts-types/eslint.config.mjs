import base, { sonarjsConfig } from '../../eslint.config.mjs';

export default [
    ...sonarjsConfig,
    ...base,
    {
        files: ['**/*.ts'],
        rules: {
            'aglint/require-explicit-generic': 2,
            'aglint/require-shared-renderer': 2,
        },
    },
];
