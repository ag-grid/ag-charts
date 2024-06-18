/* eslint-disable */
import { readFileSync } from 'fs';

// Reading the SWC compilation config and remove the "exclude"
// for the test files to be compiled by SWC
const { exclude: _, ...swcJestConfig } = JSON.parse(readFileSync(`${__dirname}/.swcrc`, 'utf-8'));

// disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves.
// If we do not disable this, SWC Core will read .swcrc and won't transform our test files due to "exclude"
if (swcJestConfig.swcrc === undefined) {
    swcJestConfig.swcrc = false;
}

// Uncomment if using global setup/teardown files being transformed via swc
// https://nx.dev/packages/jest/documents/overview#global-setup/teardown-with-nx-libraries
// jest needs EsModule Interop to find the default exported setup/teardown functions
// swcJestConfig.module.noInterop = false;

const commonConfig = {
    resolver: undefined, // NX redirects CSS imports https://github.com/nrwl/nx/blob/7495f0664b19e8fa32ef693f43d709173b6a2bc4/packages/jest/plugins/resolver.ts#L43
    prettierPath: null,
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'html'],
    preset: '../../jest.preset.js',
    transform: {
        '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
    },
};

const reporters: any[] = ['default'];
if (process.env.CI != null || process.env.NX_TASK_TARGET_CONFIGURATION === 'ci') {
    reporters.push(['jest-junit', { outputDirectory: 'reports', outputName: 'ag-charts-locale.xml' }]);
}

export default {
    reporters,
    projects: [
        {
            displayName: 'ag-charts-locale - unit',
            ...commonConfig,
        },
    ],
};
