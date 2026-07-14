import { SITE_BASE_URL } from '../../constants';
import { PRODUCTION_CSP_PHASE, getAstroRedirectRules, getHtaccessContent, getRedirectRules } from './htaccessRules';

// Pin the base URL to the production `/charts` value so the rendered output (and the snapshots
// below) are deterministic regardless of the ambient test env, which otherwise resolves the base
// to `/`. Scoped to this file; other suites keep the ambient base.
vi.mock('../../constants', async (importActual) => {
    const actual = await importActual<typeof import('../../constants')>();
    return { ...actual, SITE_BASE_URL: '/charts/' };
});

describe('htaccessRules CSP (AG-17134)', () => {
    const production = getHtaccessContent({ env: 'production' });
    const staging = getHtaccessContent({ env: 'staging' });

    const ifOpen = '<If "%{REQUEST_URI} =~ m#/(examples|archive)/#">';
    const unconditionalLines = (content: string) => content.split('\n').filter((l) => !l.startsWith(' '));
    const extractIfBlock = (content: string) => {
        const start = content.indexOf(ifOpen);
        const end = content.indexOf('</If>', start);
        expect(start).toBeGreaterThan(-1);
        expect(end).toBeGreaterThan(start);
        return content.slice(start, end);
    };

    it('emits a CSP header in both environments', () => {
        expect(production).toContain('Content-Security-Policy');
        expect(staging).toContain('Content-Security-Policy');
    });

    it('staging: unconditional enforced policy has no unsafe-eval but keeps unsafe-inline', () => {
        const setLine = unconditionalLines(staging).find((l) =>
            l.startsWith('Header always set Content-Security-Policy "')
        );
        expect(setLine).toBeDefined();
        expect(setLine).not.toContain("'unsafe-eval'");
        expect(setLine).toContain("'unsafe-inline'");
    });

    it('staging: <If> override re-sets the enforced policy with unsafe-eval for example/archive paths', () => {
        const ifBlock = extractIfBlock(staging);
        expect(ifBlock).toContain('Header always unset Content-Security-Policy\n');
        expect(ifBlock).toContain("'unsafe-eval'");
    });

    it('staging: site-wide set precedes the <If> override', () => {
        expect(staging.indexOf('Header always set Content-Security-Policy "')).toBeLessThan(staging.indexOf(ifOpen));
    });

    if (PRODUCTION_CSP_PHASE === 'report-only') {
        it('production (report-only window): keeps enforcing the previous policy with unsafe-eval', () => {
            const enforced = unconditionalLines(production).find((l) =>
                l.startsWith('Header always set Content-Security-Policy "')
            );
            expect(enforced).toBeDefined();
            expect(enforced).toContain("'unsafe-eval'");
        });

        it('production (report-only window): reports on the tightened site policy without unsafe-eval', () => {
            const reportOnly = unconditionalLines(production).find((l) =>
                l.startsWith('Header always set Content-Security-Policy-Report-Only "')
            );
            expect(reportOnly).toBeDefined();
            expect(reportOnly).not.toContain("'unsafe-eval'");
        });

        it('production (report-only window): the <If> override only swaps the report-only header', () => {
            const ifBlock = extractIfBlock(production);
            expect(ifBlock).toContain('Header always unset Content-Security-Policy-Report-Only\n');
            expect(ifBlock).not.toContain('Header always set Content-Security-Policy "');
        });
    } else {
        it('production (enforced): unconditional enforced policy has no unsafe-eval', () => {
            const enforced = unconditionalLines(production).find((l) =>
                l.startsWith('Header always set Content-Security-Policy "')
            );
            expect(enforced).toBeDefined();
            expect(enforced).not.toContain("'unsafe-eval'");
        });
    }
});

