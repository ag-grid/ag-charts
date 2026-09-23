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
const TREE = 'https://github.com/ag-grid/ag-charts/tree';
const SEEDS = 'packages/ag-charts-demos/seeds';

/** A demo page's seed list as `DemoPage.astro` renders it (Astro's scoped class names included). */
function renderPage(links) {
    const items = links
        .map(
            ({ framework, stackblitz, github }) => `<li class="_openInItem_1x2y">
<a class="button-secondary _openInButton_1x2y" href="${stackblitz}" target="_blank" rel="noreferrer" data-seed-framework="${framework}"><svg></svg>Open in StackBlitz (${framework})</a>
<a class="button-tertiary _openInSource_1x2y" href="${github}" target="_blank" rel="noreferrer" data-seed-source="${framework}"><svg></svg>See on GitHub</a>
</li>`
        )
        .join('\n');
    return `<!doctype html><html><body><a href="/charts/">Home</a><ul class="_openIn_1x2y" aria-label="Run this demo yourself">${items}</ul></body></html>`;
}

const seedLink = (demo, framework, label, ref = 'latest') => ({
    framework: label,
    stackblitz: `https://stackblitz.com/github/ag-grid/ag-charts/tree/${ref}/${SEEDS}/${demo}/${framework}?title=AG%20Charts%20Demo%20(${label})`,
    github: `${TREE}/${ref}/${SEEDS}/${demo}/${framework}`,
});

/**
 * A fetch that answers from `pages` (GET, URL to HTML) and `statuses` (HEAD, URL to status; 200
 * unless listed), recording every request. Anything else is a 404.
 */
function fakeFetch({ pages = {}, statuses = {}, json = {} } = {}) {
    const calls = [];
    const fetchImpl = async (url, init = {}) => {
        const method = init.method ?? 'GET';
        calls.push(`${method} ${url}`);
        if (method === 'HEAD') return { status: statuses[url] ?? 200, ok: (statuses[url] ?? 200) === 200 };
        if (url in json) return { status: 200, ok: true, json: async () => json[url] };
        if (url in pages) return { status: 200, ok: true, text: async () => pages[url] };
        return { status: 404, ok: false, text: async () => 'not found' };
    };
    return { fetchImpl, calls };
}

const base = {
    seeds: ['financial/angular', 'financial/react', 'procurement/react'],
    demoPages: [{ path: 'examples/', demoId: 'financial' }],
    productionSiteUrls: ['https://ag-grid.com', 'https://www.ag-grid.com'],
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
                href: `https://stackblitz.com/github/ag-grid/ag-charts/tree/latest/${SEEDS}/financial/react?x=1&title=AG%20Charts%20Demo%20(React)`,
            },
            { kind: 'github', framework: 'React', href: `${TREE}/latest/${SEEDS}/financial/react` },
        ]);
    });
});

describe('resolveSeedLink', () => {
    it('maps a StackBlitz link to the GitHub folder it imports', () => {
        expect(resolveSeedLink({ kind: 'stackblitz', href: seedLink('financial', 'vue', 'Vue').stackblitz })).toEqual({
            ref: 'latest',
            path: `${SEEDS}/financial/vue`,
            githubUrl: `${TREE}/latest/${SEEDS}/financial/vue`,
        });
    });

    it('rejects a link outside the repository or the seeds folder', () => {
        expect(
            resolveSeedLink({ kind: 'github', href: 'https://github.com/someone/else/tree/latest/x' }).error
        ).toMatch(/does not start with/);
        expect(resolveSeedLink({ kind: 'github', href: `${TREE}/latest/packages/ag-charts-demos/src` }).error).toMatch(
            /does not point into/
        );
        expect(resolveSeedLink({ kind: 'github', href: `${TREE}/latest/${SEEDS}/financial` }).error).toMatch(
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
            `HEAD ${TREE}/latest/${SEEDS}`,
            `GET ${STAGING}/examples/`,
            `HEAD ${TREE}/latest/${SEEDS}/financial/react`,
            `HEAD ${TREE}/latest/${SEEDS}/financial/angular`,
            `HEAD ${TREE}/latest/${SEEDS}/procurement/react`,
        ]);
    });

    it('fails when a folder a rendered link opens does not resolve', async () => {
        const missing = `${TREE}/latest/${SEEDS}/financial/angular`;
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
            expect(calls).toContain(`HEAD ${TREE}/release-14.2.0/${SEEDS}/financial/react`);
        });

        it('refuses to run from anything but a release branch', async () => {
            const { fetchImpl, calls } = fakeFetch({ json: meta });
            const result = await checkDemoSeedLinks({ ...base, siteUrl: PRODUCTION, fetchImpl });
            expect(result.ok).toBe(false);
            expect(result.errors[0]).toMatch(/current branch: latest/);
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

        it('only warns when the release tag predates the seeds folder', async () => {
            const { fetchImpl } = fakeFetch({
                json: meta,
                statuses: { [`${TREE}/release-14.2.0/${SEEDS}`]: 404 },
            });
            const result = await checkDemoSeedLinks({
                ...base,
                siteUrl: PRODUCTION,
                branch: () => 'b14.2.0',
                fetchImpl,
            });
            expect(result.ok).toBe(true);
            expect(result.warnings[0]).toMatch(/release-14\.2\.0 carries no/);
        });
    });
});
