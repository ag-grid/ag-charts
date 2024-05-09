import { getFrameworkFromInternalFramework, isReactInternalFramework } from './framework';

describe('getFrameworkFromInternalFramework', () => {
    test.each`
        internalFramework      | expected
        ${undefined}           | ${undefined}
        ${'other'}             | ${'other'}
        ${'vanilla'}           | ${'javascript'}
        ${'typescript'}        | ${'javascript'}
        ${'reactFunctional'}   | ${'react'}
        ${'reactFunctionalTs'} | ${'react'}
        ${'angular'}           | ${'angular'}
        ${'vue3'}              | ${'vue'}
    `('$internalFramework is $expected', ({ internalFramework, expected }) => {
        expect(getFrameworkFromInternalFramework(internalFramework)).toEqual(expected);
    });
});

describe('isReactInternalFramework', () => {
    test.each`
        internalFramework      | expected
        ${undefined}           | ${false}
        ${'other'}             | ${false}
        ${'vanilla'}           | ${false}
        ${'typescript'}        | ${false}
        ${'reactFunctional'}   | ${true}
        ${'reactFunctionalTs'} | ${true}
        ${'angular'}           | ${false}
        ${'vue'}               | ${false}
        ${'vue3'}              | ${false}
    `('{$internalFramework} is $expected', ({ internalFramework, expected }) => {
        expect(isReactInternalFramework(internalFramework)).toEqual(expected);
    });
});
