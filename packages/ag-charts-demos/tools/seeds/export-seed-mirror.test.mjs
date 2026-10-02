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
        expect(rewrite('[source](../../../src/demos/trading-terminal) and [data](../../../src/demos/trading-terminal/data.ts)')).toBe(
            `[source](${TREE}/src/demos/trading-terminal) and [data](${BLOB}/src/demos/trading-terminal/data.ts)`
        );
    });

    it('keeps a link to something the mirror carries, and any fragment', () => {
        writeFile('seeds/trading-terminal/angular.PORTING.md');
        expect(rewrite('[notes](../angular.PORTING.md#grid)', ['trading-terminal/angular.PORTING.md'])).toBe(
            '[notes](../angular.PORTING.md#grid)'
        );
        expect(rewrite('[src](./src/)', ['trading-terminal/angular/src/main.ts'])).toBe('[src](./src/)');
    });

    it('carries the fragment over to the rewritten link', () => {
        expect(rewrite('[source](../../../src/demos/trading-terminal#top)')).toBe(`[source](${TREE}/src/demos/trading-terminal#top)`);
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
        expect(read('README.md')).toContain('| Trading Terminal | Angular | [`trading-terminal/angular`](./trading-terminal/angular) |');
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
