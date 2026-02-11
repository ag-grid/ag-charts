import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgBaseChartThemeOptions, AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import { axisLabelsOverlap } from './generateTicksUtils';

const NUMERIC_DATA = [
    { x: -10, y: -8 },
    { x: -5, y: -3 },
    { x: 0, y: 0 },
    { x: 5, y: 4 },
    { x: 10, y: 9 },
];

const CATEGORY_DATA = [
    { category: 'A', value: -4 },
    { category: 'B', value: 2 },
    { category: 'C', value: 5 },
];

const LOG_DATA = [
    { x2: -1, y2: 10 },
    { x2: 2, y2: 100 },
    { x2: 3, y2: 1000 },
    { x2: 4, y2: 2500 },
    { x2: 5, y2: 5000 },
];

const TIME_DATA = [
    { date: new Date('2024-01-01T00:00:00Z'), value: -4 },
    { date: new Date('2024-01-02T00:00:00Z'), value: 1 },
    { date: new Date('2024-01-03T00:00:00Z'), value: 4 },
    { date: new Date('2024-01-04T00:00:00Z'), value: 6 },
];

const GROUPED_CATEGORY_DATA = [
    {
        location: ['Europe', 'United Kingdom', 'London'],
        gold: 27,
        silver: 23,
        bronze: 17,
    },
    {
        location: ['Europe', 'United Kingdom', 'Manchester'],
        gold: 12,
        silver: 8,
        bronze: 10,
    },
    {
        location: ['Europe', 'Germany', 'Berlin'],
        gold: 17,
        silver: 10,
        bronze: 15,
    },
    {
        location: ['Asia', 'China', 'Beijing'],
        gold: 38,
        silver: 32,
        bronze: 18,
    },
    {
        location: ['Asia', 'China', 'Shanghai'],
        gold: 20,
        silver: 15,
        bronze: 12,
    },
    { location: ['Asia', 'Japan', 'Tokyo'], gold: 27, silver: 14, bronze: 17 },
    {
        location: ['North America', 'United States', 'Los Angeles'],
        gold: 46,
        silver: 37,
        bronze: 38,
    },
    {
        location: ['North America', 'United States', 'New York'],
        gold: 30,
        silver: 28,
        bronze: 25,
    },
    {
        location: ['North America', 'Canada', 'Toronto'],
        gold: 8,
        silver: 6,
        bronze: 10,
    },
    {
        location: ['South America', 'Brazil', 'Rio de Janeiro'],
        gold: 7,
        silver: 6,
        bronze: 6,
    },
    {
        location: ['Africa', 'South Africa', 'Cape Town'],
        gold: 4,
        silver: 4,
        bronze: 6,
    },
    {
        location: ['Oceania', 'Australia', 'Sydney'],
        gold: 17,
        silver: 7,
        bronze: 22,
    },
    {
        location: ['Oceania', 'New Zealand', 'Auckland'],
        gold: 10,
        silver: 5,
        bronze: 8,
    },
];

const ROTATED_CATEGORY_DATA = [
    { category: 'International Freight', value: 12 },
    { category: 'Long Distance Transport', value: 9 },
    { category: 'Domestic Distribution', value: 6 },
    { category: 'Customs Clearance', value: 4 },
];

type OptionsFactory = () => AgCartesianChartOptions;

type Scenario = {
    name: string;
    optionsFactory: OptionsFactory;
};

const THEME: AgBaseChartThemeOptions<AgCartesianChartOptions> = {
    overrides: {
        common: {
            axes: {
                number: { line: { enabled: true, stroke: 'black' } },
                category: { line: { enabled: true, stroke: 'black' } },
                log: { line: { enabled: true, stroke: 'black' } },
                'unit-time': { line: { enabled: true, stroke: 'black' } },
            },
        },
    },
};

