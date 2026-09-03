import {
    getExampleCodeSandboxUrl,
    getExampleContentsUrl,
    getExampleFileUrl,
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

describe('gallery urlPaths', () => {
    // Each of these is a directory index served by Astro, so a slashless URL costs the visitor a
    // 301 hop -- and these URLs are set as iframe/fetch targets by client-only React components,
    // where a link crawler never sees them (SE-166).
    test.each`
        build                         | expected
        ${getExampleUrl}              | ${'/charts/gallery/examples/simple-bar/'}
        ${getExampleRunnerExampleUrl} | ${'/charts/gallery/examples/simple-bar/example-runner/'}
        ${getExamplePlunkrUrl}        | ${'/charts/gallery/examples/simple-bar/plunkr/'}
        ${getExampleCodeSandboxUrl}   | ${'/charts/gallery/examples/simple-bar/codesandbox/'}
    `('-> $expected', ({ build, expected }) => {
        expect(build({ exampleName })).toBe(expected);
    });

    it('builds the series page url', () => {
        expect(getPageUrl('bar-series')).toBe('/charts/gallery/bar-series/');
    });

    // File endpoints hang off the same base and must NOT gain a slash.
    it('leaves the file endpoints unslashed', () => {
        expect(getExampleContentsUrl({ exampleName })).toBe('/charts/gallery/examples/simple-bar/contents.json');
        expect(getExampleFileUrl({ exampleName, fileName: 'main.js' })).toBe(
            '/charts/gallery/examples/simple-bar/main.js'
        );
    });
});
