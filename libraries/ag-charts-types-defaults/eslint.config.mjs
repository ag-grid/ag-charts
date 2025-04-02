import base, { sonarjsConfig } from '../../eslint.config.mjs';

export default [
    ...sonarjsConfig,
    ...base,
    {
        files: ['**/src/**/*'],
    },
];
