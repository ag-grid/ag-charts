import { chartsUrlWithPrefix } from '@ag-website-shared/utils/chartsUrlWithPrefix';

const siteBaseUrl = 'https://www.ag-grid.com/charts';

describe('chartsUrlWithPrefix', () => {
    // Every docs page is a directory index, so a slashless URL costs the visitor a 301 (SE-166).
    test.each`
        url                            | framework  | expected
        ${'./bar-series/'}             | ${'react'} | ${'https://www.ag-grid.com/charts/react/bar-series/'}
        ${'./high-frequency-data'}     | ${'react'} | ${'https://www.ag-grid.com/charts/react/high-frequency-data/'}
        ${'/gallery'}                  | ${'react'} | ${'https://www.ag-grid.com/charts/gallery/'}
        ${'./tooltips/#renderer'}      | ${'vue'}   | ${'https://www.ag-grid.com/charts/vue/tooltips/#renderer'}
        ${'https://example.com/other'} | ${'react'} | ${'https://example.com/other'}
    `('$url (framework=$framework) -> $expected', ({ url, framework, expected }) => {
        expect(chartsUrlWithPrefix({ url, framework, siteBaseUrl })).toBe(expected);
    });
});
