/* eslint-disable */
export default {
    displayName: 'plugins-ag-charts-generate-example-files',
    preset: '../../jest.preset.js',
    transform: {
        '^.+\\.[t]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'html'],
    // This project contains a `packages/` folder with built package artefacts used by other workflows.
    // Jest's haste map treats `package.json` as module providers; multiple extracted/published variants
    // (eg `dist/package/**/package.json` and `dist/umd/**/package.json`) can cause duplicate module names.
    // Ignore these artefacts so unit tests are stable under parallel Nx runs (eg `nx blt`).
    modulePathIgnorePatterns: ['<rootDir>/packages/', '<rootDir>/dist/'],
    coverageDirectory: '../../coverage/packages/plugins/ag-charts-generate-example-files',
};
