import { gridUrlWithPrefix } from '@ag-website-shared/utils/gridUrlWithPrefix';

const siteBaseUrl = 'https://www.ag-grid.com';

describe('gridUrlWithPrefix', () => {
    // Every docs page is a directory index, so a slashless URL costs the visitor a 301 (SE-166). The
    // slash goes into the pathname, ahead of any query string or anchor; files and URLs the builder
    // did not assemble are left as they came in.
    test.each`
        url                                                                              | framework    | expected
        ${'./integrated-charts/'}                                                        | ${'react'}   | ${'https://www.ag-grid.com/react-data-grid/integrated-charts/'}
        ${'./find'}                                                                      | ${'angular'} | ${'https://www.ag-grid.com/angular-data-grid/find/'}
        ${'/license-pricing'}                                                            | ${'react'}   | ${'https://www.ag-grid.com/license-pricing/'}
        ${'./example?theme=quartz'}                                                      | ${'react'}   | ${'https://www.ag-grid.com/react-data-grid/example/?theme=quartz'}
        ${'/changelog?fixVersion=36.1.0'}                                                | ${'react'}   | ${'https://www.ag-grid.com/changelog/?fixVersion=36.1.0'}
        ${'./community-vs-enterprise/#request-a-30-day-enterprise-bundle-trial-licence'} | ${'react'}   | ${'https://www.ag-grid.com/react-data-grid/community-vs-enterprise/#request-a-30-day-enterprise-bundle-trial-licence'}
        ${'./page#section'}                                                              | ${'react'}   | ${'https://www.ag-grid.com/react-data-grid/page/#section'}
        ${'./guide.pdf'}                                                                 | ${'react'}   | ${'https://www.ag-grid.com/react-data-grid/guide.pdf'}
        ${'./example.json'}                                                              | ${'react'}   | ${'https://www.ag-grid.com/react-data-grid/example.json'}
        ${'#section'}                                                                    | ${'react'}   | ${'#section'}
        ${''}                                                                            | ${'react'}   | ${''}
        ${'https://example.com/other'}                                                   | ${'react'}   | ${'https://example.com/other'}
    `('$url (framework=$framework) -> $expected', ({ url, framework, expected }) => {
        expect(gridUrlWithPrefix({ url, framework, siteBaseUrl })).toBe(expected);
    });
});
