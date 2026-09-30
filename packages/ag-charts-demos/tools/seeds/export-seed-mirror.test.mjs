import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { exportSeedMirror, listMirroredSeeds, rewriteMarkdownLinks } from './export-seed-mirror.mjs';

const TREE = 'https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-demos';
const BLOB = 'https://github.com/ag-grid/ag-charts/blob/latest/packages/ag-charts-demos';

let root;
let seedsDir;

function writeFile(path, content = '') {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
}

function writeSeed(demo, framework, files = {}) {
    writeFile(`seeds/${demo}/${framework}/.seed-manifest.json`, JSON.stringify({ demo, framework }));
    for (const [path, content] of Object.entries({ 'package.json': '{}', ...files })) {
        writeFile(`seeds/${demo}/${framework}/${path}`, content);
    }
}

beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'seed-mirror-'));
    seedsDir = join(root, 'seeds');
    writeFile('src/demos/financial/index.tsx');
    writeFile('seeds/project.json', '{}');
    writeFile('LICENSE.txt', 'The MIT License\n');
});
afterEach(() => {
    rmSync(root, { recursive: true, force: true });
});

describe('listMirroredSeeds', () => {
    it('lists folders with a manifest, demos in registry order and frameworks in site order', () => {
        writeSeed('financial', 'typescript');
        writeSeed('financial', 'react');
        writeSeed('financial', 'svelte');
        writeSeed('web-analytics', 'vue');
        mkdirSync(join(seedsDir, 'web-analytics', 'angular'));

        expect(listMirroredSeeds({ seedsDir, demoIds: ['web-analytics', 'financial', 'procurement'] })).toEqual([
            { demo: 'web-analytics', framework: 'vue' },
            { demo: 'financial', framework: 'react' },
            { demo: 'financial', framework: 'typescript' },
            { demo: 'financial', framework: 'svelte' },
        ]);
    });
});

describe('rewriteMarkdownLinks', () => {
    const rewrite = (markdown, mirrored = []) =>
        rewriteMarkdownLinks(markdown, {
            file: 'financial/angular/README.md',
            ref: 'latest',
            mirrored: new Set(mirrored),
            seedsDir,
        });

    it('points a link that leaves the mirror at the same folder or file in ag-charts', () => {
        writeFile('src/demos/financial/data.ts');
        expect(rewrite('[source](../../../src/demos/financial) and [data](../../../src/demos/financial/data.ts)')).toBe(
            `[source](${TREE}/src/demos/financial) and [data](${BLOB}/src/demos/financial/data.ts)`
        );
    });

    it('keeps a link to something the mirror carries, and any fragment', () => {
        writeFile('seeds/financial/angular.PORTING.md');
        expect(rewrite('[notes](../angular.PORTING.md#grid)', ['financial/angular.PORTING.md'])).toBe(
            '[notes](../angular.PORTING.md#grid)'
        );
        expect(rewrite('[src](./src/)', ['financial/angular/src/main.ts'])).toBe('[src](./src/)');
    });

    it('carries the fragment over to the rewritten link', () => {
        expect(rewrite('[source](../../../src/demos/financial#top)')).toBe(`[source](${TREE}/src/demos/financial#top)`);
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
            demoIds: ['financial', 'procurement'],
            licensePath: join(root, 'LICENSE.txt'),
            ...options,
        });

    beforeEach(() => {
        outDir = join(root, 'out');
        writeSeed('financial', 'react', {
            'README.md': '[source](../../../src/demos/financial)',
            'src/main.tsx': 'main',
        });
        writeSeed('financial', 'angular', { 'README.md': '[notes](../angular.PORTING.md)' });
        writeFile('seeds/financial/angular.PORTING.md', '# Porting');
        writeFile('seeds/financial/vue.PORTING.md', '# Not a seed');
    });

    it('writes each seed at <demo>/<framework>, with the root files ag-grid-demos has', () => {
        expect(run()).toEqual([
            '.gitignore',
            '.vscode/settings.json',
            'LICENSE.txt',
            'README.md',
            'financial/README.md',
            'financial/angular.PORTING.md',
            'financial/angular/.seed-manifest.json',
            'financial/angular/README.md',
            'financial/angular/package.json',
            'financial/react/.seed-manifest.json',
            'financial/react/README.md',
            'financial/react/package.json',
            'financial/react/src/main.tsx',
        ]);
        const read = (path) => readFileSync(join(outDir, path), 'utf8');
        expect(read('financial/react/README.md')).toBe(
            '[source](https://github.com/ag-grid/ag-charts/tree/b14.3.0/packages/ag-charts-demos/src/demos/financial)'
        );
        expect(read('financial/angular/README.md')).toBe('[notes](../angular.PORTING.md)');
        expect(read('LICENSE.txt')).toBe('The MIT License\n');
        expect(read('financial/README.md')).toContain('- [React](./react/)\n- [Angular](./angular/)\n');
        expect(read('README.md')).toContain('| Financial | Angular | [`financial/angular`](./financial/angular) |');
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
