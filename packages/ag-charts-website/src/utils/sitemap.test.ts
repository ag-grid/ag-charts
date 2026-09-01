import { getSitemapConfig, isDemoPage, isInternalPage } from './sitemap';

describe('isInternalPage', () => {
    test.each`
        page                              | expected
        ${'/javascript/bar-series-test/'} | ${true}
        ${'/javascript/bar-series-test'}  | ${true}
        ${'/react/sync-e2e/'}             | ${true}
        ${'/react/sync-e2e'}              | ${true}
        ${'/javascript/active-e2e-test/'} | ${true}
        ${'/charts/benchmarks'}           | ${true}
        ${'/javascript/bar-series/'}      | ${false}
        ${'/javascript/tooltips/'}        | ${false}
        ${'/javascript/latest/'}          | ${false}
        ${'/javascript/contest/'}         | ${false}
    `('$page -> $expected', ({ page, expected }) => {
        expect(isInternalPage(page)).toBe(expected);
    });
});

describe('isDemoPage', () => {
    test.each`
        page                     | expected
        ${'/charts/demos'}       | ${true}
        ${'/charts/demos/'}      | ${true}
        ${'/charts/demos/line'}  | ${true}
        ${'/charts/demos/pie/'}  | ${true}
        ${'/charts/bar-series/'} | ${false}
        ${'/charts/gallery/'}    | ${false}
    `('$page -> $expected', ({ page, expected }) => {
        expect(isDemoPage(page)).toBe(expected);
    });
});

describe('getSitemapConfig filter', () => {
    const { filter } = getSitemapConfig('/charts');

    // Copies of grid-owned pages canonicalise to the grid site, so the sitemap must not list them.
    test.each`
        page                                                            | included
        ${'https://www.ag-grid.com/charts/session/opening-keynote/'}    | ${false}
        ${'https://www.ag-grid.com/charts/community/'}                  | ${false}
        ${'https://www.ag-grid.com/charts/community/tools-extensions/'} | ${false}
        ${'https://www.ag-grid.com/charts/contact/'}                    | ${false}
        ${'https://www.ag-grid.com/charts/license-pricing/'}            | ${true}
        ${'https://www.ag-grid.com/charts/gallery/'}                    | ${true}
    `('$page -> included: $included', ({ page, included }) => {
        expect(filter(page)).toBe(included);
    });
});