const validScenarios: Scenario[] = [
    {
        name: 'bottom-number-cross-at-zero',
        optionsFactory: () => ({
            data: NUMERIC_DATA,
            theme: THEME,
            axes: {
                x: { type: 'number', position: 'bottom', crossAt: { value: 0 } },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                },
            ],
        }),
    },
    {
        name: 'left-number-cross-at-zero',
        optionsFactory: () => ({
            data: NUMERIC_DATA,
            theme: THEME,
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: { type: 'number', position: 'left', crossAt: { value: 0 } },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                },
            ],
        }),
    },
    {
        name: 'left-number-cross-at-near-boundary',
        optionsFactory: () => ({
            data: NUMERIC_DATA,
            theme: THEME,
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: {
                    type: 'number',
                    position: 'left',
                    crossAt: { value: -9.5 },
                    tick: { size: 20, stroke: 'black' },
                },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                },
            ],
        }),
    },
    {
        name: 'bottom-number-cross-at-near-boundary',
        optionsFactory: () => ({
            data: NUMERIC_DATA,
            theme: THEME,
            axes: {
                x: {
                    type: 'number',
                    position: 'bottom',
                    crossAt: { value: -9.5 },
                    tick: { size: 20, stroke: 'black' },
                },
                y: {
                    type: 'number',
                    position: 'left',
                },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                },
            ],
        }),
    },
    {
        name: 'top-number-cross-at-near-boundary',
        optionsFactory: () => ({
            data: NUMERIC_DATA,
            theme: THEME,
            axes: {
                x: { type: 'number', position: 'top', crossAt: { value: 10 }, tick: { size: 20, stroke: 'black' } },
                y: {
                    type: 'number',
                    position: 'left',
                },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                },
            ],
        }),
    },
    {
        name: 'right-number-cross-at-near-boundary',
        optionsFactory: () => ({
            data: NUMERIC_DATA,
            theme: THEME,
            axes: {
                x: { type: 'number', position: 'top' },
                y: {
                    type: 'number',
                    position: 'right',
                    crossAt: { value: 9.5 },
                    tick: { size: 20, stroke: 'black' },
                },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                },
            ],
        }),
    },
    {
        name: 'right-log-cross-at-zero',
        optionsFactory: () => ({
            theme: THEME,
            data: LOG_DATA,
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: { type: 'log', position: 'right', crossAt: { value: 0 } },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x2',
                    yKey: 'y2',
                },
            ],
        }),
    },
    {
        name: 'bottom-number-cross-at-log-100',
        optionsFactory: () => ({
            theme: THEME,
            data: LOG_DATA,
            axes: {
                x: { type: 'number', position: 'bottom', crossAt: { value: 100 } },
                y: { type: 'log', position: 'right' },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x2',
                    yKey: 'y2',
                },
            ],
        }),
    },
    {
        name: 'top-unit-time-cross-at-two',
        optionsFactory: () => ({
            data: TIME_DATA,
            theme: THEME,
            axes: {
                x: { type: 'unit-time', position: 'top', crossAt: { value: 2 } },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'date',
                    yKey: 'value',
                },
            ],
        }),
    },
    {
        name: 'left-number-cross-at-unit-time',
        optionsFactory: () => ({
            data: TIME_DATA,
            theme: THEME,
            axes: {
                x: { type: 'unit-time', position: 'top' },
                y: { type: 'number', position: 'left', crossAt: { value: new Date('2024-01-03T00:00:00Z') } },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'date',
                    yKey: 'value',
                },
            ],
        }),
    },
    {
        name: 'bottom-category-cross-at-zero',
        optionsFactory: () => ({
            data: CATEGORY_DATA,
            theme: THEME,
            axes: {
                x: { type: 'category', position: 'bottom', crossAt: { value: 0 } },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'bar',
                    xKey: 'category',
                    yKey: 'value',
                },
            ],
            legend: { enabled: false },
        }),
    },
    {
        name: 'left-number-cross-at-category',
        optionsFactory: () => ({
            data: CATEGORY_DATA,
            theme: THEME,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left', crossAt: { value: 'B' } },
            },
            series: [
                {
                    type: 'bar',
                    xKey: 'category',
                    yKey: 'value',
                },
            ],
        }),
    },
    {
        name: 'grouped-category-cross-at-array-value',
        optionsFactory: () => ({
            data: GROUPED_CATEGORY_DATA,
            theme: THEME,
            axes: {
                x: {
                    type: 'grouped-category',
                    position: 'bottom',
                    depthOptions: [{}, { label: { fontWeight: 'bold' } }, { label: { fontSize: 10 } }],
                    crossAt: { value: 40 },
                },
                y: {
                    type: 'number',
                    position: 'left',
                    crossAt: { value: ['North America', 'United States', 'New York'] },
                },
            },
            series: [
                {
                    type: 'bar',
                    xKey: 'location',
                    xName: 'Location',
                    yKey: 'gold',
                    yName: 'Gold',
                },
            ],
        }),
    },
];

