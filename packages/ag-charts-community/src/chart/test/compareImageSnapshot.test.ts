import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    type SceneGeometrySample,
    compareImageSnapshot,
    extractImageData,
    prepareTestOptions,
    sceneSampleToJSON,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './utils';

describe('sceneSampleToJSON', () => {
    it('rounds values to 3dp, maps non-finite to null, and preserves traversal order', () => {
        const sample: SceneGeometrySample = new Map<string, Record<string, number>>([
            ['series[0]', { x: 1.23456, y: -2.0004, opacity: 1 }],
            ['axis[bottom]', { width: Number.NaN, height: Number.POSITIVE_INFINITY, scale: 0.0005 }],
        ]);

        const json = sceneSampleToJSON(sample);

        expect(json).toEqual({
            'series[0]': { x: 1.235, y: -2, opacity: 1 },
            'axis[bottom]': { width: null, height: null, scale: 0.001 },
        });
        // Key order must mirror the sample's insertion order so repeated captures diff cleanly.
        expect(Object.keys(json)).toEqual(['series[0]', 'axis[bottom]']);
    });
});

describe('compareImageSnapshot scene capture', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance<AgChartOptions> | undefined;
    const tempRoots: string[] = [];
    const originalMode = process.env.AG_SCENE_SNAPSHOTS;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        for (const root of tempRoots.splice(0)) {
            rmSync(root, { recursive: true, force: true });
        }
        if (originalMode === undefined) {
            delete process.env.AG_SCENE_SNAPSHOTS;
        } else {
            process.env.AG_SCENE_SNAPSHOTS = originalMode;
        }
    });

    // A throwaway `__image_snapshots__` dir whose sibling `__scene_snapshots__` receives the JSON,
    // so the test never reads or writes committed baselines.
    function makeSnapshotDirs() {
        const root = mkdtempSync(path.join(tmpdir(), 'ag-scene-'));
        tempRoots.push(root);
        const imageDir = path.join(root, '__image_snapshots__');
        mkdirSync(imageDir);
        return { imageDir, sceneDir: path.join(root, '__scene_snapshots__') };
    }

    async function renderBarChart(data: Array<{ c: string; v: number }>) {
        const options: AgChartOptions = prepareTestOptions({
            data,
            series: [{ type: 'bar', xKey: 'c', yKey: 'v' }],
        });
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
    }

    // Persist the currently-rendered canvas as the baseline PNG so the comparison matches in any
    // snapshot-update mode (including CI's write-nothing 'none'), keeping the test self-contained.
    function seedBaseline(imageDir: string, identifier: string) {
        writeFileSync(path.join(imageDir, `${identifier}.png`), extractImageData(ctx));
    }

    function sceneJsonFiles(sceneDir: string): string[] {
        return existsSync(sceneDir) ? readdirSync(sceneDir).filter((f) => f.endsWith('.json')) : [];
    }

    it('captures a scene JSON paired 1:1 with the PNG identifier in `all` mode', async () => {
        const { imageDir, sceneDir } = makeSnapshotDirs();
        const identifier = 'basic-bar';
        await renderBarChart([
            { c: 'A', v: 1 },
            { c: 'B', v: 2 },
            { c: 'C', v: 3 },
        ]);
        seedBaseline(imageDir, identifier);
        process.env.AG_SCENE_SNAPSHOTS = 'all';

        await compareImageSnapshot(chart!, ctx, {
            ...IMAGE_SNAPSHOT_DEFAULTS,
            customSnapshotsDir: imageDir,
            customSnapshotIdentifier: identifier,
        });

        // The JSON filename must equal the PNG identifier jest-image-snapshot resolved and matched.
        expect(existsSync(path.join(sceneDir, `${identifier}.json`))).toBe(true);
        expect(existsSync(path.join(imageDir, `${identifier}.png`))).toBe(true);
        const captured = JSON.parse(readFileSync(path.join(sceneDir, `${identifier}.json`), 'utf-8'));
        expect(Object.keys(captured).some((key) => key.startsWith('series[0]'))).toBe(true);
    });

    it('honours a function customSnapshotIdentifier for the JSON filename', async () => {
        const { imageDir, sceneDir } = makeSnapshotDirs();
        const identifier = 'fn-identified-bar';
        await renderBarChart([
            { c: 'A', v: 2 },
            { c: 'B', v: 1 },
        ]);
        seedBaseline(imageDir, identifier);
        process.env.AG_SCENE_SNAPSHOTS = 'all';

        await compareImageSnapshot(chart!, ctx, {
            ...IMAGE_SNAPSHOT_DEFAULTS,
            customSnapshotsDir: imageDir,
            customSnapshotIdentifier: () => identifier,
        });

        expect(sceneJsonFiles(sceneDir)).toEqual([`${identifier}.json`]);
    });

    it('writes no scene JSON when AG_SCENE_SNAPSHOTS=off', async () => {
        const { imageDir, sceneDir } = makeSnapshotDirs();
        const identifier = 'off-mode-bar';
        await renderBarChart([
            { c: 'A', v: 3 },
            { c: 'B', v: 1 },
        ]);
        seedBaseline(imageDir, identifier);
        process.env.AG_SCENE_SNAPSHOTS = 'off';

        await compareImageSnapshot(chart!, ctx, {
            ...IMAGE_SNAPSHOT_DEFAULTS,
            customSnapshotsDir: imageDir,
            customSnapshotIdentifier: identifier,
        });

        expect(sceneJsonFiles(sceneDir)).toEqual([]);
    });

    it('writes no scene JSON in `diff` mode when the image matches', async () => {
        const { imageDir, sceneDir } = makeSnapshotDirs();
        const identifier = 'diff-match-bar';
        await renderBarChart([
            { c: 'A', v: 1 },
            { c: 'B', v: 4 },
        ]);
        seedBaseline(imageDir, identifier);
        process.env.AG_SCENE_SNAPSHOTS = 'diff';

        await compareImageSnapshot(chart!, ctx, {
            ...IMAGE_SNAPSHOT_DEFAULTS,
            customSnapshotsDir: imageDir,
            customSnapshotIdentifier: identifier,
        });

        expect(sceneJsonFiles(sceneDir)).toEqual([]);
    });

    it('captures a scene JSON in `diff` mode when the comparison is not a clean match', async () => {
        const { imageDir, sceneDir } = makeSnapshotDirs();
        const identifier = 'diff-capture-bar';
        await renderBarChart([
            { c: 'A', v: 1 },
            { c: 'B', v: 2 },
            { c: 'C', v: 3 },
        ]);

        // Deliberately do NOT seed a baseline, so the comparison "differs" regardless of snapshot
        // policy — a freshly-written baseline locally, a failed match under CI's write-nothing mode.
        // Either way diff-mode capture must fire; the comparison's own pass/fail is mode-dependent and
        // not this test's subject, so its outcome is intentionally ignored.
        process.env.AG_SCENE_SNAPSHOTS = 'diff';
        await compareImageSnapshot(chart!, ctx, {
            ...IMAGE_SNAPSHOT_DEFAULTS,
            customSnapshotsDir: imageDir,
            customSnapshotIdentifier: identifier,
        }).catch(() => undefined);

        expect(existsSync(path.join(sceneDir, `${identifier}.json`))).toBe(true);
    });
});
