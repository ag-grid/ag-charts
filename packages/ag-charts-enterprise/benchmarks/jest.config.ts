import { existsSync, readFileSync } from 'node:fs';

const { exclude: _, ...swcJestConfig } = JSON.parse(readFileSync(`${__dirname}/../.swcrc`, 'utf-8'));
if (swcJestConfig.swcrc === undefined) {
    swcJestConfig.swcrc = false;
}

function isHistoricBenchmark(): boolean {
    const mockCanvasPath = `${__dirname}/../../ag-charts-community/src/util/test/mockCanvas.ts`;
    if (!existsSync(mockCanvasPath)) {
        return false;
    }
    const mockCanvasContent = readFileSync(mockCanvasPath, 'utf-8');
    return mockCanvasContent.includes("from 'canvas'") || mockCanvasContent.includes('from "canvas"');
}

export default {
    displayName: 'ag-charts-enterprise - benchmarks',
    rootDir: '..',
    testMatch: ['**/benchmarks/**/*.test.ts'],
    runner: 'jest-serial-runner',
    resolver: undefined,
    prettierPath: null,
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'html'],
    testEnvironment: '../ag-charts-community/benchmarks/jest.jsdom-env.cjs',
    setupFilesAfterEnv: ['<rootDir>/benchmarks/jest.setup.ts'],
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
        ...(isHistoricBenchmark() ? { '^canvas$': '<rootDir>/../../tools/jest/canvas-shim.ts' } : {}),
    },
    testEnvironmentOptions: {
        customExportConditions: ['node', 'require', 'default'],
    },
};