const outOfDomainScenarios: Scenario[] = [
    {
        name: 'bottom-number-cross-at-outside-domain',
        optionsFactory: () => ({
            data: NUMERIC_DATA,
            theme: THEME,
            axes: {
                x: { type: 'number', position: 'bottom', crossAt: { value: 999 } },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                },
            ],
        }),
    },
];

const invalidValueScenarios: Scenario[] = [
    {
        name: 'bottom-number-cross-at-invalid-value',
        optionsFactory: () => ({
            data: NUMERIC_DATA,
            theme: THEME,
            axes: {
                x: { type: 'number', position: 'bottom', crossAt: { value: 'invalid' } },
                y: { type: 'number', position: 'left' },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                },
            ],
        }),
    },
    {
        name: 'left-number-cross-at-missing-category',
        optionsFactory: () => ({
            data: CATEGORY_DATA,
            theme: THEME,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left', crossAt: { value: 'Z' } },
            },
            series: [
                {
                    type: 'bar',
                    xKey: 'category',
                    yKey: 'value',
                },
            ],
        }),
    },
];

describe('CartesianAxis', () => {
    setupMockConsole();
    const compare = async (snapshotId: string) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({
            ...IMAGE_SNAPSHOT_DEFAULTS,
            customSnapshotIdentifier: snapshotId,
        });
    };

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const renderAndSnapshot = async (factory: OptionsFactory, snapshotId: string) => {
        const options = factory();
        prepareTestOptions(options);

        chart = AgCharts.create(options);
        await compare(snapshotId);
    };

    describe('crossAt', () => {
        describe('valid values', () => {
            it.each(validScenarios)('%s', async ({ name, optionsFactory }) => {
                await renderAndSnapshot(optionsFactory, `cartesian-axis-${name}`);
            });
        });

        describe('out-of-domain values', () => {
            it.each(outOfDomainScenarios)('%s', async ({ name, optionsFactory }) => {
                await renderAndSnapshot(optionsFactory, `cartesian-axis-${name}`);
            });
        });

        describe('invalid values', () => {
            it.each(invalidValueScenarios)('%s', async ({ name, optionsFactory }) => {
                await renderAndSnapshot(optionsFactory, `cartesian-axis-${name}`);
            });
        });

        describe('sticky property', () => {
            const stickyScenarios: Scenario[] = [
                {
                    name: 'cross-at-outside-number-domain-sticky-true',
                    optionsFactory: () => ({
                        data: NUMERIC_DATA,
                        theme: THEME,
                        axes: {
                            x: { type: 'number', position: 'bottom', crossAt: { value: 15, sticky: true } },
                            y: { type: 'number', position: 'left' },
                        },
                        series: [
                            {
                                type: 'line',
                                xKey: 'x',
                                yKey: 'y',
                            },
                        ],
                    }),
                },
                {
                    name: 'cross-at-outside-number-domain-sticky-false',
                    optionsFactory: () => ({
                        data: NUMERIC_DATA,
                        theme: THEME,
                        axes: {
                            x: { type: 'number', position: 'bottom', crossAt: { value: 15, sticky: false } },
                            y: { type: 'number', position: 'left' },
                        },
                        series: [
                            {
                                type: 'line',
                                xKey: 'x',
                                yKey: 'y',
                            },
                        ],
                    }),
                },
                {
                    name: 'cross-at-outside-category-domain-sticky-true',
                    optionsFactory: () => ({
                        data: CATEGORY_DATA,
                        theme: THEME,
                        axes: {
                            x: { type: 'category', position: 'bottom' },
                            y: { type: 'number', position: 'left', crossAt: { value: 'Z', sticky: true } },
                        },
                        series: [
                            {
                                type: 'bar',
                                xKey: 'category',
                                yKey: 'value',
                            },
                        ],
                    }),
                },
                {
                    name: 'cross-at-outside-category-domain-sticky-false',
                    optionsFactory: () => ({
                        data: CATEGORY_DATA,
                        theme: THEME,
                        axes: {
                            x: { type: 'category', position: 'bottom' },
                            y: { type: 'number', position: 'left', crossAt: { value: 'Z', sticky: false } },
                        },
                        series: [
                            {
                                type: 'bar',
                                xKey: 'category',
                                yKey: 'value',
                            },
                        ],
                    }),
                },
                {
                    name: 'cross-at-outside-log-domain-sticky-true',
                    optionsFactory: () => ({
                        theme: THEME,
                        data: LOG_DATA,
                        axes: {
                            x: { type: 'number', position: 'bottom', crossAt: { value: 200000, sticky: true } },
                            y: { type: 'log', position: 'left' },
                        },
                        series: [
                            {
                                type: 'line',
                                xKey: 'x2',
                                yKey: 'y2',
                            },
                        ],
                    }),
                },
                {
                    name: 'cross-at-outside-log-domain-sticky-false',
                    optionsFactory: () => ({
                        theme: THEME,
                        data: LOG_DATA,
                        axes: {
                            x: { type: 'number', position: 'bottom', crossAt: { value: 200000, sticky: false } },
                            y: { type: 'log', position: 'left' },
                        },
                        series: [
                            {
                                type: 'line',
                                xKey: 'x2',
                                yKey: 'y2',
                            },
                        ],
                    }),
                },
                {
                    name: 'cross-at-outside-time-domain-sticky-true',
                    optionsFactory: () => ({
                        data: TIME_DATA,
                        theme: THEME,
                        axes: {
                            x: { type: 'unit-time', position: 'bottom' },
                            y: {
                                type: 'number',
                                position: 'left',
                                crossAt: { value: new Date('2025-01-01T00:00:00Z'), sticky: true },
                            },
                        },
                        series: [
                            {
                                type: 'line',
                                xKey: 'date',
                                yKey: 'value',
                            },
                        ],
                    }),
                },
                {
                    name: 'cross-at-outside-time-domain-sticky-false',
                    optionsFactory: () => ({
                        data: TIME_DATA,
                        theme: THEME,
                        axes: {
                            x: { type: 'unit-time', position: 'bottom' },
                            y: {
                                type: 'number',
                                position: 'left',
                                crossAt: { value: new Date('2025-01-01T00:00:00Z'), sticky: false },
                            },
                        },
                        series: [
                            {
                                type: 'line',
                                xKey: 'date',
                                yKey: 'value',
                            },
                        ],
                    }),
                },
            ];

            it.each(stickyScenarios)('%s', async ({ name, optionsFactory }) => {
                await renderAndSnapshot(optionsFactory, `cartesian-axis-${name}`);
            });
        });

        describe('jira examples', () => {
            const dataNeg = [];
            for (let x = -6; x <= -0.1; x += 0.05) dataNeg.push({ x, y: 1 / x });

            const dataPos = [];
            for (let x = 0.1; x <= 6; x += 0.05) dataPos.push({ x, y: 1 / x });

            const data = [...dataNeg, { x: 0, y: null }, ...dataPos];

            it('should render a line chart with both axes crossing at 0', async () => {
                const options: AgCartesianChartOptions = {
                    title: { text: 'Axes crossing at 0', fontWeight: 'bold' },
                    data,
                    axes: {
                        x: {
                            type: 'number',
                            position: 'bottom',
                            min: -6,
                            max: 6,
                            line: {
                                stroke: 'black',
                            },
                            tick: {
                                size: 12,
                                stroke: 'black',
                            },
                            crossAt: { value: 0 },
                        },
                        y: {
                            type: 'number',
                            position: 'left',
                            min: -6,
                            max: 6,
                            line: {
                                stroke: 'black',
                            },
                            crossAt: { value: 0 },
                        },
                    },
                    legend: {
                        enabled: true,
                    },
                    series: [
                        {
                            type: 'line',
                            xKey: 'x',
                            yKey: 'y',
                            yName: 'Function plot',
                            strokeWidth: 3,
                            marker: { size: 0 },
                        },
                    ],
                };

                await renderAndSnapshot(() => options, 'cartesian-axes-cross-at-0-example');
            });

            it('should render a line chart with one axis crossing at 0', async () => {
                const options: AgCartesianChartOptions = {
                    title: { text: 'x Axis crossing at 0', fontWeight: 'bold' },
                    data,
                    axes: {
                        x: {
                            type: 'number',
                            position: 'bottom',
                            min: -6,
                            max: 6,
                            line: {
                                stroke: 'black',
                            },
                            tick: {
                                size: 12,
                                stroke: 'black',
                            },
                            crossAt: { value: 0 },
                        },
                        y: {
                            type: 'number',
                            position: 'left',
                            min: -6,
                            max: 6,
                            line: {
                                stroke: 'black',
                            },
                        },
                    },
                    series: [
                        {
                            type: 'line',
                            xKey: 'x',
                            yKey: 'y',
                            yName: 'Function plot',
                            strokeWidth: 3,
                            marker: { size: 0 },
                        },
                    ],
                    legend: {
                        enabled: true,
                    },
                };

                await renderAndSnapshot(() => options, 'cartesian-axis-cross-at-0-example');
            });

            it('should render a bar chart with x axis crossing at 10 and all axis labels and ticks rendered under bars', async () => {
                const options: AgCartesianChartOptions = {
                    data: [
                        { x: 0, y: 15 },
                        { x: 1, y: -3 },
                        { x: 2, y: 3 },
                        { x: 3, y: -15 },
                        { x: 4, y: 2 },
                    ],
                    axes: {
                        x: {
                            type: 'number',
                            position: 'bottom',
                            crossAt: { value: 10 },
                            line: {
                                stroke: 'black',
                            },
                            tick: {
                                size: 12,
                                stroke: 'black',
                            },
                            interval: {
                                values: [0, 1, 2, 3, 4],
                            },
                        },
                        y: { type: 'number', position: 'left', min: -20, max: 20 },
                    },
                    series: [
                        {
                            type: 'bar',
                            direction: 'vertical',
                            xKey: 'x',
                            yKey: 'y',
                            cornerRadius: 14,
                            fill: '#22b8ff',
                        },
                    ],
                };

                await renderAndSnapshot(() => options, 'cartesian-axis-cross-at-10-example');
            });
        });
    });

    describe('label wrapping', () => {
        it('should avoid premature truncation for rotated category labels', async () => {
            const options: AgCartesianChartOptions = {
                data: ROTATED_CATEGORY_DATA,
                axes: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                        label: {
                            rotation: 90,
                            truncate: true,
                            wrapping: 'never',
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                seriesArea: {
                    padding: { right: 600 },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare('cartesian-axis-rotated-category-label-wrap');
        });
    });

    // CRT-1048: Category axis labels like "Corp Tax" and "Council Tax" should not overlap on
    // narrow charts. Auto-rotation must be triggered when labels would collide.
    describe('CRT-1048 axis label collision', () => {
        it('should detect overlap when three labels collide with padding', () => {
            const labels = [
                { x: 0, y: 0, width: 40, height: 20 },
                { x: 60, y: 0, width: 40, height: 20 },
                { x: 45, y: 0, width: 40, height: 20 },
            ];
            expect(axisLabelsOverlap(labels, 15)).toBe(true);
        });

        it('should not report overlap for well-spaced labels', () => {
            const labels = [
                { x: 0, y: 0, width: 40, height: 20 },
                { x: 80, y: 0, width: 40, height: 20 },
                { x: 160, y: 0, width: 40, height: 20 },
            ];
            expect(axisLabelsOverlap(labels, 15)).toBe(false);
        });

        it('should detect overlap without padding', () => {
            const labels = [
                { x: 0, y: 0, width: 50, height: 20 },
                { x: 30, y: 0, width: 50, height: 20 },
            ];
            expect(axisLabelsOverlap(labels)).toBe(true);
        });
    });

    // CRT-1055: Wrapped (multi-line) labels should NOT trigger tooltips. Only truncated labels
    // (with ellipsis) should show tooltips.
    describe('CRT-1055 wrapped label tooltip', () => {
        it('should mark truncated labels with textUntruncated', async () => {
            const options: AgCartesianChartOptions = {
                width: 400,
                data: [
                    { category: 'A Very Long Category Label That Must Be Truncated With Ellipsis', value: 100 },
                    { category: 'Another Extremely Long Category Label That Overflows Band', value: 200 },
                ],
                axes: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                        label: {
                            wrapping: 'never',
                            truncate: true,
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart as any) as any;
            const categoryAxis = chartInstance.axes.find((axis: any) => axis.position === 'bottom');
            expect(categoryAxis).toBeDefined();
            const labelNodes: any[] = Array.from(categoryAxis.tickLabelGroupSelection.nodes());
            expect(labelNodes.length).toBeGreaterThan(0);
            const truncatedNodes = labelNodes.filter((node: any) => node.datum.textUntruncated != null);
            expect(truncatedNodes.length).toBeGreaterThan(0);
        });
    });
});
