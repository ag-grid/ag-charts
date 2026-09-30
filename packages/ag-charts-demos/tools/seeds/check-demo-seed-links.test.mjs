import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The post-deploy check lives with the other CI scripts under tools/ci; its tests run here,
// beside the seed tooling it mirrors, because this is the vitest project that covers that tooling.
import {
    checkDemoSeedLinks,
    parseDemoPages,
    parseSeedLinks,
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

const seedLink = (demo, framework, label, ref = 'latest') => ({
    framework: label,
    stackblitz: `https://stackblitz.com/github/ag-grid/ag-charts-demos/tree/${ref}/${demo}/${framework}?title=AG%20Charts%20Demo%20(${label})`,
    github: `${TREE}/${ref}/${demo}/${framework}`,
});

/** A seed's `.seed-manifest.json` text, the same in the checkout and the mirror unless a test says otherwise. */
const manifestText = (seed) => `{ "demo": "${seed.split('/')[0]}", "framework": "${seed.split('/')[1]}" }\n`;
const RAW_MANIFEST =
    /^https:\/\/raw\.githubusercontent\.com\/ag-grid\/ag-charts-demos\/[^/]+\/([^/]+\/[^/]+)\/\.seed-manifest\.json$/;

/**
 * A fetch that answers from `pages` (GET, URL to HTML) and `statuses` (URL to status; 200 unless
 * listed), recording every request. A mirror manifest not in `pages` or `statuses` answers with
 * `manifestText`. Anything else is a 404.
 */
function fakeFetch({ pages = {}, statuses = {}, json = {} } = {}) {
    const calls = [];
    const fetchImpl = async (url, init = {}) => {
        const method = init.method ?? 'GET';
        calls.push(`${method} ${url}`);
        if (method === 'HEAD') return { status: statuses[url] ?? 200, ok: (statuses[url] ?? 200) === 200 };
        if (url in json) return { status: 200, ok: true, json: async () => json[url] };
        if (url in pages) return { status: 200, ok: true, text: async () => pages[url] };
        if (url in statuses) return { status: statuses[url], ok: false, text: async () => 'not found' };
        const manifest = RAW_MANIFEST.exec(url);
        if (manifest) return { status: 200, ok: true, text: async () => manifestText(manifest[1]) };
        return { status: 404, ok: false, text: async () => 'not found' };
    };
    return { fetchImpl, calls };
}

const base = {
    seeds: ['financial/angular', 'financial/react', 'procurement/react'],
    demoPages: [{ path: 'examples/', demoId: 'financial' }],
    productionSiteUrls: ['https://ag-grid.com', 'https://www.ag-grid.com'],
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
            { path: 'examples/', demoId: 'financial' },
            { path: 'examples-web-analytics/', demoId: 'web-analytics' },
        ]);
    });
});

describe('parseSeedLinks', () => {
    it('reads both links of every seed, decoding entities in the href', () => {
        const html = renderPage([seedLink('financial', 'react', 'React')]).replace('?title=', '?x=1&amp;title=');
        expect(parseSeedLinks(html)).toEqual([
            {
                kind: 'stackblitz',
                framework: 'React',
                href: `https://stackblitz.com/github/ag-grid/ag-charts-demos/tree/latest/financial/react?x=1&title=AG%20Charts%20Demo%20(React)`,
            },
            { kind: 'github', framework: 'React', href: `${TREE}/latest/financial/react` },
        ]);
    });
});

describe('resolveSeedLink', () => {
    it('maps a StackBlitz link to the GitHub folder it imports', () => {
        expect(resolveSeedLink({ kind: 'stackblitz', href: seedLink('financial', 'vue', 'Vue').stackblitz })).toEqual({
            ref: 'latest',
            path: 'financial/vue',
            githubUrl: `${TREE}/latest/financial/vue`,
        });
    });

    it('rejects a link outside the mirror, or to anything but a seed folder', () => {
        expect(
            resolveSeedLink({
                kind: 'github',
                href: 'https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-demos/seeds/financial/vue',
            }).error
        ).toMatch(/does not start with/);
        expect(resolveSeedLink({ kind: 'github', href: `${TREE}/latest/financial` }).error).toMatch(/does not name/);
        expect(resolveSeedLink({ kind: 'github', href: `${TREE}/latest/financial/vue/src` }).error).toMatch(
            /does not name/
        );
    });
});

