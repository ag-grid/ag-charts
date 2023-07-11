import { isReactInternalFramework, isVueInternalFramework } from './framework';

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
