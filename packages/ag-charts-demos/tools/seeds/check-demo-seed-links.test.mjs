import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The post-deploy check lives with the other CI scripts under tools/ci; its tests run here,
// beside the seed tooling it mirrors, because this is the vitest project that covers that tooling.
import {
    PREFLIGHT_REQUEST_HEADERS,
    checkDemoSeedLinks,
    describeBuildPinProblems,
    describePreflightProblems,
    isArchiveUrl,
    parseDemoPages,
    parseSeedLinks,
    readStagingSiteUrl,
    resolveSeedLink,
} from '../../../../tools/ci/check-demo-seed-links.mjs';

const STAGING = 'https://charts-staging.ag-grid.com';
const PRODUCTION = 'https://www.ag-grid.com/charts';
const TREE = 'https://github.com/ag-grid/ag-charts-demos/tree';
const RAW = 'https://raw.githubusercontent.com/ag-grid/ag-charts-demos';

/**
 * A demo page's seed buttons as `DemoPage.astro` renders them (Astro's scoped class names
 * included): with one framework, each button is itself the link; with more, each opens a list of
 * one link per framework.
 */
function renderPage(links) {
    const action = (label, buttonClass, attribute, hrefOf) => {
        if (links.length === 1) {
            const [seed] = links;
            return `<a class="${buttonClass} _openInButton_1x2y" href="${hrefOf(seed)}" target="_blank" rel="noreferrer" ${attribute}="${seed.framework}"><svg></svg>${label}</a>`;
        }
        const items = links
            .map(
                (seed) =>
                    `<li><a class="_openInLink_1x2y" href="${hrefOf(seed)}" target="_blank" rel="noreferrer" ${attribute}="${seed.framework}">${seed.framework}</a></li>`
            )
            .join('\n');
        return `<details class="_openInMenu_1x2y" name="demo-open-in" data-open-in-menu>
<summary class="${buttonClass} _openInButton_1x2y"><svg></svg>${label}<svg></svg></summary>
<ul class="_openInList_1x2y" aria-label="${label}">${items}</ul>
</details>`;
    };
    const buttons = links.length
        ? `<div class="_openIn_1x2y" role="group" aria-label="Run this demo yourself">
${action('Open in StackBlitz', 'button-secondary', 'data-seed-framework', (seed) => seed.stackblitz)}
${action('See on GitHub', 'button-tertiary', 'data-seed-source', (seed) => seed.github)}
</div>`
        : '';
    return `<!doctype html><html><body><a href="/charts/">Home</a>${buttons}</body></html>`;
}

const seedLink = (demo, framework, label, ref = 'staging') => ({
    framework: label,
    stackblitz: `https://stackblitz.com/github/ag-grid/ag-charts-demos/tree/${ref}/${demo}/${framework}?title=AG%20Charts%20Demo%20(${label})`,
    github: `${TREE}/${ref}/${demo}/${framework}`,
});

/** A seed's `.seed-manifest.json` text, the same in the checkout and the mirror unless a test says otherwise. */
const manifestText = (seed) => `{ "demo": "${seed.split('/')[0]}", "framework": "${seed.split('/')[1]}" }\n`;
/** A manifest of a seed pinned to the `latest` dist-tag, which the mirror exports with tarball dependencies. */
const distTagManifest = (seed) =>
    `{ "demo": "${seed.split('/')[0]}", "framework": "${seed.split('/')[1]}", "pinSource": "dist-tag" }\n`;

const WRAPPERS = { react: 'ag-charts-react', angular: 'ag-charts-angular', vue: 'ag-charts-vue3' };

/** A seed's `package.json` as the mirror exports it for the build tarballs under `base`. */
function rewrittenPackageJson(framework, base) {
    const urlOf = (name) => `${base}/${name}.tgz`;
    const wrapper = WRAPPERS[framework];
    const names = ['ag-charts-community', 'ag-charts-enterprise', ...(wrapper ? [wrapper] : [])];
    const overridden = ['ag-charts-types', 'ag-charts-core', 'ag-charts-locale', ...names];
    return {
        dependencies: Object.fromEntries(names.map((name) => [name, urlOf(name)])),
        overrides: Object.fromEntries(overridden.map((name) => [name, urlOf(name)])),
    };
}

