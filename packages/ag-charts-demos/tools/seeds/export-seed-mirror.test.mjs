import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
    CHARTS_BUILD_PACKAGES,
    exportSeedMirror,
    listMirroredSeeds,
    rewriteChartsBuildPins,
    rewriteMarkdownLinks,
} from './export-seed-mirror.mjs';

const TREE = 'https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-demos';
const BLOB = 'https://github.com/ag-grid/ag-charts/blob/latest/packages/ag-charts-demos';

let root;
let seedsDir;

function writeFile(path, content = '') {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
}

function writeSeed(demo, framework, files = {}, manifest = {}) {
    writeFile(`seeds/${demo}/${framework}/.seed-manifest.json`, JSON.stringify({ demo, framework, ...manifest }));
    for (const [path, content] of Object.entries({ 'package.json': '{}', ...files })) {
        writeFile(`seeds/${demo}/${framework}/${path}`, content);
    }
}

beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'seed-mirror-'));
    seedsDir = join(root, 'seeds');
    writeFile('src/demos/trading-terminal/index.tsx');
    writeFile('seeds/project.json', '{}');
    writeFile('LICENSE.txt', 'The MIT License\n');
});
afterEach(() => {
    rmSync(root, { recursive: true, force: true });
});

describe('listMirroredSeeds', () => {
    it('lists folders with a manifest, demos in registry order and frameworks in site order', () => {
        writeSeed('trading-terminal', 'typescript');
        writeSeed('trading-terminal', 'react');
        writeSeed('trading-terminal', 'svelte');
        writeSeed('web-analytics', 'vue');
        mkdirSync(join(seedsDir, 'web-analytics', 'angular'));

        expect(listMirroredSeeds({ seedsDir, demoIds: ['web-analytics', 'trading-terminal', 'procurement'] })).toEqual([
            { demo: 'web-analytics', framework: 'vue' },
            { demo: 'trading-terminal', framework: 'react' },
            { demo: 'trading-terminal', framework: 'typescript' },
            { demo: 'trading-terminal', framework: 'svelte' },
        ]);
    });
});

describe('rewriteMarkdownLinks', () => {
    const rewrite = (markdown, mirrored = []) =>
        rewriteMarkdownLinks(markdown, {
            file: 'trading-terminal/angular/README.md',
            ref: 'latest',
            mirrored: new Set(mirrored),
            seedsDir,
        });

    it('points a link that leaves the mirror at the same folder or file in ag-charts', () => {
        writeFile('src/demos/trading-terminal/data.ts');
        expect(
            rewrite(
                '[source](../../../src/demos/trading-terminal) and [data](../../../src/demos/trading-terminal/data.ts)'
            )
        ).toBe(`[source](${TREE}/src/demos/trading-terminal) and [data](${BLOB}/src/demos/trading-terminal/data.ts)`);
    });

    it('keeps a link to something the mirror carries, and any fragment', () => {
        writeFile('seeds/trading-terminal/angular.PORTING.md');
        expect(rewrite('[notes](../angular.PORTING.md#grid)', ['trading-terminal/angular.PORTING.md'])).toBe(
            '[notes](../angular.PORTING.md#grid)'
        );
        expect(rewrite('[src](./src/)', ['trading-terminal/angular/src/main.ts'])).toBe('[src](./src/)');
    });

    it('carries the fragment over to the rewritten link', () => {
        expect(rewrite('[source](../../../src/demos/trading-terminal#top)')).toBe(
            `[source](${TREE}/src/demos/trading-terminal#top)`
        );
    });

    it('leaves absolute links and anchors alone', () => {
        const markdown = '[docs](https://www.ag-grid.com/charts/) [top](#run-it) [root](/x) [mail](mailto:a@b.c)';
        expect(rewrite(markdown)).toBe(markdown);
    });

    it('rewrites a link into the seeds folder the mirror leaves out', () => {
        expect(rewrite('[nx](../../project.json)')).toBe(`[nx](${BLOB}/seeds/project.json)`);
    });

    it('fails on a link to a path that does not exist', () => {
        expect(() => rewrite('[gone](../../../src/demos/missing)')).toThrow(/does not exist/);
    });
});

