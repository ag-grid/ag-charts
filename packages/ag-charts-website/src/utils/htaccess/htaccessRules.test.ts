import { SITE_BASE_URL } from '../../constants';
import { PRODUCTION_CSP_PHASE, getAstroRedirectRules, getHtaccessContent, getRedirectRules } from './htaccessRules';
import { LEGACY_DOCS_PREFIXES, SITE_301_REDIRECTS } from './redirects';

// Pin the base to the production `/charts` value; the ambient test env resolves it to `/`,
// which would make the snapshots below env-dependent.
vi.mock('../../constants', async (importActual) => {
    const actual = await importActual<typeof import('../../constants')>();
    return { ...actual, SITE_BASE_URL: '/charts/' };
});

const ARCHIVE_BASE = '/charts/archive/14.2.0';

// The `m#…#` expressions in the <If> that scopes `Header append Vary Accept`.
const varyPatterns = (content: string): RegExp[] => {
    const ifLine = content.split('\n').find((l, i, all) => l.startsWith('<If ') && all[i + 1]?.includes('Vary Accept'));
    expect(ifLine).toBeDefined();
    return [...ifLine!.matchAll(/m#(.+?)#/g)].map((m) => new RegExp(m[1]));
};

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

const CANONICAL = 'https://www.ag-grid.com';
const CANONICAL_HOST = 'www.ag-grid.com';

// Every host besides www that this docroot answers for: each must 301 straight to the final www URL.
const NON_CANONICAL_HOSTS = [
    'ag-grid.com',
    'AG-Grid.com',
    'blog.ag-grid.com',
    'angulargrid.ag-grid.com',
    'angular-grid.ag-grid.com',
    'javascript-grid.ag-grid.com',
    'react-grid.ag-grid.com',
    'angulargrid.com',
    'www.angulargrid.com',
];

type RewriteOutcome = { status: number; location?: string } | undefined;

/**
 * A minimal evaluator for the mod_rewrite subset these .htaccess files emit, so redirects are
 * asserted by behaviour (status, target, hop count) rather than by restating their text. The
 * RewriteRule pattern is matched against the path below the .htaccess directory (the deployed
 * base), as Apache does per-directory. Conditions on Accept or the filesystem never hold, which
 * models a browser request for a page that has no markdown twin on disk. The real-Apache harness
 * remains the authority on ordering against mod_dir and the grid root.
 */
function simulateRewrite(htaccess: string, basePath: string, host: string, uri: string): RewriteOutcome {
    const unquote = (v: string) => v.replace(/^"(.*)"$/, '$1');
    const flagsOf = (f: string | undefined) => (f == null ? [] : f.split(','));
    let conds: { test: string; pattern: string; flags: string[] }[] = [];
    const vars = (v: string) => v.replace(/%\{HTTP_HOST\}/g, host).replace(/%\{REQUEST_URI\}/g, uri);
    const condHolds = ({ test, pattern, flags }: (typeof conds)[number]) => {
        if (/HTTP_ACCEPT|DOCUMENT_ROOT|REQUEST_FILENAME/.test(test)) {
            return false;
        }
        const negate = pattern.startsWith('!');
        const re = new RegExp(negate ? pattern.slice(1) : pattern, flags.includes('NC') ? 'i' : '');
        return re.test(vars(test)) !== negate;
    };
    let relative: string | null = null;
    if (uri === basePath) {
        relative = '';
    } else if (uri.startsWith(`${basePath}/`)) {
        relative = uri.slice(basePath.length + 1);
    }
    for (const raw of htaccess.split('\n')) {
        const line = raw.trim();
        const cond = line.match(/^RewriteCond (\S+) ("[^"]*"|\S+)(?: \[([^\]]+)\])?$/);
        if (cond) {
            conds.push({ test: cond[1], pattern: unquote(cond[2]), flags: flagsOf(cond[3]) });
            continue;
        }
        const rule = line.match(/^RewriteRule ("[^"]*"|\S+) ("[^"]*"|\S+)(?: \[([^\]]+)\])?$/);
        if (!rule) {
            continue;
        }
        const ruleConds = conds;
        conds = [];
        const match = relative == null ? null : relative.match(new RegExp(unquote(rule[1])));
        if (!match) {
            continue;
        }
        // Consecutive [OR] conditions form one group; every group must hold.
        let ok = true;
        let groupHolds = false;
        for (const c of ruleConds) {
            groupHolds = groupHolds || condHolds(c);
            if (!c.flags.includes('OR')) {
                ok = ok && groupHolds;
                groupHolds = false;
            }
        }
        if (!ok) {
            continue;
        }
        const flags = flagsOf(rule[3]);
        if (flags.includes('G')) {
            return { status: 410 };
        }
        const redirect = flags.find((f) => f.startsWith('R='));
        if (redirect != null) {
            const location = vars(unquote(rule[2])).replace(/\$(\d)/g, (_, n) => match[Number(n)] ?? '');
            return { status: Number(redirect.slice(2)), location };
        }
    }
    return undefined;
}

describe('htaccessRules redirects (SE-60/SE-61)', () => {
    const production = getHtaccessContent({ env: 'production' });
    const base = (SITE_BASE_URL ?? '').replace(/\/$/, '');
    const onWww = (uri: string) => simulateRewrite(production, base, CANONICAL_HOST, uri);
    const redirectsTo = (uri: string, location: string) => expect(onWww(uri)).toEqual({ status: 301, location });

    it('does not 410 the archive — archived version docs are live, indexed content', () => {
        expect(onWww(`${base}/archive/13.0.0/`)).toBeUndefined();
        expect(onWww(`${base}/archive/14.0.0/react/bar-series/`)).toBeUndefined();
    });

    it('sends the bare archive index to the live archived-versions landing, without touching version docs', () => {
        redirectsTo(`${base}/archive`, `${CANONICAL}${base}/documentation-archive/`);
        redirectsTo(`${base}/archive/`, `${CANONICAL}${base}/documentation-archive/`);
    });

    it('marks the legacy privacy path as 410 Gone in both slash forms (no charts-scoped privacy page; must not 301 to apex)', () => {
        expect(onWww(`${base}/privacy`)).toEqual({ status: 410 });
        expect(onWww(`${base}/privacy/`)).toEqual({ status: 410 });
        expect(onWww(`${base}/privacy/cookies/`)).toEqual({ status: 410 });
    });

    it('rewrites legacy {fw}-charts/{fw}/<page> to the current {fw}/<page> scheme in one hop', () => {
        redirectsTo(`${base}/react-charts/react/area-series/`, `${CANONICAL}${base}/react/area-series/`);
        redirectsTo(`${base}/react-charts/react/area-series`, `${CANONICAL}${base}/react/area-series/`);
        redirectsTo(`${base}/enterprise-charts/react/security/`, `${CANONICAL}${base}/react/security/`);
        redirectsTo(`${base}/javascript-charts/javascript/bar-series`, `${CANONICAL}${base}/javascript/bar-series/`);
    });

    it('keeps a file path as-is under the page-preserving legacy rules, rather than slashing it into a 404', () => {
        // A last segment with a dot is a file (index.html, a .md twin, an asset), not a page slug.
        redirectsTo(
            `${base}/javascript-charts/javascript/quick-start/index.html`,
            `${CANONICAL}${base}/javascript/quick-start/index.html`
        );
        redirectsTo(`${base}/react-charts/react/bar-series.md`, `${CANONICAL}${base}/react/bar-series.md`);
        redirectsTo(`${base}/vue-charts/vue/bar-series/index.html`, `${CANONICAL}${base}/vue/bar-series/index.html`);
        redirectsTo(`${base}/angular-charts/angular/area-series.md`, `${CANONICAL}${base}/angular/area-series.md`);
        redirectsTo(`${base}/enterprise-charts/react/security.md`, `${CANONICAL}${base}/react/security.md`);
        redirectsTo(`${base}/core/bar-series/index.html`, `${CANONICAL}${base}/javascript/bar-series/index.html`);
        redirectsTo(`${base}/side/axes-types.md`, `${CANONICAL}${base}/javascript/axes-types.md`);
        // A dotted directory segment is not the last one, so the page still gains its slash.
        redirectsTo(`${base}/react-charts/react/v1.0/bar-series`, `${CANONICAL}${base}/react/v1.0/bar-series/`);
    });

    it('does not redirect an empty {fw}-charts/{fw}/ docs root (no broad fallback for these frameworks)', () => {
        expect(onWww(`${base}/react-charts/react/`)).toBeUndefined();
    });

    it('preserves the page for framework-agnostic core/side legacy layouts (under javascript), in one hop', () => {
        redirectsTo(`${base}/core/bar-series/`, `${CANONICAL}${base}/javascript/bar-series/`);
        redirectsTo(`${base}/core/bar-series`, `${CANONICAL}${base}/javascript/bar-series/`);
        redirectsTo(`${base}/side/axes-types/`, `${CANONICAL}${base}/javascript/axes-types/`);
        // The bare layout root would otherwise chain through /javascript/ to quick-start.
        redirectsTo(`${base}/core/`, `${CANONICAL}${base}/javascript/quick-start/`);
        redirectsTo(`${base}/side`, `${CANONICAL}${base}/javascript/quick-start/`);
    });

    it('maps legacy aggregate index pages to the first page of the matching nav section', () => {
        redirectsTo(`${base}/vue/series/`, `${CANONICAL}${base}/vue/bar-series/`);
        redirectsTo(`${base}/angular/axes`, `${CANONICAL}${base}/angular/axes-configuration/`);
    });

    it('routes server-side-rendering to a framework-scoped page', () => {
        redirectsTo(`${base}/server-side-rendering/`, `${CANONICAL}${base}/javascript/server-side-rendering/`);
    });

    it('enterprise-charts fallback redirects sub-paths only, never the live landing page', () => {
        redirectsTo(`${base}/enterprise-charts/license-pricing`, `${CANONICAL}${base}/enterprise-charts/`);
        expect(onWww(`${base}/enterprise-charts/`)).toBeUndefined();
        // mod_dir resolves a bare directory request through an internal sub-request for
        // index.html, which the rules see again, so matching it would loop on the landing page.
        expect(onWww(`${base}/enterprise-charts/index.html`)).toBeUndefined();
    });

    it('emits the SE-60 renamed-slug redirects, in one hop from either slash form', () => {
        redirectsTo(`${base}/react/line/`, `${CANONICAL}${base}/react/line-series/`);
        redirectsTo(`${base}/javascript/toolbar`, `${CANONICAL}${base}/javascript/financial-charts-toolbar/`);
        redirectsTo(`${base}/react/toolbar/`, `${CANONICAL}${base}/react/financial-charts-toolbar/`);
    });

    it('matches a renamed page exactly, never as a prefix that appends the remainder to the target', () => {
        // mod_alias `Redirect` is a prefix match: /fonts/ became /text// and /bullet-series/ an
        // anchor with a slash appended, and /fonts-x/ would have redirected too.
        redirectsTo(`${base}/react/fonts/`, `${CANONICAL}${base}/react/text/`);
        redirectsTo(`${base}/react/fonts`, `${CANONICAL}${base}/react/text/`);
        redirectsTo(`${base}/react/bullet-series/`, `${CANONICAL}${base}/react/linear-gauge/#bullet-series`);
        redirectsTo(`${base}/react/bullet-series`, `${CANONICAL}${base}/react/linear-gauge/#bullet-series`);
        expect(onWww(`${base}/react/fonts-and-text/`)).toBeUndefined();
        expect(onWww(`${base}/react/bullet-series/index.html`)).toBeUndefined();
    });

    it('emits fragment targets with [NE], or Apache escapes the # into a broken path', () => {
        const fragmentRules = production.split('\n').filter((l) => /^\s*RewriteRule .*#/.test(l));
        expect(fragmentRules.length).toBeGreaterThan(0);
        for (const rule of fragmentRules) {
            expect(rule).toMatch(/\[R=301,NE,L\]$/);
        }
    });

    it('sends only the javascript framework root on to quick-start; the others are landing hubs', () => {
        redirectsTo(`${base}/javascript/`, `${CANONICAL}${base}/javascript/quick-start/`);
        redirectsTo(`${base}/javascript`, `${CANONICAL}${base}/javascript/quick-start/`);
        for (const hub of ['react', 'angular', 'vue']) {
            expect(onWww(`${base}/${hub}/`), hub).toBeUndefined();
        }
    });

    it('lands every literal redirect target on a URL no other rule redirects (single hop)', () => {
        const targets = production
            .split('\n')
            .map((l) => l.trim().match(/^RewriteRule \S+ "(https:\/\/www\.ag-grid\.com[^"$%]*)" \[R=301/)?.[1])
            .filter((t): t is string => t != null);
        expect(targets.length).toBeGreaterThan(10);
        for (const target of targets) {
            const path = target.slice(CANONICAL.length).split('#')[0];
            expect(onWww(path), target).toBeUndefined();
        }
    });

    it('astro redirect map excludes pattern-match and gone rules', () => {
        const astro = getAstroRedirectRules() ?? {};
        // Only simple `from` redirects appear; gone and pattern rules have no `from`.
        expect(Object.keys(astro)).toContain('/react/line/');
        expect(Object.keys(astro).some((k) => k.includes('archive') || k.includes('privacy'))).toBe(false);
        expect(Object.keys(astro).some((k) => k.includes('(.*)'))).toBe(false);
    });

    it('emits the SE-186 sitemap.xml redirect for a normal (non-archive) build', () => {
        redirectsTo(`${base}/sitemap.xml`, `${CANONICAL}${base}/sitemap-0.xml`);
        expect(getAstroRedirectRules()).toMatchObject({ '/sitemap.xml': `${base}/sitemap-0.xml` });
    });
});

describe('htaccessRules legacy docs prefixes in front of a renamed page', () => {
    const production = getHtaccessContent({ env: 'production' });
    const base = (SITE_BASE_URL ?? '').replace(/\/$/, '');
    const onHost = (host: string, uri: string) => simulateRewrite(production, base, host, uri);

    /** The URL a www request finally lands on, following every redirect on the way. */
    const finalUrlOf = (uri: string) => {
        let url = `${CANONICAL}${uri}`;
        for (let hop = 0; hop < 5; hop++) {
            const outcome = onHost(CANONICAL_HOST, url.slice(CANONICAL.length).split('#')[0]);
            if (outcome?.status !== 301) {
                return url;
            }
            url = outcome.location!;
        }
        throw new Error(`${uri} redirects more than 5 times`);
    };

    // The renamed pages below a current docs prefix, as both slash forms of each renamed slug, plus
    // a URL inside each renamed aggregate section (a pattern rule, so it has no `from` to read).
    const AGGREGATE_SECTIONS = ['series', 'axes'];
    const renamedBelow = (currentPrefix: string) => [
        ...SITE_301_REDIRECTS.flatMap((redirect) =>
            'from' in redirect && redirect.from.startsWith(currentPrefix) && redirect.from !== currentPrefix
                ? [redirect.from.slice(currentPrefix.length).replace(/\/$/, '')]
                : []
        ).flatMap((slug) => [slug, `${slug}/`]),
        ...AGGREGATE_SECTIONS.flatMap((section) => [section, `${section}/`, `${section}/pie-series/`]),
    ];

    const CASES = LEGACY_DOCS_PREFIXES.flatMap(({ legacyPrefix, currentPrefix }) =>
        renamedBelow(currentPrefix).map((slug) => ({
            legacy: `${base}${legacyPrefix}${slug}`,
            current: `${base}${currentPrefix}${slug}`,
        }))
    );

    it('covers every legacy prefix, and every pattern rule renaming a page below a framework', () => {
        expect(LEGACY_DOCS_PREFIXES.map(({ legacyPrefix }) => legacyPrefix)).toEqual(
            expect.arrayContaining(['/react-charts/react/', '/enterprise-charts/react/', '/core/', '/side/'])
        );
        const frameworkPatterns = SITE_301_REDIRECTS.flatMap((redirect) =>
            'fromPattern' in redirect && /^\^\/(javascript|angular|react|vue)\/\w/.test(redirect.fromPattern)
                ? [redirect.fromPattern]
                : []
        );
        expect(frameworkPatterns.length).toBeGreaterThan(0);
        for (const pattern of frameworkPatterns) {
            const framework = pattern.split('/')[1];
            expect(
                AGGREGATE_SECTIONS.some((section) => new RegExp(pattern).test(`/${framework}/${section}/`)),
                pattern
            ).toBe(true);
        }
    });

    it.each(CASES)('$legacy lands where $current does, in one hop, from every host', ({ legacy, current }) => {
        const final = finalUrlOf(current);
        // The current URL is itself redirected, or this would not test a renamed page.
        expect(final, current).not.toBe(`${CANONICAL}${current}`);
        for (const host of [CANONICAL_HOST, ...NON_CANONICAL_HOSTS]) {
            expect(onHost(host, legacy), `${host}${legacy}`).toEqual({ status: 301, location: final });
        }
        expect(onHost(CANONICAL_HOST, final.slice(CANONICAL.length).split('#')[0]), final).toBeUndefined();
    });
});

describe('htaccessRules canonical host', () => {
    const production = getHtaccessContent({ env: 'production' });
    const staging = getHtaccessContent({ env: 'staging' });
    const base = (SITE_BASE_URL ?? '').replace(/\/$/, '');

    // [request path, final www URL]. Each must be reached in ONE hop from any non-canonical host.
    const cases: [string, string][] = [
        [`${base}/`, `${base}/`],
        [base, `${base}/`],
        [`${base}/react/bar-series/`, `${base}/react/bar-series/`],
        [`${base}/react/bar-series`, `${base}/react/bar-series/`],
        [`${base}/debug/versions.json`, `${base}/debug/versions.json`],
        [`${base}/react/bullet-series`, `${base}/react/linear-gauge/#bullet-series`],
        [`${base}/react/fonts/`, `${base}/react/text/`],
        [`${base}/javascript-charts/javascript/bar-series`, `${base}/javascript/bar-series/`],
        [`${base}/core/bar-series`, `${base}/javascript/bar-series/`],
        [`${base}/javascript`, `${base}/javascript/quick-start/`],
        [`${base}/archive/13.1.0/javascript/getting-started/`, `${base}/archive/13.1.0/javascript/getting-started/`],
    ];

    it('301s every non-canonical host straight to the final www URL, in one hop', () => {
        for (const host of NON_CANONICAL_HOSTS) {
            for (const [uri, final] of cases) {
                expect(simulateRewrite(production, base, host, uri), `${host}${uri}`).toEqual({
                    status: 301,
                    location: `${CANONICAL}${final}`,
                });
                expect(simulateRewrite(production, base, CANONICAL_HOST, final.split('#')[0]), final).toBeUndefined();
            }
        }
    });

    it('sends a slash-less www URL straight to its slashed form on the canonical origin', () => {
        expect(simulateRewrite(production, base, CANONICAL_HOST, `${base}/react/bar-series`)).toEqual({
            status: 301,
            location: `${CANONICAL}${base}/react/bar-series/`,
        });
    });

    it('serves live pages on www without a redirect', () => {
        for (const uri of [`${base}/`, `${base}/react/`, `${base}/react/quick-start/`, `${base}/gallery/`]) {
            expect(simulateRewrite(production, base, CANONICAL_HOST, uri), uri).toBeUndefined();
        }
    });

    it('leaves hosts it does not own alone, so origin health checks and proxies cannot loop', () => {
        for (const host of ['10.0.0.12', 'localhost', 'charts.ag-grid.com', 'grid-staging.ag-grid.com']) {
            expect(simulateRewrite(production, base, host, `${base}/react/bar-series/`), host).toBeUndefined();
        }
    });

    it('does not canonicalise the host on staging, whose redirects stay on the requesting host', () => {
        expect(staging).not.toContain(CANONICAL);
        expect(
            simulateRewrite(staging, base, 'charts-staging.ag-grid.com', `${base}/react/bar-series/`)
        ).toBeUndefined();
        expect(simulateRewrite(staging, base, 'charts-staging.ag-grid.com', `${base}/react/fonts/`)).toEqual({
            status: 301,
            location: `${base}/react/text/`,
        });
    });
});

describe('htaccessRules redirects (SE-186): archive builds never generate sitemap-0.xml', () => {
    // Archive builds omit the `sitemap()` integration (see astro.config.mjs), so a redirect
    // whose target is that generated file must not be emitted there either — it would 301 to a
    // file the archive build never produces, and the link checker (correctly) flags the
    // resulting broken anchor.
    beforeEach(() => {
        vi.resetModules();
        vi.doMock('../../constants', async (importActual) => {
            const actual = await importActual<typeof import('../../constants')>();
            return { ...actual, SITE_BASE_URL: '/charts/archive/14.2.0/' };
        });
    });

    afterEach(() => {
        vi.doUnmock('../../constants');
    });

    it('drops the sitemap.xml redirect from the generated .htaccess', async () => {
        const archiveHtaccessRules = await import('./htaccessRules');
        expect(archiveHtaccessRules.getRedirectRules()).not.toContain('sitemap.xml');
    });

    it('drops the sitemap.xml redirect from the Astro redirect map', async () => {
        const archiveHtaccessRules = await import('./htaccessRules');
        expect(archiveHtaccessRules.getAstroRedirectRules()).not.toHaveProperty('/sitemap.xml');
    });

    it('keeps unrelated redirects, pointed at the archive rather than the current site', async () => {
        const archiveHtaccessRules = await import('./htaccessRules');
        const archive = archiveHtaccessRules.getHtaccessContent({ env: 'production' });
        expect(simulateRewrite(archive, ARCHIVE_BASE, CANONICAL_HOST, `${ARCHIVE_BASE}/react/line/`)).toEqual({
            status: 301,
            location: `${CANONICAL}${ARCHIVE_BASE}/react/line-series/`,
        });
    });

    it('301s every non-canonical host to the same archive URL on www, in one hop', async () => {
        const archiveHtaccessRules = await import('./htaccessRules');
        const archive = archiveHtaccessRules.getHtaccessContent({ env: 'production' });
        for (const host of NON_CANONICAL_HOSTS) {
            for (const [uri, final] of [
                [`${ARCHIVE_BASE}/`, `${ARCHIVE_BASE}/`],
                [`${ARCHIVE_BASE}/react/bar-series/`, `${ARCHIVE_BASE}/react/bar-series/`],
                [`${ARCHIVE_BASE}/react/bar-series`, `${ARCHIVE_BASE}/react/bar-series/`],
            ]) {
                expect(simulateRewrite(archive, ARCHIVE_BASE, host, uri), `${host}${uri}`).toEqual({
                    status: 301,
                    location: `${CANONICAL}${final}`,
                });
            }
        }
        expect(
            simulateRewrite(archive, ARCHIVE_BASE, CANONICAL_HOST, `${ARCHIVE_BASE}/react/bar-series/`)
        ).toBeUndefined();
    });

    it('treats the version dots in the base as literals, not regex wildcards', async () => {
        const archiveHtaccessRules = await import('./htaccessRules');
        const archive = archiveHtaccessRules.getHtaccessContent({ env: 'production' });
        expect(archive).not.toMatch(/archive\/14\.2\.0[^/]*\/\(/);
        expect(archive).toContain('archive/14\\.2\\.0');
        const vary = varyPatterns(archive);
        expect(vary.some((re) => re.test(`${ARCHIVE_BASE}/react/bar-series/index.html`))).toBe(true);
        expect(vary.some((re) => re.test('/charts/archive/14x2y0/react/bar-series/index.html'))).toBe(false);
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

    const carriesVary = (content: string, path: string) => varyPatterns(content).some((re) => re.test(path));

    // One representative URL per registry group, so a group with no matching pattern shows up.
    const negotiablePaths = [
        '/charts/react/axes-types/',
        '/charts/javascript/quick-start/',
        '/charts/react/',
        '/charts/angular/',
        '/charts/vue/',
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
        '/charts/javascript/', // the one framework root forwarding on to quick-start
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
            for (const path of negotiablePaths) {
                expect(carriesVary(content, path), `${path} should carry Vary: Accept`).toBe(true);
                // mod_dir has already rewritten REQUEST_URI to the index document by the time the
                // HTML variant's headers are set, so that form must carry it too.
                expect(carriesVary(content, `${path}index.html`), `${path}index.html should carry Vary`).toBe(true);
            }
            for (const path of nonNegotiablePaths) {
                expect(carriesVary(content, path), `${path} should not carry Vary: Accept`).toBe(false);
                if (path.endsWith('/')) {
                    expect(carriesVary(content, `${path}index.html`), `${path}index.html`).toBe(false);
                }
            }
        }
    });

    it('negotiates the homepage (site root) to its index.md twin', () => {
        for (const content of [production, staging]) {
            expect(content).toContain('RewriteCond %{REQUEST_URI} ^/charts/?$');
            expect(content).toContain('RewriteCond %{DOCUMENT_ROOT}/charts/index.md -f');
            expect(content).toContain('RewriteRule ^ /charts/index.md [L]');
            // The Vary <If> also keys the site root on Accept, including mod_dir's index form.
            expect(carriesVary(content, '/charts/')).toBe(true);
            expect(carriesVary(content, '/charts/index.html')).toBe(true);
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

    it('registers the webp MIME type so the images are not served without a Content-Type', () => {
        expect(production).toContain('AddType image/webp .webp');
        expect(staging).toContain('AddType image/webp .webp');
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
