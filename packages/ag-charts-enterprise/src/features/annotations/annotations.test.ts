import { afterEach, describe, expect, it } from 'vitest';

import type { AgAnnotation, AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import {
    clickAction,
    deproxy,
    expectWarningsCalls,
    getAxisLayoutState,
    getSeriesRect,
    hoverAction,
    pressKey,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Group, type Node, Text, Transformable } from 'ag-charts-core';
import type { AgHorizontalLineAnnotation } from 'ag-charts-types';

import {
    findSceneNodes,
    getAnnotationAxisButtonElement,
    getAnnotationOptionsToolbarButtons,
    getAnnotationOptionsToolbarDragHandle,
    getAnnotationToolbarsEnabled,
    getAnnotationYAxisDomain,
    hasAnnotationAxisButton,
} from '../../test/featureAccessors';
import { prepareEnterpriseTestOptions } from '../../test/utils';
import {
    ANNOTATIONS_EXAMPLE_OPTIONS,
    compareAnnotationsSnapshot,
    createAnnotationsChart,
    restoreAnnotations,
} from './test/fixture';

// The name of the group the annotations module draws an annotation's label on its axis into.
const ANNOTATION_AXIS_LABEL_GROUP = 'AnnotationAxisLabelGroup';
const SELECTION_AXIS_SHADING = 'AnnotationSelectionAxisShading';

describe('Annotations', () => {
    setupMockConsole();
    let chart: AgChartInstance;
    const ctx = setupMockCanvas();

    async function prepareChart(
        initialStateOptions?: AgCartesianChartOptions['initialState'],
        baseOptions = ANNOTATIONS_EXAMPLE_OPTIONS
    ) {
        chart = await createAnnotationsChart({
            ...baseOptions,
            initialState: { ...baseOptions.initialState, ...(initialStateOptions ?? {}) },
        });
    }

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    const compare = () => compareAnnotationsSnapshot(chart, ctx);
    const applyAnnotations = (annotations: object[]) => restoreAnnotations(chart, ctx, annotations);

    describe('theme defaults', () => {
        async function resolveAnnotationThemes(theme: AgCartesianChartOptions['theme']) {
            chart = await createAnnotationsChart({ ...ANNOTATIONS_EXAMPLE_OPTIONS, theme });
            return deproxy(chart).chartOptions.annotationThemes;
        }

        it.each([
            ['ag-default', '#000', '#fafafa', '#ffffff'],
            ['ag-default-dark', '#fff', '#28313e', '#192232'],
            ['ag-financial-dark', '#fff', '#28313e', '#192232'],
        ] as const)('resolves light/dark annotation colours for %s', async (theme, noteColor, noteFill, handleFill) => {
            const { note, line } = await resolveAnnotationThemes(theme);
            expect(note.color).toBe(noteColor);
            expect(note.background.fill).toBe(noteFill);
            expect(line.handle.fill).toBe(handleFill);
        });

        it.each([
            ['ag-default', '#5090dc'],
            ['ag-material', '#2196F3'],
        ] as const)('resolves `annotationColor` from the %s fills', async (theme, annotationColor) => {
            const { 'quick-date-price-range': quickDatePriceRange } = await resolveAnnotationThemes(theme);
            expect(quickDatePriceRange.up.fill).toBe(annotationColor);
        });

        it('replaces the default fibonacci strokes with a theme override', async () => {
            const strokes = ['red', 'green'];
            const themes = await resolveAnnotationThemes({
                overrides: { common: { annotations: { 'fibonacci-retracement': { strokes } } } },
            });
            expect(themes['fibonacci-retracement'].strokes).toEqual(strokes);
        });
    });

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
                    'AG Charts - Option `annotations[0][type=callout].color` cannot be set to `"lab(50% 40 59.5)"`; expecting a supported color string (hex, rgb(), hsl(), oklch() or a CSS color name) or a color ref and where a color ref with [onto] or [ontoColor] must also have [mix], ignoring.',
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
        interface TextAnnotation {
            text: {
                label: string;
                position: 'top' | 'center' | 'bottom';
                alignment: 'left' | 'center' | 'right';
            };
        }

        const annotations: TextAnnotation[] = [
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
                        ...annotation,
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
                    ...annotation,
                    type: 'horizontal-line',
                    value: 90 - index * 10,
                })),
            });
            await compare();
        });

        it('should render vertical line annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => ({
                    ...annotation,
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
                    };
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
                    };
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
                        ...annotation,
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

    describe('toolbar options', () => {
        const withAnnotations = (annotations: AgCartesianChartOptions['annotations']): AgCartesianChartOptions => ({
            ...ANNOTATIONS_EXAMPLE_OPTIONS,
            annotations,
        });

        it('enables both toolbars from `annotations.enabled` when they are not configured', async () => {
            await prepareChart(undefined, withAnnotations({ enabled: true }));

            expect(getAnnotationToolbarsEnabled(chart).toolbar).toBe(true);
            expect(getAnnotationToolbarsEnabled(chart).optionsToolbar).toBe(true);
        });

        it('keeps the options toolbar enabled when only the toolbar is disabled', async () => {
            await prepareChart();

            expect(getAnnotationToolbarsEnabled(chart).toolbar).toBe(false);
            expect(getAnnotationToolbarsEnabled(chart).optionsToolbar).toBe(true);
        });

        it.each([
            [undefined, false, true],
            ['x', true, false],
            ['y', false, true],
            ['xy', true, true],
        ] as const)('with `axesButtons.axes: %s` shows the x button %s and the y button %s', async (axes, x, y) => {
            await prepareChart(
                undefined,
                withAnnotations({ enabled: true, toolbar: { enabled: false }, axesButtons: { enabled: true, axes } })
            );

            expect(hasAnnotationAxisButton(chart, 'x')).toBe(x);
            expect(hasAnnotationAxisButton(chart, 'y')).toBe(y);
        });

        it('returns the axis button to the y axis when `axesButtons.axes` is removed on update', async () => {
            await prepareChart(
                undefined,
                withAnnotations({
                    enabled: true,
                    toolbar: { enabled: false },
                    axesButtons: { enabled: true, axes: 'x' },
                })
            );
            expect(hasAnnotationAxisButton(chart, 'x')).toBe(true);

            await chart.update(
                prepareEnterpriseTestOptions(withAnnotations({ enabled: true, toolbar: { enabled: false } }))
            );
            await waitForChartStability(chart);

            expect(hasAnnotationAxisButton(chart, 'x')).toBe(false);
            expect(hasAnnotationAxisButton(chart, 'y')).toBe(true);
        });

        describe('buttonSize', () => {
            const sizeOf = (element: Element) =>
                (element as HTMLElement).style.getPropertyValue('--toolbar-button-size');
            const iconSizeOf = (element: Element) =>
                (element as HTMLElement).style.getPropertyValue('--toolbar-icon-size');
            const sharedButtons = () =>
                Array.from(document.querySelectorAll('.ag-charts-shared-toolbar .ag-charts-toolbar__button'));
            const sizedOptions = (chartToolbarEnabled: boolean): AgCartesianChartOptions => ({
                ...withAnnotations({ enabled: true, toolbar: { enabled: true, buttonSize: 44 } }),
                theme: { overrides: { common: { chartToolbar: { enabled: chartToolbarEnabled, buttonSize: 40 } } } },
            });

            it('sizes each shared toolbar section from its own option', async () => {
                await prepareChart(undefined, sizedOptions(true));

                const [chartToolbarButton, ...annotationButtons] = sharedButtons();
                expect(sizeOf(chartToolbarButton)).toBe('40px');
                expect(iconSizeOf(chartToolbarButton)).toBe('24px');
                expect(annotationButtons.length).toBeGreaterThan(0);
                for (const button of annotationButtons) {
                    expect(sizeOf(button)).toBe('44px');
                    expect(iconSizeOf(button)).toBe('26px');
                    expect(button.classList).toContain('ag-charts-toolbar__button--sized');
                }
            });

            it('keeps each section sized when the chart toolbar section is added in front', async () => {
                await prepareChart(undefined, sizedOptions(false));
                expect(
                    sharedButtons()
                        .map(sizeOf)
                        .every((size) => size === '44px')
                ).toBe(true);

                await chart.update(prepareEnterpriseTestOptions(sizedOptions(true)));
                await waitForChartStability(chart);

                const [chartToolbarButton, ...annotationButtons] = sharedButtons();
                expect(sizeOf(chartToolbarButton)).toBe('40px');
                expect(annotationButtons.length).toBeGreaterThan(0);
                expect(annotationButtons.map(sizeOf).every((size) => size === '44px')).toBe(true);
            });

            it('leaves the buttons unsized when not set', async () => {
                await prepareChart(undefined, withAnnotations({ enabled: true, toolbar: { enabled: true } }));

                const buttons = sharedButtons();
                expect(buttons.length).toBeGreaterThan(0);
                for (const button of buttons) {
                    expect(sizeOf(button)).toBe('');
                    expect(iconSizeOf(button)).toBe('');
                    expect(button.classList).not.toContain('ag-charts-toolbar__button--sized');
                }
            });

            it('sizes the options toolbar buttons', async () => {
                await prepareChart(
                    {
                        annotations: [
                            {
                                type: 'line',
                                start: { x: { __type: 'date', value: '2024-03-01' }, y: 20 },
                                end: { x: { __type: 'date', value: '2024-09-01' }, y: 80 },
                            },
                        ],
                    },
                    withAnnotations({ enabled: true, optionsToolbar: { buttonSize: 10 } })
                );
                const buttons = getAnnotationOptionsToolbarButtons(chart);
                expect(buttons.length).toBeGreaterThan(0);
                for (const button of buttons) {
                    expect(sizeOf(button)).toBe('10px');
                    expect(iconSizeOf(button)).toBe('6px');
                }

                const dragHandle = getAnnotationOptionsToolbarDragHandle(chart);
                expect(dragHandle.classList).toContain('ag-charts-floating-toolbar__drag-handle--sized');
                expect(sizeOf(dragHandle)).toBe('10px');
                expect(iconSizeOf(dragHandle)).toBe('6px');
            });
        });

        describe('axis button position', () => {
            const BUTTON_SIZE = 20;

            const buttonElement = (axis: 'x' | 'y'): HTMLElement => getAnnotationAxisButtonElement(chart, axis);

            const prepareAxisButtons = async () => {
                await prepareChart(
                    undefined,
                    withAnnotations({
                        enabled: true,
                        toolbar: { enabled: false },
                        axesButtons: { enabled: true, axes: 'xy' },
                    })
                );
                for (const axis of ['x', 'y'] as const) {
                    const element = buttonElement(axis);
                    Object.defineProperty(element, 'clientWidth', { configurable: true, value: BUTTON_SIZE });
                    Object.defineProperty(element, 'clientHeight', { configurable: true, value: BUTTON_SIZE });
                }
                const seriesRect = getSeriesRect(chart);
                await hoverAction(seriesRect.x + seriesRect.width / 2, seriesRect.y + seriesRect.height / 2)(chart);
                return seriesRect;
            };

            const moveOverButton = (axis: 'x' | 'y', clientX: number, clientY: number) => {
                const element = buttonElement(axis);
                element.dispatchEvent(new MouseEvent('mousemove', { clientX, clientY, bubbles: true }));
                const [, x, y] = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(element.style.transform)!;
                return { x: Number(x), y: Number(y) };
            };

            it.each([
                ['above the top', -40, 0],
                ['below the bottom', 40, 1],
            ])('keeps the y-axis button inside the series area when the pointer moves %s', async (_, offset, edge) => {
                const seriesRect = await prepareAxisButtons();
                const clientY = seriesRect.y + edge * seriesRect.height + offset;

                const { y } = moveOverButton('y', seriesRect.x + seriesRect.width / 2, clientY);

                expect(y).toBe(Math.round(edge * (seriesRect.height - BUTTON_SIZE)));
            });

            it.each([
                ['past the left edge', -40, 0],
                ['past the right edge', 40, 1],
            ])('keeps the x-axis button inside the series area when the pointer moves %s', async (_, offset, edge) => {
                const seriesRect = await prepareAxisButtons();
                const clientX = seriesRect.x + edge * seriesRect.width + offset;

                const { x } = moveOverButton('x', clientX, seriesRect.y + seriesRect.height / 2);

                expect(x).toBe(Math.round(edge * (seriesRect.width - BUTTON_SIZE)));
            });

            it('adds a horizontal line near the top of the domain when the clamped y-axis button is clicked', async () => {
                const seriesRect = await prepareAxisButtons();
                moveOverButton('y', seriesRect.x + seriesRect.width / 2, seriesRect.y - 40);

                buttonElement('y').click();
                await waitForChartStability(chart);

                const [yMin, yMax] = getAnnotationYAxisDomain(chart);
                const expected = yMax - ((yMax - yMin) * (BUTTON_SIZE / 2)) / seriesRect.height;
                const { annotations = [] } = chart.getState();
                expect(annotations).toHaveLength(1);
                expect(annotations[0]).toMatchObject({ type: 'horizontal-line' });
                expect((annotations[0] as AgHorizontalLineAnnotation).value).toBeCloseTo(expected, 6);
            });
        });

        it('swaps the lock switch to its checked overrides while the selected annotation is locked', async () => {
            await prepareChart(
                { annotations: [{ type: 'horizontal-line', value: 50, locked: true }] },
                {
                    ...ANNOTATIONS_EXAMPLE_OPTIONS,
                    annotations: {
                        ...ANNOTATIONS_EXAMPLE_OPTIONS.annotations,
                        optionsToolbar: {
                            buttons: [
                                {
                                    type: 'switch',
                                    value: 'lock',
                                    icon: 'unlocked',
                                    label: 'Lock',
                                    tooltip: 'toolbarAnnotationsLock',
                                    checkedOverrides: { icon: 'locked', tooltip: 'toolbarAnnotationsUnlock' },
                                },
                            ],
                        },
                    },
                }
            );
            const rect = deproxy(chart).seriesRect;
            expect(rect).toBeDefined();
            const centre = { x: rect!.x + rect!.width / 2, y: rect!.y + rect!.height / 2 };

            await hoverAction(centre.x, centre.y)(chart);
            await clickAction(centre.x, centre.y)(chart);
            await waitForChartStability(chart);

            const lockSwitch = () =>
                deproxy(chart).ctx.agDocument.body.querySelector<HTMLElement>('button[aria-checked]');
            expect(lockSwitch()?.getAttribute('aria-checked')).toBe('true');
            expect(lockSwitch()?.querySelector('.ag-charts-icon-locked')).not.toBeNull();
            expect(lockSwitch()?.title).toBe('Unlock');
            expect(lockSwitch()?.querySelector('.ag-charts-toolbar__label')).toBeNull();

            lockSwitch()!.click();
            await waitForChartStability(chart);

            expect(lockSwitch()?.getAttribute('aria-checked')).toBe('false');
            expect(lockSwitch()?.querySelector('.ag-charts-icon-unlocked')).not.toBeNull();
            expect(lockSwitch()?.title).toBe('Lock');
            expect(lockSwitch()?.querySelector('.ag-charts-toolbar__label')?.textContent).toBe('Lock');
        });
    });

    describe('settings dialog coordinates', () => {
        it('edits the selected annotation and follows an undo', async () => {
            await prepareChart({ annotations: [{ type: 'horizontal-line', value: 50 }] });
            const { x, y, width, height } = getSeriesRect(chart);
            await hoverAction(x + width / 2, y + height / 2)(chart);
            await clickAction(x + width / 2, y + height / 2)(chart);
            await waitForChartStability(chart);

            const { body } = deproxy(chart).ctx.agDocument;
            body.querySelector<HTMLElement>('button[title="Settings"]')!.click();
            await waitForChartStability(chart);

            const input = body.querySelector<HTMLInputElement>('input[aria-label="Value Y"]')!;
            input.value = '60';
            input.dispatchEvent(new Event('change'));
            await waitForChartStability(chart);
            expect(chart.getState().annotations).toMatchObject([{ type: 'horizontal-line', value: 60 }]);

            await pressKey(chart, 'z', { ctrlKey: true });
            expect(chart.getState().annotations).toMatchObject([{ type: 'horizontal-line', value: 50 }]);
            expect(input.value).toBe('50');
        });
    });

    describe('selected annotation axes', () => {
        // Both axes span 100 units (the x axis, 100 days from 2024-01-01), so a datum offset is also the fraction of the
        // way along its axis.
        const day = (offset: number) => ({
            __type: 'date' as const,
            value: new Date(Date.UTC(2024, 0, 1 + offset)).toISOString().slice(0, 10),
        });

        const withAxes = (xPosition: 'top' | 'bottom' = 'bottom', yPosition: 'left' | 'right' = 'left') =>
            ({
                ...ANNOTATIONS_EXAMPLE_OPTIONS,
                data: [
                    { x: new Date('2024-01-01'), y: 0 },
                    { x: new Date('2024-04-10'), y: 100 },
                ],
                axes: {
                    x: {
                        type: 'time',
                        position: xPosition,
                        min: new Date('2024-01-01'),
                        max: new Date('2024-04-10'),
                        nice: false,
                    },
                    y: { type: 'number', position: yPosition, min: 0, max: 100, nice: false },
                },
            }) satisfies AgCartesianChartOptions;

        const clickDatum = async (x: number, y: number) => {
            const { x: left, y: top, width, height } = getSeriesRect(chart);
            const canvasX = left + (width * x) / 100;
            const canvasY = top + (height * (100 - y)) / 100;
            await hoverAction(canvasX, canvasY)(chart);
            await clickAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart);
        };

        const visibleAxisLabels = () =>
            findSceneNodes(chart, (node) => node.name === ANNOTATION_AXIS_LABEL_GROUP && node.visible);
        const visibleShading = () =>
            findSceneNodes(chart, (node) => node.name === SELECTION_AXIS_SHADING && node.visible);

        // Each annotation with a point on its body to click it by, and the text of the axis labels it shows when selected:
        // the exact datum values, x as the plain date.
        interface Selectable {
            name: string;
            annotation: AgAnnotation;
            body: { x: number; y: number };
            texts: string[];
        }
        const [START, END] = [
            { x: day(20), y: 25 },
            { x: day(80), y: 75 },
        ];
        const SELECTABLE: Selectable[] = [
            {
                name: 'line',
                annotation: { type: 'line', start: START, end: END },
                body: { x: 50, y: 50 },
                texts: ['Jan 21 2024', 'Mar 21 2024', '25', '75'],
            },
            {
                name: 'arrow',
                annotation: { type: 'arrow', start: START, end: END },
                body: { x: 50, y: 50 },
                texts: ['Jan 21 2024', 'Mar 21 2024', '25', '75'],
            },
            {
                name: 'fibonacci-retracement',
                annotation: { type: 'fibonacci-retracement', start: START, end: END },
                // On the 0.5 level, which is drawn between the two x positions.
                body: { x: 50, y: 50 },
                texts: ['Jan 21 2024', 'Mar 21 2024', '25', '75'],
            },
            {
                name: 'fibonacci-retracement-trend-based',
                annotation: {
                    type: 'fibonacci-retracement-trend-based',
                    start: START,
                    end: { x: day(50), y: 75 },
                    endRetracement: { x: day(80), y: 50 },
                },
                // On the trend line between the start and the end.
                body: { x: 35, y: 50 },
                texts: ['Jan 21 2024', 'Feb 20 2024', 'Mar 21 2024', '25', '50', '75'],
            },
            {
                name: 'parallel-channel',
                annotation: {
                    type: 'parallel-channel',
                    start: { x: day(20), y: 30 },
                    end: { x: day(80), y: 60 },
                    height: 20,
                },
                body: { x: 50, y: 45 },
                // Its four corners, not the middle handles that only move an edge.
                texts: ['Jan 21 2024', 'Mar 21 2024', '10', '30', '40', '60'],
            },
            {
                name: 'disjoint-channel',
                annotation: {
                    type: 'disjoint-channel',
                    start: { x: day(20), y: 30 },
                    end: { x: day(80), y: 60 },
                    startHeight: 10,
                    endHeight: 20,
                },
                body: { x: 50, y: 45 },
                // All four handles, including the univariant one at the end of the bottom line.
                texts: ['Jan 21 2024', 'Mar 21 2024', '20', '30', '40', '60'],
            },
            ...(['date-range', 'price-range', 'date-price-range', 'quick-date-price-range'] as const).map(
                (type): Selectable => ({
                    name: type,
                    annotation: { type, start: START, end: END },
                    body: { x: 50, y: 50 },
                    texts: ['Jan 21 2024', 'Mar 21 2024', '25', '75'],
                })
            ),
        ];
        const SNAPSHOTTED = SELECTABLE.filter(({ name }) => ['line', 'parallel-channel'].includes(name));
        const { annotation: LINE, body: LINE_BODY } = SELECTABLE[0];
        // Away from every annotation above, so that clicking it deselects.
        const EMPTY = { x: 10, y: 95 };

        const byText = (a: string, b: string) => a.localeCompare(b);
        const axisLabelTexts = () =>
            visibleAxisLabels()
                .flatMap((label) => (label instanceof Group ? Array.from(label.descendants()) : []))
                .filter((node): node is Text => node instanceof Text)
                .map((text) => String(text.text));

        it.each(SELECTABLE)(
            'labels the axes with the exact values of a selected $name',
            async ({ annotation, body, texts }) => {
                await prepareChart({ annotations: [annotation] }, withAxes());

                await clickDatum(body.x, body.y);

                // Unrounded values read as plain dates and the values as given; rounded ones would carry a time of day.
                expect(axisLabelTexts().sort(byText)).toEqual([...texts].sort(byText));
            }
        );

        it.each(SELECTABLE)(
            'lets the datum and the theme switch off the labels and shading of a selected $name',
            async ({ name, annotation, body }) => {
                const off = { axisLabel: { enabled: false }, axisShading: { enabled: false } };
                const select = async (options: AgCartesianChartOptions, datum: AgAnnotation) => {
                    await prepareChart({ annotations: [datum] }, options);
                    await clickDatum(body.x, body.y);
                    expect(visibleAxisLabels()).toHaveLength(0);
                    expect(visibleShading()).toHaveLength(0);
                    chart.destroy();
                };

                await select(withAxes(), { ...annotation, ...off });
                await select(
                    { ...withAxes(), theme: { overrides: { common: { annotations: { [name]: off } } } } },
                    annotation
                );
            }
        );

        it('draws one label and no shading along an axis where the handles share a position', async () => {
            // The two ends are well under a pixel apart along x, so they collapse to one position there.
            const line = { type: 'line', start: { x: day(50), y: 25 }, end: { x: day(50.01), y: 75 } } as AgAnnotation;
            await prepareChart({ annotations: [line] }, withAxes());

            await clickDatum(50, 50);

            expect(axisLabelTexts().sort(byText)).toEqual(['25', '75', 'Feb 20 2024']);
            expect(visibleShading()).toHaveLength(1);
        });

        it.each(SNAPSHOTTED)(
            'shows axis labels and shading on both axes for a selected $name',
            async ({ annotation, body }) => {
                await prepareChart({ annotations: [annotation] }, withAxes());
                expect(visibleAxisLabels()).toHaveLength(0);

                await clickDatum(body.x, body.y);

                expect(visibleAxisLabels().length).toBeGreaterThan(0);
                await compare();
            }
        );

        it('removes the axis labels and shading when the annotation is deselected', async () => {
            await prepareChart({ annotations: [LINE] }, withAxes());
            // The pointer highlights the series datum nearest it, so rest it where it will be after deselecting.
            await clickDatum(EMPTY.x, EMPTY.y);
            const unselected = ctx.snapshot();

            await clickDatum(LINE_BODY.x, LINE_BODY.y);
            expect(visibleAxisLabels()).toHaveLength(4);
            expect(ctx.snapshot()).not.toMatchImage(unselected, { writeDiff: false });

            await clickDatum(EMPTY.x, EMPTY.y);
            expect(visibleAxisLabels()).toHaveLength(0);
            expect(ctx.snapshot()).toMatchImage(unselected);
        });

        it('shows the axis labels and shading of a newly drawn annotation without reselecting it', async () => {
            await prepareChart(undefined, {
                ...withAxes(),
                annotations: { enabled: true, toolbar: { enabled: true, buttons: [{ value: 'line', label: 'Line' }] } },
            });

            Array.from(document.querySelectorAll('button'))
                .find((button) => button.textContent === 'Line')!
                .click();
            await waitForChartStability(chart);
            await clickDatum(20, 25);
            await clickDatum(80, 75);

            expect(visibleAxisLabels()).toHaveLength(4);
            expect(visibleShading()).toHaveLength(2);
        });

        it.each([
            ['horizontal-line', { type: 'horizontal-line', value: 60 }, { x: 50, y: 60 }],
            ['vertical-line', { type: 'vertical-line', value: day(60) }, { x: 60, y: 50 }],
        ] as [string, AgAnnotation, { x: number; y: number }][])(
            'keeps the single axis label of a selected %s and adds no shading',
            async (_, annotation, body) => {
                await prepareChart({ annotations: [annotation] }, withAxes());
                expect(visibleAxisLabels()).toHaveLength(1);

                await clickDatum(body.x, body.y);

                expect(visibleAxisLabels()).toHaveLength(1);
                expect(visibleShading()).toHaveLength(0);
            }
        );

        it.each([
            ['both', {}, 4, 2],
            ['labels only', { axisShading: { enabled: false } }, 4, 0],
            ['shading only', { axisLabel: { enabled: false } }, 0, 2],
            ['neither', { axisLabel: { enabled: false }, axisShading: { enabled: false } }, 0, 0],
        ])('draws the shading and the labels independently of each other: %s', async (_, styles, labels, shading) => {
            await prepareChart({ annotations: [{ ...LINE, ...styles }] }, withAxes());

            await clickDatum(LINE_BODY.x, LINE_BODY.y);

            // One label for each end of the line on each axis, and one band of shading on each axis.
            expect(visibleAxisLabels()).toHaveLength(labels);
            expect(visibleShading()).toHaveLength(shading);
        });

        it('places the labels and shading beside a top x axis and a right y axis', async () => {
            await prepareChart({ annotations: [LINE] }, withAxes('top', 'right'));

            await clickDatum(LINE_BODY.x, LINE_BODY.y);

            expect(visibleAxisLabels()).toHaveLength(4);
            await compare();
        });

        // A log axis cannot show 0, so its data stays above it.
        const withYAxis = (type: 'number' | 'log') => ({
            ...withAxes(),
            data: [
                { x: new Date('2024-01-01'), y: 1 },
                { x: new Date('2024-04-10'), y: 1000 },
            ],
            axes: { ...withAxes().axes, y: { type, min: 1, max: 1000, nice: false } },
        });

        // Changing the type of an axis replaces it, and the labels and shading have to follow it to the new one.
        it('keeps the labels and shading on the axes when the chart replaces them while the annotation is selected', async () => {
            await prepareChart(
                { annotations: [{ type: 'line', start: { x: day(20), y: 100 }, end: { x: day(80), y: 900 } }] },
                withYAxis('number')
            );
            await clickDatum(50, 50);
            expect(visibleAxisLabels()).toHaveLength(4);
            expect(visibleShading()).toHaveLength(2);

            await chart.update(prepareEnterpriseTestOptions({ ...withYAxis('log'), initialState: undefined }) as never);
            await waitForChartStability(chart);

            // Nodes left on a detached axis layer are not part of the chart, so they are not found.
            expect(visibleAxisLabels()).toHaveLength(4);
            expect(visibleShading()).toHaveLength(2);
            expect(axisLabelTexts().sort(byText)).toEqual(['100', '900', 'Jan 21 2024', 'Mar 21 2024'].sort(byText));
        });

        // Where an axis is not linear and continuous, the value of a position is read differently.
        it.each<{
            name: string;
            options: AgCartesianChartOptions;
            annotation: AgAnnotation;
            click: number[];
            texts: string[];
        }>([
            {
                name: 'a log y axis',
                options: withYAxis('log'),
                annotation: { type: 'line', start: { x: day(20), y: 10 }, end: { x: day(80), y: 100 } },
                // A third and two thirds of the way up the log axis, so the middle of the line is in the middle.
                click: [50, 50],
                texts: ['10', '100', 'Jan 21 2024', 'Mar 21 2024'],
            },
            {
                name: 'a category x axis',
                options: {
                    ...ANNOTATIONS_EXAMPLE_OPTIONS,
                    data: ['Q1', 'Q2', 'Q3', 'Q4'].map((category, i) => ({ category, value: 20 * (i + 1) })),
                    series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                        y: { type: 'number', position: 'left', min: 0, max: 100, nice: false },
                    },
                },
                annotation: { type: 'line', start: { x: 'Q1', y: 85 }, end: { x: 'Q4', y: 95 } },
                // Above the bars, and a category sits at the start of its band, so the line's middle is left of centre.
                click: [41, 90],
                texts: ['85', '95', 'Q1', 'Q4'],
            },
        ])('labels a selected line with the values of $name', async ({ options, annotation, click, texts }) => {
            await prepareChart({ annotations: [annotation] }, options);

            await clickDatum(click[0], click[1]);

            expect(axisLabelTexts().sort(byText)).toEqual([...texts].sort(byText));
        });

        // The band of shading along each axis, the wider of the two being the one along the x axis.
        const shadingBands = () => {
            const [horizontal, vertical] = visibleShading()
                .map((node) => node.getBBox())
                .sort((a, b) => b.width - a.width);
            return { horizontal, vertical };
        };

        it('labels only the points inside the axes but shades up to the edge of the series area', async () => {
            // The end is past both the right and the top of the chart.
            await prepareChart(
                { annotations: [{ type: 'line', start: START, end: { x: day(120), y: 150 } }] },
                withAxes()
            );

            await clickDatum(50, 62.5);

            expect(axisLabelTexts().sort(byText)).toEqual(['25', 'Jan 21 2024']);
            const { x, y, width, height } = getSeriesRect(chart);
            const { horizontal, vertical } = shadingBands();
            expect(horizontal.x + horizontal.width).toBeCloseTo(x + width, 0);
            expect(vertical.y).toBeCloseTo(y, 0);
            expect(vertical.height).toBeLessThanOrEqual(height + 1);
        });

        it('labels the points inside a zoomed chart and shades across the rest', async () => {
            // Both ends of the line are outside the zoomed range of the x axis, the y axis is not zoomed.
            await prepareChart(
                { annotations: [LINE], zoom: { ratioX: { start: 0.25, end: 0.75 } } },
                { ...withAxes(), zoom: { enabled: true } }
            );

            await clickDatum(50, 50);

            expect(axisLabelTexts().sort(byText)).toEqual(['25', '75']);
            const { x, width } = getSeriesRect(chart);
            const { horizontal } = shadingBands();
            expect(horizontal.x).toBeCloseTo(x, 0);
            expect(horizontal.width).toBeCloseTo(width, 0);
        });

        it('shades out to the further edge of the tick labels and axis labels, and stops short of the axis titles', async () => {
            const { axes, ...options } = withAxes();
            await prepareChart(
                { annotations: [LINE] },
                {
                    ...options,
                    axes: {
                        x: { ...axes.x, title: { text: 'Date' } },
                        y: { ...axes.y, title: { text: 'Price' } },
                    },
                }
            );

            await clickDatum(50, 50);

            const canvasBoxes = (predicate: (node: Node) => boolean) =>
                findSceneNodes(chart, predicate).map((node) => Transformable.toCanvas(node));
            const tickLabels = (pattern: RegExp) =>
                canvasBoxes((node) => node instanceof Text && pattern.test(String(node.text)));
            const xTicks = tickLabels(/^[A-Z][a-z]{2}\s+\d{1,2}$/);
            const yTicks = tickLabels(/^(0|20|40|60|80|100)$/);
            const axisLabels = visibleAxisLabels().map((node) => Transformable.toCanvas(node));
            const [xTitle] = tickLabels(/^Date$/);
            const [yTitle] = tickLabels(/^Price$/);
            const [horizontal, vertical] = visibleShading()
                .map((node) => Transformable.toCanvas(node))
                .sort((a, b) => b.width - a.width);

            const bottomEdge = Math.max(...[...xTicks, ...axisLabels].map((box) => box.y + box.height));
            const leftEdge = Math.min(...[...yTicks, ...axisLabels].map((box) => box.x));
            expect(horizontal.y + horizontal.height).toBeCloseTo(bottomEdge, 0);
            expect(vertical.x).toBeCloseTo(leftEdge, 0);
            expect(horizontal.y + horizontal.height).toBeLessThanOrEqual(xTitle.y);
            expect(vertical.x).toBeGreaterThanOrEqual(yTitle.x + yTitle.width);
        });

        it.each([
            ['line', LINE],
            ['parallel-channel', SELECTABLE.find(({ name }) => name === 'parallel-channel')!.annotation],
        ])('writes the state of a selected %s back so that it restores unchanged', async (_, annotation) => {
            await prepareChart({ annotations: [annotation] }, withAxes());
            const saved = chart.getState().annotations;

            chart.destroy();
            await prepareChart({ annotations: saved }, withAxes());

            expect(chart.getState().annotations).toEqual(saved);
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
                ...ANNOTATIONS_EXAMPLE_OPTIONS,
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
            ...ANNOTATIONS_EXAMPLE_OPTIONS,
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
            const found = findSceneNodes(chart, (node) => node.name === ANNOTATION_AXIS_LABEL_GROUP);
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

    describe('axis label alignment with a boxed tick label (AG-18182)', () => {
        // An axis offsets a boxed tick label - one with a `fill` or a bordered stroke - so its box,
        // rather than its text, keeps the label spacing. The annotation label has to take that offset too.
        const withAxisLabel = (position: 'left' | 'right', label: object): AgCartesianChartOptions => ({
            ...ANNOTATIONS_EXAMPLE_OPTIONS,
            axes: {
                y: { type: 'number', position, label },
                x: { type: 'time' },
            },
            initialState: {
                annotations: [{ type: 'horizontal-line', value: 50, axisLabel: { enabled: true } }],
            },
        });

        // Gap between the two labels' text edges facing the axis line - text, not box, is what the
        // unboxed default aligns. A tick label's anchor is that edge; its bbox would cover the drawn box.
        const textEdgeGap = (position: 'left' | 'right') => {
            const isNumberText = (node: Node): node is Text => node instanceof Text && /^\d+$/.test(String(node.text));
            const annotationTexts = findSceneNodes(chart, (node) => node.name === ANNOTATION_AXIS_LABEL_GROUP)
                .flatMap((group) => (group instanceof Group ? Array.from(group.descendants()) : []))
                .filter(isNumberText);
            const tickTexts = findSceneNodes(chart, isNumberText).filter((node) => !annotationTexts.includes(node));
            expect(annotationTexts).toHaveLength(1);
            expect(tickTexts.length).toBeGreaterThan(0);

            const axisX = getAxisLayoutState(chart, position).translation.x;
            const annotationBox = annotationTexts[0].getBBox();
            const annotationEdge = position === 'right' ? annotationBox.x : annotationBox.x + annotationBox.width;
            return annotationEdge - (axisX + tickTexts[0].x);
        };

        const gapWith = async (position: 'left' | 'right', label: object) => {
            await prepareChart(undefined, withAxisLabel(position, label));
            const gap = textEdgeGap(position);
            chart.destroy();
            (chart as unknown) = undefined;
            return gap;
        };

        for (const position of ['right', 'left'] as const) {
            it(`aligns with an unboxed ${position} axis tick label`, async () => {
                expect(await gapWith(position, {})).toBeCloseTo(0, 1);
            });

            it(`aligns with a filled ${position} axis tick label`, async () => {
                expect(await gapWith(position, { fill: 'pink' })).toBeCloseTo(0, 1);
            });

            it(`aligns with a filled ${position} axis tick label carrying explicit padding`, async () => {
                expect(await gapWith(position, { fill: 'pink', padding: 6 })).toBeCloseTo(0, 1);
            });

            it(`aligns with a bordered ${position} axis tick label`, async () => {
                const label = { border: { enabled: true, stroke: 'red', strokeWidth: 1 }, padding: 7 };
                expect(await gapWith(position, label)).toBeCloseTo(0, 1);
            });
        }
    });

    describe('following a series value (AG-16273)', () => {
        const day = (value: string) => new Date(value);
        const withSeries = (
            data: AgCartesianChartOptions['data'],
            series: AgCartesianChartOptions['series']
        ): AgCartesianChartOptions => ({ ...ANNOTATIONS_EXAMPLE_OPTIONS, data, series });

        // The axis label of each annotation, in annotation order: the text it shows, where it is drawn and whether it is shown.
        const axisLabels = () =>
            findSceneNodes(
                chart,
                (node): node is Group => node instanceof Group && node.name === ANNOTATION_AXIS_LABEL_GROUP
            ).map((group) => ({
                text: Array.from(group.descendants()).find((node): node is Text => node instanceof Text)?.text,
                y: group.getBBox().y + group.getBBox().height / 2,
                visible: group.visible,
            }));

        // The y of `value` on the y axis in canvas coordinates; the axis is linear.
        const yOf = (value: number) => {
            const [min, max] = getAnnotationYAxisDomain(chart);
            const { y, height } = getSeriesRect(chart);
            return y + (height * (max - value)) / (max - min);
        };

        const SCATTER_DATA = ANNOTATIONS_EXAMPLE_OPTIONS.data;

        const TWO_SERIES = withSeries(
            [
                { x: day('2024-01-05'), a: 10, b: 60 },
                { x: day('2024-06-15'), a: 40, b: 30 },
                { x: day('2024-12-25'), a: 20, b: 80 },
            ],
            [
                { type: 'line', id: 'a', xKey: 'x', yKey: 'a' },
                { type: 'line', id: 'b', xKey: 'x', yKey: 'b' },
            ]
        );

        const labelled = (
            label: string,
            position: 'top' | 'bottom' = 'top'
        ): Pick<AgHorizontalLineAnnotation, 'axisLabel' | 'text'> => ({
            axisLabel: { enabled: true },
            text: { label, position, alignment: 'left' },
        });

        const EXAMPLES: Record<string, { options: AgCartesianChartOptions; annotations: object[] }> = {
            // Without a `seriesId` the first series bound to the y axis is followed.
            FIRST_AND_LAST: {
                options: ANNOTATIONS_EXAMPLE_OPTIONS,
                annotations: [
                    { type: 'horizontal-line', follow: 'first', stroke: 'red', ...labelled('first') },
                    { type: 'horizontal-line', follow: 'last', stroke: 'green', ...labelled('last') },
                ],
            },
            SERIES_ID: {
                options: TWO_SERIES,
                annotations: [
                    { type: 'horizontal-line', follow: 'last', stroke: 'red', ...labelled('default: a') },
                    {
                        type: 'horizontal-line',
                        follow: { follow: 'last', seriesId: 'b' },
                        stroke: 'green',
                        ...labelled('b last', 'bottom'),
                    },
                    {
                        type: 'horizontal-line',
                        follow: { follow: 'first', seriesId: 'b' },
                        stroke: 'blue',
                        ...labelled('b first'),
                    },
                ],
            },
        };

        for (const [name, { options, annotations }] of Object.entries(EXAMPLES)) {
            it(`renders ${name}`, async () => {
                await prepareChart({ annotations: annotations as AgAnnotation[] }, options);
                await compare();
            });
        }

        it('moves the line and its axis label when the chart data is updated', async () => {
            await prepareChart({
                annotations: [{ type: 'horizontal-line', follow: 'last', ...labelled('last') }],
            });
            const before = axisLabels();
            expect(before.map(({ text }) => text)).toEqual(['95']);

            const appended = [...(SCATTER_DATA as object[]), { x: day('2025-03-01'), y: 30 }];
            await chart.update(prepareEnterpriseTestOptions({ ...ANNOTATIONS_EXAMPLE_OPTIONS, data: appended }));
            await waitForChartStability(chart);

            const after = axisLabels();
            expect(after.map(({ text }) => text)).toEqual(['30']);
            expect(after[0].y).toBeGreaterThan(before[0].y);
            expect(after[0].y).toBeCloseTo(yOf(30), 0);
            await compare();
        });

        it('hides the axis label when the followed series loses its values', async () => {
            const labelVisibility = () => axisLabels().map(({ visible }) => visible);

            await prepareChart(
                { annotations: [{ type: 'horizontal-line', follow: 'last', ...labelled('last') }] },
                TWO_SERIES
            );
            expect(labelVisibility()).toEqual([true]);

            const emptied = (TWO_SERIES.data as object[]).map((row) => ({ ...row, a: null }));
            await chart.update(prepareEnterpriseTestOptions({ ...TWO_SERIES, data: emptied }));
            await waitForChartStability(chart);

            expect(labelVisibility()).toEqual([false]);
        });

        it('follows the nearest datum that has a value when the last one has none', async () => {
            await prepareChart(
                undefined,
                withSeries(
                    [
                        { x: day('2024-01-05'), y: 5 },
                        { x: day('2024-06-15'), y: 50 },
                        { x: day('2024-12-25'), y: null },
                    ],
                    [{ type: 'scatter', xKey: 'x', yKey: 'y' }]
                )
            );

            await applyAnnotations([{ type: 'horizontal-line', follow: 'last', ...labelled('last') }]);

            expect(axisLabels().map(({ text }) => text)).toEqual(['50']);
            // The null y is the series' own warning, not the annotation's
            expectWarningsCalls().toEqual([
                ['AG Charts - invalid value of type [object] for [ScatterSeries-1 / yValue] ignored:', '[null]'],
            ]);
        });
    });
});
