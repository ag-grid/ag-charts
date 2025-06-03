/* eslint-disable */
export default {
    displayName: 'plugins-ag-charts-generate-example-files',
    preset: '../../jest.preset.js',
    transform: {
        '^.+\\.[t]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'html'],
    coverageDirectory: '../../coverage/packages/plugins/ag-charts-generate-example-files',
};
