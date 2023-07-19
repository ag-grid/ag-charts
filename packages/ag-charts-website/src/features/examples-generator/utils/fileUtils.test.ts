import { getBoilerPlateName } from './fileUtils';

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
