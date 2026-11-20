import { afterEach, describe, expect, it, vi } from 'vitest';

import { Shape } from 'ag-charts-core';

import { differingBytes, expectSamePixels } from '../test/expectSamePixels';
import { RENDER_OPTIONS, canvasImage, hoverDatum } from '../test/glowRender';
import { useGlowCharts } from '../test/glowRenderSuite';
import { createChart, deproxy } from '../test/utils';

// A caster that can't be bounded fails open to the whole mask, so a chart rendered that way is the reference: not one byte of
// the canvas may differ from it, and the masks of the bounded render are smaller.
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
        /** Whether a direct cast is bounded. A marker can't be measured at the cast, so it is cast whole, in both renders. */
        bounded: boolean;
        /** Whether a key has more than 16 casters, which is bounded on a kept cast only: a direct cast of it is whole. */
        crowded?: boolean;
    }

    const BAR_DATA = Array.from({ length: 20 }, (_, i) => ({ x: `c${i}`, a: 3 + ((i * 5) % 7) }));

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
        {
            name: 'a bar series of more than 16 bars with a shadow',
            series: { type: 'bar', xKey: 'x', yKey: 'a', shadow: SHADOW },
            data: BAR_DATA,
            options: { axes: { y: { type: 'number', min: 0, max: 12 } } },
            bounded: false,
            crowded: true,
        },
        {
            name: 'a bar series of more than 16 bars with a shadow and a spread',
            series: { type: 'bar', xKey: 'x', yKey: 'a', shadow: SPREAD_SHADOW },
            data: BAR_DATA,
            options: { axes: { y: { type: 'number', min: 0, max: 12 } } },
            bounded: false,
            crowded: true,
        },
    ];

    /** The sizes of what the scratch canvas was cleared at and drew, with the size of the scratch canvas, since the last take. */
    interface Masks {
        whole: number;
        clears: number[];
        blurs: number[];
    }

    const watchMasks = () => {
        const proto: CanvasRenderingContext2D = Object.getPrototypeOf(new OffscreenCanvas(1, 1).getContext('2d'));
        const clearRect = vi.spyOn(proto, 'clearRect');
        const drawImage = vi.spyOn(proto, 'drawImage');
        return (): Masks => {
            // A blur draws a source rect of the scratch canvas, displaced by its shadow's offset.
            const blurs = drawImage.mock.calls.filter(
                ([, sx, sy, , , dx, dy]) => dx !== undefined && (dx !== sx || dy !== sy)
            );
            const scratch = new Set<unknown>(blurs.map(([source]) => source));
            const masks: Masks = {
                whole: Math.max(
                    0,
                    ...[...scratch].map(
                        (source) => (source as OffscreenCanvas).width * (source as OffscreenCanvas).height
                    )
                ),
                clears: clearRect.mock.calls
                    .map(([, , w, h], i) => ({
                        w,
                        h,
                        canvas: (clearRect.mock.contexts[i] as CanvasRenderingContext2D).canvas,
                    }))
                    .filter(({ canvas }) => scratch.has(canvas))
                    .map(({ w, h }) => w * h),
                blurs: blurs.map(([, , , w, h]) => w * h),
            };
            clearRect.mockClear();
            drawImage.mockClear();
            return masks;
        };
    };

    const expectMasks = ({ whole, clears, blurs }: Masks, bounded: boolean) => {
        expect(whole).toBeGreaterThan(0);
        expect(clears.length).toBeGreaterThan(0);
        expect(blurs.length).toBeGreaterThan(0);
        for (const area of [...clears, ...blurs]) {
            if (bounded) expect(area).toBeLessThan(whole);
            else expect(area).toBe(whole);
        }
    };

    /** Casts a chart again with nothing changed, so that its shadows are kept: the first repeat is cast, the next is blitted. */
    const repaint = () => {
        const {
            ctx: { scene },
            series,
        } = deproxy(charts.chart());
        series[0].contentGroup.markDirty();
        scene.render();
        return canvasImage(charts.chart());
    };

    const render = async (testCase: Case, bounded: boolean, series = testCase.series) => {
        const measure = vi.spyOn(Shape.prototype, 'getShadowSilhouetteBounds');
        if (!bounded) measure.mockReturnValue(false);
        const takeMasks = watchMasks();
        await charts.create([series], testCase.data, { ...RENDER_OPTIONS, ...testCase.options });
        if (testCase.hover !== undefined) await hoverDatum(charts.chart(), 0, testCase.hover);
        const direct = { ...canvasImage(charts.chart()), masks: takeMasks() };
        const measured = measure.mock.results.filter(({ value }) => value === true).length;
        const kept = testCase.crowded === true ? { ...repaint(), masks: takeMasks() } : undefined;
        const blitted = kept && repaint();
        measure.mockRestore();
        return { ...direct, measured, kept, blitted };
    };

    it.each(CASES)('should draw the pixels that the whole mask draws for $name', async (testCase) => {
        const full = await render(testCase, false);
        const bounded = await render(testCase, true);

        // The whole mask is the reference only if nothing was measured there, and it is cleared and blurred whole.
        expect(full.measured).toBe(0);
        expectMasks(full.masks, false);
        expectMasks(bounded.masks, testCase.bounded);
        // And a shadow is on the canvas, rather than the two being equally bare.
        const { shadow: _shadow, highlight: _highlight, ...series } = testCase.series;
        const bare = await render(testCase, true, series);
        expect(differingBytes(bounded, bare)).toBeGreaterThan(0);

        expectSamePixels(bounded, full);
    });

    it.each(CASES.filter(({ crowded }) => crowded))(
        'should clear and blur a part of the mask of a kept cast for $name',
        async (testCase) => {
            const full = await render(testCase, false);
            const bounded = await render(testCase, true);

            expectMasks(full.kept!.masks, false);
            expectMasks(bounded.kept!.masks, true);
            expectSamePixels(bounded.kept!, full.kept!);
            expectSamePixels(bounded.kept!, bounded);
            // The next cast is blitted from the cache, and clears and blurs no mask.
            expectSamePixels(bounded.blitted!, bounded);
        }
    );
});
