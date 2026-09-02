import { getCanonicalUrl, isCanonicalisedToGridSite } from './canonicalUrl';

const CHARTS_BASE = 'https://www.ag-grid.com/charts';
const GRID_BASE = 'https://www.ag-grid.com';

const canonicalFor = (pathname: string, canonicalUrlBase = CHARTS_BASE) =>
    getCanonicalUrl(new URL(pathname, canonicalUrlBase), canonicalUrlBase).href;

describe('getCanonicalUrl', () => {
    test.each`
        pathname                                  | expected
        ${'/charts/session/opening-keynote/'}     | ${'https://www.ag-grid.com/session/opening-keynote/'}
        ${'/charts/community/'}                   | ${'https://www.ag-grid.com/community/'}
        ${'/charts/community/beyond-the-prompt/'} | ${'https://www.ag-grid.com/community/beyond-the-prompt/'}
        ${'/charts/community/events/'}            | ${'https://www.ag-grid.com/community/events/'}
        ${'/charts/contact/'}                     | ${'https://www.ag-grid.com/contact/'}
    `('$pathname canonicalises to the grid page at $expected', ({ pathname, expected }) => {
        expect(canonicalFor(pathname)).toBe(expected);
    });

    test.each`
        pathname
        ${'/charts/'}
        ${'/charts/documentation/'}
        ${'/charts/license-pricing/'}
        ${'/charts/community-showcase/'}
        ${'/charts/sessions/'}
    `('$pathname canonicalises to itself', ({ pathname }) => {
        expect(canonicalFor(pathname)).toBe(new URL(pathname, CHARTS_BASE).href);
    });

    // A base-less route path (dev, where the site is served from the root) still resolves to the
    // grid page, so what dev renders matches what production emits.
    it('canonicalises a grid-owned route served without the site base', () => {
        expect(canonicalFor('/session/opening-keynote/')).toBe('https://www.ag-grid.com/session/opening-keynote/');
    });

    // The grid site owns these pages, so applying the same rule there must leave the URL alone.
    it('leaves the grid site pages unchanged', () => {
        expect(canonicalFor('/session/opening-keynote/', GRID_BASE)).toBe(
            'https://www.ag-grid.com/session/opening-keynote/'
        );
        expect(canonicalFor('/community/', GRID_BASE)).toBe('https://www.ag-grid.com/community/');
    });

    // A path that only looks like the site base must not be treated as prefixed.
    it('does not strip a base-lookalike path segment', () => {
        expect(canonicalFor('/chartsplus/session/opening-keynote/')).toBe(
            'https://www.ag-grid.com/chartsplus/session/opening-keynote/'
        );
    });
});

describe('isCanonicalisedToGridSite', () => {
    const BASE_PATH = '/charts';

    // The sitemap filter is handed full page URLs, so both forms must work.
    test.each`
        page                                                             | expected
        ${'https://www.ag-grid.com/charts/session/opening-keynote/'}     | ${true}
        ${'https://www.ag-grid.com/charts/community/beyond-the-prompt/'} | ${true}
        ${'https://www.ag-grid.com/charts/contact/'}                     | ${true}
        ${'https://www.ag-grid.com/charts/license-pricing/'}             | ${false}
        ${'https://www.ag-grid.com/charts/'}                             | ${false}
        ${'/charts/session/opening-keynote/'}                            | ${true}
        ${'/charts/community/'}                                          | ${true}
        ${'/charts/sessions/'}                                           | ${false}
        ${'/charts/community-showcase/'}                                 | ${false}
    `('$page -> $expected', ({ page, expected }) => {
        expect(isCanonicalisedToGridSite(page, BASE_PATH)).toBe(expected);
    });

    // The base arrives from `PUBLIC_BASE_URL`, which may or may not carry a trailing slash.
    it('accepts a base path with or without a trailing slash', () => {
        expect(isCanonicalisedToGridSite('/charts/session/opening-keynote/', '/charts/')).toBe(true);
        expect(isCanonicalisedToGridSite('/charts/session/opening-keynote/', '/charts')).toBe(true);
    });
});
