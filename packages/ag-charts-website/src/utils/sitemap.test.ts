import { isDemoPage, isInternalPage } from './sitemap';

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
