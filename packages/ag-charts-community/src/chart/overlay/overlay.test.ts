import { afterEach, describe, expect } from '@jest/globals';

import type { Chart } from '../chart';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    createChart,
    expectWarningsToMatchSnapshots,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

describe('Overlay', () => {
    setupMockConsole();

    const ctx = setupMockCanvas();
    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    describe('#validation', () => {
        test('invalid objects', async () => {
            const invalidObj = 0 as unknown as object;
            chart = await createChart({ overlays: { noData: invalidObj, noVisibleSeries: invalidObj } });
            expectWarningsToMatchSnapshots();
        });

        test('invalid text', async () => {
            const invalidObj = { text: 0 as unknown as string };
            chart = await createChart({ overlays: { noData: invalidObj, noVisibleSeries: invalidObj } });
            expectWarningsToMatchSnapshots();
        });

        test('invalid renderer', async () => {
            const invalidObj = { renderer: 0 as unknown as () => string };
            chart = await createChart({ overlays: { noData: invalidObj, noVisibleSeries: invalidObj } });
            expectWarningsToMatchSnapshots();
        });
    });

    // FIXME: unfortunately, overlays do not render on mock canvases.
    xdescribe('#create', () => {
        test('no data', async () => {
            chart = await createChart({
                data: [],
                series: [
                    { xKey: 'x', yKey: 'y1' },
                    { xKey: 'x', yKey: 'y2' },
                ],
            });
            await compare();
        });

        test('no visible series', async () => {
            chart = await createChart({
                data: [
                    { x: 'a', y1: 2, y2: 1 },
                    { x: 'b', y1: 3, y2: 1 },
                    { x: 'c', y1: 5, y2: 2 },
                ],
                series: [
                    { xKey: 'x', yKey: 'y1', visible: false },
                    { xKey: 'x', yKey: 'y2', visible: false },
                ],
            });
            await compare();
        });

        test('neither data nor visible series', async () => {
            chart = await createChart({
                data: [],
                series: [
                    { xKey: 'x', yKey: 'y1', visible: false },
                    { xKey: 'x', yKey: 'y2', visible: false },
                ],
            });
            await compare();
        });

        test('custom no data text', async () => {
            chart = await createChart({
                data: [],
                series: [
                    { xKey: 'x', yKey: 'y1' },
                    { xKey: 'x', yKey: 'y2' },
                ],
                overlays: {
                    noData: { text: 'TEST CUSTOM NO DATA TEXT' },
                },
            });
            await compare();
        });

        test('custom no visible series text', async () => {
            chart = await createChart({
                data: [
                    { x: 'a', y1: 2, y2: 1 },
                    { x: 'b', y1: 3, y2: 1 },
                    { x: 'c', y1: 5, y2: 2 },
                ],
                series: [
                    { xKey: 'x', yKey: 'y1', visible: false },
                    { xKey: 'x', yKey: 'y2', visible: false },
                ],
                overlays: {
                    noData: { text: 'TEST CUSTOM NO VISIBLE SERIES TEXT' },
                },
            });
            await compare();
        });
    });
});
