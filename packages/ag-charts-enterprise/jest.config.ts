/* eslint-disable */
import { readFileSync } from 'fs';
import * as glob from 'glob';

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

const pathToGlob = (path: string) => path.replace('./', '**/');

const tests = glob.sync('packages/ag-charts-enterprise/src/**/*.test.ts');
const e2eTests = tests
    .filter((path) => {
        const fileContents = readFileSync(path).toString();

        // 'Heuristic' for finding e2e tests :-P
        return fileContents.indexOf('setupMockCanvas()') >= 0;
    })
    .map(pathToGlob);
const unitTests = tests.map(pathToGlob).filter((path) => !e2eTests.includes(path));

const commonConfig = {
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'html'],
    // extensionsToTreatAsEsm: ['.ts'],
    testEnvironment: '../ag-charts-community/jest.jsdom-with-timezone.cjs',
    setupFiles: ['jest-canvas-mock', './jest.setup.cjs'],
    preset: '../../jest.preset.js',
    transform: {
        '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
    },
    moduleNameMapper: {
        '^ag-charts-community$': '<rootDir>/../ag-charts-community/src/main.ts',
        '^ag-charts-community-test$': '<rootDir>/../ag-charts-community/src/main-test.ts',
    },
};

const reporters: any[] = ['default'];
if (process.env.CI != null || process.env.NX_TASK_TARGET_CONFIGURATION === 'ci') {
    reporters.push(['jest-junit', { outputDirectory: 'reports', outputName: 'ag-charts-enterprise.xml' }]);
}

export default {
    reporters,
    projects: [
        {
            displayName: 'ag-charts-enterprise - unit',
            testMatch: unitTests.map((v) => v.replace('packages/ag-charts-enterprise/', '**/')),
            ...commonConfig,
        },
        {
            displayName: 'ag-charts-enterprise - e2e',
            testMatch: e2eTests.map((v) => v.replace('packages/ag-charts-enterprise/', '**/')),
            // runner: 'jest-serial-runner',
            // WIP discussion: https://github.com/facebook/jest/issues/10936
            // maxWorkers: 1,
            // WIP discussion: https://github.com/facebook/jest/pull/10912
            // maxConcurrency: 1,
            ...commonConfig,
        },
    ],
};
