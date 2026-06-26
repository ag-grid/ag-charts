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
        expect(rules).toContain(`RedirectMatch 410 "^${base}/archive/.*"`);
        expect(rules).toContain(`RedirectMatch 410 "^${base}/privacy(/.*)?"`);
    });

    it('410 rules carry no destination', () => {
        const goneLines = rules.split('\n').filter((l) => l.startsWith('RedirectMatch 410'));
        expect(goneLines.length).toBe(2);
        goneLines.forEach((l) => expect(l.split('"').length).toBe(3)); // only one quoted token (the pattern)
    });

    it('rewrites legacy {fw}-charts/{fw}/<page> to the current {fw}/<page> scheme', () => {
        expect(rules).toContain(`RedirectMatch 301 "^${base}/react-charts/react/(.*)" "${base}/react/$1"`);
        expect(rules).toContain(`RedirectMatch 301 "^${base}/enterprise-charts/react/(.*)" "${base}/react/$1"`);
    });

    it('preserves the page for framework-agnostic core/side legacy layouts (under javascript)', () => {
        expect(rules).toContain(`RedirectMatch 301 "^${base}/core/(.*)" "${base}/javascript/$1"`);
        expect(rules).toContain(`RedirectMatch 301 "^${base}/side/(.*)" "${base}/javascript/$1"`);
    });

    it('maps legacy aggregate index pages to the first page of the matching nav section', () => {
        expect(rules).toContain(
            `RedirectMatch 301 "^${base}/(javascript|angular|react|vue)/series(/.*)?" "${base}/$1/bar-series/"`
        );
        expect(rules).toContain(
            `RedirectMatch 301 "^${base}/(javascript|angular|react|vue)/axes(/.*)?" "${base}/$1/axes-configuration/"`
        );
    });

    it('routes server-side-rendering to a framework-scoped page', () => {
        expect(rules).toContain(
            `RedirectMatch 301 "^${base}/server-side-rendering(/.*)?" "${base}/javascript/server-side-rendering/"`
        );
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
    // the snapshots show the production-prefixed rules, e.g. `RedirectMatch 410 "^/charts/archive/.*"`.
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
