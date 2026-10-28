import { afterEach, describe, expect, it, vi } from 'vitest';

import { type Node, Shape, Transformable } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartOptions, AgDropShadowOptions } from 'ag-charts-types';

import { Marker } from '../marker/marker';
import { STRIPPED_NUMBER_AXES } from '../test/bigintExamples';
import { getSeriesPaths } from '../test/communitySeriesAccessors';
import { getSeriesSelectionNodes } from '../test/seriesAccessors';
import { CATEGORY_DATA, HISTOGRAM_DATA, XY_DATA } from '../test/shadowFixtures';
import { createChart, deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';

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
        name: 'donut',
        data: CATEGORY_DATA,
        series: (shadow) => ({ type: 'donut', angleKey: 'value', calloutLabelKey: 'category', shadow }),
    },
    {
        name: 'scatter',
        data: XY_DATA,
        series: (shadow) => ({ type: 'scatter', xKey: 'x', yKey: 'y', shadow }),
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
        name: 'area fill',
        data: XY_DATA,
        series: (shadow) => ({ type: 'area', xKey: 'x', yKey: 'y', shadow }),
    },
];

describe('shadow fill and fillOpacity', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        vi.restoreAllMocks();
    });

    const warnings = () => vi.mocked(console.warn).mock.calls.map(([message]) => String(message));

    const create = async (options: AgChartOptions) => {
        chart = deproxy(await createChart(options));
        await waitForChartStability(chart);
        return chart;
    };

    /** The shapes of the first series that cast a shadow, including the fill path of an area. */
    const casters = () => {
        const selection = chart.series[0].type === 'donut' ? 'itemSelection' : 'datumSelection';
        const nodes: Node[] = getSeriesSelectionNodes(chart, selection);
        if (chart.series[0].type === 'area') nodes.push(...getSeriesPaths(chart));
        return nodes.filter((node): node is Shape => node instanceof Shape && node.fillShadow?.enabled === true);
    };

    const createSeries = (testCase: SeriesCase, shadow: AgDropShadowOptions | undefined) =>
        create({
            data: testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [testCase.series(shadow)],
        } as AgChartOptions);

    describe.each(SERIES)('$name', (testCase) => {
        it('casts the shadow in its fill and fillOpacity', async () => {
            await createSeries(testCase, {
                enabled: true,
                fill: '#336699',
                fillOpacity: 0.3,
                xOffset: 2,
                yOffset: 2,
                blur: 4,
            });

            expect(casters().length).toBeGreaterThan(0);
            for (const shape of casters()) {
                expect(shape.fillShadow).toMatchObject({ enabled: true, fill: '#336699', fillOpacity: 0.3 });
            }
            expect(warnings()).toEqual([]);
        });

        it('casts the shadow in its fill at a fillOpacity of 1 unless it sets one', async () => {
            await createSeries(testCase, { enabled: true, fill: '#336699', xOffset: 2, yOffset: 2, blur: 4 });

            expect(casters().length).toBeGreaterThan(0);
            for (const shape of casters()) {
                expect(shape.fillShadow).toMatchObject({ fill: '#336699', fillOpacity: 1 });
            }
        });

        it('still casts the shadow in its deprecated colour, as the fill, and warns', async () => {
            await createSeries(testCase, { enabled: true, color: '#336699', xOffset: 2, yOffset: 2, blur: 4 });

            expect(casters().length).toBeGreaterThan(0);
            for (const shape of casters()) {
                expect(shape.fillShadow).toMatchObject({ fill: '#336699', fillOpacity: 1 });
            }
            const messages = warnings().filter((message) => message.includes('.shadow.color'));
            expect(messages).toHaveLength(1);
            expect(messages[0]).toContain('is deprecated');
            expect(messages[0]).toContain('Use `fill` instead.');
        });

        it('casts the fill and not the deprecated colour when it has both, and warns about the colour', async () => {
            await createSeries(testCase, {
                enabled: true,
                fill: '#336699',
                color: '#ff0000',
                xOffset: 2,
                yOffset: 2,
                blur: 4,
            });

            expect(casters().length).toBeGreaterThan(0);
            for (const shape of casters()) expect(shape.fillShadow?.fill).toBe('#336699');
            expect(warnings().filter((message) => message.includes('.shadow.color'))).toHaveLength(1);
        });

        it('warns about a fillOpacity beyond 0 to 1, and casts the shadow without it', async () => {
            await createSeries(testCase, { enabled: true, fill: '#336699', fillOpacity: 2, xOffset: 2, blur: 4 });

            expect(warnings().filter((message) => message.includes('fillOpacity'))).toHaveLength(1);
            expect(casters().length).toBeGreaterThan(0);
            for (const shape of casters()) expect(shape.fillShadow?.fillOpacity).not.toBe(2);
        });

        it('takes the theme fill and fillOpacity when the shadow only turns it on', async () => {
            await createSeries(testCase, { enabled: true });

            expect(casters().length).toBeGreaterThan(0);
            for (const shape of casters()) expect(shape.fillShadow).toMatchObject({ fill: '#000', fillOpacity: 0.5 });
            expect(warnings()).toEqual([]);
        });

        it('keeps the theme fillOpacity out of a fill that the user sets', async () => {
            await createSeries(testCase, { enabled: true, fill: 'red' });

            expect(casters().length).toBeGreaterThan(0);
            for (const shape of casters()) expect(shape.fillShadow).toMatchObject({ fill: 'red', fillOpacity: 1 });
        });
    });

    describe('rendering', () => {
        // A shadow with no blur, to the right of a marker that is clear of it, so that the colour of a pixel on the white
        // of the chart is the strength of the shadow.
        const SHADOW: AgDropShadowOptions = { enabled: true, xOffset: 40, yOffset: 0, blur: 0 };
        const AXES = {
            x: { ...STRIPPED_NUMBER_AXES.x, min: 0, max: 10 },
            y: { ...STRIPPED_NUMBER_AXES.y, min: 0, max: 10 },
        };

        const pixelAt = (x: number, y: number) => [
            ...chart.ctx.scene.canvas.context.getImageData(Math.round(x), Math.round(y), 1, 1).data,
        ];

        /** The colour of the chart where the shadow of the marker falls, on its centre. */
        const shadowPixel = async (shadow: AgDropShadowOptions) => {
            await create({
                data: [{ x: 3, y: 5 }],
                animation: { enabled: false },
                legend: { enabled: false },
                axes: AXES,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shape: 'square',
                        size: 20,
                        fill: 'blue',
                        fillOpacity: 1,
                        strokeWidth: 0,
                        shadow: { ...SHADOW, ...shadow },
                    },
                ],
            } as AgCartesianChartOptions);
            const [marker] = getSeriesSelectionNodes<Marker>(chart, 'datumSelection').filter((node) => node.visible);
            const { canvasX, canvasY } = Transformable.toCanvasPoint(marker.parentNode!, marker.x, marker.y);
            const pixel = pixelAt(canvasX + 40, canvasY);
            chart.destroy();
            return pixel;
        };

        const expectChannels = (pixel: number[], expected: number[]) => {
            for (let i = 0; i < 4; i++) expect(Math.abs(pixel[i] - expected[i])).toBeLessThanOrEqual(2);
        };

        it('casts an opaque fill at full strength', async () => {
            expectChannels(await shadowPixel({ fill: '#ff0000' }), [255, 0, 0, 255]);
        });

        it('applies fillOpacity to the fill', async () => {
            // Half-opaque red on white.
            expectChannels(await shadowPixel({ fill: '#ff0000', fillOpacity: 0.5 }), [255, 128, 128, 255]);
            expectChannels(await shadowPixel({ fill: '#ff0000', fillOpacity: 0.25 }), [255, 191, 191, 255]);
        });

        it('multiplies fillOpacity into the alpha that the fill already has', async () => {
            const twice = await shadowPixel({ fill: 'rgba(255, 0, 0, 0.5)', fillOpacity: 0.5 });

            // A quarter, not a half.
            expectChannels(twice, [255, 191, 191, 255]);
            expectChannels(await shadowPixel({ fill: 'rgba(255, 0, 0, 0.5)' }), [255, 128, 128, 255]);
        });

        it('casts nothing at a fillOpacity of 0', async () => {
            expectChannels(await shadowPixel({ fill: '#ff0000', fillOpacity: 0 }), [255, 255, 255, 255]);
        });

        it('casts the deprecated colour as the fill would be cast', async () => {
            const withColor = await shadowPixel({ color: 'rgba(255, 0, 0, 0.5)' });
            const withFill = await shadowPixel({ fill: 'rgba(255, 0, 0, 0.5)' });

            expect(withColor).toEqual(withFill);
            expectChannels(withColor, [255, 128, 128, 255]);
        });

        it('casts the default shadow of the light theme as before: black at half strength', async () => {
            // The base cast '#00000080'.
            expectChannels(await shadowPixel({}), [127, 127, 127, 255]);
        });
    });
});
