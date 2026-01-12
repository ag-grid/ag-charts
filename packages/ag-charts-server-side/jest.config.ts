import { readFileSync } from 'node:fs';

// Reading the SWC compilation config and remove the "exclude"
// for the test files to be compiled by SWC
const { exclude: _, ...swcJestConfig } = JSON.parse(readFileSync(`${__dirname}/.swcrc`, 'utf-8'));

// disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves.
if (swcJestConfig.swcrc === undefined) {
    swcJestConfig.swcrc = false;
}

const reporters: any[] = [['default', { summaryThreshold: Infinity }]];
if (process.env.CI != null || process.env.NX_TASK_TARGET_CONFIGURATION === 'ci') {
    reporters.push(['jest-junit', { outputDirectory: 'reports', outputName: 'ag-charts-server-side.xml' }]);
}

export default {
    displayName: 'ag-charts-server-side',
    reporters,
    resolver: undefined,
    prettierPath: null,
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    preset: '../../jest.preset.js',
    transform: {
        '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
        '^.+\\.css$': 'jest-text-transformer',
        '^.+\\.html$': 'jest-text-transformer',
    },
    moduleNameMapper: {
        '^ag-charts-community$': '<rootDir>/../ag-charts-community/src/main.ts',
    },
    testMatch: ['**/src/**/*.test.ts'],
};
