import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Transformable, axisLabelsOverlap, getDocument, rotatePoint } from 'ag-charts-core';
import type {
    AgBaseChartThemeOptions,
    AgCartesianAxisCrossAt,
    AgCartesianChartOptions,
    AgCategoryAxisOptions,
    AgChartInstance,
    TextAlign,
    VerticalAlign,
} from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import {
    type AxisLabelNode,
    getAxisBandExtent,
    getAxisBandwidth,
    getAxisLabelNodes,
    getAxisTitleText,
    getLabelSegmentAlignments,
    getLabelText,
    getSeriesRect,
    pickAxisValue,
} from '../test/axisAccessors';
import { BIG, expectPixelIdenticalAcrossUpdate } from '../test/bigintExamples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    createChart,
    createSceneGeometrySampler,
    deproxy,
    expectWarningsCalls,
    getAxisTickLayout,
    getAxisTickLayoutLabelTexts,
    getAxisTickLayouts,
    prepareTestOptions,
    resizeChartContainer,
    setupMockCanvas,
    setupMockConsole,
    spyOnAxisTickLayout,
    waitForChartStability,
} from '../test/utils';

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

// Bespoke: the bare `AgCharts.create` calls in this suite set the width or height after preparation, which `createChart`
// would overwrite with the default, or skip preparation to take the auto-size path.
describe('CartesianAxis', () => {
    setupMockConsole();
    const compare = async (snapshotId: string) => {
        await compareImageSnapshot(chart, ctx, {
            ...IMAGE_SNAPSHOT_DEFAULTS,
            customSnapshotIdentifier: snapshotId,
        });
    };

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const renderAndSnapshot = async (factory: OptionsFactory, snapshotId: string) => {
        chart = await createChart(factory());
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

        describe('removal', () => {
            const optionsWithCrossAt = (crossAt?: AgCartesianAxisCrossAt): AgCartesianChartOptions => ({
                data: NUMERIC_DATA,
                theme: THEME,
                axes: {
                    x: { type: 'number', position: 'bottom', crossAt },
                    y: { type: 'number', position: 'left', crossAt },
                },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });

            it.each([
                ['in-domain', { value: 0 }],
                // Out of domain with `sticky: false` hides the axis, so this also covers visibility.
                ['out-of-domain and not sticky', { value: 15, sticky: false }],
            ] as const)(
                'should restore the uncrossed render after adding then removing %s crossAt',
                async (_name, crossAt) => {
                    await expectPixelIdenticalAcrossUpdate(
                        ctx,
                        createChart,
                        optionsWithCrossAt(),
                        optionsWithCrossAt(crossAt),
                        optionsWithCrossAt()
                    );
                }
            );
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

        describe('title and labels', () => {
            const dataNeg = [];
            for (let x = -6; x <= -0.1; x += 0.05) dataNeg.push({ x, y: 1 / x });

            const dataPos = [];
            for (let x = 0.1; x <= 6; x += 0.05) dataPos.push({ x, y: 1 / x });

            const data = [...dataNeg, { x: 0, y: null }, ...dataPos];

            const optionsFactory =
                (crossAt: AgCartesianAxisCrossAt): OptionsFactory =>
                () => ({
                    title: { text: 'Axes crossing at 0', fontWeight: 'bold' },
                    data,
                    theme: THEME,
                    axes: {
                        x: {
                            type: 'number',
                            position: 'bottom',
                            min: -6,
                            max: 6,
                            title: { text: 'X Axis Title' },
                            crossAt,
                            tick: { size: 12, stroke: 'black' },
                        },
                        y: {
                            type: 'number',
                            position: 'left',
                            min: -6,
                            max: 6,
                            title: { text: 'Y Axis Title' },
                            crossAt,
                            tick: { size: 12, stroke: 'black' },
                        },
                    },
                    series: [{ type: 'line', xKey: 'x', yKey: 'y', marker: { size: 0 } }],
                });

            it('should render the title at the edge', async () => {
                await renderAndSnapshot(
                    optionsFactory({ value: 0, titlePlacement: 'edge' }),
                    'cartesian-axes-cross-at-0-title-at-edge'
                );
            });

            it('should render the labels at the edge', async () => {
                await renderAndSnapshot(
                    optionsFactory({ value: 0, labelPlacement: 'edge' }),
                    'cartesian-axes-cross-at-0-labels-at-edge'
                );
            });

            it('should render the title and labels at the edge', async () => {
                await renderAndSnapshot(
                    optionsFactory({ value: 0, titlePlacement: 'edge', labelPlacement: 'edge' }),
                    'cartesian-axes-cross-at-0-title-and-labels-at-edge'
                );
            });
        });

        describe('bigint values (AG-18313)', () => {
            const bigintDomainOptions = (value: AgCartesianAxisCrossAt['value']): AgCartesianChartOptions => ({
                data: [
                    { x: -10, y: BIG },
                    { x: 10, y: BIG + 4n },
                ],
                theme: THEME,
                axes: {
                    x: { type: 'number', position: 'bottom', crossAt: { value } },
                    y: { type: 'number', position: 'left', min: BIG, max: BIG + 4n, nice: false },
                },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });

            // Where the axis line is drawn, as the scene places it, and the series rect it was placed against.
            const crossPositionY = async (value: AgCartesianAxisCrossAt['value']) => {
                chart = await createChart(bigintDomainOptions(value));
                const line = createSceneGeometrySampler(chart)().get('axis[bottom]/group[x-Axis-line]');
                expect(line).toBeDefined();
                const { y, height } = getSeriesRect(chart);
                chart.destroy();
                (chart as unknown) = undefined;
                return { translationY: line!.translationY, bottom: y + height, height };
            };

            // The axis moves with the cross position: one at the domain minimum sits on the edge, and makes room for
            // its labels, so the offsets stay inside the domain to compare positions under one series rect.
            it('resolves adjacent bigints beyond MAX_SAFE_INTEGER to distinct cross positions', async () => {
                const offsets = [1n, 2n, 3n];
                const positions = [];
                for (const offset of offsets) {
                    positions.push(await crossPositionY(BIG + offset));
                }

                expect(new Set(positions.map((position) => position.translationY)).size).toBe(3);
                // The domain is BIG to BIG + 4, so each step moves the axis a quarter of the height. The rendered
                // translation is floored, so it lands within a pixel below the exact position.
                for (const [i, { translationY, bottom, height }] of positions.entries()) {
                    expect(Math.abs(translationY - (bottom - ((i + 1) * height) / 4))).toBeLessThanOrEqual(1);
                }
            });

            it('renders a bigint crossAt value identically to the equivalent number', async () => {
                const options = (value: AgCartesianAxisCrossAt['value']): AgCartesianChartOptions => ({
                    data: NUMERIC_DATA,
                    theme: THEME,
                    axes: {
                        x: { type: 'number', position: 'bottom', crossAt: { value } },
                        y: { type: 'number', position: 'left' },
                    },
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                });

                await expectPixelIdenticalAcrossUpdate(ctx, createChart, options(0), options(0n), options(0));
            });

            it('accepts a bigint crossAt value on a log axis without warning', async () => {
                const options: AgCartesianChartOptions = {
                    data: [
                        { x: 1, y: 10 },
                        { x: 2, y: 1000 },
                    ],
                    theme: THEME,
                    axes: {
                        x: { type: 'number', position: 'bottom', crossAt: { value: 100n } },
                        y: { type: 'log', position: 'left' },
                    },
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                };
                chart = await createChart(options);
                expectWarningsCalls().toHaveLength(0);
            });

            it('degrades to the uncrossed fallback for a bigint crossAt value on a category axis', async () => {
                const options = (crossAt?: AgCartesianAxisCrossAt): AgCartesianChartOptions => ({
                    data: CATEGORY_DATA,
                    theme: THEME,
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                        y: { type: 'number', position: 'left', ...(crossAt ? { crossAt } : {}) },
                    },
                    series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                });

                await expectPixelIdenticalAcrossUpdate(ctx, createChart, options({ value: 1n }), options());
                expectWarningsCalls().toHaveLength(0);
            });
        });
    });

    describe('line', () => {
        const options = (line: AgCartesianChartOptions['axes']): AgCartesianChartOptions => ({
            data: NUMERIC_DATA,
            axes: line,
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        });

        it('renders a fainter axis line with strokeOpacity', async () => {
            await renderAndSnapshot(
                () =>
                    options({
                        x: { type: 'number', position: 'bottom', line: { stroke: 'black', strokeOpacity: 0.2 } },
                        y: { type: 'number', position: 'left', line: { stroke: 'black', strokeOpacity: 0.2 } },
                    }),
                'cartesian-axis-line-stroke-opacity'
            );
        });

        it('renders a dashed axis line with lineDash', async () => {
            await renderAndSnapshot(
                () =>
                    options({
                        x: { type: 'number', position: 'bottom', line: { stroke: 'black', lineDash: [4, 4] } },
                        y: { type: 'number', position: 'left', line: { stroke: 'black', lineDash: [4, 4] } },
                    }),
                'cartesian-axis-line-dash'
            );
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

            chart = await createChart(options);
            await compare('cartesian-axis-rotated-category-label-wrap');
        });
    });

    describe('label lineHeight', () => {
        const seriesAreaHeight = async (label: object, parentLabel: object) => {
            chart = await createChart({
                data: [
                    { date: new Date(2023, 10, 1), value: 2 },
                    { date: new Date(2024, 0, 1), value: 3 },
                    { date: new Date(2024, 2, 1), value: 2 },
                ],
                series: [{ type: 'bar', xKey: 'date', yKey: 'value' }],
                axes: {
                    x: {
                        type: 'time',
                        position: 'bottom',
                        label,
                        parentLevel: { enabled: true, label: { enabled: true, ...parentLabel } },
                    },
                    y: { type: 'number', position: 'left' },
                },
            });
            const { height } = deproxy(chart).seriesRect!;
            chart.destroy();
            return height;
        };

        it('reserves axis size by the lineHeight of the parent level labels', async () => {
            const natural = await seriesAreaHeight({ enabled: false }, { format: '%Y' });
            const tall = await seriesAreaHeight({ enabled: false }, { format: '%Y', lineHeight: 100 });
            expect(natural - tall).toBeGreaterThan(50);
        });
    });

    // Auto-rotation must trigger when category labels would collide on a narrow chart.
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

        it('should auto-rotate labels to avoid collision on narrow chart', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'Corp Tax', value: 150 },
                    { category: 'Council Tax', value: 120 },
                    { category: 'Income Tax', value: 200 },
                    { category: 'VAT', value: 180 },
                    { category: 'Capital Gains', value: 90 },
                    { category: 'Stamp Duty', value: 60 },
                ],
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            };

            prepareTestOptions(options);
            options.width = 300;
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Every node the axis drew, so the visible subset below is a real selection from it.
            expect(getAxisLabelNodes(chart, 'bottom', { visibleOnly: false }).length).toBeGreaterThan(0);
            const visibleLabels = getAxisLabelNodes(chart, 'bottom');
            expect(visibleLabels.length).toBeGreaterThan(0);
            for (const node of visibleLabels) {
                expect(node.datum.rotation).not.toBe(0);
            }

            await compareImageSnapshot(chart, ctx, {
                ...IMAGE_SNAPSHOT_DEFAULTS,
                customSnapshotIdentifier: 'cartesian-axis-label-auto-rotation-narrow',
            });
        });
    });

    describe('title text wrap', () => {
        it('should wrap a long axis title to fit within the axis length', async () => {
            const options: AgCartesianChartOptions = {
                data: NUMERIC_DATA,
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        title: {
                            enabled: true,
                            text: 'This Is A Very Long Axis Title That Should Be Wrapped Across Multiple Lines',
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            };

            prepareTestOptions(options);
            options.width = 300;
            chart = AgCharts.create(options);
            await compare('cartesian-axis-title-text-wrap');
        });

        it('should respect title maxWidth', async () => {
            const options: AgCartesianChartOptions = {
                data: NUMERIC_DATA,
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        title: {
                            enabled: true,
                            text: 'This Is A Very Long Axis Title That Should Be Wrapped',
                            maxWidth: 150,
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            };

            chart = await createChart(options);
            await compare('cartesian-axis-title-max-width');
        });

        it('should respect title maxHeight to truncate wrapped text', async () => {
            const options: AgCartesianChartOptions = {
                data: NUMERIC_DATA,
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        title: {
                            enabled: true,
                            text: 'This Is A Very Long Axis Title That Should Be Truncated After A Certain Height',
                            maxWidth: 150,
                            maxHeight: 30,
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            };

            chart = await createChart(options);
            await compare('cartesian-axis-title-max-height');
        });

        it('should clip wrapped title lines by the lineHeight within maxHeight', async () => {
            chart = await createChart({
                data: NUMERIC_DATA,
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        title: {
                            enabled: true,
                            text: 'This Is A Very Long Axis Title That Should Be Truncated After A Certain Height',
                            fontSize: 20,
                            lineHeight: 60,
                            maxWidth: 150,
                            maxHeight: 130,
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });

            const lines = getAxisTitleText(chart, 'bottom').split('\n');
            expect(lines).toHaveLength(2);
            expect(lines[1]).toContain('\u2026');
        });

        it('should not wrap title when wrapping is "never"', async () => {
            const options: AgCartesianChartOptions = {
                data: NUMERIC_DATA,
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        title: {
                            enabled: true,
                            text: 'This Is A Very Long Axis Title That Should Not Be Wrapped',
                            wrapping: 'never',
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            };

            prepareTestOptions(options);
            options.width = 300;
            chart = AgCharts.create(options);
            await compare('cartesian-axis-title-wrap-never');
        });

        it('should wrap title on left axis (vertical)', async () => {
            const options: AgCartesianChartOptions = {
                data: NUMERIC_DATA,
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: {
                        type: 'number',
                        position: 'left',
                        title: {
                            enabled: true,
                            text: 'This Is A Very Long Y-Axis Title That Should Be Wrapped',
                        },
                    },
                },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            };

            prepareTestOptions(options);
            options.height = 300;
            chart = AgCharts.create(options);
            await compare('cartesian-axis-title-wrap-vertical');
        });

        it('should hyphenate title when wrapping is "hyphenate"', async () => {
            const options: AgCartesianChartOptions = {
                data: NUMERIC_DATA,
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        title: {
                            enabled: true,
                            text: 'Electroencephalography Measurements',
                            wrapping: 'hyphenate',
                            maxWidth: 100,
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            };

            chart = await createChart(options);
            await compare('cartesian-axis-title-wrap-hyphenate');
        });

        it('should only wrap on spaces when wrapping is "on-space"', async () => {
            const options: AgCartesianChartOptions = {
                data: NUMERIC_DATA,
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        title: {
                            enabled: true,
                            text: 'Electroencephalography Measurements Over Time',
                            wrapping: 'on-space',
                            maxWidth: 100,
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            };

            chart = await createChart(options);
            await compare('cartesian-axis-title-wrap-on-space');
        });
    });

    describe('title orientation', () => {
        const orientationScenarios: Scenario[] = [
            {
                // A vertical y-axis title rendered horizontally.
                name: 'title-orientation-horizontal-left',
                optionsFactory: () => ({
                    data: NUMERIC_DATA,
                    axes: {
                        x: { type: 'number', position: 'bottom' },
                        y: {
                            type: 'number',
                            position: 'left',
                            title: { enabled: true, text: 'Temperature', orientation: 'horizontal' },
                        },
                    },
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                }),
            },
            {
                name: 'title-orientation-horizontal-right',
                optionsFactory: () => ({
                    data: NUMERIC_DATA,
                    axes: {
                        x: { type: 'number', position: 'bottom' },
                        y: {
                            type: 'number',
                            position: 'right',
                            title: { enabled: true, text: 'Temperature', orientation: 'horizontal' },
                        },
                    },
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                }),
            },
            {
                // The right y-axis title flipped from its default vertical direction.
                name: 'title-orientation-vertical-right',
                optionsFactory: () => ({
                    data: NUMERIC_DATA,
                    axes: {
                        x: { type: 'number', position: 'bottom' },
                        y: {
                            type: 'number',
                            position: 'right',
                            title: { enabled: true, text: 'Temperature', orientation: 'vertical' },
                        },
                    },
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                }),
            },
            {
                name: 'title-orientation-vertical-reversed-left',
                optionsFactory: () => ({
                    data: NUMERIC_DATA,
                    axes: {
                        x: { type: 'number', position: 'bottom' },
                        y: {
                            type: 'number',
                            position: 'left',
                            title: { enabled: true, text: 'Temperature', orientation: 'vertical-reversed' },
                        },
                    },
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                }),
            },
            {
                name: 'title-orientation-vertical-reversed-bottom',
                optionsFactory: () => ({
                    data: NUMERIC_DATA,
                    axes: {
                        x: {
                            type: 'number',
                            position: 'bottom',
                            title: { enabled: true, text: 'Distance', orientation: 'vertical-reversed' },
                        },
                        y: { type: 'number', position: 'left' },
                    },
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                }),
            },
            {
                name: 'title-orientation-vertical-top',
                optionsFactory: () => ({
                    data: NUMERIC_DATA,
                    axes: {
                        x: {
                            type: 'number',
                            position: 'top',
                            title: { enabled: true, text: 'Distance', orientation: 'vertical' },
                        },
                        y: { type: 'number', position: 'left' },
                    },
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                }),
            },
        ];

        it.each(orientationScenarios)('$name', async ({ name, optionsFactory }) => {
            await renderAndSnapshot(optionsFactory, `cartesian-axis-${name}`);
        });
    });

    // Only truncated (ellipsised) labels get a tooltip; wrapped multi-line labels must not.
    describe('CRT-1055 wrapped label tooltip', () => {
        it('should not mark wrapped labels as truncated', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'First Category Label', value: 100 },
                    { category: 'Second Category Label', value: 200 },
                    { category: 'Third Category Label', value: 150 },
                    { category: 'Fourth Category Label', value: 120 },
                ],
                axes: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                        label: {
                            wrapping: 'always',
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            };

            prepareTestOptions(options);
            options.width = 300;
            chart = AgCharts.create(options);
            await compare('cartesian-axis-wrapped-label-not-truncated');

            // A hidden label would pass the check vacuously, so read every node the axis drew.
            const labelNodes = getAxisLabelNodes(chart, 'bottom', { visibleOnly: false });
            expect(labelNodes.length).toBeGreaterThan(0);
            for (const node of labelNodes) {
                expect(node.datum.textUntruncated).toBeUndefined();
            }
        });

        it('should mark truncated labels with textUntruncated', async () => {
            const options: AgCartesianChartOptions = {
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
            options.width = 400;
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const labelNodes = getAxisLabelNodes(chart, 'bottom', { visibleOnly: false });
            expect(labelNodes.length).toBeGreaterThan(0);
            const truncatedNodes = labelNodes.filter((node) => node.datum.textUntruncated != null);
            expect(truncatedNodes.length).toBeGreaterThan(0);
        });

        it('should truncate labels in bands thinner than a line', async () => {
            const options: AgCartesianChartOptions = {
                data: Array.from({ length: 60 }, (_, i) => ({
                    category: `A very long category label that cannot fit ${i}`,
                    value: i,
                })),
                axes: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                        label: { rotation: 90, truncate: true, wrapping: 'never' },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                seriesArea: { padding: { right: 600 } },
            };

            chart = await createChart(options);

            const labelNodes = getAxisLabelNodes(chart, 'bottom', { visibleOnly: false });
            expect(labelNodes.length).toBeGreaterThan(0);
            for (const node of labelNodes) {
                expect(node.datum.textUntruncated).toBeDefined();
            }
        });
    });

    // At a fractional DPR a resizing axis must not oscillate; a sawtooth position is the 1px jitter.
    describe('axis position stability at fractional DPR', () => {
        const PIXEL_RATIO = 2.2;

        let container: HTMLElement;

        beforeEach(() => {
            container = getDocument().createElement('div');
            getDocument().body.append(container);
        });

        afterEach(() => container.remove());

        // Drive the auto-size path; explicit width/height would short-circuit the device-pixel offset.
        const resizeTo = (width: number, height: number) =>
            resizeChartContainer(chart, { width, height, pixelRatio: PIXEL_RATIO });

        // Where the scene draws the axis line, floored to the pixel it is placed on.
        const axisLinePosition = (position: 'bottom' | 'left', along: 'translationX' | 'translationY') => {
            const id = position === 'bottom' ? 'x' : 'y';
            const line = createSceneGeometrySampler(chart)().get(`axis[${position}]/group[${id}-Axis-line]`);
            expect(line).toBeDefined();
            return line![along];
        };

        // A sweep that never resizes the chart would pass every stability check below, so each one asserts the series
        // rect followed the container.
        const expectResized = (sizes: number[]) => expect(new Set(sizes).size).toBeGreaterThan(1);

        const createAutoSizedChart = () => {
            const options: AgCartesianChartOptions = {
                container,
                data: [
                    { x: 'A', y: 1 },
                    { x: 'B', y: 4 },
                    { x: 'C', y: 2 },
                ],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            };
            chart = AgCharts.create(options);
        };

        it('keeps the bottom axis Y position fixed as the container width grows', async () => {
            createAutoSizedChart();

            const positions = new Set<number>();
            const sizes: number[] = [];
            for (let width = 300; width <= 320; width++) {
                await resizeTo(width, 200);
                positions.add(axisLinePosition('bottom', 'translationY'));
                sizes.push(getSeriesRect(chart).width);
            }

            expectResized(sizes);
            expect(positions.size).toBe(1);
        });

        it('keeps the left axis X position fixed as the container height grows', async () => {
            createAutoSizedChart();

            const positions = new Set<number>();
            const sizes: number[] = [];
            for (let height = 300; height <= 320; height++) {
                await resizeTo(400, height);
                positions.add(axisLinePosition('left', 'translationX'));
                sizes.push(getSeriesRect(chart).height);
            }

            expectResized(sizes);
            expect(positions.size).toBe(1);
        });

        // Resizing along the axis's own depth direction moves it monotonically; a reversal is the jitter.
        const directionReversals = (sequence: number[]) => {
            let reversals = 0;
            let previousDirection = 0;
            for (let i = 1; i < sequence.length; i++) {
                const direction = Math.sign(Math.round((sequence[i] - sequence[i - 1]) * 1000));
                if (direction !== 0) {
                    if (previousDirection !== 0 && direction !== previousDirection) reversals++;
                    previousDirection = direction;
                }
            }
            return reversals;
        };

        it('moves the left axis X position monotonically as the container width grows', async () => {
            createAutoSizedChart();

            const positions: number[] = [];
            const sizes: number[] = [];
            for (let width = 300; width <= 320; width++) {
                await resizeTo(width, 200);
                positions.push(axisLinePosition('left', 'translationX'));
                sizes.push(getSeriesRect(chart).width);
            }

            expectResized(sizes);
            expect(directionReversals(positions)).toBe(0);
        });

        it('moves the bottom axis Y position monotonically as the container height grows', async () => {
            createAutoSizedChart();

            const positions: number[] = [];
            const sizes: number[] = [];
            for (let height = 300; height <= 320; height++) {
                await resizeTo(400, height);
                positions.push(axisLinePosition('bottom', 'translationY'));
                sizes.push(getSeriesRect(chart).height);
            }

            expectResized(sizes);
            expect(directionReversals(positions)).toBe(0);
        });
    });

    describe('AG-17541 toggling axis labels off removes them', () => {
        const baseOptions = (labelEnabled: boolean): AgCartesianChartOptions => ({
            data: CATEGORY_DATA,
            axes: {
                x: { type: 'category', position: 'bottom', label: { enabled: labelEnabled } },
                y: { type: 'number', position: 'left' },
            },
            series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
        });

        // Every node in the scene graph: a visible-only count would pass when the labels were merely hidden.
        const bottomAxisLabelNodes = () => getAxisLabelNodes(chart, 'bottom', { visibleOnly: false });

        it('removes the label nodes when labels are disabled at runtime', async () => {
            const options = baseOptions(true);
            chart = await createChart(options);

            expect(bottomAxisLabelNodes().length).toBeGreaterThan(0);

            const disabled = baseOptions(false);
            prepareTestOptions(disabled);
            await chart.update(disabled);
            await waitForChartStability(chart);

            expect(bottomAxisLabelNodes()).toHaveLength(0);
        });

        it('renders no label nodes when labels are disabled from the initial options', async () => {
            const options = baseOptions(false);
            chart = await createChart(options);

            expect(bottomAxisLabelNodes()).toHaveLength(0);
        });
    });

    describe('AG-17637 picked index matches the label formatter index', () => {
        const REVERSE_DATA = [
            { category: 'Jan', value: 8 },
            { category: 'Mar', value: 6 },
            { category: 'Jun', value: 18 },
            { category: 'Aug', value: 14 },
        ];

        // Drive the real label formatter and record the index it reports for each tick value (last write wins,
        // since the formatter runs once per layout pass).
        const formatterIndexByValue = new Map<number, number>();
        const baseOptions = (reverse: boolean): AgCartesianChartOptions => ({
            data: REVERSE_DATA,
            series: [{ type: 'line', xKey: 'category', yKey: 'value' }],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: {
                    type: 'number',
                    position: 'left',
                    reverse,
                    label: {
                        formatter: (p) => {
                            formatterIndexByValue.set(p.value, p.index);
                            return String(p.value);
                        },
                    },
                },
            },
        });

        beforeEach(() => formatterIndexByValue.clear());

        const expectPickIndexMatchesFormatter = async (reverse: boolean) => {
            const options = baseOptions(reverse);
            chart = await createChart(options);

            expect(formatterIndexByValue.size).toBeGreaterThan(0);

            for (const [value, formatterIndex] of formatterIndexByValue) {
                const pick = pickAxisValue(chart, 'left', value);
                expect(pick).toBeDefined();
                expect(pick!.index).toBe(formatterIndex);
            }
        };

        it('matches for a normal axis', async () => {
            await expectPickIndexMatchesFormatter(false);
        });

        it('matches for a reversed axis', async () => {
            await expectPickIndexMatchesFormatter(true);

            // On a reversed axis the lowest-value tick must still be index 0, not a negative offset.
            const [minValue] = [...formatterIndexByValue.keys()].sort((a, b) => a - b);
            expect(formatterIndexByValue.get(minValue)).toBe(0);
        });
    });

    // Shared by `axis label textAlign` and `axis label verticalAlign` below: both suites re-anchor
    // labels within the band/column the axis reserved, so they share fixtures and axis-node helpers.
    type TextAlignLabelOptions = {
        rotation?: number;
        textAlign?: TextAlign;
        verticalAlign?: VerticalAlign;
        wrapping?: 'always' | 'never' | 'on-space';
        avoidCollisions?: boolean;
        formatter?: NonNullable<AgCategoryAxisOptions['label']>['formatter'];
    };

    // Deliberately unequal label widths: a right-positioned category axis is the only vertical
    // axis whose ticks routinely differ in text length.
    const TEXT_ALIGN_CATEGORY_DATA = [
        { category: 'A', value: 10 },
        { category: 'BBBBBBBBBB', value: 20 },
        { category: 'CCC', value: 15 },
    ];

    // Long words so their combined width overflows the ~170px band width at `width: 300`, forcing
    // `wrapping: 'always'` to wrap them onto differing numbers of lines.
    const WRAPPED_HEIGHT_CATEGORY_DATA = [
        { category: 'Elephant', value: 10 },
        { category: 'Elephant Rhinoceros Buffalo', value: 20 },
        { category: 'Elephant Rhinoceros Buffalo Salamander Chimpanzee', value: 15 },
    ];

    const wrappedBottomAxisOptions = (label?: TextAlignLabelOptions): AgCartesianChartOptions => ({
        data: WRAPPED_HEIGHT_CATEGORY_DATA,
        width: 300,
        axes: {
            x: { type: 'category', position: 'bottom', label: { wrapping: 'always', ...(label ?? {}) } },
            y: { type: 'number', position: 'left' },
        },
        series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
    });

    const rightAxisOptions = (label?: TextAlignLabelOptions): AgCartesianChartOptions => ({
        data: TEXT_ALIGN_CATEGORY_DATA,
        axes: {
            x: { type: 'number', position: 'bottom' },
            y: { type: 'category', position: 'right', ...(label ? { label } : {}) },
        },
        series: [{ type: 'bar', direction: 'horizontal', xKey: 'category', yKey: 'value' }],
    });

    const bottomAxisOptions = (label?: TextAlignLabelOptions): AgCartesianChartOptions => ({
        data: TEXT_ALIGN_CATEGORY_DATA,
        axes: {
            x: { type: 'category', position: 'bottom', ...(label ? { label } : {}) },
            y: { type: 'number', position: 'left' },
        },
        series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
    });

    const topAxisOptions = (label?: TextAlignLabelOptions): AgCartesianChartOptions => ({
        data: TEXT_ALIGN_CATEGORY_DATA,
        axes: {
            x: { type: 'category', position: 'top', ...(label ? { label } : {}) },
            y: { type: 'number', position: 'left' },
        },
        series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
    });

    const leftAxisOptions = (label?: TextAlignLabelOptions): AgCartesianChartOptions => ({
        data: NUMERIC_DATA,
        axes: {
            x: { type: 'number', position: 'bottom' },
            y: { type: 'number', position: 'left', ...(label ? { label } : {}) },
        },
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    });

    // The label's own glyph box, before the axis group's transforms.
    const getLocalBox = (node: AxisLabelNode) => {
        const box = node.computeBBoxWithoutTransforms();
        expect(box).toBeDefined();
        return box!;
    };

    // Anchors captured from one chart, keyed by label text so a second chart's nodes (which may
    // come back in a different Selection order) can be compared without relying on array order.
    const captureAnchorsByText = (nodes: AxisLabelNode[]) =>
        new Map(
            nodes.map((n) => [
                getLabelText(n),
                {
                    x: n.datum.x,
                    y: n.datum.y,
                    rotationCenterX: n.datum.rotationCenterX,
                    rotationCenterY: n.datum.rotationCenterY,
                    textBaseline: n.datum.textBaseline,
                    textAlign: n.datum.textAlign,
                },
            ])
        );

    // `axis.label.textAlign` re-anchors unrotated vertical-axis labels within their column, so long
    // labels cannot grow back over the axis line into the series area.
    describe('axis label textAlign', () => {
        it('computes "left" as the natural alignment for an unconfigured right-positioned axis', async () => {
            const options = rightAxisOptions();
            chart = await createChart(options);

            const nodes = getAxisLabelNodes(chart, 'right');
            expect(nodes.map(getLabelText).sort((a, b) => a.localeCompare(b))).toEqual(['A', 'BBBBBBBBBB', 'CCC']);
            for (const node of nodes) {
                expect(node.datum.textAlign).toBe('left');
            }
        });

        it('AC1: "right" textAlign flushes label right edges while left edges keep differing', async () => {
            const options = rightAxisOptions({ textAlign: 'right' });
            chart = await createChart(options);

            const nodes = getAxisLabelNodes(chart, 'right');
            expect(nodes.map(getLabelText).sort((a, b) => a.localeCompare(b))).toEqual(['A', 'BBBBBBBBBB', 'CCC']);

            const boxes = nodes.map((n) => Transformable.toCanvas(n));
            const rightEdges = boxes.map((b) => b.x + b.width);
            const leftEdges = boxes.map((b) => b.x);

            expect(Math.max(...rightEdges) - Math.min(...rightEdges)).toBeLessThanOrEqual(1);
            // Anti-vacuous: the fixture's unequal label widths must still show up as unequal left
            // edges, otherwise the flush right edge would hold trivially for any alignment.
            expect(Math.max(...leftEdges) - Math.min(...leftEdges)).toBeGreaterThan(1);
        });

        it('AC1: "right" textAlign keeps every label clear of the plot area', async () => {
            const options = rightAxisOptions({ textAlign: 'right' });
            chart = await createChart(options);

            const nodes = getAxisLabelNodes(chart, 'right');
            const seriesRect = getSeriesRect(chart);
            const plotBoundary = seriesRect.x + seriesRect.width;

            for (const node of nodes) {
                const box = Transformable.toCanvas(node);
                expect(box.x).toBeGreaterThanOrEqual(plotBoundary - 1);
            }
        });

        it("AC2: textAlign matching the axis's natural alignment produces identical anchors", async () => {
            const naturalOptions = rightAxisOptions();
            chart = await createChart(naturalOptions);
            const naturalAnchors = captureAnchorsByText(getAxisLabelNodes(chart, 'right'));

            chart.destroy();
            (chart as unknown) = undefined;

            const explicitOptions = rightAxisOptions({ textAlign: 'left' });
            chart = await createChart(explicitOptions);
            const explicitNodes = getAxisLabelNodes(chart, 'right');

            expect(explicitNodes.length).toBe(naturalAnchors.size);
            for (const node of explicitNodes) {
                const natural = naturalAnchors.get(getLabelText(node));
                expect(natural).toBeDefined();
                expect(node.datum.x).toBeCloseTo(natural!.x, 5);
                expect(node.datum.rotationCenterX).toBeCloseTo(natural!.rotationCenterX, 5);
            }
        });

        it('TC1: a rotated label aligns within its own bounding box, clear of the series area', async () => {
            const options = rightAxisOptions({ rotation: 45, textAlign: 'right' });
            chart = await createChart(options);

            const nodes = getAxisLabelNodes(chart, 'right');
            expect(nodes.length).toBe(3);

            const seriesRect = getSeriesRect(chart);
            const seriesRight = seriesRect.x + seriesRect.width;
            const boxes = nodes.map((n) => Transformable.toCanvas(n));

            // Rotating the glyphs must not carry them back over the axis line: the series paints on
            // top of the plot area, so a label that reaches into it is partly erased.
            for (const box of boxes) {
                expect(box.x).toBeGreaterThanOrEqual(seriesRight);
            }

            // The alignment still acts on the rotated boxes - their right edges are flush while
            // their differing widths leave the left edges ragged.
            const rightEdges = boxes.map((b) => b.x + b.width);
            for (const edge of rightEdges) {
                expect(edge).toBeCloseTo(rightEdges[0], 5);
            }
            expect(new Set(boxes.map((b) => Math.round(b.width))).size).toBeGreaterThan(1);
        });

        // `'start'`/`'end'` name a side of the paragraph rather than a side of the canvas, so the
        // side they land on has to follow the chart's direction.
        describe('direction-relative alignments', () => {
            const renderRightAxis = async (enableRtl: boolean, label?: TextAlignLabelOptions) => {
                if (chart != null) {
                    chart.destroy();
                    (chart as unknown) = undefined;
                }
                const options: AgCartesianChartOptions = { ...rightAxisOptions(label), enableRtl };
                chart = await createChart(options);
                return chart;
            };

            const expectAnchorsMatch = (nodes: AxisLabelNode[], expected: ReturnType<typeof captureAnchorsByText>) => {
                expect(nodes.length).toBe(expected.size);
                for (const node of nodes) {
                    const anchor = expected.get(getLabelText(node));
                    expect(anchor).toBeDefined();
                    expect(node.datum.x).toBeCloseTo(anchor!.x, 5);
                    expect(node.datum.rotationCenterX).toBeCloseTo(anchor!.rotationCenterX, 5);
                }
            };

            it.each([
                ['start', 'left'],
                ['end', 'right'],
            ] as const)('AC3: resolves "%s" to "%s" in a left-to-right chart', async (textAlign, resolved) => {
                await renderRightAxis(false, { textAlign: resolved });
                const resolvedAnchors = captureAnchorsByText(getAxisLabelNodes(chart, 'right'));
                expect(resolvedAnchors.size).toBe(3);

                await renderRightAxis(false, { textAlign });
                const nodes = getAxisLabelNodes(chart, 'right');
                for (const node of nodes) {
                    expect(node.datum.textAlign).toBe(resolved);
                }
                expectAnchorsMatch(nodes, resolvedAnchors);
            });

            it.each([
                ['start', 'right'],
                ['end', 'left'],
            ] as const)('AC3: resolves "%s" to "%s" in a right-to-left chart', async (textAlign, resolved) => {
                await renderRightAxis(true, { textAlign: resolved });
                const resolvedAnchors = captureAnchorsByText(getAxisLabelNodes(chart, 'right'));
                expect(resolvedAnchors.size).toBe(3);

                await renderRightAxis(true, { textAlign });
                const nodes = getAxisLabelNodes(chart, 'right');
                for (const node of nodes) {
                    expect(node.datum.textAlign).toBe(resolved);
                }
                expectAnchorsMatch(nodes, resolvedAnchors);
            });

            // Anti-vacuous cover for the two cases above: the mapping is only meaningful because the
            // same configured value lands on opposite sides in the two directions.
            it.each(['start', 'end'] as const)(
                'sends "%s" to opposite sides in the two directions',
                async (textAlign) => {
                    await renderRightAxis(false, { textAlign });
                    const ltr = getAxisLabelNodes(chart, 'right').map((n) => n.datum.textAlign);

                    await renderRightAxis(true, { textAlign });
                    const rtl = getAxisLabelNodes(chart, 'right').map((n) => n.datum.textAlign);

                    expect(new Set(ltr).size).toBe(1);
                    expect(new Set(rtl).size).toBe(1);
                    expect(ltr[0]).not.toBe(rtl[0]);
                }
            );

            // The natural alignment of a right-positioned axis is `'left'` whichever way the chart
            // runs, so under RTL it is `'end'` that must leave the anchors untouched.
            it('AC2: an RTL "end" matching the axis\'s natural alignment produces identical anchors', async () => {
                await renderRightAxis(true);
                const naturalNodes = getAxisLabelNodes(chart, 'right');
                for (const node of naturalNodes) {
                    expect(node.datum.textAlign).toBe('left');
                }
                const naturalAnchors = captureAnchorsByText(naturalNodes);
                expect(naturalAnchors.size).toBe(3);

                await renderRightAxis(true, { textAlign: 'end' });
                expectAnchorsMatch(getAxisLabelNodes(chart, 'right'), naturalAnchors);
            });

            it.each([[false], [true]])('AC4: accepts "start" without warning (enableRtl %j)', async (enableRtl) => {
                await renderRightAxis(enableRtl, { textAlign: 'start' });

                expect(getAxisLabelNodes(chart, 'right').length).toBe(3);
                expectWarningsCalls().toEqual([]);
            });
        });

        // A banded scale puts each tick in the middle of its band, so on a horizontal axis the tick
        // position is not an edge anything can align to - the band's own edges are.
        describe('band-scale horizontal axes', () => {
            const renderBottomAxis = async (label?: TextAlignLabelOptions) => {
                if (chart != null) {
                    chart.destroy();
                    (chart as unknown) = undefined;
                }
                const options = bottomAxisOptions(label);
                chart = await createChart(options);
                return chart;
            };

            it('anchors an aligned label on its band edge instead of the tick', async () => {
                await renderBottomAxis();
                const bandwidth = getAxisBandwidth(chart, 'bottom');
                // Anti-vacuous: a zero bandwidth would make every shift below trivially satisfied.
                expect(bandwidth).toBeGreaterThan(1);
                const tickAnchors = captureAnchorsByText(getAxisLabelNodes(chart, 'bottom'));
                expect(tickAnchors.size).toBe(3);

                await renderBottomAxis({ textAlign: 'right' });
                for (const node of getAxisLabelNodes(chart, 'bottom')) {
                    const atTick = tickAnchors.get(getLabelText(node));
                    expect(atTick).toBeDefined();
                    expect(node.datum.x).toBeCloseTo(atTick!.x + bandwidth / 2, 5);
                    expect(node.datum.rotationCenterX).toBeCloseTo(atTick!.x + bandwidth / 2, 5);
                }

                await renderBottomAxis({ textAlign: 'left' });
                for (const node of getAxisLabelNodes(chart, 'bottom')) {
                    const atTick = tickAnchors.get(getLabelText(node));
                    expect(node.datum.x).toBeCloseTo(atTick!.x - bandwidth / 2, 5);
                }

                // `'center'` means the middle of the band, which is where the tick already is.
                await renderBottomAxis({ textAlign: 'center' });
                for (const node of getAxisLabelNodes(chart, 'bottom')) {
                    const atTick = tickAnchors.get(getLabelText(node));
                    expect(node.datum.x).toBeCloseTo(atTick!.x, 5);
                }
            });

            it('renders "right"-aligned labels flush with the right edge of their band', async () => {
                await renderBottomAxis({ textAlign: 'right' });
                const nodes = getAxisLabelNodes(chart, 'bottom');
                expect(nodes.length).toBe(3);

                // A band runs from where the scale places its category to one bandwidth beyond, so
                // the closed form is what the anchor must land on - not a delta off the tick.
                const renderedRightEdges = new Set<number>();
                for (const node of nodes) {
                    const bandRightEdge = getAxisBandExtent(chart, 'bottom', node.datum.text).end;
                    expect(node.datum.x).toBeCloseTo(bandRightEdge, 5);

                    // `'right'` anchors the glyphs' right edge, so the rendered box must end on the
                    // anchor - offset only by the axis group's own placement, which is shared.
                    const box = Transformable.toCanvas(node);
                    renderedRightEdges.add(Math.round((box.x + box.width - node.datum.x) * 10) / 10);
                }
                expect(renderedRightEdges.size).toBe(1);
            });

            it('leaves a continuous horizontal axis anchored on its ticks', async () => {
                const continuousOptions = (label?: TextAlignLabelOptions): AgCartesianChartOptions => ({
                    data: TEXT_ALIGN_CATEGORY_DATA,
                    axes: {
                        x: { type: 'number', position: 'bottom', ...(label ? { label } : {}) },
                        y: { type: 'number', position: 'left' },
                    },
                    series: [{ type: 'scatter', xKey: 'value', yKey: 'value' }],
                });

                const naturalOptions = continuousOptions();
                chart = await createChart(naturalOptions);
                const tickAnchors = captureAnchorsByText(getAxisLabelNodes(chart, 'bottom'));
                expect(tickAnchors.size).toBeGreaterThan(1);

                chart.destroy();
                (chart as unknown) = undefined;

                const alignedOptions = continuousOptions({ textAlign: 'right' });
                chart = await createChart(alignedOptions);

                for (const node of getAxisLabelNodes(chart, 'bottom')) {
                    const natural = tickAnchors.get(getLabelText(node));
                    expect(natural).toBeDefined();
                    expect(node.datum.x).toBeCloseTo(natural!.x, 5);
                }
            });

            // Overflow removal only measures label edges on a horizontal continuous axis, so this is
            // the one fixture whose alignment reaches the edge arithmetic rather than the anchoring.
            it('measures overflow against the resolved alignment on a continuous horizontal axis', async () => {
                const continuousOptions = (textAlign: TextAlign): AgCartesianChartOptions => ({
                    data: TEXT_ALIGN_CATEGORY_DATA,
                    enableRtl: true,
                    axes: {
                        x: { type: 'number', position: 'bottom', label: { textAlign } },
                        y: { type: 'number', position: 'left' },
                    },
                    series: [{ type: 'scatter', xKey: 'value', yKey: 'value' }],
                });

                const render = async (textAlign: TextAlign) => {
                    if (chart != null) {
                        chart.destroy();
                        (chart as unknown) = undefined;
                    }
                    const options = continuousOptions(textAlign);
                    chart = await createChart(options);
                    return getAxisLabelNodes(chart, 'bottom');
                };

                const resolvedAnchors = captureAnchorsByText(await render('left'));
                expect(resolvedAnchors.size).toBeGreaterThan(1);

                const nodes = await render('end');
                expect(nodes.length).toBe(resolvedAnchors.size);
                for (const node of nodes) {
                    expect(node.datum.textAlign).toBe('left');
                    const resolved = resolvedAnchors.get(getLabelText(node));
                    expect(resolved).toBeDefined();
                    expect(node.datum.x).toBeCloseTo(resolved!.x, 5);
                }
            });
        });

        // A top axis reserves its band on the opposite side of the axis line from a bottom one.
        it('keeps rotated labels out of the series area on a top-positioned axis', async () => {
            const options: AgCartesianChartOptions = {
                data: TEXT_ALIGN_CATEGORY_DATA,
                axes: {
                    x: { type: 'category', position: 'top', label: { rotation: -30, textAlign: 'left' } },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            };
            chart = await createChart(options);

            const nodes = getAxisLabelNodes(chart, 'top');
            expect(nodes.length).toBe(3);

            const seriesTop = getSeriesRect(chart).y;
            for (const node of nodes) {
                const box = Transformable.toCanvas(node);
                expect(box.y + box.height).toBeLessThanOrEqual(seriesTop);
                expect(box.y).toBeGreaterThanOrEqual(0);
            }
        });
    });

    // `axis.label.verticalAlign` is the vertical transpose of `textAlign` above: on a horizontal axis
    // it re-anchors labels within the reserved band, outward of the axis line; on a vertical axis it
    // overrides the label's own baseline (and, on a banded scale, the band edge it anchors against).
    describe('axis label verticalAlign', () => {
        it.each([
            ['bottom', 'top'],
            ['top', 'bottom'],
            ['left', 'middle'],
            ['right', 'middle'],
        ] as const)('AC1: the natural, unconfigured baseline for a "%s" axis is "%s"', async (position, expected) => {
            const factory = {
                bottom: bottomAxisOptions,
                top: topAxisOptions,
                left: leftAxisOptions,
                right: rightAxisOptions,
            }[position];
            const options = factory();
            chart = await createChart(options);

            const nodes = getAxisLabelNodes(chart, position);
            expect(nodes.length).toBeGreaterThan(0);
            for (const node of nodes) {
                expect(node.datum.textBaseline).toBe(expected);
            }
        });

        describe('AC1: differing-height bottom axis labels', () => {
            const measuredHeights = (nodes: AxisLabelNode[]) => nodes.map((n) => Transformable.toCanvas(n).height);

            it('flushes glyph edges while the opposite edges keep differing', async () => {
                const naturalOptions = wrappedBottomAxisOptions();
                chart = await createChart(naturalOptions);
                const naturalHeights = measuredHeights(getAxisLabelNodes(chart, 'bottom'));
                // Anti-vacuous: the fixture's unequal word counts must produce a genuine spread of
                // wrapped label heights, otherwise a flush edge would hold trivially for any align.
                expect(Math.max(...naturalHeights) - Math.min(...naturalHeights)).toBeGreaterThan(1);

                chart.destroy();
                (chart as unknown) = undefined;

                const bottomOptions = wrappedBottomAxisOptions({ verticalAlign: 'bottom' });
                chart = await createChart(bottomOptions);
                const bottomNodes = getAxisLabelNodes(chart, 'bottom');
                const bottomBoxes = bottomNodes.map((n) => Transformable.toCanvas(n));
                const bottomEdges = bottomBoxes.map((b) => b.y + b.height);
                const topEdgesUnderBottomAlign = bottomBoxes.map((b) => b.y);
                expect(Math.max(...bottomEdges) - Math.min(...bottomEdges)).toBeLessThanOrEqual(1);
                expect(Math.max(...topEdgesUnderBottomAlign) - Math.min(...topEdgesUnderBottomAlign)).toBeGreaterThan(
                    1
                );

                chart.destroy();
                (chart as unknown) = undefined;

                const topOptions = wrappedBottomAxisOptions({ verticalAlign: 'top' });
                chart = await createChart(topOptions);
                const topNodes = getAxisLabelNodes(chart, 'bottom');
                const topBoxes = topNodes.map((n) => Transformable.toCanvas(n));
                const topEdges = topBoxes.map((b) => b.y);
                const bottomEdgesUnderTopAlign = topBoxes.map((b) => b.y + b.height);
                expect(Math.max(...topEdges) - Math.min(...topEdges)).toBeLessThanOrEqual(1);
                expect(Math.max(...bottomEdgesUnderTopAlign) - Math.min(...bottomEdgesUnderTopAlign)).toBeGreaterThan(
                    1
                );
            });

            it('flushes segmented labels on an unrotated axis, leaving each segment on its own baseline', async () => {
                const segmentedOptions = (label?: TextAlignLabelOptions) =>
                    wrappedBottomAxisOptions({
                        ...label,
                        formatter: ({ value }) => [
                            { text: String(value).slice(0, 2), fontSize: 18 },
                            { text: ` ${String(value)}`, fontSize: 10, verticalAlign: 'top' as const },
                        ],
                    });

                const naturalOptions = segmentedOptions();
                chart = await createChart(naturalOptions);
                const naturalHeights = measuredHeights(getAxisLabelNodes(chart, 'bottom'));
                expect(Math.max(...naturalHeights) - Math.min(...naturalHeights)).toBeGreaterThan(1);

                chart.destroy();
                (chart as unknown) = undefined;

                const bottomOptions = segmentedOptions({ verticalAlign: 'bottom' });
                chart = await createChart(bottomOptions);
                const nodes = getAxisLabelNodes(chart, 'bottom');
                const boxes = nodes.map((n) => Transformable.toCanvas(n));
                const bottomEdges = boxes.map((b) => b.y + b.height);
                expect(Math.max(...bottomEdges) - Math.min(...bottomEdges)).toBeLessThanOrEqual(1);
                expect(Math.max(...boxes.map((b) => b.y)) - Math.min(...boxes.map((b) => b.y))).toBeGreaterThan(1);

                for (const node of nodes) {
                    const [first, ...rest] = getLabelSegmentAlignments(node);
                    expect(rest.length).toBeGreaterThan(0);
                    expect(first).toBeUndefined();
                    for (const alignment of rest) {
                        expect(alignment).toBe('top');
                    }
                }
            });
        });

        it.each(['bottom', 'top'] as const)(
            'AC1: every verticalAlign on a "%s" axis keeps labels clear of the series area',
            async (position) => {
                const factory = position === 'bottom' ? bottomAxisOptions : topAxisOptions;
                for (const verticalAlign of ['top', 'middle', 'bottom'] as const) {
                    if (chart != null) {
                        chart.destroy();
                        (chart as unknown) = undefined;
                    }
                    const options = factory({ verticalAlign });
                    chart = await createChart(options);

                    const nodes = getAxisLabelNodes(chart, position);
                    expect(nodes.length).toBeGreaterThan(0);
                    const seriesRect = getSeriesRect(chart);
                    const seriesTop = seriesRect.y;
                    const seriesBottom = seriesRect.y + seriesRect.height;
                    for (const node of nodes) {
                        const box = Transformable.toCanvas(node);
                        if (position === 'bottom') {
                            expect(box.y).toBeGreaterThanOrEqual(seriesBottom - 1);
                        } else {
                            expect(box.y + box.height).toBeLessThanOrEqual(seriesTop + 1);
                        }
                    }
                }
            }
        );

        it('AC1: a banded right axis anchors "top"/"bottom" to band edges and stays inside the band', async () => {
            const getBandExtent = (chartInstance: AgChartInstance, text: string) =>
                getAxisBandExtent(chartInstance, 'right', text);

            // The rendered box sits in canvas space, offset from the datum's local `y` anchor by the
            // axis group's own placement - shared across every label on the axis, so it cancels out
            // of a same-axis comparison rather than being predicted from the raw scale value. A
            // `'top'`-baseline box's top edge sits at the anchor; a `'bottom'`-baseline box's bottom
            // edge does, so the edge to read the offset from depends on the baseline.
            const groupOffsetY = (nodes: AxisLabelNode[], edge: (box: { y: number; height: number }) => number) => {
                const offsets = new Set(
                    nodes.map((n) => Math.round((edge(Transformable.toCanvas(n)) - n.datum.y) * 10))
                );
                expect(offsets.size).toBe(1);
                return [...offsets][0] / 10;
            };
            const topEdge = (box: { y: number; height: number }) => box.y;
            const bottomEdge = (box: { y: number; height: number }) => box.y + box.height;

            const topOptions = rightAxisOptions({ verticalAlign: 'top' });
            chart = await createChart(topOptions);
            const topNodes = getAxisLabelNodes(chart, 'right');
            const topOffset = groupOffsetY(topNodes, topEdge);
            for (const node of topNodes) {
                const { start, end, bandwidth } = getBandExtent(chart, getLabelText(node));
                expect(bandwidth).toBeGreaterThan(1);
                const box = Transformable.toCanvas(node);
                expect(box.y).toBeCloseTo(start + topOffset, 1);
                expect(box.y).toBeGreaterThanOrEqual(start + topOffset - 1);
                expect(box.y + box.height).toBeLessThanOrEqual(end + topOffset + 1);
            }

            chart.destroy();
            (chart as unknown) = undefined;

            const bottomOptions = rightAxisOptions({ verticalAlign: 'bottom' });
            chart = await createChart(bottomOptions);
            const bottomNodes = getAxisLabelNodes(chart, 'right');
            const bottomOffset = groupOffsetY(bottomNodes, bottomEdge);
            for (const node of bottomNodes) {
                const { start, end } = getBandExtent(chart, getLabelText(node));
                const box = Transformable.toCanvas(node);
                expect(box.y + box.height).toBeCloseTo(end + bottomOffset, 1);
                expect(box.y).toBeGreaterThanOrEqual(start + bottomOffset - 1);
                expect(box.y + box.height).toBeLessThanOrEqual(end + bottomOffset + 1);
            }
        });

        it("AC1: 'middle' on a horizontal axis centres the glyph box within the reserved band", async () => {
            const topAlignOptions = wrappedBottomAxisOptions({ verticalAlign: 'top' });
            chart = await createChart(topAlignOptions);
            const topBoxes = getAxisLabelNodes(chart, 'bottom').map((n) => Transformable.toCanvas(n));
            const bandTop = Math.min(...topBoxes.map((b) => b.y));

            chart.destroy();
            (chart as unknown) = undefined;

            const bottomAlignOptions = wrappedBottomAxisOptions({ verticalAlign: 'bottom' });
            chart = await createChart(bottomAlignOptions);
            const bottomBoxes = getAxisLabelNodes(chart, 'bottom').map((n) => Transformable.toCanvas(n));
            const bandBottom = Math.max(...bottomBoxes.map((b) => b.y + b.height));

            chart.destroy();
            (chart as unknown) = undefined;

            const middleOptions = wrappedBottomAxisOptions({ verticalAlign: 'middle' });
            chart = await createChart(middleOptions);
            const middleBoxes = getAxisLabelNodes(chart, 'bottom').map((n) => Transformable.toCanvas(n));
            const bandCentre = (bandTop + bandBottom) / 2;
            for (const box of middleBoxes) {
                const boxCentre = box.y + box.height / 2;
                expect(boxCentre).toBeCloseTo(bandCentre, 0);
            }
        });

        describe('AC2: unset leaves every datum unchanged', () => {
            const scaleFixtures = {
                category: {
                    data: TEXT_ALIGN_CATEGORY_DATA,
                    primaryKey: 'category',
                    secondaryKey: 'value',
                    seriesType: 'bar' as const,
                },
                number: { data: NUMERIC_DATA, primaryKey: 'x', secondaryKey: 'y', seriesType: 'line' as const },
                time: { data: TIME_DATA, primaryKey: 'date', secondaryKey: 'value', seriesType: 'line' as const },
            };

            const scaleOptions = (
                scaleType: keyof typeof scaleFixtures,
                position: 'bottom' | 'top' | 'left' | 'right',
                label?: TextAlignLabelOptions
            ): AgCartesianChartOptions => {
                const { data, primaryKey, secondaryKey, seriesType } = scaleFixtures[scaleType];
                const horizontal = position === 'bottom' || position === 'top';
                const primaryAxis: any = { type: scaleType, position, ...(label ? { label } : {}) };
                const secondaryAxis: any = { type: 'number', position: horizontal ? 'left' : 'bottom' };
                const series: any = horizontal
                    ? { type: seriesType, xKey: primaryKey, yKey: secondaryKey }
                    : {
                          type: seriesType,
                          xKey: secondaryKey,
                          yKey: primaryKey,
                          ...(seriesType === 'bar' ? { direction: 'horizontal' } : {}),
                      };
                return {
                    data,
                    axes: horizontal ? { x: primaryAxis, y: secondaryAxis } : { x: secondaryAxis, y: primaryAxis },
                    series: [series],
                };
            };

            // Keyed by `tickId` rather than label text: a time axis routinely repeats a formatted
            // value (e.g. midnight) across several ticks, which `captureAnchorsByText` would collapse.
            const captureAnchorsByTickId = (nodes: AxisLabelNode[]) =>
                new Map(
                    nodes.map((n) => [
                        n.datum.tickId,
                        {
                            x: n.datum.x,
                            y: n.datum.y,
                            rotationCenterX: n.datum.rotationCenterX,
                            rotationCenterY: n.datum.rotationCenterY,
                            textBaseline: n.datum.textBaseline,
                            textAlign: n.datum.textAlign,
                        },
                    ])
                );

            const positions = ['bottom', 'top', 'left', 'right'] as const;
            const scaleTypes = ['category', 'number', 'time'] as const;

            it.each(scaleTypes.flatMap((scaleType) => positions.map((position) => [scaleType, position] as const)))(
                'produces byte-identical datums for a "%s" scale at position "%s"',
                async (scaleType, position) => {
                    const omittedOptions = scaleOptions(scaleType, position);
                    chart = await createChart(omittedOptions);
                    const omittedAnchors = captureAnchorsByTickId(getAxisLabelNodes(chart, position));
                    expect(omittedAnchors.size).toBeGreaterThan(0);

                    chart.destroy();
                    (chart as unknown) = undefined;

                    const explicitOptions = scaleOptions(scaleType, position, { verticalAlign: undefined });
                    chart = await createChart(explicitOptions);
                    const explicitNodes = getAxisLabelNodes(chart, position);

                    expect(explicitNodes.length).toBe(omittedAnchors.size);
                    for (const node of explicitNodes) {
                        const omitted = omittedAnchors.get(node.datum.tickId);
                        expect(omitted).toBeDefined();
                        expect(node.datum).toMatchObject(omitted!);
                    }
                }
            );
        });

        it('TC1: rotation 45 on a bottom axis follows the rotated glyph box, clear of the series area', async () => {
            const options = bottomAxisOptions({ rotation: 45, verticalAlign: 'bottom' });
            chart = await createChart(options);

            const nodes = getAxisLabelNodes(chart, 'bottom');
            expect(nodes.length).toBe(3);

            const seriesRect = getSeriesRect(chart);
            const seriesBottom = seriesRect.y + seriesRect.height;
            const boxes = nodes.map((n) => Transformable.toCanvas(n));
            for (const box of boxes) {
                expect(box.y).toBeGreaterThanOrEqual(seriesBottom - 1);
            }

            const bottomEdges = boxes.map((b) => b.y + b.height);
            for (const edge of bottomEdges) {
                expect(edge).toBeCloseTo(bottomEdges[0], 0);
            }
        });

        const renderChart = async (options: AgCartesianChartOptions, width?: number) => {
            if (chart != null) {
                chart.destroy();
                (chart as unknown) = undefined;
            }
            prepareTestOptions(options);
            if (width != null) options.width = width;
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return chart;
        };

        const canvasBoxesByText = (position: string) =>
            new Map(getAxisLabelNodes(chart, position).map((n) => [getLabelText(n), Transformable.toCanvas(n)]));

        // On a horizontal axis the value the axis computes for itself already flushes the labels to
        // that edge of the band, so asking for it again has nothing left to move.
        describe('AC2: a verticalAlign equal to the computed baseline is a no-op', () => {
            it.each([
                ['bottom', 'top', 'middle'],
                ['top', 'bottom', 'middle'],
            ] as const)(
                'leaves single-line "%s" axis labels untouched under "%s"',
                async (position, computed, moving) => {
                    const factory = position === 'bottom' ? bottomAxisOptions : topAxisOptions;

                    await renderChart(factory());
                    const naturalAnchors = captureAnchorsByText(getAxisLabelNodes(chart, position));
                    expect(naturalAnchors.size).toBe(3);

                    await renderChart(factory({ verticalAlign: computed }));
                    const matchedNodes = getAxisLabelNodes(chart, position);
                    expect(matchedNodes.length).toBe(3);
                    for (const node of matchedNodes) {
                        const natural = naturalAnchors.get(getLabelText(node));
                        expect(natural).toBeDefined();
                        expect(node.datum).toMatchObject(natural!);
                    }

                    // Anti-vacuous: the comparison must be able to see a move, so a different value
                    // on the same fixture has to shift the anchors it just found identical.
                    await renderChart(factory({ verticalAlign: moving }));
                    const movedYs = getAxisLabelNodes(chart, position).map((n) => n.datum.y);
                    expect(movedYs.some((y, i) => y !== [...naturalAnchors.values()][i].y)).toBe(true);
                }
            );

            it('leaves wrapped, differing-height bottom axis labels untouched under "top"', async () => {
                await renderChart(wrappedBottomAxisOptions());
                const naturalAnchors = captureAnchorsByText(getAxisLabelNodes(chart, 'bottom'));
                const naturalBoxes = canvasBoxesByText('bottom');
                const naturalHeights = [...naturalBoxes.values()].map((b) => b.height);
                // Anti-vacuous: without a genuine spread of label heights every alignment collapses
                // onto the same anchors and the no-op would hold trivially.
                expect(Math.max(...naturalHeights) - Math.min(...naturalHeights)).toBeGreaterThan(1);

                await renderChart(wrappedBottomAxisOptions({ verticalAlign: 'top' }));
                const nodes = getAxisLabelNodes(chart, 'bottom');
                expect(nodes.length).toBe(naturalAnchors.size);
                for (const node of nodes) {
                    const natural = naturalAnchors.get(getLabelText(node));
                    expect(natural).toBeDefined();
                    expect(node.datum).toMatchObject(natural!);

                    const naturalBox = naturalBoxes.get(getLabelText(node));
                    expect(naturalBox).toBeDefined();
                    const box = Transformable.toCanvas(node);
                    expect(box.y).toBeCloseTo(naturalBox!.y, 5);
                    expect(box.height).toBeCloseTo(naturalBox!.height, 5);
                }
            });
        });

        // A continuous vertical axis aligns each label around its own tick anchor, not within a band.
        it('AC1: a continuous vertical axis moves each label around its own tick anchor', async () => {
            await renderChart(leftAxisOptions());
            // Anti-vacuous for "own anchor": a continuous scale has no band whose edges a label
            // could have been flushed to instead.
            expect(getAxisBandwidth(chart, 'left')).toBe(0);

            const naturalAnchors = captureAnchorsByText(getAxisLabelNodes(chart, 'left'));
            const naturalBoxes = canvasBoxesByText('left');
            expect(naturalBoxes.size).toBeGreaterThan(1);

            await renderChart(leftAxisOptions({ verticalAlign: 'middle' }));
            for (const node of getAxisLabelNodes(chart, 'left')) {
                const natural = naturalAnchors.get(getLabelText(node));
                expect(natural).toBeDefined();
                expect(node.datum).toMatchObject(natural!);
            }

            for (const [verticalAlign, textBaseline, direction] of [
                ['top', 'bottom', -1],
                ['bottom', 'top', 1],
            ] as const) {
                await renderChart(leftAxisOptions({ verticalAlign }));
                const nodes = getAxisLabelNodes(chart, 'left');
                expect(nodes.length).toBe(naturalBoxes.size);
                for (const node of nodes) {
                    const natural = naturalAnchors.get(getLabelText(node));
                    const naturalBox = naturalBoxes.get(getLabelText(node));
                    expect(naturalBox).toBeDefined();
                    // The anchor stays on the tick; only the baseline the glyphs hang from changes.
                    expect(node.datum.y).toBeCloseTo(natural!.y, 5);
                    expect(node.datum.textBaseline).toBe(textBaseline);

                    const box = Transformable.toCanvas(node);
                    expect(box.y).toBeCloseTo(naturalBox!.y + (direction * naturalBox!.height) / 2, 1);
                }
            }
        });

        it('TC1: rotation 45 on a left axis keeps every verticalAlign inside the axis column', async () => {
            const innerEdgesByAlign = new Map<string, number[]>();
            const anchorsByAlign = new Map<string, number>();

            for (const verticalAlign of ['top', 'middle', 'bottom'] as const) {
                await renderChart(leftAxisOptions({ rotation: 45, verticalAlign }));
                const nodes = getAxisLabelNodes(chart, 'left');
                expect(nodes.length).toBeGreaterThan(1);
                for (const node of nodes) {
                    expect(node.datum.rotation).not.toBe(0);
                }

                // The series paints over the series area, so on a vertical axis it is the label's
                // x extent - not its y extent - that a rotation can push into it.
                const seriesLeft = getSeriesRect(chart).x;
                const boxes = nodes.map((n) => Transformable.toCanvas(n));
                for (const box of boxes) {
                    expect(box.x + box.width).toBeLessThanOrEqual(seriesLeft + 1);
                    expect(box.x).toBeGreaterThanOrEqual(0);
                }

                innerEdgesByAlign.set(
                    verticalAlign,
                    boxes.map((b) => b.x + b.width)
                );
                anchorsByAlign.set(verticalAlign, nodes[0].datum.x);
            }

            // The correction pins the column's inner edge whatever the alignment does along the axis.
            const allInnerEdges = [...innerEdgesByAlign.values()].flat();
            expect(Math.max(...allInnerEdges) - Math.min(...allInnerEdges)).toBeLessThanOrEqual(1);
            // Anti-vacuous: the three alignments must genuinely place different anchors, otherwise
            // the shared inner edge says nothing.
            expect(new Set([...anchorsByAlign.values()].map((x) => Math.round(x))).size).toBe(3);
        });

        describe('TC1: textAlign and verticalAlign set together on a rotated axis', () => {
            it('lets each option own its own direction on a horizontal axis', async () => {
                await renderChart(bottomAxisOptions({ rotation: 45, verticalAlign: 'bottom' }));
                const verticalOnly = captureAnchorsByText(getAxisLabelNodes(chart, 'bottom'));
                const verticalOnlyBoxes = canvasBoxesByText('bottom');

                await renderChart(bottomAxisOptions({ rotation: 45, textAlign: 'right' }));
                const horizontalOnly = captureAnchorsByText(getAxisLabelNodes(chart, 'bottom'));

                await renderChart(bottomAxisOptions({ rotation: 45, textAlign: 'right', verticalAlign: 'bottom' }));
                const nodes = getAxisLabelNodes(chart, 'bottom');
                expect(nodes.length).toBe(3);
                for (const node of nodes) {
                    const alongAxis = horizontalOnly.get(getLabelText(node));
                    const acrossAxis = verticalOnly.get(getLabelText(node));
                    const acrossAxisBox = verticalOnlyBoxes.get(getLabelText(node));
                    expect(alongAxis).toBeDefined();
                    expect(acrossAxis).toBeDefined();
                    expect(acrossAxisBox).toBeDefined();

                    expect(node.datum.x).toBeCloseTo(alongAxis!.x, 5);
                    // The flush is a statement about the glyphs, and `textAlign` moves those
                    // relative to the anchor, so the rendered edge is what has to survive the
                    // second option - an anchor comparison cannot see the box move.
                    const box = Transformable.toCanvas(node);
                    expect(box.y + box.height).toBeCloseTo(acrossAxisBox!.y + acrossAxisBox!.height, 1);
                    // Anti-vacuous: neither single-option layout already produces the combined one,
                    // so the two coordinates come from different sources.
                    expect(node.datum.y).not.toBeCloseTo(alongAxis!.y, 1);
                    expect(node.datum.x).not.toBeCloseTo(acrossAxis!.x, 1);
                }
            });

            it('keeps the band flush and re-baselines along the axis on a vertical axis', async () => {
                await renderChart(rightAxisOptions({ rotation: 45, textAlign: 'right' }));
                const horizontalOnly = captureAnchorsByText(getAxisLabelNodes(chart, 'right'));
                const horizontalOnlyBoxes = canvasBoxesByText('right');

                await renderChart(rightAxisOptions({ rotation: 45, textAlign: 'right', verticalAlign: 'bottom' }));
                const nodes = getAxisLabelNodes(chart, 'right');
                expect(nodes.length).toBe(3);
                for (const node of nodes) {
                    const flushed = horizontalOnly.get(getLabelText(node));
                    const flushedBox = horizontalOnlyBoxes.get(getLabelText(node));
                    expect(flushed).toBeDefined();
                    expect(flushedBox).toBeDefined();

                    // `textAlign` owns the cross-axis direction: the rendered flush is untouched by
                    // the verticalAlign, which acts along the axis instead. The anchor itself moves
                    // with the baseline, so it is the glyph box that has to land in the same column.
                    const box = Transformable.toCanvas(node);
                    expect(box.x).toBeCloseTo(flushedBox!.x, 1);
                    expect(box.x + box.width).toBeCloseTo(flushedBox!.x + flushedBox!.width, 1);
                    expect(node.datum.textBaseline).toBe('bottom');
                    expect(node.datum.x).not.toBeCloseTo(flushed!.x, 1);
                    expect(box.y).not.toBeCloseTo(flushedBox!.y, 1);
                }
            });
        });

        // The frame `axisLabelsOverlap` compares in: every label shares one rotation, and each is
        // rotated about its own anchor, so rotating the whole layout back by that rotation leaves
        // every glyph box axis-aligned again. Backing a rendered box out of the shared rotation
        // gives `glyph - anchor + rotate(anchor, -rotation)`, so the glyph box has to be taken
        // RELATIVE to its anchor - `computeBBoxWithoutTransforms()` is measured at `node.x`/`node.y`
        // and already carries it, and adding the rotated anchor without subtracting it counts the
        // anchor twice and reports rotated neighbours as clear.
        const collidingPairs = (nodes: AxisLabelNode[]) => {
            const boxes = nodes.map((node) => {
                const local = getLocalBox(node);
                const anchor = rotatePoint(node.x, node.y, -node.rotation);
                return {
                    x: local.x - node.x + anchor.x,
                    y: local.y - node.y + anchor.y,
                    w: local.width,
                    h: local.height,
                };
            });
            let count = 0;
            for (let i = 0; i < boxes.length; i += 1) {
                for (let j = i + 1; j < boxes.length; j += 1) {
                    const a = boxes[i];
                    const b = boxes[j];
                    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) count += 1;
                }
            }
            return count;
        };

        // The band a rotated horizontal axis flushes into is reconstructed from where the axis's own
        // computed alignment would have put the glyphs, so both of these are about that
        // reconstruction rather than about the flush itself.
        describe('the reserved band on a rotated horizontal axis', () => {
            it('derives the band from the natural placement when textAlign is also set', async () => {
                await renderChart(bottomAxisOptions({ rotation: 45, textAlign: 'right', verticalAlign: 'bottom' }));
                const nodes = getAxisLabelNodes(chart, 'bottom');
                expect(nodes.length).toBe(3);

                const seriesRect = getSeriesRect(chart);
                const seriesBottom = seriesRect.y + seriesRect.height;
                for (const node of nodes) {
                    // The rendered glyphs, not the anchor: a band derived from the overridden
                    // horizontal alignment moves the whole box, which an anchor comparison misses.
                    const box = Transformable.toCanvas(node);
                    expect(box.y).toBeGreaterThanOrEqual(seriesBottom - 1);
                }
            });

            it('flushes labels of differing heights to one common edge', async () => {
                // A per-label font size is the cheapest way to get genuinely differing label heights
                // under rotation, where the available width no longer forces a wrap.
                const sizedLabel: NonNullable<TextAlignLabelOptions['formatter']> = ({ value }) => [
                    { text: String(value), fontSize: String(value).length > 3 ? 36 : 12 },
                ];

                await renderChart(bottomAxisOptions({ rotation: 45, verticalAlign: 'bottom', formatter: sizedLabel }));
                const nodes = getAxisLabelNodes(chart, 'bottom');
                expect(nodes.length).toBe(3);
                const boxes = nodes.map((n) => Transformable.toCanvas(n));
                // Anti-vacuous: the labels must really differ in height, otherwise one common edge
                // holds for any band origin.
                const unrotatedHeights = nodes.map((n) => {
                    const { text } = n.datum;
                    const first = Array.isArray(text) ? text[0] : undefined;
                    return first != null && 'fontSize' in first ? (first.fontSize ?? 0) : 0;
                });
                expect(Math.max(...unrotatedHeights) - Math.min(...unrotatedHeights)).toBeGreaterThan(1);

                const bottomEdges = boxes.map((b) => b.y + b.height);
                expect(Math.max(...bottomEdges) - Math.min(...bottomEdges)).toBeLessThanOrEqual(1);
            });

            // The flush moves each label across the axis by a different amount, and under rotation a
            // cross-axis move is partly along the label's own text direction - so collision
            // avoidance has to run against the flushed geometry, not the anchor it starts from.
            describe('collision avoidance', () => {
                // Alternating short and long labels: a uniform tier flushes as one block, so only
                // differing sizes can pull neighbours into each other.
                const denseOptions = (
                    verticalAlign?: VerticalAlign,
                    avoidCollisions = true
                ): AgCartesianChartOptions => ({
                    data: Array.from({ length: 30 }, (_, i) => ({
                        category: i % 2 === 0 ? `A${i}` : `ABCDE${i}`,
                        value: i,
                    })),
                    width: 600,
                    height: 400,
                    axes: {
                        x: {
                            type: 'category',
                            position: 'bottom',
                            label: {
                                rotation: 45,
                                avoidCollisions,
                                ...(verticalAlign == null ? {} : { verticalAlign }),
                            },
                        },
                        y: { type: 'number', position: 'left' },
                    },
                    series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                });

                // The suite's verdicts are all "no collisions", which a probe that under-reports
                // would satisfy for free - so prove the probe can see an overlap in exactly this
                // geometry before trusting it to say there is none.
                it('reports the overlaps the same axis has with collision avoidance off', async () => {
                    await renderChart(denseOptions('middle', false));
                    const nodes = getAxisLabelNodes(chart, 'bottom');
                    expect(nodes.length).toBe(30);
                    expect(collidingPairs(nodes)).toBeGreaterThan(0);
                });

                it.each(['top', 'middle', 'bottom'] as VerticalAlign[])(
                    'keeps rotated labels of differing sizes clear of each other under verticalAlign "%s"',
                    async (verticalAlign) => {
                        await renderChart(denseOptions());
                        const baseline = getAxisLabelNodes(chart, 'bottom');
                        // Anti-vacuous: the unaligned axis must itself be collision-free and actually
                        // be labelling something, otherwise the aligned run proves nothing.
                        expect(baseline.length).toBeGreaterThan(1);
                        expect(collidingPairs(baseline)).toBe(0);

                        await renderChart(denseOptions(verticalAlign));
                        const nodes = getAxisLabelNodes(chart, 'bottom');
                        expect(nodes.length).toBeGreaterThan(1);
                        expect(collidingPairs(nodes)).toBe(0);
                    }
                );
            });
        });

        describe('rotated label spacing from the axis line', () => {
            const STACKED_DATA = [
                { category: 'Ant', value: 10 },
                { category: 'Ant Bee', value: 20 },
                { category: 'Ant Bee Cricket', value: 15 },
            ];

            const multiline = ({ value }: { value: unknown }) => String(value).split(' ').join('\n');
            const labelVariants = {
                plain: { formatter: multiline },
                segmented: {
                    formatter: ({ value }: { value: unknown }) =>
                        String(value)
                            .split(' ')
                            .map((word, i) => ({ text: i === 0 ? word : `\n${word}`, fontSize: i === 0 ? 18 : 10 })),
                },
                boxed: { formatter: multiline, fill: 'lightgrey', padding: { top: 4, right: 12, bottom: 8, left: 2 } },
                styled: {
                    formatter: multiline,
                    itemStyler: () => ({ fill: 'lightgrey', padding: { top: 4, right: 12, bottom: 8, left: 2 } }),
                },
            };
            type Position = 'bottom' | 'left' | 'top' | 'right';

            const stackedOptions = (
                position: Position,
                variant: keyof typeof labelVariants,
                rotation: number,
                alignment: object = {}
            ): AgCartesianChartOptions => {
                const horizontal = position === 'bottom' || position === 'top';
                const categoryAxis: any = {
                    type: 'category',
                    position,
                    label: { rotation, avoidCollisions: false, ...labelVariants[variant], ...alignment },
                };
                const valueAxis: any = { type: 'number', position: horizontal ? 'left' : 'bottom' };
                return {
                    data: STACKED_DATA,
                    width: 600,
                    height: 400,
                    axes: horizontal ? { x: categoryAxis, y: valueAxis } : { x: valueAxis, y: categoryAxis },
                    series: [
                        horizontal
                            ? { type: 'bar', xKey: 'category', yKey: 'value' }
                            : { type: 'bar', direction: 'horizontal', xKey: 'category', yKey: 'value' },
                    ],
                };
            };

            // How far the edge of each label's rendered box nearest the axis line sits from the series area.
            const innerGaps = (nodes: AxisLabelNode[], position: Position) => {
                const seriesRect = getSeriesRect(chart);
                return nodes.map((n) => {
                    const box = Transformable.toCanvas(n);
                    switch (position) {
                        case 'bottom':
                            return box.y - (seriesRect.y + seriesRect.height);
                        case 'top':
                            return seriesRect.y - (box.y + box.height);
                        case 'left':
                            return seriesRect.x - (box.x + box.width);
                        case 'right':
                            return box.x - (seriesRect.x + seriesRect.width);
                    }
                });
            };

            it.each(
                (['bottom', 'left', 'top', 'right'] as const).flatMap((position) =>
                    (['plain', 'segmented', 'boxed', 'styled'] as const).flatMap((variant) =>
                        [-30, 45].map((rotation) => [position, variant, rotation] as const)
                    )
                )
            )(
                'keeps every %s axis label box at the unrotated gap (%s text, rotation %d)',
                async (position, variant, rotation) => {
                    await renderChart(stackedOptions(position, variant, 0));
                    const unrotated = innerGaps(getAxisLabelNodes(chart, position), position);
                    expect(unrotated.length).toBe(3);
                    expect(Math.max(...unrotated) - Math.min(...unrotated)).toBeLessThanOrEqual(1);

                    await renderChart(stackedOptions(position, variant, rotation));
                    const nodes = getAxisLabelNodes(chart, position);
                    // Anti-vacuous: the labels must differ in line count, or a common edge holds for any anchor.
                    const heights = nodes.map((n) => getLocalBox(n).height);
                    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(10);

                    for (const gap of innerGaps(nodes, position)) {
                        expect(gap).toBeCloseTo(unrotated[0], 0);
                    }
                }
            );

            // The alignment that already holds for an unrotated label must leave its drawn box alone.
            it.each([
                ['bottom', { verticalAlign: 'top' }],
                ['top', { verticalAlign: 'bottom' }],
                ['left', { textAlign: 'right' }],
                ['right', { textAlign: 'left' }],
            ] as const)('keeps an unrotated boxed %s axis label box in place under %o', async (position, alignment) => {
                await renderChart(stackedOptions(position, 'boxed', 0));
                const natural = innerGaps(getAxisLabelNodes(chart, position), position);

                await renderChart(stackedOptions(position, 'boxed', 0, alignment));
                const aligned = innerGaps(getAxisLabelNodes(chart, position), position);
                expect(aligned.length).toBe(3);
                for (const [i, gap] of aligned.entries()) {
                    expect(gap).toBeCloseTo(natural[i], 0);
                }
            });

            // The pin moves labels of differing line counts by differing amounts, so collision
            // avoidance has to see the move on a vertical axis too.
            describe('collision avoidance on a rotated vertical axis', () => {
                // Five line counts cycling, so whichever ticks thinning keeps, neighbours still differ.
                const LINES = ['A', 'B C', 'D E F G', 'H I', 'J K L M N'];
                const denseOptions = (
                    count: number,
                    rotation: number,
                    avoidCollisions: boolean
                ): AgCartesianChartOptions => ({
                    data: Array.from({ length: count }, (_, i) => ({ category: `${LINES[i % 5]}${i}`, value: i })),
                    width: 600,
                    height: 400,
                    axes: {
                        x: { type: 'number', position: 'bottom' },
                        y: {
                            type: 'category',
                            position: 'left',
                            label: { rotation, avoidCollisions, formatter: multiline },
                        },
                    },
                    series: [{ type: 'bar', direction: 'horizontal', xKey: 'category', yKey: 'value' }],
                });

                it.each([
                    [40, 60],
                    [60, 45],
                ])('leaves no overlapping pair of %d labels at rotation %d', async (count, rotation) => {
                    await renderChart(denseOptions(count, rotation, false));
                    // Anti-vacuous: without avoidance this geometry really does overlap.
                    expect(collidingPairs(getAxisLabelNodes(chart, 'left'))).toBeGreaterThan(0);

                    await renderChart(denseOptions(count, rotation, true));
                    const nodes = getAxisLabelNodes(chart, 'left');
                    expect(nodes.length).toBeGreaterThan(1);
                    expect(collidingPairs(nodes)).toBe(0);
                });
            });
        });

        // The offsets collision avoidance measures are read off the label nodes, which carry the
        // rotation the axis RENDERS with - not the frame the overlap check compares in, which a
        // parallel axis lays out a quarter turn from it. An unrotated horizontal axis flushes purely
        // across the row, so it cannot change the separation along the row: the tick set has to be
        // the one the unaligned axis produces, and measuring the wrong frame turns differing label
        // WIDTHS into band depths and invents a flush that is not there.
        describe('collision avoidance on an unrotated horizontal axis', () => {
            // Alternating short and long labels, so any width-derived offset differs per label.
            const unequalWidthOptions = (verticalAlign?: VerticalAlign): AgCartesianChartOptions => ({
                data: Array.from({ length: 12 }, (_, i) => ({
                    category: i % 2 === 0 ? `A${i}` : `Category ${i} with a much longer label`,
                    value: i,
                })),
                width: 600,
                height: 400,
                axes: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                        label: {
                            avoidCollisions: true,
                            autoRotate: false,
                            ...(verticalAlign == null ? {} : { verticalAlign }),
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            });

            it.each(['top', 'middle', 'bottom'] as VerticalAlign[])(
                'reduces to the same tick set as the unaligned axis under verticalAlign "%s"',
                async (verticalAlign) => {
                    await renderChart(unequalWidthOptions());
                    const baseline = getAxisLabelNodes(chart, 'bottom');
                    // Anti-vacuous: the axis must be unrotated, labelling, and itself clean -
                    // otherwise the aligned run below proves nothing.
                    expect(baseline.length).toBeGreaterThan(1);
                    for (const node of baseline) {
                        expect(node.datum.rotation).toBe(0);
                    }
                    expect(collidingPairs(baseline)).toBe(0);
                    // Anti-vacuous: collision avoidance must actually be dropping labels, so a
                    // spurious offset has room to drop a different number of them.
                    expect(baseline.length).toBeLessThan(12);

                    await renderChart(unequalWidthOptions(verticalAlign));
                    const nodes = getAxisLabelNodes(chart, 'bottom');
                    expect(nodes.map((n) => n.datum.text)).toEqual(baseline.map((n) => n.datum.text));
                    expect(collidingPairs(nodes)).toBe(0);
                }
            );
        });

        // The exact geometry the r12 review raised: a long label followed by a short one, at a tick
        // spacing where the flush displacement is comparable to the gap. The claim was that
        // subtracting the flush from the cross-axis offset before applying the rotation lets a
        // colliding pair through; the frame the overlap check compares in is what decides.
        describe('collision avoidance with one long label beside one short one', () => {
            // 24 bands across 600px puts the ticks ~30px apart, and the ~10-vs-3 character
            // alternation makes neighbouring labels differ in width by tens of pixels: measured
            // 30.6px spacings against label widths of 62.7px and 14.7px.
            const longBesideShortOptions = (
                verticalAlign?: VerticalAlign,
                avoidCollisions = true
            ): AgCartesianChartOptions => ({
                data: Array.from({ length: 24 }, (_, i) => ({
                    category: i % 2 === 0 ? `LongLabel${i}` : `S${i}`,
                    value: i,
                })),
                width: 600,
                height: 400,
                axes: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                        label: {
                            rotation: 45,
                            avoidCollisions,
                            ...(verticalAlign == null ? {} : { verticalAlign }),
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            });

            it('is the geometry the finding describes: ~30px ticks, widths differing by tens of px', async () => {
                await renderChart(longBesideShortOptions('bottom', false));
                const nodes = getAxisLabelNodes(chart, 'bottom');
                expect(nodes.length).toBe(24);

                const spacings = nodes
                    .slice(1)
                    .map((node, i) => Math.abs(node.datum.x - nodes[i].datum.x))
                    .filter((d) => d > 0);
                expect(Math.min(...spacings)).toBeGreaterThan(25);
                expect(Math.max(...spacings)).toBeLessThan(36);

                const widths = nodes.map((node) => getLocalBox(node).width);
                expect(Math.max(...widths) - Math.min(...widths)).toBeGreaterThan(40);
                // Anti-vacuous: with avoidance off this geometry really does overlap, so the
                // verdicts below are about the check and not about a layout that cannot collide.
                expect(collidingPairs(nodes)).toBeGreaterThan(0);
            });

            it.each(['top', 'middle', 'bottom'] as VerticalAlign[])(
                'leaves no overlapping pair under verticalAlign "%s"',
                async (verticalAlign) => {
                    await renderChart(longBesideShortOptions(verticalAlign));
                    const nodes = getAxisLabelNodes(chart, 'bottom');
                    expect(nodes.length).toBeGreaterThan(1);
                    expect(collidingPairs(nodes)).toBe(0);
                }
            );
        });

        // A vertical axis cannot flush `verticalAlign` away: the baseline moves each label by its
        // own height, so a tall label below a short one overlaps it only when both sit above their ticks.
        describe('collision avoidance on a vertical axis with unequal-height neighbours', () => {
            // A number axis, so no band caps the label height; the lowest tick carries the tall label.
            const unequalHeightOptions = (
                verticalAlign?: VerticalAlign,
                avoidCollisions = true
            ): AgCartesianChartOptions => ({
                data: [
                    { x: 0, y: 0 },
                    { x: 1, y: 10 },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: {
                        type: 'number',
                        position: 'left',
                        label: {
                            avoidCollisions,
                            ...(verticalAlign == null ? {} : { verticalAlign }),
                            formatter: ({ value, index }: { value: unknown; index: number }) => [
                                { text: String(value), fontSize: index === 0 ? 100 : 10 },
                            ],
                        },
                    },
                },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });

            const nodesByPosition = (position: string) =>
                getAxisLabelNodes(chart, position).sort((a, b) => a.datum.y - b.datum.y);

            it('is the geometry the finding describes: a tall label one tick below a short one', async () => {
                await renderChart(unequalHeightOptions('top', false));
                const nodes = nodesByPosition('left');
                expect(nodes.length).toBeGreaterThan(2);
                expect(nodes[0].datum.textBaseline).toBe('bottom');

                const [tall, short] = nodes.slice(-2).reverse();
                const tallHeight = Transformable.toCanvas(tall).height;
                const shortHeight = Transformable.toCanvas(short).height;
                expect(tallHeight).toBeGreaterThan(shortHeight + 20);

                const spacing = tall.datum.y - short.datum.y;
                // Clear of the shorter label's own height, so a tick-anchored check accepts the pair,
                // yet inside the taller one's height, so hanging both from the bottom overlaps them.
                expect(spacing).toBeGreaterThan(shortHeight + 10);
                expect(spacing).toBeLessThan(tallHeight);
                // Anti-vacuous: the verdicts below are about the check, not a layout that cannot collide.
                expect(collidingPairs(nodes)).toBeGreaterThan(0);
            });

            it('keeps every label on the default baseline, where the same ticks are clear', async () => {
                await renderChart(unequalHeightOptions(undefined, false));
                const unchecked = nodesByPosition('left').map((n) => n.datum.tickId);

                await renderChart(unequalHeightOptions());
                const nodes = nodesByPosition('left');
                expect(nodes.map((n) => n.datum.tickId)).toEqual(unchecked);
                expect(collidingPairs(nodes)).toBe(0);
            });

            it.each(['top', 'middle', 'bottom'] as VerticalAlign[])(
                'leaves no overlapping pair under verticalAlign "%s"',
                async (verticalAlign) => {
                    await renderChart(unequalHeightOptions(verticalAlign));
                    const nodes = nodesByPosition('left');
                    expect(nodes.length).toBeGreaterThan(1);
                    expect(collidingPairs(nodes)).toBe(0);
                }
            );
        });

        it.each(['baseline', 'centre'] as string[])(
            'warns for the unsupported value "%s" and keeps the computed alignment',
            async (unsupported) => {
                await renderChart(bottomAxisOptions({ verticalAlign: unsupported as VerticalAlign }));

                const nodes = getAxisLabelNodes(chart, 'bottom');
                expect(nodes.length).toBe(3);
                for (const node of nodes) {
                    expect(node.datum.textBaseline).toBe('top');
                }
                expectWarningsCalls().toEqual([
                    [
                        `AG Charts - Option \`axes.x.label.verticalAlign\` cannot be set to \`"${unsupported}"\`; expecting a keyword such as 'top', 'middle' or 'bottom', ignoring.`,
                    ],
                ]);
            }
        );

        it('leaves an unrotated textAlign-only horizontal axis on its computed baseline', async () => {
            await renderChart(bottomAxisOptions());
            const naturalAnchors = captureAnchorsByText(getAxisLabelNodes(chart, 'bottom'));
            const naturalBoxes = canvasBoxesByText('bottom');

            await renderChart(bottomAxisOptions({ textAlign: 'right' }));
            const nodes = getAxisLabelNodes(chart, 'bottom');
            expect(nodes.length).toBe(naturalAnchors.size);
            for (const node of nodes) {
                const natural = naturalAnchors.get(getLabelText(node));
                const naturalBox = naturalBoxes.get(getLabelText(node));
                expect(natural).toBeDefined();
                expect(naturalBox).toBeDefined();

                expect(node.datum.y).toBeCloseTo(natural!.y, 5);
                expect(node.datum.rotationCenterY).toBeCloseTo(natural!.rotationCenterY, 5);
                expect(node.datum.textBaseline).toBe(natural!.textBaseline);
                expect(Transformable.toCanvas(node).y).toBeCloseTo(naturalBox!.y, 5);
                // Anti-vacuous: the same render must still be moving the labels along the axis.
                expect(node.datum.x).not.toBeCloseTo(natural!.x, 1);
            }
        });

        describe('auto-rotated horizontal axis', () => {
            const AUTO_ROTATE_DATA = [
                { category: 'Corp Tax', value: 150 },
                { category: 'Council Tax', value: 120 },
                { category: 'Income Tax', value: 200 },
                { category: 'VAT', value: 180 },
                { category: 'Capital Gains', value: 90 },
                { category: 'Stamp Duty', value: 60 },
            ];

            // Narrow enough that the labels collide and the axis rotates them itself, with no
            // `label.rotation` to opt into the rotated path explicitly.
            const autoRotateOptions = (label?: TextAlignLabelOptions): AgCartesianChartOptions => ({
                data: AUTO_ROTATE_DATA,
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                axes: {
                    x: { type: 'category', position: 'bottom', ...(label ? { label } : {}) },
                    y: { type: 'number', position: 'left' },
                },
            });

            it('aligns within the reserved band as an unrotated axis does', async () => {
                await renderChart(autoRotateOptions(), 300);
                const naturalAnchors = captureAnchorsByText(getAxisLabelNodes(chart, 'bottom'));
                expect(naturalAnchors.size).toBeGreaterThan(1);
                for (const anchor of naturalAnchors.values()) {
                    expect(anchor.textBaseline).toBe('top');
                }

                await renderChart(autoRotateOptions({ verticalAlign: 'top' }), 300);
                const topNodes = getAxisLabelNodes(chart, 'bottom');
                for (const node of topNodes) {
                    // Anti-vacuous: `autoRotate` must have fired, or this is the unrotated case again.
                    expect(node.datum.rotation).not.toBe(0);
                    expect(node.datum).toMatchObject(naturalAnchors.get(getLabelText(node))!);
                }
                const topEdges = topNodes.map((n) => Transformable.toCanvas(n).y);
                expect(Math.max(...topEdges) - Math.min(...topEdges)).toBeLessThanOrEqual(1);

                await renderChart(autoRotateOptions({ verticalAlign: 'bottom' }), 300);
                const bottomNodes = getAxisLabelNodes(chart, 'bottom');
                const bottomBoxes = bottomNodes.map((n) => Transformable.toCanvas(n));
                const bottomEdges = bottomBoxes.map((b) => b.y + b.height);
                expect(Math.max(...bottomEdges) - Math.min(...bottomEdges)).toBeLessThanOrEqual(1);
                for (const node of bottomNodes) {
                    expect(node.datum.textBaseline).toBe('bottom');
                }
                // Anti-vacuous: the two flushes are only distinguishable because the rotated boxes
                // differ in depth, so a "middle" fallback could not satisfy both.
                const depths = bottomBoxes.map((b) => b.height);
                expect(Math.max(...depths) - Math.min(...depths)).toBeGreaterThan(1);
            });
        });

        it('AC1: a verticalAlign on one label tier leaves the other tier alone', async () => {
            const TIER_DATA = [
                { date: new Date(2023, 10, 1), value: 2 },
                { date: new Date(2023, 11, 1), value: 5 },
                { date: new Date(2024, 0, 1), value: 3 },
                { date: new Date(2024, 1, 1), value: 1 },
                { date: new Date(2024, 2, 1), value: 2 },
            ];
            const tierOptions = (leaf?: VerticalAlign, parent?: VerticalAlign): AgCartesianChartOptions => ({
                data: TIER_DATA,
                series: [{ type: 'bar', xKey: 'date', yKey: 'value' }],
                axes: {
                    x: {
                        type: 'time',
                        position: 'bottom',
                        label: leaf == null ? {} : { verticalAlign: leaf },
                        parentLevel: {
                            enabled: true,
                            label: { enabled: true, ...(parent == null ? {} : { verticalAlign: parent }) },
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
            });
            const isParentTier = (text: string) => /^\d{4}$/.test(text);

            await renderChart(tierOptions());
            const naturalAnchors = captureAnchorsByText(getAxisLabelNodes(chart, 'bottom'));
            const naturalTexts = [...naturalAnchors.keys()];
            // Anti-vacuous: both tiers must actually be on the axis for independence to mean anything.
            expect(naturalTexts.filter(isParentTier).length).toBe(1);
            expect(naturalTexts.filter((t) => !isParentTier(t)).length).toBeGreaterThan(1);

            await renderChart(tierOptions('bottom'));
            for (const node of getAxisLabelNodes(chart, 'bottom')) {
                const natural = naturalAnchors.get(getLabelText(node))!;
                if (isParentTier(getLabelText(node))) {
                    expect(node.datum).toMatchObject(natural);
                } else {
                    expect(node.datum.textBaseline).toBe('bottom');
                    expect(node.datum.y).not.toBeCloseTo(natural.y, 1);
                }
            }

            await renderChart(tierOptions(undefined, 'bottom'));
            for (const node of getAxisLabelNodes(chart, 'bottom')) {
                const natural = naturalAnchors.get(getLabelText(node))!;
                if (isParentTier(getLabelText(node))) {
                    expect(node.datum.textBaseline).toBe('bottom');
                    expect(node.datum.y).not.toBeCloseTo(natural.y, 1);
                } else {
                    expect(node.datum).toMatchObject(natural);
                }
            }
        });

        // Vertical axes trim nothing along their own direction, so an extreme-tick label's overhang
        // is whatever the chart padding happens to leave: this records the measured behaviour.
        it.each(['left', 'right'] as const)(
            'keeps extreme-tick labels within the chart bounds on a "%s" axis',
            async (position) => {
                const factory = position === 'left' ? leftAxisOptions : rightAxisOptions;

                for (const verticalAlign of ['top', 'middle', 'bottom'] as const) {
                    const options = factory({ verticalAlign });
                    await renderChart(options);
                    const { width, height } = options;
                    expect(width).toBeGreaterThan(0);
                    expect(height).toBeGreaterThan(0);

                    const nodes = getAxisLabelNodes(chart, position);
                    expect(nodes.length).toBeGreaterThan(1);
                    // The left fixture is continuous, the right one banded.
                    const flipped = { top: 'bottom', middle: 'middle', bottom: 'top' }[verticalAlign];
                    expect(nodes[0].datum.textBaseline).toBe(position === 'left' ? flipped : verticalAlign);
                    for (const node of nodes) {
                        const box = Transformable.toCanvas(node);
                        expect(box.y).toBeGreaterThanOrEqual(0);
                        expect(box.y + box.height).toBeLessThanOrEqual(height!);
                        expect(box.x).toBeGreaterThanOrEqual(0);
                        expect(box.x + box.width).toBeLessThanOrEqual(width!);
                    }
                }
            }
        );

        // `verticalAlign` has to behave identically when a label formatter returns rich-text
        // segments, and it aligns the label as a whole - it never reaches inside the segments, which
        // carry a `verticalAlign` of their own.
        describe('AC1: rich-text (segmented) labels', () => {
            // One plain text segment renders exactly the glyphs the unformatted label does, so any
            // difference in placement is the segmented measurement path rather than the text.
            const plainSegment = ({ value }: { value: unknown }) => [{ text: String(value) }];
            // Deliberately mixed: a large leading segment and a small `verticalAlign`-carrying one
            // make the label's own extents differ from any single segment's, which is what the
            // segmented measurement has to get right.
            const richSegment = ({ value }: { value: unknown }) => [
                { text: String(value).slice(0, 2), fontSize: 20 },
                { text: ` ${String(value)}`, fontSize: 10, verticalAlign: 'top' as const },
            ];

            const boxesByText = (nodes: AxisLabelNode[]) =>
                new Map(nodes.map((n) => [getLabelText(n), Transformable.toCanvas(n)]));
            // Anti-vacuous: the formatter must actually put the label on the segmented measurement
            // path, otherwise every assertion below holds because nothing rich was ever rendered.
            const expectSegmented = (nodes: AxisLabelNode[]) => {
                expect(nodes.length).toBeGreaterThan(0);
                for (const node of nodes) expect(Array.isArray(node.datum.text)).toBe(true);
            };

            it.each(['top', 'middle', 'bottom'] as const)(
                'places a "%s"-aligned segmented label where the equivalent plain-text label goes, on a horizontal axis',
                async (verticalAlign) => {
                    await renderChart(wrappedBottomAxisOptions({ verticalAlign }));
                    const plain = boxesByText(getAxisLabelNodes(chart, 'bottom'));
                    expect(plain.size).toBe(3);

                    await renderChart(wrappedBottomAxisOptions({ verticalAlign, formatter: plainSegment }));
                    const nodes = getAxisLabelNodes(chart, 'bottom');
                    expectSegmented(nodes);
                    const segmented = boxesByText(nodes);
                    const byText = (a: string, b: string) => a.localeCompare(b);
                    expect([...segmented.keys()].sort(byText)).toEqual([...plain.keys()].sort(byText));
                    for (const [text, box] of segmented) {
                        const expected = plain.get(text)!;
                        expect(box.y).toBeCloseTo(expected.y, 1);
                        expect(box.y + box.height).toBeCloseTo(expected.y + expected.height, 1);
                    }
                }
            );

            it.each(['top', 'middle', 'bottom'] as const)(
                'places a "%s"-aligned segmented label where the equivalent plain-text label goes, on a banded vertical axis',
                async (verticalAlign) => {
                    await renderChart(rightAxisOptions({ verticalAlign }));
                    const plain = boxesByText(getAxisLabelNodes(chart, 'right'));
                    expect(plain.size).toBe(3);

                    await renderChart(rightAxisOptions({ verticalAlign, formatter: plainSegment }));
                    const nodes = getAxisLabelNodes(chart, 'right');
                    expectSegmented(nodes);
                    const segmented = boxesByText(nodes);
                    const byText = (a: string, b: string) => a.localeCompare(b);
                    expect([...segmented.keys()].sort(byText)).toEqual([...plain.keys()].sort(byText));
                    for (const [text, box] of segmented) {
                        const expected = plain.get(text)!;
                        expect(box.y).toBeCloseTo(expected.y, 1);
                        expect(box.y + box.height).toBeCloseTo(expected.y + expected.height, 1);
                    }
                }
            );

            // A rotated label's glyph box is measured under the requested baseline and then rotated,
            // so a baseline-blind measurement puts the two flushes in different bands - the failure
            // this pins is `'bottom'` stopping short of the edge `'top'` measured the band from.
            it.each([0, 45])(
                'flushes rich segments to one band on a bottom axis rotated %s degrees',
                async (rotation) => {
                    await renderChart(bottomAxisOptions({ rotation, verticalAlign: 'top', formatter: richSegment }));
                    const topNodes = getAxisLabelNodes(chart, 'bottom');
                    expectSegmented(topNodes);
                    const topBoxes = topNodes.map((n) => Transformable.toCanvas(n));
                    const bandTop = Math.min(...topBoxes.map((b) => b.y));
                    const bandDepth = Math.max(...topBoxes.map((b) => b.height));
                    expect(Math.max(...topBoxes.map((b) => b.y)) - bandTop).toBeLessThanOrEqual(1);

                    await renderChart(bottomAxisOptions({ rotation, verticalAlign: 'bottom', formatter: richSegment }));
                    const bottomNodes = getAxisLabelNodes(chart, 'bottom');
                    expectSegmented(bottomNodes);
                    const bottomBoxes = bottomNodes.map((n) => Transformable.toCanvas(n));
                    const bottomEdges = bottomBoxes.map((b) => b.y + b.height);
                    expect(Math.max(...bottomEdges) - Math.min(...bottomEdges)).toBeLessThanOrEqual(1);
                    expect(Math.max(...bottomEdges)).toBeCloseTo(bandTop + bandDepth, 0);
                }
            );

            // On a vertical axis the alignment acts along the axis, so what has to hold across the
            // three values is the column: the reserved width is sized for one placement only.
            it('keeps rich segments in one column on a rotated right axis', async () => {
                const columns: number[] = [];
                for (const verticalAlign of ['top', 'middle', 'bottom'] as const) {
                    await renderChart(rightAxisOptions({ rotation: 45, verticalAlign, formatter: richSegment }));
                    const nodes = getAxisLabelNodes(chart, 'right');
                    expectSegmented(nodes);
                    const boxes = nodes.map((n) => Transformable.toCanvas(n));
                    const inner = Math.min(...boxes.map((b) => b.x));
                    expect(Math.max(...boxes.map((b) => b.x)) - inner).toBeLessThanOrEqual(1);
                    expect(inner).toBeGreaterThanOrEqual(getSeriesRect(chart).x + getSeriesRect(chart).width - 1);
                    columns.push(inner);
                }
                for (const column of columns) expect(column).toBeCloseTo(columns[0], 0);
            });

            // Ido, 2026-09-07: unlike `fontSize`, this option is not a default the segments inherit -
            // the segments keep aligning against their own line, and the label moves as one block.
            // A banded vertical axis is the fixture where the three values genuinely separate: the
            // band is far deeper than one label, so the anchor has somewhere to go.
            it("moves the label as a block and leaves the segments' own alignment alone", async () => {
                const segmentAligned = (segmentAlign: 'top' | 'bottom') => (params: { value: unknown }) => [
                    { text: String(params.value).slice(0, 2), fontSize: 20 },
                    { text: ` ${String(params.value)}`, fontSize: 10, verticalAlign: segmentAlign },
                ];

                const boxes: { x: number; y: number; width: number; height: number }[] = [];
                for (const verticalAlign of ['top', 'middle', 'bottom'] as const) {
                    await renderChart(rightAxisOptions({ verticalAlign, formatter: segmentAligned('top') }));
                    const nodes = getAxisLabelNodes(chart, 'right');
                    expectSegmented(nodes);
                    for (const node of nodes) {
                        // The label node still takes the axis alignment as its own baseline; what
                        // must not happen is that value reaching the segments, which keep the
                        // `verticalAlign` the formatter gave them - `'top'` here, not the axis's.
                        expect(node.datum.textBaseline).toBe(verticalAlign);
                        expect(getLabelSegmentAlignments(node)).toEqual([undefined, 'top']);
                    }
                    boxes.push(Transformable.toCanvas(nodes[0]));
                }
                // Same glyphs laid out the same way, at three different offsets: the label is a rigid
                // block that the alignment moves, not a container whose contents it re-flows.
                for (const box of boxes) {
                    expect(box.width).toBeCloseTo(boxes[0].width, 1);
                    expect(box.height).toBeCloseTo(boxes[0].height, 1);
                }
                // Anti-vacuous: the three renders must actually differ, or an unchanged shape says
                // nothing about whether the option reached the segments.
                const [top, , bottom] = boxes;
                expect(bottom.y).toBeGreaterThan(top.y + 1);
            });
        });
    });

    describe('tick layout across a data update', () => {
        type Row = { x: number | string; y: number };
        const numberAxes = {
            x: { type: 'number', position: 'bottom', nice: false },
            y: { type: 'number', position: 'left' },
        };
        const categoryAxes = {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'left' },
        };
        const series = [{ type: 'line', xKey: 'x', yKey: 'y' }];

        const sequence = (from: number, count: number, y: (i: number) => number = (i) => i): Row[] =>
            Array.from({ length: count }, (_, i) => ({ x: from + i, y: y(from + i) }));
        const categories = (from: number, count: number, y: (i: number) => number = (i) => i): Row[] =>
            Array.from({ length: count }, (_, i) => ({ x: `Item ${from + i}`, y: y(from + i) }));
        const alternating = (shift: number) => (i: number) => ((i + shift) % 2) * 10;

        type Size = { width: number; height: number };

        const freshCharts: AgChartInstance[] = [];
        const autoSizedContainers: HTMLElement[] = [];
        afterEach(() => {
            for (const fresh of freshCharts.splice(0)) fresh.destroy();
            for (const container of autoSizedContainers.splice(0)) container.remove();
        });

        const create = (options: Record<string, unknown>) =>
            createChart({ series, animation: { enabled: false }, ...options } as AgCartesianChartOptions);

        const update = async (delta: Record<string, unknown>) => {
            await chart.updateDelta(delta);
            await waitForChartStability(chart);
        };

        // Bespoke: no explicit width/height, so the chart takes the auto-size path that a container resize drives.
        // `updateDelta({ width })` would drop the layout cache; only this path reaches the cache key's range check.
        const createAutoSized = async (options: Record<string, unknown>, size: { width: number; height: number }) => {
            const container = getDocument().createElement('div');
            getDocument().body.append(container);
            autoSizedContainers.push(container);
            const instance = AgCharts.create({
                container,
                series,
                animation: { enabled: false },
                ...options,
            } as AgCartesianChartOptions);
            freshCharts.push(instance);
            await resizeContainer(instance, size);
            return instance;
        };

        const resizeContainer = async (instance: AgChartInstance, { width, height }: Size) => {
            const internal = deproxy(instance);
            internal.ctx.domManager.containerSize = { width, height, pixelRatio: 1 };
            internal.ctx.eventsHub.emit('dom:resize', null);
            await waitForChartStability(instance);
        };

        /**
         * Asserts the chart is indistinguishable from one created from `options`, which never reused a layout. The test
         * canvas fixes a created chart's size, so a different `size` is applied after creation, which drops its layouts.
         */
        const expectMatchesFresh = async (
            options: Record<string, unknown>,
            size?: { width: number; height?: number }
        ) => {
            const fresh = await create(options);
            freshCharts.push(fresh);
            if (size != null) {
                await fresh.updateDelta(size);
                await waitForChartStability(fresh);
            }
            expect(getAxisTickLayouts(chart)).toEqual(getAxisTickLayouts(fresh));
        };

        it.each([
            { name: 'number axes', axes: numberAxes, rows: sequence },
            { name: 'category x axis', axes: categoryAxes, rows: categories },
        ])('matches a fresh chart after a row is added ($name)', async ({ axes, rows }) => {
            const data = (count: number) => rows(0, count, (i) => i * 7);
            chart = await create({ axes, data: data(10) });
            const before = getAxisTickLayouts(chart);

            await update({ data: data(11) });

            await expectMatchesFresh({ axes, data: data(11) });
            expect(getAxisTickLayouts(chart)).not.toEqual(before);
        });

        it('extends the y axis when an added row lies outside its range', async () => {
            const data = [...sequence(0, 10), { x: 10, y: 1000 }];
            chart = await create({ axes: numberAxes, data: sequence(0, 10) });
            expect(getAxisTickLayoutLabelTexts(chart, 'left')).toEqual(['10', '8', '6', '4', '2', '0']);

            await update({ data });

            await expectMatchesFresh({ axes: numberAxes, data });
            expect(getAxisTickLayoutLabelTexts(chart, 'left')[0]).toBe('1000');
        });

        it.each([
            { name: 'number axes', axes: numberAxes, rows: sequence },
            { name: 'category x axis', axes: categoryAxes, rows: categories },
        ])('matches a fresh chart on every tick of a rolling window ($name)', async ({ axes, rows }) => {
            const y = (i: number) => (i * 37) % 50;
            chart = await create({ axes, data: rows(0, 12, y) });

            for (let from = 1; from <= 6; from++) {
                await update({ data: rows(from, 12, y) });
                await expectMatchesFresh({ axes, data: rows(from, 12, y) });
            }
        });

        it('does not recalculate the y ticks while the y domain is unchanged, and does when it changes', async () => {
            chart = await create({ axes: numberAxes, data: sequence(0, 10, alternating(0)) });
            const before = getAxisTickLayout(chart, 'left');
            const yTickLayout = spyOnAxisTickLayout(chart, 'left');

            await update({ data: sequence(0, 10, alternating(1)) });

            expect(yTickLayout).not.toHaveBeenCalled();
            expect(getAxisTickLayout(chart, 'left')).toEqual(before);

            await update({ data: sequence(0, 10, (i) => (i % 2) * 100) });

            expect(yTickLayout).toHaveBeenCalled();
            expect(getAxisTickLayoutLabelTexts(chart, 'left')).toContain('100');
        });

        it('keeps the y ticks when a row is added within the y range, and recalculates the x ticks', async () => {
            chart = await create({ axes: numberAxes, data: sequence(0, 10, alternating(0)) });
            const yTickLayout = spyOnAxisTickLayout(chart, 'left');
            const xTickLayout = spyOnAxisTickLayout(chart, 'bottom');

            await update({ data: sequence(0, 11, alternating(0)) });

            expect(yTickLayout).not.toHaveBeenCalled();
            expect(xTickLayout).toHaveBeenCalled();
            await expectMatchesFresh({ axes: numberAxes, data: sequence(0, 11, alternating(0)) });
        });

        it('keeps the category x ticks when only the values change', async () => {
            chart = await create({ axes: categoryAxes, data: categories(0, 8, alternating(0)) });
            const xTickLayout = spyOnAxisTickLayout(chart, 'bottom');

            await update({ data: categories(0, 8, alternating(1)) });

            expect(xTickLayout).not.toHaveBeenCalled();
            await expectMatchesFresh({ axes: categoryAxes, data: categories(0, 8, alternating(1)) });
        });

        it('follows a new category order', async () => {
            chart = await create({ axes: categoryAxes, data: categories(0, 4) });

            await update({ data: categories(0, 4).reverse() });

            expect(getAxisTickLayoutLabelTexts(chart, 'bottom')).toEqual(['Item 3', 'Item 2', 'Item 1', 'Item 0']);
        });

        it('re-runs a label formatter on a data update that leaves the domain unchanged', async () => {
            let suffix = 'a';
            const formatter = ({ value }: { value: unknown }) => `${String(value)}${suffix}`;
            const axes = {
                x: { type: 'category', position: 'bottom', label: { formatter } },
                y: { type: 'number', position: 'left', label: { formatter } },
            };
            chart = await create({ axes, data: categories(0, 3, alternating(0)) });
            expect(getAxisTickLayoutLabelTexts(chart, 'bottom')).toEqual(['Item 0a', 'Item 1a', 'Item 2a']);

            suffix = 'b';
            await update({ data: categories(0, 3, alternating(1)) });

            expect(getAxisTickLayoutLabelTexts(chart, 'bottom')).toEqual(['Item 0b', 'Item 1b', 'Item 2b']);
            expect(getAxisTickLayoutLabelTexts(chart, 'left').every((text) => text.endsWith('b'))).toBe(true);
        });

        it('re-runs a label itemStyler on a data update that leaves the domain unchanged', async () => {
            let color = 'red';
            const axes = {
                x: { type: 'category', position: 'bottom', label: { itemStyler: () => ({ color }) } },
                y: { type: 'number', position: 'left' },
            };
            chart = await create({ axes, data: categories(0, 3, alternating(0)) });
            const bottomFills = () => getAxisTickLayout(chart, 'bottom').labels.map((label) => label.fill);
            expect(bottomFills()).toEqual(['red', 'red', 'red']);

            color = 'blue';
            await update({ data: categories(0, 3, alternating(1)) });

            expect(bottomFills()).toEqual(['blue', 'blue', 'blue']);
        });

        it('relabels object categories mutated in place', async () => {
            const items = Array.from({ length: 3 }, (_, i) => ({ name: `Item ${i}`, toString: () => items[i].name }));
            const data = () => items.map((item, i) => ({ x: item, y: i }));
            chart = await create({ axes: categoryAxes, data: data() });
            expect(getAxisTickLayoutLabelTexts(chart, 'bottom')).toEqual(['Item 0', 'Item 1', 'Item 2']);

            items[1].name = 'Renamed';
            await update({ data: data() });

            expect(getAxisTickLayoutLabelTexts(chart, 'bottom')).toEqual(['Item 0', 'Renamed', 'Item 2']);
        });

        it.each([
            { name: 'a reversed axis', axisOptions: { reverse: true } },
            { name: 'a changed category padding', axisOptions: { paddingInner: 0.8, paddingOuter: 0.4 } },
        ])('applies $name after a data update that kept the domain', async ({ axisOptions }) => {
            chart = await create({ axes: categoryAxes, data: categories(0, 4, alternating(0)) });
            await update({ data: categories(0, 4, alternating(1)) });

            await update({ axes: { x: axisOptions } });

            await expectMatchesFresh({
                axes: { ...categoryAxes, x: { ...categoryAxes.x, ...axisOptions } },
                data: categories(0, 4, alternating(1)),
            });
        });

        // A container resize never drops the layout cache, so only the range in the cache key can catch it.
        it.each([
            {
                name: 'a resize after a data update',
                steps: [{ data: categories(0, 6, alternating(1)) }, { size: { width: 400, height: 300 } }],
            },
            {
                name: 'a resize and a data update together',
                steps: [{ data: categories(0, 6, alternating(1)), size: { width: 400, height: 300 } }],
            },
            {
                name: 'resizes between data updates',
                steps: [
                    { size: { width: 300, height: 300 } },
                    { data: categories(0, 6, alternating(1)) },
                    { size: { width: 900, height: 300 } },
                    { data: categories(0, 6, alternating(0)) },
                ],
            },
        ])('has no stale axis after $name', async ({ steps }) => {
            const initial = { width: 600, height: 400 };
            const options = { axes: categoryAxes, data: categories(0, 6, alternating(0)) };
            const instance = await createAutoSized(options, initial);
            const before = getAxisTickLayouts(instance);

            let data: Row[] = options.data;
            let size: Size = initial;
            for (const step of steps) {
                data = step.data ?? data;
                size = step.size ?? size;
                if (step.data != null) await instance.updateDelta({ data });
                if (step.size != null) await resizeContainer(instance, step.size);
                await waitForChartStability(instance);
            }

            const fresh = await createAutoSized({ ...options, data }, size);
            expect(getAxisTickLayouts(instance)).toEqual(getAxisTickLayouts(fresh));
            expect(getAxisTickLayouts(instance)).not.toEqual(before);
        });

        describe('with a band-aligned axis and a fixed-width series', () => {
            const options = (y: (i: number) => number) => ({
                axes: {
                    x: { type: 'category', position: 'bottom', bandAlignment: 'end' },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', width: 20 }],
                data: categories(0, 5, y),
            });
            const wide = (i: number) => (i + 1) * 100_000;

            it('has no stale axis when the y labels widen, which moves the range without resizing it', async () => {
                chart = await create(options((i) => i));
                const before = getAxisTickLayouts(chart);

                await update({ data: categories(0, 5, wide) });

                await expectMatchesFresh(options(wide));
                expect(getAxisTickLayouts(chart)).not.toEqual(before);
            });

            it('has no stale axis when the container is resized and then the y labels widen', async () => {
                const instance = await createAutoSized(
                    options((i) => i),
                    { width: 600, height: 400 }
                );

                await resizeContainer(instance, { width: 900, height: 400 });
                await instance.updateDelta({ data: categories(0, 5, wide) });
                await waitForChartStability(instance);

                const fresh = await createAutoSized(options(wide), { width: 900, height: 400 });
                expect(getAxisTickLayouts(instance)).toEqual(getAxisTickLayouts(fresh));
            });
        });

        describe('with an input other than the domain and range', () => {
            const stable = sequence(0, 9, alternating(0));
            const moved = sequence(0, 9, alternating(1));

            it.each([
                { name: 'alone', data: stable },
                { name: 'with a data update', data: moved },
            ])('matches a fresh chart after a chart formatter is added ($name)', async ({ data }) => {
                const formatter = { y: ({ value }: { value: unknown }) => `${String(value)}!` };
                chart = await create({ axes: numberAxes, data: stable });

                await update({ formatter, data });

                await expectMatchesFresh({ axes: numberAxes, data, formatter });
                expect(getAxisTickLayoutLabelTexts(chart, 'left')[0]).toBe('10!');
            });

            it('matches a fresh chart after a chart formatter is removed', async () => {
                const formatter = { y: ({ value }: { value: unknown }) => `${String(value)}!` };
                chart = await create({ axes: numberAxes, data: stable, formatter });

                await update({ formatter: undefined });

                await expectMatchesFresh({ axes: numberAxes, data: stable });
                expect(getAxisTickLayoutLabelTexts(chart, 'left')[0]).toBe('10');
            });

            it('re-runs a chart formatter on a data update that leaves the domain unchanged', async () => {
                let suffix = 'a';
                const formatter = { y: ({ value }: { value: unknown }) => `${String(value)}${suffix}` };
                chart = await create({ axes: numberAxes, data: stable, formatter });
                expect(getAxisTickLayoutLabelTexts(chart, 'left')[0]).toBe('10a');

                suffix = 'b';
                await update({ data: moved });

                await expectMatchesFresh({ axes: numberAxes, data: moved, formatter });
                expect(getAxisTickLayoutLabelTexts(chart, 'left')[0]).toBe('10b');
            });

            it('re-measures an axis title whose formatter changes text on a data update that leaves the domain unchanged', async () => {
                let text = 'Short';
                const axes = {
                    ...numberAxes,
                    y: { ...numberAxes.y, title: { text: 'Title', formatter: () => text } },
                };
                chart = await create({ axes, data: stable });

                text = 'Three\nlines\nof text';
                await update({ data: moved });

                const fresh = await create({ axes, data: moved });
                freshCharts.push(fresh);
                expect(deproxy(chart).seriesRect).toEqual(deproxy(fresh).seriesRect);
                expect(getAxisTickLayouts(chart)).toEqual(getAxisTickLayouts(fresh));
            });

            it.each([
                { name: 'alone', data: stable },
                { name: 'with a data update', data: moved },
            ])('matches a fresh chart after the direction becomes right-to-left ($name)', async ({ data }) => {
                const axes = {
                    ...numberAxes,
                    x: { ...numberAxes.x, label: { textAlign: 'start' } },
                };
                chart = await create({ axes, data: stable });

                await update({ enableRtl: true, data });

                await expectMatchesFresh({ axes, data, enableRtl: true });
            });

            it.each([
                { name: 'alone', data: stable },
                { name: 'with a data update', data: moved },
            ])('hides the edge label that the padding no longer fits ($name)', async ({ data }) => {
                const axes = {
                    ...numberAxes,
                    x: { ...numberAxes.x, label: { fontSize: 40 } },
                };
                const roomOnRight = { left: 0, right: 80, top: 20, bottom: 20 };
                const roomOnLeft = { left: 80, right: 0, top: 20, bottom: 20 };
                chart = await create({ axes, data: stable, padding: roomOnRight });
                const labelled = () =>
                    getAxisTickLayout(chart, 'bottom').labels.filter((label) => label.text !== '').length;
                const before = labelled();

                await update({ padding: roomOnLeft, data });

                await expectMatchesFresh({ axes, data, padding: roomOnLeft });
                expect(labelled()).toBeLessThan(before);
            });
        });
    });
});
