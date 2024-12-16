import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgCartesianChartOptions, AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import { SIMPLE_SCATTER_CHART_EXAMPLE } from './test/examples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

const EXAMPLES = {
    SIMPLE_SCATTER: SIMPLE_SCATTER_CHART_EXAMPLE,
};

describe('devicePixelRatio', () => {
    setupMockConsole();

    let chart: AgChartInstance;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe.each(Object.entries(EXAMPLES))(
        'for %s it should create chart instance as expected',
        (_exampleName, exampleOptions) => {
            it.each([0.75, 0.9, 1, 1.25, 1.33, 1.4, 1.75, 2, 2.25, 2.5, 2.6, 3, 3.5, 4])(
                'using devicePixelRatio %s',
                async (overrideDevicePixelRatio) => {
                    const axisOptions = {
                        line: { enabled: true },
                        gridLine: {
                            style: [
                                { stroke: 'gray', lineDash: [10, 5] },
                                { stroke: 'lightgray', lineDash: [5, 5] },
                            ],
                        },
                    };
                    const [xAxis, yAxis] = (exampleOptions as unknown as AgCartesianChartOptions).axes!;
                    const options: AgChartOptions = {
                        ...exampleOptions,
                        axes: [
                            { ...xAxis, ...axisOptions },
                            { ...yAxis, ...axisOptions },
                        ],
                        // @ts-expect-error use of undocumented overrideDevicePixelRatio
                        overrideDevicePixelRatio,
                    };

                    prepareTestOptions(options);
                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    expect(extractImageData(ctx)).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                }
            );
        }
    );
});
