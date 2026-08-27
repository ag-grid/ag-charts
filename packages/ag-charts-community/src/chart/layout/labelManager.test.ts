import { describe, expect, it } from 'vitest';

import type { LabelObstacle, PlacedLabel, PointLabelDatum } from 'ag-charts-core';

import { BBox } from '../../scene/bbox';
import { LabelManager, type PlacedLabelSource } from './labelManager';

const PADDING = { top: 0, right: 0, bottom: 0, left: 0 };
const SERIES_RECT = new BBox(0, 0, 400, 300);

/** Zero-size point, so the datum contributes a label rect and no marker obstacle. */
function labelAt(x: number, y: number, text: string): PointLabelDatum {
    return {
        point: { x, y, size: 0 },
        label: { text, width: 40, height: 12 },
        anchor: undefined,
        placement: 'top',
        alwaysShow: false,
        collideWith: { label: true },
    };
}

interface Recorder {
    placed: PlacedLabel<unknown>[][];
    /** Reads of the label data, which only a real solve performs. */
    solves: number;
}

/** Mutable mirror of the source contract, so a test can bump a version or stop placing labels. */
type MutableLabelSource = { -readonly [K in keyof PlacedLabelSource]: PlacedLabelSource[K] };

function source(id: string, datums: PointLabelDatum[], obstacles?: LabelObstacle[]) {
    const recorder: Recorder = { placed: [], solves: 0 };
    const instance: MutableLabelSource = {
        id,
        usesPlacedLabels: true,
        nodeDataVersion: 1,
        getLabelData: () => {
            recorder.solves++;
            return datums;
        },
        getLabelObstacles: () => obstacles,
        updatePlacedLabelData: (labels) => recorder.placed.push(labels),
    };
    return { instance, recorder };
}

/** A series is just an unregistered source as far as the manager is concerned. */
const series = source;

function texts(placed: PlacedLabel<unknown>[]) {
    return placed.map((label) => label.text);
}

describe('LabelManager', () => {
    it('places a registered source with no label-placing series present', () => {
        const manager = new LabelManager();
        const crossLines = source('crossLines:x', [labelAt(100, 100, 'A')]);
        manager.registerSource(crossLines.instance);

        manager.updateLabels([], PADDING, SERIES_RECT);

        expect(texts(crossLines.recorder.placed.at(-1) ?? [])).toEqual(['A']);
    });

    it('drops a registered source from the solve once it is unregistered', () => {
        const manager = new LabelManager();
        const crossLines = source('crossLines:x', [labelAt(100, 100, 'crossLine')]);
        const line = series('line', [labelAt(300, 200, 'series')]);
        manager.registerSource(crossLines.instance);
        manager.updateLabels([line.instance], PADDING, SERIES_RECT);

        expect(crossLines.recorder.solves).toBe(1);

        manager.unregisterSource('crossLines:x');
        line.instance.nodeDataVersion = 2;
        manager.updateLabels([line.instance], PADDING, SERIES_RECT);

        expect(crossLines.recorder.solves).toBe(1);
        expect(texts(line.recorder.placed.at(-1) ?? [])).toEqual(['series']);
    });

    it('keeps a replacement registered under an id its predecessor then unregisters', () => {
        const manager = new LabelManager();
        const first = source('crossLines:x', [labelAt(100, 100, 'first')]);
        const second = source('crossLines:x', [labelAt(100, 100, 'second')]);

        // A recreated axis registers its replacement before the old instance is destroyed.
        manager.registerSource(first.instance);
        manager.registerSource(second.instance);
        manager.unregisterSource('crossLines:x', first.instance);

        manager.updateLabels([], PADDING, SERIES_RECT);

        expect(texts(second.recorder.placed.at(-1) ?? [])).toEqual(['second']);
        expect(first.recorder.placed).toEqual([]);
    });

    it('re-solves when a registered source bumps its node-data version', () => {
        const manager = new LabelManager();
        const crossLines = source('crossLines:x', [labelAt(100, 100, 'crossLine')]);
        const line = series('line', [labelAt(300, 200, 'series')]);
        manager.registerSource(crossLines.instance);
        manager.updateLabels([line.instance], PADDING, SERIES_RECT);

        expect(crossLines.recorder.solves).toBe(1);

        // Unchanged inputs must reuse the cached solve rather than re-reading the label data.
        manager.updateLabels([line.instance], PADDING, SERIES_RECT);
        expect(crossLines.recorder.solves).toBe(1);

        crossLines.instance.nodeDataVersion = 2;
        manager.updateLabels([line.instance], PADDING, SERIES_RECT);
        expect(crossLines.recorder.solves).toBe(2);
    });

    it('stops reading a source that no longer places labels', () => {
        const manager = new LabelManager();
        const crossLines = source('crossLines:x', [labelAt(100, 100, 'crossLine')]);
        const line = series('line', [labelAt(300, 200, 'series')]);
        manager.registerSource(crossLines.instance);
        manager.updateLabels([line.instance], PADDING, SERIES_RECT);

        expect(crossLines.recorder.solves).toBe(1);

        crossLines.instance.usesPlacedLabels = false;
        crossLines.instance.nodeDataVersion = 2;
        manager.updateLabels([line.instance], PADDING, SERIES_RECT);

        expect(crossLines.recorder.solves).toBe(1);
        expect(texts(line.recorder.placed.at(-1) ?? [])).toEqual(['series']);
    });

    it('applies a registered source obstacle to series labels', () => {
        const manager = new LabelManager();
        const line = series('line', [labelAt(100, 100, 'series')]);
        manager.updateLabels([line.instance], PADDING, SERIES_RECT);

        // Guards the assertion below: the label must be placeable when nothing blocks it.
        expect(texts(line.recorder.placed.at(-1) ?? [])).toEqual(['series']);

        const blocker = source(
            'axisLabels:x',
            [],
            [{ kind: 'rect', category: 'label', box: { x: 0, y: 0, width: 400, height: 300 } }]
        );
        blocker.instance.usesPlacedLabels = false;
        manager.registerSource(blocker.instance);
        line.instance.nodeDataVersion = 2;
        manager.updateLabels([line.instance], PADDING, SERIES_RECT);

        expect(texts(line.recorder.placed.at(-1) ?? [])).toEqual([]);
    });
});
