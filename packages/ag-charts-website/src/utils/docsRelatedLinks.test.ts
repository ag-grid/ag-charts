import { describe, expect, test } from 'vitest';

import { type DocsNavItem, type RelatedLinkOverride, getDocsRelatedLinks } from './docsRelatedLinks';

const SITE_ROOT = 'https://www.ag-grid.com/';

// A cut-down nav with the shapes that matter: a section with direct items, a nested group, an
// item restricted to some frameworks, a group heading with no destination, and an external link.
const DOCS_NAV: DocsNavItem[] = [
    {
        title: 'Series',
        children: [
            { title: 'Overview', path: 'series-overview' },
            {
                title: 'Cartesian',
                children: [
                    { title: 'Bar Series', path: 'bar-series' },
                    { title: 'Line Series', path: 'line-series' },
                    { title: 'Area Series', path: 'area-series' },
                    { title: 'React Series', path: 'react-series', frameworks: ['react'] },
                    { title: 'Series Reference' },
                ],
            },
        ],
    },
];

const API_NAV: DocsNavItem[] = [
    {
        title: 'API',
        children: [
            { title: 'Create & Update', path: 'api-create-update' },
            { title: 'Events', path: 'events' },
            { title: 'GitHub', url: 'https://github.com/ag-grid/ag-charts' },
        ],
    },
];

const relatedFor = (pageName: string, framework: 'react' | 'angular' = 'angular', overrides?: RelatedLinkOverride[]) =>
    getDocsRelatedLinks({
        navSections: [DOCS_NAV, API_NAV],
        pageName,
        framework,
        siteRoot: SITE_ROOT,
        overrides,
    });

describe('getDocsRelatedLinks', () => {
    test("returns the page's nav-group siblings, in nav order, as absolute URLs", () => {
        expect(relatedFor('bar-series')).toEqual([
            { title: 'Line Series', url: 'https://www.ag-grid.com/angular/line-series/' },
            { title: 'Area Series', url: 'https://www.ag-grid.com/angular/area-series/' },
        ]);
    });

    test('resolves the URLs for the framework the twin was rendered for', () => {
        expect(relatedFor('bar-series', 'react').map(({ url }) => url)).toEqual([
            'https://www.ag-grid.com/react/line-series/',
            'https://www.ag-grid.com/react/area-series/',
            'https://www.ag-grid.com/react/react-series/',
        ]);
    });

    test('drops the page itself, headings with no destination, and other frameworks-only pages', () => {
        const titles = relatedFor('bar-series').map(({ title }) => title);

        expect(titles).not.toContain('Bar Series');
        expect(titles).not.toContain('Series Reference');
        expect(titles).not.toContain('React Series');
    });

    test("uses a section's direct items when the page is not inside a group", () => {
        // `series-overview` sits directly under Series, alongside the Cartesian group heading,
        // which is not a destination — so there is nothing else to offer.
        expect(relatedFor('series-overview')).toEqual([]);
    });

    test('falls back to the API nav for a page the docs nav does not list', () => {
        expect(relatedFor('api-create-update')).toEqual([
            { title: 'Events', url: 'https://www.ag-grid.com/angular/events/' },
            { title: 'GitHub', url: 'https://github.com/ag-grid/ag-charts' },
        ]);
    });

    test('returns nothing for a page in neither nav, rather than a fabricated list', () => {
        expect(relatedFor('some-standalone-page')).toEqual([]);
    });

    describe('frontmatter overrides', () => {
        test('replaces the derived list, titling page names from the nav', () => {
            expect(relatedFor('bar-series', 'angular', ['api-create-update', 'series-overview'])).toEqual([
                { title: 'Create & Update', url: 'https://www.ag-grid.com/angular/api-create-update/' },
                { title: 'Overview', url: 'https://www.ag-grid.com/angular/series-overview/' },
            ]);
        });

        test('titles a page the nav does not list from its slug', () => {
            expect(relatedFor('bar-series', 'angular', ['financial-charts-overview'])).toEqual([
                {
                    title: 'Financial Charts Overview',
                    url: 'https://www.ag-grid.com/angular/financial-charts-overview/',
                },
            ]);
        });

        test('takes an explicit title and URL for anything off the docs tree', () => {
            expect(
                relatedFor('bar-series', 'angular', [{ title: 'Licence & Pricing', url: '/license-pricing/' }])
            ).toEqual([{ title: 'Licence & Pricing', url: 'https://www.ag-grid.com/license-pricing/' }]);
        });

        test('an empty override list leaves the derived links in place', () => {
            expect(relatedFor('bar-series', 'angular', [])).toHaveLength(2);
        });
    });
});
