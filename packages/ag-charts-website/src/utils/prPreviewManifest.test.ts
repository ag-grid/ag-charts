import { NPM_CDN } from '@constants';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ExampleFramework } from './example-modules/getImportMap';
import {
    ALL_EXAMPLE_FRAMEWORKS,
    type PrPreviewManifest,
    type StagedEntry,
    buildPrPreviewPlan,
    packageNameOf,
    packageRelativePath,
    previewBaseUrl,
    sourcePathOf,
} from './prPreviewManifest';

/**
 * The preview has to carry every file an exported Plunker's import map asks for. These tests read
 * the import map the site actually emits — in published-packages mode, the form a plunk carries —
 * and require each AG entry to resolve through the manifest onto something the preview publishes.
 * A new wrapper entry, or a moved entry point, fails here rather than as a broken repro link.
 */

const ARGS = { repo: 'ag-grid/ag-charts', pr: 8231, sha: '0123abcdef' } as const;

const REPO_ROOT = join(__dirname, '../../../..');

const publishedMode = async () => {
    vi.stubEnv('PUBLIC_USE_PUBLISHED_PACKAGES', 'true');
    vi.resetModules();
    return {
        getImportMap: (await import('./example-modules/getImportMap')).getImportMap,
        buildPlan: (await import('./prPreviewManifest')).buildPrPreviewPlan,
    };
};

const isAgSpecifier = (specifier: string) => specifier.startsWith('ag-') || specifier.startsWith('@ag-');

/** The manifest's own longest-prefix lookup, as a consumer of the manifest has to implement it. */
const resolveThroughManifest = (manifest: PrPreviewManifest, packageName: string, relativePath: string) => {
    const paths = manifest.packages[packageName]?.paths;
    if (paths == null) {
        return undefined;
    }
    const key = Object.keys(paths)
        .sort((a, b) => b.length - a.length)
        .find((candidate) =>
            candidate.endsWith('/') ? relativePath.startsWith(candidate) : candidate === relativePath
        );
    return key === undefined ? undefined : paths[key] + (key.endsWith('/') ? relativePath.slice(key.length) : '');
};

const isPublished = (entries: StagedEntry[], target: string) =>
    entries.some((entry) => (entry.target.endsWith('/') ? target.startsWith(entry.target) : entry.target === target));

