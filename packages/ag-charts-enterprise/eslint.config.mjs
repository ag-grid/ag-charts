import base, { sonarjsConfig, widgetBoundaryConfig } from '../../eslint.config.mjs';

export default [
    ...sonarjsConfig,
    ...base,
    widgetBoundaryConfig,
    {
        files: ['**/typings.test.d.ts'],
        rules: {
            'sonarjs/no-empty-test-file': 0,
        },
    },
];
