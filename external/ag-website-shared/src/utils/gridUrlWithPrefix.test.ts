import { gridUrlWithPrefix } from '@ag-website-shared/utils/gridUrlWithPrefix';

const siteBaseUrl = 'https://www.ag-grid.com';

describe('gridUrlWithPrefix', () => {
    // Every docs page is a directory index, so a slashless URL costs the visitor a 301 (SE-166).
    test.each`
        url                                                                              | framework    | expected
        ${'./integrated-charts/'}                                                        | ${'react'}   | ${'https://www.ag-grid.com/react-data-grid/integrated-charts/'}
        ${'./find'}                                                                      | ${'angular'} | ${'https://www.ag-grid.com/angular-data-grid/find/'}
        ${'/license-pricing'}                                                            | ${'react'}   | ${'https://www.ag-grid.com/license-pricing/'}
        ${'./community-vs-enterprise/#request-a-30-day-enterprise-bundle-trial-licence'} | ${'react'}   | ${'https://www.ag-grid.com/react-data-grid/community-vs-enterprise/#request-a-30-day-enterprise-bundle-trial-licence'}
        ${'https://example.com/other'}                                                   | ${'react'}   | ${'https://example.com/other'}
    `('$url (framework=$framework) -> $expected', ({ url, framework, expected }) => {
        expect(gridUrlWithPrefix({ url, framework, siteBaseUrl })).toBe(expected);
    });
});
