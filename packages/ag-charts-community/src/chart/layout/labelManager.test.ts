import { vi } from 'vitest';

import type { LabelObstacle, PlacedLabel, PointLabelDatum } from 'ag-charts-core';

import { BBox } from '../../scene/bbox';
import type { ISeries, ISeriesProperties, SeriesNodeDatum } from '../series/seriesTypes';
import { LabelManager } from './labelManager';

type AnySeries = ISeries<SeriesNodeDatum, ISeriesProperties, unknown>;

const NO_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };
const RECT = new BBox(0, 0, 200, 200);

function labelDatum(x: number, y: number, text: string, overrides?: Partial<PointLabelDatum>): PointLabelDatum {
    return {
        point: { x, y, size: 0 },
        label: { text, width: 40, height: 10 },
        anchor: undefined,
        placement: undefined,
        placements: ['top'],
        alwaysShow: false,
        ...overrides,
    };
}

interface FakeSeriesOptions {
    id: string;
    datums?: PointLabelDatum[];
    obstacles?: LabelObstacle[];
    usesPlacedLabels?: boolean;
}

function fakeSeries({ id, datums = [], obstacles, usesPlacedLabels = true }: FakeSeriesOptions) {
    const series = {
        id,
        nodeDataVersion: 1,
        usesPlacedLabels,
        getLabelData: vi.fn((): PointLabelDatum[] => datums),
        getLabelObstacles: vi.fn((): LabelObstacle[] | undefined => obstacles),
        updatePlacedLabelData: vi.fn((_labels: PlacedLabel[]) => {}),
    };
    return series as typeof series & AnySeries;
}

function placedTexts(series: ReturnType<typeof fakeSeries>, call = -1): string[] {
    const { calls } = series.updatePlacedLabelData.mock;
    const labels = calls.at(call)?.[0] ?? [];
    return labels.map((label) => label.text as string);
}