describe('exportSeedMirror', () => {
    let outDir;
    const run = (options = {}) =>
        exportSeedMirror({
            outDir,
            ref: 'b14.3.0',
            seedsDir,
            demoIds: ['trading-terminal', 'procurement'],
            licensePath: join(root, 'LICENSE.txt'),
            ...options,
        });

    beforeEach(() => {
        outDir = join(root, 'out');
        writeSeed('trading-terminal', 'react', {
            'README.md': '[source](../../../src/demos/trading-terminal)',
            'src/main.tsx': 'main',
        });
        writeSeed('trading-terminal', 'angular', { 'README.md': '[notes](../angular.PORTING.md)' });
        writeFile('seeds/trading-terminal/angular.PORTING.md', '# Porting');
        writeFile('seeds/trading-terminal/vue.PORTING.md', '# Not a seed');
    });

    it('writes each seed at <demo>/<framework>, with the root files ag-grid-demos has', () => {
        expect(run()).toEqual([
            '.gitignore',
            '.vscode/settings.json',
            'LICENSE.txt',
            'README.md',
            'trading-terminal/README.md',
            'trading-terminal/angular.PORTING.md',
            'trading-terminal/angular/.seed-manifest.json',
            'trading-terminal/angular/README.md',
            'trading-terminal/angular/package.json',
            'trading-terminal/react/.seed-manifest.json',
            'trading-terminal/react/README.md',
            'trading-terminal/react/package.json',
            'trading-terminal/react/src/main.tsx',
        ]);
        const read = (path) => readFileSync(join(outDir, path), 'utf8');
        expect(read('trading-terminal/react/README.md')).toBe(
            '[source](https://github.com/ag-grid/ag-charts/tree/b14.3.0/packages/ag-charts-demos/src/demos/trading-terminal)'
        );
        expect(read('trading-terminal/angular/README.md')).toBe('[notes](../angular.PORTING.md)');
        expect(read('LICENSE.txt')).toBe('The MIT License\n');
        expect(read('trading-terminal/README.md')).toContain('- [React](./react/)\n- [Angular](./angular/)\n');
        expect(read('README.md')).toContain(
            '| Trading Terminal | Angular | [`trading-terminal/angular`](./trading-terminal/angular) |'
        );
        expect(read('README.md')).toContain('https://github.com/ag-grid/ag-charts/issues');
        expect(read('.gitignore').split('\n')).toContain('node_modules');
    });

    it('refuses a folder that already has content, and a missing ref', () => {
        writeFile('out/stale.txt');
        expect(() => run()).toThrow(/not empty/);
        expect(() => run({ ref: '' })).toThrow(/ref/);
    });

    it('fails when there are no seeds to publish', () => {
        expect(() => run({ demoIds: ['procurement'] })).toThrow(/No seeds/);
    });
});

