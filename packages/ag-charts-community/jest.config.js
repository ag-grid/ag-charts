const glob = require('glob');
const fs = require('fs');

const pathToGlob = (path) => path.replace('./', '**/');

const tests = glob.sync('./src/**/*.test.ts');
const e2eTests = tests
    .filter((path) => {
        const fileContents = fs.readFileSync(path).toString();

        // 'Heuristic' for finding e2e tests :-P
        return fileContents.indexOf('setupMockCanvas()') >= 0;
    })
    .map(pathToGlob);
const unitTests = tests.map(pathToGlob).filter((path) => !e2eTests.includes(path));

const commonConfig = {
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.test.json',
            },
        ],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testEnvironment: 'jsdom',
    setupFiles: ['jest-canvas-mock'],
};

module.exports = {
    globalSetup: './jest.setup.js',
    projects: [
        {
            displayName: 'unit',
            roots: ['<rootDir>/src'],
            testMatch: unitTests,
            ...commonConfig,
        },
        {
            displayName: 'e2e',
            roots: ['<rootDir>/src'],
            testMatch: e2eTests,
            runner: 'jest-serial-runner',
            // WIP discussion: https://github.com/facebook/jest/issues/10936
            // maxWorkers: 1,
            // WIP discussion: https://github.com/facebook/jest/pull/10912
            // maxConcurrency: 1,
            ...commonConfig,
        },
    ],
};
