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

    it('emits 410 Gone rules with no target for permanently-removed paths', () => {
        expect(rules).toContain(`RedirectMatch 410 "^${base}/archive(/.*)?$"`);
    });

    it('redirects the legacy privacy path to the canonical apex policy page', () => {
        expect(rules).toContain(`RedirectMatch 301 "^${base}/privacy(/.*)?$" "https://www.ag-grid.com/privacy/"`);
    });

    it('410 rules carry no destination', () => {
        const goneLines = rules.split('\n').filter((l) => l.startsWith('RedirectMatch 410'));
        expect(goneLines.length).toBe(1);
        goneLines.forEach((l) => expect(l.split('"').length).toBe(3)); // only one quoted token (the pattern)
    });

    it('rewrites legacy {fw}-charts/{fw}/<page> to the current {fw}/<page> scheme', () => {
        expect(rules).toContain(`RedirectMatch 301 "^${base}/react-charts/react/(.+)$" "${base}/react/$1"`);
        expect(rules).toContain(`RedirectMatch 301 "^${base}/enterprise-charts/react/(.+)$" "${base}/react/$1"`);
    });

    it('sends an empty docs-scheme root to quick-start in a single hop (no chain via {fw}/)', () => {
        const emptyDocsRoot = `${base}/react-charts/react/`;
        const docsRule = new RegExp(`^${base}/react-charts/react/(.+)$`);
        const broadFallback = new RegExp(`^${base}/react-charts/.+$`);
        // The page-preserving rule must NOT match an empty slug (that would target the bare `/react/`
        // root and chain through `^/react/?$`); the broad fallback catches it → quick-start directly.
        expect(docsRule.test(emptyDocsRoot)).toBe(false);
        expect(broadFallback.test(emptyDocsRoot)).toBe(true);
        expect(rules).toContain(`RedirectMatch 301 "^${base}/react-charts/.+$" "${base}/react/quick-start/"`);
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

    it('broad {fw}-charts fallbacks redirect sub-paths only, never the live landing page', () => {
        const fallbacks = [
            { pattern: `^${base}/enterprise-charts/.+$`, sub: `${base}/enterprise-charts/license-pricing` },
            { pattern: `^${base}/javascript-charts/.+$`, sub: `${base}/javascript-charts/whats-new` },
            { pattern: `^${base}/angular-charts/.+$`, sub: `${base}/angular-charts/whats-new` },
            { pattern: `^${base}/react-charts/.+$`, sub: `${base}/react-charts/whats-new` },
            { pattern: `^${base}/vue-charts/.+$`, sub: `${base}/vue-charts/whats-new` },
        ];
        for (const { pattern, sub } of fallbacks) {
            expect(rules).toContain(`RedirectMatch 301 "${pattern}"`);
            const re = new RegExp(pattern);
            const landing = sub.replace(/\/[^/]+$/, '/'); // e.g. /charts/react-charts/
            expect(re.test(landing)).toBe(false); // live marketing landing page must not be redirected
            expect(re.test(landing.replace(/\/$/, ''))).toBe(false); // nor its bare (no trailing slash) form
            expect(re.test(sub)).toBe(true); // legacy sub-paths still redirect
        }
    });

    it('410 rules win over the broad rules: they are emitted first', () => {
        expect(rules.indexOf('RedirectMatch 410')).toBeLessThan(rules.indexOf(`"^${base}/core/(.*)"`));
    });

    it('emits the SE-60 renamed-slug redirects', () => {
        expect(rules).toContain(`Redirect 301 ${base}/react/line/ ${base}/react/line-series/`);
        expect(rules).toContain(
            `Redirect 301 ${base}/javascript/toolbar/ ${base}/javascript/financial-charts-toolbar/`
        );
    });

    it('SE-59: page-exact 301s the 5 community pages to the canonical grid apex (anchored, no /charts on target)', () => {
        const apex = 'https://www.ag-grid.com/community';
        // The base-relative pattern gets the base spliced in (→ ^/charts/community/...); the absolute
        // apex `to` passes through urlWithBaseUrl unchanged. `/?$` anchors to the bare page URL with an
        // optional trailing slash so assets under the path are NOT matched. Trailing-slash target = no chain.
        expect(rules).toContain(`RedirectMatch 301 "^${base}/community/?$" "${apex}/"`);
        expect(rules).toContain(
            `RedirectMatch 301 "^${base}/community/tools-extensions/?$" "${apex}/tools-extensions/"`
        );
        expect(rules).toContain(`RedirectMatch 301 "^${base}/community/showcase/?$" "${apex}/showcase/"`);
        expect(rules).toContain(`RedirectMatch 301 "^${base}/community/events/?$" "${apex}/events/"`);
        expect(rules).toContain(`RedirectMatch 301 "^${base}/community/media/?$" "${apex}/media/"`);
    });

    it('SE-59: community rules are anchored RedirectMatch (not a prefix Redirect) and never sweep assets', () => {
        const communityLines = rules.split('\n').filter((l) => l.includes('/community/'));
        expect(communityLines.length).toBe(5);
        communityLines.forEach((l) => {
            // Must be an anchored RedirectMatch with a `/?$` tail — NOT a bare prefix `Redirect`.
            expect(l.startsWith('RedirectMatch 301 ')).toBe(true);
            expect(l).toMatch(/\/\?\$"/);
            // Target (after the pattern) must be the absolute apex URL, never charts-relative.
            const target = l.split('" "')[1]?.replace(/"$/, '');
            expect(target).toMatch(/^https:\/\/www\.ag-grid\.com\/community\//);
        });
        // An asset path served under a community page must NOT match any community rule.
        const assetPath = `${base}/community/tools-extensions/streamlit-aggrid.webp`;
        const communityPatterns = communityLines.map((l) => new RegExp(l.split('"')[1]));
        expect(communityPatterns.some((re) => re.test(assetPath))).toBe(false);
        // The bare page URL (with and without trailing slash) must match its rule.
        expect(new RegExp(`^${base}/community/tools-extensions/?$`).test(`${base}/community/tools-extensions`)).toBe(
            true
        );
        expect(new RegExp(`^${base}/community/tools-extensions/?$`).test(`${base}/community/tools-extensions/`)).toBe(
            true
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
