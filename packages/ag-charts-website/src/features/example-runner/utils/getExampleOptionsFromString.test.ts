import { getExampleOptionsFromString } from './getExampleOptionsFromString';

describe('getExampleOptionsFromString', () => {
    test.each`
        string                                      | expected
        ${undefined}                                | ${undefined}
        ${''}                                       | ${undefined}
        ${'{ "key": 25 }'}                          | ${{ key: 25 }}
        ${'{ "key": 25, "keyValue": "someValue" }'} | ${{ key: 25, keyValue: 'someValue' }}
    `('{$string} is $expected', ({ string, expected }) => {
        expect(getExampleOptionsFromString(string)).toEqual(expected);
    });

    test.each`
        invalidString     | error
        ${'{ key: 25 }'}  | ${'Invalid options JSON string'}
        ${'{ key": 25 }'} | ${'Invalid options JSON string'}
        ${'key: 25'}      | ${'Invalid options JSON string'}
        ${'invalidKey'}   | ${'Invalid options JSON string'}
    `('{$invalidString} throws error "$error"', ({ invalidString, error }) => {
        expect(() => {
            getExampleOptionsFromString(invalidString);
        }).toThrow(error);
    });
});
