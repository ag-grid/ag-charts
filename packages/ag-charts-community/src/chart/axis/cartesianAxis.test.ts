import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getDocument } from 'ag-charts-core';
import type {
    AgBaseChartThemeOptions,
    AgCartesianAxisCrossAt,
    AgCartesianChartOptions,
    AgChartInstance,
    TextAlign,
} from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { Transformable } from '../../scene/transformable';
import { expectPixelIdenticalAcrossUpdate } from '../test/bigintExamples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    createChart,
    deproxy,
    expectWarningsCalls,
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
        await compareImageSnapshot(chart, ctx, {
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

            const chartInstance = deproxy(chart as any) as any;
            const categoryAxis = chartInstance.axes.find((axis: any) => axis.position === 'bottom');
            expect(categoryAxis).toBeDefined();
            const labelNodes: any[] = Array.from(categoryAxis.tickLabelGroupSelection.nodes());
            expect(labelNodes.length).toBeGreaterThan(0);
            const visibleLabels = labelNodes.filter((node: any) => node.datum.visible);
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

            prepareTestOptions(options);
            chart = AgCharts.create(options);
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

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare('cartesian-axis-title-max-height');
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

            prepareTestOptions(options);
            chart = AgCharts.create(options);
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

            prepareTestOptions(options);
            chart = AgCharts.create(options);
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

            const chartInstance = deproxy(chart as any) as any;
            const categoryAxis = chartInstance.axes.find((axis: any) => axis.position === 'bottom');
            expect(categoryAxis).toBeDefined();
            const labelNodes: any[] = Array.from(categoryAxis.tickLabelGroupSelection.nodes());
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

            const chartInstance = deproxy(chart as any) as any;
            const categoryAxis = chartInstance.axes.find((axis: any) => axis.position === 'bottom');
            expect(categoryAxis).toBeDefined();
            const labelNodes: any[] = Array.from(categoryAxis.tickLabelGroupSelection.nodes());
            expect(labelNodes.length).toBeGreaterThan(0);
            const truncatedNodes = labelNodes.filter((node: any) => node.datum.textUntruncated != null);
            expect(truncatedNodes.length).toBeGreaterThan(0);
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
        const resizeTo = async (chartInstance: any, width: number, height: number) => {
            chartInstance.ctx.domManager.containerSize = { width, height, pixelRatio: PIXEL_RATIO };
            chartInstance.ctx.eventsHub.emit('dom:resize', null);
            await waitForChartStability(chart);
        };

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
            return deproxy(chart as any) as any;
        };

        it('keeps the bottom axis Y position fixed as the container width grows', async () => {
            const chartInstance = createAutoSizedChart();

            const positions = new Set<number>();
            for (let width = 300; width <= 320; width++) {
                await resizeTo(chartInstance, width, 200);
                const bottomAxis = chartInstance.axes.find((axis: any) => axis.position === 'bottom');
                positions.add(bottomAxis.translation.y);
            }

            expect(positions.size).toBe(1);
        });

        it('keeps the left axis X position fixed as the container height grows', async () => {
            const chartInstance = createAutoSizedChart();

            const positions = new Set<number>();
            for (let height = 300; height <= 320; height++) {
                await resizeTo(chartInstance, 400, height);
                const leftAxis = chartInstance.axes.find((axis: any) => axis.position === 'left');
                positions.add(leftAxis.translation.x);
            }

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
            const chartInstance = createAutoSizedChart();

            const positions: number[] = [];
            for (let width = 300; width <= 320; width++) {
                await resizeTo(chartInstance, width, 200);
                const leftAxis = chartInstance.axes.find((axis: any) => axis.position === 'left');
                positions.push(leftAxis.translation.x);
            }

            expect(directionReversals(positions)).toBe(0);
        });

        it('moves the bottom axis Y position monotonically as the container height grows', async () => {
            const chartInstance = createAutoSizedChart();

            const positions: number[] = [];
            for (let height = 300; height <= 320; height++) {
                await resizeTo(chartInstance, 400, height);
                const bottomAxis = chartInstance.axes.find((axis: any) => axis.position === 'bottom');
                positions.push(bottomAxis.translation.y);
            }

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

        const bottomAxisLabelNodes = () => {
            const chartInstance = deproxy(chart as any) as any;
            const categoryAxis = chartInstance.axes.find((axis: any) => axis.position === 'bottom');
            expect(categoryAxis).toBeDefined();
            const labelNodes: any[] = Array.from(categoryAxis.tickLabelGroupSelection.nodes());
            return labelNodes;
        };

        it('removes the label nodes when labels are disabled at runtime', async () => {
            const options = baseOptions(true);
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expect(bottomAxisLabelNodes().length).toBeGreaterThan(0);

            const disabled = baseOptions(false);
            prepareTestOptions(disabled);
            await chart.update(disabled);
            await waitForChartStability(chart);

            expect(bottomAxisLabelNodes()).toHaveLength(0);
        });

        it('renders no label nodes when labels are disabled from the initial options', async () => {
            const options = baseOptions(false);
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

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
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart as any) as any;
            const yAxis = chartInstance.axes.find((axis: any) => axis.position === 'left');
            expect(yAxis).toBeDefined();
            expect(formatterIndexByValue.size).toBeGreaterThan(0);

            const { x, y } = yAxis.getLayoutTranslation();
            for (const [value, formatterIndex] of formatterIndexByValue) {
                const pick = yAxis.pickValue({ canvasX: x, canvasY: y + yAxis.scale.convert(value) });
                expect(pick).toBeDefined();
                expect(pick.index).toBe(formatterIndex);
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

    // `axis.label.textAlign` re-anchors unrotated vertical-axis labels within their column, so long
    // labels cannot grow back over the axis line into the plot area.
    describe('axis label textAlign', () => {
        // Deliberately unequal label widths: a right-positioned category axis is the only vertical
        // axis whose ticks routinely differ in text length.
        const TEXT_ALIGN_CATEGORY_DATA = [
            { category: 'A', value: 10 },
            { category: 'BBBBBBBBBB', value: 20 },
            { category: 'CCC', value: 15 },
        ];

        type TextAlignLabelOptions = { rotation?: number; textAlign?: TextAlign };

        const rightAxisOptions = (label?: TextAlignLabelOptions): AgCartesianChartOptions => ({
            data: TEXT_ALIGN_CATEGORY_DATA,
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: { type: 'category', position: 'right', ...(label ? { label } : {}) },
            },
            series: [{ type: 'bar', direction: 'horizontal', xKey: 'category', yKey: 'value' }],
        });

        const getAxisLabelNodes = (chartInstance: AgChartInstance, position: string) => {
            const chartInternal = deproxy(chartInstance as any) as any;
            const axis = chartInternal.axes.find((a: any) => a.position === position);
            expect(axis).toBeDefined();
            const nodes: any[] = Array.from(axis.tickLabelGroupSelection.nodes());
            return nodes.filter((n: any) => n.datum.visible);
        };

        const getRightAxisLabelNodes = (chartInstance: AgChartInstance) => getAxisLabelNodes(chartInstance, 'right');

        const getSeriesRect = (chartInstance: AgChartInstance) => {
            const chartInternal = deproxy(chartInstance as any) as any;
            expect(chartInternal.seriesRect).toBeDefined();
            return chartInternal.seriesRect;
        };

        // Anchors captured from one chart, keyed by label text so a second chart's nodes (which may
        // come back in a different Selection order) can be compared without relying on array order.
        const captureAnchorsByText = (nodes: any[]) =>
            new Map(nodes.map((n) => [n.datum.text, { x: n.datum.x, rotationCenterX: n.datum.rotationCenterX }]));

        it('computes "left" as the natural alignment for an unconfigured right-positioned axis', async () => {
            const options = rightAxisOptions();
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const nodes = getRightAxisLabelNodes(chart);
            expect(nodes.map((n) => n.datum.text).sort((a: string, b: string) => a.localeCompare(b))).toEqual([
                'A',
                'BBBBBBBBBB',
                'CCC',
            ]);
            for (const node of nodes) {
                expect(node.datum.textAlign).toBe('left');
            }
        });

        it('AC1: "right" textAlign flushes label right edges while left edges keep differing', async () => {
            const options = rightAxisOptions({ textAlign: 'right' });
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const nodes = getRightAxisLabelNodes(chart);
            expect(nodes.map((n) => n.datum.text).sort((a: string, b: string) => a.localeCompare(b))).toEqual([
                'A',
                'BBBBBBBBBB',
                'CCC',
            ]);

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
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const nodes = getRightAxisLabelNodes(chart);
            const seriesRect = getSeriesRect(chart);
            const plotBoundary = seriesRect.x + seriesRect.width;

            for (const node of nodes) {
                const box = Transformable.toCanvas(node);
                expect(box.x).toBeGreaterThanOrEqual(plotBoundary - 1);
            }
        });

        it("AC2: textAlign matching the axis's natural alignment produces identical anchors", async () => {
            const naturalOptions = rightAxisOptions();
            prepareTestOptions(naturalOptions);
            chart = AgCharts.create(naturalOptions);
            await waitForChartStability(chart);
            const naturalAnchors = captureAnchorsByText(getRightAxisLabelNodes(chart));

            chart.destroy();
            (chart as unknown) = undefined;

            const explicitOptions = rightAxisOptions({ textAlign: 'left' });
            prepareTestOptions(explicitOptions);
            chart = AgCharts.create(explicitOptions);
            await waitForChartStability(chart);
            const explicitNodes = getRightAxisLabelNodes(chart);

            expect(explicitNodes.length).toBe(naturalAnchors.size);
            for (const node of explicitNodes) {
                const natural = naturalAnchors.get(node.datum.text);
                expect(natural).toBeDefined();
                expect(node.datum.x).toBeCloseTo(natural!.x, 5);
                expect(node.datum.rotationCenterX).toBeCloseTo(natural!.rotationCenterX, 5);
            }
        });

        it('TC1: a rotated label aligns within its own bounding box, clear of the series area', async () => {
            const options = rightAxisOptions({ rotation: 45, textAlign: 'right' });
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const nodes = getRightAxisLabelNodes(chart);
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
                prepareTestOptions(options);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                return chart;
            };

            const expectAnchorsMatch = (nodes: any[], expected: ReturnType<typeof captureAnchorsByText>) => {
                expect(nodes.length).toBe(expected.size);
                for (const node of nodes) {
                    const anchor = expected.get(node.datum.text);
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
                const resolvedAnchors = captureAnchorsByText(getRightAxisLabelNodes(chart));
                expect(resolvedAnchors.size).toBe(3);

                await renderRightAxis(false, { textAlign });
                const nodes = getRightAxisLabelNodes(chart);
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
                const resolvedAnchors = captureAnchorsByText(getRightAxisLabelNodes(chart));
                expect(resolvedAnchors.size).toBe(3);

                await renderRightAxis(true, { textAlign });
                const nodes = getRightAxisLabelNodes(chart);
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
                    const ltr = getRightAxisLabelNodes(chart).map((n) => n.datum.textAlign);

                    await renderRightAxis(true, { textAlign });
                    const rtl = getRightAxisLabelNodes(chart).map((n) => n.datum.textAlign);

                    expect(new Set(ltr).size).toBe(1);
                    expect(new Set(rtl).size).toBe(1);
                    expect(ltr[0]).not.toBe(rtl[0]);
                }
            );

            // The natural alignment of a right-positioned axis is `'left'` whichever way the chart
            // runs, so under RTL it is `'end'` that must leave the anchors untouched.
            it('AC2: an RTL "end" matching the axis\'s natural alignment produces identical anchors', async () => {
                await renderRightAxis(true);
                const naturalNodes = getRightAxisLabelNodes(chart);
                for (const node of naturalNodes) {
                    expect(node.datum.textAlign).toBe('left');
                }
                const naturalAnchors = captureAnchorsByText(naturalNodes);
                expect(naturalAnchors.size).toBe(3);

                await renderRightAxis(true, { textAlign: 'end' });
                expectAnchorsMatch(getRightAxisLabelNodes(chart), naturalAnchors);
            });

            it.each([[false], [true]])('AC4: accepts "start" without warning (enableRtl %j)', async (enableRtl) => {
                await renderRightAxis(enableRtl, { textAlign: 'start' });

                expect(getRightAxisLabelNodes(chart).length).toBe(3);
                expectWarningsCalls().toEqual([]);
            });
        });

        // A banded scale puts each tick in the middle of its band, so on a horizontal axis the tick
        // position is not an edge anything can align to - the band's own edges are.
        describe('band-scale horizontal axes', () => {
            const bottomAxisOptions = (label?: TextAlignLabelOptions): AgCartesianChartOptions => ({
                data: TEXT_ALIGN_CATEGORY_DATA,
                axes: {
                    x: { type: 'category', position: 'bottom', ...(label ? { label } : {}) },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            });

            const getBandwidth = (chartInstance: AgChartInstance) => {
                const chartInternal = deproxy(chartInstance as any) as any;
                const axis = chartInternal.axes.find((a: any) => a.position === 'bottom');
                expect(axis).toBeDefined();
                return axis.scale.bandwidth as number;
            };

            const renderBottomAxis = async (label?: TextAlignLabelOptions) => {
                if (chart != null) {
                    chart.destroy();
                    (chart as unknown) = undefined;
                }
                const options = bottomAxisOptions(label);
                prepareTestOptions(options);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                return chart;
            };

            it('anchors an aligned label on its band edge instead of the tick', async () => {
                await renderBottomAxis();
                const bandwidth = getBandwidth(chart);
                // Anti-vacuous: a zero bandwidth would make every shift below trivially satisfied.
                expect(bandwidth).toBeGreaterThan(1);
                const tickAnchors = captureAnchorsByText(getAxisLabelNodes(chart, 'bottom'));
                expect(tickAnchors.size).toBe(3);

                await renderBottomAxis({ textAlign: 'right' });
                for (const node of getAxisLabelNodes(chart, 'bottom')) {
                    const atTick = tickAnchors.get(node.datum.text);
                    expect(atTick).toBeDefined();
                    expect(node.datum.x).toBeCloseTo(atTick!.x + bandwidth / 2, 5);
                    expect(node.datum.rotationCenterX).toBeCloseTo(atTick!.x + bandwidth / 2, 5);
                }

                await renderBottomAxis({ textAlign: 'left' });
                for (const node of getAxisLabelNodes(chart, 'bottom')) {
                    const atTick = tickAnchors.get(node.datum.text);
                    expect(node.datum.x).toBeCloseTo(atTick!.x - bandwidth / 2, 5);
                }

                // `'center'` means the middle of the band, which is where the tick already is.
                await renderBottomAxis({ textAlign: 'center' });
                for (const node of getAxisLabelNodes(chart, 'bottom')) {
                    const atTick = tickAnchors.get(node.datum.text);
                    expect(node.datum.x).toBeCloseTo(atTick!.x, 5);
                }
            });

            it('renders "right"-aligned labels flush with the right edge of their band', async () => {
                await renderBottomAxis({ textAlign: 'right' });
                const bandwidth = getBandwidth(chart);
                const chartInternal = deproxy(chart as any) as any;
                const axis = chartInternal.axes.find((a: any) => a.position === 'bottom');
                const nodes = getAxisLabelNodes(chart, 'bottom');
                expect(nodes.length).toBe(3);

                // A band runs from where the scale places its category to one bandwidth beyond, so
                // the closed form is what the anchor must land on - not a delta off the tick.
                const renderedRightEdges = new Set<number>();
                for (const node of nodes) {
                    const bandRightEdge = axis.scale.convert(node.datum.text) + bandwidth;
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
                prepareTestOptions(naturalOptions);
                chart = AgCharts.create(naturalOptions);
                await waitForChartStability(chart);
                const tickAnchors = captureAnchorsByText(getAxisLabelNodes(chart, 'bottom'));
                expect(tickAnchors.size).toBeGreaterThan(1);

                chart.destroy();
                (chart as unknown) = undefined;

                const alignedOptions = continuousOptions({ textAlign: 'right' });
                prepareTestOptions(alignedOptions);
                chart = AgCharts.create(alignedOptions);
                await waitForChartStability(chart);

                for (const node of getAxisLabelNodes(chart, 'bottom')) {
                    const natural = tickAnchors.get(node.datum.text);
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
                    prepareTestOptions(options);
                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);
                    return getAxisLabelNodes(chart, 'bottom');
                };

                const resolvedAnchors = captureAnchorsByText(await render('left'));
                expect(resolvedAnchors.size).toBeGreaterThan(1);

                const nodes = await render('end');
                expect(nodes.length).toBe(resolvedAnchors.size);
                for (const node of nodes) {
                    expect(node.datum.textAlign).toBe('left');
                    const resolved = resolvedAnchors.get(node.datum.text);
                    expect(resolved).toBeDefined();
                    expect(node.datum.x).toBeCloseTo(resolved!.x, 5);
                }
            });
        });

        // A horizontal axis reserves its band on the opposite side of the axis line from a vertical
        // one, so the edge the correction pins over is the other one.
        it('keeps rotated labels out of the series area on a top-positioned axis', async () => {
            const options: AgCartesianChartOptions = {
                data: TEXT_ALIGN_CATEGORY_DATA,
                axes: {
                    x: { type: 'category', position: 'top', label: { rotation: -30, textAlign: 'left' } },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

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
});
