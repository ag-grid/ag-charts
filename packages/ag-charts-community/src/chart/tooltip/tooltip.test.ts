import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import { AgCharts } from '../agChartV2';
import type { Chart } from '../chart';
import { prepareTestOptions, waitForChartStability } from '../test/utils';

expect.extend({ toMatchImageSnapshot });

/* eslint-disable no-console */
describe('TooltipValidation', () => {
    beforeEach(() => {
        console.warn = jest.fn();
    });

    const opts = prepareTestOptions({});

    it('should show 1 warning for invalid tooltip value', async () => {
        const chart = AgCharts.create({
            ...opts,
            data: [
                { month: 'Jun', sweaters: 50 },
                { month: 'Jul', sweaters: 70 },
                { month: 'Aug', sweaters: 60 },
            ],
            series: [{ type: 'line', xKey: 'month', yKey: 'sweaters', yName: 'Sweaters Made' }],
            tooltip: {
                position: '2' as any,
            },
        }) as Chart;
        await waitForChartStability(chart);

        expect(console.warn).toBeCalledTimes(1);
        expect(console.warn).toBeCalledWith(
            `AG Charts - unable to set [tooltip.position] in Tooltip - can't apply type of [primitive], allowed types are: [class-instance]`
        );
    });
});
/* eslint-enable no-console */
