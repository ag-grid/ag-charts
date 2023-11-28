import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { AgChartOptions } from '../../../options/agChartOptions';
import { AgCharts } from '../../agChartV2';
import type { Chart } from '../../chart';
import {
    DATA_FRACTIONAL_LOG_AXIS,
    DATA_INVALID_DOMAIN_LOG_AXIS,
    DATA_NEGATIVE_LOG_AXIS,
    DATA_POSITIVE_LOG_AXIS,
    DATA_ZERO_EXTENT_LOG_AXIS,
} from '../../test/data';
import * as examples from '../../test/examples';
import type { TestCase } from '../../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    extractImageData,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';

expect.extend({ toMatchImageSnapshot });

describe('Doughnut', () => {
    let chart: Chart;

    beforeEach(() => {
        // eslint-disable-next-line no-console
        console.warn = jest.fn();
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        // eslint-disable-next-line no-console
        expect(console.warn).not.toBeCalled();
        jest.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const options: AgPolarChartOptions = {};
    prepareTestOptions(options);

    test('multiple', async () => {
        chart = AgCharts.create( {
            ...options,
            series: [
                {
                    data: [
                        { City: 'Berlin', value: 150, index: 0 },
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