const RAW_MANIFEST =
    /^https:\/\/raw\.githubusercontent\.com\/ag-grid\/ag-charts-demos\/[^/]+\/([^/]+\/[^/]+)\/\.seed-manifest\.json$/;

const RAW_PACKAGE_JSON =
    /^https:\/\/raw\.githubusercontent\.com\/ag-grid\/ag-charts-demos\/[^/]+\/([^/]+\/[^/]+)\/package\.json$/;

/** What a host that allows StackBlitz's npm to fetch a tarball answers to its preflight. */
const GOOD_PREFLIGHT = {
    status: 204,
    headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
};

/**
 * A fetch that answers from `pages` (GET, URL to HTML), `json` (GET, URL to a parsed body) and
 * `statuses` (URL to status; 200 unless listed), recording every request. A mirror manifest not in
 * `pages` or `statuses` answers with `manifestText`, and a mirror `package.json` with the one in
 * `packages` (seed to object); a tarball's preflight (`OPTIONS`) answers `GOOD_PREFLIGHT` unless
 * `preflights` (URL to `{ status, headers }`) says otherwise. Anything else is a 404.
 */
function fakeFetch({
    pages = {},
    statuses = {},
    json = {},
    packages = {},
    preflights = {},
    mirroredManifest = manifestText,
} = {}) {
    const calls = [];
    const inits = [];
    const fetchImpl = async (url, init = {}) => {
        const method = init.method ?? 'GET';
        calls.push(`${method} ${url}`);
        inits.push({ url, ...init });
        if (method === 'HEAD') return { status: statuses[url] ?? 200, ok: (statuses[url] ?? 200) === 200 };
        if (method === 'OPTIONS') {
            const { status, headers } = preflights[url] ?? GOOD_PREFLIGHT;
            return { status, ok: status < 300, headers: new Headers(headers) };
        }
        if (url in json) return { status: 200, ok: true, json: async () => json[url] };
        if (url in pages) return { status: 200, ok: true, text: async () => pages[url] };
        if (url in statuses) return { status: statuses[url], ok: false, text: async () => 'not found' };
        const manifest = RAW_MANIFEST.exec(url);
        if (manifest) return { status: 200, ok: true, text: async () => mirroredManifest(manifest[1]) };
        const packageJson = RAW_PACKAGE_JSON.exec(url);
        if (packageJson && packages[packageJson[1]]) {
            return { status: 200, ok: true, text: async () => JSON.stringify(packages[packageJson[1]]) };
        }
        return { status: 404, ok: false, text: async () => 'not found' };
    };
    return { fetchImpl, calls, inits };
}

const base = {
    seeds: ['trading-terminal/angular', 'trading-terminal/react', 'procurement/react'],
    demoPages: [{ path: 'examples/', demoId: 'trading-terminal' }],
    productionSiteUrls: ['https://ag-grid.com', 'https://www.ag-grid.com'],
    stagingSiteUrl: STAGING,
    readSeedManifest: manifestText,
    branch: () => 'latest',
    log: () => {},
};

describe('parseDemoPages', () => {
    it('reads the listed demo pages off the website registry, skipping commented-out entries', () => {
        const registry = readFileSync(
            new URL('../../../ag-charts-website/src/components/demo-examples/exampleRegistry.ts', import.meta.url),
            'utf8'
        );
        expect(parseDemoPages(registry)).toEqual([
            { path: 'examples/', demoId: 'trading-terminal' },
            { path: 'examples-web-analytics/', demoId: 'web-analytics' },
        ]);
    });
});

describe('parseSeedLinks', () => {
    it('reads both links of every seed, decoding entities in the href', () => {
        const html = renderPage([seedLink('trading-terminal', 'react', 'React')]).replace('?title=', '?x=1&amp;title=');
        expect(parseSeedLinks(html)).toEqual([
            {
                kind: 'stackblitz',
                framework: 'React',
                href: `https://stackblitz.com/github/ag-grid/ag-charts-demos/tree/staging/trading-terminal/react?x=1&title=AG%20Charts%20Demo%20(React)`,
            },
            { kind: 'github', framework: 'React', href: `${TREE}/staging/trading-terminal/react` },
        ]);
    });
});