describe('htaccessRules redirects (SE-60/SE-61)', () => {
    const rules = getRedirectRules();
    // The base ('' once trailing slash is stripped, or '/charts' in build envs) is spliced into
    // every pattern and target. Assertions are written against the base-relative remainder so they
    // hold regardless of the resolved base.
    const base = (SITE_BASE_URL ?? '').replace(/\/$/, '');

    it('does not 410 the archive — archived version docs are live, indexed content', () => {
        // Regression guard: a blanket `^/archive(/.*)?$` 410 removed every /archive/<version>/ page
        // (real archived docs listed on /documentation-archive and in the sitemap). Must not return.
        expect(rules).not.toContain(`RedirectMatch 410 "^${base}/archive(/.*)?$"`);
        // Scoped to archive: no 410 rule may target an /archive path. Unrelated 410s are allowed.
        const gone410 = rules.split('\n').filter((l) => l.startsWith('RedirectMatch 410'));
        expect(gone410.some((l) => l.includes(`${base}/archive`))).toBe(false);
    });

    it('sends the bare archive index to the live archived-versions landing, without touching version docs', () => {
        const bareArchive = new RegExp(`^${base}/archive/?$`);
        expect(rules).toContain(`RedirectMatch 301 "^${base}/archive/?$" "${base}/documentation-archive/"`);
        expect(bareArchive.test(`${base}/archive`)).toBe(true);
        expect(bareArchive.test(`${base}/archive/`)).toBe(true);
        // every version's docs still serve — the bare-index rule must not swallow them
        expect(bareArchive.test(`${base}/archive/13.0.0/`)).toBe(false);
        expect(bareArchive.test(`${base}/archive/14.0.0/`)).toBe(false);
    });

    it('returns 410 Gone for the legacy privacy path (no charts-scoped privacy page ever existed)', () => {
        expect(rules).toContain(`RedirectMatch 410 "^${base}/privacy(/.*)?$"`);
        // must NOT still 301 to the apex policy page
        expect(rules).not.toContain(`RedirectMatch 301 "^${base}/privacy(/.*)?$" "https://www.ag-grid.com/privacy/"`);
    });

    it('410 rules carry no destination', () => {
        const goneLines = rules.split('\n').filter((l) => l.startsWith('RedirectMatch 410'));
        expect(goneLines.length).toBe(1); // privacy only — archive is a 301 to the archived-versions landing
        goneLines.forEach((l) => expect(l.split('"').length).toBe(3)); // only one quoted token (the pattern)
    });

    it('rewrites legacy {fw}-charts/{fw}/<page> to the current {fw}/<page> scheme', () => {
        expect(rules).toContain(`RedirectMatch 301 "^${base}/react-charts/react/(.+)$" "${base}/react/$1"`);
        expect(rules).toContain(`RedirectMatch 301 "^${base}/enterprise-charts/react/(.+)$" "${base}/react/$1"`);
    });

    it('does not redirect an empty {fw}-charts/{fw}/ docs root (no broad fallback for these frameworks)', () => {
        const emptyDocsRoot = `${base}/react-charts/react/`;
        const docsRule = new RegExp(`^${base}/react-charts/react/(.+)$`);
        // The page-preserving rule requires a non-empty slug, so an empty docs root does not match it.
        expect(docsRule.test(emptyDocsRoot)).toBe(false);
        // The broad "^/{fw}-charts/.+$ → quick-start" fallbacks were removed for javascript/angular/
        // react/vue, so nothing redirects the empty root — it is left to serve/404.
        for (const fw of ['javascript', 'angular', 'react', 'vue']) {
            expect(rules).not.toContain(`"^${base}/${fw}-charts/(?!index\\.html$).+$"`);
        }
    });

    it('preserves the page for framework-agnostic core/side legacy layouts (under javascript)', () => {
        expect(rules).toContain(`RedirectMatch 301 "^${base}/core/(.*)" "${base}/javascript/$1"`);
        expect(rules).toContain(`RedirectMatch 301 "^${base}/side/(.*)" "${base}/javascript/$1"`);
    });

    it('maps legacy aggregate index pages to the first page of the matching nav section', () => {
        expect(rules).toContain(
            `RedirectMatch 301 "^${base}/(javascript|angular|react|vue)/series(/.*)?$" "${base}/$1/bar-series/"`
        );
        expect(rules).toContain(
            `RedirectMatch 301 "^${base}/(javascript|angular|react|vue)/axes(/.*)?$" "${base}/$1/axes-configuration/"`
        );
    });

    it('routes server-side-rendering to a framework-scoped page', () => {
        expect(rules).toContain(
            `RedirectMatch 301 "^${base}/server-side-rendering(/.*)?$" "${base}/javascript/server-side-rendering/"`
        );
    });

    it('enterprise-charts fallback redirects sub-paths only, never the live landing page', () => {
        const fallbacks = [
            {
                pattern: `^${base}/enterprise-charts/(?!index\\.html$).+$`,
                sub: `${base}/enterprise-charts/license-pricing`,
            },
        ];
        for (const { pattern, sub } of fallbacks) {
            expect(rules).toContain(`RedirectMatch 301 "${pattern}"`);
            const re = new RegExp(pattern);
            const landing = sub.replace(/\/[^/]+$/, '/'); // e.g. /charts/react-charts/
            expect(re.test(landing)).toBe(false); // live marketing landing page must not be redirected
            expect(re.test(landing.replace(/\/$/, ''))).toBe(false); // nor its bare (no trailing slash) form
            // The DirectoryIndex resource must not match: Apache's mod_dir resolves a bare
            // "/{fw}-charts/" request via an internal sub-request for ".../index.html" that mod_alias
            // re-evaluates, so a rule matching "index.html" fires on the landing page — an infinite
            // loop for enterprise-charts (whose target is its own directory). This is the assertion
            // the original `.+$` guard was missing.
            expect(re.test(`${landing}index.html`)).toBe(false);
            expect(re.test(sub)).toBe(true); // legacy sub-paths still redirect
        }
    });

    it('emits the SE-60 renamed-slug redirects', () => {
        expect(rules).toContain(`Redirect 301 ${base}/react/line/ ${base}/react/line-series/`);
        expect(rules).toContain(
            `Redirect 301 ${base}/javascript/toolbar/ ${base}/javascript/financial-charts-toolbar/`
        );
    });

    it('astro redirect map excludes pattern-match and gone rules', () => {
        const astro = getAstroRedirectRules() ?? {};
        // gone rules have no `from`; pattern rules have no `from` either — only simple `from` redirects appear.
        expect(Object.keys(astro)).toContain('/react/line/');
        expect(Object.keys(astro).some((k) => k.includes('archive') || k.includes('privacy'))).toBe(false);
        expect(Object.keys(astro).some((k) => k.includes('(.*)'))).toBe(false);
    });
});

describe('generated redirect rules snapshot', () => {
    // Full-output regression guard. Renders under the pinned `/charts` base (see vi.mock above), so
    // the snapshots show the production-prefixed rules, e.g. `RedirectMatch 410 "^/charts/archive(/.*)?$"`.
    it('redirect rules output is unchanged', () => {
        expect(getRedirectRules()).toMatchSnapshot();
    });

    it('production .htaccess is unchanged', () => {
        expect(getHtaccessContent({ env: 'production' })).toMatchSnapshot();
    });

    it('staging .htaccess is unchanged', () => {
        expect(getHtaccessContent({ env: 'staging' })).toMatchSnapshot();
    });
});
