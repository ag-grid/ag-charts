import { describe, expect, test } from 'vitest';

import { buildChartsFrontmatter, chartsSiteFrontmatter, getFooterRelatedLinks, llmsTxtUrl } from './chartsFrontmatter';

const SITE_ROOT = 'https://www.ag-grid.com';

// These assertions read the real footer.json, so they check the derivation against the grouping
// the site actually ships rather than a fixture that could disagree with it.
describe('getFooterRelatedLinks', () => {
    const titlesFor = (pageUrl: string) =>
        getFooterRelatedLinks({ pageUrl, siteRoot: SITE_ROOT }).map(({ title }) => title);

    test("returns the other pages in the page's own footer group", () => {
        expect(titlesFor('/roadmap/')).toContain('Changelog');
        expect(titlesFor('/roadmap/')).toContain('Documentation Archive');
        expect(titlesFor('/contact/')).toContain('About');
        expect(titlesFor('/contact/')).toContain('Privacy Policy');
    });

    test('excludes the page itself', () => {
        expect(titlesFor('/roadmap/')).not.toContain('Roadmap');
        expect(titlesFor('/contact/')).not.toContain('Contact Us');
    });

    test('makes internal links absolute and leaves external ones whole', () => {
        const links = getFooterRelatedLinks({ pageUrl: '/license-pricing/', siteRoot: SITE_ROOT });
        const bySource = Object.fromEntries(links.map(({ title, url }) => [title, url]));

        expect(bySource['Security']).toBe('https://www.ag-grid.com/r/security/');
        expect(bySource['Stack Overflow']).toBe('https://stackoverflow.com/questions/tagged/ag-charts');
    });

    test('matches a footer entry written with the origin and the /charts base path', () => {
        // The footer lists the sitemap as a full production URL, so the comparison has to ignore
        // both the origin and the base path the charts site is served under.
        expect(titlesFor('/sitemap/')).toContain('About');
    });

    test('returns nothing for a page the footer does not list, or when no page is given', () => {
        expect(getFooterRelatedLinks({ pageUrl: '/gallery/simple-bar/', siteRoot: SITE_ROOT })).toEqual([]);
        expect(getFooterRelatedLinks({ siteRoot: SITE_ROOT })).toEqual([]);
    });
});

describe('llmsTxtUrl', () => {
    test('points at the llms.txt of the site the twin is served from', () => {
        expect(llmsTxtUrl(SITE_ROOT)).toBe('https://www.ag-grid.com/llms.txt');
    });

    test('stays site-relative when there is no site root to resolve against', () => {
        expect(llmsTxtUrl()).toBe('/llms.txt');
    });
});

describe('chartsSiteFrontmatter', () => {
    test('names the product and the llms.txt index alongside the related links', () => {
        const fields = chartsSiteFrontmatter({ pageUrl: '/roadmap/', siteRoot: SITE_ROOT });

        expect(fields.product).toBe('AG Charts');
        expect(fields.llmsTxt).toBe('https://www.ag-grid.com/llms.txt');
        expect(fields.related?.length).toBeGreaterThan(0);
    });
});

describe('buildChartsFrontmatter', () => {
    test("emits the page's own fields and the site-wide ones in one block", () => {
        const output = buildChartsFrontmatter({
            pageUrl: '/roadmap/',
            siteRoot: SITE_ROOT,
            title: 'AG Charts Roadmap',
            description: 'What is coming next.',
        });

        expect(output.startsWith('---\nproduct: "AG Charts"\ntitle: "AG Charts Roadmap"')).toBe(true);
        expect(output).toContain('description: "What is coming next."');
        expect(output).toContain('    - title: "Changelog"');
        expect(output.trimEnd().endsWith('llms: "https://www.ag-grid.com/llms.txt"\n---')).toBe(true);
    });

    test('lets a page override the derived related links', () => {
        const output = buildChartsFrontmatter({
            pageUrl: '/roadmap/',
            siteRoot: SITE_ROOT,
            title: 'AG Charts Roadmap',
            related: [{ title: 'Gallery', url: 'https://www.ag-grid.com/charts/gallery/' }],
        });

        expect(output).toContain('    - title: "Gallery"');
        expect(output).not.toContain('Changelog');
    });
});
