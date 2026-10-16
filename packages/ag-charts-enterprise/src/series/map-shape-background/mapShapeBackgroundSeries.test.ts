import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';
import { afterEach, describe, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';
import ukTopology from '../map-test/ukTopology.json';

const SIMPLIFIED_EXAMPLE: AgChartOptions = {
    topology: ukTopology,
    series: [
        {
            type: 'map-shape-background',
        },
    ],
};

describe('MapShapeBackgroundSeries', () => {
    setupMockConsole();
    let chart: AgChartInstance;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async (options?: MatchImageSnapshotOptions) => {
        await compareImageSnapshot(chart, ctx, { ...IMAGE_SNAPSHOT_DEFAULTS, ...options });
    };

    describe('Simple Chart', () => {
        it('should render a simple chart', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            chart = await createEnterpriseChart(options);
            await compare();
        });

        it('should ignore hover picks, having no tooltip option', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };

            chart = await createEnterpriseChart(options);
            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);
        });
    });

    describe('gradient fill', () => {
        it('should render map shape background series with a default gradient fill', async () => {
            const options: AgChartOptions = {
                topology: ukTopology,
                series: [
                    {
                        type: 'map-shape-background',
                        fill: {
                            type: 'gradient',
                        },
                    },
                ],
            };

            chart = await createEnterpriseChart(options);
            await compare({
                failureThreshold: 1,
            });
        });

        it('should render map shape background series with a gradient fill', async () => {
            const options: AgChartOptions = {
                topology: ukTopology,
                series: [
                    {
                        type: 'map-shape-background',
                        fill: {
                            type: 'gradient',
                            colorStops: [
                                {
                                    color: 'green',
                                },
                                {
                                    color: 'white',
                                },
                            ],
                        },
                    },
                ],
            };

            chart = await createEnterpriseChart(options);
            await compare({
                failureThreshold: 1,
            });
        });
    });
});
