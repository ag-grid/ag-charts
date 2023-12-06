import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { AgPolarChartOptions } from '../../../options/agChartOptions';
import { AgCharts } from '../../agChartV2';
import type { Chart } from '../../chart';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    waitForChartStability,
} from '../../test/utils';

expect.extend({ toMatchImageSnapshot });

describe('Doughnut', () => {
    let chart: Chart;

    /* eslint-disable no-console */
    beforeEach(() => {
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        expect(console.warn).not.toBeCalled();
        expect(console.error).not.toBeCalled();
        jest.restoreAllMocks();
    });
    /* eslint-enable no-console */

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const options: AgPolarChartOptions = {};
    prepareTestOptions(options);

    test('multiple', async () => {
        chart = AgCharts.create({
            ...options,
            series: [
                {
                    data: [
                        { city: 'Berlin', value: 150, index: 0 },
                        { city: 'Munich', value: 100, index: 1 },
                        { city: 'Hamburg', value: 180, index: 2 },
                        { city: 'London', value: 120, index: 3 },
                        { city: 'Manchester', value: 90, index: 4 },
                        { city: 'Birmingham', value: 160, index: 5 },
                        { city: 'Rome', value: 130, index: 6 },
                        { city: 'Milan', value: 80, index: 7 },
                        { city: 'Venice', value: 110, index: 8 },
                        { city: 'Singapore City', value: 110, index: 9 },
                        { city: 'Jurong', value: 120, index: 10 },
                        { city: 'Woodlands', value: 100, index: 11 },
                        { city: 'Delhi', value: 90, index: 12 },
                        { city: 'Mumbai', value: 70, index: 13 },
                        { city: 'Bangalore', value: 130, index: 14 },
                        { city: 'Tokyo', value: 120, index: 15 },
                        { city: 'Osaka', value: 100, index: 16 },
                        { city: 'Kyoto', value: 110, index: 17 },
                    ],
                    type: 'pie',
                    angleKey: 'value',
                    sectorLabelKey: 'city',
                    outerRadiusRatio: 0.8,
                    innerRadiusRatio: 0.6,
                },
                {
                    data: [
                        { country: 'Germany', value: 430, index: 0 },
                        { country: 'England', value: 370, index: 1 },
                        { country: 'Italy', value: 320, index: 2 },
                        { country: 'Singapore', value: 330, index: 3 },
                        { country: 'India', value: 290, index: 4 },
                        { country: 'Japan', value: 330, index: 5 },
                    ],
                    type: 'pie',
                    angleKey: 'value',
                    sectorLabelKey: 'country',
                    outerRadiusRatio: 0.6,
                    innerRadiusRatio: 0.4,
                },
                {
                    data: [
                        { continent: 'Europe', value: 1120 },
                        { continent: 'Asia', value: 950 },
                    ],
                    type: 'pie',
                    angleKey: 'value',
                    sectorLabelKey: 'continent',
                    outerRadiusRatio: 0.2,
                    innerRadiusRatio: 0.4,
                },
            ],
        }) as Chart;
        await compare();
    });
});

/* eslint-disable no-console */
describe('Validation', () => {
    let chart: Chart;

    beforeEach(() => {
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        expect(console.error).not.toBeCalled();
        jest.restoreAllMocks();
    });

    setupMockCanvas();

    const options: AgPolarChartOptions = {};
    prepareTestOptions(options);

    test('missing data warning', async () => {
        chart = AgCharts.create({
            ...options,
            data: [{ cat: '1' }, { cat: '2' }, { fox: 'L' }, { cat: '4', dog: 10 }, { cat: '5', dog: 20 }],
            series: [{ type: 'pie', calloutLabelKey: 'cat', angleKey: 'dog', sectorLabelKey: 'fox' }],
        }) as Chart;
        await waitForChartStability(chart);

        expect(console.warn).toBeCalledTimes(3);
        expect(console.warn).nthCalledWith(1, 'AG Charts - Missing 3 dog value(s)');
        expect(console.warn).nthCalledWith(2, 'AG Charts - Missing 1 cat value(s)');
        expect(console.warn).nthCalledWith(3, 'AG Charts - Missing 4 fox value(s)');
    });
});
/* eslint-enable no-console */
