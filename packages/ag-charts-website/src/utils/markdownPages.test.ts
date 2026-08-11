import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CHARTS_MARKDOWN_PAGE_GROUPS, markdownPathAlternation, markdownPathPatterns } from './markdownPages';

const DIST = join(__dirname, '../../../../dist/packages/ag-charts-website');
const SITEMAP = join(DIST, 'sitemap-0.xml');

// The ambient test env has no site base, so the patterns anchor at `/` and are matched below
// against base-relative paths.
const patterns = markdownPathPatterns();
const isNegotiable = (pathname: string) => patterns.some((pattern) => pattern.test(pathname));

describe('CHARTS_MARKDOWN_PAGE_GROUPS', () => {
    it('produces patterns valid in both JavaScript and Apache PCRE', () => {
        // The alternation is embedded in a RewriteCond and an <If> expression, so it must avoid
        // constructs PCRE lacks or that would break the `m#...#` delimiters.
        const alternation = markdownPathAlternation();
        expect(() => new RegExp(`^/(${alternation})/?$`)).not.toThrow();
        expect(alternation).not.toContain('#');
        expect(alternation).not.toMatch(/\(\?<[=!]/); // lookbehind
        expect(alternation).not.toMatch(/\(\?<[A-Za-z]/); // named groups
    });

    it('never matches a .md URL, so negotiation cannot loop into .md.md', () => {
        expect(isNegotiable('/react/axes-types.md')).toBe(false);
        expect(isNegotiable('/roadmap.md')).toBe(false);
        expect(isNegotiable('/gallery/simple-bar.md')).toBe(false);
        expect(isNegotiable('/session/opening-keynote.md')).toBe(false);
    });

    it('documents every group, so the registry reads as the list it is', () => {
        for (const group of CHARTS_MARKDOWN_PAGE_GROUPS) {
            expect(group.describes, JSON.stringify(group)).toBeTruthy();
        }
    });
});

/**
 * The Options and Themes API reference. Both render client-side from the generated interface
 * reference, so a twin would need a markdown rendering of that whole tree — a separate piece of
 * work, and the one documented gap in the "every sitemap URL has a twin" rule (`llms.txt` and
 * `AGENTS.md` say so explicitly).
 */
const isApiReferencePage = (pathname: string) => /\/(?:options|themes-api)(?:\/|$)/.test(pathname);

/**
 * Twins generated on production by grid's Jira cron (`scripts/jira/production/getCharts*` in the
 * ag-grid repo) rather than by this build, so they are absent from a local `dist` by design. Their
 * pages advertise the `.md` only in production for the same reason.
 */
const CRON_GENERATED_TWINS = ['/changelog/', '/pipeline/'];

function builtSitemapPaths(): string[] {
    if (!existsSync(SITEMAP)) {
        return [];
    }
    return [...readFileSync(SITEMAP, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
        (match) => new URL(match[1]).pathname
    );
}

// Gate on a *complete* build: an absent dist (a plain unit run) or a half-written one (a build in
// flight) skips rather than fails, since neither says anything about page coverage. The site has
// ~750 pages, so this threshold cannot be met by a partial build of the non-docs pages alone.
const sitemapPaths = builtSitemapPaths();
const hasCompleteBuild = sitemapPaths.length > 500;

// The site is served under a base (`/charts`), which the sitemap carries but `dist` does not — the
// dist root *is* that base. The site root is the shortest path in any sitemap, so it gives the base
// without depending on the env the build ran under.
const sitemapBase = hasCompleteBuild
    ? sitemapPaths.reduce((shortest, path) => (path.length < shortest.length ? path : shortest)).replace(/\/$/, '')
    : '';
const baseRelative = (pathname: string) => pathname.slice(sitemapBase.length) || '/';

// The invariant this whole feature rests on: an agent can append `.md` to any URL in the sitemap.
// Requires a build (`nx build ag-charts-website`); skipped otherwise so unit runs stay fast.
describe.runIf(hasCompleteBuild)('every sitemap URL has a .md twin in dist', () => {
    const missing = sitemapPaths.filter((pathname) => {
        const trimmed = baseRelative(pathname).replace(/\/$/, '');
        // The homepage twin is index.md — the site root has no segment to suffix.
        const twin = trimmed === '' ? 'index.md' : `${trimmed.slice(1)}.md`;
        return !existsSync(join(DIST, twin));
    });

    // Guard against a vacuous pass: if filtering ever empties the set, the assertions below would
    // hold trivially and the check would silently stop protecting anything.
    it('checks a full sitemap', () => {
        expect(sitemapPaths.length).toBeGreaterThan(500);
        expect(sitemapBase).toBe('/charts');
    });

    it('emits a .md file next to every page, bar the documented exceptions', () => {
        const unexplained = missing.filter(
            (pathname) => !isApiReferencePage(pathname) && !CRON_GENERATED_TWINS.includes(baseRelative(pathname))
        );
        expect(unexplained, `${unexplained.length} sitemap URLs have no .md twin`).toEqual([]);
    });

    it('routes every page with a twin through the negotiation patterns', () => {
        // A twin that exists on disk but is not in the registry would never be served on
        // `Accept: text/markdown`, so the two must agree.
        const unroutable = sitemapPaths
            .map(baseRelative)
            .filter((pathname) => pathname !== '/' && !isApiReferencePage(pathname) && !isNegotiable(pathname));
        expect(unroutable, `${unroutable.length} pages have a twin but no negotiation rule`).toEqual([]);
    });

    it('keeps the API reference exclusion honest — it is still in the sitemap and still untwinned', () => {
        // If the reference gains twins, this fails and `isApiReferencePage` must go, rather than
        // quietly staying as a place real gaps could hide.
        const apiPages = sitemapPaths.filter(isApiReferencePage);
        expect(apiPages.length).toBeGreaterThan(50);
        expect(missing.filter(isApiReferencePage)).toEqual(apiPages);
    });

    it('keeps the cron-generated exclusion free of stale entries', () => {
        for (const pathname of CRON_GENERATED_TWINS) {
            expect(sitemapPaths.map(baseRelative), `${pathname} is no longer in the sitemap`).toContain(pathname);
        }
    });

    it('leaves the contact result pages out of the sitemap entirely', () => {
        // Post-submission confirmations: robots-disallowed, so listing them would contradict
        // robots.txt. They have no twin by design (see sitemap.ts).
        const relative = sitemapPaths.map(baseRelative);
        expect(relative).not.toContain('/contact/success/');
        expect(relative).not.toContain('/contact/failure/');
        expect(relative).toContain('/contact/');
    });
});
