import { getTabIndexForKey } from './tabKeyboard';

describe('getTabIndexForKey', () => {
    it.each`
        key             | current | expected
        ${'ArrowRight'} | ${0}    | ${1}
        ${'ArrowDown'}  | ${1}    | ${2}
        ${'ArrowRight'} | ${2}    | ${0}
        ${'ArrowLeft'}  | ${1}    | ${0}
        ${'ArrowUp'}    | ${0}    | ${2}
        ${'Home'}       | ${2}    | ${0}
        ${'End'}        | ${0}    | ${2}
        ${'Enter'}      | ${1}    | ${undefined}
        ${'Tab'}        | ${1}    | ${undefined}
    `('$key from tab $current of 3 moves to $expected', ({ key, current, expected }) => {
        expect(getTabIndexForKey(key, current, 3)).toBe(expected);
    });
});
