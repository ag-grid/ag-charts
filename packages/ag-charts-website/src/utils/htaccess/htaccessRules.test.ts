import { SITE_BASE_URL } from '../../constants';
import { PRODUCTION_CSP_PHASE, getAstroRedirectRules, getHtaccessContent, getRedirectRules } from './htaccessRules';

// Pin the base to the production `/charts` value; the ambient test env resolves it to `/`,
// which would make the snapshots below env-dependent.
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
    // Assertions target the base-relative remainder so they hold whatever base is resolved.
    const base = (SITE_BASE_URL ?? '').replace(/\/$/, '');

    it('does not 410 the archive — archived version docs are live, indexed content', () => {
        // A blanket `^/archive(/.*)?$` 410 would remove every real /archive/<version>/ page.
        expect(rules).not.toContain(`RedirectMatch 410 "^${base}/archive(/.*)?$"`);
        // Scoped to archive: unrelated 410s are allowed.
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
        // The page-preserving rule requires a non-empty slug.
        expect(docsRule.test(emptyDocsRoot)).toBe(false);
        // No broad fallback either, so the empty root is left to serve/404.
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
            // mod_dir resolves a bare directory request through an internal sub-request for
            // index.html that mod_alias re-evaluates, so matching it loops on the landing page.
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
        // Only simple `from` redirects appear; gone and pattern rules have no `from`.
        expect(Object.keys(astro)).toContain('/react/line/');
        expect(Object.keys(astro).some((k) => k.includes('archive') || k.includes('privacy'))).toBe(false);
        expect(Object.keys(astro).some((k) => k.includes('(.*)'))).toBe(false);
    });
});

