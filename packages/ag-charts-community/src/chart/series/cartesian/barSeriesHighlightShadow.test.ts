import { afterEach, describe, expect, it } from 'vitest';

import type { AgBarSeriesOptions, AgCartesianChartOptions, AgDropShadowOptions } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { Group } from '../../../scene/group';
import { Shape } from '../../../scene/shape/shape';
import {
    deproxy,
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

const SHADOW: AgDropShadowOptions = { enabled: true, color: '#112233', xOffset: 4, yOffset: 4, blur: 6 };
const HIGHLIGHT_SHADOW: AgDropShadowOptions = { enabled: true, color: '#aa0000', xOffset: 8, yOffset: 8, blur: 2 };

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
    setupMockCanvas();

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
            series: [{ type: 'bar', xKey: 'quarter', yKey: 'value', shadow: SHADOW }],
        };
        prepareTestOptions(options);
        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);

        const bars = shapes(chart.series[0].contentGroup);
        expect(bars).toHaveLength(DATA.length);
        for (const bar of bars) expect(bar.fillShadow).toMatchObject(SHADOW);
    });

    it('casts the hovered bar shadow once, from the highlight layer, when the highlight cuts out', async () => {
        const { inPlace, highlighted } = await hoverFirstBar({ shadow: SHADOW }, 'cutout');

        expect(highlighted).toHaveLength(1);
        expect(highlighted[0].drawingMode).toBe('cutout');
        expect(highlighted[0].fillShadow).toMatchObject(SHADOW);

        const [hovered, ...others] = inPlace;
        expect(hovered.fillShadow?.enabled).not.toBe(true);
        for (const bar of others) expect(bar.fillShadow).toMatchObject(SHADOW);
    });

    it('casts the hovered bar shadow once, from the in-place bar, when the highlight overlays', async () => {
        const { inPlace, highlighted } = await hoverFirstBar({ shadow: SHADOW }, 'overlay');

        expect(highlighted).toHaveLength(1);
        expect(highlighted[0].fillShadow?.enabled).not.toBe(true);
        for (const bar of inPlace) expect(bar.fillShadow).toMatchObject(SHADOW);
    });

    it('moves the shadow between bars as the hover moves', async () => {
        const { inPlace } = await hoverFirstBar({ shadow: SHADOW }, 'cutout');
        expect(inPlace[0].fillShadow?.enabled).not.toBe(true);

        const [series] = chart.series;
        chart.ctx.highlightManager.updateHighlight(chart.id, series.contextNodeData.nodeData[1]);
        await waitForChartStability(chart);

        const bars = shapes(series.contentGroup);
        expect(bars[0].fillShadow).toMatchObject(SHADOW);
        expect(bars[1].fillShadow?.enabled).not.toBe(true);
        expect(bars[2].fillShadow).toMatchObject(SHADOW);
    });

    it('replaces the series shadow on the hovered bar with highlightedItem.shadow', async () => {
        const { inPlace, highlighted } = await hoverFirstBar({
            shadow: SHADOW,
            highlight: { highlightedItem: { shadow: HIGHLIGHT_SHADOW } },
        });

        expect(highlighted).toHaveLength(1);
        expect(highlighted[0].fillShadow).toMatchObject(HIGHLIGHT_SHADOW);

        const [hovered, ...others] = inPlace;
        expect(hovered.fillShadow?.enabled).not.toBe(true);
        for (const bar of others) expect(bar.fillShadow).toMatchObject(SHADOW);
    });

    it('fills highlightedItem.shadow gaps from the series shadow', async () => {
        const { highlighted } = await hoverFirstBar({
            shadow: SHADOW,
            highlight: { highlightedItem: { shadow: { blur: 20 } } },
        });

        expect(highlighted[0].fillShadow).toMatchObject({ ...SHADOW, blur: 20 });
    });

    it('applies highlightedItem.shadow without a series shadow', async () => {
        const { inPlace, highlighted } = await hoverFirstBar({
            highlight: { highlightedItem: { shadow: HIGHLIGHT_SHADOW } },
        });

        expect(highlighted[0].fillShadow).toMatchObject(HIGHLIGHT_SHADOW);
        for (const bar of inPlace) expect(bar.fillShadow?.enabled).not.toBe(true);
    });
});
