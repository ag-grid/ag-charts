import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { NPM_PACKAGES_DIR, NPM_PACKAGE_NAMES } from './npmPackages';
import { publishNpmPackageTarballs } from './publishNpmPackages';

describe('publishNpmPackageTarballs', () => {
    let root: string;
    let sourceDir: string;
    let outDir: string;

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), 'ag-npm-packages-'));
        sourceDir = join(root, 'packed');
        outDir = join(root, 'site');
        await mkdir(sourceDir);
        await mkdir(outDir);
    });

    afterEach(() => rm(root, { recursive: true, force: true }));

    const pack = (names: readonly string[]) =>
        Promise.all(names.map((name) => writeFile(join(sourceDir, `${name}.tgz`), `tarball:${name}`)));

    it('names the eight AG Charts packages', () => {
        expect([...NPM_PACKAGE_NAMES].sort()).toEqual([
            'ag-charts-angular',
            'ag-charts-community',
            'ag-charts-core',
            'ag-charts-enterprise',
            'ag-charts-locale',
            'ag-charts-react',
            'ag-charts-types',
            'ag-charts-vue3',
        ]);
    });

    it('copies each tarball to npm-packages/<name>.tgz, with no version in the name', async () => {
        await pack(NPM_PACKAGE_NAMES);
        await writeFile(join(sourceDir, 'ag-charts-website.tgz'), 'not published');

        const published = await publishNpmPackageTarballs({ sourceDir, outDir });

        expect(published).toHaveLength(NPM_PACKAGE_NAMES.length);
        expect((await readdir(join(outDir, NPM_PACKAGES_DIR))).sort()).toEqual(
            NPM_PACKAGE_NAMES.map((name) => `${name}.tgz`).sort()
        );
        expect(await readFile(join(outDir, NPM_PACKAGES_DIR, 'ag-charts-react.tgz'), 'utf8')).toBe(
            'tarball:ag-charts-react'
        );
    });

    it('overwrites the previous deploy of the same name', async () => {
        await pack(NPM_PACKAGE_NAMES);
        await publishNpmPackageTarballs({ sourceDir, outDir });
        await writeFile(join(sourceDir, 'ag-charts-core.tgz'), 'rebuilt');

        await publishNpmPackageTarballs({ sourceDir, outDir });

        expect(await readFile(join(outDir, NPM_PACKAGES_DIR, 'ag-charts-core.tgz'), 'utf8')).toBe('rebuilt');
    });

    it('fails, naming what is missing, instead of publishing a partial set', async () => {
        await pack(NPM_PACKAGE_NAMES.filter((name) => name !== 'ag-charts-vue3' && name !== 'ag-charts-locale'));

        const failure = publishNpmPackageTarballs({ sourceDir, outDir });

        await expect(failure).rejects.toThrow(/ag-charts-locale\.tgz[\s\S]*ag-charts-vue3\.tgz/);
    });
});

describe('ag-charts-website build wiring', () => {
    const project = JSON.parse(readFileSync(join(__dirname, '../../project.json'), 'utf8'));
    const build = project.targets.build;

    it('packs every published package before the site builds, whatever the build configuration', () => {
        const packed = build.dependsOn
            .filter((dep: unknown) => typeof dep === 'object' && (dep as { target?: string }).target === 'pack')
            .flatMap((dep: { projects: string[] }) => dep.projects);
        expect([...packed].sort()).toEqual([...NPM_PACKAGE_NAMES].sort());
    });

    it('publishes the tarballs from the builds that deploy: staging and archive', () => {
        expect(build.configurations.staging.env).toMatchObject({ PUBLISH_NPM_PACKAGES: 'true' });
        expect(build.configurations.archive.env).toMatchObject({ PUBLISH_NPM_PACKAGES: 'true' });
    });

    it('keeps the tarballs out of production, whose seeds install from npm', () => {
        expect(build.configurations.production.env ?? {}).not.toHaveProperty('PUBLISH_NPM_PACKAGES');
    });
});