describe('LabelManager', () => {
    describe('placement caching', () => {
        it('reuses the cached solve while the placement inputs are unchanged', () => {
            const manager = new LabelManager();
            const series = fakeSeries({ id: 'a', datums: [labelDatum(50, 50, 'one')] });

            manager.updateLabels([series], NO_PADDING, RECT);
            manager.updateLabels([series], NO_PADDING, RECT);

            // The solve runs once, but is re-applied on both updates: SERIES_UPDATE also fires on
            // hover, where the labels still have to be rebuilt to pick up highlight styling.
            expect(series.getLabelData).toHaveBeenCalledTimes(1);
            expect(series.updatePlacedLabelData).toHaveBeenCalledTimes(2);
            expect(placedTexts(series)).toEqual(['one']);
        });

        it('re-solves when a series bumps its node-data version', () => {
            const manager = new LabelManager();
            const series = fakeSeries({ id: 'a', datums: [labelDatum(50, 50, 'one')] });

            manager.updateLabels([series], NO_PADDING, RECT);
            series.nodeDataVersion += 1;
            manager.updateLabels([series], NO_PADDING, RECT);

            expect(series.getLabelData).toHaveBeenCalledTimes(2);
        });

        it('re-solves when the layout bounds change', () => {
            const manager = new LabelManager();
            const series = fakeSeries({ id: 'a', datums: [labelDatum(50, 50, 'one')] });

            manager.updateLabels([series], NO_PADDING, RECT);
            manager.updateLabels([series], NO_PADDING, new BBox(0, 0, 300, 200));

            expect(series.getLabelData).toHaveBeenCalledTimes(2);
        });

        it('re-solves when the chart padding changes the bounds', () => {
            const manager = new LabelManager();
            const series = fakeSeries({ id: 'a', datums: [labelDatum(50, 50, 'one')] });

            manager.updateLabels([series], NO_PADDING, RECT);
            manager.updateLabels([series], { ...NO_PADDING, left: 10 }, RECT);

            expect(series.getLabelData).toHaveBeenCalledTimes(2);
        });

        it('re-solves when the set of visible series changes', () => {
            const manager = new LabelManager();
            const first = fakeSeries({ id: 'a', datums: [labelDatum(50, 50, 'one')] });
            const second = fakeSeries({ id: 'b', datums: [labelDatum(150, 50, 'two')] });

            manager.updateLabels([first], NO_PADDING, RECT);
            manager.updateLabels([first, second], NO_PADDING, RECT);

            expect(first.getLabelData).toHaveBeenCalledTimes(2);
            expect(second.getLabelData).toHaveBeenCalledTimes(1);
        });
    });

    describe('no placed-label series', () => {
        it('places nothing and clears the cached solve', () => {
            const manager = new LabelManager();
            const series = fakeSeries({ id: 'a', datums: [labelDatum(50, 50, 'one')] });
            const plain = fakeSeries({ id: 'b', usesPlacedLabels: false });

            manager.updateLabels([series], NO_PADDING, RECT);
            manager.updateLabels([plain], NO_PADDING, RECT);
            expect(plain.getLabelData).not.toHaveBeenCalled();
            expect(plain.updatePlacedLabelData).not.toHaveBeenCalled();

            // The cache was cleared, so the identical inputs of the first update re-solve rather
            // than replaying a solve taken while a different series set was visible.
            manager.updateLabels([series], NO_PADDING, RECT);
            expect(series.getLabelData).toHaveBeenCalledTimes(2);
        });
    });

    describe('label data carry-forward', () => {
        it('keeps the previous label data for a series that reports non-point data', () => {
            const manager = new LabelManager();
            const series = fakeSeries({ id: 'a', datums: [labelDatum(50, 50, 'one')] });

            manager.updateLabels([series], NO_PADDING, RECT);
            expect(placedTexts(series)).toEqual(['one']);

            // Bar-family series report baked label data between placement passes; the manager has to
            // carry the last point-label solve forward rather than drop the series' labels.
            series.getLabelData.mockReturnValue([{ notALabelDatum: true }] as unknown as PointLabelDatum[]);
            series.nodeDataVersion += 1;
            manager.updateLabels([series], NO_PADDING, RECT);

            expect(placedTexts(series)).toEqual(['one']);
        });

        it('places nothing for a series that has never reported point data', () => {
            const manager = new LabelManager();
            const series = fakeSeries({ id: 'a' });
            series.getLabelData.mockReturnValue([{ notALabelDatum: true }] as unknown as PointLabelDatum[]);

            manager.updateLabels([series], NO_PADDING, RECT);

            expect(placedTexts(series)).toEqual([]);
        });
    });

    describe('obstacles', () => {
        it('gathers obstacles from every visible series, including those placing no labels', () => {
            const manager = new LabelManager();
            const series = fakeSeries({ id: 'a', datums: [labelDatum(50, 50, 'one')] });
            const blocker = fakeSeries({
                id: 'b',
                usesPlacedLabels: false,
                obstacles: [{ kind: 'rect', category: 'seriesItem', box: new BBox(0, 0, 200, 200) }],
            });

            manager.updateLabels([series, blocker], NO_PADDING, RECT);

            expect(blocker.getLabelObstacles).toHaveBeenCalled();
            // The blanket obstacle leaves the droppable label nowhere to go.
            expect(placedTexts(series)).toEqual([]);
        });
    });

    describe('resolution order', () => {
        it('resolves series in declaration order, and restores it after a hide and show', () => {
            const manager = new LabelManager();
            // Both labels want the same spot; placement is greedy, so the first series declared wins.
            const first = fakeSeries({ id: 'a', datums: [labelDatum(100, 100, 'first')] });
            const second = fakeSeries({ id: 'b', datums: [labelDatum(100, 100, 'second')] });

            manager.updateLabels([first, second], NO_PADDING, RECT);
            expect(placedTexts(first)).toEqual(['first']);
            expect(placedTexts(second)).toEqual([]);

            manager.updateLabels([first], NO_PADDING, RECT);
            manager.updateLabels([first, second], NO_PADDING, RECT);

            expect(placedTexts(first)).toEqual(['first']);
            expect(placedTexts(second)).toEqual([]);
        });

        it('places both series when their labels do not compete', () => {
            const manager = new LabelManager();
            const first = fakeSeries({ id: 'a', datums: [labelDatum(50, 50, 'first')] });
            const second = fakeSeries({ id: 'b', datums: [labelDatum(150, 150, 'second')] });

            manager.updateLabels([first, second], NO_PADDING, RECT);

            expect(placedTexts(first)).toEqual(['first']);
            expect(placedTexts(second)).toEqual(['second']);
        });
    });
});
