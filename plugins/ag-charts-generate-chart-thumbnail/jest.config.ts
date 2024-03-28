/* eslint-disable */
export default {
    displayName: 'plugins-ag-charts-generate-chart-thumbnail',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    preset: '../../jest.preset.js',
    transform: {
        '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/packages/plugins/ag-charts-generate-chart-thumbnail',
};
