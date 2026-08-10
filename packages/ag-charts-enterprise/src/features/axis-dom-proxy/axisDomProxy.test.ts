import { vi } from 'vitest';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { Chart, clickAction, setupMockCanvas, waitForChartStability } from 'ag-charts-community-test';
import { setupMockConsole } from 'ag-charts-test';

import { createEnterpriseChart } from '../../test/utils';

describe('AxisDOMProxy', () => {
    setupMockCanvas();
    setupMockConsole();

    describe('grouped-category clicks', () => {
        const formatter = vi.fn();
        const click = vi.fn();
        let chart: Chart;

        beforeEach(async () => {
            const opts: AgCartesianChartOptions = {
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
            };
            chart = await createEnterpriseChart(opts);
        });

        afterEach(() => {
            chart?.destroy();
        });

        // Check that label formatter's indices match the DFS ordering of the x-grouping.
        // Note: axes[].label.formatter is called twice on start up for some reason.
        test('formatter - value/index match', async () => {
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
});
