/* eslint-disable */
export default {
    displayName: 'ag-charts-website',
    preset: '../../jest.preset.js',
    transform: {
        '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    testPathIgnorePatterns: [
        'examples-generator/transformation-scripts',
        'snippet/snippetTransformer',
        'utils/framework',
        'examples-generator/utils/fileUtils',
    ],
};
