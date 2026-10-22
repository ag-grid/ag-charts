import { afterEach, describe, expect, it } from 'vitest';

import { BBox, ChartAxisDirection, type Mutex } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { firePreSeriesUpdate, getCaptionProxyElement, waitForUpdateQueueDrain } from './chartAccessors';
import { createChart, delay, deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from './utils';

describe('chart test accessors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const options: AgCartesianChartOptions = {
        data: [
            { category: 'A', value: 10 },
            { category: 'B', value: 20 },
        ],
        series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
        title: { text: 'Title' },
        footnote: { text: 'Footnote' },
    };

    describe('firePreSeriesUpdate', () => {
        it('reports the required range as a fraction of the series rect along the direction', async () => {
            chart = await createChart(options);

            const seriesRect = new BBox(0, 0, 200, 100);
            const horizontal = firePreSeriesUpdate(chart, {
                seriesRect,
                requiredRange: 50,
                requiredRangeDirection: ChartAxisDirection.X,
            });
            const vertical = firePreSeriesUpdate(chart, {
                seriesRect,
                requiredRange: 50,
                requiredRangeDirection: ChartAxisDirection.Y,
            });

            expect(horizontal).toEqual({
                requiredRangeRatio: 0.25,
                requiredRangeDirection: ChartAxisDirection.X,
                requiredRange: 50,
            });
            expect(vertical).toEqual({
                requiredRangeRatio: 0.5,
                requiredRangeDirection: ChartAxisDirection.Y,
                requiredRange: 50,
            });
        });

        it('leaves the series rect it was given on the chart', async () => {
            chart = await createChart(options);
            const seriesRect = new BBox(0, 0, 200, 100);

            firePreSeriesUpdate(chart, {
                seriesRect,
                requiredRange: 50,
                requiredRangeDirection: ChartAxisDirection.X,
            });

            expect(deproxy(chart).seriesRect).toBe(seriesRect);
        });
    });

    describe('waitForUpdateQueueDrain', () => {
        it('resolves only after the teardown that destroy() queued behind a running update has run', async () => {
            chart = await createChart(options);
            const inner = deproxy(chart);
            await waitForChartStability(inner);
            expect(inner.axes.length).toBeGreaterThan(0);

            // Hold the update mutex, as a running update does, so the teardown destroy() defers has to queue behind it.
            const { updateMutex } = inner as unknown as { updateMutex: Mutex };
            let releaseUpdate!: () => void;
            const update = updateMutex.acquire(() => new Promise<void>((resolve) => (releaseUpdate = resolve)));
            inner.destroy();
            (chart as unknown) = undefined; // Destroyed here; the teardown is what the accessor waits for.

            let drained = false;
            const drain = waitForUpdateQueueDrain(inner).then(() => (drained = true));
            await delay(20);
            expect(drained).toBe(false);
            expect(inner.axes.length).toBeGreaterThan(0);

            releaseUpdate();
            await update;
            await drain;
            expect(inner.axes).toHaveLength(0);
        });
    });

    describe('getCaptionProxyElement', () => {
        it('returns the element that exposes the caption to assistive technology, carrying its text', async () => {
            chart = await createChart(options);
            const inner = deproxy(chart);
            await waitForChartStability(inner);

            const element = getCaptionProxyElement(inner.footnote);

            expect(element).toBeInstanceOf(HTMLElement);
            expect(element?.textContent).toBe('Footnote');
        });

        it('is undefined for a caption that has no proxy yet', async () => {
            chart = await createChart(options);
            const inner = deproxy(chart);
            await waitForChartStability(inner);

            // The options set no subtitle, so its caption never created a proxy.
            expect(getCaptionProxyElement(inner.subtitle)).toBeUndefined();
        });
    });
});
