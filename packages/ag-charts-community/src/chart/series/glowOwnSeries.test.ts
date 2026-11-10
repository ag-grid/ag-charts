import { afterEach, describe, expect, it } from 'vitest';

import { Sector, Transformable } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { Marker } from '../marker/marker';
import { getSeriesAt, getSeriesNodeData } from '../test/seriesAccessors';
import { shapesOf } from '../test/shadowFixtures';
import {
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    createChart,
    deproxy,
    hoverLegendItem,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import type { DonutSeries } from './polar/donutSeries';

const DATA = Array.from({ length: 30 }, (_, i) => ({ x: `P${i}`, y: 5 }));

const STROKE = [255, 0, 0, 255];
const GREEN = [0, 255, 0, 255];
const GLOW = { enabled: true, fill: '#00ff00', fillOpacity: 1, spread: 14, blur: 0 };

/** A series whose line and area fill are opaque, with a `marker.glow` for its other items when one is hovered. */
const series = (type: 'line' | 'area', glow: object | undefined) => ({
    type,
    xKey: 'x',
    yKey: 'y',
    stroke: '#ff0000',
    strokeWidth: 8,
    ...(type === 'area' ? { fill: '#ff0000', fillOpacity: 1 } : undefined),
    marker: { enabled: true, size: 16 },
    highlight: { unhighlightedItem: { opacity: 1, strokeOpacity: 1, glow } },
});

describe('a highlight glow of the markers of a series', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
    });

    /** The pixels between two markers that are not hovered, on the line and in the area fill beneath it. */
    const hover = async (type: 'line' | 'area', glow: object | undefined) => {
        chart = deproxy(
            await createChart({
                data: DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
                series: [series(type, glow)],
            } as AgChartOptions)
        );
        await waitForChartStability(chart);
        chart.ctx.highlightManager.updateHighlight(chart.id, getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
        await waitForChartStability(chart);

        const [a, b] = shapesOf(getSeriesAt(chart).contentGroup, Marker).slice(14, 16);
        const from = Transformable.toCanvas(a).computeCenter();
        const to = Transformable.toCanvas(b).computeCenter();
        const x = Math.round((from.x + to.x) / 2);
        const pixelAt = (px: number, py: number) => [
            ...chart.ctx.scene.canvas.context.getImageData(px, Math.round(py), 1, 1).data,
        ];
        return { line: pixelAt(x, from.y), fill: pixelAt(x, from.y + 14), beside: pixelAt(x, from.y - 14) };
    };

    // A marker with a shadow is a caster of the root, and its glow must still reach the group that casts it.
    it.each(['overlay', 'cutout'] as const)(
        'casts the glow of a marker that also casts a shadow (%s)',
        async (mode) => {
            chart = deproxy(
                await createChart({
                    data: DATA,
                    animation: { enabled: false },
                    legend: { enabled: true, position: 'bottom' },
                    ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
                    highlight: { ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP.highlight, drawingMode: mode },
                    series: [
                        {
                            ...series('line', undefined),
                            marker: {
                                enabled: true,
                                size: 16,
                                shadow: { enabled: true, xOffset: 2, yOffset: 2, blur: 2 },
                            },
                            highlight: { highlightedSeries: { glow: GLOW } },
                        },
                    ],
                } as AgChartOptions)
            );
            await waitForChartStability(chart);
            await hoverLegendItem(chart, 0);
            await waitForChartStability(chart);

            const { width, height } = chart.ctx.scene.canvas;
            const { data } = chart.ctx.scene.canvas.context.getImageData(0, 0, width, height);
            let glowPixels = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] === 0 && data[i + 1] === 255 && data[i + 2] === 0 && data[i + 3] === 255) glowPixels++;
            }
            expect(glowPixels).toBeGreaterThan(0);
        }
    );

    it.each(['line', 'area'] as const)('does not cover the line or the fill of its own series (%s)', async (type) => {
        const without = await hover(type, undefined);
        chart.destroy();
        const withGlow = await hover(type, GLOW);

        // The glow reaches this far, past the line, where nothing else of the series is drawn.
        expect(withGlow.beside).toEqual([0, 255, 0, 255]);
        expect(withGlow.line).toEqual(STROKE);
        expect(withGlow.line).toEqual(without.line);
        if (type === 'area') expect(withGlow.fill).toEqual(STROKE);
    });
});

describe('a highlight glow of the sectors of a donut', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
    });

    /**
     * The pixel a little inside the inner edge of the ring, where the glow of its sectors would reach over the inner circle,
     * and the pixel a little outside the ring at the middle of a sector that is not hovered, where the glow shows.
     */
    const hoverRing = async (glow: object | undefined) => {
        chart = deproxy(
            await createChart({
                data: [
                    { asset: 'Stocks', amount: 30 },
                    { asset: 'Bonds', amount: 25 },
                    { asset: 'Cash', amount: 20 },
                ],
                animation: { enabled: false },
                legend: { enabled: true, position: 'bottom' },
                ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
                series: [
                    {
                        type: 'donut',
                        angleKey: 'amount',
                        legendItemKey: 'asset',
                        innerRadiusRatio: 0.6,
                        innerCircle: { fill: '#ff0000', fillOpacity: 1 },
                        highlight: { unhighlightedItem: { opacity: 1, glow } },
                    },
                ],
            } as AgChartOptions)
        );
        await waitForChartStability(chart);
        await hoverLegendItem(chart, 0);
        await waitForChartStability(chart);

        const donut = getSeriesAt(chart) as DonutSeries;
        const centre = Transformable.toCanvas(donut.innerCircleSelection.nodes()[0]).computeCenter();
        const { innerRadius } = shapesOf(donut.contentGroup, Sector)[1];
        const { startAngle, endAngle, outerRadius } = shapesOf(donut.contentGroup, Sector)[1];
        const middle = (startAngle + endAngle) / 2;
        const pixelAt = (x: number, y: number) => [
            ...chart.ctx.scene.canvas.context.getImageData(Math.round(x), Math.round(y), 1, 1).data,
        ];
        return {
            inner: pixelAt(centre.x, centre.y - innerRadius + 6),
            outside: pixelAt(
                centre.x + (outerRadius + 6) * Math.cos(middle),
                centre.y + (outerRadius + 6) * Math.sin(middle)
            ),
        };
    };

    it('does not cover the inner circle of its own series, and shows beside the ring', async () => {
        const without = await hoverRing(undefined);
        chart.destroy();
        const withGlow = await hoverRing(GLOW);

        expect(without.inner).toEqual(STROKE);
        expect(withGlow.inner).toEqual(without.inner);
        expect(without.outside).not.toEqual(GREEN);
        expect(withGlow.outside).toEqual(GREEN);
    });
});