describe('htaccessRules markdown content negotiation', () => {
    const production = getHtaccessContent({ env: 'production' });
    const staging = getHtaccessContent({ env: 'staging' });
    // Assert on which URLs the generated pattern matches rather than on its literal text, which
    // would only restate CHARTS_MARKDOWN_PAGE_GROUPS.
    const extractNegotiationPattern = (content: string) => {
        const match = content.match(/RewriteCond %\{REQUEST_URI\} \^\/\((.+)\)\/\?\$/);
        expect(match).not.toBeNull();
        return new RegExp(`^/(${match![1]})/?$`);
    };

    const extractVaryPattern = (content: string) => {
        const match = content.match(/<If "%\{REQUEST_URI\} =~ m#\^\/charts\/\(\?:(.+)\)\/\?\$#/);
        expect(match).not.toBeNull();
        return new RegExp(`^/charts/(?:${match![1]})/?$`);
    };

    // One representative URL per registry group, so a group with no matching pattern shows up.
    const negotiablePaths = [
        '/charts/react/axes-types/',
        '/charts/javascript/quick-start/',
        '/charts/changelog/',
        '/charts/contact/',
        '/charts/documentation-archive/',
        '/charts/license-pricing/',
        '/charts/pipeline/',
        '/charts/roadmap/',
        '/charts/sitemap/',
        '/charts/whats-new/',
        '/charts/community/',
        '/charts/community/events/',
        '/charts/community/beyond-the-prompt/',
        '/charts/session/opening-keynote/',
        '/charts/gallery/',
        '/charts/gallery/simple-bar/',
        '/charts/javascript-charts/',
        '/charts/react-charts/',
        '/charts/angular-charts/',
        '/charts/vue-charts/',
        '/charts/enterprise-charts/',
        '/charts/options/',
        '/charts/options/axes/number/',
        '/charts/options/series/bar/',
        '/charts/options/initialState/annotations/callout/',
        '/charts/options/navigator/miniChart/series/line/',
        '/charts/themes-api/',
        '/charts/themes-api/overrides/bar/',
    ];

    // No `.md` twin: rewriting these would 404, or loop into `.md.md` for a twin itself.
    const nonNegotiablePaths = [
        '/charts/react/axes-types.md', // the twin itself — final segments exclude dots
        '/charts/react/', // framework landing page, a redirect stub
        '/charts/documentation/', // redirect stub, sitemap-excluded
        '/charts/licensing/', // redirect stub, sitemap-excluded
        '/charts/style-guide/', // non-public, sitemap-excluded
        '/charts/contact/success/', // form result, sitemap-excluded
        '/charts/contact/failure/',
        '/charts/options/series/bar.md', // the twin itself
        '/charts/options/series/', // the member path alone is not a page
        '/charts/themes-api/overrides/', // likewise
        '/charts/gallery-test/',
        '/charts/javascript/quick-start/examples/create-a-chart/',
        '/charts/debug/versions.json',
        '/charts/sitemap-0.xml',
        '/charts/sitemap-index.xml',
    ];

    it('serves the per-page .md variant when Accept: text/markdown, gated by an on-disk check', () => {
        for (const content of [production, staging]) {
            expect(content).toContain('<IfModule mod_rewrite.c>');
            expect(content).toContain('RewriteEngine On');
            expect(content).toContain('RewriteCond %{HTTP_ACCEPT} text/markdown');
            expect(content).toContain('RewriteCond %{DOCUMENT_ROOT}/%1.md -f');
            expect(content).toContain('RewriteRule ^ /%1.md [L]');
        }
    });

    it('negotiates exactly the same set of paths in both environments', () => {
        expect(extractNegotiationPattern(staging).source).toBe(extractNegotiationPattern(production).source);
    });

    it('negotiates every page group in the registry, with and without a trailing slash', () => {
        const pattern = extractNegotiationPattern(production);
        for (const path of negotiablePaths) {
            expect(pattern.test(path), `${path} should negotiate`).toBe(true);
            expect(pattern.test(path.replace(/\/$/, '')), `${path} (no trailing slash)`).toBe(true);
        }
    });

    it('leaves pages without a .md twin untouched', () => {
        const pattern = extractNegotiationPattern(production);
        for (const path of nonNegotiablePaths) {
            expect(pattern.test(path), `${path} should not negotiate`).toBe(false);
        }
    });

    it('captures the base-relative page path in %1 so the -f guard and rewrite target resolve under /charts', () => {
        const pattern = extractNegotiationPattern(production);
        // %1 is reused as `%1.md` in both guard and target, so it must carry the base without
        // the leading slash.
        expect('/charts/community/events/'.match(pattern)?.[1]).toBe('charts/community/events');
        expect('/charts/react/axes-types/'.match(pattern)?.[1]).toBe('charts/react/axes-types');
        expect('/charts/gallery/simple-bar'.match(pattern)?.[1]).toBe('charts/gallery/simple-bar');
    });

    it('adds Vary: Accept for exactly the negotiated paths (both envs) so shared caches key on the negotiated representation', () => {
        for (const content of [production, staging]) {
            expect(content).toContain('Header append Vary Accept');
            // Narrower and a cache could serve markdown to a browser; wider and unrelated pages
            // lose cache keying.
            const varyPattern = extractVaryPattern(content);
            for (const path of negotiablePaths) {
                expect(varyPattern.test(path), `${path} should carry Vary: Accept`).toBe(true);
            }
            for (const path of nonNegotiablePaths) {
                expect(varyPattern.test(path), `${path} should not carry Vary: Accept`).toBe(false);
            }
        }
    });

    it('negotiates the homepage (site root) to its index.md twin', () => {
        for (const content of [production, staging]) {
            expect(content).toContain('RewriteCond %{REQUEST_URI} ^/charts/?$');
            expect(content).toContain('RewriteCond %{DOCUMENT_ROOT}/charts/index.md -f');
            expect(content).toContain('RewriteRule ^ /charts/index.md [L]');
            // The Vary <If> also keys the site root on Accept.
            expect(content).toContain('|| %{REQUEST_URI} =~ m#^/charts/?$#');
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
    // Snapshots render under the pinned `/charts` base, so they carry the production prefix.
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
