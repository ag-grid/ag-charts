import {
    getExampleCodeSandboxUrl,
    getExampleContentsUrl,
    getExampleFileUrl,
    getExampleLinkUrl,
    getExamplePlunkrUrl,
    getExampleRunnerExampleUrl,
    getExampleUrl,
    getPageUrl,
} from './urlPaths';

// Pin the base to the production `/charts` value; the ambient test env resolves it to `/`.
vi.mock('@constants', async (importActual) => {
    const actual = await importActual<typeof import('../../../constants')>();
    return { ...actual, SITE_BASE_URL: '/charts/' };
});

const exampleName = 'simple-bar';
const base = '/charts/gallery/examples/simple-bar';

describe('gallery urlPaths', () => {
    // Each of these is a directory index served by Astro, so a slashless URL costs the visitor a
    // 301 hop -- and these URLs are set as iframe/fetch targets by client-only React components,
    // where a link crawler never sees them (SE-166).
    test.each`
        build                         | expected
        ${getExampleLinkUrl}          | ${`${base}/`}
        ${getExampleRunnerExampleUrl} | ${`${base}/example-runner/`}
        ${getExamplePlunkrUrl}        | ${`${base}/plunkr/`}
        ${getExampleCodeSandboxUrl}   | ${`${base}/codesandbox/`}
    `('-> $expected', ({ build, expected }) => {
        expect(build({ exampleName })).toBe(expected);
    });

    it('builds the series page url', () => {
        expect(getPageUrl('bar-series')).toBe('/charts/gallery/bar-series/');
    });

    // `getExampleUrl` is a base, not a link: it becomes `appLocation`, which `SystemJs` injects
    // verbatim as the SystemJS `app` module-map target. It must stay unslashed.
    it('leaves the example base unslashed for appLocation', () => {
        expect(getExampleUrl({ exampleName })).toBe(base);
    });

    // File endpoints hang off the same base and must NOT gain a slash.
    it('leaves the file endpoints unslashed', () => {
        expect(getExampleContentsUrl({ exampleName })).toBe(`${base}/contents.json`);
        expect(getExampleFileUrl({ exampleName, fileName: 'main.js' })).toBe(`${base}/main.js`);
    });
});
