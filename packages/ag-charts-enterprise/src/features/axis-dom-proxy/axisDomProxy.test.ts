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

    describe('suppressed overflow labels', () => {
        beforeEach(async () => {
            chart = await createEnterpriseChart({
                // Zero right padding removes the slack that normally absorbs the overflowing label.
                padding: { right: 0, left: 0 },
                data: Array.from({ length: 11 }, (_, i) => ({ x: i * 100, y: i })),
                axes: {
                    x: { type: 'number', listeners: { click } },
                    y: { type: 'number' },
                },
                zoom: { enabled: true },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });
        });

        // Labels 0 and 1000 render as empty text, leaving 200/400/600/800 (indices 1..4) visible.
        test('clicking an end reports a visible label, not a suppressed one', async () => {
            await clickAction(800, 560)(chart); // far right, where '1000' was suppressed
            await clickAction(25, 560)(chart); // far left, where '0' was suppressed
            await waitForChartStability(chart);

            expect(click.mock.calls).toMatchObject([
                [expect.objectContaining({ index: 4 })], // nearest visible label is '800'
                [expect.objectContaining({ index: 1 })], // nearest visible label is '200'
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

    describe('band interior clicks', () => {
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
});
