import base, { testDefaults } from '../../eslint.config.mjs';

export default [
    ...base,
    {
        ...testDefaults,
        files: ['**/src/**/*'],
    },
];
