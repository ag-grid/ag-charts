import { addAbsoluteTrailingSlash, addTrailingSlash } from '@ag-website-shared/utils/addTrailingSlash';

describe('addTrailingSlash', () => {
    test.each`
        url                      | expected
        ${'docs'}                | ${'docs/'}
        ${'docs/'}               | ${'docs/'}
        ${'./docs'}              | ${'./docs/'}
        ${'./docs/path'}         | ${'./docs/path/'}
        ${'/gallery'}            | ${'/gallery/'}
        ${'/gallery/'}           | ${'/gallery/'}
        ${'/docs#section'}       | ${'/docs#section'}
        ${'https://youtube.com'} | ${'https://youtube.com'}
    `('$url -> $expected', ({ url, expected }) => {
        expect(addTrailingSlash(url)).toBe(expected);
    });
});

describe('addAbsoluteTrailingSlash', () => {
    test.each`
        url                                                              | expected
        ${'https://www.ag-grid.com/charts'}                              | ${'https://www.ag-grid.com/charts/'}
        ${'https://www.ag-grid.com/charts/'}                             | ${'https://www.ag-grid.com/charts/'}
        ${'https://www.ag-grid.com/charts/archive/13.3.1/documentation'} | ${'https://www.ag-grid.com/charts/archive/13.3.1/documentation/'}
        ${'https://www.ag-grid.com/react-data-grid/page/#section'}       | ${'https://www.ag-grid.com/react-data-grid/page/#section'}
        ${'https://www.ag-grid.com/charts/changelog/?fixVersion=14.1.0'} | ${'https://www.ag-grid.com/charts/changelog/?fixVersion=14.1.0'}
        ${'/gallery'}                                                    | ${'/gallery/'}
    `('$url -> $expected', ({ url, expected }) => {
        expect(addAbsoluteTrailingSlash(url)).toBe(expected);
    });
});
