import { afterEach, describe, expect, it } from 'vitest';

import { Group, Shape } from 'ag-charts-core';
import type { AgBarSeriesOptions, AgCartesianChartOptions, AgDropShadowOptions } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { HIGHLIGHT_SHADOW, SERIES_SHADOW } from '../../test/shadowFixtures';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

const DATA = [
    { quarter: 'Q1', value: 5 },
    { quarter: 'Q2', value: 8 },
    { quarter: 'Q3', value: 3 },
];

function shapes(root: Group): Shape[] {
    const found: Shape[] = [];
    const visit = (node: unknown) => {
        if (node instanceof Shape) found.push(node);
        if (node instanceof Group) {
            for (const child of node.children()) visit(child);
        }
    };
    visit(root);
    return found;
}

describe('BarSeries highlight shadow', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: any;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const hoverFirstBar = async (
        series: Partial<AgBarSeriesOptions>,
        drawingMode?: 'cutout' | 'overlay'
    ): Promise<{ inPlace: Shape[]; highlighted: Shape[] }> => {
        const options: AgCartesianChartOptions = {
            data: DATA,
            animation: { enabled: false },
            highlight: { drawingMode: drawingMode ?? 'cutout' },
            series: [{ type: 'bar', xKey: 'quarter', yKey: 'value', ...series }],
        };
        prepareTestOptions(options);
        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);

        const [seriesImpl] = chart.series;
        const datum = seriesImpl.contextNodeData.nodeData[0];
        chart.ctx.highlightManager.updateHighlight(chart.id, datum);
        await waitForChartStability(chart);

        return {
            inPlace: shapes(seriesImpl.contentGroup),
            highlighted: shapes(seriesImpl.highlightNodeGroup),
        };
    };

    it('has the in-place bars cast the series shadow when no highlight is hovered', async () => {
        const options: AgCartesianChartOptions = {
            data: DATA,
            animation: { enabled: false },
            series: [{ type: 'bar', xKey: 'quarter', yKey: 'value', shadow: SERIES_SHADOW }],
        };
        prepareTestOptions(options);
        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);

        const bars = shapes(chart.series[0].contentGroup);
        expect(bars).toHaveLength(DATA.length);
        for (const bar of bars) expect(bar.fillShadow).toMatchObject(SERIES_SHADOW);
    });

    it('casts the hovered bar shadow once, from the highlight layer, when the highlight cuts out', async () => {
        const { inPlace, highlighted } = await hoverFirstBar({ shadow: SERIES_SHADOW }, 'cutout');

        expect(highlighted).toHaveLength(1);
        expect(highlighted[0].drawingMode).toBe('cutout');
        expect(highlighted[0].fillShadow).toMatchObject(SERIES_SHADOW);

        const [hovered, ...others] = inPlace;
        expect(hovered.fillShadow?.enabled).not.toBe(true);
        for (const bar of others) expect(bar.fillShadow).toMatchObject(SERIES_SHADOW);
    });

    it('casts the hovered bar shadow once, from the in-place bar, when the highlight overlays', async () => {
        const { inPlace, highlighted } = await hoverFirstBar({ shadow: SERIES_SHADOW }, 'overlay');

        expect(highlighted).toHaveLength(1);
        expect(highlighted[0].fillShadow?.enabled).not.toBe(true);
        for (const bar of inPlace) expect(bar.fillShadow).toMatchObject(SERIES_SHADOW);
    });

    it('moves the shadow between bars as the hover moves', async () => {
        const { inPlace } = await hoverFirstBar({ shadow: SERIES_SHADOW }, 'cutout');
        expect(inPlace[0].fillShadow?.enabled).not.toBe(true);

        const [series] = chart.series;
        chart.ctx.highlightManager.updateHighlight(chart.id, series.contextNodeData.nodeData[1]);
        await waitForChartStability(chart);

        const bars = shapes(series.contentGroup);
        expect(bars[0].fillShadow).toMatchObject(SERIES_SHADOW);
        expect(bars[1].fillShadow?.enabled).not.toBe(true);
        expect(bars[2].fillShadow).toMatchObject(SERIES_SHADOW);
    });

    it('merges highlightedItem.shadow over the series shadow on the hovered bar', async () => {
        const { inPlace, highlighted } = await hoverFirstBar({
            shadow: SERIES_SHADOW,
            highlight: { highlightedItem: { shadow: HIGHLIGHT_SHADOW } },
        });

        expect(highlighted).toHaveLength(1);
        expect(highlighted[0].fillShadow).toMatchObject(HIGHLIGHT_SHADOW);

        const [hovered, ...others] = inPlace;
        expect(hovered.fillShadow?.enabled).not.toBe(true);
        for (const bar of others) expect(bar.fillShadow).toMatchObject(SERIES_SHADOW);
    });

    it('fills highlightedItem.shadow gaps from the series shadow', async () => {
        const { highlighted } = await hoverFirstBar({
            shadow: SERIES_SHADOW,
            highlight: { highlightedItem: { shadow: { blur: 20 } } },
        });

        expect(highlighted[0].fillShadow).toMatchObject({ ...SERIES_SHADOW, blur: 20 });
    });

    it('applies highlightedItem.shadow without a series shadow', async () => {
        const { inPlace, highlighted } = await hoverFirstBar({
            highlight: { highlightedItem: { shadow: HIGHLIGHT_SHADOW } },
        });

        expect(highlighted[0].fillShadow).toMatchObject(HIGHLIGHT_SHADOW);
        for (const bar of inPlace) expect(bar.fillShadow?.enabled).not.toBe(true);
    });

    describe('spread', () => {
        const SPREAD_SHADOW: AgDropShadowOptions = { ...SERIES_SHADOW, spread: 6 };

        it('should render the bars with a shadow spread', async () => {
            const options: AgCartesianChartOptions = {
                data: DATA,
                animation: { enabled: false },
                series: [{ type: 'bar', xKey: 'quarter', yKey: 'value', shadow: SPREAD_SHADOW }],
            };
            prepareTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(extractImageData(ctx)).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should render the hovered bar with highlightedItem.shadow.spread', async () => {
            await hoverFirstBar({
                shadow: SERIES_SHADOW,
                highlight: { highlightedItem: { shadow: { ...HIGHLIGHT_SHADOW, spread: 8 } } },
            });

            expect(extractImageData(ctx)).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        // The first bar fills x = 75 to 248 and ends at y = 555 on the canvas, and its highlight shadow is offset by 8
        // each way. There is no blur, so the shadow covers exactly its rect, which a spread grows on every side.
        const pixel = (x: number, y: number) => [...ctx.getRenderContext2D().getImageData(x, y, 1, 1).data];
        const SHADOW_RED = [170, 0, 0, 255];

        it('should grow the highlight shadow past the hovered bar by highlightedItem.shadow.spread', async () => {
            await hoverFirstBar({
                shadow: SERIES_SHADOW,
                highlight: { highlightedItem: { shadow: { ...HIGHLIGHT_SHADOW, blur: 0, spread: 8 } } },
            });

            // Right of the bar: the shadow runs to 248 + 8 + 8 = 264.
            expect(pixel(260, 300)).toEqual(SHADOW_RED);
            expect(pixel(268, 300)).not.toEqual(SHADOW_RED);
            // Left of where the shadow would start without a spread: 75 + 8 - 8 = 75.
            expect(pixel(77, 560)).toEqual(SHADOW_RED);
            expect(pixel(70, 560)).not.toEqual(SHADOW_RED);
            // Below the bar: the shadow runs to 555 + 8 + 8 = 571.
            expect(pixel(150, 568)).toEqual(SHADOW_RED);
            expect(pixel(150, 575)).not.toEqual(SHADOW_RED);
        });

        it('should not grow the highlight shadow without highlightedItem.shadow.spread', async () => {
            await hoverFirstBar({
                shadow: SERIES_SHADOW,
                highlight: { highlightedItem: { shadow: { ...HIGHLIGHT_SHADOW, blur: 0 } } },
            });

            // The shadow of a rect offset by 8 runs from 83 to 256, and to 563.
            expect(pixel(252, 300)).toEqual(SHADOW_RED);
            expect(pixel(260, 300)).not.toEqual(SHADOW_RED);
            expect(pixel(77, 560)).not.toEqual(SHADOW_RED);
            expect(pixel(150, 568)).not.toEqual(SHADOW_RED);
        });

        it('should render the hovered bar with the series shadow spread when it overlays', async () => {
            await hoverFirstBar({ shadow: SPREAD_SHADOW }, 'overlay');

            expect(extractImageData(ctx)).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    });
});