describe('buildPrPreviewPlan', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    test('bases the preview on the repo it was built for', () => {
        expect(previewBaseUrl({ repo: 'ag-grid/ag-charts', pr: 7 })).toBe('https://ag-grid.github.io/ag-charts/pr-7/');
        expect(() => previewBaseUrl({ repo: 'ag-charts', pr: 7 })).toThrow();
    });

    test('publishes both UMD bundles flat at the root, under the names already linked', () => {
        const { manifest, entries } = buildPrPreviewPlan(ARGS);

        expect(manifest.umd).toEqual({
            'ag-charts-community': 'ag-charts-community.min.js',
            'ag-charts-enterprise': 'ag-charts-enterprise.min.js',
        });
        for (const filename of Object.values(manifest.umd)) {
            expect(isPublished(entries, filename)).toBe(true);
        }
    });

    test('carries the schema the pin reads', () => {
        const { manifest } = buildPrPreviewPlan(ARGS);

        expect(manifest.version).toBe(1);
        expect(manifest.repo).toBe('ag-grid/ag-charts');
        expect(manifest.pr).toBe(8231);
        expect(manifest.sha).toBe('0123abcdef');
        expect(manifest.base).toBe('https://ag-grid.github.io/ag-charts/pr-8231/');
        expect(Object.keys(manifest.packages)).toContain('ag-charts-community');
    });

    test('publishes only packages this repo builds', () => {
        const { manifest } = buildPrPreviewPlan(ARGS);

        for (const packageName of Object.keys(manifest.packages)) {
            expect(packageName, packageName).toMatch(/^ag-charts-/);
        }
    });

    test('derives the same manifest whichever mode built the import map', async () => {
        const local = buildPrPreviewPlan(ARGS);
        const { buildPlan } = await publishedMode();

        expect(buildPlan(ARGS).manifest).toEqual(local.manifest);
    });

    describe.each(ALL_EXAMPLE_FRAMEWORKS)('%s', (framework: ExampleFramework) => {
        test('every AG import-map value resolves into the preview', async () => {
            const { getImportMap, buildPlan } = await publishedMode();
            const { manifest, entries } = buildPlan(ARGS);
            const importMap = getImportMap({ framework });

            const agEntries = Object.entries(importMap).filter(([specifier]) => isAgSpecifier(specifier));
            expect(agEntries.length).toBeGreaterThan(0);

            for (const [specifier, url] of agEntries) {
                const packageName = packageNameOf(specifier);
                expect(url, specifier).satisfies((value: string) => value.startsWith(`${NPM_CDN}/${packageName}@`));

                const relativePath = packageRelativePath(packageName, url);
                expect(relativePath, `${specifier} -> ${url}`).toBeDefined();

                const target = resolveThroughManifest(manifest, packageName, relativePath!);
                expect(target, `${specifier} -> ${url}`).toBeDefined();
                expect(isPublished(entries, target!), `${specifier} -> ${target}`).toBe(true);
            }
        });

        test('leaves every non-AG value alone', async () => {
            const { getImportMap, buildPlan } = await publishedMode();
            const { manifest } = buildPlan(ARGS);
            const importMap = getImportMap({ framework });

            for (const specifier of Object.keys(importMap)) {
                if (!isAgSpecifier(specifier)) {
                    expect(manifest.packages[packageNameOf(specifier)], specifier).toBeUndefined();
                }
            }
        });
    });

    test('covers every wrapper, not just the packages every framework loads', () => {
        const { manifest } = buildPrPreviewPlan(ARGS);

        expect(Object.keys(manifest.packages).sort()).toEqual([
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

    test('records the version each package is asked for', () => {
        const { manifest } = buildPrPreviewPlan({ ...ARGS, versionOf: (packageName) => `1.2.3-${packageName}` });

        for (const [packageName, { version }] of Object.entries(manifest.packages)) {
            expect(version, packageName).toBe(`1.2.3-${packageName}`);
        }
    });

    test('names the version the published URLs ask for', async () => {
        const { getImportMap, buildPlan } = await publishedMode();
        const { manifest } = buildPlan(ARGS);
        const importMap = getImportMap({ framework: 'react' });

        for (const [packageName, { version }] of Object.entries(manifest.packages)) {
            const url = importMap[packageName];
            if (url != null && url !== '') {
                expect(url, packageName).satisfies((value: string) =>
                    value.startsWith(`${NPM_CDN}/${packageName}@${version}/`)
                );
            }
        }
    });

    // Each staged source is where the package's own build puts the file it publishes, so the
    // package manifest is the only thing that can say whether this repo still agrees with npm.
    test('stages each entry point from where the package says it builds it', () => {
        const { entries, manifest } = buildPrPreviewPlan(ARGS);
        const umdFilenames = new Set(Object.values(manifest.umd));

        for (const { target, source } of entries) {
            if (umdFilenames.has(target)) {
                continue; // The UMD bundles are not named by any package.json entry field.
            }
            const packageName = packageNameOf(target);
            const packageJson = JSON.parse(
                readFileSync(join(REPO_ROOT, 'packages', packageName, 'package.json'), 'utf8')
            );
            const declared = [packageJson.module, packageJson.exports?.['.']?.import].filter(Boolean) as string[];

            expect(declared.length, packageName).toBeGreaterThan(0);
            expect(
                declared.map((entry) => `packages/${packageName}/${entry.replace(/^\.\//, '')}`),
                `${target} <- ${source}`
            ).toContain(source);
        }
    });
});

describe('packageRelativePath', () => {
    test.each([
        ['ag-charts-community', `${NPM_CDN}/ag-charts-community@14.2.0/dist/package/main.esm.mjs`],
        ['ag-charts-community', 'dev/ag-charts-community/dist/package/main.esm.mjs'],
        ['ag-charts-community', 'https://ag-grid.com/charts/dev/ag-charts-community/dist/package/main.esm.mjs'],
    ])('reads the %s path out of %s', (packageName, url) => {
        expect(packageRelativePath(packageName, url)).toBe('dist/package/main.esm.mjs');
    });

    test('keeps a trailing slash, so a prefix stays a prefix', () => {
        expect(packageRelativePath('ag-charts-community', `${NPM_CDN}/ag-charts-community@14.2.0/styles/`)).toBe(
            'styles/'
        );
    });

    test('does not mistake a filename repeating the package name for the package segment', () => {
        expect(packageRelativePath('ag-charts-angular', 'dev/ag-charts-angular/fesm2022/ag-charts-angular.mjs')).toBe(
            'fesm2022/ag-charts-angular.mjs'
        );
    });

    test('is undefined when the package does not appear', () => {
        expect(packageRelativePath('ag-charts-community', 'https://esm.sh/react@19.2.4')).toBeUndefined();
    });
});

describe('sourcePathOf', () => {
    test('defaults to the package directory', () => {
        expect(sourcePathOf('ag-charts-community', 'dist/package/main.esm.mjs')).toBe(
            'packages/ag-charts-community/dist/package/main.esm.mjs'
        );
    });

    test("uses the Angular library's ng-packagr root, which is one level down", () => {
        expect(sourcePathOf('ag-charts-angular', 'fesm2022/ag-charts-angular.mjs')).toBe(
            'packages/ag-charts-angular/dist/ag-charts-angular/fesm2022/ag-charts-angular.mjs'
        );
    });
});
