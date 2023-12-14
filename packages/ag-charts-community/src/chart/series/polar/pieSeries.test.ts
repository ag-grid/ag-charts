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

describe('PieSeries', () => {
    beforeEach(() => {
        /* eslint-disable no-console */
        console.warn = jest.fn();
        console.error = jest.fn();
        /* eslint-enable no-console */
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }

        // eslint-disable-next-line no-console
        expect(console.error).not.toBeCalled();
    });

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    const expectWarnings = (warnings: string[]) => {
        /* eslint-disable no-console */
        expect(console.warn).toBeCalledTimes(warnings.length);
        for (let i = 0; i < warnings.length; i++) {
            expect(console.warn).nthCalledWith(i + 1, warnings[i]);
        }
        /* eslint-enable no-console */
    };

    let chart: Chart;
    const ctx = setupMockCanvas();
    const options: AgPolarChartOptions = prepareTestOptions({});

    describe('#create', () => {
        afterEach(() => {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toBeCalled();
        });

        test('multiple doughnuts', async () => {
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

    describe('#validation', () => {
        test('missing data warning', async () => {
            chart = AgCharts.create({
                ...options,
                data: [{ cat: '1' }, { cat: '2' }, { fox: 'L' }, { cat: '4', dog: 10 }, { cat: '5', dog: 20 }],
                series: [{ type: 'pie', calloutLabelKey: 'cat', angleKey: 'dog', sectorLabelKey: 'fox' }],
            }) as Chart;
            await waitForChartStability(chart);

            expectWarnings([
                `AG Charts - no value was found for the key 'dog' on 3 data elements`,
                `AG Charts - no value was found for the key 'cat' on 1 data element`,
                `AG Charts - no value was found for the key 'fox' on 4 data elements`,
            ]);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
