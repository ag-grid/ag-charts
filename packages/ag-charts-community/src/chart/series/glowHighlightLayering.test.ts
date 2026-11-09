import { afterEach, describe, expect, it } from 'vitest';

import { Rect, Transformable } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { getLegendItemNodes, getSeriesAt, getSeriesNodeData } from '../test/seriesAccessors';
import { shapesOf } from '../test/shadowFixtures';
import {
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    compareImageSnapshot,
    createChart,
    deproxy,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

/** The shape of alan's plunk: several grouped bar series, each with a `glow`, and a glow for each highlight state. */
const DATA = [
    { quarter: 'Q1', mac: 3, ipad: 5, iphone: 4 },
    { quarter: 'Q2', mac: 6, ipad: 4, iphone: 7 },
    { quarter: 'Q3', mac: 5, ipad: 8, iphone: 6 },
];

const HIGHLIGHT_GLOWS = {
    highlightedSeries: { glow: { enabled: true, fill: '#f5a623', fillOpacity: 0.7, blur: 12, spread: 14 } },
    highlightedItem: { glow: { enabled: true, fill: '#d0021b', fillOpacity: 0.9, blur: 6, spread: 4 } },
    // Opaque, so that a glow drawn beneath a neighbouring series is hidden by it and not seen through it.
    unhighlightedSeries: { opacity: 1, fillOpacity: 1 },
    unhighlightedItem: { glow: { enabled: true, fill: '#7ed321', fillOpacity: 0.6, blur: 12, spread: 14 } },
};

const SERIES_GLOW = { enabled: true, fill: '#4a90e2', fillOpacity: 0.3, blur: 4, spread: 3 };

const options = (): AgChartOptions => ({
    data: DATA,
    animation: { enabled: false },
    legend: { position: 'bottom' },
    ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    series: ['mac', 'ipad', 'iphone'].map((yKey) => ({
        type: 'bar',
        xKey: 'quarter',
        yKey,
        glow: SERIES_GLOW,
        highlight: HIGHLIGHT_GLOWS,
    })),
});

describe('highlight glow above the other series', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
    });

    const create = async () => {
        chart = deproxy(await createChart(options()));
        await waitForChartStability(chart);
    };

    const hoverItem = async (seriesIndex: number, datumIndex: number) => {
        const datum = getSeriesNodeData<HighlightNodeDatum>(chart, seriesIndex)[datumIndex];
        chart.ctx.highlightManager.updateHighlight(chart.id, datum);
        await waitForChartStability(chart);
    };

    const hoverLegendItem = async (seriesIndex: number) => {
        const { x, y } = Transformable.toCanvas(getLegendItemNodes(chart)[seriesIndex]).computeCenter();
        await hoverAction(x, y)(chart);
        await waitForChartStability(chart);
    };

    const inGroupGlows = (seriesIndex: number) =>
        shapesOf(getSeriesAt(chart, seriesIndex).contentGroup, Rect).map((rect) => rect.fillGlow?.inGroup === true);

    // The middle series, so that a series on each side is drawn over and under its glow.
    const HOVERED = 1;

    describe.each([
        { name: 'series-level hover', hover: () => hoverLegendItem(HOVERED) },
        { name: 'item hover', hover: () => hoverItem(HOVERED, 1) },
    ])('$name', ({ name, hover }) => {
        it(`draws the highlighted series' glow over its neighbours (${name})`, async () => {
            await create();
            await hover();

            await compareImageSnapshot(chart, ctx);
        });
    });

    it('casts the glow of the highlighted series in its own group, and the others in the root', async () => {
        await create();
        expect(inGroupGlows(HOVERED)).toEqual([false, false, false]);

        await hoverLegendItem(HOVERED);

        expect(inGroupGlows(HOVERED)).toEqual([true, true, true]);
        expect(inGroupGlows(0)).toEqual([false, false, false]);
        expect(inGroupGlows(2)).toEqual([false, false, false]);
    });

    it('casts the glow of the other items of the hovered series in its group, and not the hovered item in place', async () => {
        await create();
        await hoverItem(HOVERED, 1);

        const rects = shapesOf(getSeriesAt(chart, HOVERED).contentGroup, Rect);
        expect(rects.map((rect) => rect.fillGlow?.inGroup === true)).toEqual([true, false, true]);
        expect(rects[1].fillGlow).toBeUndefined();
        expect(inGroupGlows(0)).toEqual([false, false, false]);
    });
});