describe('checkDemoSeedLinks', () => {
    const page = renderPage([seedLink('financial', 'react', 'React'), seedLink('financial', 'angular', 'Angular')]);

    it('fetches the deployed page and resolves every link it renders, then every manifest', async () => {
        const { fetchImpl, calls } = fakeFetch({ pages: { [`${STAGING}/examples/`]: page } });

        const result = await checkDemoSeedLinks({ ...base, siteUrl: `${STAGING}/`, fetchImpl });

        expect(result).toEqual({ ok: true, errors: [], warnings: [] });
        expect(calls).toEqual([
            `HEAD ${TREE}/latest`,
            `GET ${STAGING}/examples/`,
            `HEAD ${TREE}/latest/financial/react`,
            `HEAD ${TREE}/latest/financial/angular`,
            `GET ${RAW}/latest/financial/angular/.seed-manifest.json`,
            `GET ${RAW}/latest/financial/react/.seed-manifest.json`,
            `HEAD ${TREE}/latest/procurement/react`,
            `GET ${RAW}/latest/procurement/react/.seed-manifest.json`,
        ]);
    });

    it('warns when the mirror holds a different manifest from the checkout, or none it can read', async () => {
        const { fetchImpl } = fakeFetch({
            pages: {
                [`${STAGING}/examples/`]: page,
                [`${RAW}/latest/financial/react/.seed-manifest.json`]: '{ "sourceHash": "older" }\n',
            },
            statuses: { [`${RAW}/latest/procurement/react/.seed-manifest.json`]: 404 },
        });

        const result = await checkDemoSeedLinks({ ...base, siteUrl: STAGING, fetchImpl });

        expect(result.ok).toBe(true);
        expect(result.warnings).toEqual([
            expect.stringMatching(/latest has a different financial\/react\/\.seed-manifest\.json/),
            expect.stringMatching(/procurement\/react\/\.seed-manifest\.json could not be read .* \(404\)/),
        ]);
    });

    it('fails when a folder a rendered link opens does not resolve', async () => {
        const missing = `${TREE}/latest/financial/angular`;
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
        const released = renderPage([seedLink('financial', 'react', 'React', 'release-14.2.0')]);
        const { fetchImpl } = fakeFetch({ pages: { [`${STAGING}/examples/`]: released } });

        const result = await checkDemoSeedLinks({ ...base, siteUrl: STAGING, fetchImpl });

        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(/links ref release-14\.2\.0, but this site should link latest/);
    });

    it('fails when the page renders no seed links although the checkout has seeds for its demo', async () => {
        const { fetchImpl } = fakeFetch({ pages: { [`${STAGING}/examples/`]: renderPage([]) } });

        const result = await checkDemoSeedLinks({ ...base, siteUrl: STAGING, fetchImpl });

        expect(result.errors).toEqual([
            `${STAGING}/examples/ renders no seed links, but this checkout has seeds financial/angular, financial/react`,
        ]);
    });

    it('fails when the page itself cannot be fetched, or links outside the seeds', async () => {
        const stray = renderPage([{ ...seedLink('financial', 'react', 'React'), github: 'https://example.com/' }]);
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
        const released = renderPage([seedLink('financial', 'react', 'React', 'release-14.2.0')]);

        it('checks the release tag when run from the matching release branch', async () => {
            const { fetchImpl, calls } = fakeFetch({ json: meta, pages: { [`${PRODUCTION}/examples/`]: released } });

            const result = await checkDemoSeedLinks({
                ...base,
                seeds: ['financial/react'],
                siteUrl: PRODUCTION,
                branch: () => 'b14.2.0',
                fetchImpl,
            });

            expect(result).toEqual({ ok: true, errors: [], warnings: [] });
            expect(calls).toContain(`HEAD ${TREE}/release-14.2.0/financial/react`);
            expect(calls).toContain(`GET ${RAW}/release-14.2.0/financial/react/.seed-manifest.json`);
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
});
