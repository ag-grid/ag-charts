import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getSitemapConfig } from './sitemap';
import { getIgnoredPages, getSitemapIgnorePaths } from './sitemapPages';
import { aiCrawlerGroup, isAllowed, wildcardGroup } from './test/robotsMatcher';
import { enumerablePageFiles } from './test/siteRoutes';

// The disallow list is published as /charts/robots-disallow.json with the production base, which
// the grid root robots.txt prints verbatim, so the paths are asserted under `/charts`.
vi.mock('../constants', async (importActual) => {
    const actual = await importActual<typeof import('../constants')>();
    return { ...actual, SITE_BASE_URL: '/charts/' };
});

// The docs collection as the build sees it: every page, with its `hidden` frontmatter flag.
const { docsEntries } = vi.hoisted(() => ({ docsEntries: [] as { id: string; data: { hidden: boolean } }[] }));
const DOCS_DIR = fileURLToPath(new URL('../content/docs', import.meta.url));
// A directory without an index.mdoc (such as api-explorer, which holds only notes) is not a page.
for (const id of readdirSync(DOCS_DIR).filter(
    (name) => !name.startsWith('_') && existsSync(join(DOCS_DIR, name, 'index.mdoc'))
)) {
    const frontmatter = readFileSync(join(DOCS_DIR, id, 'index.mdoc'), 'utf8').split(/^---$/m)[1] ?? '';
    docsEntries.push({ id, data: { hidden: /^hidden:\s*true\s*$/m.test(frontmatter) } });
}
const HIDDEN_DOCS = docsEntries.filter(({ data }) => data.hidden).map(({ id }) => id);

vi.mock('astro:content', () => ({ getCollection: () => Promise.resolve(docsEntries) }));
vi.mock('./pages', () => ({
    getDebugPageUrls: () => Promise.resolve(['/charts/debug/dev-files', '/charts/debug/docs-examples']),
}));

const FRAMEWORKS = ['react', 'angular', 'vue', 'javascript'];

describe('getIgnoredPages', () => {
    test('disallows versioned archive content, with a trailing slash', () => {
        expect(getIgnoredPages()).toContain('/charts/archive/');
    });

    test('does not disallow the bare /archive redirect, so SE-182 stays crawlable', () => {
        expect(getIgnoredPages()).not.toContain('/charts/archive');
    });
});

describe('getSitemapIgnorePaths, as the root robots.txt applies it', () => {
    let disallow: string[] = [];
    beforeAll(async () => {
        disallow = await getSitemapIgnorePaths();
    });

    const blockedForSearch = (path: string) => !isAllowed(wildcardGroup(disallow), path);
    const blockedForAi = (path: string) => !isAllowed(aiCrawlerGroup(disallow), path);

    test('reads the hidden docs pages from the collection', () => {
        expect(HIDDEN_DOCS).toEqual(expect.arrayContaining(['selection-test', 'sparklines', 'benchmarks']));
    });

    test('blocks every hidden docs page, for every framework, from every crawler', () => {
        for (const page of HIDDEN_DOCS) {
            for (const framework of FRAMEWORKS) {
                const url = `/charts/${framework}/${page}/`;
                expect(blockedForSearch(url), url).toBe(true);
                expect(blockedForAi(url), url).toBe(true);
            }
        }
    });

    test('blocks the markdown twin of every blocked page too (waf-finding §11, B15)', () => {
        // A Disallow on `<page>/` does not cover `<page>.md`, which the build emits beside it and
        // agents are told to fetch: /charts/react/selection-test.md was crawlable live.
        const pages = [
            ...HIDDEN_DOCS.flatMap((page) => FRAMEWORKS.map((framework) => `/charts/${framework}/${page}`)),
            '/charts/react/active-e2e',
            '/charts/vue/benchmarks',
        ];
        for (const page of pages) {
            expect(blockedForSearch(`${page}.md`), `${page}.md`).toBe(true);
            expect(blockedForAi(`${page}.md`), `${page}.md`).toBe(true);
        }
    });

    test('blocks internal test pages and fixtures from every crawler', () => {
        for (const url of [
            '/charts/react/rtl-e2e/',
            '/charts/javascript/benchmarks/',
            '/charts/gallery-test/',
            '/charts/internal-demos/x/',
            '/charts/debug/dev-files/',
            '/charts/404.html',
            '/charts/contact/success/',
            '/charts/contact/failure/',
            '/charts/changelog/releases/32.0.0/',
        ]) {
            expect(blockedForSearch(url), url).toBe(true);
            expect(blockedForAi(url), url).toBe(true);
        }
    });

    test('keeps examples and archived versions out of search but open to AI crawlers', () => {
        for (const url of [
            '/charts/react/bar-series/examples/simple-bar/',
            '/charts/gallery/examples/simple-bar/',
            '/charts/archive/14.2.0/react/bar-series/',
            '/charts/archive/14.2.0/react/bar-series.md',
        ]) {
            expect(blockedForSearch(url), url).toBe(true);
            expect(blockedForAi(url), url).toBe(false);
        }
    });

    test('leaves real pages, their twins and the redirect hubs crawlable by everyone', () => {
        for (const url of [
            '/charts/',
            '/charts/index.md',
            '/charts/react/bar-series/',
            '/charts/react/bar-series.md',
            '/charts/react/selection/',
            '/charts/react/selection.md',
            '/charts/gallery/',
            '/charts/gallery/simple-bar/',
            '/charts/examples/',
            '/charts/examples-web-analytics/',
            '/charts/changelog/',
            '/charts/r/react/',
            // SE-182: the bare archive URL 301s to the documentation archive, which must stay visible.
            '/charts/archive',
            '/charts/documentation-archive/',
        ]) {
            expect(blockedForSearch(url), url).toBe(false);
            expect(blockedForAi(url), url).toBe(false);
        }
    });

    test('never blocks a page the sitemap submits, which Search Console reports as an error', () => {
        const { filter } = getSitemapConfig('/charts', HIDDEN_DOCS);
        const pages = enumerablePageFiles('/charts')
            .filter((file) => file.endsWith('/index.html'))
            .map((file) => file.replace(/index\.html$/, ''));
        const submitted = pages.filter((page) => filter(`https://www.ag-grid.com${page}`));
        expect(submitted.length).toBeGreaterThan(100);
        for (const page of submitted) {
            expect(blockedForSearch(page), page).toBe(false);
        }
    });

    test('publishes only base-prefixed paths, so the root robots.txt cannot block another site', () => {
        for (const path of disallow) {
            expect(path, path).toMatch(/^\/charts\//);
        }
    });
});
