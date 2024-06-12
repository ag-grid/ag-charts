import { afterEach, describe, expect, test } from '@jest/globals';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

describe('LineUtil', () => {
    setupMockConsole();

    afterEach(() => {
        if (chart) chart.destroy();
    });

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    const click = async (point: { x: number; y: number }) => {
        await clickAction(point.x, point.y)(chart);
        await waitForChartStability(chart);
    };

    let chart: AgChartInstance;
    const ctx = setupMockCanvas();

    describe('AG-10152', () => {
        test('markers stay visible', async () => {
            const opts: AgChartOptions = {
                ...prepareTestOptions({}),
                data: [
                    { quarter: 'Q1', petrol: 200, diesel: 100, electric: 50 },
                    { quarter: 'Q2', petrol: 300, diesel: 130, electric: 70 },
                    { quarter: 'Q3', petrol: 350, diesel: 160, electric: 86 },
                    { quarter: 'Q4', petrol: 400, diesel: 200, electric: 90 },
                ],
                series: [
                    { type: 'bar', xKey: 'quarter', yKey: 'petrol', yName: 'Petrol' },
                    { type: 'area', xKey: 'quarter', yKey: 'diesel', marker: { enabled: true } },
                    { type: 'line', xKey: 'quarter', yKey: 'electric' },
                ],
            };
            chart = AgCharts.create(opts);
            await compare();

            await click({ x: 330, y: 575 });
            await compare();
        });
    });
});
