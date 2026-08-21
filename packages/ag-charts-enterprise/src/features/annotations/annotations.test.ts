import { afterEach, describe, expect, it } from 'vitest';

import { type AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    compareImageSnapshot,
    deproxy,
    expectWarningsCalls,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('Annotations', () => {
    setupMockConsole();
    let chart: any;
    const ctx = setupMockCanvas();

    const EXAMPLE_OPTIONS: AgCartesianChartOptions = {
        data: [
            { x: new Date('2024-01-05'), y: 5 },
            { x: new Date('2024-06-15'), y: 50 },
            { x: new Date('2024-12-25'), y: 95 },
        ],
        series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
        axes: { y: { type: 'number' }, x: { type: 'time' } },
        annotations: {
            enabled: true,
            toolbar: {
                enabled: false,
            },
        },
    };

    async function prepareChart(
        initialStateOptions?: AgCartesianChartOptions['initialState'],
        baseOptions = EXAMPLE_OPTIONS
    ) {
        const options: AgCartesianChartOptions = {
            ...baseOptions,
            initialState: { ...baseOptions.initialState, ...(initialStateOptions ?? {}) },
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
    }

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await compareImageSnapshot(chart, ctx, {
            failureThreshold: 0,
            failureThresholdType: 'percent',
        });
    };

    // Applies annotations to the SAME chart via setState — the mock canvas only tracks the first
    // chart per test, so cross-create snapshots would compare a stale canvas against itself.
    const applyAnnotations = async (annotations: object[]) => {
        await chart.setState({ ...chart.getState(), annotations });
        await waitForChartStability(chart);
        return ctx.snapshot();
    };

    describe('initial', () => {
        it('should render a line annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'line',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 25 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 75 },
                    },
                ],
            });
            await compare();
        });

        it('should warn and fall back to the default color for an unsupported color format', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'callout',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 25 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 75 },
                        text: 'Note',
                        color: 'lab(50% 40 59.5)',
                    },
                ],
            });

            expectWarningsCalls().toEqual([
                [
                    'AG Charts - Annotation property [color] cannot be set to [lab(50% 40 59.5)]; expecting a supported color string, ignoring.',
                ],
            ]);
        });

        it('should render a horizontal cross-line annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'horizontal-line',
                        value: 75,
                    },
                ],
            });
            await compare();
        });

        it('should render a vertical cross-line annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'vertical-line',
                        value: { __type: 'date', value: '2024-09-01' },
                    },
                ],
            });
            await compare();
        });

        it('should render a parallel-channel annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'parallel-channel',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 40 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 90 },
                        height: 30,
                    },
                ],
            });
            await compare();
        });

        it('should render a disjoint-channel annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'disjoint-channel',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 35 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 95 },
                        startHeight: 20,
                        endHeight: 40,
                    },
                ],
            });
            await compare();
        });

        it('should render a text annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'text',
                        text: 'Hello',
                        x: { __type: 'date', value: '2024-07-01' },
                        y: 75,
                    },
                ],
            });
            await compare();
        });

        it('should render a comment annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'comment',
                        text: 'Hello',
                        x: { __type: 'date', value: '2024-07-01' },
                        y: 75,
                    },
                ],
            });
            await compare();
        });

        it('should render a note annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'note',
                        text: 'Hello',
                        x: { __type: 'date', value: '2024-07-01' },
                        y: 75,
                    },
                ],
            });
            await compare();
        });

        it('should render a callout annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'callout',
                        text: 'Hello',
                        start: { x: { __type: 'date', value: '2024-05-01' }, y: 50 },
                        end: { x: { __type: 'date', value: '2024-07-01' }, y: 75 },
                    },
                ],
            });
            await compare();
        });

        it('should render a date range annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'date-range',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 25 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 75 },
                    },
                ],
            });
            await compare();
        });

        it('should render a price range annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'price-range',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 25 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 75 },
                    },
                ],
            });
            await compare();
        });

        it('should render a date price range annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'date-price-range',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 25 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 75 },
                    },
                ],
            });
            await compare();
        });

        it('should render a fibonacci retracement annotation with positive gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 45 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 65 },
                    },
                ],
            });
            await compare();
        });

        it('should render a reversed fibonacci retracement annotation with positive gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 45 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 65 },
                        reverse: true,
                    },
                ],
            });
            await compare();
        });

        it('should render a fibonacci retracement annotation with negative gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 65 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 45 },
                    },
                ],
            });
            await compare();
        });

        it('should render a revered fibonacci retracement annotation with negative gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 65 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 45 },
                        reverse: true,
                    },
                ],
            });
            await compare();
        });

        // Trend based
        it('should render a fibonacci retracement annotation with positive gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement-trend-based',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 45 },
                        end: { x: { __type: 'date', value: '2024-07-01' }, y: 65 },
                        endRetracement: { x: { __type: 'date', value: '2024-10-01' }, y: 65 },
                    },
                ],
            });
            await compare();
        });

        it('should render a reversed fibonacci retracement annotation with positive gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement-trend-based',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 45 },
                        end: { x: { __type: 'date', value: '2024-07-01' }, y: 65 },
                        endRetracement: { x: { __type: 'date', value: '2024-10-01' }, y: 65 },
                        reverse: true,
                    },
                ],
            });
            await compare();
        });

        it('should render a fibonacci retracement annotation with negative gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement-trend-based',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 65 },
                        end: { x: { __type: 'date', value: '2024-07-01' }, y: 45 },
                        endRetracement: { x: { __type: 'date', value: '2024-10-01' }, y: 65 },
                    },
                ],
            });
            await compare();
        });

        it('should render a revered fibonacci retracement annotation with negative gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement-trend-based',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 65 },
                        end: { x: { __type: 'date', value: '2024-07-01' }, y: 45 },
                        endRetracement: { x: { __type: 'date', value: '2024-10-01' }, y: 65 },
                        reverse: true,
                    },
                ],
            });
            await compare();
        });
    });

    describe('lines with text', () => {
        const annotations = [
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'top',
                    alignment: 'left',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'top',
                    alignment: 'center',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'top',
                    alignment: 'right',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'center',
                    alignment: 'left',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'center',
                    alignment: 'center',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'center',
                    alignment: 'right',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'bottom',
                    alignment: 'left',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'bottom',
                    alignment: 'center',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'bottom',
                    alignment: 'right',
                },
            },
        ];

        it('should render line annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => {
                    let y = 100;
                    if (index > 2) y = 70;
                    if (index > 5) y = 40;
                    const month = [2, 6, 10][index % 3];

                    return {
                        ...(annotation as any),
                        type: 'line',
                        start: { x: { __type: 'date', value: `2024-${String(month).padStart(2, '0')}-01` }, y: y },
                        end: {
                            x: { __type: 'date', value: `2024-${String(month + 2).padStart(2, '0')}-01` },
                            y: y - 30,
                        },
                    };
                }),
            });
            await compare();
        });

        it('should render horizontal line annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => ({
                    ...(annotation as any),
                    type: 'horizontal-line',
                    value: 90 - index * 10,
                })),
            });
            await compare();
        });

        it('should render vertical line annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => ({
                    ...(annotation as any),
                    type: 'vertical-line',
                    value: { __type: 'date', value: `2024-${String(2 + index).padStart(2, '0')}-01` },
                })),
            });
            await compare();
        });

        it('should render parallel channel annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => {
                    let y = 100;
                    if (index > 2) y = 70;
                    if (index > 5) y = 40;
                    const month = [2, 6, 10][index % 3];

                    return {
                        text: {
                            ...annotation.text,
                            position: annotation.text.position === 'center' ? 'inside' : annotation.text.position,
                        },
                        type: 'parallel-channel',
                        start: { x: { __type: 'date', value: `2024-${String(month).padStart(2, '0')}-01` }, y: y },
                        end: {
                            x: { __type: 'date', value: `2024-${String(month + 2).padStart(2, '0')}-01` },
                            y: y - 20,
                        },
                        height: 15,
                    } as any;
                }),
            });
            await compare();
        });

        it('should render disjoint channel annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => {
                    let y = 100;
                    if (index > 2) y = 70;
                    if (index > 5) y = 40;
                    const month = [2, 6, 10][index % 3];

                    return {
                        text: {
                            ...annotation.text,
                            position: annotation.text.position === 'center' ? 'inside' : annotation.text.position,
                        },
                        type: 'disjoint-channel',
                        start: { x: { __type: 'date', value: `2024-${String(month).padStart(2, '0')}-01` }, y: y },
                        end: {
                            x: { __type: 'date', value: `2024-${String(month + 2).padStart(2, '0')}-01` },
                            y: y - 20,
                        },
                        startHeight: 10,
                        endHeight: 20,
                    } as any;
                }),
            });
            await compare();
        });

        it('should render date price range annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => {
                    let y = 100;
                    if (index > 2) y = 70;
                    if (index > 5) y = 40;
                    const month = [1, 5, 9][index % 3];

                    return {
                        ...(annotation as any),
                        type: 'date-price-range',
                        start: { x: { __type: 'date', value: `2024-${String(month).padStart(2, '0')}-01` }, y: y },
                        end: {
                            x: { __type: 'date', value: `2024-${String(month + 3).padStart(2, '0')}-01` },
                            y: y - 20,
                        },
                    };
                }),
            });
            await compare();
        });

        it('should render stacked annotations with text', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'vertical-line',
                        value: { __type: 'date', value: '2024-05-01' },
                        text: {
                            label: 'Lorem ipsum',
                            position: 'center',
                            alignment: 'center',
                        },
                    },
                    {
                        type: 'parallel-channel',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 40 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 90 },
                        height: 30,
                    },
                    {
                        type: 'vertical-line',
                        value: { __type: 'date', value: '2024-07-01' },
                        text: {
                            label: 'Lorem ipsum',
                            position: 'center',
                            alignment: 'center',
                        },
                    },
                ],
            });
            await compare();
        });
    });

    describe('extending lines', () => {
        it('should render an extended parallel-channel annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'parallel-channel',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 40 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 90 },
                        height: 30,
                        extendStart: true,
                        extendEnd: true,
                    },
                ],
            });
            await compare();
        });
    });

    describe('bar series with groupPercentage', () => {
        const BAR_SERIES_OPTIONS: AgCartesianChartOptions = {
            data: [
                { category: 'Q1', value: 50 },
                { category: 'Q2', value: 70 },
                { category: 'Q3', value: 60 },
                { category: 'Q4', value: 80 },
            ],
            series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            annotations: {
                enabled: true,
                toolbar: {
                    enabled: false,
                },
            },
            width: 800,
            height: 400,
        };

        it('should render vertical line annotations at extreme groupPercentage values', async () => {
            await prepareChart(
                {
                    annotations: [
                        {
                            type: 'vertical-line',
                            value: { value: 'Q2', groupPercentage: -0.5 },
                            text: { label: '-0.5' },
                        },
                        {
                            type: 'vertical-line',
                            value: { value: 'Q2', groupPercentage: -1 },
                            text: { label: '-1' },
                        },
                        {
                            type: 'vertical-line',
                            value: { value: 'Q2', groupPercentage: 0 },
                            text: { label: '0' },
                        },
                        {
                            type: 'vertical-line',
                            value: { value: 'Q3', groupPercentage: 1 },
                            text: { label: '1' },
                        },
                        {
                            type: 'vertical-line',
                            value: { value: 'Q3', groupPercentage: 2 },
                            text: { label: '2' },
                        },
                    ],
                },
                BAR_SERIES_OPTIONS
            );
            await compare();
        });

        it('should render annotations on grouped bar series', async () => {
            const GROUPED_BAR_OPTIONS: AgCartesianChartOptions = {
                data: [
                    { category: 'Q1', sales: 50, profit: 30, expenses: 20 },
                    { category: 'Q2', sales: 70, profit: 45, expenses: 25 },
                    { category: 'Q3', sales: 60, profit: 35, expenses: 25 },
                    { category: 'Q4', sales: 80, profit: 50, expenses: 30 },
                ],
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'sales', yName: 'Sales' },
                    { type: 'bar', xKey: 'category', yKey: 'profit', yName: 'Profit' },
                    { type: 'bar', xKey: 'category', yKey: 'expenses', yName: 'Expenses' },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                annotations: {
                    enabled: true,
                    toolbar: {
                        enabled: false,
                    },
                },
                width: 800,
                height: 400,
            };

            await prepareChart(
                {
                    annotations: [
                        {
                            type: 'vertical-line',
                            value: { value: 'Q2', groupPercentage: -1 },
                            text: { label: 'Far left' },
                        },
                        {
                            type: 'vertical-line',
                            value: { value: 'Q2', groupPercentage: 0 },
                            text: { label: 'Center' },
                        },
                        {
                            type: 'vertical-line',
                            value: { value: 'Q3', groupPercentage: 1.5 },
                            text: { label: 'Far right' },
                        },
                        {
                            type: 'horizontal-line',
                            value: 40,
                            text: { label: 'Target' },
                        },
                    ],
                },
                GROUPED_BAR_OPTIONS
            );
            await compare();
        });

        it('should render point annotations with groupPercentage on bar series', async () => {
            await prepareChart(
                {
                    annotations: [
                        {
                            type: 'text',
                            text: 'Left',
                            x: { value: 'Q1', groupPercentage: -1 },
                            y: 60,
                        },
                        {
                            type: 'comment',
                            text: 'Center',
                            x: { value: 'Q2', groupPercentage: 0 },
                            y: 80,
                        },
                        {
                            type: 'note',
                            text: 'Right',
                            x: { value: 'Q3', groupPercentage: 1 },
                            y: 70,
                        },
                        {
                            type: 'callout',
                            text: 'Outside',
                            start: { x: { value: 'Q4', groupPercentage: 1.5 }, y: 90 },
                            end: { x: { value: 'Q4', groupPercentage: 2 }, y: 100 },
                        },
                    ],
                },
                BAR_SERIES_OPTIONS
            );
            await compare();
        });
    });

    describe('bigint coordinates (AG-16608)', () => {
        // Beyond Number precision, so a faithful round-trip can only hold via the serialisable bigint form.
        const BIGINT_X = 9007199254740993n;

        const NUMERIC_AXIS_OPTIONS: AgCartesianChartOptions = {
            data: [
                { x: 9007199254740992n, y: 5 },
                { x: 9007199254740994n, y: 95 },
            ],
            series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
            axes: { y: { type: 'number' }, x: { type: 'number' } },
            annotations: { enabled: true, toolbar: { enabled: false } },
        };

        it('should round-trip a bigint annotation coordinate through chart state', async () => {
            const serialisedValue = { __type: 'bigint' as const, value: BIGINT_X.toString() };

            await prepareChart(
                {
                    annotations: [
                        {
                            type: 'vertical-line',
                            value: serialisedValue,
                        },
                    ],
                },
                NUMERIC_AXIS_OPTIONS
            );

            const state = chart.getState();
            expect(state.annotations).toHaveLength(1);
            expect(state.annotations![0]).toMatchObject({ type: 'vertical-line', value: serialisedValue });
        });

        // The same y-value supplied as `number` and as encoded `bigint` must render pixel-identically.
        // Provided state must be pre-encoded (the memento contract), hence the `{ __type: 'bigint' }` form.
        const big = (value: bigint) => ({ __type: 'bigint' as const, value: value.toString() });
        const X_START = { __type: 'date' as const, value: '2024-03-01' };
        const X_END = { __type: 'date' as const, value: '2024-09-01' };

        it('renders a bigint y coordinate identically to a number y', async () => {
            await prepareChart();
            const baseline = ctx.snapshot();
            const numberImage = await applyAnnotations([
                { type: 'line', start: { x: X_START, y: 30 }, end: { x: X_END, y: 70 } },
            ]);
            const bigintImage = await applyAnnotations([
                { type: 'line', start: { x: X_START, y: big(30n) }, end: { x: X_END, y: big(70n) } },
            ]);
            // Guard against a vacuously-identical pair of blank renders: the annotation must be visible.
            expect(numberImage).not.toMatchImage(baseline, { writeDiff: false });
            expect(bigintImage).toMatchImage(numberImage);
        });

        it('renders bigint disjoint-channel startHeight/endHeight identically to numbers', async () => {
            await prepareChart();
            const baseline = ctx.snapshot();
            const numberImage = await applyAnnotations([
                {
                    type: 'disjoint-channel',
                    start: { x: X_START, y: 60 },
                    end: { x: X_END, y: 80 },
                    startHeight: 20,
                    endHeight: 40,
                },
            ]);
            const bigintImage = await applyAnnotations([
                {
                    type: 'disjoint-channel',
                    start: { x: X_START, y: big(60n) },
                    end: { x: X_END, y: big(80n) },
                    startHeight: big(20n),
                    endHeight: big(40n),
                },
            ]);
            expect(numberImage).not.toMatchImage(baseline, { writeDiff: false });
            expect(bigintImage).toMatchImage(numberImage);
        });

        it('renders a bigint parallel-channel height identically to a number height', async () => {
            await prepareChart();
            const baseline = ctx.snapshot();
            const numberImage = await applyAnnotations([
                { type: 'parallel-channel', start: { x: X_START, y: 60 }, end: { x: X_END, y: 80 }, height: 20 },
            ]);
            const bigintImage = await applyAnnotations([
                {
                    type: 'parallel-channel',
                    start: { x: X_START, y: big(60n) },
                    end: { x: X_END, y: big(80n) },
                    height: big(20n),
                },
            ]);
            expect(numberImage).not.toMatchImage(baseline, { writeDiff: false });
            expect(bigintImage).toMatchImage(numberImage);
        });
    });

    describe('axis label padding (AG-18182)', () => {
        const horizontalLine = (padding?: unknown) => [
            { type: 'horizontal-line', value: 75, axisLabel: { enabled: true, padding } },
        ];
        const verticalLine = (padding?: unknown) => [
            {
                type: 'vertical-line',
                value: { __type: 'date', value: '2024-09-01' },
                axisLabel: { enabled: true, padding },
            },
        ];

        it('does not average asymmetric left/right padding', async () => {
            await prepareChart();
            const baseline = ctx.snapshot();
            const wideLeft = await applyAnnotations(horizontalLine({ left: 40, right: 8 }));
            const wideRight = await applyAnnotations(horizontalLine({ left: 8, right: 40 }));
            // Guard against a vacuously-identical pair of blank renders.
            expect(wideLeft).not.toMatchImage(baseline, { writeDiff: false });
            // Both total 48, so the container is the same size and only its position differs.
            expect(wideLeft).not.toMatchImage(wideRight, { writeDiff: false });
        });

        it('does not average asymmetric top/bottom padding', async () => {
            await prepareChart();
            const baseline = ctx.snapshot();
            const wideTop = await applyAnnotations(verticalLine({ top: 40, bottom: 8 }));
            const wideBottom = await applyAnnotations(verticalLine({ top: 8, bottom: 40 }));
            expect(wideTop).not.toMatchImage(baseline, { writeDiff: false });
            expect(wideBottom).not.toMatchImage(wideTop, { writeDiff: false });
        });

        it('defaults to the previous spacing of { top: 4, right: 8, bottom: 4, left: 8 }', async () => {
            await prepareChart();
            const baseline = ctx.snapshot();
            const noPadding = await applyAnnotations(horizontalLine());
            const explicitDefault = await applyAnnotations(horizontalLine({ top: 4, right: 8, bottom: 4, left: 8 }));
            const uniform = await applyAnnotations(horizontalLine(12));
            expect(noPadding).not.toMatchImage(baseline, { writeDiff: false });
            expect(explicitDefault).toMatchImage(noPadding);
            expect(uniform).not.toMatchImage(noPadding, { writeDiff: false });
        });

        it('fills the unspecified sides of a partial padding object from the default', async () => {
            await prepareChart();
            const baseline = ctx.snapshot();
            const partial = await applyAnnotations(horizontalLine({ right: 20 }));
            const equivalent = await applyAnnotations(horizontalLine({ top: 4, right: 20, bottom: 4, left: 8 }));
            const uniform = await applyAnnotations(horizontalLine(20));
            expect(partial).not.toMatchImage(baseline, { writeDiff: false });
            expect(partial).toMatchImage(equivalent);
            expect(partial).not.toMatchImage(uniform, { writeDiff: false });
        });

        it('renders the default when padding is nullish', async () => {
            await prepareChart();
            const noPadding = await applyAnnotations(horizontalLine());
            const nullPadding = await applyAnnotations(horizontalLine(null));
            expect(nullPadding).toMatchImage(noPadding);
        });

        it('accepts padding from a theme override', async () => {
            await prepareChart(undefined, {
                ...EXAMPLE_OPTIONS,
                theme: {
                    overrides: {
                        common: {
                            annotations: { 'horizontal-line': { axisLabel: { padding: { right: 40 } } } },
                        },
                    },
                },
            });
            const themed = await applyAnnotations([{ type: 'horizontal-line', value: 75 }]);
            const perAnnotation = await applyAnnotations(horizontalLine({ right: 8 }));
            // The theme value has to reach the rendered container, not merely pass validation.
            expect(themed).not.toMatchImage(perAnnotation, { writeDiff: false });
        });
    });

    describe('axis label alignment with the axis (AG-18182)', () => {
        // A horizontal-line annotation's axis label belongs to the y axis, so its distance from the
        // axis line has to come from the y axis's own layout, not the x axis's.
        const withLabelSpacing = (ySpacing: number, xSpacing: number): AgCartesianChartOptions => ({
            ...EXAMPLE_OPTIONS,
            axes: {
                y: { type: 'number', label: { spacing: ySpacing } },
                x: { type: 'time', label: { spacing: xSpacing } },
            },
            initialState: {
                annotations: [{ type: 'horizontal-line', value: 75, axisLabel: { enabled: true } }],
            },
        });

        // The scene position is the assertion: an image comparison cannot separate the label moving
        // from the axis area around it resizing, and both happen when a label spacing changes.
        const axisLabelX = () => {
            const found: any[] = [];
            const visit = (node: any) => {
                if (node.name === 'AnnotationAxisLabelGroup') found.push(node);
                if (typeof node.children === 'function') {
                    for (const child of node.children()) visit(child);
                }
            };
            visit((deproxy(chart) as any).ctx.scene.root);
            expect(found).toHaveLength(1);
            return found[0].getBBox().x;
        };

        const axisLabelXWith = async (ySpacing: number, xSpacing: number) => {
            await prepareChart(undefined, withLabelSpacing(ySpacing, xSpacing));
            const x = axisLabelX();
            chart.destroy();
            (chart as unknown) = undefined;
            return x;
        };

        it("tracks the y axis's own label spacing", async () => {
            // Widening the y axis's label spacing pushes the axis line inwards by the same amount, so
            // an annotation label that follows the y axis stays put next to the tick labels it aligns with.
            expect(await axisLabelXWith(45, 5)).toBeCloseTo(await axisLabelXWith(5, 5), 5);
        });

        it("ignores the x axis's label spacing", async () => {
            expect(await axisLabelXWith(5, 45)).toBeCloseTo(await axisLabelXWith(5, 5), 5);
        });
    });
});
