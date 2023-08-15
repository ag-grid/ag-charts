import { createStyle } from './styles';

describe('styles', () => {
    test('undefined', () => {
        expect(createStyle()).toBe(undefined);
    });

    test.each`
        config | expected
        ${{}}  | ${undefined}
        ${{
    'align-items': 'center',
}} | ${{
    'align-items': 'center',
}}
        ${{
    'align-items': undefined,
}} | ${undefined}
        ${{
    'align-items': undefined,
    'justify-items': 'center',
}} | ${{ 'justify-items': 'center' }}
        ${{
    'align-items': undefined,
    'justify-items': undefined,
}} | ${undefined}
    `('returns "$expected" for $config', ({ config, expected }) => {
        expect(createStyle(config)).toEqual(expected);
    });
});
