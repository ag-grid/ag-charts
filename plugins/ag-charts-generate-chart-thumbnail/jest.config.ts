/* eslint-disable */
export default {
    displayName: 'plugins-ag-charts-generate-chart-thumbnail',
    preset: '../../jest.preset.js',
    transform: {
        '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/packages/plugins/ag-charts-generate-chart-thumbnail',
    testEnvironment: '../../packages/ag-charts-community/jest.jsdom-env.cjs',
};
