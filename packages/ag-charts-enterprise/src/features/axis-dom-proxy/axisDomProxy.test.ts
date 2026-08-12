import { vi } from 'vitest';

import { Chart, clickAction, setupMockCanvas, waitForChartStability } from 'ag-charts-community-test';
import { setupMockConsole } from 'ag-charts-test';

import { createEnterpriseChart } from '../../test/utils';

describe('AxisDOMProxy', () => {
    setupMockCanvas();
    setupMockConsole();
    let formatter: ReturnType<typeof vi.fn>;
    let click: ReturnType<typeof vi.fn>;
    let chart: Chart;

    beforeEach(() => {
        formatter = vi.fn();
        click = vi.fn();
    });
    afterEach(() => {
        chart?.destroy();
    });

    describe('horizontal grouped-category clicks', () => {
        beforeEach(async () => {
            chart = await createEnterpriseChart({
                data: [
                    { y: 10, x: ['Food', 'Meat', 'Fish'] },
                    { y: 10, x: ['Food', 'Meat', 'Chicken'] },
                    { y: 10, x: ['Food', 'Fruit', 'Banana'] },
                    { y: 10, x: ['Food', 'Fruit', 'Apple'] },
                    { y: 10, x: ['Drink', 'Soda', 'Coke'] },
                    { y: 10, x: ['Drink', 'Soda', 'Pepsi'] },
                    { y: 10, x: ['Drink', 'Tea', 'Green'] },
                ],
                axes: {
                    x: {
                        type: 'grouped-category',
                        depthOptions: [{}, {}, {}],
                        label: { formatter },
                        listeners: { click },
                    },
                },
                zoom: { enabled: true },
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            });
        });

        // Check that label formatter's indices match the DFS ordering of the x-grouping.
        // Note: axes[].label.formatter is called twice on start up for some reason.
        test('formatter - value/index match', () => {
            expect(formatter.mock.calls).toMatchObject([
                [expect.objectContaining({ value: 'Food', index: 0 })],
                [expect.objectContaining({ value: 'Meat', index: 1 })],
                [expect.objectContaining({ value: 'Fish', index: 2 })],
                [expect.objectContaining({ value: 'Chicken', index: 3 })],
                [expect.objectContaining({ value: 'Fruit', index: 4 })],
                [expect.objectContaining({ value: 'Banana', index: 5 })],
                [expect.objectContaining({ value: 'Apple', index: 6 })],
                [expect.objectContaining({ value: 'Drink', index: 7 })],
                [expect.objectContaining({ value: 'Soda', index: 8 })],
                [expect.objectContaining({ value: 'Coke', index: 9 })],
                [expect.objectContaining({ value: 'Pepsi', index: 10 })],
                [expect.objectContaining({ value: 'Tea', index: 11 })],
                [expect.objectContaining({ value: 'Green', index: 12 })],
                [expect.objectContaining({ value: 'Food', index: 0 })],
                [expect.objectContaining({ value: 'Meat', index: 1 })],
                [expect.objectContaining({ value: 'Fish', index: 2 })],
                [expect.objectContaining({ value: 'Chicken', index: 3 })],
                [expect.objectContaining({ value: 'Fruit', index: 4 })],
                [expect.objectContaining({ value: 'Banana', index: 5 })],
                [expect.objectContaining({ value: 'Apple', index: 6 })],
                [expect.objectContaining({ value: 'Drink', index: 7 })],
                [expect.objectContaining({ value: 'Soda', index: 8 })],
                [expect.objectContaining({ value: 'Coke', index: 9 })],
                [expect.objectContaining({ value: 'Pepsi', index: 10 })],
                [expect.objectContaining({ value: 'Tea', index: 11 })],
                [expect.objectContaining({ value: 'Green', index: 12 })],
            ]);
        });

        // Check that click's indices match the DFS ordering of the x-grouping.
        test('click - value/index match', async () => {
            await clickAction(257, 572)(chart); // 'Food'
            await clickAction(150, 545)(chart); // 'Meat'
            await clickAction(100, 493)(chart); // 'Fish'
            await clickAction(205, 495)(chart); // 'Chicken'
            await clickAction(364, 548)(chart); // 'Fruit'
            await clickAction(309, 500)(chart); // 'Banana'
            await clickAction(412, 499)(chart); // 'Apple'
            await clickAction(621, 571)(chart); // 'Drink'
            await clickAction(569, 545)(chart); // 'Soda'
            await clickAction(519, 499)(chart); // 'Coke'
            await clickAction(624, 494)(chart); // 'Pepsi'
            await clickAction(729, 549)(chart); // 'Tea'
            await clickAction(727, 502)(chart); // 'Green'
            await waitForChartStability(chart);
            expect(click.mock.calls).toMatchObject([
                [expect.objectContaining({ value: 'Food', index: 0 })],
                [expect.objectContaining({ value: 'Meat', index: 1 })],
                [expect.objectContaining({ value: 'Fish', index: 2 })],
                [expect.objectContaining({ value: 'Chicken', index: 3 })],
                [expect.objectContaining({ value: 'Fruit', index: 4 })],
                [expect.objectContaining({ value: 'Banana', index: 5 })],
                [expect.objectContaining({ value: 'Apple', index: 6 })],
                [expect.objectContaining({ value: 'Drink', index: 7 })],
                [expect.objectContaining({ value: 'Soda', index: 8 })],
                [expect.objectContaining({ value: 'Coke', index: 9 })],
                [expect.objectContaining({ value: 'Pepsi', index: 10 })],
                [expect.objectContaining({ value: 'Tea', index: 11 })],
                [expect.objectContaining({ value: 'Green', index: 12 })],
            ]);
        });
    });

    describe('vertical grouped-category clicks', () => {
        beforeEach(async () => {
            chart = await createEnterpriseChart({
                data: [
                    { x: 10, y: ['Food', 'Meat', 'Fish'] },
                    { x: 10, y: ['Food', 'Meat', 'Chicken'] },
                    { x: 10, y: ['Food', 'Fruit', 'Banana'] },
                    { x: 10, y: ['Drink', 'Soda', 'Coke'] },
                ],
                axes: {
                    y: {
                        type: 'grouped-category',
                        depthOptions: [{}, {}, {}],
                        listeners: { click },
                    },
                },
                zoom: { enabled: true },
                series: [{ type: 'bar', direction: 'horizontal', xKey: 'y', yKey: 'x' }],
            });
        });

        test('click - value/index match', async () => {
            await clickAction(83, 74)(chart); // 'Fish'
            await clickAction(54, 74)(chart); // 'Meat'
            await clickAction(26, 74)(chart); // 'Food'
            await clickAction(83, 234)(chart); // 'Chicken'
            await clickAction(83, 341)(chart); // 'Banana'
            await clickAction(54, 341)(chart); // 'Fruit'
            await clickAction(83, 502)(chart); // 'Coke'
            await clickAction(54, 502)(chart); // 'Soda'
            await clickAction(26, 502)(chart); // 'Drink'
            await waitForChartStability(chart);
            expect(click.mock.calls).toMatchObject([
                [expect.objectContaining({ value: 'Fish', index: 2 })],
                [expect.objectContaining({ value: 'Meat', index: 1 })],
                [expect.objectContaining({ value: 'Food', index: 0 })],
                [expect.objectContaining({ value: 'Chicken', index: 3 })],
                [expect.objectContaining({ value: 'Banana', index: 5 })],
                [expect.objectContaining({ value: 'Fruit', index: 4 })],
                [expect.objectContaining({ value: 'Coke', index: 8 })],
                [expect.objectContaining({ value: 'Soda', index: 7 })],
                [expect.objectContaining({ value: 'Drink', index: 6 })],
            ]);
        });
    });

    describe('continuous axis clicks', () => {
        beforeEach(async () => {
            chart = await createEnterpriseChart({
                data: Array.from({ length: 11 }, (_, i) => ({ x: i * 100, y: i })),
                axes: {
                    x: { type: 'number', listeners: { click } },
                    y: { type: 'number' },
                },
                zoom: { enabled: true },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });
        });

        // On a continuous axis `value` and `index` deliberately describe different things: `value` is interpolated from
        // the pointer position, `index` is the nearest tick.
        test('value is interpolated and index tracks the nearest tick', async () => {
            await clickAction(57, 560)(chart);
            await clickAction(418, 560)(chart);
            await clickAction(756, 560)(chart);
            await waitForChartStability(chart);

            expect(click.mock.calls).toMatchObject([
                [expect.objectContaining({ value: expect.closeTo(20.86), index: 0 })],
                [expect.objectContaining({ value: expect.closeTo(512.02), index: 3 })],
                [expect.objectContaining({ value: expect.closeTo(971.88), index: 5 })],
            ]);
        });
    });

    describe('discrete axis with labels disabled and ticks enabled', () => {
        beforeEach(async () => {
            chart = await createEnterpriseChart({
                data: [
                    { x: 'A', y: 1 },
                    { x: 'B', y: 2 },
                    { x: 'C', y: 3 },
                ],
                axes: {
                    x: {
                        type: 'category',
                        label: { enabled: false },
                        tick: { enabled: true, size: 30 },
                        listeners: { click },
                    },
                    y: { type: 'number' },
                },
                zoom: { enabled: true },
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            });
        });

        // Clicks land on each band centre, which is also where the tick sits.
        test('click - value/index match', async () => {
            await clickAction(170, 565)(chart); // 'A'
            await clickAction(414, 565)(chart); // 'B'
            await clickAction(658, 565)(chart); // 'C'
            await waitForChartStability(chart);

            expect(click.mock.calls).toMatchObject([
                [expect.objectContaining({ value: 'A', index: 0 })],
                [expect.objectContaining({ value: 'B', index: 1 })],
                [expect.objectContaining({ value: 'C', index: 2 })],
            ]);
        });
    });

    describe('continuous axis with labels disabled and ticks enabled', () => {
        beforeEach(async () => {
            chart = await createEnterpriseChart({
                data: Array.from({ length: 11 }, (_, i) => ({ x: i * 100, y: i })),
                axes: {
                    x: {
                        type: 'number',
                        label: { enabled: false },
                        tick: { enabled: true, size: 30 },
                        listeners: { click },
                    },
                    y: { type: 'number' },
                },
                zoom: { enabled: true },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });
        });

        // Ticks sit every 200 across a 0..1000 domain; each click is nearest an unambiguous one.
        test('value is interpolated and index tracks the nearest tick', async () => {
            await clickAction(200, 565)(chart);
            await clickAction(480, 565)(chart);
            await clickAction(640, 565)(chart);
            await waitForChartStability(chart);

            expect(click.mock.calls).toMatchObject([
                [expect.objectContaining({ value: expect.closeTo(210.88), index: 1 })],
                [expect.objectContaining({ value: expect.closeTo(591.84), index: 3 })],
                [expect.objectContaining({ value: expect.closeTo(809.52), index: 4 })],
            ]);
        });
    });

    describe('suppressed overflow labels', () => {
        beforeEach(async () => {
            chart = await createEnterpriseChart({
                // Zero right padding removes the slack that normally absorbs the overflowing label.
                padding: { right: 0, left: 0 },
                data: Array.from({ length: 11 }, (_, i) => ({ x: i * 100, y: i })),
                axes: {
                    x: { type: 'number', label: { formatter }, listeners: { click } },
                    y: { type: 'number' },
                },
                zoom: { enabled: true },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });
        });

        // The end labels '0' and '1000' hide themselves to avoid overflowing the chart, rendering as
        // empty text. Their ticks, grid lines and label data all still exist, so they keep their place
        // in the numbering: a click at either end reports the hidden label rather than skipping to the
        // nearest visible one.
        test('click - value/index match', async () => {
            await clickAction(800, 560)(chart); // far right, where '1000' hid itself
            await clickAction(25, 560)(chart); // far left, where '0' hid itself
            await waitForChartStability(chart);

            expect(click.mock.calls).toMatchObject([
                [expect.objectContaining({ value: 1000, index: 5 })],
                [expect.objectContaining({ value: 0, index: 0 })],
            ]);
        });

        // Sanity check for the case above: picking must agree with the numbering the label formatter
        // sees, so the formatter is called for the hidden end labels too — indices 0..5, not 1..4.
        // Note: axes[].label.formatter is called twice on start up for some reason.
        test('formatter - value/index match', () => {
            expect(formatter.mock.calls).toMatchObject([
                [expect.objectContaining({ value: 0, index: 0 })],
                [expect.objectContaining({ value: 200, index: 1 })],
                [expect.objectContaining({ value: 400, index: 2 })],
                [expect.objectContaining({ value: 600, index: 3 })],
                [expect.objectContaining({ value: 800, index: 4 })],
                [expect.objectContaining({ value: 1000, index: 5 })],
                [expect.objectContaining({ value: 0, index: 0 })],
                [expect.objectContaining({ value: 200, index: 1 })],
                [expect.objectContaining({ value: 400, index: 2 })],
                [expect.objectContaining({ value: 600, index: 3 })],
                [expect.objectContaining({ value: 800, index: 4 })],
                [expect.objectContaining({ value: 1000, index: 5 })],
            ]);
        });
    });

    describe('axis with labels, ticks and grid lines disabled', () => {
        beforeEach(async () => {
            chart = await createEnterpriseChart({
                data: [
                    { x: 'A', y: 1 },
                    { x: 'B', y: 2 },
                    { x: 'C', y: 3 },
                ],
                axes: {
                    x: {
                        type: 'category',
                        label: { enabled: false },
                        tick: { enabled: false },
                        gridLine: { enabled: false },
                        // A title keeps the axis region non-empty, so it stays clickable.
                        title: { enabled: true, text: 'Category' },
                        listeners: { click },
                    },
                    y: { type: 'number' },
                },
                zoom: { enabled: true },
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            });
        });

        test('index still resolves to the clicked category', async () => {
            await clickAction(194, 545)(chart);
            await clickAction(414, 545)(chart);
            await clickAction(634, 545)(chart);
            await waitForChartStability(chart);

            expect(click.mock.calls).toMatchObject([
                [expect.objectContaining({ value: 'A', index: 0 })],
                [expect.objectContaining({ value: 'B', index: 1 })],
                [expect.objectContaining({ value: 'C', index: 2 })],
            ]);
        });
    });

    describe('category band interior clicks', () => {
        beforeEach(async () => {
            chart = await createEnterpriseChart({
                data: Array.from({ length: 12 }, (_, i) => `Category-Name-${i}`).map((x, i) => ({ x, y: i })),
                axes: {
                    x: { type: 'category', label: { rotation: 0, avoidCollisions: false }, listeners: { click } },
                    y: { type: 'number' },
                },
                zoom: { enabled: true },
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            });
        });

        // Band 5 spans canvas 360..403. Both clicks are inside it, so both must report the same
        // category; today only the one nearer the band's start does.
        test('every point inside a band reports that band', async () => {
            await clickAction(378, 560)(chart); // comfortably inside band 5
            await clickAction(398, 560)(chart); // still inside band 5, 5px from its right edge
            await waitForChartStability(chart);

            expect(click.mock.calls).toMatchObject([
                [expect.objectContaining({ value: 'Category-Name-5', index: 5 })],
                [expect.objectContaining({ value: 'Category-Name-5', index: 5 })],
            ]);
        });
    });

    // In this example, the X-origin label is a long text "0.000000000", which adds a lot of mouse-interaction padding
    // to the left of the x-axis origin. This test is there to ensure that this padding does not interfere with the
    // computation of the axis click `value`.
    describe('continuous band interior clicks', () => {
        let Xs: [number, number, number, number];

        function measureXGridLines(): [number, number, number, number] | undefined {
            const elem = document.querySelector('.ag-charts-series-area');
            if (elem instanceof HTMLElement) {
                const left = Number.parseInt(elem.style.height);
                const width = Number.parseInt(elem.style.widows);
                if (!Number.isNaN(left) && !Number.isNaN(width)) {
                    const step = width / 3;
                    return [left, left + step, left + step * 2, left + width];
                }
            }
            return undefined;
        }

        beforeEach(async () => {
            chart = await createEnterpriseChart({
                data: Array.from({ length: 4 }, (_, i) => ({ x: i / 5, y: i * 2 })),
                axes: {
                    x: {
                        type: 'number',
                        label: { rotation: 0, avoidCollisions: false, format: '#{0.9f}' },
                        listeners: { click },
                    },
                    y: { type: 'number' },
                },
                zoom: { enabled: true },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });

            Xs = measureXGridLines()!;
            expect(Xs).toBeDefined();
        });

        test('axis click values in the center of X-labels is close to data X-values', async () => {
            await clickAction(Xs[0], 572)(chart);
            await clickAction(Xs[1], 572)(chart);
            await clickAction(Xs[2], 571)(chart);
            await clickAction(Xs[3], 572)(chart);
            await waitForChartStability(chart);

            expect(click.mock.calls).toMatchObject([
                [expect.objectContaining({ value: expect.closeTo(0), index: 0 })],
                [expect.objectContaining({ value: expect.closeTo(0.2), index: 1 })],
                [expect.objectContaining({ value: expect.closeTo(0.4), index: 2 })],
                [expect.objectContaining({ value: expect.closeTo(0.6), index: 3 })],
            ]);
        });
    });
});
