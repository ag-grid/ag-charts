import { getFrameworkFromInternalFramework, isReactInternalFramework, isVueInternalFramework } from './framework';

describe('getFrameworkFromInternalFramework', () => {
    test.each`
        internalFramework      | expected
        ${undefined}           | ${undefined}
        ${'other'}             | ${'other'}
        ${'vanilla'}           | ${'javascript'}
        ${'typescript'}        | ${'javascript'}
        ${'react'}             | ${'react'}
        ${'reactFunctional'}   | ${'react'}
        ${'reactFunctionalTs'} | ${'react'}
        ${'angular'}           | ${'angular'}
        ${'vue'}               | ${'vue'}
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
        ${'react'}             | ${true}
        ${'reactFunctional'}   | ${true}
        ${'reactFunctionalTs'} | ${true}
        ${'angular'}           | ${false}
        ${'vue'}               | ${false}
        ${'vue3'}              | ${false}
    `('{$internalFramework} is $expected', ({ internalFramework, expected }) => {
        expect(isReactInternalFramework(internalFramework)).toEqual(expected);
    });
});

describe('isVueInternalFramework', () => {
    test.each`
        internalFramework      | expected
        ${undefined}           | ${false}
        ${'other'}             | ${false}
        ${'vanilla'}           | ${false}
        ${'typescript'}        | ${false}
        ${'react'}             | ${false}
        ${'reactFunctional'}   | ${false}
        ${'reactFunctionalTs'} | ${false}
        ${'angular'}           | ${false}
        ${'vue'}               | ${true}
        ${'vue3'}              | ${true}
    `('{$internalFramework} is $expected', ({ internalFramework, expected }) => {
        expect(isVueInternalFramework(internalFramework)).toEqual(expected);
    });
});
