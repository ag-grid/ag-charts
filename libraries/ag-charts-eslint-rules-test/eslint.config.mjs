import base, { sonarjsConfig, testDefaults } from '../../eslint.config.mjs';

export default [
    ...sonarjsConfig,
    ...base,
    {
        ...testDefaults,
        files: ['**/src/**/*.test.ts', '**/jest.config.ts'],
        ignores: ['**/src/**/*.data.ts'],
    },
];
