import { expectWarningsCalls } from '_ag-charts-test';
import { describe, it, vi } from 'vitest';

import { type AgChartInstance, AgCharts } from 'ag-charts-community';
import {
    compareImageSnapshot,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('PieSeries', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();
    const animate = spyOnAnimationManager();
    let chart: AgChartInstance;

    const compareSnapshot = async () => {
        await compareImageSnapshot(chart, ctx);
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
    "AG Charts - legend item 'a' has multiple fill colours, this may cause unexpected behaviour.",
  ],
  [
    "AG Charts - legend item 'b' has multiple fill colours, this may cause unexpected behaviour.",
  ],
  [
    "AG Charts - legend item 'c' has multiple fill colours, this may cause unexpected behaviour.",
  ],
]
`);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });
});
