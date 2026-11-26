import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgAnnotation, AgAnnotationsEvent, AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import {
    clickAction,
    deproxy,
    doubleClickAction,
    dragAction,
    expectErrorsCalls,
    expectWarningsCalls,
    findAxis,
    getAxisCoordinate,
    getAxisLayoutState,
    getSeriesRect,
    hoverAction,
    mouseDownAction,
    mouseUpAction,
    pressKey,
    releaseKey,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { BandScale, Group, type Node, Rect, Text } from 'ag-charts-core';
import type { AgAnnotationValue, AgAnnotationsOptions, AgHorizontalLineAnnotation } from 'ag-charts-types';

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
    openAnnotationSettings,
    restoreAnnotations,
} from './test/fixture';

// The name of the group the annotations module draws an annotation's label on its axis into.
const ANNOTATION_AXIS_LABEL_GROUP = 'AnnotationAxisLabelGroup';

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
    const CANCEL = '.ag-charts-color-picker__cancel-button';
    const APPLY = '.ag-charts-color-picker__apply-button';
    const PALETTE = '.ag-charts-color-picker__palette';
    const DIALOG_CANCEL = '.ag-charts-dialog__actions button:first-child';
    const DIALOG_APPLY = '.ag-charts-dialog__actions button:last-child';
    /** The example with Apply and Cancel buttons on the colour picker and the settings dialog. */
    const ACTION_BUTTONS_OPTIONS: AgCartesianChartOptions = {
        ...ANNOTATIONS_EXAMPLE_OPTIONS,
        annotations: { ...ANNOTATIONS_EXAMPLE_OPTIONS.annotations, optionsToolbar: { showActionButtons: true } },
    };
    const RED = '#ff0000';
    const GREEN = '#00aa00';
    const BLUE = '#0000ff';
    const chartBody = () => deproxy(chart).ctx.agDocument.body;

    async function clickAt({ x, y }: { x: number; y: number }) {
        await hoverAction(x, y)(chart);
        await clickAction(x, y)(chart);
        await waitForChartStability(chart);
    }

    const press = async (selector: string) => {
        chartBody().querySelector<HTMLElement>(selector)!.click();
        await waitForChartStability(chart);
    };

    const pressKeyOn = async (selector: string, key: 'Enter' | 'Escape') => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        chartBody().querySelector(selector)!.dispatchEvent(event);
        await waitForChartStability(chart);
    };

    const pickColor = async (color: string) => {
        const input = chartBody().querySelector<HTMLInputElement>('.ag-charts-color-picker input[aria-label="Color"]')!;
        input.value = color;
        input.dispatchEvent(new Event('input'));
        await waitForChartStability(chart);
    };

    async function commitInput(container: HTMLElement, label: string, value: string) {
        const input = container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
        input.value = value;
        // A date or date-time input commits on blur, the others on change.
        input.dispatchEvent(new Event(input.type === 'number' || input.type === 'text' ? 'change' : 'blur'));
        await waitForChartStability(chart);
    }

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

    describe('malformed initialState', () => {
        it.each([
            ['annotations as an object', { annotations: {} }],
            ['zoom as an array', { zoom: [] }],
        ] as const)('ignores %s with a warning', async (_name, initialState) => {
            await prepareChart(initialState as never);

            expectWarningsCalls().not.toHaveLength(0);
            expectErrorsCalls().toHaveLength(0);
        });

        it('skips a non-object annotation element', async () => {
            await prepareChart({ annotations: [null] } as never);

            expectErrorsCalls().toHaveLength(0);
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

        // A horizontal bar series swaps its axes, so the `y` of a point is the category axis.
        const HORIZONTAL_BAR_OPTIONS: AgCartesianChartOptions = {
            ...BAR_SERIES_OPTIONS,
            series: [{ type: 'bar', direction: 'horizontal', xKey: 'category', yKey: 'value' }],
            axes: {
                x: { type: 'category', position: 'left' },
                y: { type: 'number', position: 'bottom' },
            },
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

        it('should render and round-trip category `y` values on a horizontal bar chart', async () => {
            const annotations = [
                { type: 'line', start: { x: 5, y: 'Q1' }, end: { x: 5, y: 'Q3' } },
                {
                    type: 'line',
                    start: { x: 20, y: { value: 'Q1', groupPercentage: -1 } },
                    end: { x: 20, y: { value: 'Q3', groupPercentage: 1 } },
                },
                { type: 'arrow-up', x: 10, y: 'Q2' },
                { type: 'horizontal-line', value: 'Q4' },
            ] as AgAnnotation[];

            await prepareChart({ annotations }, HORIZONTAL_BAR_OPTIONS);
            expectWarningsCalls().toHaveLength(0);
            await compare();

            // The state the chart writes must restore without losing the category `y`.
            const state = chart.getState().annotations;
            expect(state).toMatchObject(annotations);
            await chart.setState({ ...chart.getState(), annotations: state });
            await waitForChartStability(chart);
            expectWarningsCalls().toHaveLength(0);
            expect(chart.getState().annotations).toEqual(state);
        });

        const isSelected = () => chartBody().querySelector('button[title="Line Color"]') != null;
        const numericYAxisWarning = (type: string) => [
            `AG Charts - Annotation [${type}] can only be used with a numeric y-axis.`,
        ];

        it.each([
            ['string', ['Q1', 'Q2', 'Q3', 'Q4']],
            ['numeric', [1, 2, 3, 4]],
        ])(
            'does not draw or select parallel and disjoint channels on a category y-axis of %s categories, and keeps them in the state',
            async (_, [first, second, third, fourth]) => {
                const annotations = [
                    { type: 'line', start: { x: 10, y: first }, end: { x: 60, y: first } },
                    { type: 'parallel-channel', start: { x: 10, y: second }, end: { x: 60, y: second }, height: 1 },
                    {
                        type: 'disjoint-channel',
                        start: { x: 10, y: third },
                        end: { x: 60, y: third },
                        startHeight: 1,
                        endHeight: 1,
                    },
                ] as AgAnnotation[];
                const data = [first, second, third, fourth].map((category, i) => ({ category, value: 50 + 10 * i }));

                await prepareChart({ annotations }, { ...HORIZONTAL_BAR_OPTIONS, data });
                expectWarningsCalls().toEqual([
                    numericYAxisWarning('parallel-channel'),
                    numericYAxisWarning('disjoint-channel'),
                ]);
                await compare();

                const { x, y } = getSeriesRect(chart);
                const clickCategory = (category: string | number) =>
                    clickAt({
                        x: x + getAxisCoordinate(chart, 'bottom', 35),
                        y: y + getAxisCoordinate(chart, 'left', category),
                    });
                for (const category of [second, third]) {
                    await clickCategory(category);
                    expect(isSelected()).toBe(false);
                }

                await clickCategory(first);
                expect(isSelected()).toBe(true);

                expect(chart.getState().annotations).toMatchObject(annotations);
            }
        );

        it('does not select a channel restored with coordinates it can no longer draw', async () => {
            const channel = {
                type: 'parallel-channel',
                start: { x: 'Q1', y: 40 },
                end: { x: 'Q4', y: 40 },
                height: 10,
            };
            await prepareChart({ annotations: [channel] as AgAnnotation[] }, BAR_SERIES_OPTIONS);

            await applyAnnotations([{ ...channel, start: { x: 'Q1', y: 'Q2' }, end: { x: 'Q4', y: 'Q2' } }]);
            expectWarningsCalls().toEqual([numericYAxisWarning('parallel-channel')]);
            const { x, y } = getSeriesRect(chart);
            await clickAt({
                x: x + getAxisCoordinate(chart, 'bottom', 'Q2'),
                y: y + getAxisCoordinate(chart, 'left', 40),
            });

            expect(isSelected()).toBe(false);
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

        it('warns once for each custom toolbar button that sets none of ariaLabel, tooltip or label', async () => {
            const options = withAnnotations({
                enabled: true,
                toolbar: {
                    buttons: [
                        { icon: 'text-annotation', value: 'text-menu' },
                        { label: 'Lines', value: 'line-menu' },
                    ],
                },
                optionsToolbar: {
                    buttons: [
                        { ariaLabel: 'Delete', value: 'delete' },
                        { icon: 'delete', value: 'delete' },
                    ],
                },
            });
            await prepareChart(undefined, options);
            await chart.update(prepareEnterpriseTestOptions(options));

            expectWarningsCalls().toEqual([
                [
                    'AG Charts - Option `annotations.toolbar.buttons[0]` has no accessible name; set one of `ariaLabel`, `tooltip` or `label`.',
                ],
                [
                    'AG Charts - Option `annotations.optionsToolbar.buttons[1]` has no accessible name; set one of `ariaLabel`, `tooltip` or `label`.',
                ],
            ]);
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

        it('merges the checked overrides onto the lock switch while the selected annotation is locked', async () => {
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
                                    ariaLabel: 'toolbarAnnotationsLock',
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

            const lockButton = () =>
                deproxy(chart).ctx.agDocument.body.querySelector<HTMLElement>('button[aria-label="Lock"]');
            expect(lockButton()?.hasAttribute('role')).toBe(false);
            expect(lockButton()?.hasAttribute('aria-checked')).toBe(false);
            expect(lockButton()?.querySelector('.ag-charts-icon-locked')).not.toBeNull();
            expect(lockButton()?.title).toBe('Unlock');
            expect(lockButton()?.getAttribute('aria-label')).toBe('Lock');
            expect(lockButton()?.querySelector('.ag-charts-toolbar__label')?.textContent).toBe('Lock');

            lockButton()!.click();
            await waitForChartStability(chart);

            expect(lockButton()?.hasAttribute('role')).toBe(false);
            expect(lockButton()?.hasAttribute('aria-checked')).toBe(false);
            expect(lockButton()?.querySelector('.ag-charts-icon-unlocked')).not.toBeNull();
            expect(lockButton()?.title).toBe('Lock');
            expect(lockButton()?.getAttribute('aria-label')).toBe('Lock');
            expect(lockButton()?.querySelector('.ag-charts-toolbar__label')?.textContent).toBe('Lock');
        });
    });

    describe('toolbar button names', () => {
        it('names the annotations toolbar buttons from their ariaLabel or tooltip', async () => {
            await prepareChart(undefined, {
                ...ANNOTATIONS_EXAMPLE_OPTIONS,
                annotations: {
                    enabled: true,
                    toolbar: {
                        buttons: [
                            { icon: 'delete', value: 'clear', ariaLabel: 'Remove everything' },
                            { icon: 'text-annotation', value: 'text-menu', tooltip: 'Add text' },
                        ],
                    },
                },
            });

            const names = Array.from(
                deproxy(chart).ctx.agDocument.body.querySelectorAll(
                    '.ag-charts-shared-toolbar .ag-charts-toolbar__button'
                ),
                (button) => button.getAttribute('aria-label')
            );
            expect(names).toEqual(expect.arrayContaining(['Remove everything', 'Add text']));
        });

        it('names the annotation options toolbar buttons from their ariaLabel or tooltip', async () => {
            await prepareChart(
                { annotations: [{ type: 'horizontal-line', value: 50 }] },
                {
                    ...ANNOTATIONS_EXAMPLE_OPTIONS,
                    annotations: {
                        ...ANNOTATIONS_EXAMPLE_OPTIONS.annotations,
                        optionsToolbar: {
                            buttons: [
                                { icon: 'delete', value: 'delete', ariaLabel: 'Remove annotation' },
                                { icon: 'settings', value: 'settings', tooltip: 'Edit annotation' },
                            ],
                        },
                    },
                }
            );

            const names = getAnnotationOptionsToolbarButtons(chart).map((button) => button.getAttribute('aria-label'));
            expect(names).toEqual(['Remove annotation', 'Edit annotation']);
        });
    });

    describe('settings dialog coordinates', () => {
        const getBandScale = () => {
            const { scale } = findAxis(chart, 'bottom');
            if (!BandScale.is(scale)) {
                throw new Error('Expected the x axis to have a band scale');
            }
            return scale;
        };

        // Selects the cross line at `at` on its axis, or through the centre of the band of `at`, and opens its settings.
        async function openCrossLineSettings(
            options: AgCartesianChartOptions,
            type: 'horizontal-line' | 'vertical-line',
            value: AgAnnotationValue,
            at: string | number | Date
        ) {
            await prepareChart({ annotations: [{ type, value }] }, options);
            const { x, y, width, height } = getSeriesRect(chart);
            const position = type === 'horizontal-line' ? 'left' : 'bottom';
            const along = getAxisCoordinate(chart, position, at) + (findAxis(chart, position).scale.bandwidth ?? 0) / 2;
            return openAnnotationSettings(
                chart,
                type === 'horizontal-line' ? { x: x + width / 2, y: y + along } : { x: x + along, y: y + height / 2 }
            );
        }
        const openVerticalLineCoordinates = (
            options: AgCartesianChartOptions,
            value: AgAnnotationValue,
            at: string | Date
        ) => openCrossLineSettings(options, 'vertical-line', value, at);

        describe('on a category axis', () => {
            const categoryOptions: AgCartesianChartOptions = {
                ...ANNOTATIONS_EXAMPLE_OPTIONS,
                data: [
                    { category: 'Q1', value: 50 },
                    { category: 'Q2', value: 70 },
                    { category: 'Q3', value: 60 },
                ],
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                axes: {
                    x: { type: 'category', position: 'bottom', paddingInner: 0.3 },
                    y: { type: 'number', position: 'left' },
                },
            };
            const openAtQ2 = () =>
                openVerticalLineCoordinates(categoryOptions, { value: 'Q2', groupPercentage: 0.5 }, 'Q2');

            it('places an offset of 50 at the midpoint between the band and the next, padding included', async () => {
                const body = await openAtQ2();

                await commitInput(body, 'Value: X offset %', '50');

                const [{ value }] = chart.getState().annotations as Array<{
                    value: { value: string; groupPercentage: number };
                }>;
                const scale = getBandScale();
                const centres = (category: string) => scale.convert(category) + scale.bandwidth / 2;
                expect(value.value).toBe('Q2');
                expect(scale.convert('Q2') + value.groupPercentage * scale.bandwidth).toBeCloseTo(
                    (centres('Q2') + centres('Q3')) / 2
                );
            });

            it('keeps the annotation where it is for a category the axis does not have, and moves it to one it does', async () => {
                const body = await openAtQ2();

                await commitInput(body, 'Value: X', 'Q9');
                expect(chart.getState().annotations).toMatchObject([{ value: { value: 'Q2' } }]);
                expect(body.querySelector<HTMLInputElement>('input[aria-label="Value: X"]')!.value).toBe('Q2');

                await commitInput(body, 'Value: X', 'Q3');
                expect(chart.getState().annotations).toMatchObject([{ value: { value: 'Q3' } }]);
            });
        });

        describe('on an ordinal time axis', () => {
            const bar = (day: number) => new Date(Date.UTC(2024, 0, day));
            const ordinalOptions: AgCartesianChartOptions = {
                ...ANNOTATIONS_EXAMPLE_OPTIONS,
                data: [
                    { date: bar(2), value: 50 },
                    { date: bar(3), value: 70 },
                    { date: bar(5), value: 60 },
                ],
                series: [{ type: 'bar', xKey: 'date', yKey: 'value' }],
                axes: {
                    x: { type: 'ordinal-time', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            it('snaps a date before the first bar or after the last onto that bar, which the axis can place', async () => {
                const body = await openVerticalLineCoordinates(
                    ordinalOptions,
                    { value: { __type: 'date', value: bar(3).toISOString() }, groupPercentage: 0.5 },
                    bar(3)
                );
                const typed = (date: Date) => {
                    const pad = (n: number) => String(n).padStart(2, '0');
                    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
                };
                const stateDate = () =>
                    (chart.getState().annotations as Array<{ value: { value: { value: string } } }>)[0].value.value
                        .value;

                await commitInput(body, 'Value: X', typed(bar(1)));
                expect(stateDate()).toBe(bar(2).toISOString());

                await commitInput(body, 'Value: X', typed(bar(9)));
                expect(stateDate()).toBe(bar(5).toISOString());
            });
        });

        // Selects the horizontal line through the middle of the series area, and opens its settings.
        async function openHorizontalLineSettings(annotations: AgAnnotation[]) {
            await prepareChart({ annotations });
            const { x, y, width, height } = getSeriesRect(chart);
            const at = { x: x + width / 2, y: y + height / 2 };
            return { at, body: await openAnnotationSettings(chart, at) };
        }

        describe('at the tick size of the axis', () => {
            const times = (start: number, step: number) => [0, 1, 2, 3].map((i) => new Date(start + i * step));
            const MINUTE = 60_000;
            const DAY = 24 * 60 * MINUTE;
            const QUARTER_HOURS = times(Date.UTC(2024, 0, 5, 9), 15 * MINUTE);
            // Midnight UTC, which is 01:00 in the time zone of the tests.
            const SUMMER_DAYS = times(Date.UTC(2024, 6, 2), DAY);
            const date = (value: Date) => ({ __type: 'date' as const, value: value.toISOString() });

            // `axis` is spread in, as `tickSize` is not one of the public axis options.
            const numberOptions = (values: number[], axis: object = {}): AgCartesianChartOptions => ({
                ...ANNOTATIONS_EXAMPLE_OPTIONS,
                data: values.map((value, index) => ({ x: index, y: value })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left', ...axis } },
            });
            const timeOptions = (
                values: Date[],
                axis: object,
                series: 'line' | 'bar' = 'line'
            ): AgCartesianChartOptions => ({
                ...ANNOTATIONS_EXAMPLE_OPTIONS,
                data: values.map((value, index) => ({ x: value, y: index + 1 })),
                series: [{ type: series, xKey: 'x', yKey: 'y' }],
                axes: { x: { position: 'bottom', ...axis }, y: { type: 'number', position: 'left' } },
            });
            const banded = (value: Date) => ({ value: date(value), groupPercentage: 0.5 });

            const THOUSANDTHS = [1, 1.001, 1.002, 1.004];
            const POWERS_OF_TEN = [0.01, 0.1, 1, 10, 100, 1000, 10000];
            const BETWEEN_QUARTER_HOURS = new Date(Date.UTC(2024, 0, 5, 9, 20, 30, 500));

            it.each<
                [
                    string,
                    AgCartesianChartOptions,
                    'horizontal-line' | 'vertical-line',
                    AgAnnotationValue,
                    number | Date,
                    string[],
                ]
            >([
                [
                    'a number at the step of the data',
                    numberOptions(THOUSANDTHS),
                    'horizontal-line',
                    1.0015432,
                    1.0015432,
                    ['number', '0.001', '1.002'],
                ],
                [
                    'a number at a `tickSize` ahead of the data',
                    numberOptions(THOUSANDTHS, { tickSize: 0.25 }),
                    'horizontal-line',
                    1.0015432,
                    1.0015432,
                    ['number', '0.25', '1.00'],
                ],
                [
                    'a number at the format of the crosshair label ahead of both, which hides a step of the `tickSize`',
                    numberOptions(THOUSANDTHS, { tickSize: 0.25, crosshair: { label: { format: '.1f' } } }),
                    'horizontal-line',
                    1.0015432,
                    1.0015432,
                    ['number', 'any', '1.0'],
                ],
                [
                    'a number at the format of the crosshair label, which leaves the step of the data unread',
                    numberOptions(THOUSANDTHS, { crosshair: { label: { format: '.3f' } } }),
                    'horizontal-line',
                    1.0015432,
                    1.0015432,
                    ['number', 'any', '1.002'],
                ],
                [
                    'a number on a log axis at the step of the data',
                    numberOptions(POWERS_OF_TEN, { type: 'log' }),
                    'horizontal-line',
                    12.3456,
                    12.3456,
                    ['number', '0.09', '12.35'],
                ],
                [
                    'a time to the minute for data a quarter of an hour apart',
                    timeOptions(QUARTER_HOURS, { type: 'time' }),
                    'vertical-line',
                    date(BETWEEN_QUARTER_HOURS),
                    BETWEEN_QUARTER_HOURS,
                    ['datetime-local', '60', '2024-01-05T09:20'],
                ],
                [
                    'a time as a date at a `tickSize` of a day',
                    timeOptions(QUARTER_HOURS, { type: 'time', tickSize: 'day' }),
                    'vertical-line',
                    date(BETWEEN_QUARTER_HOURS),
                    BETWEEN_QUARTER_HOURS,
                    ['date', '', '2024-01-05'],
                ],
                [
                    'a time as a date for daily data',
                    timeOptions(SUMMER_DAYS, { type: 'time' }),
                    'vertical-line',
                    date(SUMMER_DAYS[1]),
                    SUMMER_DAYS[1],
                    ['date', '', '2024-07-03'],
                ],
                [
                    'a time band as a date for bands of a day',
                    timeOptions(SUMMER_DAYS, { type: 'unit-time', unit: 'day' }, 'bar'),
                    'vertical-line',
                    banded(SUMMER_DAYS[1]),
                    SUMMER_DAYS[1],
                    ['date', '', '2024-07-03'],
                ],
                [
                    'an ordinal time as a date for daily bars',
                    timeOptions(SUMMER_DAYS, { type: 'ordinal-time' }, 'bar'),
                    'vertical-line',
                    banded(SUMMER_DAYS[1]),
                    SUMMER_DAYS[1],
                    ['date', '', '2024-07-03'],
                ],
            ])('shows %s', async (_name, options, type, value, at, expected) => {
                const body = await openCrossLineSettings(options, type, value, at);
                const label = type === 'horizontal-line' ? 'Value: Y' : 'Value: X';

                const input = body.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;

                expect([input.type, input.getAttribute('step') ?? '', input.value]).toEqual(expected);
            });

            it('changes the date of a time and keeps its time of day, and takes an unchanged date as no change', async () => {
                const body = await openCrossLineSettings(
                    timeOptions(SUMMER_DAYS, { type: 'time' }),
                    'vertical-line',
                    date(SUMMER_DAYS[1]),
                    SUMMER_DAYS[1]
                );

                await commitInput(body, 'Value: X', '2024-07-03');
                expect(chart.getState().annotations).toMatchObject([{ value: date(SUMMER_DAYS[1]) }]);

                await commitInput(body, 'Value: X', '2024-07-05');
                expect(chart.getState().annotations).toMatchObject([{ value: date(SUMMER_DAYS[3]) }]);
            });
        });

        it('edits the selected annotation and follows an undo', async () => {
            const { body } = await openHorizontalLineSettings([{ type: 'horizontal-line', value: 50 }]);

            const input = body.querySelector<HTMLInputElement>('input[aria-label="Value: Y"]')!;
            input.value = '60';
            input.dispatchEvent(new Event('change'));
            await waitForChartStability(chart);
            expect(chart.getState().annotations).toMatchObject([{ type: 'horizontal-line', value: 60 }]);

            await pressKey(chart, 'z', { ctrlKey: true });
            expect(chart.getState().annotations).toMatchObject([{ type: 'horizontal-line', value: 50 }]);
            expect(input.value).toBe('50');
        });

        it('stays open while its annotation is clicked or dragged, and closes on selecting another annotation', async () => {
            const { at, body } = await openHorizontalLineSettings([
                { type: 'horizontal-line', value: 50 },
                { type: 'horizontal-line', value: 10 },
            ]);
            const dialog = () => body.querySelector('.ag-charts-dialog');
            expect(dialog()).not.toBeNull();

            await clickAction(at.x, at.y)(chart);
            await waitForChartStability(chart);
            expect(dialog()).not.toBeNull();

            await dragAction(at, { x: at.x, y: at.y - 40 })(chart);
            await waitForChartStability(chart);
            expect(dialog()).not.toBeNull();
            const input = body.querySelector<HTMLInputElement>('input[aria-label="Value: Y"]')!;
            expect(Number(input.value)).toBeGreaterThan(50);

            const otherY = getSeriesRect(chart).y + findAxis(chart, 'left').scale.convert(10);
            await hoverAction(at.x, otherY)(chart);
            await clickAction(at.x, otherY)(chart);
            await waitForChartStability(chart);
            expect(dialog()).toBeNull();
        });
    });

    describe('settings dialog of text and arrow marker annotations', () => {
        const date = (value: string) => ({ __type: 'date' as const, value });

        const pointAt = (value: string, y: number) => {
            const rect = getSeriesRect(chart);
            return {
                x: rect.x + findAxis(chart, 'bottom').scale.convert(new Date(value)),
                y: rect.y + findAxis(chart, 'left').scale.convert(y),
            };
        };
        // A few pixels from the anchor, which every one of these annotations covers.
        const pointOn = (value: string, y: number) => {
            const point = pointAt(value, y);
            return { x: point.x + 5, y: point.y - 5 };
        };

        const tabNames = () =>
            Array.from(chartBody().querySelectorAll('.ag-charts-dialog__tab-button'), (button) => button.textContent);
        const activePanel = () => chartBody().querySelector<HTMLElement>('.ag-charts-dialog__tab-panel--active')!;
        const panelControls = (selector: string) => activePanel().querySelectorAll<HTMLElement>(selector);
        const openTab = (name: string) => {
            const tab = Array.from(chartBody().querySelectorAll<HTMLElement>('.ag-charts-dialog__tab-button')).find(
                (button) => button.textContent === name
            )!;
            return press(`#${tab.id}`);
        };
        async function typeText(value: string) {
            const textArea = activePanel().querySelector('textarea')!;
            textArea.value = value;
            textArea.dispatchEvent(new Event('input'));
            await waitForChartStability(chart);
        }
        async function pickFontSize(value: string) {
            const select = activePanel().querySelector<HTMLSelectElement>('select.ag-charts-dialog__select')!;
            select.value = value;
            select.dispatchEvent(new Event('change'));
            await waitForChartStability(chart);
        }
        async function pickDialogColor(index: number, color: string) {
            panelControls('.ag-charts-dialog__color-picker-button')[index].click();
            await waitForChartStability(chart);
            await pickColor(color);
            await pressKeyOn(PALETTE, 'Enter');
        }

        async function editTextTab(value: string) {
            await typeText(value);
            expect(panelControls('select.ag-charts-dialog__select')).toHaveLength(1);
            expect(panelControls('.ag-charts-dialog__color-picker-button')[0].getAttribute('aria-label')).toBe(
                'Text Color'
            );
            await pickFontSize('28');
            await pickDialogColor(0, GREEN);
        }
        async function editCoordinate(label: string, value: string) {
            await openTab('Coordinates');
            await commitInput(chartBody(), label, value);
        }

        // Each is edited on every tab it has, and sits apart from the others so that a click selects only it.
        const families: Array<{
            annotation: AgAnnotation;
            at: [string, number];
            tabs: string[];
            edit: () => Promise<void>;
            expected: object;
        }> = [
            {
                annotation: { type: 'text', text: 'Text', x: date('2024-02-01'), y: 85 },
                at: ['2024-02-01', 85],
                tabs: ['Text', 'Coordinates'],
                async edit() {
                    await editTextTab('Edited text');
                    await editCoordinate('Y', '70');
                },
                expected: { type: 'text', text: 'Edited text', fontSize: 28, color: GREEN, y: 70 },
            },
            {
                annotation: { type: 'comment', text: 'Comment', x: date('2024-04-15'), y: 85 },
                at: ['2024-04-15', 85],
                tabs: ['Text', 'Style', 'Coordinates'],
                async edit() {
                    await typeText('Edited comment');
                    await openTab('Style');
                    await pickDialogColor(0, GREEN);
                    await editCoordinate('Y', '70');
                },
                expected: { type: 'comment', text: 'Edited comment', fill: GREEN, y: 70 },
            },
            {
                annotation: { type: 'note', text: 'Note', x: date('2024-07-01'), y: 85 },
                at: ['2024-07-01', 85],
                tabs: ['Text', 'Style', 'Coordinates'],
                async edit() {
                    await editTextTab('Edited note');
                    await openTab('Style');
                    expect(panelControls('.ag-charts-dialog__color-picker-button')).toHaveLength(1);
                    await pickDialogColor(0, BLUE);
                    await editCoordinate('Y', '70');
                },
                expected: { type: 'note', text: 'Edited note', fontSize: 28, color: GREEN, fill: BLUE, y: 70 },
            },
            {
                annotation: {
                    type: 'callout',
                    text: 'Callout',
                    start: { x: date('2024-08-15'), y: 60 },
                    end: { x: date('2024-10-01'), y: 85 },
                },
                at: ['2024-10-01', 85],
                tabs: ['Text', 'Style', 'Coordinates'],
                async edit() {
                    await typeText('Edited callout');
                    await openTab('Style');
                    expect(
                        Array.from(panelControls('.ag-charts-dialog__color-picker-button'), (button) =>
                            button.getAttribute('aria-label')
                        )
                    ).toEqual(['Line Color', 'Fill Color']);
                    await pickDialogColor(0, GREEN);
                    await pickDialogColor(1, BLUE);
                    await editCoordinate('End: Y', '70');
                },
                expected: {
                    type: 'callout',
                    text: 'Edited callout',
                    stroke: GREEN,
                    fill: BLUE,
                    end: { y: 70 },
                },
            },
            ...(
                [
                    ['arrow-up', '2024-02-01'],
                    ['arrow-down', '2024-04-15'],
                ] as const
            ).map(([type, anchor]) => ({
                annotation: { type, x: date(anchor), y: 35 },
                at: [anchor, 35] as [string, number],
                tabs: ['Style', 'Coordinates'],
                async edit() {
                    await pickDialogColor(0, GREEN);
                    await editCoordinate('Y', '25');
                },
                expected: { type, fill: GREEN, y: 25 },
            })),
        ];

        it('opens from the options toolbar with the tabs of each annotation, and edits it from every tab', async () => {
            await prepareChart({ annotations: families.map(({ annotation }) => annotation) });

            for (const [index, { at, tabs, edit, expected }] of families.entries()) {
                const { type } = families[index].annotation;
                await clickAt(pointOn(...at));
                await press('button[title="Settings"]');

                expect(tabNames(), type).toEqual(tabs);
                await edit();
                expect(chart.getState().annotations?.[index], type).toMatchObject(expected);
                await press('.ag-charts-dialog__close-button');
            }

            await clickAt(pointAt('2024-12-01', 20));
            await compare();
        });

        it('leaves a double-click to edit the text in place, rather than open the dialog', async () => {
            await prepareChart({ annotations: [{ type: 'text', text: 'Text', x: date('2024-02-01'), y: 85 }] });
            const point = pointOn('2024-02-01', 85);
            await clickAt(point);

            await doubleClickAction(point.x, point.y, { precedingClicks: false })(chart);
            await waitForChartStability(chart);
            expect(chartBody().querySelector('.ag-charts-dialog')).toBeNull();

            await clickAt(pointAt('2024-12-01', 20));
            await hoverAction(point.x, point.y)(chart);
            await doubleClickAction(point.x, point.y)(chart);
            await waitForChartStability(chart);
            expect(chartBody().querySelector('.ag-charts-text-input__textarea')).not.toBeNull();
            expect(chartBody().querySelector('.ag-charts-dialog')).toBeNull();
        });

        it('saves the text being edited in place and opens the dialog from the options toolbar', async () => {
            // Every text type, as each shares the in-place editor but anchors differently.
            const edited = families.slice(0, 4);
            await prepareChart({ annotations: edited.map(({ annotation }) => annotation) });

            async function editInPlace(at: [string, number], value: string) {
                const point = pointOn(...at);
                await clickAt(point);
                await clickAt(point); // starts editing the text in place
                const textArea = chartBody().querySelector<HTMLElement>('.ag-charts-text-input__textarea')!;
                expect(textArea).not.toBeNull();
                textArea.innerText = value;
                textArea.dispatchEvent(new Event('input'));
                await waitForChartStability(chart);
            }

            for (const [index, { annotation, at, tabs }] of edited.entries()) {
                const { type } = annotation;
                await editInPlace(at, `Typed ${type}`);

                await press('button[title="Settings"]');

                expect(chartBody().querySelector('.ag-charts-text-input__textarea'), type).toBeNull();
                expect(tabNames(), type).toEqual(tabs);
                expect(activePanel().querySelector('textarea')!.value, type).toBe(`Typed ${type}`);
                expect(chart.getState().annotations?.[index], type).toMatchObject({ type, text: `Typed ${type}` });
                expect(
                    chartBody()
                        .querySelector('button[title="Settings"]')
                        ?.classList.contains('ag-charts-toolbar__button--active'),
                    type
                ).toBe(true);
                if (index < edited.length - 1) await press('.ag-charts-dialog__close-button');
            }
            await compare();

            // Emptied text deletes the annotation as leaving the editor would, so no dialog opens on whichever
            // annotation then takes its index, and nothing is left selected.
            await press('.ag-charts-dialog__close-button');
            await editInPlace(edited[0].at, '');
            await press('button[title="Settings"]');

            expect(chartBody().querySelector('.ag-charts-dialog')).toBeNull();
            expect(chartBody().querySelector('.ag-charts-text-input__textarea')).toBeNull();
            expect(chart.getState().annotations?.map((annotation) => annotation.type)).toEqual([
                'comment',
                'note',
                'callout',
            ]);
            await compare();
        });

        it('keeps cleared text as a draft while the dialog is open and deletes the annotation when it closes empty', async () => {
            const [text] = families;
            await prepareChart({ annotations: [text.annotation] });
            await clickAt(pointOn(...text.at));
            await press('button[title="Settings"]');

            await typeText('');
            expect(chart.getState().annotations).toHaveLength(1);
            await typeText('Replaced');
            expect(chart.getState().annotations).toMatchObject([{ type: 'text', text: 'Replaced' }]);

            await typeText('');
            await press('.ag-charts-dialog__close-button');
            expect(chart.getState().annotations ?? []).toHaveLength(0);
        });

        it('opens the text colour picker at the transparency of the annotation', async () => {
            const [text] = families;
            await prepareChart({
                annotations: [{ ...text.annotation, color: 'rgba(0, 170, 0, 0.4)' } as AgAnnotation],
            });
            await clickAt(pointOn(...text.at));
            await press('button[title="Settings"]');
            panelControls('.ag-charts-dialog__color-picker-button')[0].click();
            await waitForChartStability(chart);

            const alpha = chartBody().querySelector<HTMLInputElement>(
                '.ag-charts-color-picker input[aria-label="Transparency"]'
            );
            expect(alpha?.value).toBe('0.4');
        });

        it('opens from the focused Settings button, moves between the tabs with the arrow keys and returns focus on Escape', async () => {
            await prepareChart({ annotations: [families[1].annotation] });
            await clickAt(pointOn(...families[1].at));

            // jsdom does not turn Enter or Space into a click, so the focused button is clicked.
            const settings = chartBody().querySelector<HTMLElement>('button[title="Settings"]')!;
            settings.focus();
            await press('button[title="Settings"]');
            const [first, second] = Array.from(
                chartBody().querySelectorAll<HTMLElement>('.ag-charts-dialog__tab-button')
            );
            await vi.waitFor(() => expect(document.activeElement).toBe(first));

            first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
            expect(document.activeElement).toBe(second);
            second.click();
            expect(second.getAttribute('aria-selected')).toBe('true');

            second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            await waitForChartStability(chart);
            expect(chartBody().querySelector('.ag-charts-dialog')).toBeNull();
            expect(document.activeElement).toBe(settings);
        });
    });

    describe('colour picker and settings dialog apply and cancel', () => {
        const annotation = () => chart.getState().annotations?.[0] as Record<string, any>;
        const LINE = 'button[title="Line Color"]';

        const pressEnterOn = (selector: string) => pressKeyOn(selector, 'Enter');
        const pressEscape = () => pressKeyOn(PALETTE, 'Escape');
        const hasPicker = () => chartBody().querySelector('.ag-charts-color-picker') != null;
        const hasDialog = () => chartBody().querySelector('.ag-charts-dialog') != null;
        const isDisabled = (selector: string) =>
            chartBody().querySelector(selector)!.getAttribute('aria-disabled') === 'true';
        const changeStrokeWidth = async (value: string) => {
            const width = chartBody().querySelector<HTMLSelectElement>('select.ag-charts-dialog__select')!;
            width.value = value;
            width.dispatchEvent(new Event('change'));
            await waitForChartStability(chart);
        };
        const toolbarSwatch = () =>
            chartBody().querySelector<HTMLElement>('button[title="Line Color"]')!.style.getPropertyValue('--color');
        const dialogSwatches = () =>
            Array.from(chartBody().querySelectorAll<HTMLElement>('.ag-charts-dialog__color-picker-button')).map(
                (button) => button.style.getPropertyValue('--color')
            );

        async function select(
            annotations: NonNullable<AgCartesianChartOptions['initialState']>['annotations'],
            options = ACTION_BUTTONS_OPTIONS
        ) {
            await prepareChart({ annotations }, options);
            const { x, y, width, height } = getSeriesRect(chart);
            await hoverAction(x + width / 2, y + height / 2)(chart);
            await clickAction(x + width / 2, y + height / 2)(chart);
            await waitForChartStability(chart);
        }

        async function openLineSettings() {
            await select([{ type: 'horizontal-line', value: 50, stroke: '#ff0000', strokeWidth: 2 }]);
            await press('button[title="Settings"]');
        }

        it('applies and cancels from the options toolbar', async () => {
            await select([{ type: 'horizontal-line', value: 50, stroke: '#ff0000', strokeWidth: 4 }]);
            const swatchBefore = (await press(LINE), toolbarSwatch());

            // Apply has nothing to apply until the colour changes.
            expect(isDisabled(APPLY)).toBe(true);
            expect(isDisabled(CANCEL)).toBe(false);
            await pickColor('#00ff00');
            expect(isDisabled(APPLY)).toBe(false);

            // Cancel reverts the colour, closes only the picker and restores the toolbar swatch.
            expect(toolbarSwatch()).not.toBe(swatchBefore);
            await press(CANCEL);
            expect(hasPicker()).toBe(false);
            expect(toolbarSwatch()).toBe(swatchBefore);
            await compare();

            // Enter presses the focused Cancel button rather than applying the colour.
            await press(LINE);
            await pickColor('#00ff00');
            await pressEnterOn(CANCEL);
            expect(hasPicker()).toBe(false);
            expect(annotation().stroke).toBe('#ff0000');

            // Escape cancels.
            await press(LINE);
            await pickColor('#00ff00');
            await pressEscape();
            expect(hasPicker()).toBe(false);
            expect(annotation().stroke).toBe('#ff0000');
            expect(toolbarSwatch()).toBe(swatchBefore);

            // Enter applies.
            await press(LINE);
            await pickColor('#0000ff');
            await pressEnterOn(PALETTE);
            expect(hasPicker()).toBe(false);
            await compare();

            // Cancelling without a change leaves the earlier change alone.
            await press(LINE);
            await press(CANCEL);
            expect(annotation().stroke).toBe('#0000ff');

            // Picking a colour and then the original back leaves no trace, and does not undo the earlier change.
            await press(LINE);
            await pickColor('#00ff00');
            await pickColor('#0000ff');
            await press(CANCEL);
            expect(annotation().stroke).toBe('#0000ff');

            // Apply keeps the colour as a single undo step, and Enter presses the focused button.
            await press(LINE);
            await pickColor('#00ff00');
            await pressEnterOn(APPLY);
            expect(hasPicker()).toBe(false);
            await compare();

            const { historyManager } = deproxy(chart).ctx;
            historyManager.undo();
            await waitForChartStability(chart);
            await compare();

            // Cancelling does not touch the redo history.
            await press(LINE);
            await pickColor('#ff00ff');
            await press(CANCEL);
            expect(annotation().stroke).toBe('#0000ff');
            historyManager.redo();
            await waitForChartStability(chart);
            expect(annotation().stroke).toBe('#00ff00');
        });

        it('has no buttons without `showActionButtons`, and Enter and Escape still apply and cancel', async () => {
            await select(
                [{ type: 'horizontal-line', value: 50, stroke: '#ff0000', strokeWidth: 4 }],
                ANNOTATIONS_EXAMPLE_OPTIONS
            );

            await press(LINE);
            expect(hasPicker()).toBe(true);
            expect(chartBody().querySelector('.ag-charts-color-picker__actions')).toBeNull();

            await pickColor('#00ff00');
            await pressEscape();
            expect(hasPicker()).toBe(false);
            expect(annotation().stroke).toBe('#ff0000');

            await press(LINE);
            await pickColor('#00ff00');
            await pressEnterOn(PALETTE);
            expect(hasPicker()).toBe(false);
            expect(annotation().stroke).toBe('#00ff00');
            await compare();

            // The colour applies as it is picked, so closing the picker any other way keeps it.
            await press(LINE);
            await pickColor('#0000ff');
            await press(LINE);
            expect(hasPicker()).toBe(false);
            expect(annotation().stroke).toBe('#0000ff');

            // The settings dialog has no buttons either.
            await press('button[title="Settings"]');
            expect(hasDialog()).toBe(true);
            expect(chartBody().querySelector('.ag-charts-dialog__actions')).toBeNull();
        });

        it('applies and cancels the settings dialog as a whole', async () => {
            await select([{ type: 'horizontal-line', value: 50, stroke: '#ff0000', strokeWidth: 2 }]);
            const { historyManager } = deproxy(chart).ctx;
            const edit = async () => {
                await changeStrokeWidth('8');
                await press('.ag-charts-dialog__color-picker-button');
                await pickColor('#00ff00');
                await pressEnterOn(PALETTE);
            };
            const original = { stroke: '#ff0000', strokeWidth: 2 };

            // Apply has nothing to apply until something changes.
            await press('button[title="Settings"]');
            expect(isDisabled(DIALOG_APPLY)).toBe(true);
            expect(isDisabled(DIALOG_CANCEL)).toBe(false);
            await edit();
            expect(isDisabled(DIALOG_APPLY)).toBe(false);
            expect(annotation()).toMatchObject({ stroke: '#00ff00', strokeWidth: 8 });

            // Cancel discards every change made in the dialog, whatever closes it.
            await press(DIALOG_CANCEL);
            expect(hasDialog()).toBe(false);
            expect(annotation()).toMatchObject(original);
            await compare();

            await press('button[title="Settings"]');
            await edit();
            await pressKeyOn('select.ag-charts-dialog__select', 'Escape');
            expect(hasDialog()).toBe(false);
            expect(annotation()).toMatchObject(original);

            await press('button[title="Settings"]');
            await edit();
            await press('.ag-charts-dialog__close-button');
            expect(annotation()).toMatchObject(original);

            // Apply keeps them as a single undo step.
            await press('button[title="Settings"]');
            await edit();
            await press(DIALOG_APPLY);
            expect(hasDialog()).toBe(false);
            expect(annotation()).toMatchObject({ stroke: '#00ff00', strokeWidth: 8 });
            await compare();

            historyManager.undo();
            await waitForChartStability(chart);
            expect(annotation()).toMatchObject(original);
            historyManager.redo();
            await waitForChartStability(chart);
            expect(annotation()).toMatchObject({ stroke: '#00ff00', strokeWidth: 8 });

            // Enter is left to a button or select, and to a colour picker, which closes only itself.
            await press('button[title="Settings"]');
            await changeStrokeWidth('4');
            await pressEnterOn('select.ag-charts-dialog__select');
            expect(hasDialog()).toBe(true);
            await pressEnterOn('.ag-charts-dialog__color-picker-button');
            expect(hasDialog()).toBe(true);
            await press('.ag-charts-dialog__color-picker-button');
            await pressEscape();
            expect(hasDialog()).toBe(true);
            expect(hasPicker()).toBe(false);
            await press(DIALOG_APPLY);
            expect(annotation().strokeWidth).toBe(4);
        });

        it('applies Enter with nothing changed without a history record, keeping the redo history', async () => {
            await select([{ type: 'horizontal-line', value: 50, stroke: '#ff0000', strokeWidth: 2 }]);
            const { historyManager } = deproxy(chart).ctx;

            // Something to redo.
            await press('button[title="Settings"]');
            await changeStrokeWidth('8');
            await press(DIALOG_APPLY);
            historyManager.undo();
            await waitForChartStability(chart);
            expect(annotation().strokeWidth).toBe(2);

            await press('button[title="Settings"]');
            await pressEnterOn('.ag-charts-dialog__tab-list');
            expect(hasDialog()).toBe(false);

            historyManager.redo();
            await waitForChartStability(chart);
            expect(annotation().strokeWidth).toBe(8);
        });

        it('applies the dialog before an action of its own, so the action is recorded rather than lost', async () => {
            await openLineSettings();
            await changeStrokeWidth('8');

            // The delete is recorded, not lost to the dialog closing.
            await pressKey(chart, 'Delete');
            expect(hasDialog()).toBe(false);
            expect(chart.getState().annotations).toEqual([]);

            // The delete and the dialog's changes are separate undo steps.
            await pressKey(chart, 'z', { ctrlKey: true });
            expect(annotation()).toMatchObject({ strokeWidth: 8 });
            await pressKey(chart, 'z', { ctrlKey: true });
            expect(annotation()).toMatchObject({ strokeWidth: 2 });
        });

        it('applies the dialog before an undo, which then undoes only the dialog changes', async () => {
            await openLineSettings();
            await changeStrokeWidth('8');

            await pressKey(chart, 'z', { ctrlKey: true });
            expect(hasDialog()).toBe(false);
            expect(annotation()).toMatchObject({ strokeWidth: 2 });

            await pressKey(chart, 'y', { ctrlKey: true });
            expect(annotation()).toMatchObject({ strokeWidth: 8 });
        });

        it.each([
            ['Cancel', DIALOG_CANCEL, 50],
            ['Apply', DIALOG_APPLY, 'moved'],
        ] as const)(
            'treats moving the annotation with the dialog open as one of its changes: %s',
            async (_name, button, expected) => {
                await openLineSettings();
                expect(isDisabled(DIALOG_APPLY)).toBe(true);

                await pressKey(chart, 'ArrowUp');
                const moved = annotation().value;
                expect(moved).not.toBe(50);
                expect(isDisabled(DIALOG_APPLY)).toBe(false);

                await press(button);
                expect(hasDialog()).toBe(false);
                expect(annotation().value).toBe(expected === 'moved' ? moved : expected);
            }
        );

        it('keeps a colour picked in the dialog when the picker is clicked away from', async () => {
            await openLineSettings();
            await press('.ag-charts-dialog__color-picker-button');
            await pickColor('#00ff00');

            // A press elsewhere in the dialog closes the picker; the colour stays picked, to be applied or cancelled.
            chartBody()
                .querySelector('.ag-charts-dialog__tab-list')!
                .dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            await waitForChartStability(chart);
            expect(hasPicker()).toBe(false);
            expect(hasDialog()).toBe(true);
            expect(annotation().stroke).toBe('#00ff00');
            expect(isDisabled(DIALOG_APPLY)).toBe(false);

            await press(DIALOG_CANCEL);
            expect(annotation().stroke).toBe('#ff0000');
        });

        it('cancels a colour that was unset when the picker opened, keeping the dialog changes', async () => {
            await select([
                {
                    type: 'fibonacci-retracement',
                    start: { x: { __type: 'date', value: '2024-03-01' }, y: 45 },
                    end: { x: { __type: 'date', value: '2024-09-01' }, y: 65 },
                },
            ]);
            await press('button[title="Settings"]');
            await changeStrokeWidth('8');

            await press('.ag-charts-dialog__color-picker-button');
            const settled = annotation().stroke;
            await pickColor('#00ff00');
            await press(CANCEL);

            expect(hasDialog()).toBe(true);
            expect(annotation().strokeWidth).toBe(8);
            expect(annotation().stroke).toBe(settled);
        });

        describe('clearing the text of a text annotation in the dialog', () => {
            const texts = () => (chart.getState().annotations ?? []).map((a) => (a as { text?: string }).text);

            async function clearTextThenPress(button: string) {
                await prepareChart(
                    {
                        annotations: [
                            { type: 'text', text: 'Hello', x: { __type: 'date', value: '2024-02-01' }, y: 85 },
                        ],
                    },
                    ACTION_BUTTONS_OPTIONS
                );
                const rect = getSeriesRect(chart);
                const x = rect.x + findAxis(chart, 'bottom').scale.convert(new Date('2024-02-01')) + 5;
                const y = rect.y + findAxis(chart, 'left').scale.convert(85) - 5;
                await hoverAction(x, y)(chart);
                await clickAction(x, y)(chart);
                await waitForChartStability(chart);
                await press('button[title="Settings"]');

                const area = chartBody().querySelector<HTMLTextAreaElement>('.ag-charts-dialog textarea')!;
                area.value = '';
                area.dispatchEvent(new Event('input'));
                await waitForChartStability(chart);
                await press(button);
                expect(hasDialog()).toBe(false);
            }

            it('deletes it on Apply as part of the dialog record, in one undo step', async () => {
                await clearTextThenPress(DIALOG_APPLY);
                expect(texts()).toEqual([]);

                const { historyManager } = deproxy(chart).ctx;
                historyManager.undo();
                await waitForChartStability(chart);
                expect(texts()).toEqual(['Hello']);

                historyManager.redo();
                await waitForChartStability(chart);
                expect(texts()).toEqual([]);
            });

            it('keeps it on Cancel', async () => {
                await clearTextThenPress(DIALOG_CANCEL);
                expect(texts()).toEqual(['Hello']);
            });
        });

        describe('aria-expanded of the options toolbar', () => {
            const expanded = (title: string) =>
                chartBody().querySelector<HTMLElement>(`button[title="${title}"]`)!.getAttribute('aria-expanded');
            const closers: Array<[string, () => Promise<void>]> = [
                ['Escape', () => pressEscape()],
                ['cancel', () => press(CANCEL)],
                ['apply', () => press(APPLY)],
                ['pressing the button again', () => press(LINE)],
            ];

            it.each(closers)(
                'is true while the colour picker is open and false after %s closes it',
                async (_, close) => {
                    await select([{ type: 'horizontal-line', value: 50, stroke: RED, strokeWidth: 4 }]);
                    expect(expanded('Line Color')).toBe('false');

                    await press(LINE);
                    expect(hasPicker()).toBe(true);
                    expect(expanded('Line Color')).toBe('true');

                    await pickColor(GREEN);
                    expect(expanded('Line Color')).toBe('true');

                    await close();
                    expect(hasPicker()).toBe(false);
                    expect(expanded('Line Color')).toBe('false');
                }
            );

            it('is false after the annotation is deselected with the picker open', async () => {
                await select([{ type: 'horizontal-line', value: 50, stroke: RED, strokeWidth: 4 }]);
                await press(LINE);
                const lineButton = chartBody().querySelector<HTMLElement>(LINE)!;
                expect(lineButton.getAttribute('aria-expanded')).toBe('true');

                const { x, y } = getSeriesRect(chart);
                await clickAt({ x: x + 5, y: y + 5 });
                expect(hasPicker()).toBe(false);
                expect(lineButton.getAttribute('aria-expanded')).toBe('false');
            });

            it.each([
                ['the toolbar button', async () => press('button[title="Settings"]')],
                [
                    'a double-click on the annotation',
                    async () => {
                        const { x, y, width, height } = getSeriesRect(chart);
                        await hoverAction(x + width / 2, y + height / 2)(chart);
                        await doubleClickAction(x + width / 2, y + height / 2)(chart);
                        await waitForChartStability(chart);
                    },
                ],
            ])(
                'is true on Settings while the dialog opened by %s is open and false after it closes',
                async (_, open) => {
                    await select([{ type: 'horizontal-line', value: 50, stroke: RED, strokeWidth: 4 }]);
                    expect(expanded('Settings')).toBe('false');

                    await open();
                    expect(chartBody().querySelector('.ag-charts-dialog')).not.toBeNull();
                    expect(expanded('Settings')).toBe('true');

                    await press('.ag-charts-dialog__close-button');
                    expect(chartBody().querySelector('.ag-charts-dialog')).toBeNull();
                    expect(expanded('Settings')).toBe('false');
                }
            );
        });

        // With the buttons the dialog holds its history back, so a cancel restores the colour itself; without them it
        // reverts through the history.
        const DIALOG_COLOUR_CASES = [
            ['', ACTION_BUTTONS_OPTIONS, () => press(CANCEL)],
            [' without the buttons', ANNOTATIONS_EXAMPLE_OPTIONS, () => pressEscape()],
        ] as const;

        it.each(DIALOG_COLOUR_CASES)(
            'cancels a colour from the settings dialog without undoing earlier dialog edits%s',
            async (_name, options, cancel) => {
                await select([{ type: 'horizontal-line', value: 50, stroke: '#ff0000', strokeWidth: 2 }], options);
                await press('button[title="Settings"]');

                await changeStrokeWidth('8');

                const swatchesBefore = dialogSwatches();
                await press('.ag-charts-dialog__color-picker-button');
                await pickColor('#00ff00');
                expect(dialogSwatches()).not.toEqual(swatchesBefore);
                await cancel();

                expect(dialogSwatches()).toEqual(swatchesBefore);
                expect(chartBody().querySelector('.ag-charts-dialog')).not.toBeNull();
                await compare();
            }
        );

        it.each(DIALOG_COLOUR_CASES)(
            'cancels the line, fill and text colours of a channel from the settings dialog%s',
            async (_name, options, cancel) => {
                await select(
                    [
                        {
                            type: 'parallel-channel',
                            start: { x: { __type: 'date', value: '2024-05-01' }, y: 40 },
                            end: { x: { __type: 'date', value: '2024-08-30' }, y: 60 },
                            height: 20,
                            stroke: '#ff0000',
                            background: { fill: '#ff0000', fillOpacity: 0.5 },
                            text: { label: 'Text', color: '#ff0000', position: 'top', alignment: 'center' },
                        },
                    ],
                    options
                );
                await press('button[title="Settings"]');
                const swatchesBefore = dialogSwatches();

                // The line and fill pickers share the Channel tab; the text picker is on the Text tab.
                const tabs = Array.from(chartBody().querySelectorAll<HTMLElement>('.ag-charts-dialog__tab-button'));
                for (const [index, tab] of [
                    [0, 'Channel'],
                    [1, 'Channel'],
                    [2, 'Text'],
                ] as const) {
                    tabs.find((button) => button.textContent === tab)!.click();
                    await waitForChartStability(chart);
                    Array.from(chartBody().querySelectorAll<HTMLElement>('.ag-charts-dialog__color-picker-button'))[
                        index
                    ].click();
                    await waitForChartStability(chart);
                    await pickColor('#00ff00');
                    await cancel();
                }

                expect(dialogSwatches()).toEqual(swatchesBefore);
                await compare();
            }
        );
    });

    describe('selected annotation axes', () => {
        // Both axes span 100 units (the x axis, 100 days from 2024-01-01), so a datum offset is also the fraction of the
        // way along its axis.
        const day = (offset: number) => ({
            __type: 'date' as const,
            value: new Date(Date.UTC(2024, 0, 1 + offset)).toISOString().slice(0, 10),
        });

        const withAxes = (
            xPosition: 'top' | 'bottom' = 'bottom',
            yPosition: 'left' | 'right' = 'left',
            annotations: AgAnnotationsOptions = {}
        ) =>
            ({
                ...ANNOTATIONS_EXAMPLE_OPTIONS,
                annotations: { ...ANNOTATIONS_EXAMPLE_OPTIONS.annotations, ...annotations },
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

        const [START, END] = [
            { x: day(20), y: 25 },
            { x: day(80), y: 75 },
        ];
        const [CHANNEL_START, CHANNEL_END] = [
            { x: day(20), y: 30 },
            { x: day(80), y: 60 },
        ];
        const LINE: AgAnnotation = { type: 'line', start: START, end: END };
        const PARALLEL_CHANNEL: AgAnnotation = {
            type: 'parallel-channel',
            start: CHANNEL_START,
            end: CHANNEL_END,
            height: 20,
        };
        // A point on each annotation's body to click it by.
        const LINE_BODY = { x: 50, y: 50 };
        const CHANNEL_BODY = { x: 50, y: 45 };
        // Away from every annotation above, so that clicking it deselects.
        const EMPTY = { x: 10, y: 95 };

        // A cross-line label that the selection's own label overlaps, and a shading that reaches under both.
        it('draws the shading beneath a cross-line axis label and the selection labels above it', async () => {
            await prepareChart(
                {
                    annotations: [{ type: 'horizontal-line', value: 73, axisLabel: { fill: '#ff0000' } }, LINE],
                },
                withAxes('bottom', 'left', {
                    xAxis: { axisShading: { fillOpacity: 0.5 } },
                    yAxis: { axisShading: { fillOpacity: 0.5 } },
                })
            );

            await clickDatum(LINE_BODY.x, LINE_BODY.y);

            await compare();
        });

        // The labels and shading keep their own colours whatever the annotation's, so that they stay legible.
        // Each case is snapshotted, as one annotation is selected at a time.
        const selectedCases: Array<{ name: string; annotation: AgAnnotation; body: { x: number; y: number } }> = [
            {
                name: 'a line with a white stroke',
                annotation: { ...LINE, stroke: '#ffffff' },
                body: LINE_BODY,
            },
            {
                name: 'a parallel channel with its own stroke and background',
                // Its four corners are labelled, not the middle handles that only move an edge.
                annotation: { ...PARALLEL_CHANNEL, stroke: RED, background: { fill: BLUE, fillOpacity: 0.3 } },
                body: CHANNEL_BODY,
            },
            {
                name: 'a disjoint channel with the default colours',
                // All four handles are labelled, including the univariant one at the end of the bottom line.
                annotation: {
                    type: 'disjoint-channel',
                    start: CHANNEL_START,
                    end: CHANNEL_END,
                    startHeight: 10,
                    endHeight: 20,
                },
                body: CHANNEL_BODY,
            },
            {
                name: 'a Fibonacci retracement with its own range stroke',
                annotation: { type: 'fibonacci-retracement', start: START, end: END, rangeStroke: GREEN },
                // On the 0.5 level, which is drawn between the two x positions.
                body: LINE_BODY,
            },
            {
                name: 'a price range with the default colours',
                annotation: { type: 'price-range', start: START, end: END },
                body: LINE_BODY,
            },
            {
                name: 'a quick range with its own up styles',
                annotation: {
                    type: 'quick-date-price-range',
                    start: START,
                    end: END,
                    up: { stroke: RED, fill: GREEN, fillOpacity: 0.4 },
                    down: { stroke: BLUE, fill: BLUE, fillOpacity: 0.1 },
                },
                body: LINE_BODY,
            },
        ];

        it.each(selectedCases)('shows axis labels and shading on both axes for $name', async ({ annotation, body }) => {
            await prepareChart({ annotations: [annotation] }, withAxes());
            expect(visibleAxisLabels()).toHaveLength(0);

            await clickDatum(body.x, body.y);

            expect(visibleAxisLabels().length).toBeGreaterThan(0);
            await compare();
        });

        // The options of an axis override the labels set for both, and the fills are the options' own.
        it('takes the fills of the axis labels and shading from the annotations options, by axis', async () => {
            await prepareChart(
                { annotations: [LINE] },
                withAxes('bottom', 'left', {
                    axisLabel: { fill: GREEN, color: 'black' },
                    xAxis: { axisLabel: { fill: RED }, axisShading: { fill: BLUE, fillOpacity: 0.5 } },
                    yAxis: { axisShading: { fill: RED, fillOpacity: 0.5 } },
                })
            );

            await clickDatum(LINE_BODY.x, LINE_BODY.y);

            await compare();
        });

        // Whether the labels and shading show depends on `visible`, which each axis can set for itself.
        it('shows the axis labels and shading as `visible` sets, whether or not the annotation is selected', async () => {
            const cases: Array<{ annotations: AgAnnotationsOptions; select: boolean }> = [
                // Unselected labels on the y axis only, and no shading.
                {
                    annotations: {
                        axisLabel: { visible: 'always' },
                        xAxis: { axisLabel: { visible: 'never' }, axisShading: { visible: 'never' } },
                        yAxis: { axisShading: { visible: 'never' } },
                    },
                    select: false,
                },
                // Unselected shading with no labels.
                {
                    annotations: {
                        axisLabel: { visible: 'never' },
                        xAxis: { axisShading: { visible: 'always' } },
                        yAxis: { axisShading: { visible: 'always' } },
                    },
                    select: false,
                },
                // Nothing, though the annotation is selected.
                {
                    annotations: {
                        axisLabel: { visible: 'never' },
                        xAxis: { axisShading: { visible: 'never' } },
                        yAxis: { axisShading: { visible: 'never' } },
                    },
                    select: true,
                },
            ];

            await prepareChart({ annotations: [LINE] }, withAxes('bottom', 'left', cases[0].annotations));
            await compare();

            // The mock canvas is bound to the first chart, so the others are updates of it.
            for (const { annotations, select } of cases.slice(1)) {
                await chart.update(
                    prepareEnterpriseTestOptions({
                        ...withAxes('bottom', 'left', annotations),
                        initialState: undefined,
                    }) as never
                );
                if (select) await clickDatum(LINE_BODY.x, LINE_BODY.y);
                await waitForChartStability(chart);
                await compare();
            }
        });

        // A single point has one label per axis and nothing to shade between. The callout's is at its pointer's tip.
        it('shows one axis label per axis and no shading for annotations of a single point', async () => {
            const point = (x: number, y: number) => ({ x: day(x), y });
            const annotations = [
                { type: 'text', text: 'Text', ...point(10, 15) },
                { type: 'comment', text: 'Comment', ...point(25, 30) },
                { type: 'note', text: 'Note', ...point(40, 45) },
                { type: 'callout', text: 'Callout', start: point(55, 60), end: point(70, 90) },
                { type: 'arrow-up', ...point(80, 75) },
                { type: 'arrow-down', ...point(95, 20) },
            ] as AgAnnotation[];
            await prepareChart({ annotations }, withAxes('bottom', 'left', { axisLabel: { visible: 'always' } }));

            // The y axis's labels are numbers and the x axis's are dates.
            const yTexts = visibleAxisLabels()
                .map((group) => String([...(group as Group).children()].find((child) => child instanceof Text)?.text))
                .filter((text) => /^\d+$/.test(text));
            expect(visibleAxisLabels()).toHaveLength(12);
            expect([...yTexts].sort((a, b) => Number(a) - Number(b))).toEqual(['15', '20', '30', '45', '60', '75']);

            await compare();
        });

        it('draws one label and no shading along an axis where the handles share a position', async () => {
            // The two ends are well under a pixel apart along x, so they collapse to one position there.
            const line = { type: 'line', start: { x: day(50), y: 25 }, end: { x: day(50.01), y: 75 } } as AgAnnotation;
            await prepareChart({ annotations: [line] }, withAxes());

            await clickDatum(50, 50);

            await compare();
        });

        it('removes the axis labels and shading when a toolbar menu is opened over the selected annotation', async () => {
            // Opening a menu resets the annotation state, which deselects without naming the previous annotation.
            const options = { ...withAxes(), annotations: { enabled: true, toolbar: { enabled: true } } };
            await prepareChart({ annotations: [LINE] }, options);
            await clickDatum(LINE_BODY.x, LINE_BODY.y);
            expect(visibleAxisLabels()).toHaveLength(4);

            const trendLines = document.querySelector<HTMLElement>(
                '.ag-charts-shared-toolbar .ag-charts-toolbar__button[title="Trend Lines"]'
            );
            trendLines?.click();
            await waitForChartStability(chart);

            expect(visibleAxisLabels()).toHaveLength(0);
        });

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

            await compare();
        });

        it('keeps the single axis label of a selected horizontal line and adds no shading', async () => {
            await prepareChart({ annotations: [{ type: 'horizontal-line', value: 60 }] }, withAxes());

            await clickDatum(50, 60);

            await compare();
        });

        it('places the labels and shading beside a top x axis and a right y axis', async () => {
            await prepareChart({ annotations: [LINE] }, withAxes('top', 'right'));

            await clickDatum(LINE_BODY.x, LINE_BODY.y);

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

            await chart.update(prepareEnterpriseTestOptions({ ...withYAxis('log'), initialState: undefined }) as never);
            await waitForChartStability(chart);

            // Nodes left on a detached axis layer are not part of the chart, so they are not drawn.
            await compare();
        });

        // Where an axis is not linear and continuous, the value of a position is read differently.
        it.each<{
            name: string;
            options: AgCartesianChartOptions;
            annotation: AgAnnotation;
            click: number[];
        }>([
            {
                name: 'a log y axis',
                options: withYAxis('log'),
                annotation: { type: 'line', start: { x: day(20), y: 10 }, end: { x: day(80), y: 100 } },
                // A third and two thirds of the way up the log axis, so the middle of the line is in the middle.
                click: [50, 50],
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
            },
        ])('labels a selected line with the values of $name', async ({ options, annotation, click }) => {
            await prepareChart({ annotations: [annotation] }, options);

            await clickDatum(click[0], click[1]);

            await compare();
        });

        it('labels only the points inside the axes but shades up to the edge of the series area', async () => {
            // The end is past both the right and the top of the chart.
            await prepareChart(
                { annotations: [{ type: 'line', start: START, end: { x: day(120), y: 150 } }] },
                withAxes()
            );

            await clickDatum(50, 62.5);

            await compare();
        });

        it('labels the points inside a zoomed chart and shades across the rest', async () => {
            // Both ends of the line are outside the zoomed range of the x axis, the y axis is not zoomed.
            await prepareChart(
                { annotations: [LINE], zoom: { ratioX: { start: 0.25, end: 0.75 } } },
                { ...withAxes(), zoom: { enabled: true } }
            );

            await clickDatum(50, 50);

            await compare();
        });

        // The depth is that of the axis's ticks and tick labels, or of the axis labels if they are deeper, and it only
        // grows while the annotation is selected. Following the labels as drawn made it flicker as a handle was dragged.
        it('shades the axes to a depth that covers the axis labels, and does not shrink as a handle is dragged', async () => {
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

            const shading = () =>
                findSceneNodes(
                    chart,
                    (node) => node.name === 'AnnotationSelectionAxisShading' && node.visible
                ) as any[];
            // The y axis's shading is the narrower of the two.
            const yDepth = () => Math.min(...shading().map((node) => node.width));
            const rects = () =>
                visibleAxisLabels().map(
                    (group) => [...(group as Group).children()].find((c) => c instanceof Rect) as any
                );

            await clickDatum(LINE_BODY.x, LINE_BODY.y);
            expect(shading()).toHaveLength(2);
            await compare();

            // Dragging the end handle from 75 labels it with values of many digits, such as 43.2171.
            const { x: left, y: top, width, height } = getSeriesRect(chart);
            const end = { x: left + width * 0.8, y: top + height * 0.25 };
            await mouseDownAction(end.x, end.y)(chart);
            const depths = [yDepth()];
            for (const dy of [7, 33, 61, 12, 90]) {
                await hoverAction(end.x, end.y + dy)(chart);
                await waitForChartStability(chart);
                depths.push(yDepth());

                // The labels of the y axis lie left of the series area, and fit within its shading.
                for (const rect of rects().filter((r) => r.x + r.width / 2 < left)) {
                    expect(rect.x).toBeGreaterThanOrEqual(Math.min(...shading().map((node) => node.x)) - 0.5);
                }
            }
            await mouseUpAction(end.x, end.y + 90)(chart);

            expect(depths.every((depth, i) => i === 0 || depth >= depths[i - 1])).toBe(true);
            expect(depths.at(-1)).toBeGreaterThan(depths[0]);
            await compare();
        });

        it('writes the state of a selected annotation back so that it restores unchanged', async () => {
            await prepareChart({ annotations: [LINE] }, withAxes());
            const saved = chart.getState().annotations;

            chart.destroy();
            await prepareChart({ annotations: saved }, withAxes());

            expect(chart.getState().annotations).toEqual(saved);
        });
    });

    describe('annotations event source', () => {
        const sources = (listener: ReturnType<typeof vi.fn>) =>
            listener.mock.calls.map(([event]) => (event as AgAnnotationsEvent).source);

        async function prepareChartWithListener() {
            const listener = vi.fn();
            await prepareChart(
                { annotations: [{ type: 'horizontal-line', value: 50 }] },
                {
                    ...ANNOTATIONS_EXAMPLE_OPTIONS,
                    listeners: { annotations: listener },
                }
            );
            return listener;
        }

        async function selectAnnotation() {
            const { x, y, width, height } = getSeriesRect(chart);
            await hoverAction(x + width / 2, y + height / 2)(chart);
            await clickAction(x + width / 2, y + height / 2)(chart);
            await waitForChartStability(chart);
        }

        async function editSelectedValue(value: string) {
            await selectAnnotation();

            const { body } = deproxy(chart).ctx.agDocument;
            body.querySelector<HTMLElement>('button[title="Settings"]')!.click();
            await waitForChartStability(chart);

            const input = body.querySelector<HTMLInputElement>('input[aria-label="Value: Y"]')!;
            input.value = value;
            input.dispatchEvent(new Event('change'));
            await waitForChartStability(chart);
        }

        it('reports the initial state as an api-call', async () => {
            const listener = await prepareChartWithListener();
            expect(sources(listener)).toEqual(['api-call']);
        });

        it('reports a direct edit as a user-interaction', async () => {
            const listener = await prepareChartWithListener();
            listener.mockClear();

            await editSelectedValue('60');

            expect(sources(listener)).toEqual(['user-interaction']);
        });

        it('reports a delete as a user-interaction', async () => {
            const listener = await prepareChartWithListener();
            await selectAnnotation();
            listener.mockClear();

            await pressKey(chart, 'Delete');

            expect(chart.getState().annotations).toEqual([]);
            expect(sources(listener)).toEqual(['user-interaction']);
        });

        const undo = () => pressKey(chart, 'z', { ctrlKey: true });

        it('reports an undo as a user-interaction', async () => {
            const listener = await prepareChartWithListener();
            await editSelectedValue('60');
            listener.mockClear();

            await undo();

            expect(sources(listener)).toEqual(['user-interaction']);
        });

        it('reports a redo as a user-interaction', async () => {
            const listener = await prepareChartWithListener();
            await editSelectedValue('60');
            await undo();
            listener.mockClear();

            await pressKey(chart, 'z', { ctrlKey: true, shiftKey: true });

            expect(sources(listener)).toEqual(['user-interaction']);
        });

        it('reports setState as an api-call', async () => {
            const listener = await prepareChartWithListener();
            listener.mockClear();

            await chart.setState({ ...chart.getState(), annotations: [{ type: 'horizontal-line', value: 70 }] });
            await waitForChartStability(chart);

            expect(sources(listener)).toEqual(['api-call']);
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

    describe('setState while an annotation is selected', () => {
        // The target state differs from the chart's current zoom (full range) and annotation (value 50).
        const restoredZoom = { ratioX: { start: 0.25, end: 0.75 } };
        const restoredAnnotations: AgAnnotation[] = [{ type: 'horizontal-line', value: 30 }];

        const textAnnotation: AgAnnotation = {
            type: 'text',
            text: 'Hello',
            x: { __type: 'date', value: '2024-07-01' },
            y: 75,
        };

        const at = (fractionX: number, fractionY: number) => {
            const { x, y, width, height } = getSeriesRect(chart);
            return { x: x + width * fractionX, y: y + height * fractionY };
        };
        const centre = () => at(0.5, 0.5);
        const body = () => deproxy(chart).ctx.agDocument.body;

        async function prepareZoomableChart(annotations: AgAnnotation[] = [{ type: 'horizontal-line', value: 50 }]) {
            await prepareChart(
                { annotations },
                {
                    ...ANNOTATIONS_EXAMPLE_OPTIONS,
                    annotations: { ...ANNOTATIONS_EXAMPLE_OPTIONS.annotations, toolbar: { enabled: true } },
                    zoom: { enabled: true },
                }
            );
        }

        async function selectAtCentre() {
            await clickAt(centre());
            // Guard: the click really selected the annotation, which shows its options toolbar.
            expect(body().querySelector('button[title="Settings"]')).not.toBeNull();
        }

        async function setRestoredState() {
            await chart.setState({ ...chart.getState(), zoom: restoredZoom, annotations: restoredAnnotations });
            await waitForChartStability(chart);
            return chart.getState();
        }

        function expectRestored({ zoom, annotations }: ReturnType<AgChartInstance['getState']>) {
            expect(zoom?.ratioX?.start).toBeCloseTo(restoredZoom.ratioX.start);
            expect(zoom?.ratioX?.end).toBeCloseTo(restoredZoom.ratioX.end);
            expect(annotations).toMatchObject(restoredAnnotations);
        }

        // The state just before is the reference: editing can itself change the annotation, e.g. dragging a line.
        async function expectIgnored() {
            const before = chart.getState();
            const after = await setRestoredState();
            expect(after.annotations).toEqual(before.annotations);
            expect(after.zoom).toEqual(before.zoom);
        }

        describe('is applied when the annotation is only selected, not being edited', () => {
            it.each([
                ['selected', true],
                ['not selected', false],
            ])('restores the zoom and annotations when the annotation is %s', async (_name, select) => {
                await prepareZoomableChart();
                if (select) await selectAtCentre();

                expectRestored(await setRestoredState());
            });

            it('restores them after clicking the selected annotation again without dragging', async () => {
                await prepareZoomableChart();
                await selectAtCentre();
                await clickAt(centre());

                expectRestored(await setRestoredState());
            });
        });

        describe('updates the selection to match the restored annotation', () => {
            async function restoreWhileSelected(annotation: AgAnnotation) {
                await prepareZoomableChart();
                await selectAtCentre();
                await chart.setState({ ...chart.getState(), annotations: [annotation] });
                await waitForChartStability(chart);
            }

            it('deselects it when the restored annotation is read-only', async () => {
                await restoreWhileSelected({ type: 'horizontal-line', value: 50, readOnly: true });

                await pressKey(chart, 'Delete');

                expect(chart.getState().annotations).toHaveLength(1);
            });

            it('shows it as locked when the restored annotation is locked', async () => {
                await restoreWhileSelected({ type: 'horizontal-line', value: 50, locked: true });

                const lockButton = body().querySelector<HTMLElement>('button[aria-label="Unlock"]');
                expect(lockButton).not.toBeNull();
                expect(lockButton?.hasAttribute('aria-checked')).toBe(false);
            });
        });

        // Each begins an edit and ends it again, returning the chart to idle.
        const edits = [
            [
                'dragging the annotation',
                async () => {
                    await selectAtCentre();
                    const { x, y } = centre();
                    await mouseDownAction(x, y)(chart);
                    await hoverAction(x, y + 20)(chart);
                },
                async () => {
                    const { x, y } = centre();
                    await mouseUpAction(x, y + 20)(chart);
                },
            ],
            [
                'moving the annotation with the arrow keys',
                async () => {
                    await selectAtCentre();
                    await pressKey(chart, 'ArrowUp');
                },
                () => releaseKey(chart, 'ArrowUp'),
            ],
            [
                "having the annotation's settings dialog open",
                async () => {
                    await selectAtCentre();
                    body().querySelector<HTMLElement>('button[title="Settings"]')!.click();
                    await waitForChartStability(chart);
                    expect(body().querySelector('.ag-charts-dialog')).not.toBeNull();
                },
                async () => {
                    body().querySelector<HTMLElement>('.ag-charts-dialog__close-button')!.click();
                    await waitForChartStability(chart);
                },
            ],
            [
                'having the colour picker open',
                async () => {
                    await selectAtCentre();
                    body().querySelector<HTMLElement>('button[title="Line Color"]')!.click();
                    await waitForChartStability(chart);
                    expect(body().querySelector('.ag-charts-color-picker')).not.toBeNull();
                },
                () => pressKey(chart, 'Escape'),
            ],
            [
                'having the line style menu open',
                async () => {
                    await selectAtCentre();
                    body().querySelector<HTMLElement>('button[title="Line Style"]')!.click();
                    await waitForChartStability(chart);
                    expect(body().querySelector('.ag-charts-annotations__line-style-type-menu')).not.toBeNull();
                },
                () => pressKey(chart, 'Escape'),
            ],
            [
                'creating an annotation',
                async () => {
                    body().querySelector<HTMLElement>('button[title="Trend Lines"]')!.click();
                    await waitForChartStability(chart);
                    const rows = Array.from(body().querySelectorAll<HTMLElement>('.ag-charts-menu__row'));
                    rows.find((row) => row.textContent === 'Trend Line')!.click();
                    await waitForChartStability(chart);
                },
                () => pressKey(chart, 'Escape'),
            ],
        ] as const;

        describe('is ignored while the annotation is being edited', () => {
            it.each(edits)('ignores it while %s, then applies it once that ends', async (_name, begin, end) => {
                await prepareZoomableChart();

                await begin();
                await expectIgnored();

                await end();
                expectRestored(await setRestoredState());
            });

            it('ignores it while typing in a text annotation, then applies it once that ends', async () => {
                await prepareZoomableChart([textAnnotation]);
                const text = at(0.5, 0.25);
                await clickAt(text); // selects it
                await clickAt(text); // starts editing its text
                expect(body().querySelector('.ag-charts-text-input__textarea')).not.toBeNull();

                await expectIgnored();

                await clickAt(at(0.1, 0.9)); // saves the text and leaves the annotation
                expect(body().querySelector('.ag-charts-text-input__textarea')).toBeNull();
                expectRestored(await setRestoredState());
            });
        });
    });
});
