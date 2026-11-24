import { afterEach, describe, expect, it } from 'vitest';

import { Transformable } from 'ag-charts-core';
import type { Node } from 'ag-charts-core';
import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { getSeriesSelectionNodes } from '../../test/seriesAccessors';
import {
    createChart,
    deproxy,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

// A glow or shadow with no blur, in red over a white chart, so that the green channel of a pixel beside the bar is
// 255 * (1 - strength): the strength that it is cast at.
const SHADOW = { enabled: true, fill: 'red', xOffset: 30, yOffset: 0, blur: 0 };
const GLOW = { enabled: true, fill: 'red', spread: 10, blur: 0 };
const FULL_RED = [255, 0, 0, 255];
const WHITE = [255, 255, 255, 255];

const strengthOf = (pixel: number[]) => 1 - pixel[1] / 255;

describe('glow and shadow strength under the fillOpacity of the item, in a chart', () => {
    setupMockConsole();
    const canvas = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const visibleItems = () =>
        getSeriesSelectionNodes<Node>(deproxy(chart!), 'datumSelection')
            .filter((n) => n.visible)
            .map((n) => Transformable.toCanvas(n));

    // The mock canvas snapshots only the first chart of a test, so a test casts every variant through one chart. The pixel
    // read is 5px past the last of two bars, which is in the glow of 10 and in the shadow that is offset by 30. With
    // `dimmed`, the first bar is hovered, so that the last is dimmed to the opacity that its `unhighlightedItem` sets.
    const castBeside = async (series: object, chartOptions: object = {}, dimmed?: number, hoverLast = false) => {
        const options: AgChartOptions = {
            animation: { enabled: false },
            legend: { enabled: false },
            data: [
                { category: 'A', value: 8 },
                { category: 'B', value: 8 },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'category',
                    yKey: 'value',
                    fill: 'blue',
                    strokeWidth: 0,
                    highlight: { unhighlightedItem: { opacity: dimmed ?? 1 } },
                    ...series,
                },
            ],
            ...chartOptions,
        };
        if (chart == null) {
            chart = await createChart(options);
        } else {
            await chart.update(prepareTestOptions(options));
            await waitForChartStability(chart);
        }

        if (dimmed != null || hoverLast) {
            const hovered = hoverLast ? visibleItems().at(-1)! : visibleItems()[0];
            await hoverAction(hovered.x + hovered.width / 2, hovered.y + hovered.height / 2)(deproxy(chart));
            await waitForChartStability(chart);
        }

        const { x, y, width, height } = visibleItems().at(-1)!;
        const { data, width: canvasWidth } = canvas.snapshot();
        const i = (Math.round(y + height / 2) * canvasWidth + Math.round(x + width + 5)) * 4;
        return Array.from(data.slice(i, i + 4));
    };

    const CASTS = {
        glow: (fillOpacity?: number) => ({ glow: { ...GLOW, fillOpacity } }),
        shadow: (fillOpacity?: number) => ({ shadow: { ...SHADOW, fillOpacity } }),
    };

    describe('with a fillOpacity of 1 set, on bars at a fillOpacity of 0.5 (case 2)', () => {
        it.each(['glow', 'shadow'] as const)('should cast the %s as it casts it on opaque bars', async (name) => {
            const opaque = await castBeside({ ...CASTS[name](1), fillOpacity: 1 });
            const translucent = await castBeside({ ...CASTS[name](1), fillOpacity: 0.5 });

            expect(opaque).toEqual(FULL_RED);
            expect(translucent).toEqual(FULL_RED);
        });

        it('should cast a glow as set where the alpha is in the colour of the fill', async () => {
            expect(await castBeside({ ...CASTS.glow(1), fill: 'rgba(0, 0, 255, 0.5)' })).toEqual(FULL_RED);
        });

        it('should cast a glow as set where the fill is a gradient with alpha', async () => {
            const fill = {
                type: 'gradient',
                colorStops: [
                    { color: 'rgba(0, 0, 255, 0.4)', stop: 0 },
                    { color: 'rgba(0, 0, 255, 0.4)', stop: 1 },
                ],
            };

            expect(await castBeside({ ...CASTS.glow(1), fill })).toEqual(FULL_RED);
        });

        it('should cast a shadow as set where a theme override sets the fillOpacity, not the series', async () => {
            const theme = { overrides: { bar: { series: { shadow: { fillOpacity: 0.8 } } } } };

            expect(strengthOf(await castBeside({ shadow: SHADOW, fillOpacity: 0.5 }, { theme }))).toBeCloseTo(0.8, 1);
        });
    });

    describe('with no fillOpacity set, on bars at a fillOpacity of 0.5 (case 3)', () => {
        it('should cast a glow at its default of 0.4, whatever the fillOpacity of the bars', async () => {
            expect(strengthOf(await castBeside({ ...CASTS.glow(), fillOpacity: 0.5 }))).toBeCloseTo(0.4, 1);
            expect(strengthOf(await castBeside({ ...CASTS.glow(), fillOpacity: 1 }))).toBeCloseTo(0.4, 1);
        });

        it('should cast a glow with no fill in the colour of the bar, at 0.4', async () => {
            const [r, g, b] = await castBeside({ glow: { enabled: true, spread: 10, blur: 0 }, fillOpacity: 0.5 });

            // Blue at 0.4 over white leaves 60% of red and green, and all of the blue.
            expect([r, g, b]).toEqual([153, 153, 255]);
        });

        it('should cast a shadow at the 0.5 of the theme times the fillOpacity of the bars, as it did', async () => {
            // A shadow in the theme's black, so the red channel is what it takes away.
            const shadow = { enabled: true, xOffset: 30, yOffset: 0, blur: 0 };

            expect((await castBeside({ shadow, fillOpacity: 0.5 }))[0]).toBeCloseTo(255 * (1 - 0.25), -1);
            expect((await castBeside({ shadow, fillOpacity: 1 }))[0]).toBeCloseTo(255 * (1 - 0.5), -1);
        });
    });

    describe('with only a fill set on the shadow, on bars at a fillOpacity of 0.5', () => {
        it('should cast it at the fillOpacity of the bars, as it did', async () => {
            expect(strengthOf(await castBeside({ shadow: SHADOW, fillOpacity: 0.5 }))).toBeCloseTo(0.5, 1);
            expect(await castBeside({ shadow: SHADOW, fillOpacity: 1 })).toEqual(FULL_RED);
        });
    });

    describe('from the shadow of the highlightedItem, on the hovered bar at a fillOpacity of 0.5', () => {
        const hoveredCast = (series: object, highlightedItem: object) =>
            castBeside(
                { fillOpacity: 0.5, ...series, highlight: { unhighlightedItem: { opacity: 1 }, highlightedItem } },
                {},
                undefined,
                true
            );
        const THEME_SHADOW = { enabled: true, xOffset: 30, yOffset: 0, blur: 0 };

        it('should cast a fillOpacity of the bucket as set, over a shadow with the fillOpacity of the theme', async () => {
            const [red] = await hoveredCast({ shadow: THEME_SHADOW }, { shadow: { fillOpacity: 1 } });

            expect(red).toBeLessThanOrEqual(1);
        });

        it('should cast a fill of the bucket alone as unset, over a shadow with a fillOpacity set', async () => {
            const series = { shadow: { ...SHADOW, fillOpacity: 1 } };

            expect(strengthOf(await hoveredCast(series, { shadow: { fill: 'red' } }))).toBeCloseTo(0.5, 1);
        });
    });

    describe('with the opacity of the item', () => {
        it.each(['glow', 'shadow'] as const)('should halve a %s with a fillOpacity set', async (name) => {
            const series = CASTS[name](1);

            expect(strengthOf(await castBeside({ ...series, fillOpacity: 1 }, {}, 0.5))).toBeCloseTo(0.5, 1);
            expect(strengthOf(await castBeside({ ...series, fillOpacity: 0.5 }, {}, 0.5))).toBeCloseTo(0.5, 1);
        });

        it('should halve a glow at its default, and a shadow at the fillOpacity of the item as well', async () => {
            expect(strengthOf(await castBeside({ ...CASTS.glow(), fillOpacity: 0.5 }, {}, 0.5))).toBeCloseTo(0.2, 1);
            expect(strengthOf(await castBeside({ shadow: SHADOW, fillOpacity: 0.5 }, {}, 0.5))).toBeCloseTo(0.25, 1);
        });
    });

    describe('from an itemStyler (case 6)', () => {
        it('should cast a glow as set with a fillOpacity, and at 0.4 without, on bars at 0.5', async () => {
            const styled = (glow: object) => ({ fillOpacity: 0.5, itemStyler: () => ({ glow }) });

            expect(await castBeside(styled({ ...GLOW, fillOpacity: 1 }))).toEqual(FULL_RED);
            expect(strengthOf(await castBeside(styled(GLOW)))).toBeCloseTo(0.4, 1);
        });

        it('should cast a shadow as set with a fillOpacity, and at the fillOpacity of the bars with only a fill', async () => {
            const styled = (shadow: object) => ({ fillOpacity: 0.5, itemStyler: () => ({ shadow }) });

            expect(await castBeside(styled({ ...SHADOW, fillOpacity: 1 }))).toEqual(FULL_RED);
            expect(strengthOf(await castBeside(styled(SHADOW)))).toBeCloseTo(0.5, 1);
        });
    });

    describe('with a fillOpacity of 0', () => {
        it.each(['glow', 'shadow'] as const)('should cast no %s', async (name) => {
            expect(await castBeside({ ...CASTS[name](0), fillOpacity: 0.5 })).toEqual(WHITE);
        });
    });
});
