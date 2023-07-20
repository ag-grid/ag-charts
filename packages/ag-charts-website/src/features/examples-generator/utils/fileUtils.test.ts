import { getBoilerPlateName, getEntryFileName } from './fileUtils';

describe('getEntryFileName', () => {
    test.each`
        internalFramework      | expected
        ${undefined}           | ${undefined}
        ${'other'}             | ${undefined}
        ${'vanilla'}           | ${'main.js'}
        ${'typescript'}        | ${'main.ts'}
        ${'react'}             | ${'index.jsx'}
        ${'reactFunctional'}   | ${'index.jsx'}
        ${'reactFunctionalTs'} | ${'index.tsx'}
        ${'angular'}           | ${'main.js'}
        ${'vue'}               | ${'main.js'}
        ${'vue3'}              | ${'main.js'}
    `('$internalFramework is $expected', ({ internalFramework, expected }) => {
        expect(getEntryFileName(internalFramework)).toEqual(expected);
    });
});

describe('getBoilerPlateName', () => {
    test.each`
        internalFramework      | expected
        ${undefined}           | ${undefined}
        ${'other'}             | ${undefined}
        ${'vanilla'}           | ${undefined}
        ${'typescript'}        | ${'charts-typescript-boilerplate'}
        ${'react'}             | ${'charts-react-boilerplate'}
        ${'reactFunctional'}   | ${'charts-react-boilerplate'}
        ${'reactFunctionalTs'} | ${'charts-react-ts-boilerplate'}
        ${'angular'}           | ${'charts-angular-boilerplate'}
        ${'vue'}               | ${'charts-vue-boilerplate'}
        ${'vue3'}              | ${'charts-vue3-boilerplate'}
    `('$internalFramework is $expected', ({ internalFramework, expected }) => {
        expect(getBoilerPlateName(internalFramework)).toEqual(expected);
    });
});
