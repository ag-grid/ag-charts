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

    it('marks the legacy privacy path as 410 Gone (no charts-scoped privacy page; must not 301 to apex)', () => {
        expect(rules).toContain(`RedirectMatch 410 "^${base}/privacy(/.*)?$"`);
        expect(rules).not.toContain(`RedirectMatch 301 "^${base}/privacy(/.*)?$"`);
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

describe('htaccessRules markdown content negotiation', () => {
    const production = getHtaccessContent({ env: 'production' });
    const staging = getHtaccessContent({ env: 'staging' });
    // Rendered under the pinned `/charts` base (see vi.mock above), so the negotiated paths carry
    // the deployed prefix. %1 (base included, leading slash excluded) is the document-root-relative
    // path reused in the -f test and the rewrite target.
    const negotiationRules = [
        'RewriteCond %{HTTP_ACCEPT} text/markdown',
        'RewriteCond %{REQUEST_URI} ^/(charts/(?:(?:react|angular|vue|javascript)/[^/]+?|license-pricing|community(?:/(?:events|showcase|tools-extensions|media|beyond-the-prompt))?|documentation-archive|gallery))/?$',
        'RewriteCond %{DOCUMENT_ROOT}/%1.md -f',
        'RewriteRule ^ /%1.md [L]',
    ];

    it('serves the per-page .md variant when Accept: text/markdown, gated by an on-disk check', () => {
        for (const content of [production, staging]) {
            expect(content).toContain('<IfModule mod_rewrite.c>');
            expect(content).toContain('RewriteEngine On');
            for (const rule of negotiationRules) {
                expect(content).toContain(rule);
            }
        }
    });

    it('negotiates the top-level twins (license-pricing, community + subpages, documentation-archive) alongside framework docs pages', () => {
        for (const content of [production, staging]) {
            expect(content).toContain(
                '|license-pricing|community(?:/(?:events|showcase|tools-extensions|media|beyond-the-prompt))?|documentation-archive|gallery))/?$'
            );
            // changelog/pipeline are out of scope for this branch — they must not be negotiated.
            expect(content).not.toContain('changelog');
            expect(content).not.toContain('pipeline');
        }
    });

    it('adds Vary: Accept for negotiated paths (both envs) so shared caches key on the negotiated representation', () => {
        for (const content of [production, staging]) {
            expect(content).toContain(
                '<If "%{REQUEST_URI} =~ m#^/charts/(?:(?:react|angular|vue|javascript)/[^/]+|license-pricing|community(?:/(?:events|showcase|tools-extensions|media|beyond-the-prompt))?|documentation-archive|gallery)/?$#">'
            );
            expect(content).toContain('Header append Vary Accept');
        }
    });

    it('registers the markdown MIME type so the .md files are served as text/markdown', () => {
        expect(production).toContain('AddType text/markdown md');
        expect(staging).toContain('AddType text/markdown md');
    });

    it('serves .md as UTF-8 so table glyphs (✓/✗) are not mojibaked', () => {
        expect(production).toContain('AddCharset utf-8 .md');
        expect(staging).toContain('AddCharset utf-8 .md');
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
