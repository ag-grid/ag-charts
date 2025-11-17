import * as glob from 'glob';
import { readFileSync, existsSync } from 'node:fs';

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

// Check if we're running historic benchmarks (before skia-canvas was introduced)
// Historic benchmarks restore old files that import from 'canvas' instead of 'skia-canvas'
function isHistoricBenchmark(): boolean {
    // Check if mockCanvas.ts imports from 'canvas' (historic) vs 'skia-canvas' (current)
    // Enterprise uses community's mockCanvas, so check that path
    const mockCanvasPath = `${__dirname}/../ag-charts-community/src/util/test/mockCanvas.ts`;
    if (!existsSync(mockCanvasPath)) {
        return false;
    }
    const mockCanvasContent = readFileSync(mockCanvasPath, 'utf-8');
    return mockCanvasContent.includes("from 'canvas'") || mockCanvasContent.includes('from "canvas"');
}

const pathToGlob = ({ path }: { path: string }) => path.replace('./', '**/');

const tests = glob.sync('packages/ag-charts-enterprise/src/**/*.test.ts').map((path) => {
    const fileContents = readFileSync(path).toString();

    let type = 'unit';
    if (fileContents.includes('jest.retryTimes')) {
        type = 'flaky';
    } else if (fileContents.includes('setupMockCanvas()')) {
        // 'Heuristic' for finding e2e tests :-P
        type = 'e2e';
    }

    return {
        path,
        type,
    };
});
const e2eTests = tests.filter((test) => test.type === 'e2e').map(pathToGlob);
const unitTests = tests.filter((test) => test.type === 'unit').map(pathToGlob);
const flakyTests = tests.filter((test) => test.type === 'flaky').map(pathToGlob);
const benchmarks = glob
    .sync('packages/ag-charts-enterprise/benchmarks/**/*.test.ts')
    .map((path) => ({ path }))
    .map(pathToGlob);

const commonConfig = {
    resolver: undefined, // NX redirects CSS imports https://github.com/nrwl/nx/blob/7495f0664b19e8fa32ef693f43d709173b6a2bc4/packages/jest/plugins/resolver.ts#L43
    prettierPath: null,
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'html'],
    testEnvironment: '../ag-charts-community/jest.jsdom-env.cjs',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    preset: '../../jest.preset.js',
    transform: {
        '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
        '\\.css$': 'jest-text-transformer',
        '\\.html$': 'jest-text-transformer',
    },
    moduleNameMapper: {
        '^ag-charts-community$': '<rootDir>/../ag-charts-community/src/main.ts',
        '^ag-charts-types$': '<rootDir>/../ag-charts-types/src/main.ts',
        '^ag-charts-locale$': '<rootDir>/../ag-charts-locale/src/main.ts',
        '^ag-charts-community-test$': '<rootDir>/../ag-charts-community/src/main-test.ts',
    },
};

const reporters: any[] = [['default', { summaryThreshold: Infinity }]];
if (process.env.CI != null || process.env.NX_TASK_TARGET_CONFIGURATION === 'ci') {
    reporters.push(['jest-junit', { outputDirectory: 'reports', outputName: 'ag-charts-enterprise.xml' }]);
}

const pathFix = (v: string) => v.replace('packages/ag-charts-enterprise/', '**/');
export default {
    reporters,
    projects: [
        {
            displayName: 'ag-charts-enterprise - flaky',
            testMatch: flakyTests.map(pathFix),
            ...commonConfig,
            runner: 'jest-serial-runner',
        },
        {
            displayName: 'ag-charts-enterprise - unit',
            testMatch: unitTests.map(pathFix),
            ...commonConfig,
        },
        {
            displayName: 'ag-charts-enterprise - e2e',
            testMatch: e2eTests.map(pathFix),
            slowTestThreshold: 15,
            // runner: 'jest-serial-runner',
            // WIP discussion: https://github.com/facebook/jest/issues/10936
            // maxWorkers: 1,
            // WIP discussion: https://github.com/facebook/jest/pull/10912
            // maxConcurrency: 1,
            ...commonConfig,
        },
        {
            displayName: 'ag-charts-enterprise - benchmarks',
            testMatch: benchmarks.map(pathFix),
            runner: 'jest-serial-runner',
            ...commonConfig,
            // Only add canvas shim for historic benchmarks (when old code imports from 'canvas')
            moduleNameMapper: {
                ...commonConfig.moduleNameMapper,
                ...(isHistoricBenchmark() ? { '^canvas$': '<rootDir>/../../tools/jest/canvas-shim.ts' } : {}),
            },
        },
    ].filter((test) => test.testMatch.length > 0),
};
