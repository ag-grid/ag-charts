import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSiteStructuredData, getSocialImageUrl } from './siteSeo';
import { createSiteRouteResolver } from './test/siteRoutes';

vi.mock('../constants', async (importActual) => {
    const actual = await importActual<typeof import('../constants')>();
    return { ...actual, SITE_BASE_URL: '/charts/' };
});

const CANONICAL_URL_BASE = 'https://www.ag-grid.com/charts';

describe('getSocialImageUrl (SE-48)', () => {
    test('resolves the default card to an absolute URL under the charts base', () => {
        expect(getSocialImageUrl({ canonicalUrlBase: CANONICAL_URL_BASE })).toBe(
            'https://www.ag-grid.com/charts/images/ag-charts-social.png'
        );
    });

    test('resolves a page override, with or without a leading slash, under the charts base', () => {
        for (const image of ['images/campaigns/card.png', '/images/campaigns/card.png']) {
            expect(getSocialImageUrl({ canonicalUrlBase: CANONICAL_URL_BASE, image }), image).toBe(
                'https://www.ag-grid.com/charts/images/campaigns/card.png'
            );
        }
    });

    test('keeps an absolute override as it is', () => {
        const image = 'https://cdn.example.com/card.png';
        expect(getSocialImageUrl({ canonicalUrlBase: CANONICAL_URL_BASE, image })).toBe(image);
    });

    test('names an image the site ships', () => {
        const url = new URL(getSocialImageUrl({ canonicalUrlBase: CANONICAL_URL_BASE }));
        const publicFile = fileURLToPath(
            new URL(`../../public${url.pathname.replace(/^\/charts/, '')}`, import.meta.url)
        );
        expect(statSync(publicFile).isFile()).toBe(true);
    });
});

describe('buildSiteStructuredData', () => {
    const graph = buildSiteStructuredData({
        canonicalUrlBase: CANONICAL_URL_BASE,
        name: 'AG Charts',
        description: 'Charts',
        version: '13.2.0-beta.20260101',
    });
    const byType = (type: string) => graph.filter((node) => node['@type'] === type);
    const [product] = byType('SoftwareApplication');

    test('describes the organisation, the website and the product once each', () => {
        expect(graph.map((node) => node['@type'])).toEqual(['Organization', 'WebSite', 'SoftwareApplication']);
    });

    test('lists a single, complete offer: free Community, priced, with a real page (SE-162)', () => {
        const offers = product.offers as Record<string, unknown>[];
        expect(offers).toHaveLength(1);
        expect(offers[0]).toEqual({
            '@type': 'Offer',
            name: 'AG Charts Community',
            price: '0',
            priceCurrency: 'USD',
            url: 'https://www.ag-grid.com/charts/license-pricing/',
        });
        const path = new URL(offers[0].url as string).pathname.replace(/^\/charts/, '');
        expect(createSiteRouteResolver()(path)).toBe(true);
    });

    test('publishes the release version without its pre-release suffix', () => {
        expect(product.softwareVersion).toBe('13.2.0');
    });

    test('links the product and website to the one AG Grid organisation, with its Wikidata identity (SE-71)', () => {
        const [organization] = byType('Organization');
        expect(product.publisher).toEqual({ '@id': organization['@id'] });
        expect(byType('WebSite')[0].publisher).toEqual({ '@id': organization['@id'] });
        expect(organization.sameAs).toEqual(
            expect.arrayContaining([expect.stringMatching(/^https:\/\/www\.wikidata\.org\//)])
        );
    });
});

// The layouts are Astro templates, which these tests cannot render, so the landmark and heading
// structure is checked on the template source: one `<main>` around the page content (SE-49), the
// SE-50 viewport, and a single H1 on the homepage.
describe('page structure', () => {
    const SRC = fileURLToPath(new URL('..', import.meta.url));
    const source = (path: string) => readFileSync(join(SRC, path), 'utf8');
    // Strip comments and the frontmatter script, leaving markup.
    const markup = (text: string) =>
        text
            .replace(/^---[\s\S]*?\n---\n/, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    const templates = (dir: string): string[] =>
        readdirSync(join(SRC, dir)).flatMap((name) => {
            const path = join(dir, name);
            if (statSync(join(SRC, path)).isDirectory()) {
                return templates(path);
            }
            return /\.(astro|tsx)$/.test(name) ? [path] : [];
        });

    test('wraps the page slot of the main layout in the one <main> landmark (SE-49)', () => {
        const layout = markup(source('layouts/Layout.astro'));
        expect(layout).toMatch(/<main\b[^>]*>\s*<slot\s*\/>\s*<\/main>/);
        expect(layout.match(/<main\b/g)).toHaveLength(1);
    });

    test('declares no other <main>, so no page ends up with two', () => {
        const others = [...templates('pages'), ...templates('components'), ...templates('layouts')]
            .filter((path) => path !== join('layouts', 'Layout.astro'))
            .filter((path) => /<main\b/.test(markup(source(path))))
            .map((path) => relative(SRC, join(SRC, path)));
        expect(others).toEqual([]);
    });

    test('takes the social card and the site structured data from the builders above (SE-48, SE-162)', () => {
        const layout = source('layouts/Layout.astro');
        expect(layout).toMatch(/const socialImage = getSocialImageUrl\(/);
        expect(markup(layout)).toMatch(/<meta property="og:image" content=\{socialImage\}/);
        expect(markup(layout)).toMatch(/<meta name="twitter:image" content=\{socialImage\}/);
        expect(layout).toMatch(/\.\.\.buildSiteStructuredData\(/);
    });

    test('lets the page zoom from an initial scale of 1 (SE-50)', () => {
        expect(markup(source('layouts/Layout.astro'))).toContain(
            '<meta name="viewport" content="width=device-width, initial-scale=1" />'
        );
    });

    test('gives the homepage a single H1', () => {
        expect(markup(source('pages/index.astro')).match(/<h1\b/g)).toHaveLength(1);
    });
});
