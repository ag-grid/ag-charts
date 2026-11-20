import { afterEach, describe, expect, it, vi } from 'vitest';

import { Shape } from 'ag-charts-core';

import { RENDER_OPTIONS, canvasImage, hoverDatum } from '../test/glowRender';
import { useGlowCharts } from '../test/glowRenderSuite';
import { createChart } from '../test/utils';

// A shadow mask is cleared and blurred over the extent of its casters, where it was the layer. A caster that can't be bounded
// fails open to the whole mask, so a chart rendered that way is the reference: not one byte of the canvas may differ from it.
describe('a shadow mask bounded to its casters, through a series', () => {
    const charts = useGlowCharts(createChart);

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const SHADOW = { enabled: true, fill: '#112233', fillOpacity: 0.8, xOffset: 6, yOffset: 4, blur: 8 };
    const SPREAD_SHADOW = { ...SHADOW, spread: 3 };

    const POINTS = Array.from({ length: 24 }, (_, i) => ({
        x: (i % 6) + 1,
        y: Math.floor(i / 6) * 2 + 1 + (i % 3) * 0.5,
        a: 3 + ((i * 5) % 7),
    }));
    const AREA_DATA = [
        { x: 1, y: 3 },
        { x: 2, y: 7 },
        { x: 3, y: 4 },
        { x: 4, y: 9 },
        { x: 5, y: 6 },
        { x: 6, y: 8 },
    ];
    // The series does not start at the top left of the layer.
    const OFFSET_AXES = {
        axes: { x: { type: 'number', min: 0, max: 7 }, y: { type: 'number', min: 0, max: 12 } },
    };
    const HIGHLIGHT_ITEM_SHADOW = { enabled: true, fill: '#aa0000', xOffset: 5, yOffset: 5, blur: 6, spread: 2 };

    interface Case {
        name: string;
        series: Record<string, unknown>;
        data: object[];
        options?: object;
        hover?: number;
        /**
         * Whether the series' casters can be bounded. A marker's can't be measured at the cast, so a marker series is cast with
         * the whole mask, and the case shows that the render of one is the same whichever way a caster is measured.
         */
        bounded: boolean;
    }

    const CASES: Case[] = [
        {
            name: 'an area series with segmentation and a shadow',
            series: {
                type: 'area',
                xKey: 'x',
                yKey: 'y',
                shadow: SHADOW,
                segmentation: {
                    key: 'x',
                    segments: [
                        // The shadow is cast by the parts of the area that no segment covers: before x = 2, and from 4 to 5.
                        { start: 2, stop: 4, fill: 'rgba(255, 0, 0, 0.6)', stroke: 'red', strokeWidth: 2 },
                        { start: 5, fill: 'rgba(0, 0, 255, 0.6)', stroke: 'blue', strokeWidth: 3 },
                    ],
                },
            },
            data: AREA_DATA,
            options: OFFSET_AXES,
            bounded: true,
        },
        {
            name: 'an area series with a shadow and a spread',
            series: { type: 'area', xKey: 'x', yKey: 'y', shadow: SPREAD_SHADOW },
            data: AREA_DATA,
            options: OFFSET_AXES,
            bounded: true,
        },
        {
            name: 'a scatter series of more than 16 markers with a shadow',
            series: { type: 'scatter', xKey: 'x', yKey: 'y', shape: 'diamond', size: 18, shadow: SHADOW },
            data: POINTS,
            options: OFFSET_AXES,
            bounded: false,
        },
        {
            name: 'a scatter series of markers with a shadow and a spread',
            series: { type: 'scatter', xKey: 'x', yKey: 'y', shape: 'circle', size: 18, shadow: SPREAD_SHADOW },
            data: POINTS,
            options: OFFSET_AXES,
            bounded: false,
        },
        {
            name: 'the hovered marker of a scatter series',
            series: {
                type: 'scatter',
                xKey: 'x',
                yKey: 'y',
                shape: 'circle',
                size: 18,
                highlight: { highlightedItem: { shadow: HIGHLIGHT_ITEM_SHADOW } },
            },
            data: POINTS,
            options: OFFSET_AXES,
            hover: 7,
            bounded: false,
        },
        {
            name: 'the hovered bar of a bar series',
            series: {
                type: 'bar',
                xKey: 'x',
                yKey: 'a',
                highlight: { highlightedItem: { shadow: HIGHLIGHT_ITEM_SHADOW } },
            },
            data: POINTS.slice(0, 6).map((p, i) => ({ ...p, x: `c${i}` })),
            options: { axes: { y: { type: 'number', min: 0, max: 12 } } },
            hover: 2,
            bounded: true,
        },
    ];

    const render = async (testCase: Case, bounded: boolean, series = testCase.series) => {
        const measure = vi.spyOn(Shape.prototype, 'getShadowSilhouetteBounds');
        if (!bounded) measure.mockReturnValue(false);
        await charts.create([series], testCase.data, { ...RENDER_OPTIONS, ...testCase.options });
        if (testCase.hover !== undefined) await hoverDatum(charts.chart(), 0, testCase.hover);
        const { data } = canvasImage(charts.chart());
        const measured = measure.mock.results.filter(({ value }) => value === true).length;
        measure.mockRestore();
        return { data, measured };
    };

    const bytesDiffering = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
        expect(a.length).toBe(b.length);
        let count = 0;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) count++;
        return count;
    };

    it.each(CASES)('should draw the pixels that the whole mask draws for $name', async (testCase) => {
        const full = await render(testCase, false);
        const bounded = await render(testCase, true);

        // The whole mask is the reference only if nothing was bounded there, and the bounded render did measure its casters.
        expect(full.measured).toBe(0);
        if (testCase.bounded) expect(bounded.measured).toBeGreaterThan(0);
        // And a shadow is on the canvas, rather than the two being equally bare.
        const { shadow: _shadow, highlight: _highlight, ...series } = testCase.series;
        const bare = await render(testCase, true, series);
        expect(bytesDiffering(bounded.data, bare.data)).toBeGreaterThan(0);

        expect(bytesDiffering(bounded.data, full.data)).toBe(0);
    });
});
