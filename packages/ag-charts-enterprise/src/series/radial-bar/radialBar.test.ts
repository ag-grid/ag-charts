import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';

import type { AgChartOptions } from '../../main';
import { AgCharts } from '../../main';
import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('RadialBarSeries', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();
    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const EXAMPLE_OPTIONS: AgChartOptions = {
        title: {
            text: `Night & Gale Inc revenue by product category`,
        },
        subtitle: {
            text: 'in million U.S. dollars',
        },
        data: [
            { quarter: `Q1'22`, 'Mountain air': 4.35, 'Polar winds': 2.14, 'Donut holes': 3.91 },
            { quarter: `Q2'22`, 'Mountain air': 4.28, 'Polar winds': 3.13, 'Donut holes': 3.04 },
            { quarter: `Q3'22`, 'Mountain air': 4.14, 'Polar winds': 3.34, 'Donut holes': 3.18 },
            { quarter: `Q4'22`, 'Mountain air': 3.48, 'Polar winds': 3.56, 'Donut holes': 3.61 },
            { quarter: `Q1'23`, 'Mountain air': 3.35, 'Polar winds': 3.14, 'Donut holes': 3.91 },
            { quarter: `Q2'23`, 'Mountain air': 3.28, 'Polar winds': 3.13, 'Donut holes': 3.54 },
            { quarter: `Q3'23`, 'Mountain air': 3.14, 'Polar winds': 2.84, 'Donut holes': 3.18 },
            { quarter: `Q4'23`, 'Mountain air': 2.48, 'Polar winds': 2.46, 'Donut holes': 3.21 },
        ],
        series: [
            {
                type: 'radial-bar',
                angleKey: 'Mountain air',
                radiusKey: 'quarter',
            },
            {
                type: 'radial-bar',
                angleKey: 'Polar winds',
                radiusKey: 'quarter',
            },
            {
                type: 'radial-bar',
                angleKey: 'Donut holes',
                radiusKey: 'quarter',
            },
        ],
    };

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    it(`should render radial bar chart as expected`, async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render radial bar chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: [
                {
                    type: 'angle-number',
                    reverse: true,
                },
                {
                    type: 'radius-category',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render stacked radial bar as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                };
            }),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render stacked radial bar as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                };
            }),
            axes: [
                {
                    type: 'angle-number',
                    reverse: true,
                },
                {
                    type: 'radius-category',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render normalized radial bar as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                    normalizedTo: 100,
                };
            }),
            axes: [{ type: 'angle-number', nice: false }, { type: 'radius-category' }],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render normalized radial bar as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                    normalizedTo: 100,
                };
            }),
            axes: [
                { type: 'angle-number', nice: false, reverse: true },
                { type: 'radius-category', reverse: true },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for EXAMPLE_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('remove animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for EXAMPLE_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                AgCharts.updateDelta(chart, {
                    data: options.data!.slice(0, 4),
                });
                animate(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('add animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for EXAMPLE_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const { data: fullData } = EXAMPLE_OPTIONS;
                const options: AgChartOptions = { ...EXAMPLE_OPTIONS, data: fullData.slice(0, 4) };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                AgCharts.updateDelta(chart, {
                    data: fullData,
                });
                animate(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('update animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for EXAMPLE_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                AgCharts.updateDelta(chart, {
                    data: options.data!.map((d: any) => {
                        return Object.entries(d).reduce((obj, [key, value], i) => {
                            return Object.assign(obj, { [key]: typeof value === 'number' ? value * i : value });
                        }, {});
                    }),
                });
                animate(1200, ratio);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });
});
