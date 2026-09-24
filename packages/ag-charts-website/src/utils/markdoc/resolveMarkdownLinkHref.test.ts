import { describe, expect, test } from 'vitest';

import { resolveMarkdownLinkHref } from './resolveMarkdownLinkHref';

const SITE_ROOT = 'https://www.ag-grid.com';

/*
 * Every link form the docs sources use — `./`, `/`, bare `#`, `https://` and `mailto:` — checked
 * against the rewriting a `.md` twin gets. A twin is read detached from the site, so each has to
 * resolve without a surrounding page.
 */
const resolve = (href: string, framework: 'react' | 'angular' = 'react', pageName = 'bar-series') =>
    resolveMarkdownLinkHref({ href, framework, pageName, siteRoot: SITE_ROOT });

describe('resolveMarkdownLinkHref', () => {
    test("makes a framework-relative docs link absolute for the twin's own framework", () => {
        expect(resolve('./line-series/')).toBe('https://www.ag-grid.com/react/line-series/');
        expect(resolve('./line-series/', 'angular')).toBe('https://www.ag-grid.com/angular/line-series/');
    });

    test('makes a root-relative site link absolute', () => {
        expect(resolve('/license-pricing/')).toBe('https://www.ag-grid.com/license-pricing/');
    });

    test('anchors a same-page link to the page it was written on, not to nothing', () => {
        expect(resolve('#stacked-bars')).toBe('https://www.ag-grid.com/react/bar-series/#stacked-bars');
    });

    test('keeps the anchor on a cross-page link', () => {
        expect(resolve('./line-series/#markers')).toBe('https://www.ag-grid.com/react/line-series/#markers');
    });

    test('leaves external and mailto links untouched', () => {
        expect(resolve('https://github.com/ag-grid/ag-charts')).toBe('https://github.com/ag-grid/ag-charts');
        expect(resolve('mailto:info@ag-grid.com')).toBe('mailto:info@ag-grid.com');
    });

    test('stays site-relative when there is no canonical origin to resolve against', () => {
        expect(resolveMarkdownLinkHref({ href: '#stacked-bars', framework: 'react', pageName: 'bar-series' })).toBe(
            '/react/bar-series/#stacked-bars'
        );
    });
});
