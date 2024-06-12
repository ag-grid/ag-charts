import { afterEach, describe, expect, jest, test } from '@jest/globals';

import type { AgPolarChartOptions } from 'ag-charts-types';

import type { Chart } from '../../chart';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    createChart,
    expectWarningsCalls,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

describe('PieSeries', () => {
    setupMockConsole();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    let chart: Chart;
    const ctx = setupMockCanvas();
    const options: AgPolarChartOptions = prepareTestOptions({});

    describe('#create', () => {
        test('zerosum pie', async () => {
            chart = await createChart({
                ...options,
                data: [{ value: 0 }, { value: 0 }],
                series: [{ type: 'pie', angleKey: 'value' }],
            });
            await compare();
        });
    });

    describe('#validation', () => {
        test('missing data warning', async () => {
            chart = await createChart({
                ...options,
                data: [{ cat: '1' }, { cat: '2' }, { fox: 'L' }, { cat: '4', dog: 10 }, { cat: '5', dog: 20 }],
                series: [{ type: 'pie', calloutLabelKey: 'cat', angleKey: 'dog', sectorLabelKey: 'fox' }],
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - no value was found for the key 'dog' on 3 data elements",
  ],
  [
    "AG Charts - no value was found for the key 'cat' on 1 data element",
  ],
  [
    "AG Charts - no value was found for the key 'fox' on 4 data elements",
  ],
]
`);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
