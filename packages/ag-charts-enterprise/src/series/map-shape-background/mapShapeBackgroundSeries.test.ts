import { afterEach, describe, expect, it } from '@jest/globals';
import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';
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
    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async (options?: MatchImageSnapshotOptions) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, ...options });
    };

    describe('Simple Chart', () => {
        it('should render a simple chart', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
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

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
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

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare({
                failureThreshold: 1,
            });
        });
    });
});
