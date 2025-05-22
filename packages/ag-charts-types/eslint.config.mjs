import base, { sonarjsConfig } from '../../eslint.config.mjs';

export default [
    ...sonarjsConfig,
    ...base,
    {
        files: ['**/*.ts'],
        rules: {
            'aglint/require-explicit-generic': 1, // TODO: upgrade from warning to error once all violation are resolved
        },
    },
];