describe('resolveSeedLink', () => {
    it('maps a StackBlitz link to the GitHub folder it imports', () => {
        expect(
            resolveSeedLink({ kind: 'stackblitz', href: seedLink('trading-terminal', 'vue', 'Vue').stackblitz })
        ).toEqual({
            ref: 'staging',
            path: 'trading-terminal/vue',
            githubUrl: `${TREE}/staging/trading-terminal/vue`,
        });
    });

    it('rejects a link outside the mirror, or to anything but a seed folder', () => {
        expect(
            resolveSeedLink({
                kind: 'github',
                href: 'https://github.com/ag-grid/ag-charts/tree/staging/packages/ag-charts-demos/seeds/trading-terminal/vue',
            }).error
        ).toMatch(/does not start with/);
        expect(resolveSeedLink({ kind: 'github', href: `${TREE}/staging/trading-terminal` }).error).toMatch(
            /does not name/
        );
        expect(resolveSeedLink({ kind: 'github', href: `${TREE}/staging/trading-terminal/vue/src` }).error).toMatch(
            /does not name/
        );
    });
});

describe('readStagingSiteUrl', () => {
    it('reads the staging origin off the website constants', () => {
        expect(readStagingSiteUrl()).toBe(STAGING);
    });
});

describe('isArchiveUrl', () => {
    it.each`
        url                                                 | expected
        ${'https://www.ag-grid.com/charts/archive/14.2.0'}  | ${true}
        ${'https://www.ag-grid.com/charts/archive/14.2.0/'} | ${true}
        ${'https://www.ag-grid.com/charts'}                 | ${false}
        ${'https://charts-staging.ag-grid.com'}             | ${false}
    `('is $expected for $url', ({ url, expected }) => {
        expect(isArchiveUrl(url)).toBe(expected);
    });
});

describe('describeBuildPinProblems', () => {
    const BASE = `${STAGING}/npm-packages`;

    it('accepts a package.json whose AG Charts packages are all the tarballs, with the overrides', () => {
        expect(describeBuildPinProblems(rewrittenPackageJson('vue', BASE), BASE)).toEqual([]);
        expect(describeBuildPinProblems(rewrittenPackageJson('typescript', BASE), BASE)).toEqual([]);
    });

    it('names a dependency on another build, and an override that is missing or points elsewhere', () => {
        const packageJson = rewrittenPackageJson('react', BASE);
        packageJson.dependencies['ag-charts-react'] = 'https://elsewhere.example.com/ag-charts-react.tgz';
        packageJson.overrides['ag-charts-react'] = '14.1.0';
        delete packageJson.overrides['ag-charts-types'];

        expect(describeBuildPinProblems(packageJson, BASE)).toEqual([
            `depends on ag-charts-react "https://elsewhere.example.com/ag-charts-react.tgz", expected ${BASE}/ag-charts-react.tgz`,
            `overrides ag-charts-types with nothing, expected ${BASE}/ag-charts-types.tgz`,
            `overrides ag-charts-react with "14.1.0", expected ${BASE}/ag-charts-react.tgz`,
        ]);
    });
});

describe('describePreflightProblems', () => {
    const answer = (headers, status = 204) => ({ status, headers: new Headers(headers) });

    it('accepts a wildcard, an echo of the request headers, or the StackBlitz origin', () => {
        expect(describePreflightProblems(answer(GOOD_PREFLIGHT.headers))).toEqual([]);
        expect(
            describePreflightProblems(
                answer({
                    'access-control-allow-origin': 'https://stackblitz.com',
                    'access-control-allow-headers': PREFLIGHT_REQUEST_HEADERS.join(', ').toUpperCase(),
                })
            )
        ).toEqual([]);
    });

    it('rejects another origin', () => {
        expect(
            describePreflightProblems(
                answer({ 'access-control-allow-origin': 'https://example.com', 'access-control-allow-headers': '*' })
            )
        ).toEqual(['sends Access-Control-Allow-Origin "https://example.com" to the preflight']);
    });
});

