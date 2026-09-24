import {
    getExampleCodeSandboxUrl,
    getExampleContentsUrl,
    getExampleFileUrl,
    getExampleLinkUrl,
    getExamplePlunkrUrl,
    getExampleRunnerExampleUrl,
    getExampleUrl,
} from './urlPaths';

// Pin the base to the production `/charts` value; the ambient test env resolves it to `/`.
vi.mock('@constants', async (importActual) => {
    const actual = await importActual<typeof import('../../../constants')>();
    return { ...actual, SITE_BASE_URL: '/charts/' };
});

const example = { internalFramework: 'vanilla', pageName: 'map-markers', exampleName: 'marker-size' } as const;
const base = '/charts/vanilla/map-markers/examples/marker-size';

describe('docs urlPaths', () => {
    // Each of these is a directory index served by Astro, so a slashless URL costs the visitor a
    // 301 hop -- and these URLs are set as iframe/fetch targets by client-only React components,
    // where a link crawler never sees them (SE-166).
    test.each`
        build                         | expected
        ${getExampleUrl}              | ${`${base}/`}
        ${getExampleLinkUrl}          | ${`${base}/`}
        ${getExampleRunnerExampleUrl} | ${`${base}/example-runner/`}
        ${getExamplePlunkrUrl}        | ${`${base}/plunkr/`}
        ${getExampleCodeSandboxUrl}   | ${`${base}/codesandbox/`}
    `('-> $expected', ({ build, expected }) => {
        expect(build(example)).toBe(expected);
    });

    // The shared docs components link to the example page through this name; grid needs it to
    // differ from `getExampleUrl` because its base is slash-less, whereas here they coincide.
    it('links to the example page at the same url as the example base', () => {
        expect(getExampleLinkUrl(example)).toBe(getExampleUrl(example));
    });

    // File endpoints hang off the same base and must NOT gain a slash.
    it('leaves the file endpoints unslashed', () => {
        expect(getExampleContentsUrl(example)).toBe(`${base}/contents.json`);
        expect(getExampleFileUrl({ ...example, fileName: 'main.js' })).toBe(`${base}/main.js`);
    });
});
