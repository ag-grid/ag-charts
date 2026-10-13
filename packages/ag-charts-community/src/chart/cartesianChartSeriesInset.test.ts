import { afterEach, describe, expect, it } from 'vitest';

import { ChartUpdateType } from 'ag-charts-core';
import type { AgCartesianAxisPosition, AgCartesianChartOptions } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import type { CartesianChart } from './cartesianChart';
import { LayoutElement } from './layout/layoutManager';
import { deproxy, prepareTestOptions, setupMockCanvas, setupMockConsole, waitForChartStability } from './test/utils';

const INSET = 30;

const OPTIONS: AgCartesianChartOptions = {
    width: 600,
    height: 400,
    data: [
        { x: 'a', y: 1 },
        { x: 'b', y: 3 },
        { x: 'c', y: 2 },
    ],
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
};

describe('CartesianChart series insets', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: CartesianChart | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async (options: AgCartesianChartOptions) => {
        prepareTestOptions(options);
        chart = deproxy(AgCharts.create(options)) as CartesianChart;
        await waitForChartStability(chart);
        return chart;
    };

    const relayoutWithInset = async (c: CartesianChart, position: AgCartesianAxisPosition, width: number) => {
        c.ctx.layoutManager.registerElement(LayoutElement.SeriesInset, (layout) => {
            layout.seriesInsets[position] = width;
        });
        c.update(ChartUpdateType.PERFORM_LAYOUT);
        await waitForChartStability(c);
    };

    // The bar chart's default axes are a category axis at the bottom and a number axis at the left.
    it.each<AgCartesianAxisPosition>(['left', 'right', 'top', 'bottom'])(
        'shrinks the series area by the inset at the %s',
        async (position) => {
            const c = await create(structuredClone(OPTIONS));
            const before = c.seriesRect!.clone();

            await relayoutWithInset(c, position, INSET);
            const after = c.seriesRect!;

            const horizontal = position === 'left' || position === 'right';
            expect(horizontal ? before.width - after.width : before.height - after.height).toBe(INSET);
            expect(horizontal ? after.height : after.width).toBe(horizontal ? before.height : before.width);
        }
    );

    it('keeps the axes where they were and opens a gap before the series area', async () => {
        const c = await create(structuredClone(OPTIONS));
        const yAxis = c.axes.find((axis) => axis.position === 'left')!;
        const translation = { ...yAxis.translation };
        const seriesLeft = c.seriesRect!.x;

        await relayoutWithInset(c, 'left', INSET);

        expect(yAxis.translation.x).toBe(translation.x);
        expect(c.seriesRect!.x).toBe(seriesLeft + INSET);
    });

    it('releases the space when the inset is no longer requested', async () => {
        const c = await create(structuredClone(OPTIONS));
        const before = c.seriesRect!.clone();

        let width = INSET;
        c.ctx.layoutManager.registerElement(LayoutElement.SeriesInset, (layout) => {
            if (width > 0) layout.seriesInsets.right = width;
        });
        c.update(ChartUpdateType.PERFORM_LAYOUT);
        await waitForChartStability(c);
        expect(c.seriesRect!.width).toBe(before.width - INSET);

        width = 0;
        c.update(ChartUpdateType.PERFORM_LAYOUT);
        await waitForChartStability(c);
        expect(c.seriesRect!.width).toBe(before.width);
    });

    it('keeps the inset at a position without an axis through a resize', async () => {
        const options = structuredClone(OPTIONS);
        prepareTestOptions(options);
        const proxy = AgCharts.create(options);
        chart = deproxy(proxy) as CartesianChart;
        await waitForChartStability(chart);
        const before = chart.seriesRect!.clone();

        chart.ctx.layoutManager.registerElement(LayoutElement.SeriesInset, (layout) => {
            layout.seriesInsets.right = INSET;
        });
        chart.update(ChartUpdateType.PERFORM_LAYOUT);
        await waitForChartStability(chart);

        const withInset = chart.seriesRect!.width;
        expect(withInset).toBe(before.width - INSET);

        // Narrowing the chart narrows the series area by the same amount and keeps the inset.
        const shrink = 100;
        await proxy.updateDelta({ width: options.width! - shrink });
        await waitForChartStability(chart);

        expect(chart.seriesRect!.width).toBe(withInset - shrink);
        expect(chart.seriesRect!.height).toBe(before.height);
    });
});