describe('checkDemoSeedLinks', () => {
    const page = renderPage([
        seedLink('trading-terminal', 'react', 'React'),
        seedLink('trading-terminal', 'angular', 'Angular'),
    ]);

    it('fetches the deployed page and resolves every link it renders, then every manifest', async () => {
        const { fetchImpl, calls } = fakeFetch({ pages: { [`${STAGING}/examples/`]: page } });

        const result = await checkDemoSeedLinks({ ...base, siteUrl: `${STAGING}/`, fetchImpl });

        expect(result).toEqual({ ok: true, errors: [], warnings: [] });
        expect(calls).toEqual([
            `HEAD ${TREE}/staging`,
            `GET ${STAGING}/examples/`,
            `HEAD ${TREE}/staging/trading-terminal/react`,
            `HEAD ${TREE}/staging/trading-terminal/angular`,
            `GET ${RAW}/staging/trading-terminal/angular/.seed-manifest.json`,
            `GET ${RAW}/staging/trading-terminal/react/.seed-manifest.json`,
            `HEAD ${TREE}/staging/procurement/react`,
            `GET ${RAW}/staging/procurement/react/.seed-manifest.json`,
        ]);
    });

    it('warns when the mirror holds a different manifest from the checkout, or none it can read', async () => {
        const { fetchImpl } = fakeFetch({
            pages: {
                [`${STAGING}/examples/`]: page,
                [`${RAW}/staging/trading-terminal/react/.seed-manifest.json`]: '{ "sourceHash": "older" }\n',
            },
            statuses: { [`${RAW}/staging/procurement/react/.seed-manifest.json`]: 404 },
        });

        const result = await checkDemoSeedLinks({ ...base, siteUrl: STAGING, fetchImpl });

        expect(result.ok).toBe(true);
        expect(result.warnings).toEqual([
            expect.stringMatching(/staging has a different trading-terminal\/react\/\.seed-manifest\.json/),
            expect.stringMatching(/procurement\/react\/\.seed-manifest\.json could not be read .* \(404\)/),
        ]);
    });

    it('fails when a folder a rendered link opens does not resolve', async () => {
        const missing = `${TREE}/staging/trading-terminal/angular`;
        const { fetchImpl } = fakeFetch({ pages: { [`${STAGING}/examples/`]: page }, statuses: { [missing]: 404 } });

        const result = await checkDemoSeedLinks({ ...base, siteUrl: STAGING, fetchImpl });

        expect(result.ok).toBe(false);
        expect(result.errors).toEqual([
            expect.stringContaining(`stackblitz link (Angular)`),
            expect.stringContaining(`github link (Angular)`),
            `${missing} responded 404`,
        ]);
    });

    it('fails when the page links a ref other than the one this site should link', async () => {
        const released = renderPage([seedLink('trading-terminal', 'react', 'React', 'release-14.2.0')]);
        const { fetchImpl } = fakeFetch({ pages: { [`${STAGING}/examples/`]: released } });

        const result = await checkDemoSeedLinks({ ...base, siteUrl: STAGING, fetchImpl });

        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(/links ref release-14\.2\.0, but this site should link staging/);
    });

    it('fails when the page renders no seed links although the checkout has seeds for its demo', async () => {
        const { fetchImpl } = fakeFetch({ pages: { [`${STAGING}/examples/`]: renderPage([]) } });

        const result = await checkDemoSeedLinks({ ...base, siteUrl: STAGING, fetchImpl });

        expect(result.errors).toEqual([
            `${STAGING}/examples/ renders no seed links, but this checkout has seeds trading-terminal/angular, trading-terminal/react`,
        ]);
    });

    it('fails when the page itself cannot be fetched, or links outside the seeds', async () => {
        const stray = renderPage([
            { ...seedLink('trading-terminal', 'react', 'React'), github: 'https://example.com/' },
        ]);
        const pages = { [`${STAGING}/examples/`]: stray };
        const { fetchImpl } = fakeFetch({ pages });

        const result = await checkDemoSeedLinks({
            ...base,
            demoPages: [...base.demoPages, { path: 'examples-web-analytics/', demoId: 'web-analytics' }],
            siteUrl: STAGING,
            fetchImpl,
        });

        expect(result.errors).toEqual([
            expect.stringMatching(/github link \(React\) https:\/\/example\.com\/ does not start with/),
            `${STAGING}/examples-web-analytics/ responded 404`,
        ]);
    });

    describe('against production', () => {
        const meta = { [`${PRODUCTION}/debug/meta.json`]: { versions: { charts: '14.2.0' } } };
        const released = renderPage([seedLink('trading-terminal', 'react', 'React', 'release-14.2.0')]);

        it('checks the release tag when run from the matching release branch', async () => {
            const { fetchImpl, calls } = fakeFetch({ json: meta, pages: { [`${PRODUCTION}/examples/`]: released } });

            const result = await checkDemoSeedLinks({
                ...base,
                seeds: ['trading-terminal/react'],
                siteUrl: PRODUCTION,
                branch: () => 'b14.2.0',
                fetchImpl,
            });

            expect(result).toEqual({ ok: true, errors: [], warnings: [] });
            expect(calls).toContain(`HEAD ${TREE}/release-14.2.0/trading-terminal/react`);
            expect(calls).toContain(`GET ${RAW}/release-14.2.0/trading-terminal/react/.seed-manifest.json`);
        });

        it('refuses to run from anything but a release branch', async () => {
            const { fetchImpl, calls } = fakeFetch({ json: meta });
            const result = await checkDemoSeedLinks({ ...base, siteUrl: PRODUCTION, fetchImpl });
            expect(result.ok).toBe(false);
            expect(result.errors[0]).toMatch(/current branch: latest/);
            expect(calls).toEqual([]);
        });

        it('refuses to run from a detached HEAD, naming it', async () => {
            const { fetchImpl, calls } = fakeFetch({ json: meta });
            const result = await checkDemoSeedLinks({ ...base, siteUrl: PRODUCTION, fetchImpl, branch: () => null });
            expect(result.ok).toBe(false);
            expect(result.errors[0]).toMatch(/current branch: none, HEAD is detached/);
            expect(calls).toEqual([]);
        });

        it('fails when the site reports a different version from the branch', async () => {
            const { fetchImpl } = fakeFetch({
                json: { [`${PRODUCTION}/debug/meta.json`]: { versions: { charts: '14.1.0' } } },
            });
            const result = await checkDemoSeedLinks({
                ...base,
                siteUrl: PRODUCTION,
                branch: () => 'b14.2.0',
                fetchImpl,
            });
            expect(result.errors[0]).toMatch(/reports version 14\.1\.0 but this checkout is branch b14\.2\.0/);
        });

        it('only warns when the release predates the mirror', async () => {
            const { fetchImpl } = fakeFetch({
                json: meta,
                statuses: { [`${TREE}/release-14.2.0`]: 404 },
            });
            const result = await checkDemoSeedLinks({
                ...base,
                siteUrl: PRODUCTION,
                branch: () => 'b14.2.0',
                fetchImpl,
            });
            expect(result.ok).toBe(true);
            expect(result.warnings[0]).toMatch(/ag-charts-demos has no release-14\.2\.0 yet/);
        });
    });

    describe('against an archive', () => {
        const ARCHIVE = 'https://www.ag-grid.com/charts/archive/14.2.0';
        const meta = { [`${ARCHIVE}/debug/meta.json`]: { versions: { charts: '14.2.0' } } };
        const archived = renderPage([seedLink('trading-terminal', 'react', 'React', 'b14.2.0')]);

        it('links the release branch, and checks it when run from that branch', async () => {
            const { fetchImpl, calls } = fakeFetch({ json: meta, pages: { [`${ARCHIVE}/examples/`]: archived } });

            const result = await checkDemoSeedLinks({
                ...base,
                seeds: ['trading-terminal/react'],
                siteUrl: ARCHIVE,
                branch: () => 'b14.2.0',
                fetchImpl,
            });

            expect(result).toEqual({ ok: true, errors: [], warnings: [] });
            expect(calls).toContain(`HEAD ${TREE}/b14.2.0/trading-terminal/react`);
            expect(calls).toContain(`GET ${RAW}/b14.2.0/trading-terminal/react/.seed-manifest.json`);
        });

        it('fails when the archive links the release tag instead of the release branch', async () => {
            const released = renderPage([seedLink('trading-terminal', 'react', 'React', 'release-14.2.0')]);
            const { fetchImpl } = fakeFetch({ json: meta, pages: { [`${ARCHIVE}/examples/`]: released } });

            const result = await checkDemoSeedLinks({
                ...base,
                seeds: ['trading-terminal/react'],
                siteUrl: ARCHIVE,
                branch: () => 'b14.2.0',
                fetchImpl,
            });

            expect(result.errors[0]).toMatch(/links ref release-14\.2\.0, but this site should link b14\.2\.0/);
        });

        it('fails, not warns, when the mirror has no such release branch yet', async () => {
            const { fetchImpl } = fakeFetch({
                json: meta,
                statuses: { [`${TREE}/b14.2.0`]: 404, [`${TREE}/b14.2.0/trading-terminal/react`]: 404 },
            });

            const result = await checkDemoSeedLinks({
                ...base,
                seeds: ['trading-terminal/react'],
                demoPages: [],
                siteUrl: ARCHIVE,
                branch: () => 'b14.2.0',
                fetchImpl,
            });

            expect(result.ok).toBe(false);
            expect(result.warnings).toEqual([]);
        });

        it('refuses to run from anything but a release branch', async () => {
            const { fetchImpl, calls } = fakeFetch({ json: meta });
            const result = await checkDemoSeedLinks({ ...base, siteUrl: ARCHIVE, fetchImpl });
            expect(result.errors[0]).toMatch(/current branch: latest/);
            expect(calls).toEqual([]);
        });

        it('expects the tarballs of the archive itself', async () => {
            const tarball = (name) => `${ARCHIVE}/npm-packages/${name}.tgz`;
            const { fetchImpl, calls } = fakeFetch({
                json: meta,
                pages: { [`${ARCHIVE}/examples/`]: archived },
                packages: { 'trading-terminal/react': rewrittenPackageJson('react', `${ARCHIVE}/npm-packages`) },
                mirroredManifest: distTagManifest,
            });

            const result = await checkDemoSeedLinks({
                ...base,
                seeds: ['trading-terminal/react'],
                readSeedManifest: distTagManifest,
                siteUrl: ARCHIVE,
                branch: () => 'b14.2.0',
                fetchImpl,
            });

            expect(result).toEqual({ ok: true, errors: [], warnings: [] });
            expect(calls).toContain(`HEAD ${tarball('ag-charts-react')}`);
            expect(calls).toContain(`OPTIONS ${tarball('ag-charts-community')}`);
        });
    });

    describe('the build tarballs', () => {
        const TARBALLS = `${STAGING}/npm-packages`;
        const tarball = (name) => `${TARBALLS}/${name}.tgz`;
        const rewritten = {
            'trading-terminal/react': rewrittenPackageJson('react', TARBALLS),
            'trading-terminal/angular': rewrittenPackageJson('angular', TARBALLS),
        };
        const run = (fetchOptions, overrides = {}) => {
            const fake = fakeFetch({
                pages: { [`${STAGING}/examples/`]: page },
                packages: rewritten,
                mirroredManifest: distTagManifest,
                ...fetchOptions,
            });
            return checkDemoSeedLinks({
                ...base,
                seeds: ['trading-terminal/angular', 'trading-terminal/react'],
                readSeedManifest: distTagManifest,
                siteUrl: STAGING,
                fetchImpl: fake.fetchImpl,
                ...overrides,
            }).then((result) => ({ ...fake, result }));
        };

        it('resolves each tarball the staging seeds install once, and preflights it as StackBlitz would', async () => {
            const { result, calls, inits } = await run();

            expect(result).toEqual({ ok: true, errors: [], warnings: [] });
            const tarballCalls = calls.filter((call) => call.includes('/npm-packages/'));
            expect(tarballCalls).toEqual([
                ...['ag-charts-types', 'ag-charts-core', 'ag-charts-locale', 'ag-charts-community'].flatMap((name) => [
                    `HEAD ${tarball(name)}`,
                    `OPTIONS ${tarball(name)}`,
                ]),
                ...['ag-charts-enterprise', 'ag-charts-angular', 'ag-charts-react'].flatMap((name) => [
                    `HEAD ${tarball(name)}`,
                    `OPTIONS ${tarball(name)}`,
                ]),
            ]);
            const preflight = inits.find((init) => init.method === 'OPTIONS');
            expect(preflight.headers).toEqual({
                Origin: 'https://stackblitz.com',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': PREFLIGHT_REQUEST_HEADERS.join(','),
            });
        });

        it('expects the staging tarballs on a preview or local site too, which link the staging seeds', async () => {
            const preview = 'https://preview.example.com/charts';
            const { result, calls } = await run({ pages: { [`${preview}/examples/`]: page } }, { siteUrl: preview });

            expect(result.ok).toBe(true);
            expect(calls).toContain(`OPTIONS ${tarball('ag-charts-react')}`);
        });

        it('checks nothing for seeds pinned to a release, whose mirror copy installs from npm', async () => {
            const { result, calls } = await run(
                {},
                {
                    readSeedManifest: (seed) =>
                        `{ "demo": "x", "framework": "y", "pinSource": "release", "seed": "${seed}" }`,
                }
            );

            expect(result.ok).toBe(true);
            expect(calls.some((call) => call.includes('package.json') || call.includes('/npm-packages/'))).toBe(false);
        });

        it('checks nothing against production, whose seeds are pinned to the release', async () => {
            const meta = { [`${PRODUCTION}/debug/meta.json`]: { versions: { charts: '14.2.0' } } };
            const { result, calls } = await run(
                { json: meta, pages: {} },
                { siteUrl: PRODUCTION, branch: () => 'b14.2.0', demoPages: [] }
            );

            expect(result.ok).toBe(true);
            expect(calls.some((call) => call.includes('package.json') || call.includes('/npm-packages/'))).toBe(false);
        });

        it('fails when the mirror still holds the dist-tag, so the sync did not rewrite it', async () => {
            const { result } = await run({
                packages: {
                    ...rewritten,
                    'trading-terminal/react': {
                        dependencies: { 'ag-charts-community': 'latest', 'ag-charts-react': 'latest' },
                    },
                },
            });

            expect(result.ok).toBe(false);
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    `ag-grid/ag-charts-demos staging trading-terminal/react/package.json depends on ag-charts-community "latest", expected ${tarball('ag-charts-community')}`,
                    `ag-grid/ag-charts-demos staging trading-terminal/react/package.json overrides ag-charts-core with nothing, expected ${tarball('ag-charts-core')}`,
                ])
            );
        });

        it('fails when the mirror has no package.json, or one that is not JSON', async () => {
            const missing = await run({ packages: { 'trading-terminal/react': rewritten['trading-terminal/react'] } });
            expect(missing.result.errors).toEqual([
                `${RAW}/staging/trading-terminal/angular/package.json responded 404`,
            ]);

            const garbled = await run({
                statuses: {},
                pages: {
                    [`${STAGING}/examples/`]: page,
                    [`${RAW}/staging/trading-terminal/angular/package.json`]: '{ nope',
                },
            });
            expect(garbled.result.errors).toEqual([
                expect.stringMatching(/trading-terminal\/angular\/package\.json is not valid JSON/),
            ]);
        });

        it('fails when a tarball is not served', async () => {
            const { result } = await run({ statuses: { [tarball('ag-charts-core')]: 404 } });

            expect(result.errors).toEqual([
                `${tarball('ag-charts-core')} (a dependency of trading-terminal/angular at staging) responds 404`,
            ]);
        });

        it.each`
            case                                         | preflight                                                                                                          | problem
            ${'is refused'}                              | ${{ status: 405, headers: {} }}                                                                                    | ${'answers the CORS preflight (OPTIONS) with 405'}
            ${'lacks Access-Control-Allow-Headers'}      | ${{ status: 200, headers: { 'access-control-allow-origin': '*' } }}                                                | ${'sends no Access-Control-Allow-Headers to the preflight'}
            ${'lacks Access-Control-Allow-Origin'}       | ${{ status: 204, headers: { 'access-control-allow-headers': '*' } }}                                               | ${'sends Access-Control-Allow-Origin nothing to the preflight'}
            ${'allows only some of the request headers'} | ${{ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'npm-command' } }} | ${'does not allow the request headers npm-auth-type, pacote-pkg-id, pacote-req-type, pacote-version in Access-Control-Allow-Headers "npm-command"'}
        `("fails when a tarball's preflight $case", async ({ preflight, problem }) => {
            const url = tarball('ag-charts-enterprise');
            const { result } = await run({ preflights: { [url]: preflight } });

            expect(result.errors).toEqual([`${url} (a dependency of trading-terminal/angular at staging) ${problem}`]);
        });
    });
});
