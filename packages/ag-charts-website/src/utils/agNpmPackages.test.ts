import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import agNpmPackages from '../../plugins/agNpmPackages';
import { NPM_PACKAGES_DIR, NPM_PACKAGE_NAMES } from './npmPackages';
import { publishNpmPackageTarballs } from './publishNpmPackages';

vi.mock('./publishNpmPackages', () => ({ publishNpmPackageTarballs: vi.fn() }));

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('agNpmPackages integration', () => {
    const publish = vi.mocked(publishNpmPackageTarballs);
    const buildDone = (enabled: boolean, dir = new URL('file:///site/dist/')) =>
        (agNpmPackages({ enabled }).hooks['astro:build:done'] as (opts: { dir: URL }) => Promise<void>)({ dir });

    beforeEach(() => {
        publish.mockReset();
        publish.mockResolvedValue([]);
        vi.spyOn(console, 'info').mockImplementation(() => {});
    });

    afterEach(() => vi.restoreAllMocks());

    it('publishes nothing in a build that does not deploy, so local and PR builds stay fast', async () => {
        await buildDone(false);

        expect(publish).not.toHaveBeenCalled();
    });

    it('publishes into the site output when the build deploys', async () => {
        await buildDone(true, new URL('file:///site/dist/'));

        expect(publish).toHaveBeenCalledTimes(1);
        expect(publish.mock.calls[0][0].outDir).toBe('/site/dist/');
    });

    it('reads the tarballs the packages write to <repo>/dist/packages/', async () => {
        await buildDone(true);

        expect(publish.mock.calls[0][0].sourceDir).toBe(join(repoRoot, 'dist', 'packages') + '/');
    });

    it('fails the build when the tarballs cannot be published, rather than deploying a site without them', async () => {
        publish.mockRejectedValue(new Error('missing packed tarball(s)'));

        await expect(buildDone(true)).rejects.toThrow('missing packed tarball(s)');
    });
});

describe('package `pack` targets feed the published tarballs', () => {
    // The plugin copies `<repo>/dist/packages/<name>.tgz`, so each package's `pack` target must write exactly there.
    describe.each(NPM_PACKAGE_NAMES)('%s', (name) => {
        const projectRoot = `packages/${name}`;
        const project = JSON.parse(readFileSync(join(repoRoot, projectRoot, 'project.json'), 'utf8'));
        const pack = project.targets.pack;

        it('has a pack target', () => {
            expect(project.name).toBe(name);
            expect(pack).toBeDefined();
        });

        it('writes <repo>/dist/packages/<name>.tgz', () => {
            const cwd = resolve(repoRoot, pack.options.cwd.replaceAll('{projectRoot}', projectRoot));
            const yarnPack: string = pack.options.commands.find((c: string) => c.startsWith('yarn pack'));
            const output = yarnPack.match(/ -o (\S+)/)![1].replaceAll('{projectRoot}', projectRoot);

            const written = isAbsolute(output) ? output : resolve(cwd, output);
            expect(written).toBe(join(repoRoot, 'dist', 'packages', `${name}.tgz`));
        });
    });

    it('serves them from the folder the .htaccess rule covers', () => {
        expect(NPM_PACKAGES_DIR).toBe('npm-packages');
    });
});
