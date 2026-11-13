import { afterEach, describe, expect, it } from 'vitest';

import { Rect } from 'ag-charts-core';
import type { AgCartesianSeriesOptions, AgChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { getSeriesAt, getSeriesNodeData } from '../test/seriesAccessors';
import { shapesOf } from '../test/shadowFixtures';
import {
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    compareImageSnapshot,
    createChart,
    deproxy,
    hoverLegendItem,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

/** Several grouped bar series, each with a `glow`, and a glow for each highlight state. */
const DATA = [
    { quarter: 'Q1', mac: 3, ipad: 5, iphone: 4 },
    { quarter: 'Q2', mac: 6, ipad: 4, iphone: 7 },
    { quarter: 'Q3', mac: 5, ipad: 8, iphone: 6 },
];

/** The glows of the chart, each of which is cut a `gap` clear of its item, if one is given. */
const withGap = <T extends object>(glow: T, gap: number | undefined) => (gap == null ? glow : { ...glow, gap });

const highlightGlows = (gap?: number) => ({
    highlightedSeries: {
        glow: withGap({ enabled: true, fill: '#f5a623', fillOpacity: 0.7, blur: 12, spread: 14 }, gap),
    },
    highlightedItem: { glow: withGap({ enabled: true, fill: '#d0021b', fillOpacity: 0.9, blur: 6, spread: 4 }, gap) },
    // Opaque, so that a glow drawn beneath a neighbouring series is hidden by it and not seen through it.
    unhighlightedSeries: { opacity: 1, fillOpacity: 1 },
    unhighlightedItem: {
        glow: withGap({ enabled: true, fill: '#7ed321', fillOpacity: 0.6, blur: 12, spread: 14 }, gap),
    },
});

const barSeriesGlow = (gap?: number) =>
    withGap({ enabled: true, fill: '#4a90e2', fillOpacity: 0.3, blur: 4, spread: 3 }, gap);

type ItemStyler = (params: unknown) => object;

const options = (gap?: number, itemStyler?: ItemStyler): AgChartOptions => ({
    data: DATA,
    animation: { enabled: false },
    legend: { position: 'bottom' },
    ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    series: ['mac', 'ipad', 'iphone'].map((yKey) => ({
        type: 'bar',
        xKey: 'quarter',
        yKey,
        glow: barSeriesGlow(gap),
        highlight: highlightGlows(gap),
        itemStyler,
    })) as AgCartesianSeriesOptions[],
});

describe('highlight glow above the other series', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
    });

    const create = async (gap?: number, itemStyler?: ItemStyler) => {
        chart = deproxy(await createChart(options(gap, itemStyler)));
        await waitForChartStability(chart);
    };

    const hoverItem = async (seriesIndex: number, datumIndex: number) => {
        const datum = getSeriesNodeData<HighlightNodeDatum>(chart, seriesIndex)[datumIndex];
        chart.ctx.highlightManager.updateHighlight(chart.id, datum);
        await waitForChartStability(chart);
    };

    const hoverSeries = async (seriesIndex: number) => {
        await hoverLegendItem(chart, seriesIndex);
        await waitForChartStability(chart);
    };

    // Whether each rect of a series casts a glow, which a hovered item does not in place.
    const castsGlow = (seriesIndex: number) =>
        shapesOf(getSeriesAt(chart, seriesIndex).contentGroup, Rect).map((rect) => rect.fillGlow?.enabled === true);

    // The gap of the glow that each rect of the hovered series casts.
    const glowGaps = () =>
        shapesOf(getSeriesAt(chart, HOVERED).contentGroup, Rect)
            .filter((rect) => rect.fillGlow?.enabled === true)
            .map((rect) => rect.fillGlow?.gap);

    // The middle series, so that a series on each side is drawn over and under its glow.
    const HOVERED = 1;

    // A gap is cut out of every glow of the hovered series, which is cast in the overlay, over its neighbours.
    const GAPS: [string, number | undefined][] = [
        ['', undefined],
        [', glow gap 0', 0],
        [', glow gap 6', 6],
    ];

    describe.each([
        { name: 'series-level hover', hover: () => hoverSeries(HOVERED), glowing: 3 },
        { name: 'item hover', hover: () => hoverItem(HOVERED, 1), glowing: 2 },
    ])('$name', ({ name, hover, glowing }) => {
        it.each(GAPS)(`draws the highlighted series' glow over its neighbours (${name}%s)`, async (_suffix, gap) => {
            await create(gap);
            await hover();

            expect(glowGaps()).toEqual(Array(glowing).fill(gap));
            await compareImageSnapshot(chart, ctx);
        });
    });

    it('casts the glow of every item of the hovered series, and the other series cast theirs', async () => {
        await create();
        expect(castsGlow(HOVERED)).toEqual([true, true, true]);

        await hoverSeries(HOVERED);

        expect(castsGlow(HOVERED)).toEqual([true, true, true]);
        expect(castsGlow(0)).toEqual([true, true, true]);
        expect(castsGlow(2)).toEqual([true, true, true]);
    });

    it('casts the glow of the other items of the hovered series, and not the hovered item in place', async () => {
        await create();
        await hoverItem(HOVERED, 1);

        expect(castsGlow(HOVERED)).toEqual([true, false, true]);
        expect(castsGlow(0)).toEqual([true, true, true]);
    });

    // An item styler that returns a `glow` merges it over the cascade, which keeps the glow of the cascade's state.
    describe.each([
        { name: 'series-level hover', hover: () => hoverSeries(HOVERED), expected: [true, true, true] },
        { name: 'item hover', hover: () => hoverItem(HOVERED, 1), expected: [true, false, true] },
    ])('with an itemStyler that returns a glow, $name', ({ hover, expected }) => {
        it.each([
            ['an empty glow', () => ({ glow: {} })],
            ['a glow with fields', () => ({ glow: { fill: '#ff00ff', blur: 9 } })],
        ])('casts the highlighted series glow (%s)', async (_name, itemStyler) => {
            await create(undefined, itemStyler);
            await hover();

            expect(castsGlow(HOVERED)).toEqual(expected);
            expect(castsGlow(0)).toEqual([true, true, true]);
            expect(castsGlow(2)).toEqual([true, true, true]);
        });
    });
});
