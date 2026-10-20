import { loadImage as skiaLoadImage } from 'skia-canvas';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgChartInstance, AgChartLegendClickEvent } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import {
    clickLegendItem,
    createChart,
    deproxy,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    stubChartImageLoader,
    waitForChartStability,
} from './utils';

describe('harness actions', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart.destroy();
    });

    const DATA = [
        { c: 'A', a: 1, b: 2, d: 3 },
        { c: 'B', a: 2, b: 3, d: 1 },
    ];

    describe('clickLegendItem', () => {
        it('clicks the legend item at the index and no other', async () => {
            const legendItemClick = vi.fn<(event: AgChartLegendClickEvent) => void>();
            chart = await createChart({
                data: DATA,
                series: [
                    { type: 'line', xKey: 'c', yKey: 'a' },
                    { type: 'line', xKey: 'c', yKey: 'b' },
                    { type: 'line', xKey: 'c', yKey: 'd' },
                ],
                legend: { enabled: true, listeners: { legendItemClick } },
            });
            await clickLegendItem(chart, 1);

            expect(legendItemClick).toHaveBeenCalledTimes(1);
            expect(legendItemClick.mock.calls[0][0]).toMatchObject({ itemId: 'b' });

            await clickLegendItem(chart, 2);

            expect(legendItemClick).toHaveBeenCalledTimes(2);
            expect(legendItemClick.mock.calls[1][0]).toMatchObject({ itemId: 'd' });
        });

        it('hides a series when its item is clicked and shows it when it is clicked again', async () => {
            chart = await createChart({
                data: DATA,
                series: [
                    { type: 'line', xKey: 'c', yKey: 'a' },
                    { type: 'line', xKey: 'c', yKey: 'b' },
                ],
                legend: { enabled: true },
            });
            const [, second] = deproxy(chart).series;
            expect(second.visible).toBe(true);

            await clickLegendItem(chart, 1);
            await waitForChartStability(chart);
            expect(second.visible).toBe(false);

            await clickLegendItem(chart, 1);
            await waitForChartStability(chart);
            expect(second.visible).toBe(true);
        });

        it('fails when the legend has no item at the index', async () => {
            chart = await createChart({
                data: DATA,
                series: [{ type: 'line', xKey: 'c', yKey: 'a' }],
                legend: { enabled: true },
            });

            await expect(clickLegendItem(chart, 1)).rejects.toThrow();
        });
    });

    describe('stubChartImageLoader', () => {
        const ICON = `data:image/svg+xml;utf8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8"><rect width="8" height="8"/></svg>`
        )}`;

        it('resolves the stubbed URLs to the preloaded images and nothing else', async () => {
            const preloaded = await skiaLoadImage(ICON);
            // Bespoke: the loader is stubbed before the first render.
            chart = AgCharts.create(
                prepareTestOptions({ data: DATA, series: [{ type: 'line', xKey: 'c', yKey: 'a' }] })
            );
            stubChartImageLoader(chart, { [ICON]: preloaded });

            const { imageLoader } = deproxy(chart).ctx.scene;
            expect(imageLoader.loadImage(ICON)).toBe(preloaded);
            expect(imageLoader.loadImage('data:image/svg+xml;utf8,other')).toBeUndefined();
        });
    });
});
