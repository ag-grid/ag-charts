/* eslint-disable */
export default {
    displayName: 'prettier-plugin-partial-js-markdown',
    preset: '../../jest.preset.js',
    transform: {
        '^.+\\.[t]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'html'],
    coverageDirectory: '../../coverage/plugins/prettier-plugin-partial-js-markdown',
};