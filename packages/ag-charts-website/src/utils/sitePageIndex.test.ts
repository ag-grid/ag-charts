import type { CategorizedSitemap } from '@ag-website-shared/components/sitemap/Sitemap';
import { describe, expect, test } from 'vitest';

import { buildSitePageIndex } from './sitePageIndex';

// URLs carry the `/charts` base path, as the production sitemap does.
const SITEMAP: CategorizedSitemap = {
    General: [
        { url: 'https://www.ag-grid.com/charts/gallery/', pageName: 'Gallery' },
        { url: 'https://www.ag-grid.com/charts/license-pricing/', pageName: 'License Pricing' },
    ],
    Javascript: [
        { url: 'https://www.ag-grid.com/charts/javascript/quick-start/', pageName: 'Quick Start' },
        { url: 'https://www.ag-grid.com/charts/javascript/hidden-page/', pageName: 'Hidden Page' },
    ],
    React: [{ url: 'https://www.ag-grid.com/charts/react/quick-start/', pageName: 'Quick Start' }],
    Community: [{ url: 'https://www.ag-grid.com/charts/community/events/', pageName: 'Events' }],
};

const build = (navPages: string[]) =>
    buildSitePageIndex({
        parsedSitemap: SITEMAP,
        navPages: new Set(navPages),
        canonicalFramework: 'javascript',
    });

describe('buildSitePageIndex', () => {
    const siteIndex = build(['quick-start']);
    const groups = Object.fromEntries(siteIndex.map(({ title, links }) => [title, links]));

    test('keeps the sitemap categories for pages that are not documentation', () => {
        expect(groups['General']).toEqual([
            { title: 'Gallery', url: 'https://www.ag-grid.com/charts/gallery/' },
            { title: 'License Pricing', url: 'https://www.ag-grid.com/charts/license-pricing/' },
        ]);
        expect(groups['Community']).toEqual([
            { title: 'Events', url: 'https://www.ag-grid.com/charts/community/events/' },
        ]);
    });

    test('drops documentation pages the navigation already lists, in every framework', () => {
        expect(siteIndex.map(({ title }) => title)).not.toContain('React');
        expect(groups['Javascript']).toBeUndefined();
        expect(JSON.stringify(siteIndex)).not.toContain('quick-start');
    });

    test('publishes a docs page the navigation does not reach, rather than dropping it', () => {
        expect(groups['Documentation > Not in the navigation']).toEqual([
            { title: 'Hidden Page', url: 'https://www.ag-grid.com/charts/javascript/hidden-page/' },
        ]);
    });

    test('lists an unreached page once, not once per framework', () => {
        const unlisted = build([]).find(({ title }) => title === 'Documentation > Not in the navigation');

        expect(unlisted?.links.map(({ title }) => title)).toEqual(['Quick Start', 'Hidden Page']);
    });

    test('drops the group entirely once the navigation covers every docs page', () => {
        expect(build(['quick-start', 'hidden-page']).map(({ title }) => title)).toEqual(['General', 'Community']);
    });
});