describe('rewriteChartsBuildPins', () => {
    const PREFIX = 'https://charts-staging.ag-grid.com/npm-packages';
    const url = (name) => `${PREFIX}/${name}.tgz`;
    const SHARED = [
        'ag-charts-types',
        'ag-charts-core',
        'ag-charts-locale',
        'ag-charts-community',
        'ag-charts-enterprise',
    ];

    it.each([
        ['react', 'ag-charts-react'],
        ['angular', 'ag-charts-angular'],
        ['vue', 'ag-charts-vue3'],
        ['typescript', undefined],
    ])('points a %s seed at the tarballs and overrides the shared packages and its wrapper', (_framework, wrapper) => {
        const packageJson = {
            name: 'seed',
            dependencies: {
                'ag-charts-community': 'latest',
                'ag-charts-enterprise': 'latest',
                ...(wrapper && { [wrapper]: 'latest' }),
                'ag-grid-community': '~36.2.0',
                rxjs: '~7.8.2',
            },
            devDependencies: { typescript: '~5.8.3' },
        };

        const result = rewriteChartsBuildPins(packageJson, PREFIX);

        expect(result.dependencies).toEqual({
            'ag-charts-community': url('ag-charts-community'),
            'ag-charts-enterprise': url('ag-charts-enterprise'),
            ...(wrapper && { [wrapper]: url(wrapper) }),
            'ag-grid-community': '~36.2.0',
            rxjs: '~7.8.2',
        });
        expect(result.devDependencies).toEqual({ typescript: '~5.8.3' });
        const expectedOverrides = [...SHARED, ...(wrapper ? [wrapper] : [])];
        expect(result.overrides).toEqual(Object.fromEntries(expectedOverrides.map((name) => [name, url(name)])));
        expect(Object.keys(result)).toEqual(['name', 'dependencies', 'devDependencies', 'overrides']);
    });

    it('rewrites ag-charts-* entries in every dependency section and keeps existing overrides', () => {
        const result = rewriteChartsBuildPins(
            {
                devDependencies: { 'ag-charts-types': '1.0.0' },
                peerDependencies: { 'ag-charts-react': '^1.0.0' },
                overrides: { foo: '1.0.0' },
            },
            PREFIX
        );
        expect(result.devDependencies).toEqual({ 'ag-charts-types': url('ag-charts-types') });
        expect(result.peerDependencies).toEqual({ 'ag-charts-react': url('ag-charts-react') });
        expect(result.overrides).toEqual({
            foo: '1.0.0',
            ...Object.fromEntries([...SHARED, 'ag-charts-react'].map((name) => [name, url(name)])),
        });
    });

    it('accepts the prefix with or without trailing slashes', () => {
        const packageJson = { dependencies: { 'ag-charts-community': 'latest' } };
        const expected = rewriteChartsBuildPins(packageJson, PREFIX);
        expect(rewriteChartsBuildPins(packageJson, `${PREFIX}/`)).toEqual(expected);
        expect(rewriteChartsBuildPins(packageJson, `${PREFIX}//`)).toEqual(expected);
    });

    it('does not change the package.json it is given', () => {
        const packageJson = { dependencies: { 'ag-charts-community': 'latest' } };
        rewriteChartsBuildPins(packageJson, PREFIX);
        expect(packageJson).toEqual({ dependencies: { 'ag-charts-community': 'latest' } });
    });

    it('fails on an ag-charts package that has no tarball', () => {
        expect(() => rewriteChartsBuildPins({ dependencies: { 'ag-charts-nope': 'latest' } }, PREFIX)).toThrow(
            /ag-charts-nope has no build tarball/
        );
    });

    it('names the eight packages a docs site serves', () => {
        expect([...CHARTS_BUILD_PACKAGES].sort()).toEqual([
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
});

describe('exportSeedMirror with a charts build', () => {
    const PREFIX = 'https://charts-staging.ag-grid.com/npm-packages';
    const url = (name) => `${PREFIX}/${name}.tgz`;
    const packageJsonOf = (wrapper, version) =>
        `${JSON.stringify(
            {
                name: 'seed',
                dependencies: {
                    'ag-charts-community': version,
                    'ag-charts-enterprise': version,
                    ...(wrapper && { [wrapper]: version }),
                    'ag-grid-enterprise': '~36.2.0',
                },
            },
            null,
            4
        )}\n`;
    let outDir;
    const run = (options = {}) =>
        exportSeedMirror({
            outDir,
            ref: 'staging',
            seedsDir,
            demoIds: ['trading-terminal'],
            licensePath: join(root, 'LICENSE.txt'),
            ...options,
        });
    const read = (path) => readFileSync(join(outDir, path), 'utf8');
    const readPackage = (framework) => JSON.parse(read(`trading-terminal/${framework}/package.json`));

    beforeEach(() => {
        outDir = join(root, 'out');
        const distTag = { pinSource: 'dist-tag', pinnedVersion: 'latest' };
        writeSeed('trading-terminal', 'react', { 'package.json': packageJsonOf('ag-charts-react', 'latest') }, distTag);
        writeSeed(
            'trading-terminal',
            'angular',
            { 'package.json': packageJsonOf('ag-charts-angular', 'latest') },
            distTag
        );
        writeSeed('trading-terminal', 'vue', { 'package.json': packageJsonOf('ag-charts-vue3', 'latest') }, distTag);
        writeSeed('trading-terminal', 'typescript', { 'package.json': packageJsonOf(undefined, 'latest') }, distTag);
    });

    it.each([
        ['react', 'ag-charts-react'],
        ['angular', 'ag-charts-angular'],
        ['vue', 'ag-charts-vue3'],
        ['typescript', undefined],
    ])('rewrites the %s seed pinned to the dist-tag', (framework, wrapper) => {
        run({ chartsBuild: PREFIX });

        const packageJson = readPackage(framework);
        const expected = ['ag-charts-community', 'ag-charts-enterprise', ...(wrapper ? [wrapper] : [])];
        expect(
            Object.fromEntries(
                Object.entries(packageJson.dependencies).filter(([name]) => name.startsWith('ag-charts-'))
            )
        ).toEqual(Object.fromEntries(expected.map((name) => [name, url(name)])));
        expect(packageJson.dependencies['ag-grid-enterprise']).toBe('~36.2.0');
        expect(packageJson.overrides).toEqual(
            Object.fromEntries(
                [
                    'ag-charts-types',
                    'ag-charts-core',
                    'ag-charts-locale',
                    'ag-charts-community',
                    'ag-charts-enterprise',
                    ...(wrapper ? [wrapper] : []),
                ].map((name) => [name, url(name)])
            )
        );
        expect(read(`trading-terminal/${framework}/package.json`).endsWith('}\n')).toBe(true);
    });

    it('never rewrites a seed pinned to a release', () => {
        const releaseJson = packageJsonOf('ag-charts-react', '14.2.0');
        writeSeed(
            'trading-terminal',
            'react',
            { 'package.json': releaseJson },
            { pinSource: 'release', pinnedVersion: '14.2.0' }
        );
        run({ chartsBuild: PREFIX });

        expect(read('trading-terminal/react/package.json')).toBe(releaseJson);
        expect(readPackage('angular').overrides).toBeDefined();
    });

    it('leaves a seed whose manifest has no pinSource alone', () => {
        const json = packageJsonOf('ag-charts-react', 'latest');
        writeSeed('trading-terminal', 'react', { 'package.json': json });
        run({ chartsBuild: PREFIX });
        expect(read('trading-terminal/react/package.json')).toBe(json);
    });

    it('changes nothing without the option', () => {
        run();
        for (const framework of ['react', 'angular', 'vue', 'typescript']) {
            expect(read(`trading-terminal/${framework}/package.json`)).toBe(
                readFileSync(join(seedsDir, 'trading-terminal', framework, 'package.json'), 'utf8')
            );
        }
    });

    it('writes the same files, and the same content apart from package.json, with the option', () => {
        const plain = run();
        const plainContent = Object.fromEntries(plain.map((path) => [path, read(path)]));
        rmSync(outDir, { recursive: true });

        const rewritten = run({ chartsBuild: PREFIX });
        expect(rewritten).toEqual(plain);
        for (const path of plain.filter((file) => !/^trading-terminal\/[a-z]+\/package\.json$/.test(file))) {
            expect(read(path)).toBe(plainContent[path]);
        }
    });

    it('gives the same result for a prefix with or without a trailing slash', () => {
        run({ chartsBuild: `${PREFIX}/` });
        const withSlash = readPackage('vue');
        rmSync(outDir, { recursive: true });
        run({ chartsBuild: PREFIX });
        expect(readPackage('vue')).toEqual(withSlash);
        expect(withSlash.overrides['ag-charts-vue3']).toBe(url('ag-charts-vue3'));
    });

    it('does not touch the committed seed', () => {
        const before = readFileSync(join(seedsDir, 'trading-terminal', 'react', 'package.json'), 'utf8');
        run({ chartsBuild: PREFIX });
        expect(readFileSync(join(seedsDir, 'trading-terminal', 'react', 'package.json'), 'utf8')).toBe(before);
    });

    it('rejects a prefix that is not an http(s) URL', () => {
        expect(() => run({ chartsBuild: '' })).toThrow(/--charts-build/);
        expect(() => run({ chartsBuild: 'charts-staging.ag-grid.com/npm-packages' })).toThrow(/--charts-build/);
    });
});
