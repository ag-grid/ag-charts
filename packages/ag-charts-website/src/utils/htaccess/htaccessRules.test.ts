import { SITE_BASE_URL } from '../../constants';
import { type SimulatedResponse, followRedirects, simulateRequest } from '../test/htaccessSimulator';
import { createSiteRouteResolver, enumerablePageFiles } from '../test/siteRoutes';
import { PRODUCTION_CSP_PHASE, getAstroRedirectRules, getHtaccessContent, getRedirectRules } from './htaccessRules';
import { LEGACY_DOCS_PREFIXES, type Redirect, SITE_301_REDIRECTS } from './redirects';

// Pin the base to the production `/charts` value; the ambient test env resolves it to `/`,
// which would make the snapshots below env-dependent.
vi.mock('../../constants', async (importActual) => {
    const actual = await importActual<typeof import('../../constants')>();
    return { ...actual, SITE_BASE_URL: '/charts/' };
});

const ARCHIVE_BASE = '/charts/archive/14.2.0';

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
const BASE = (SITE_BASE_URL ?? '').replace(/\/$/, '');

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

// The deployed docroot, as far as the page tree can enumerate it: every static page and endpoint and
// every docs page per framework, each with the `.md` twin its route builds, plus the 404 document.
const filesByBase = new Map<string, string[]>();
const siteFiles = (basePath: string) => {
    if (!filesByBase.has(basePath)) {
        // Archive builds omit the sitemap integration, so only the current site has its files.
        const sitemaps = basePath.includes('/archive/')
            ? []
            : [`${basePath}/sitemap-index.xml`, `${basePath}/sitemap-0.xml`];
        filesByBase.set(basePath, [...enumerablePageFiles(basePath), ...sitemaps]);
    }
    return filesByBase.get(basePath)!;
};
const isSitePage = createSiteRouteResolver();

type Outcome = { status: number; location?: string } | undefined;

/** The redirect or 410 a request gets, or undefined when the request is served (or 404s). */
const outcomeOf = (response: SimulatedResponse): Outcome => {
    if (response.status === 410) {
        return { status: 410 };
    }
    if (response.status >= 300 && response.status < 400) {
        return { status: response.status, location: response.location };
    }
    return undefined;
};

const simulateRewrite = (htaccess: string, basePath: string, host: string, uri: string): Outcome =>
    outcomeOf(simulateRequest({ htaccess, basePath, files: siteFiles(basePath) }, { host, uri }));

const hasRegexTarget = (to: string) => /\$\d/.test(to);
const literalRedirects = (redirects: Redirect[]) =>
    redirects.filter((r): r is Redirect & { to: string } => 'to' in r && !hasRegexTarget(r.to));
const fromRedirects = SITE_301_REDIRECTS.filter(
    (r): r is Redirect & { from: string; to: string } => 'from' in r && 'to' in r
);

// One legacy URL per pattern rule (base-relative), and the page it must land on in one hop - or 410.
const PATTERN_SAMPLES: [string, string | 410][] = [
    ['/javascript', '/javascript/quick-start/'],
    ['/javascript/', '/javascript/quick-start/'],
    ['/archive', '/documentation-archive/'],
    ['/archive/', '/documentation-archive/'],
    ['/privacy', 410],
    ['/privacy/cookies/', 410],
    ['/javascript-charts/javascript/bar-series', '/javascript/bar-series/'],
    ['/angular-charts/angular/bar-series/', '/angular/bar-series/'],
    ['/react-charts/react/area-series/', '/react/area-series/'],
    ['/vue-charts/vue/line-series', '/vue/line-series/'],
    ['/enterprise-charts/react/security/', '/react/security/'],
    ['/react-charts/gallery/simple-bar/', '/gallery/'],
    ['/vue-charts/options/axes/', '/options/'],
    ['/enterprise-charts/license-pricing', '/enterprise-charts/'],
    ['/core/', '/javascript/quick-start/'],
    ['/side', '/javascript/quick-start/'],
    ['/core/bar-series', '/javascript/bar-series/'],
    ['/side/axes-types/', '/javascript/axes-types/'],
    ['/server-side-rendering/', '/javascript/server-side-rendering/'],
    ['/vue/series/', '/vue/bar-series/'],
    ['/angular/axes', '/angular/axes-configuration/'],
];

