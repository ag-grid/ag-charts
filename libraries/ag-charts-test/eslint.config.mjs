import base, { sonarjsConfig, testDefaults } from '../../eslint.config.mjs';

export default [
    ...sonarjsConfig,
    ...base,
    {
        ...testDefaults,
        files: ['**/src/**/*'],
    },
];
