import { afterEach, describe, it } from 'vitest';

import { Transformable } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { Chart } from '../chart';
import { Marker } from '../marker/marker';
import { HARD_GLOW } from '../test/glowRender';
import { getSeriesAt } from '../test/seriesAccessors';
import {
    compareImageSnapshot,
    createChart,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

// A glow of spread 8 with a gap of 3, which leaves a hole round the item that is easy to see in a small crop.
const GAP_GLOW = { ...HARD_GLOW, fill: '#d0021b', spread: 8, gap: 3 };

const CENTRED = {
    x: { type: 'number', min: 0, max: 4, gridLine: { enabled: false } },
    y: { type: 'number', min: 0, max: 8, gridLine: { enabled: false } },
};

/** A crop of this much round the centre of the item, which is small enough to read the hole round a spike. */
const CROP_RADIUS = 60;

describe('glow gap snapshots', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: Chart | undefined;
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async (options: object) => {
        chart = deproxy(
            await createChart({
                animation: { enabled: false },
                legend: { enabled: false },
                ...options,
            } as AgChartOptions)
        );
        await waitForChartStability(chart);
        return chart;
    };

    const snapshotAround = (x: number, y: number) =>
        compareImageSnapshot(chart!, {
            ...ctx,
            bbox: {
                x: Math.round(x - CROP_RADIUS),
                y: Math.round(y - CROP_RADIUS),
                width: 2 * CROP_RADIUS,
                height: 2 * CROP_RADIUS,
            },
        });

    describe('a star marker, whose points the glow gap follows', () => {
        // A stroke of 6 has mitred spikes that the hole follows, with the ring unbroken over each point.
        it.each([
            ['a stroke of 6', { stroke: '#0000ff', strokeWidth: 6, strokeOpacity: 1 }],
            ['no stroke', { strokeWidth: 0 }],
        ])('renders the glow gap of a star with %s', async (_name, stroke) => {
            await create({
                data: [{ x: 2, y: 4 }],
                axes: CENTRED,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shape: 'star',
                        size: 60,
                        fill: '#0000ff',
                        fillOpacity: 1,
                        glow: GAP_GLOW,
                        ...stroke,
                    },
                ],
            });
            const { x, y, width } = Transformable.toCanvas(
                getSeriesAt(chart!).contentGroup.children().next().value as Marker
            );
            await snapshotAround(x + width / 2, y + width / 2);
        });
    });

    describe('a thin donut sector, whose stroke has an unbounded mitre limit', () => {
        // Sharper than 11.5 degrees, a mitre of 10 bevels the point, so the cut ends at the spike the stroke paints; at 26 degrees it does not.
        it.each([
            ['9 degrees', 39],
            ['26 degrees', 13],
        ])('renders the glow gap round the point of a sector of %s with a stroke', async (_angle, rest) => {
            await create({
                data: [
                    { category: 'A', value: 1 },
                    { category: 'B', value: rest },
                ],
                padding: { top: 60, left: 60, right: 60, bottom: 60 },
                series: [
                    {
                        type: 'donut',
                        angleKey: 'value',
                        fills: ['#0000ff'],
                        strokes: ['#0000ff'],
                        strokeWidth: 4,
                        innerRadiusRatio: 0,
                        // The rest of the pie is not drawn, so that nothing covers the glow of the thin sector.
                        itemStyler: ({ datum }: { datum: { category: string } }) =>
                            datum.category === 'A' ? { glow: GAP_GLOW } : { fillOpacity: 0, strokeOpacity: 0 },
                    },
                ],
            });
            const { width, height } = chart!.ctx.scene.canvas;
            await snapshotAround(width / 2, height / 2);
        });
    });
});
