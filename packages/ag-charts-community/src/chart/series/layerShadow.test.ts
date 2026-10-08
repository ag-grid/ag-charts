import { afterEach, describe, expect, it } from 'vitest';

import { Transformable } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartOptions, AgDropShadowOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { STRIPPED_NUMBER_AXES } from '../test/bigintExamples';
import { SERIES_SHADOW } from '../test/shadowFixtures';
import { deproxy, prepareTestOptions, setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';

const XY_DATA = [
    { x: 1, y: 5, size: 10 },
    { x: 2, y: 8, size: 20 },
    { x: 3, y: 3, size: 30 },
];
const CATEGORY_DATA = [
    { category: 'A', value: 5 },
    { category: 'B', value: 8 },
    { category: 'C', value: 3 },
];
const HISTOGRAM_DATA = [{ x: 1 }, { x: 2 }, { x: 2.5 }, { x: 4 }, { x: 5 }, { x: 5.5 }, { x: 7 }];

interface SeriesCase {
    name: string;
    /** The series options, with `shadow` placed where this series reads it from. */
    series: (shadow: AgDropShadowOptions | undefined) => object;
    data: object[];
}

const SERIES: SeriesCase[] = [
    {
        name: 'bar',
        data: CATEGORY_DATA,
        series: (shadow) => ({ type: 'bar', xKey: 'category', yKey: 'value', shadow }),
    },
    {
        name: 'histogram',
        data: HISTOGRAM_DATA,
        series: (shadow) => ({ type: 'histogram', xKey: 'x', shadow }),
    },
    {
        name: 'scatter',
        data: XY_DATA,
        series: (shadow) => ({ type: 'scatter', xKey: 'x', yKey: 'y', shadow }),
    },
    {
        name: 'bubble',
        data: XY_DATA,
        series: (shadow) => ({ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'size', shadow }),
    },
    {
        name: 'line markers',
        data: XY_DATA,
        series: (shadow) => ({ type: 'line', xKey: 'x', yKey: 'y', marker: { enabled: true, shadow } }),
    },
    {
        name: 'area markers',
        data: XY_DATA,
        series: (shadow) => ({ type: 'area', xKey: 'x', yKey: 'y', marker: { enabled: true, shadow } }),
    },
    {
        name: 'donut',
        data: CATEGORY_DATA,
        series: (shadow) => ({ type: 'donut', angleKey: 'value', calloutLabelKey: 'category', shadow }),
    },
    {
        name: 'pie',
        data: CATEGORY_DATA,
        series: (shadow) => ({ type: 'pie', angleKey: 'value', calloutLabelKey: 'category', shadow }),
    },
];

describe('layer shadow batching of series', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: any;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async (options: AgChartOptions) => {
        prepareTestOptions(options);
        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);
        return chart;
    };

    /** The colour of a pixel of the chart's canvas, which each chart has its own of. */
    const pixelAt = (x: number, y: number) => [
        ...chart.ctx.scene.canvas.context.getImageData(Math.round(x), Math.round(y), 1, 1).data,
    ];

    /** The mask is a scratch canvas, so a series that batches its shadows draws one more canvas than it does without. */
    const canvasesInUse = async (testCase: SeriesCase, shadow: AgDropShadowOptions | undefined) => {
        const before = new Set(ctx.getActiveOffscreenCanvasInstances());
        await create({
            data: testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [testCase.series(shadow)],
        } as AgChartOptions);
        const inUse = ctx
            .getActiveOffscreenCanvasInstances()
            .filter((canvas) => !before.has(canvas) && canvas.width > 0);
        chart.destroy();
        return inUse.length;
    };

    describe.each(SERIES)('$name', (testCase) => {
        it('draws its shadows through a mask', async () => {
            const withoutShadow = await canvasesInUse(testCase, undefined);

            expect(await canvasesInUse(testCase, SERIES_SHADOW)).toBeGreaterThan(withoutShadow);
        });

        it('draws no mask when its shadow is disabled', async () => {
            const withoutShadow = await canvasesInUse(testCase, undefined);

            expect(await canvasesInUse(testCase, { ...SERIES_SHADOW, enabled: false })).toBe(withoutShadow);
        });
    });

    describe('shadow beneath overlapping items', () => {
        // A shadow with no blur, to the right of a marker that is clear of it, so that its alpha is the strength of the
        // shadow on the white of the chart.
        const SHADOW: AgDropShadowOptions = {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.5)',
            xOffset: 40,
            yOffset: 0,
            blur: 0,
        };
        const AXES = {
            x: { ...STRIPPED_NUMBER_AXES.x, min: 0, max: 10 },
            y: { ...STRIPPED_NUMBER_AXES.y, min: 0, max: 10 },
        };

        const createScatter = (data: object[], marker: object) =>
            create({
                data,
                animation: { enabled: false },
                legend: { enabled: false },
                axes: AXES,
                series: [
                    { type: 'scatter', xKey: 'x', yKey: 'y', shape: 'square', size: 20, shadow: SHADOW, ...marker },
                ],
            } as AgCartesianChartOptions);

        /** The canvas position of the centre of each marker, in the order that they are drawn. */
        const markerCentres = () =>
            [...chart.series[0].datumSelection.nodes()]
                .filter((node: any) => node.visible)
                .map((marker: any) => {
                    const { canvasX, canvasY } = Transformable.toCanvasPoint(marker.parentNode, marker.x, marker.y);
                    return { x: canvasX, y: canvasY };
                });

        /** The colour of the canvas pixel `dx` to the right of the first marker's centre. */
        const pixelBesideMarker = (dx: number) => {
            const [{ x, y }] = markerCentres();
            return pixelAt(x + dx, y);
        };

        const isHalfBlack = (pixel: number[]) => pixel.slice(0, 3).every((channel) => Math.abs(channel - 128) <= 2);

        it('should cast one shadow where two items overlap, not two', async () => {
            // Two points at the same place cast the same shadow twice, which would darken it to a quarter without a batch.
            await createScatter(
                [
                    { x: 3, y: 5 },
                    { x: 3, y: 5 },
                ],
                { fill: 'red', fillOpacity: 1, strokeWidth: 0 }
            );

            expect(isHalfBlack(pixelBesideMarker(40))).toBe(true);
        });

        it('should cast the same shadow from items that do not overlap', async () => {
            await createScatter(
                [
                    { x: 3, y: 5 },
                    { x: 3, y: 9 },
                ],
                { fill: 'red', fillOpacity: 1, strokeWidth: 0 }
            );

            expect(isHalfBlack(pixelBesideMarker(40))).toBe(true);
        });

        it.each([
            ['left to right', [3, 6]],
            ['right to left', [6, 3]],
        ])('should draw the shadow of one item beneath the next item, in data order %s', async (_, xs) => {
            // The shadow lands on the item to the right of the one that casts it, whichever of the two is drawn last. It is
            // offset by the distance between them, which is only known once the chart has been laid out.
            const data = xs.map((x) => ({ x, y: 5 }));
            const marker = { fill: 'red', fillOpacity: 1, strokeWidth: 0 };
            await createScatter(data, marker);
            const [left, right] = markerCentres().sort((a, b) => a.x - b.x);
            const xOffset = Math.round(right.x - left.x);
            chart.destroy();

            await createScatter(data, { ...marker, shadow: { ...SHADOW, xOffset } });

            // Beneath the item on the right, the shadow of the item on the left is hidden.
            const { x, y } = markerCentres().sort((a, b) => a.x - b.x)[1];
            expect(pixelAt(x, y)).toEqual([255, 0, 0, 255]);
        });

        it('should cast no shadow from the stroke of a marker that has no fill', async () => {
            await createScatter([{ x: 3, y: 5 }], { fill: 'none', stroke: 'red', strokeWidth: 6 });

            expect(pixelBesideMarker(40)).toEqual([255, 255, 255, 255]);
        });

        it('should cast the shadow of a filled marker with a stroke from its fill only', async () => {
            await createScatter([{ x: 3, y: 5 }], { fill: 'red', fillOpacity: 1, stroke: 'blue', strokeWidth: 6 });

            expect(isHalfBlack(pixelBesideMarker(40))).toBe(true);
        });
    });

    describe('series without a shadow', () => {
        it('should render the same with a disabled shadow as with none', async () => {
            const options = (shadow: AgDropShadowOptions | undefined) =>
                ({
                    data: XY_DATA,
                    animation: { enabled: false },
                    series: [{ type: 'scatter', xKey: 'x', yKey: 'y', shadow }],
                }) as AgCartesianChartOptions;

            await create(options(undefined));
            const snapshot = () => [...chart.ctx.scene.canvas.context.getImageData(0, 0, 800, 600).data];
            const without = snapshot();
            chart.destroy();

            await create(options({ ...SERIES_SHADOW, enabled: false }));

            expect(snapshot()).toEqual(without);
        });
    });
});
