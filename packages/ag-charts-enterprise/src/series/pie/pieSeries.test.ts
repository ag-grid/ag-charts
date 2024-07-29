import { describe, expect, it } from '@jest/globals';

import { type AgChartInstance, AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';
import { expectWarningsCalls } from 'ag-charts-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('PieSeries', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();
    const animate = spyOnAnimationManager();
    let chart: AgChartInstance;

    const compareSnapshot = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    afterEach(() => {
        chart?.destroy();
        (chart as any) = undefined;
    });

    // AG-12391 - Test for switching data with overlapping non-unique keys rendering incorrectly.
    describe('switching data', () => {
        it('should switch between datasets with overlapping keys', async () => {
            animate(1200, 1);

            const data = [
                { id: 'a', value: 4 },
                { id: 'b', value: 6 },
                { id: 'c', value: 5 },
            ];
            const options = prepareEnterpriseTestOptions({
                // animation: { enabled: true },
                data,
                series: [{ type: 'pie' as const, angleKey: 'value', calloutLabelKey: 'id' }],
            });

            chart = AgCharts.create(options);
            await compareSnapshot();

            await chart.updateDelta({
                data: [...data, ...data],
            });
            await compareSnapshot();

            await chart.updateDelta({
                data: [...data],
            });
            await compareSnapshot();

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - legend item 'a' has multiple fill colors, this may cause unexpected behaviour.",
  ],
  [
    "AG Charts - legend item 'b' has multiple fill colors, this may cause unexpected behaviour.",
  ],
  [
    "AG Charts - legend item 'c' has multiple fill colors, this may cause unexpected behaviour.",
  ],
]
`);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