// Each legacy docs prefix in front of each renamed page below its current prefix: both slash forms
// of every renamed slug, and URLs inside each renamed aggregate section (a pattern rule, so it has no
// `from` to read). The legacy URL must land where the current one finally does, in one hop.
const AGGREGATE_SECTIONS = ['series', 'axes'];
const renamedBelow = (currentPrefix: string) => [
    ...fromRedirects
        .filter(({ from }) => from.startsWith(currentPrefix) && from !== currentPrefix)
        .map(({ from }) => from.slice(currentPrefix.length).replace(/\/$/, ''))
        .flatMap((slug) => [slug, `${slug}/`]),
    ...AGGREGATE_SECTIONS.flatMap((section) => [section, `${section}/`, `${section}/pie-series/`]),
];
const LEGACY_RENAMED_CASES = LEGACY_DOCS_PREFIXES.flatMap(({ legacyPrefix, currentPrefix }) =>
    renamedBelow(currentPrefix).map((slug) => ({
        legacy: `${legacyPrefix}${slug}`,
        current: `${currentPrefix}${slug}`,
    }))
);

describe('htaccessRules redirects (SE-60/SE-61)', () => {
    const production = getHtaccessContent({ env: 'production' });
    const site = { htaccess: production, basePath: BASE, files: siteFiles(BASE) };
    const base = BASE;
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

    it('answers a gone path with 410 on every host, rather than first redirecting it to www', () => {
        for (const host of [CANONICAL_HOST, ...NON_CANONICAL_HOSTS]) {
            expect(simulateRewrite(production, base, host, `${base}/privacy/`), host).toEqual({ status: 410 });
        }
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
        // mod_dir serves the landing page through an internal redirect to index.html, which the
        // rules see again, so matching that form would loop the landing page onto itself.
        expect(simulateRequest(site, { uri: `${base}/enterprise-charts/` })).toMatchObject({
            status: 200,
            servedFile: `${base}/enterprise-charts/index.html`,
        });
    });

    it('emits the SE-60 renamed-slug redirects, in one hop from either slash form', () => {
        redirectsTo(`${base}/react/line/`, `${CANONICAL}${base}/react/line-series/`);
        redirectsTo(`${base}/javascript/toolbar`, `${CANONICAL}${base}/javascript/financial-charts-toolbar/`);
        redirectsTo(`${base}/react/toolbar/`, `${CANONICAL}${base}/react/financial-charts-toolbar/`);
    });

    it('redirects every renamed page from both slash forms, and matches it exactly rather than as a prefix', () => {
        expect(fromRedirects.length).toBeGreaterThan(5);
        for (const { from, to } of fromRedirects) {
            const page = `${base}${from.replace(/\/$/, '')}`;
            for (const uri of [page, `${page}/`]) {
                expect(onWww(uri), uri).toEqual({ status: 301, location: `${CANONICAL}${base}${to}` });
            }
            // mod_alias `Redirect` is a prefix match: /fonts/ became /text// and /bullet-series/ an
            // anchor with a slash appended, and /fonts-x/ would have redirected too.
            for (const uri of [`${page}-x/`, `${page}/x/`, `${page}/index.html`]) {
                expect(onWww(uri), uri).toBeUndefined();
            }
        }
    });

    it('keeps a fragment target intact ([NE]) instead of escaping its # into a broken path', () => {
        const fragmentTargets = literalRedirects(SITE_301_REDIRECTS).filter(({ to }) => to.includes('#'));
        expect(fragmentTargets.length).toBeGreaterThan(0);
        redirectsTo(`${base}/react/bullet-series/`, `${CANONICAL}${base}/react/linear-gauge/#bullet-series`);
        redirectsTo(`${base}/react/bullet-series`, `${CANONICAL}${base}/react/linear-gauge/#bullet-series`);
        for (const host of NON_CANONICAL_HOSTS) {
            expect(simulateRewrite(production, base, host, `${base}/vue/bullet-series`)?.location, host).toBe(
                `${CANONICAL}${base}/vue/linear-gauge/#bullet-series`
            );
        }
    });

    it('sends only the javascript framework root on to quick-start; the others are landing hubs', () => {
        redirectsTo(`${base}/javascript/`, `${CANONICAL}${base}/javascript/quick-start/`);
        redirectsTo(`${base}/javascript`, `${CANONICAL}${base}/javascript/quick-start/`);
        for (const hub of ['react', 'angular', 'vue']) {
            expect(simulateRequest(site, { uri: `${base}/${hub}/` }), hub).toMatchObject({ status: 200 });
        }
    });

    it('exercises every pattern rule with a legacy URL below', () => {
        const patterns = SITE_301_REDIRECTS.flatMap((r) => ('fromPattern' in r ? [r.fromPattern] : []));
        for (const pattern of patterns) {
            const re = new RegExp(pattern);
            expect(
                [...PATTERN_SAMPLES.map(([uri]) => uri), ...LEGACY_RENAMED_CASES.map(({ legacy }) => legacy)].some(
                    (uri) => re.test(uri)
                ),
                `no sample for ${pattern}`
            ).toBe(true);
        }
    });

    it('lands every legacy URL on a real page in one hop, from any host', () => {
        for (const host of [CANONICAL_HOST, ...NON_CANONICAL_HOSTS]) {
            for (const [uri, expected] of PATTERN_SAMPLES) {
                const { hops, final } = followRedirects(site, { host, uri: `${base}${uri}` });
                if (expected === 410) {
                    expect(final.status, `${host}${uri}`).toBe(410);
                    continue;
                }
                expect(hops, `${host}${uri}`).toEqual([`${CANONICAL}${base}${expected}`]);
                expect(isSitePage(expected), expected).toBe(true);
                expect(final, `${host}${uri}`).toMatchObject({
                    status: 200,
                    servedFile: `${base}${expected}index.html`,
                });
            }
        }
    });

    it('sends every literal redirect target to a real page that is served without a further redirect', () => {
        const targets = literalRedirects(SITE_301_REDIRECTS);
        expect(targets.length).toBeGreaterThan(10);
        for (const { to } of targets) {
            const path = to.split('#')[0];
            expect(isSitePage(path), `${to} is not a page of this site`).toBe(true);
            const response = simulateRequest(site, { uri: `${base}${path}` });
            expect(response.status, to).toBe(200);
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
    const base = BASE;
    const site = { htaccess: getHtaccessContent({ env: 'production' }), basePath: base, files: siteFiles(base) };

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

    it.each(LEGACY_RENAMED_CASES)(
        '$legacy lands on the page $current finally reaches, in one hop, from every host',
        ({ legacy, current }) => {
            const { hops: currentHops } = followRedirects(site, { uri: `${base}${current}` });
            // The current URL is itself redirected, or this would not test a renamed page.
            expect(currentHops.length, current).toBeGreaterThan(0);
            const target = currentHops[currentHops.length - 1];
            const page = target.slice(`${CANONICAL}${base}`.length).split('#')[0];
            expect(isSitePage(page), `${page} is not a page of this site`).toBe(true);
            for (const host of [CANONICAL_HOST, ...NON_CANONICAL_HOSTS]) {
                const { hops, final } = followRedirects(site, { host, uri: `${base}${legacy}` });
                expect(hops, `${host}${legacy}`).toEqual([target]);
                expect(final, `${host}${legacy}`).toMatchObject({
                    status: 200,
                    servedFile: `${base}${page}index.html`,
                });
            }
        }
    );
});

describe('htaccessRules canonical host', () => {
    const production = getHtaccessContent({ env: 'production' });
    const staging = getHtaccessContent({ env: 'staging' });
    const base = BASE;
    const site = { htaccess: production, basePath: base, files: siteFiles(base) };

    // [request path, final www URL]. Each must be reached in ONE hop from any non-canonical host.
    const cases: [string, string][] = [
        [`${base}/`, `${base}/`],
        [base, `${base}/`],
        [`${base}/react/bar-series/`, `${base}/react/bar-series/`],
        [`${base}/react/bar-series`, `${base}/react/bar-series/`],
        [`${base}/react/bar-series.md`, `${base}/react/bar-series.md`],
        [`${base}/index.md`, `${base}/index.md`],
        [`${base}/llms.txt`, `${base}/llms.txt`],
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

    it('sends every renamed page on every non-canonical host to its final www page in one hop', () => {
        for (const host of NON_CANONICAL_HOSTS) {
            for (const { from, to } of fromRedirects) {
                const { hops } = followRedirects(site, { host, uri: `${base}${from}` });
                expect(hops, `${host}${from}`).toEqual([`${CANONICAL}${base}${to}`]);
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
            expect(simulateRequest(site, { uri }), uri).toMatchObject({ status: 200 });
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

    it('keeps every staging redirect relative, so it lands on the staging host itself', () => {
        const host = 'charts-staging.ag-grid.com';
        for (const { from, to } of fromRedirects) {
            expect(simulateRewrite(staging, base, host, `${base}${from}`), from).toEqual({
                status: 301,
                location: `${base}${to}`,
            });
        }
        for (const [uri, expected] of PATTERN_SAMPLES) {
            const outcome = simulateRewrite(staging, base, host, `${base}${uri}`);
            expect(outcome, uri).toEqual(
                expected === 410 ? { status: 410 } : { status: 301, location: `${base}${expected}` }
            );
        }
    });
});

describe('htaccessRules archive builds', () => {
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

    const archiveHtaccess = async () => (await import('./htaccessRules')).getHtaccessContent({ env: 'production' });
    const archiveSite = async () => ({
        htaccess: await archiveHtaccess(),
        basePath: ARCHIVE_BASE,
        files: siteFiles(ARCHIVE_BASE),
    });

    it('drops the sitemap.xml redirect from the generated .htaccess (SE-186)', async () => {
        const archiveHtaccessRules = await import('./htaccessRules');
        expect(archiveHtaccessRules.getRedirectRules()).not.toContain('sitemap.xml');
        const site = await archiveSite();
        expect(simulateRequest(site, { uri: `${ARCHIVE_BASE}/sitemap.xml` }).status).toBe(404);
    });

    it('drops the sitemap.xml redirect from the Astro redirect map (SE-186)', async () => {
        const archiveHtaccessRules = await import('./htaccessRules');
        expect(archiveHtaccessRules.getAstroRedirectRules()).not.toHaveProperty('/sitemap.xml');
    });

    it('keeps every other redirect, pointed at the same page inside the archive', async () => {
        const site = await archiveSite();
        for (const { from, to } of fromRedirects.filter((r) => !('skipForArchive' in r))) {
            const { hops, final } = followRedirects(site, { uri: `${ARCHIVE_BASE}${from}` });
            expect(hops, from).toEqual([`${CANONICAL}${ARCHIVE_BASE}${to}`]);
            expect(final.status, from).toBe(200);
        }
        for (const [uri, expected] of PATTERN_SAMPLES) {
            const { hops, final } = followRedirects(site, { uri: `${ARCHIVE_BASE}${uri}` });
            if (expected === 410) {
                expect(final.status, uri).toBe(410);
            } else {
                expect(hops, uri).toEqual([`${CANONICAL}${ARCHIVE_BASE}${expected}`]);
            }
        }
    });

    it('301s every non-canonical host to the same archive URL on www, in one hop', async () => {
        const site = await archiveSite();
        for (const host of NON_CANONICAL_HOSTS) {
            for (const [uri, final] of [
                [ARCHIVE_BASE, `${ARCHIVE_BASE}/`],
                [`${ARCHIVE_BASE}/`, `${ARCHIVE_BASE}/`],
                [`${ARCHIVE_BASE}/react/bar-series/`, `${ARCHIVE_BASE}/react/bar-series/`],
                [`${ARCHIVE_BASE}/react/bar-series`, `${ARCHIVE_BASE}/react/bar-series/`],
                [`${ARCHIVE_BASE}/react/bar-series.md`, `${ARCHIVE_BASE}/react/bar-series.md`],
                [`${ARCHIVE_BASE}/react/fonts`, `${ARCHIVE_BASE}/react/text/`],
            ]) {
                const { hops } = followRedirects(site, { host, uri });
                expect(hops, `${host}${uri}`).toEqual([`${CANONICAL}${final}`]);
            }
        }
        expect(simulateRequest(site, { uri: `${ARCHIVE_BASE}/react/bar-series/` }).status).toBe(200);
    });

    it('treats the version dots in the base as literals, not regex wildcards', async () => {
        const htaccess = await archiveHtaccess();
        // A lookalike directory holding real pages and twins: only the -f guard would stop a
        // wildcard match there, so put the twin on disk too.
        const lookalike = '/charts/archive/14x2y0';
        const site = {
            htaccess,
            basePath: lookalike,
            files: [`${lookalike}/react/bar-series/index.html`, `${lookalike}/react/bar-series.md`],
        };
        const response = simulateRequest(site, { uri: `${lookalike}/react/bar-series/`, accept: 'text/markdown' });
        expect(response.servedFile).toBe(`${lookalike}/react/bar-series/index.html`);
        expect(response.headers.vary).toBeUndefined();
    });

    it('serves an archive 404 from the archive 404 page', async () => {
        // The root .htaccess caches /charts/archive/<v>/* responses for a year, and this error
        // document lives under that prefix, so the root's archive cache rule must be gated on
        // REQUEST_STATUS == 200 or every archive 404 is cached too (waf-finding §4). That rule is
        // the root's to fix and test; this file only chooses where the 404 page lives.
        const site = await archiveSite();
        expect(simulateRequest(site, { uri: `${ARCHIVE_BASE}/react/missing/` })).toMatchObject({
            status: 404,
            servedFile: `${ARCHIVE_BASE}/404.html`,
            contentType: 'text/html',
        });
    });
});

describe('htaccessRules markdown content negotiation', () => {
    const production = getHtaccessContent({ env: 'production' });
    const staging = getHtaccessContent({ env: 'staging' });
    const MARKDOWN = 'text/markdown';
    const BROWSER = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

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
        '/charts/examples/',
        '/charts/examples-web-analytics/',
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

    // Pages with no `.md` twin, each given one on disk anyway: rewriting these would serve a twin
    // the build never makes, or loop into `.md.md` for a twin itself.
    const nonNegotiablePaths = [
        '/charts/documentation/', // redirect stub, sitemap-excluded
        '/charts/licensing/', // redirect stub, sitemap-excluded
        '/charts/style-guide/', // non-public, sitemap-excluded
        '/charts/contact/success/', // form result, sitemap-excluded
        '/charts/contact/failure/',
        '/charts/options/series/', // the member path alone is not a page
        '/charts/themes-api/overrides/', // likewise
        '/charts/gallery-test/',
        '/charts/react/quick-start/examples/create-a-chart/',
        '/charts/archive/13.0.0/react/bar-series/', // another build's tree
    ];

    const twinOf = (page: string) => (page === '/charts/' ? '/charts/index.md' : `${page.replace(/\/$/, '')}.md`);
    const withTwins = (pages: string[]) => pages.flatMap((page) => [`${page}index.html`, twinOf(page)]);
    const productionSite = { htaccess: production, basePath: BASE, files: withTwins(['/charts/', ...negotiablePaths]) };
    const stagingSite = { ...productionSite, htaccess: staging };

    it('serves the twin to Accept: text/markdown on every page group, keyed with Vary: Accept', () => {
        for (const site of [productionSite, stagingSite]) {
            for (const page of ['/charts/', ...negotiablePaths]) {
                expect(simulateRequest(site, { uri: page, accept: MARKDOWN }), page).toEqual({
                    status: 200,
                    servedFile: twinOf(page),
                    contentType: 'text/markdown; charset=utf-8',
                    headers: expect.objectContaining({ vary: 'Accept' }),
                });
            }
        }
    });

    it('serves HTML to a browser on every negotiated page, also keyed with Vary: Accept', () => {
        // mod_dir has already rewritten REQUEST_URI to the index document by the time the HTML
        // variant's headers are set, so the Vary scope must take that form: otherwise a shared
        // cache holding the HTML would hand it to agents.
        for (const site of [productionSite, stagingSite]) {
            for (const page of ['/charts/', ...negotiablePaths]) {
                for (const accept of [BROWSER, undefined]) {
                    expect(simulateRequest(site, { uri: page, accept }), page).toEqual({
                        status: 200,
                        servedFile: `${page}index.html`,
                        contentType: 'text/html',
                        headers: expect.objectContaining({ vary: 'Accept' }),
                    });
                }
            }
        }
    });

    it('negotiates a slash-less URL on staging, and via its one slash redirect in production', () => {
        for (const page of negotiablePaths) {
            const slashless = page.replace(/\/$/, '');
            expect(simulateRequest(stagingSite, { uri: slashless, accept: MARKDOWN }).servedFile, slashless).toBe(
                twinOf(page)
            );
            // Production adds the slash on the canonical host first (waf-finding §11: two requests
            // to reach the markdown), then negotiates the slashed URL.
            const { hops, final } = followRedirects(productionSite, { uri: slashless, accept: MARKDOWN });
            expect(hops, slashless).toEqual([`${CANONICAL}${page}`]);
            expect(final.servedFile, slashless).toBe(twinOf(page));
        }
        const { hops, final } = followRedirects(productionSite, { uri: '/charts', accept: MARKDOWN });
        expect(hops).toEqual([`${CANONICAL}/charts/`]);
        expect(final.servedFile).toBe('/charts/index.md');
    });

    it('falls back to the HTML when a negotiable page has no twin on disk, still keyed on Accept', () => {
        const site = { htaccess: production, basePath: BASE, files: ['/charts/react/new-page/index.html'] };
        expect(simulateRequest(site, { uri: '/charts/react/new-page/', accept: MARKDOWN })).toEqual({
            status: 200,
            servedFile: '/charts/react/new-page/index.html',
            contentType: 'text/html',
            headers: expect.objectContaining({ vary: 'Accept' }),
        });
    });

    it('never negotiates, or varies, a page outside the registry, even with a .md beside it', () => {
        for (const site of [production, staging]) {
            const s = { htaccess: site, basePath: BASE, files: withTwins(nonNegotiablePaths) };
            for (const page of nonNegotiablePaths) {
                const response = simulateRequest(s, { uri: page, accept: MARKDOWN });
                expect(response.servedFile, page).toBe(`${page}index.html`);
                expect(response.headers.vary, page).toBeUndefined();
            }
        }
    });

    it('serves a twin requested by name as UTF-8 markdown, without negotiating it again', () => {
        for (const site of [productionSite, stagingSite]) {
            for (const accept of [MARKDOWN, BROWSER]) {
                const response = simulateRequest(site, { uri: '/charts/react/axes-types.md', accept });
                expect(response).toMatchObject({
                    status: 200,
                    servedFile: '/charts/react/axes-types.md',
                    contentType: 'text/markdown; charset=utf-8',
                });
                expect(response.headers.vary).toBeUndefined();
            }
        }
    });

    it('does not vary assets, example runners or data files', () => {
        const files = [
            '/charts/_astro/index.AbCdEf12.js',
            '/charts/images/ag-charts-social.png',
            '/charts/debug/versions.json',
            '/charts/sitemap-0.xml',
            '/charts/react/quick-start/examples/create-a-chart/index.html',
        ];
        const site = { htaccess: production, basePath: BASE, files };
        for (const file of files) {
            const uri = file.replace(/index\.html$/, '');
            expect(simulateRequest(site, { uri, accept: MARKDOWN }).headers.vary, uri).toBeUndefined();
        }
    });

    it('negotiates inside an archive build, under its own base', async () => {
        vi.resetModules();
        vi.doMock('../../constants', async (importActual) => {
            const actual = await importActual<typeof import('../../constants')>();
            return { ...actual, SITE_BASE_URL: `${ARCHIVE_BASE}/` };
        });
        try {
            const htaccess = (await import('./htaccessRules')).getHtaccessContent({ env: 'production' });
            const page = `${ARCHIVE_BASE}/react/bar-series/`;
            const site = {
                htaccess,
                basePath: ARCHIVE_BASE,
                files: [
                    `${page}index.html`,
                    `${ARCHIVE_BASE}/react/bar-series.md`,
                    `${ARCHIVE_BASE}/index.html`,
                    `${ARCHIVE_BASE}/index.md`,
                ],
            };
            expect(simulateRequest(site, { uri: page, accept: MARKDOWN })).toMatchObject({
                servedFile: `${ARCHIVE_BASE}/react/bar-series.md`,
                headers: { vary: 'Accept' },
            });
            expect(simulateRequest(site, { uri: page })).toMatchObject({
                servedFile: `${page}index.html`,
                headers: { vary: 'Accept' },
            });
            expect(simulateRequest(site, { uri: `${ARCHIVE_BASE}/`, accept: MARKDOWN }).servedFile).toBe(
                `${ARCHIVE_BASE}/index.md`
            );
        } finally {
            vi.doUnmock('../../constants');
        }
    });

    it.todo('ignores Accept: text/markdown;q=0, which declines markdown (waf-finding §11: substring match)');
});

describe('htaccessRules response headers', () => {
    const production = getHtaccessContent({ env: 'production' });
    const staging = getHtaccessContent({ env: 'staging' });
    const files = [
        ...siteFiles(BASE),
        '/charts/_astro/index.AbCdEf12.js',
        '/charts/images/ag-charts-social.png',
        '/charts/react/quick-start/examples/create-a-chart/index.html',
    ];

    it('serves a missing page from the charts 404 page with a 404 status', () => {
        for (const htaccess of [production, staging]) {
            expect(
                simulateRequest({ htaccess, basePath: BASE, files }, { uri: '/charts/react/missing/' })
            ).toMatchObject({
                status: 404,
                servedFile: '/charts/404.html',
                contentType: 'text/html',
            });
        }
    });

    it('sets no Cache-Control on any response, leaving caching to the root .htaccess', () => {
        // Hashed assets, documents, markdown twins (waf-finding §11: they get no Cache-Control at
        // all today), 404s and redirects alike: this file has no caching rules, so none can match
        // an unhashed archive URL either. The root owns caching for /charts and its archives.
        const uris = [
            '/charts/react/bar-series/',
            '/charts/react/bar-series.md',
            '/charts/_astro/index.AbCdEf12.js',
            '/charts/images/ag-charts-social.png',
            '/charts/react/missing/',
            '/charts/react/fonts/',
            '/charts/privacy/',
        ];
        for (const htaccess of [production, staging]) {
            for (const uri of uris) {
                for (const accept of [undefined, 'text/markdown']) {
                    const response = simulateRequest({ htaccess, basePath: BASE, files }, { uri, accept });
                    expect(response.headers['cache-control'], uri).toBeUndefined();
                }
            }
        }
    });

    it('allows eval only in example runners, with exactly one enforced CSP on every response', () => {
        const site = { htaccess: production, basePath: BASE, files };
        const csp = (uri: string) => simulateRequest(site, { uri }).headers['content-security-policy'];
        for (const uri of ['/charts/react/bar-series/', '/charts/', '/charts/react/missing/', '/charts/react/fonts/']) {
            expect(csp(uri), uri).toBeDefined();
            expect(csp(uri), uri).not.toContain("'unsafe-eval'");
            expect(csp(uri).match(/default-src/g), uri).toHaveLength(1);
        }
        const example = csp('/charts/react/quick-start/examples/create-a-chart/');
        expect(example).toContain("'unsafe-eval'");
        expect(example.match(/default-src/g)).toHaveLength(1);
    });

    it('registers the MIME types the static files need', () => {
        const site = {
            htaccess: production,
            basePath: BASE,
            files: ['/charts/a.webp', '/charts/a.mjs', '/charts/a.ts', '/charts/a.jsx', '/charts/a.md'],
        };
        expect(simulateRequest(site, { uri: '/charts/a.webp' }).contentType).toBe('image/webp');
        for (const uri of ['/charts/a.mjs', '/charts/a.ts', '/charts/a.jsx']) {
            expect(simulateRequest(site, { uri }).contentType, uri).toBe('text/javascript');
        }
        // UTF-8, so glyphs like ✓/✗ in generated tables aren't mojibaked.
        expect(simulateRequest(site, { uri: '/charts/a.md' }).contentType).toBe('text/markdown; charset=utf-8');
    });

    it.todo(
        "advertises charts' own llms.txt and sitemap in the Link header, not the grid's (waf-finding §13: the root's SE-81 Link applies site-wide)"
    );
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
