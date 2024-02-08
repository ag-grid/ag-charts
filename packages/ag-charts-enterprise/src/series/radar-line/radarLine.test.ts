import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('RadarLineSeries', () => {
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
        data: [
            { subject: 'Maths', gradeA: 7.0, gradeB: 4.2 },
            { subject: 'Physics', gradeA: 4.3, gradeB: 8.5 },
            { subject: 'Biology', gradeA: 3.0, gradeB: 3.0 },
            { subject: 'History', gradeA: 6.5, gradeB: 4.3 },
            { subject: 'P.E.', gradeA: 9.8, gradeB: 6.4 },
        ],
        series: [
            {
                type: 'radar-line',
                angleKey: 'subject',
                radiusKey: 'gradeA',
            },
            {
                type: 'radar-line',
                angleKey: 'subject',
                radiusKey: 'gradeB',
            },
        ],
        legend: {
            enabled: true,
        },
    };

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot();
    };

    it(`should render polar chart as expected`, async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart with circle axes as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: [
                { type: 'angle-category', shape: 'circle' },
                { type: 'radius-number', shape: 'circle' },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart as expected with reversed circle axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: [
                {
                    type: 'angle-category',
                    shape: 'circle',
                    reverse: true,
                },
                {
                    type: 'radius-number',
                    shape: 'circle',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart as expected with reversed polygon axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: [
                {
                    type: 'angle-category',
                    shape: 'polygon',
                    reverse: true,
                },
                {
                    type: 'radius-number',
                    shape: 'polygon',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should avoid polar chart label collisions`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: Array.from({ length: 95 }).map((_, i) => ({
                subject: `Subject ${i}`,
                gradeA: 2 * ((i % 5) + 1),
                gradeB: 2 * (((i + 3) % 5) + 1),
            })),
            axes: [
                { type: 'angle-category', label: { avoidCollisions: true, minSpacing: 2 } },
                { type: 'radius-number' },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart with invalid data disconnected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: [
                { subject: 'Maths', gradeA: 7.0, gradeB: 4.2 },
                { subject: 'Physics', gradeA: undefined, gradeB: 8.5 },
                { subject: 'Biology', gradeA: 3.0, gradeB: 3.0 },
                { subject: 'History', gradeA: 6.5, gradeB: 4.3 },
                { subject: 'P.E.', gradeA: 9.8, gradeB: 6.4 },
            ],
            series: EXAMPLE_OPTIONS.series!.map((series) => ({
                ...series,
                connectMissingData: false,
            })),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart with invalid data connected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: [
                { subject: 'Maths', gradeA: 7.0, gradeB: 4.2 },
                { subject: 'Physics', gradeA: undefined, gradeB: 8.5 },
                { subject: 'Biology', gradeA: 3.0, gradeB: 3.0 },
                { subject: 'History', gradeA: 6.5, gradeB: 4.3 },
                { subject: 'P.E.', gradeA: 9.8, gradeB: 6.4 },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should support legend.item.showSeriesStroke`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            legend: { item: { showSeriesStroke: true } },
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
});
