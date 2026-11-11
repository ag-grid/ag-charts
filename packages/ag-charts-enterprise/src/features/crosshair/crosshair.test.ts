import { afterEach, describe, expect, it } from 'vitest';

import type {
    AgAreaSeriesOptions,
    AgBarSeriesOptions,
    AgBoxPlotCrosshairSnapValue,
    AgBoxPlotSeriesOptions,
    AgCandlestickSeriesOptions,
    AgCartesianAxesOptions,
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgCrosshairOptions,
    AgHlcSeriesOptions,
    AgLineSeriesOptions,
    AgNumericAxisCrosshairOptions,
    AgOhlcSeriesOptions,
    AgRangeAreaSeriesOptions,
    AgRangeBarCrosshairSnapValue,
    AgRangeBarSeriesOptions,
    AgTimeAxisCrosshairOptions,
} from 'ag-charts-community';
import {
    HIGH_VOLUME_COUNT,
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    STRIPPED_NUMBER_AXES,
    applyAxesFlip,
    compareImageSnapshot,
    delay,
    deproxy,
    expectWarningsCalls,
    findAxis,
    getAxisLayoutState,
    getAxisTitleBBox,
    getSeriesNodeData,
    getSeriesRect,
    hoverAction,
    mouseDownAction,
    mouseUpAction,
    pressKey,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    tabIntoChart,
    waitForChartStability,
} from 'ag-charts-community-test';
import { mapValues } from 'ag-charts-core';
import type { AgAnnotation } from 'ag-charts-types';

import { getCrosshairLine, getCrosshairLines } from '../../test/featureAccessors';
import { createEnterpriseChart } from '../../test/utils';
import { ZOOM_VALID_CHECK_DEBOUNCE } from '../zoom/zoomUtils';

interface RangeBarNode {
    x: number;
    y: number;
    width: number;
    height: number;
    yHighValue: number;
}

interface CandlestickNode {
    centerX: number;
    y: number;
    height: number;
    highValue: number;
    datum: { high: number };
}

// JS callers can return null from a label renderer even though the type forbids it, so this is the one value the
// options type cannot express.
const RENDERS_NULL = (() => null) as unknown as () => undefined;

function applyCrosshairSnap<T extends AgCartesianChartOptions>(opts: T, snap: boolean): T {
    return {
        ...opts,
        axes: mapValues(opts['axes'] ?? {}, (axis) => ({
            ...axis,
            crosshair: {
                ...axis.crosshair,
                snap,
            },
        })),
    };
}

const CROSSHAIR_OPTIONS = {
    stroke: '#5470C6',
    strokeWidth: 3,
    lineDash: [10, 5],
    snap: false,
};

const BASE_OPTIONS: AgCartesianChartOptions = {
    ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    theme: {
        palette: {
            strokes: ['#9A60B4', '#91CC75', '#EE6666'],
            fills: ['#9A60B4', '#91CC75', '#EE6666'],
        },
        overrides: {
            line: {
                series: {
                    marker: {
                        size: 10,
                    },
                },
            },
            area: {
                series: {
                    marker: {
                        enabled: true,
                        size: 10,
                    },
                },
            },
        },
    },
    data: [
        { x: 0, y1: 100, y2: 2, y3: 64 },
        { x: 1, y1: 50, y2: 20, y3: 55 },
        { x: 2, y1: 25, y2: 200, y3: 48 },
        { x: 3, y1: 75, y2: 2000, y3: 72 },
    ],
    series: [
        { type: 'line', xKey: 'x', yKey: 'y1' },
        { type: 'line', xKey: 'x', yKey: 'y2' },
        { type: 'line', xKey: 'x', yKey: 'y3' },
    ],
};

const SIMPLE_AXIS_OPTIONS: AgCartesianAxesOptions = {
    y: {
        position: 'left',
        type: 'number',
        crosshair: CROSSHAIR_OPTIONS,
    },
    x: {
        position: 'bottom',
        type: 'number',
        crosshair: CROSSHAIR_OPTIONS,
    },
};

const CATEGORY_AXIS_OPTIONS: AgCartesianAxesOptions = {
    y: {
        position: 'left',
        type: 'number',
        crosshair: CROSSHAIR_OPTIONS,
    },
    x: {
        position: 'bottom',
        type: 'category',
        crosshair: CROSSHAIR_OPTIONS,
    },
};

const SECONDARY_AXIS_OPTIONS: AgCartesianAxesOptions = {
    y: {
        position: 'left',
        type: 'number',
        crosshair: CROSSHAIR_OPTIONS,
    },
    ySecondary: {
        position: 'left',
        type: 'number',
        crosshair: {
            ...CROSSHAIR_OPTIONS,
            stroke: '#73C0DE',
        },
    },
    x: {
        position: 'bottom',
        type: 'number',
        crosshair: CROSSHAIR_OPTIONS,
    },
};

const SIMPLE_LINE_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: SIMPLE_AXIS_OPTIONS,
};

const SIMPLE_COLUMN_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: CATEGORY_AXIS_OPTIONS,
    tooltip: { mode: 'shared', range: 'exact' },
    series: BASE_OPTIONS.series?.map((s) => ({ ...s, type: 'bar' })) as AgBarSeriesOptions[],
};

const LINE_SECONDARY_AXIS_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: SECONDARY_AXIS_OPTIONS,
    series: BASE_OPTIONS.series?.map((s) => ({ ...s, yKeyAxis: 'yKey' in s && s.yKey === 'y2' ? 'ySecondary' : 'y' })),
};

const STACKED_COLUMN_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: SIMPLE_AXIS_OPTIONS,
    tooltip: { mode: 'shared', range: 'exact' },
    series: BASE_OPTIONS.series?.map((s) => ({ ...s, type: 'bar', stacked: true })) as AgBarSeriesOptions[],
};

const GROUPED_COLUMN_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: CATEGORY_AXIS_OPTIONS,
    tooltip: { mode: 'shared', range: 'exact' },
    series: BASE_OPTIONS.series?.map((s) => ({ ...s, type: 'bar', stacked: false })) as AgBarSeriesOptions[],
};

const STACKED_BAR_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: SIMPLE_AXIS_OPTIONS,
    tooltip: { mode: 'shared', range: 'exact' },
    series: BASE_OPTIONS.series?.map((s) => ({
        ...s,
        type: 'bar',
        direction: 'horizontal',
        stacked: true,
    })) as AgBarSeriesOptions[],
};

const GROUPED_BAR_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    data: [
        { x: 0, y1: 100, y2: 2, y3: 1700 },
        { x: 1, y1: 50, y2: 20, y3: 55 },
        { x: 2, y1: 25, y2: 200, y3: 48 },
        { x: 3, y1: 75, y2: 2000, y3: 72 },
    ],
    tooltip: { mode: 'shared', range: 'exact' },
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            crosshair: CROSSHAIR_OPTIONS,
        },
        y: {
            position: 'left',
            type: 'category',
            crosshair: CROSSHAIR_OPTIONS,
        },
    },
    series: BASE_OPTIONS.series?.map((s) => ({
        ...s,
        type: 'bar',
        direction: 'horizontal',
        stacked: false,
    })) as AgBarSeriesOptions[],
};

const STACKED_AREA_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: SIMPLE_AXIS_OPTIONS,
    series: BASE_OPTIONS.series?.map((s) => ({ ...s, type: 'area', stacked: true })) as AgAreaSeriesOptions[],
};

const HISTOGRAM_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: SIMPLE_AXIS_OPTIONS,
    data: [
        { x: 0, y1: 100 },
        { x: 1, y1: 500 },
        { x: 2, y1: 250 },
        { x: 3, y1: 750 },
        { x: 4, y1: 100 },
        { x: 5, y1: 500 },
        { x: 6, y1: 250 },
        { x: 7, y1: 750 },
        { x: 8, y1: 100 },
        { x: 9, y1: 500 },
        { x: 10, y1: 250 },
        { x: 11, y1: 750 },
        { x: 12, y1: 100 },
        { x: 13, y1: 500 },
        { x: 14, y1: 250 },
        { x: 15, y1: 750 },
        { x: 16, y1: 250 },
    ],
    tooltip: { range: 'exact' },
    series: [
        {
            type: 'histogram',
            xKey: 'x',
            yKey: 'y1',
        },
    ],
};

describe('Crosshair', () => {
    setupMockConsole();

    let chart: AgChartInstance;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    const toCanvas = (x: unknown, y: unknown) => {
        const xAxis = findAxis(chart, 'bottom');
        const yAxis = findAxis(chart, 'left');
        return {
            x:
                getAxisLayoutState(chart, 'bottom').translation.x +
                xAxis.scale.convert(x) +
                (xAxis.scale.bandwidth ?? 0) / 2,
            y:
                getAxisLayoutState(chart, 'left').translation.y +
                yAxis.scale.convert(y) +
                (yAxis.scale.bandwidth ?? 0) / 2,
        };
    };

    const CASES = [
        SIMPLE_LINE_OPTIONS,
        applyAxesFlip(SIMPLE_LINE_OPTIONS),
        SIMPLE_COLUMN_OPTIONS,
        LINE_SECONDARY_AXIS_OPTIONS,
        applyAxesFlip(LINE_SECONDARY_AXIS_OPTIONS),
        STACKED_COLUMN_OPTIONS,
        STACKED_BAR_OPTIONS,
        STACKED_AREA_OPTIONS,
        applyAxesFlip(STACKED_AREA_OPTIONS),
        HISTOGRAM_OPTIONS,
        GROUPED_COLUMN_OPTIONS,
        GROUPED_BAR_OPTIONS,
    ];

    it.each(CASES)(`should follow mouse pointer on series hover`, async (TEST_CASE) => {
        const options: AgChartOptions = TEST_CASE;
        chart = await createEnterpriseChart(options);
        await hoverAction(605, 300)(chart);
        await compare();
    });

    it.each(CASES)(`should snap to the closest highlighted node datum`, async (TEST_CASE) => {
        const options: AgChartOptions = applyCrosshairSnap(TEST_CASE, true);
        chart = await createEnterpriseChart(options);
        await hoverAction(605, 125)(chart);
        await compare();
    });

    it.each(CASES)(`should layout correctly with series area padding`, async (TEST_CASE) => {
        const options: AgChartOptions = TEST_CASE;
        options.seriesArea = {
            padding: {
                left: 100,
                right: 100,
                bottom: 100,
                top: 100,
            },
        };

        chart = await createEnterpriseChart(options);
        await hoverAction(300, 300)(chart);
        await compare();
    });

    it('AG-15565 draws area series crosshair in correct position', async () => {
        const data = [
            { month: 'Jan', subscriptions: 222, services: 250, products: 200 },
            { month: 'Feb', subscriptions: 240, services: 255, products: 210 },
            { month: 'Mar', subscriptions: 280, services: 245, products: null },
            { month: 'Apr', subscriptions: 300, services: 260, products: 205 },
            { month: 'May', subscriptions: 350, services: 235, products: 215 },
            { month: 'Jun', subscriptions: 420, services: Infinity, products: 200 },
            { month: 'Jul', subscriptions: 300, services: 255, products: 100 },
            { month: 'Aug', subscriptions: 270, services: 305, products: 210 },
            { month: 'Sep', subscriptions: 260, services: 280, products: 250 },
            { month: 'Oct', subscriptions: 385, services: 250, products: Number.NaN },
            { month: 'Nov', subscriptions: 320, services: 265, products: 215 },
            { month: 'Dec', subscriptions: 330, services: 255, products: 220 },
        ];

        const options: AgChartOptions = {
            data,
            series: [
                {
                    type: 'area',
                    xKey: 'month',
                    yKey: 'subscriptions',
                    yName: 'Subscriptions',
                    stacked: true,
                },
                {
                    type: 'area',
                    xKey: 'month',
                    yKey: 'services',
                    yName: 'Services',
                    stacked: true,
                },
                {
                    type: 'area',
                    xKey: 'month',
                    yKey: 'products',
                    yName: 'Products',
                    stacked: true,
                },
            ],
        };

        chart = await createEnterpriseChart(options);
        await hoverAction(260, 140)(chart);
        await compare();
    });

    it('AG-16729 should display crosshair with snap when highlight.enabled is false', async () => {
        const options: AgCartesianChartOptions = {
            data: [
                { x: 'A', y: 100 },
                { x: 'B', y: 200 },
                { x: 'C', y: 150 },
                { x: 'D', y: 300 },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'x',
                    yKey: 'y',
                    highlight: { enabled: false },
                },
            ],
            axes: {
                y: {
                    type: 'number',
                    position: 'left',
                    crosshair: { ...CROSSHAIR_OPTIONS, snap: true },
                },
                x: {
                    type: 'category',
                    position: 'bottom',
                    crosshair: { ...CROSSHAIR_OPTIONS, snap: true },
                },
            },
            tooltip: { range: 'exact' },
        };

        chart = await createEnterpriseChart(options);
        await hoverAction(300, 300)(chart);
        await compare();
    });

    it('should follow the pointer on an inset axis in a zoomed chart', async () => {
        chart = await createEnterpriseChart({
            ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
            theme: BASE_OPTIONS.theme,
            data: BASE_OPTIONS.data,
            series: [
                { type: 'line', xKey: 'x', yKey: 'y1' },
                { type: 'line', xKey: 'x', yKey: 'y2', yKeyAxis: 'yInset' },
            ],
            axes: {
                x: { type: 'number', position: 'bottom', crosshair: CROSSHAIR_OPTIONS },
                y: { type: 'number', position: 'left', crosshair: CROSSHAIR_OPTIONS },
                yInset: {
                    type: 'inset-number',
                    position: 'right',
                    lengthRatio: 0.4,
                    label: { enabled: true },
                    crosshair: { ...CROSSHAIR_OPTIONS, enabled: true },
                },
            },
            zoom: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.2, end: 0.8 } } },
        });
        await hoverAction(300, 450)(chart);
        await compare();
    });

    it('AG-16613 should handle null category values with crosshair', async () => {
        // `allowNullKeys` is undocumented, so the series options type does not know it.
        const series: AgLineSeriesOptions & { allowNullKeys: boolean } = {
            type: 'line',
            yKey: 'population',
            xKey: 'year',
            allowNullKeys: true,
        };
        const options: AgCartesianChartOptions = {
            data: [
                { year: null, population: 5315511894 },
                { year: '2000', population: 6132455985 },
            ],
            series: [series],
            axes: {
                y: {
                    type: 'number',
                    crosshair: { enabled: true, snap: true },
                },
                x: {
                    type: 'category',
                    crosshair: { enabled: true, snap: true },
                },
            },
            formatter: {
                y: ({ value }: any) => {
                    const num = Number(value);
                    return `${(num / 1e9).toFixed(1)}bn`;
                },
            },
        };

        chart = await createEnterpriseChart(options);

        const visibleLabels = (axisId: string) =>
            Array.from(
                document.querySelectorAll<HTMLElement>(
                    `.ag-charts-crosshair-label[data-axis-id="${axisId}"]:not(.ag-charts-crosshair-label--hidden)`
                )
            );

        const labelTexts = (axisId: string) => visibleLabels(axisId).map((el) => el.textContent?.trim());

        // Hover over the null category (first data point)
        await hoverAction(100, 200)(chart);
        await compare();
        expect(visibleLabels('x').length).toBeGreaterThan(0);
        expect(visibleLabels('y').length).toBeGreaterThan(0);
        expect(labelTexts('x')).toEqual(expect.arrayContaining(['']));

        // Hover over a non-null category (second data point)
        await hoverAction(600, 200)(chart);
        await compare();
        expect(visibleLabels('x').length).toBeGreaterThan(0);
        expect(visibleLabels('y').length).toBeGreaterThan(0);
        expect(labelTexts('x')).toEqual(expect.arrayContaining([expect.stringContaining('2000')]));
    });

    it('AG-10316 label.renderer returning undefined falls through to default formatted value', async () => {
        const options: AgCartesianChartOptions = {
            data: [
                { x: 'A', y: 100 },
                { x: 'B', y: 200 },
                { x: 'C', y: 150 },
                { x: 'D', y: 300 },
            ],
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            axes: {
                y: {
                    type: 'number',
                    position: 'left',
                    crosshair: {
                        ...CROSSHAIR_OPTIONS,
                        snap: true,
                        label: { renderer: () => undefined },
                    },
                },
                x: {
                    type: 'category',
                    position: 'bottom',
                    crosshair: {
                        ...CROSSHAIR_OPTIONS,
                        snap: true,
                        label: { renderer: () => undefined },
                    },
                },
            },
        };
        chart = await createEnterpriseChart(options);
        await hoverAction(300, 300)(chart);
        await waitForChartStability(chart);

        const yLabels = Array.from(
            document.querySelectorAll<HTMLElement>(
                `.ag-charts-crosshair-label[data-axis-id="y"]:not(.ag-charts-crosshair-label--hidden)`
            )
        );
        const xLabels = Array.from(
            document.querySelectorAll<HTMLElement>(
                `.ag-charts-crosshair-label[data-axis-id="x"]:not(.ag-charts-crosshair-label--hidden)`
            )
        );
        const visibleText = (els: HTMLElement[]) =>
            els.map((el) => el.textContent?.trim() ?? '').filter((t) => t.length > 0);

        // The renderer returns undefined; the crosshair label must fall through to the
        // default formatted value rather than rendering literal "undefined".
        expect(yLabels.length).toBeGreaterThan(0);
        expect(xLabels.length).toBeGreaterThan(0);
        expect(visibleText(xLabels).some((t) => t.includes('undefined'))).toBe(false);
        expect(visibleText(yLabels).some((t) => t.includes('undefined'))).toBe(false);
        // Expect the y axis label to contain a numeric default formatted value.
        expect(visibleText(yLabels).some((t) => /\d/.test(t))).toBe(true);
    });

    it('AG-10316 label.renderer returning null falls through (treated as undefined)', async () => {
        const options: AgCartesianChartOptions = {
            data: [
                { x: 'A', y: 100 },
                { x: 'B', y: 200 },
                { x: 'C', y: 150 },
                { x: 'D', y: 300 },
            ],
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            axes: {
                y: {
                    type: 'number',
                    position: 'left',
                    crosshair: {
                        ...CROSSHAIR_OPTIONS,
                        snap: true,
                        // This should fall through to the default formatted value rather than throwing.
                        label: { renderer: RENDERS_NULL },
                    },
                },
                x: {
                    type: 'category',
                    position: 'bottom',
                    crosshair: {
                        ...CROSSHAIR_OPTIONS,
                        snap: true,
                        label: { renderer: RENDERS_NULL },
                    },
                },
            },
        };
        chart = await createEnterpriseChart(options);
        await hoverAction(300, 300)(chart);
        await waitForChartStability(chart);

        const yLabels = Array.from(
            document.querySelectorAll<HTMLElement>(
                `.ag-charts-crosshair-label[data-axis-id="y"]:not(.ag-charts-crosshair-label--hidden)`
            )
        );
        const xLabels = Array.from(
            document.querySelectorAll<HTMLElement>(
                `.ag-charts-crosshair-label[data-axis-id="x"]:not(.ag-charts-crosshair-label--hidden)`
            )
        );
        const visibleText = (els: HTMLElement[]) =>
            els.map((el) => el.textContent?.trim() ?? '').filter((t) => t.length > 0);

        expect(yLabels.length).toBeGreaterThan(0);
        expect(xLabels.length).toBeGreaterThan(0);
        expect(visibleText(xLabels).some((t) => t.includes('null'))).toBe(false);
        expect(visibleText(yLabels).some((t) => t.includes('null'))).toBe(false);
        expect(visibleText(yLabels).some((t) => /\d/.test(t))).toBe(true);
    });

    describe('RTL label text', () => {
        const NEGATIVE_OPTIONS: AgCartesianChartOptions = {
            enableRtl: true,
            data: [
                { x: 'ינואר', y: -45 },
                { x: 'פברואר', y: 30 },
                { x: 'מרץ', y: -20 },
                { x: 'אפריל', y: 60 },
            ],
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            axes: {
                y: { type: 'number', position: 'left', crosshair: { ...CROSSHAIR_OPTIONS, snap: false } },
                x: { type: 'category', position: 'bottom', crosshair: { ...CROSSHAIR_OPTIONS, snap: false } },
            },
        };

        const yLabelText = () =>
            Array.from(
                document.querySelectorAll<HTMLElement>(
                    `.ag-charts-crosshair-label[data-axis-id="y"]:not(.ag-charts-crosshair-label--hidden)`
                )
            )
                .map((el) => el.textContent?.trim() ?? '')
                .filter((text) => text.length > 0);

        const hoverOverNegativeValues = async (options: AgCartesianChartOptions) => {
            chart = await createEnterpriseChart(options);
            await hoverAction(300, 450)(chart);
            await waitForChartStability(chart);
        };

        it('keeps a negative default label value left-to-right', async () => {
            await hoverOverNegativeValues({ ...NEGATIVE_OPTIONS });

            const labels = yLabelText();
            expect(labels.length).toBeGreaterThan(0);
            expect(labels.some((text) => /‪-[\d.]+‬/.test(text))).toBe(true);
        });

        it('leaves a renderer-supplied label alone', async () => {
            await hoverOverNegativeValues({
                ...NEGATIVE_OPTIONS,
                axes: {
                    ...NEGATIVE_OPTIONS.axes,
                    y: {
                        type: 'number',
                        position: 'left',
                        crosshair: {
                            ...CROSSHAIR_OPTIONS,
                            snap: false,
                            label: { renderer: ({ value }) => `<b>${value}</b>` },
                        },
                    },
                },
            });

            const labels = yLabelText();
            expect(labels.length).toBeGreaterThan(0);
            expect(labels.some((text) => text.includes('‪'))).toBe(false);
        });
    });

    it('AG-16608 should follow the pointer over bigint axis domains without error', async () => {
        // Out-of-safe-range y-values: the crosshair label readback inverts the scale on a bigint domain.
        const BIG = 9_007_199_254_740_993n; // Number.MAX_SAFE_INTEGER + 2
        const options: AgCartesianChartOptions = {
            data: [
                { x: 0, y: BIG },
                { x: 1, y: BIG * 3n },
                { x: 2, y: BIG * 2n },
                { x: 3, y: BIG * 4n },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'number', position: 'bottom', crosshair: { enabled: true, snap: false } },
                y: { type: 'number', position: 'left', crosshair: { enabled: true, snap: false } },
            },
        };
        chart = await createEnterpriseChart(options);
        await hoverAction(480, 250)(chart);
        await waitForChartStability(chart);
    });

    it.each(['scatter', 'line'] as const)(
        'AG-18746 x label and markers stay correct after zooming past a %s series with no visible data',
        async (type) => {
            const DAY = 24 * 3600_000;
            const start = new Date('2025-01-01T00:00:00Z').getTime();
            const dense = Array.from({ length: 101 }, (_, i) => ({ date: new Date(start + i * DAY), value: 10 }));
            // Points only at both ends, so zooming into the middle leaves this series with nothing in view.
            const gap = [0, 1, 2, 98, 99, 100].map((i) => ({
                date: new Date(start + i * DAY),
                value: i < 50 ? 0 : 20,
            }));

            const hoveredDates: number[] = [];
            const labelValues: Array<{ value: number; domain: number[] }> = [];
            const options: AgCartesianChartOptions = {
                series: [
                    { type, title: 'Gap', data: gap, xKey: 'date', yKey: 'value' },
                    {
                        type,
                        title: 'Dense',
                        data: dense,
                        xKey: 'date',
                        yKey: 'value',
                        tooltip: {
                            renderer: ({ datum }: { datum: { date: Date } }) => {
                                hoveredDates.push(datum.date.getTime());
                                return '';
                            },
                        },
                    },
                ],
                zoom: { enabled: true, anchorPointX: 'pointer', anchorPointY: 'pointer' },
                axes: {
                    x: {
                        type: 'time',
                        crosshair: {
                            enabled: true,
                            label: {
                                formatter: ({ value, domain }) => {
                                    labelValues.push({ value: Number(value), domain: domain.map(Number) });
                                    return String(Number(value));
                                },
                            },
                        },
                    },
                    y: { type: 'number' },
                },
            };
            chart = await createEnterpriseChart(options);

            const rect = getSeriesRect(chart);
            const cx = rect.x + rect.width / 2;
            const cy = rect.y + rect.height / 2;
            const zoomIn = async (steps: number) => {
                for (let i = 0; i < steps; i++) {
                    await scrollAction(cx, cy, -1)(chart);
                }
                await waitForChartStability(chart);
                // Outlast the zoom toolbar's debounced button-state check, which re-validates the zoom after layout.
                await delay(ZOOM_VALID_CHECK_DEBOUNCE + 100);
            };

            await zoomIn(6);
            await hoverAction(cx, cy)(chart);
            await waitForChartStability(chart);

            expect(hoveredDates.length).toBeGreaterThan(0);
            expect(labelValues.length).toBeGreaterThan(0);
            const { value, domain } = labelValues.at(-1)!;
            expect(value).toBeGreaterThanOrEqual(domain[0]);
            expect(value).toBeLessThanOrEqual(domain[1]);
            expect(value).toBe(hoveredDates.at(-1));

            // A further zoom step must leave the markers spread across the zoomed range, not collapsed onto the left edge.
            await zoomIn(1);
            const markerXs = getSeriesNodeData<{ point: { x: number } }>(chart, 1).map((d) => d.point.x);
            expect(Math.max(...markerXs) - Math.min(...markerXs)).toBeGreaterThan(rect.width / 2);
        }
    );

    describe('label text', () => {
        const MARKUP_CATEGORY = '<b class="m">A</b> & "B"';

        const labelOptions = (
            xCrosshair: NonNullable<AgCartesianAxesOptions['x']>['crosshair'] = {},
            yAxis: AgCartesianAxesOptions['y'] = { type: 'number', position: 'left' }
        ): AgCartesianChartOptions => ({
            data: [
                { x: 'A', y: 100 },
                { x: MARKUP_CATEGORY, y: 200 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    crosshair: { ...CROSSHAIR_OPTIONS, snap: true, ...xCrosshair },
                },
                y: { crosshair: { ...CROSSHAIR_OPTIONS, snap: true }, ...yAxis },
            },
        });

        const labelContent = (axisId: string) => {
            const labels = Array.from(
                document.querySelectorAll<HTMLElement>(
                    `.ag-charts-crosshair-label[data-axis-id="${axisId}"]:not(.ag-charts-crosshair-label--hidden)`
                )
            ).filter((label) => label.childElementCount > 0);
            expect(labels.length).toBeGreaterThan(0);
            return {
                text: labels.map((label) => label.textContent).join(),
                has: (selector: string) => labels.some((label) => label.querySelector(selector) != null),
            };
        };

        const hoverMarkupCategory = async (options: AgCartesianChartOptions) => {
            chart = await createEnterpriseChart(options);
            await hoverAction(600, 200)(chart);
            await waitForChartStability(chart);
        };

        it('renders markup characters in category values as text', async () => {
            await hoverMarkupCategory(labelOptions());

            const label = labelContent('x');
            expect(label.has('b')).toBe(false);
            expect(label.text).toContain(MARKUP_CATEGORY);
        });

        it.each([
            ['crosshair label formatter', { crosshair: { snap: true, label: { formatter: () => '<i>x</i> & y' } } }],
            ['axis label formatter', { label: { formatter: () => '<i>x</i> & y' } }],
        ] as const)('renders markup characters in %s output as text', async (_name, yAxis) => {
            await hoverMarkupCategory(labelOptions({}, { type: 'number', position: 'left', ...yAxis }));

            const label = labelContent('y');
            expect(label.has('i')).toBe(false);
            expect(label.text).toContain('<i>x</i> & y');
        });

        it('inserts renderer string output as HTML and passes it the raw value', async () => {
            const values: unknown[] = [];
            await hoverMarkupCategory(
                labelOptions({
                    label: {
                        renderer: ({ value }) => {
                            values.push(value);
                            return '<b class="r">R</b>';
                        },
                    },
                })
            );

            expect(labelContent('x').has('b.r')).toBe(true);
            expect(values).toContain(MARKUP_CATEGORY);
        });

        it('inserts renderer object text as HTML', async () => {
            await hoverMarkupCategory(labelOptions({ label: { renderer: () => ({ text: '<b class="r">R</b>' }) } }));

            expect(labelContent('x').has('b.r')).toBe(true);
        });

        it('escapes the default text when a renderer object omits text', async () => {
            await hoverMarkupCategory(labelOptions({ label: { renderer: () => ({ color: 'red' }) } }));

            const label = labelContent('x');
            expect(label.has('b')).toBe(false);
            expect(label.text).toContain(MARKUP_CATEGORY);
        });
    });

    describe('label placement', () => {
        // The label is a DOM element in the canvas overlay, so its placement is invisible to an image
        // snapshot — read the positional styles instead.
        const labelPlacement = (axisId: string) =>
            Array.from(
                document.querySelectorAll<HTMLElement>(
                    `.ag-charts-crosshair-label[data-axis-id="${axisId}"]:not(.ag-charts-crosshair-label--hidden)`
                )
            ).map(({ style }) => `${style.left} ${style.top} (${style.translate})`);

        const hoverWithAxes = async (axes: AgCartesianAxesOptions) => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: -10, y: -8 },
                    { x: 0, y: 0 },
                    { x: 10, y: 9 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes,
            };
            chart = await createEnterpriseChart(options);
            await hoverAction(480, 250)(chart);
            await waitForChartStability(chart);
        };

        const axesAt = (crossAt?: { value: number }): AgCartesianAxesOptions => ({
            x: { type: 'number', position: 'bottom', crosshair: { enabled: true, snap: false }, crossAt },
            y: { type: 'number', position: 'left', crosshair: { enabled: true, snap: false }, crossAt },
        });

        it('should place labels against the axes at their position edges', async () => {
            await hoverWithAxes(axesAt());

            expect(labelPlacement('x')).toMatchInlineSnapshot(`
              [
                "480px 562px (-50% 0)",
              ]
            `);
            expect(labelPlacement('y')).toMatchInlineSnapshot(`
              [
                "46px 250px (-100% -50%)",
              ]
            `);
        });

        it('should hold a label at the axis line when label spacing is smaller than its own padding', async () => {
            const { x, y } = axesAt();
            await hoverWithAxes({ x: { ...x, label: { spacing: 6 } }, y: { ...y, label: { spacing: 6 } } });

            expect(labelPlacement('x')).toMatchInlineSnapshot(`
              [
                "480px 562px (-50% 0)",
              ]
            `);
            expect(labelPlacement('y')).toMatchInlineSnapshot(`
              [
                "44px 250px (-100% -50%)",
              ]
            `);
        });

        it('should place an edge title beyond the crosshair label band of a crossAt axis', async () => {
            const { x, y } = axesAt({ value: 0 });
            await hoverWithAxes({ x: { ...x, title: { text: 'X Axis' } }, y: { ...y, title: { text: 'Y Axis' } } });

            const seriesRect = getSeriesRect(chart);
            const xTitle = getAxisTitleBBox(chart, 'bottom');
            const yTitle = getAxisTitleBBox(chart, 'left');

            const xBand = getAxisLayoutState(chart, 'bottom').labelThickness ?? 0;
            const yBand = getAxisLayoutState(chart, 'left').labelThickness ?? 0;

            expect(labelPlacement('x')).toHaveLength(1);
            expect(labelPlacement('y')).toHaveLength(1);
            expect(Math.min(xBand, yBand)).toBeGreaterThan(0);
            expect(xTitle.y).toBeGreaterThanOrEqual(seriesRect.y + seriesRect.height + xBand);
            expect(yTitle.x + yTitle.width).toBeLessThanOrEqual(seriesRect.x - yBand);
        });

        it('should keep labels at the position edges when crossAt moves the axis lines', async () => {
            await hoverWithAxes(axesAt({ value: 0 }));

            expect(labelPlacement('x')).toMatchInlineSnapshot(`
              [
                "480px 562px (-50% 0)",
              ]
            `);
            expect(labelPlacement('y')).toMatchInlineSnapshot(`
              [
                "46px 250px (-100% -50%)",
              ]
            `);
        });
    });
    describe('CRT-1234 cross-line annotation drag', () => {
        // A dragged cross-line's own axis label already reports the value, so the crosshair label on that axis
        // would only cover it. Every other annotation drag, and plain hovering, keeps the crosshair labels.
        // `moved` reads the annotation back after the drag: a negative case only counts if the drag really took it.
        type Case = {
            annotation: AgAnnotation;
            hidden: string[];
            shown: string[];
            moved: (state: AgAnnotation) => boolean;
        };

        const withAnnotation = (annotation: AgAnnotation, snap: boolean): AgCartesianChartOptions => ({
            data: [
                { x: 0, y: 0 },
                { x: 5, y: 5 },
                { x: 10, y: 10 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'number', position: 'bottom', crosshair: { enabled: true, snap } },
                y: { type: 'number', position: 'left', crosshair: { enabled: true, snap } },
            },
            annotations: { enabled: true, toolbar: { enabled: false } },
            initialState: { annotations: [annotation] },
        });

        const visibleLabels = (axisId: string) =>
            document.querySelectorAll(
                `.ag-charts-crosshair-label[data-axis-id="${axisId}"]:not(.ag-charts-crosshair-label--hidden)`
            ).length;

        const expectLabels = ({ hidden, shown }: Pick<Case, 'hidden' | 'shown'>) => {
            for (const axisId of hidden) expect(visibleLabels(axisId), `${axisId} label`).toBe(0);
            for (const axisId of shown) expect(visibleLabels(axisId), `${axisId} label`).toBe(1);
        };

        // Every annotation under test passes through the datum at (5, 5); hovering there first is what marks it
        // as the drag target. The drag ends near (8, 8), along the series and far enough that a snapping
        // crosshair changes its highlighted datum mid-drag.
        const startDragging = async () => {
            const from = toCanvas(5, 5);
            const to = toCanvas(8, 8);
            await hoverAction(from.x, from.y)(chart);
            await mouseDownAction(from.x, from.y)(chart);
            await hoverAction(to.x, to.y)(chart);
            await waitForChartStability(chart);
            return to;
        };

        const DRAG_CASES: Record<string, Case> = {
            'vertical line yields the x-axis label': {
                annotation: { type: 'vertical-line', value: 5 },
                hidden: ['x'],
                shown: ['y'],
                moved: (state) => (state as { value: number }).value > 5,
            },
            'horizontal line yields the y-axis label': {
                annotation: { type: 'horizontal-line', value: 5 },
                hidden: ['y'],
                shown: ['x'],
                moved: (state) => (state as { value: number }).value > 5,
            },
            'cross-line without an axis label keeps both labels': {
                annotation: { type: 'vertical-line', value: 5, axisLabel: { enabled: false } },
                hidden: [],
                shown: ['x', 'y'],
                moved: (state) => (state as { value: number }).value > 5,
            },
            'trend line keeps both labels': {
                annotation: { type: 'line', start: { x: 2, y: 2 }, end: { x: 8, y: 8 } },
                hidden: [],
                shown: ['x', 'y'],
                moved: (state) => (state as { start: { x: number } }).start.x > 2,
            },
        };

        describe.each([true, false])('snap: %s', (snap) => {
            it.each(Object.entries(DRAG_CASES))('%s while dragging', async (_name, testCase) => {
                chart = await createEnterpriseChart(withAnnotation(testCase.annotation, snap));
                const to = await startDragging();
                expectLabels(testCase);

                // Releasing restores both labels on the next pointer move.
                await mouseUpAction(to.x, to.y)(chart);
                await hoverAction(to.x + 10, to.y)(chart);
                await waitForChartStability(chart);
                expectLabels({ hidden: [], shown: ['x', 'y'] });
                expect(testCase.moved(chart.getState().annotations![0]), 'annotation moved').toBe(true);
            });

            it('hovering a labelled cross-line without dragging keeps both labels', async () => {
                chart = await createEnterpriseChart(
                    withAnnotation(DRAG_CASES['vertical line yields the x-axis label'].annotation, snap)
                );
                const over = toCanvas(5, 5);
                await hoverAction(over.x, over.y)(chart);
                await waitForChartStability(chart);
                expectLabels({ hidden: [], shown: ['x', 'y'] });
            });
        });

        describe('AG-18186 pointer dragged out of the series area', () => {
            // While a drag holds the pointer, it keeps reporting positions outside the series area; a crosshair
            // must hide on the axis the pointer has left rather than follow it into the chart padding.
            const crosshairLine = (direction: 'x' | 'y') => {
                const { visible, y1 } = getCrosshairLine(chart, direction === 'x' ? 'bottom' : 'left');
                return { visible, y: y1 };
            };

            const dragTo = async (x: number, y: number) => {
                await hoverAction(x, y)(chart);
                await waitForChartStability(chart);
            };

            // The first move out also leaves the bounds element, so take a second step to assert the drag itself.
            const dragOut = async (x: number, y: number, dx: number, dy: number) => {
                await dragTo(x, y);
                await dragTo(x + dx, y + dy);
            };

            const startDrag = async (annotation: AgAnnotation) => {
                chart = await createEnterpriseChart(withAnnotation(annotation, false));
                const from = toCanvas(5, 5);
                await hoverAction(from.x, from.y)(chart);
                await mouseDownAction(from.x, from.y)(chart);
                await dragTo(from.x, from.y - 10);
                return from;
            };

            it.each<[string, AgAnnotation]>([
                ['horizontal line', { type: 'horizontal-line', value: 5 }],
                ['vertical line', { type: 'vertical-line', value: 5 }],
            ])('hides the y crosshair while a %s is dragged above or below the series area', async (_n, annotation) => {
                const from = await startDrag(annotation);
                expect(crosshairLine('y').visible, 'inside').toBe(true);

                const rect = getSeriesRect(chart);
                await dragOut(from.x, rect.y - 20, 0, -20);
                expect(crosshairLine('y').visible, 'above').toBe(false);
                expect(visibleLabels('y'), 'y label above').toBe(0);

                await dragOut(from.x, rect.y + rect.height + 20, 0, 20);
                expect(crosshairLine('y').visible, 'below').toBe(false);
                expect(visibleLabels('y'), 'y label below').toBe(0);

                // Back inside, the crosshair follows the pointer again.
                await dragTo(from.x, from.y);
                const line = crosshairLine('y');
                expect(line.visible, 'back inside').toBe(true);
                expect(line.y).toBeCloseTo(from.y - rect.y, 0);
            });

            it('hides the x crosshair while a vertical line is dragged past the left or right edge', async () => {
                const from = await startDrag({ type: 'vertical-line', value: 5 });
                expect(crosshairLine('x').visible, 'inside').toBe(true);

                const rect = getSeriesRect(chart);
                await dragOut(rect.x - 20, from.y, -20, 0);
                expect(crosshairLine('x').visible, 'left').toBe(false);
                expect(visibleLabels('x'), 'x label left').toBe(0);

                await dragOut(rect.x + rect.width + 20, from.y, 20, 0);
                expect(crosshairLine('x').visible, 'right').toBe(false);
                expect(visibleLabels('x'), 'x label right').toBe(0);
            });
        });
    });

    describe('crosshairSnapTo', () => {
        const BOX_DATA = [
            { x: 'A', min: 10, q1: 30, median: 50, q3: 70, max: 90 },
            { x: 'B', min: 20, q1: 35, median: 45, q3: 65, max: 95 },
            { x: 'C', min: 5, q1: 25, median: 40, q3: 60, max: 80 },
        ];
        const CANDLES = [
            { date: new Date('2024-01-01'), open: 100, high: 130, low: 90, close: 110 },
            { date: new Date('2024-01-02'), open: 110, high: 140, low: 95, close: 105 },
            { date: new Date('2024-01-03'), open: 105, high: 125, low: 85, close: 120 },
        ];
        const RANGES = [
            { x: 'A', lo: 20, hi: 60 },
            { x: 'B', lo: 30, hi: 80 },
            { x: 'C', lo: 10, hi: 50 },
        ];

        const boxPlot = (extra: Partial<AgBoxPlotSeriesOptions> = {}): AgBoxPlotSeriesOptions => ({
            type: 'box-plot',
            xKey: 'x',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
            ...extra,
        });
        const candlestick = (extra: Partial<AgCandlestickSeriesOptions> = {}): AgCandlestickSeriesOptions => ({
            type: 'candlestick',
            xKey: 'date',
            openKey: 'open',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            ...extra,
        });
        const ohlc = (extra: Partial<AgOhlcSeriesOptions> = {}): AgOhlcSeriesOptions => ({
            type: 'ohlc',
            xKey: 'date',
            openKey: 'open',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            ...extra,
        });
        const hlc = (extra: Partial<AgHlcSeriesOptions> = {}): AgHlcSeriesOptions => ({
            type: 'hlc',
            xKey: 'date',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            ...extra,
        });
        const rangeBar = (extra: Partial<AgRangeBarSeriesOptions> = {}): AgRangeBarSeriesOptions => ({
            type: 'range-bar',
            xKey: 'x',
            yLowKey: 'lo',
            yHighKey: 'hi',
            ...extra,
        });
        const rangeArea = (extra: Partial<AgRangeAreaSeriesOptions> = {}): AgRangeAreaSeriesOptions => ({
            type: 'range-area',
            xKey: 'x',
            yLowKey: 'lo',
            yHighKey: 'hi',
            ...extra,
        });

        const valueAxis = (crosshair: AgNumericAxisCrosshairOptions): AgCartesianAxesOptions => ({
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'left', crosshair },
        });
        const categoryCrosshair: AgCartesianAxesOptions = {
            x: { type: 'category', position: 'bottom', crosshair: { enabled: true, snap: true } },
            y: { type: 'number', position: 'left' },
        };
        const horizontalAxes: AgCartesianAxesOptions = {
            x: { type: 'number', position: 'bottom' },
            y: { type: 'category', position: 'left' },
        };

        const candleOptions = (
            series: AgCartesianChartOptions['series'],
            axes?: AgCartesianAxesOptions
        ): AgCartesianChartOptions => ({ data: CANDLES, series, axes });
        const boxOptions = (
            series: AgCartesianChartOptions['series'],
            axes?: AgCartesianAxesOptions
        ): AgCartesianChartOptions => ({ data: BOX_DATA, series, axes });
        const rangeOptions = (
            series: AgCartesianChartOptions['series'],
            axes?: AgCartesianAxesOptions
        ): AgCartesianChartOptions => ({ data: RANGES, series, axes });

        const axisPositionOf = (axis: string, value: unknown) => {
            const { scale } = findAxis(chart, axis);
            return scale.convert(value) + (scale.bandwidth ?? 0) / 2;
        };

        const visibleLabelCount = (axis: string) =>
            document.querySelectorAll(
                `.ag-charts-crosshair-label[data-axis-id="${findAxis(chart, axis).id}"]:not(.ag-charts-crosshair-label--hidden)`
            ).length;

        const byName = (a: string, b: string) => a.localeCompare(b);

        const lineKeys = (axis: string) => getCrosshairLines(chart, axis).map(({ key }) => key);

        const expectLines = (axis: string, expected: Record<string, unknown>) => {
            const lines = getCrosshairLines(chart, axis);
            expect(lines.map(({ key }) => key).toSorted(byName)).toEqual(Object.keys(expected).toSorted(byName));
            for (const { key, position } of lines) {
                expect(position, `${key} position`).toBeCloseTo(axisPositionOf(axis, expected[key]), 0);
            }
            expect(visibleLabelCount(axis), 'visible labels').toBe(lines.length);
        };

        const expectFollowsPointer = (axis: string, point: { x: number; y: number }) => {
            const { x, y } = getSeriesRect(chart);
            const lines = getCrosshairLines(chart, axis);
            expect(lines.map(({ key }) => key)).toEqual(['pointer']);
            const expected = ['bottom', 'top'].includes(findAxis(chart, axis).position ?? '')
                ? point.x - x
                : point.y - y;
            expect(lines[0].position).toBeCloseTo(expected, 0);
            expect(visibleLabelCount(axis)).toBe(1);
        };

        const hoverDatum = async (x: unknown, y: unknown, offsetX = 0) => {
            const { x: canvasX, y: canvasY } = toCanvas(x, y);
            const point = { x: canvasX + offsetX, y: canvasY };
            await hoverAction(point.x, point.y)(chart);
            await waitForChartStability(chart);
            return point;
        };

        interface SnapCase {
            options: AgCartesianChartOptions;
            hover: [x: unknown, y: unknown];
            offsetX?: number;
            axis?: string;
            expected: Record<string, unknown> | 'pointer';
            cross?: Record<string, unknown>;
        }

        const SNAP_CASES: Record<string, SnapCase> = {
            'box-plot ["median"] draws one line at the median': {
                options: boxOptions([boxPlot({ crosshairSnapTo: ['median'] })]),
                hover: ['B', 55],
                expected: { medianKey: 45 },
            },
            'candlestick ["close"] draws one line at the close': {
                options: candleOptions([candlestick({ crosshairSnapTo: ['close'] })]),
                hover: [CANDLES[1].date, 120],
                expected: { closeKey: 105 },
            },
            'box-plot ["q1", "q3"] draws a line and a label for each': {
                options: boxOptions([boxPlot({ crosshairSnapTo: ['q1', 'q3'] })]),
                hover: ['B', 55],
                expected: { q1Key: 35, q3Key: 65 },
            },
            'ignores the order of the list': {
                options: candleOptions([candlestick({ crosshairSnapTo: ['open', 'close'] })]),
                hover: [CANDLES[1].date, 120],
                expected: { openKey: 110, closeKey: 105 },
            },
            'ignores duplicates in the list': {
                options: candleOptions([candlestick({ crosshairSnapTo: ['close', 'close', 'open'] })]),
                hover: [CANDLES[1].date, 120],
                expected: { openKey: 110, closeKey: 105 },
            },
            'snaps with highlight disabled on the series': {
                options: boxOptions([boxPlot({ crosshairSnapTo: ['median'], highlight: { enabled: false } })]),
                hover: ['B', 55],
                expected: { medianKey: 45 },
            },
            'applies a theme override of crosshairSnapTo': {
                options: {
                    ...boxOptions([boxPlot()]),
                    theme: { overrides: { 'box-plot': { series: { crosshairSnapTo: ['median'] } } } },
                },
                hover: ['B', 55],
                expected: { medianKey: 45 },
            },
            'replaces the range-bar default with a user list': {
                options: rangeOptions([rangeBar({ crosshairSnapTo: ['yLow'] })]),
                hover: ['B', 55],
                expected: { yLowKey: 30 },
            },
            'replaces the range-bar default with an empty list': {
                options: rangeOptions([rangeBar({ crosshairSnapTo: [] })]),
                hover: ['B', 55],
                expected: 'pointer',
            },
            'omits the line of a listed value outside the axis range and draws the others': {
                options: boxOptions([boxPlot({ crosshairSnapTo: ['median', 'q3'] })], {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 60 },
                }),
                hover: ['A', 40],
                expected: { medianKey: 50 },
            },
            'draws a line per value for axis snap true without a list on a box-plot': {
                options: boxOptions([boxPlot()], valueAxis({ snap: true })),
                hover: ['B', 55],
                expected: { minKey: 20, q1Key: 35, medianKey: 45, q3Key: 65, maxKey: 95 },
            },
            'draws a line per value for axis snap true without a list on a candlestick': {
                options: candleOptions([candlestick()], { y: { type: 'number', crosshair: { snap: true } } }),
                hover: [CANDLES[1].date, 120],
                expected: { openKey: 110, highKey: 140, lowKey: 95, closeKey: 105 },
            },
            'draws a line per value for axis snap true without a list on an ohlc': {
                options: candleOptions([ohlc()], { y: { type: 'number', crosshair: { snap: true } } }),
                hover: [CANDLES[1].date, 120],
                expected: { openKey: 110, highKey: 140, lowKey: 95, closeKey: 105 },
            },
            'draws a line per value for axis snap true without a list on an hlc': {
                options: candleOptions([hlc()], { y: { type: 'number', crosshair: { snap: true } } }),
                hover: [CANDLES[1].date, 120],
                expected: { highKey: 140, lowKey: 95, closeKey: 105 },
            },
            'draws a line per value for axis snap true and nearest mode without a list': {
                options: candleOptions([candlestick({ crosshairSnapMode: 'nearest' })], {
                    y: { type: 'number', crosshair: { snap: true } },
                }),
                hover: [CANDLES[1].date, 120],
                expected: { openKey: 110, highKey: 140, lowKey: 95, closeKey: 105 },
            },
            'follows the pointer for axis snap false whatever the list': {
                options: candleOptions([candlestick({ crosshairSnapTo: ['close'] })], {
                    y: { type: 'number', crosshair: { snap: false } },
                }),
                hover: [CANDLES[1].date, 120],
                expected: 'pointer',
                cross: { xKey: CANDLES[1].date },
            },
            'follows the pointer for an empty list': {
                options: candleOptions([candlestick({ crosshairSnapTo: [] })]),
                hover: [CANDLES[1].date, 120],
                expected: 'pointer',
                cross: { xKey: CANDLES[1].date },
            },
            'follows the pointer for crosshairSnapMode without a list': {
                options: candleOptions([candlestick({ crosshairSnapMode: 'nearest' })]),
                hover: [CANDLES[1].date, 120],
                expected: 'pointer',
                cross: { xKey: CANDLES[1].date },
            },
            'follows the pointer on a box-plot with no options': {
                options: boxOptions([boxPlot()], categoryCrosshair),
                hover: ['B', 55],
                expected: 'pointer',
                cross: { xKey: 'B' },
            },
            'follows the pointer on a candlestick with no options': {
                options: candleOptions([candlestick()]),
                hover: [CANDLES[1].date, 120],
                expected: 'pointer',
                cross: { xKey: CANDLES[1].date },
            },
            'follows the pointer on an ohlc with no options': {
                options: candleOptions([ohlc()]),
                hover: [CANDLES[1].date, 120],
                expected: 'pointer',
                cross: { xKey: CANDLES[1].date },
            },
            'follows the pointer on an hlc with no options': {
                options: candleOptions([hlc()]),
                hover: [CANDLES[1].date, 120],
                expected: 'pointer',
                cross: { xKey: CANDLES[1].date },
            },
            'follows the pointer on a candlestick with a log value axis and no list': {
                options: candleOptions([candlestick()], { y: { type: 'log' } }),
                hover: [CANDLES[1].date, 120],
                expected: 'pointer',
                cross: { xKey: CANDLES[1].date },
            },
            'snaps a line series to the hovered datum with no options': {
                options: {
                    data: [
                        { x: 'A', y: 20 },
                        { x: 'B', y: 30 },
                        { x: 'C', y: 25 },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
                hover: ['B', 30],
                expected: { yKey: 30 },
            },
            'snaps to the low and high of a range-bar with no options': {
                options: rangeOptions([rangeBar()]),
                hover: ['B', 55],
                expected: { yLowKey: 30, yHighKey: 80 },
            },
            'snaps to the low and high of a range-area with no options': {
                options: rangeOptions([rangeArea()]),
                hover: ['B', 55],
                expected: { yLowKey: 30, yHighKey: 80 },
            },
            'applies the list of a horizontal box-plot to the x axis': {
                options: boxOptions(
                    [boxPlot({ direction: 'horizontal', crosshairSnapTo: ['median'] })],
                    horizontalAxes
                ),
                hover: [55, 'B'],
                axis: 'bottom',
                expected: { medianKey: 45 },
            },
            'applies the default of a horizontal range-bar to the x axis': {
                options: rangeOptions([rangeBar({ direction: 'horizontal' })], horizontalAxes),
                hover: [55, 'B'],
                axis: 'bottom',
                expected: { yLowKey: 30, yHighKey: 80 },
            },
            'keeps following the pointer on the category axis of a box-plot': {
                options: boxOptions([boxPlot({ crosshairSnapTo: ['median'] })], {
                    x: { type: 'category', position: 'bottom', crosshair: { enabled: true } },
                    y: { type: 'number', position: 'left' },
                }),
                hover: ['B', 55],
                offsetX: 12,
                axis: 'bottom',
                expected: 'pointer',
            },
            'keeps snapping on the x axis of a candlestick': {
                options: candleOptions([candlestick({ crosshairSnapTo: ['close'] })]),
                hover: [CANDLES[1].date, 120],
                offsetX: 6,
                axis: 'bottom',
                expected: { xKey: CANDLES[1].date },
            },
        };

        it.each(Object.entries(SNAP_CASES))(
            '%s',
            async (_name, { options, hover, offsetX, axis = 'left', expected, cross }) => {
                chart = await createEnterpriseChart(options);
                const point = await hoverDatum(hover[0], hover[1], offsetX);

                if (expected === 'pointer') {
                    expectFollowsPointer(axis, point);
                } else {
                    expectLines(axis, expected);
                }
                if (cross != null) {
                    expectLines('bottom', cross);
                }
            }
        );

        describe('with nothing highlighted', () => {
            it('hides the crosshair in a gap of a bar series', async () => {
                chart = await createEnterpriseChart(rangeOptions([{ type: 'bar', xKey: 'x', yKey: 'hi' }]));
                await hoverDatum('A', 75);
                expect(lineKeys('left')).toEqual([]);
            });

            it('follows the pointer on a box-plot without a list', async () => {
                chart = await createEnterpriseChart(boxOptions([boxPlot()]));
                const point = await hoverDatum('B', 10);
                expectFollowsPointer('left', point);
            });
        });

        describe('crosshairSnapMode nearest', () => {
            const ALL_VALUES = { openKey: 110, highKey: 140, lowKey: 95, closeKey: 105 };
            const nearestOptions = candleOptions([
                candlestick({ crosshairSnapTo: ['open', 'high', 'low', 'close'], crosshairSnapMode: 'nearest' }),
            ]);

            it('draws one line at the value nearest the pointer', async () => {
                chart = await createEnterpriseChart(nearestOptions);

                await hoverDatum(CANDLES[1].date, 138);
                expectLines('left', { highKey: ALL_VALUES.highKey });

                await hoverDatum(CANDLES[1].date, 97);
                expectLines('left', { lowKey: ALL_VALUES.lowKey });
            });

            it('draws every listed value for a datum highlighted by keyboard', async () => {
                chart = await createEnterpriseChart(nearestOptions);

                await tabIntoChart(chart);
                await pressKey(chart, 'ArrowRight');

                expect(lineKeys('left').toSorted(byName)).toEqual(Object.keys(ALL_VALUES).toSorted(byName));
            });

            it('draws every listed value when the keyboard moves on from a hover', async () => {
                chart = await createEnterpriseChart(nearestOptions);

                await hoverDatum(CANDLES[1].date, 138);
                expect(lineKeys('left')).toEqual(['highKey']);

                await pressKey(chart, 'ArrowRight');
                expect(lineKeys('left').toSorted(byName)).toEqual(Object.keys(ALL_VALUES).toSorted(byName));
            });
        });

        describe('several series on one axis', () => {
            const SECOND_BOX_DATA = [
                { x: 'D', min: 12, q1: 32, median: 52, q3: 72, max: 92 },
                { x: 'E', min: 22, q1: 37, median: 47, q3: 67, max: 97 },
            ];
            const twoSeries = (first: Partial<AgBoxPlotSeriesOptions>, second: Partial<AgBoxPlotSeriesOptions>) =>
                createEnterpriseChart({
                    series: [
                        { ...boxPlot(first), data: BOX_DATA },
                        { ...boxPlot(second), data: SECOND_BOX_DATA },
                    ],
                    axes: valueAxis({}),
                });

            it('follows the pointer over a series with an empty list while another one keeps snapping', async () => {
                chart = await twoSeries({ crosshairSnapTo: [] }, { crosshairSnapTo: ['median'] });

                const pointer = await hoverDatum('B', 55, -20);
                expectFollowsPointer('left', pointer);

                await hoverDatum('D', 55, 20);
                expectLines('left', { medianKey: 52 });

                const back = await hoverDatum('B', 55, -20);
                expectFollowsPointer('left', back);
            });

            it('applies the list of the highlighted series', async () => {
                chart = await twoSeries({ crosshairSnapTo: ['q1'] }, { crosshairSnapTo: ['q3'] });

                await hoverDatum('B', 55, -20);
                expectLines('left', { q1Key: 35 });

                await hoverDatum('D', 55, 20);
                expectLines('left', { q3Key: 72 });
            });
        });

        describe('aggregated data', () => {
            it('snaps to the aggregated values of a range-bar', async () => {
                chart = await createEnterpriseChart({
                    data: Array.from({ length: HIGH_VOLUME_COUNT }, (_row, i) => ({
                        x: i + 1,
                        lo: Math.sin(i / 10) - 1,
                        hi: Math.sin(i / 10) + 1,
                    })),
                    series: [rangeBar({ xKey: 'x', strokeWidth: 0 })],
                    axes: STRIPPED_NUMBER_AXES as AgCartesianChartOptions['axes'],
                });

                const nodes = getSeriesNodeData<RangeBarNode>(chart);
                expect(nodes.length).toBeLessThan(HIGH_VOLUME_COUNT / 2);

                const yAxis = findAxis(chart, 'left');
                const aggregated = nodes.find(
                    (node) => Math.abs(yAxis.scale.convert(node.yHighValue) - node.y) > 3 && node.height > 10
                );
                expect(aggregated, 'a bar whose row differs from its bucket').toBeDefined();

                const { x, y } = getSeriesRect(chart);
                await hoverAction(
                    x + aggregated!.x + aggregated!.width / 2,
                    y + aggregated!.y + aggregated!.height / 2
                )(chart);
                await waitForChartStability(chart);

                const [high] = getCrosshairLines(chart, 'left').filter(({ key }) => key === 'yHighKey');
                expect(getCrosshairLines(chart, 'left')).toHaveLength(2);
                expect(visibleLabelCount('left')).toBe(2);
                expect(Math.abs(high.position - aggregated!.y)).toBeLessThan(1);
                expect(Math.abs(high.position - yAxis.scale.convert(aggregated!.yHighValue))).toBeGreaterThan(3);
            });

            it('snaps to the aggregated high of a candlestick', async () => {
                chart = await createEnterpriseChart({
                    data: Array.from({ length: HIGH_VOLUME_COUNT }, (_row, i) => {
                        const base = Math.sin(i / 10);
                        return {
                            date: i + 1,
                            open: base - 0.2,
                            close: base + 0.2,
                            high: base + 0.5 + 0.5 * ((i * 7) % 11),
                            low: base - 0.5,
                        };
                    }),
                    series: [candlestick({ xKey: 'date', crosshairSnapTo: ['high'] })],
                    axes: STRIPPED_NUMBER_AXES as AgCartesianChartOptions['axes'],
                });

                const nodes = getSeriesNodeData<CandlestickNode>(chart);
                expect(nodes.length).toBeLessThan(HIGH_VOLUME_COUNT / 2);

                const yAxis = findAxis(chart, 'left');
                const aggregated = nodes.find(
                    (node) => Math.abs(yAxis.scale.convert(node.datum.high) - node.y) > 3 && node.height > 10
                );
                expect(aggregated, 'a candle whose midpoint row differs from its bucket').toBeDefined();

                const { x, y } = getSeriesRect(chart);
                await hoverAction(x + aggregated!.centerX, y + aggregated!.y + aggregated!.height / 2)(chart);
                await waitForChartStability(chart);

                const lines = getCrosshairLines(chart, 'left');
                expect(lines.map(({ key }) => key)).toEqual(['highKey']);
                expect(visibleLabelCount('left')).toBe(1);
                expect(Math.abs(lines[0].position - yAxis.scale.convert(aggregated!.highValue))).toBeLessThan(1);
                expect(Math.abs(lines[0].position - yAxis.scale.convert(aggregated!.datum.high))).toBeGreaterThan(3);
            });
        });

        describe('validation', () => {
            it('warns about a value name the series does not have and applies the valid ones', async () => {
                chart = await createEnterpriseChart(
                    boxOptions([boxPlot({ crosshairSnapTo: ['median', 'foo' as AgBoxPlotCrosshairSnapValue] })])
                );
                expectWarningsCalls().toMatchInlineSnapshot(`
                  [
                    [
                      "AG Charts - Option \`series[0].crosshairSnapTo[1]\` cannot be set to \`"foo"\`; expecting one of ["min", "q1", "median", "q3", "max"], ignoring.",
                    ],
                  ]
                `);

                await hoverDatum('B', 55);
                expectLines('left', { medianKey: 45 });
            });

            it('falls back to the range-bar default when no value name is valid', async () => {
                chart = await createEnterpriseChart(
                    rangeOptions([rangeBar({ crosshairSnapTo: ['foo' as AgRangeBarCrosshairSnapValue] })])
                );
                expectWarningsCalls().toMatchInlineSnapshot(`
                  [
                    [
                      "AG Charts - Option \`series[0].crosshairSnapTo[0]\` cannot be set to \`"foo"\`; expecting one of ["yLow", "yHigh"], ignoring.",
                    ],
                    [
                      "AG Charts - Option \`series[0].crosshairSnapTo\` cannot be set to \`["foo"]\`; expecting an array of crosshair snap values: ["yLow", "yHigh"], ignoring.",
                    ],
                  ]
                `);

                await hoverDatum('B', 55);
                expectLines('left', { yLowKey: 30, yHighKey: 80 });
            });
        });

        describe('snapInterval', () => {
            const ROUNDED = [
                { x: 'A', y: 112 },
                { x: 'B', y: 137 },
                { x: 'C', y: 88 },
            ];
            const roundedLine = (
                crosshair: AgNumericAxisCrosshairOptions,
                type: 'number' | 'log' = 'number'
            ): AgCartesianChartOptions => ({
                data: ROUNDED,
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: { x: { type: 'category', position: 'bottom' }, y: { type, position: 'left', crosshair } },
            });
            const candleAxes = (crosshair: AgNumericAxisCrosshairOptions): AgCartesianAxesOptions => ({
                x: { type: 'time', position: 'bottom' },
                y: { type: 'number', position: 'left', crosshair },
            });
            const expectLineAt = (axis: string, value: unknown) => {
                const lines = getCrosshairLines(chart, axis);
                expect(lines).toHaveLength(1);
                expect(lines[0].position).toBeCloseTo(axisPositionOf(axis, value), 0);
                expect(visibleLabelCount(axis)).toBe(1);
            };

            it.each(['number', 'log'] as const)(
                'rounds a highlighted datum on a %s axis with no snap setting',
                async (type) => {
                    chart = await createEnterpriseChart(roundedLine({ snapInterval: 25 }, type));
                    await hoverDatum('B', 137);
                    expectLineAt('left', 125);
                }
            );

            it.each<[string, boolean | undefined]>([
                ['no snap setting', undefined],
                ['snap true', true],
            ])('rounds the crosshairSnapTo close of a candle with %s', async (_name, snap) => {
                chart = await createEnterpriseChart(
                    candleOptions([candlestick({ crosshairSnapTo: ['close'] })], candleAxes({ snap, snapInterval: 25 }))
                );
                await hoverDatum(CANDLES[1].date, 120);
                expectLineAt('left', 100);
            });

            it('rounds the pointer over an empty area', async () => {
                chart = await createEnterpriseChart(
                    rangeOptions([{ type: 'bar', xKey: 'x', yKey: 'hi' }], valueAxis({ snapInterval: 0.25 }))
                );
                await hoverDatum('A', 75.1);
                expectLineAt('left', 75);
            });

            it('applies a snapInterval set for the axis type in a theme', async () => {
                chart = await createEnterpriseChart({
                    ...roundedLine({}),
                    theme: { overrides: { common: { axes: { number: { crosshair: { snapInterval: 25 } } } } } },
                });
                await hoverDatum('B', 137);
                expectLineAt('left', 125);
            });

            it('follows the pointer without rounding with snap false', async () => {
                chart = await createEnterpriseChart(roundedLine({ snap: false, snapInterval: 25 }));
                const point = await hoverDatum('B', 137);
                expectFollowsPointer('left', point);
            });

            it('snaps a multi-value candle with snap true and no list to every value', async () => {
                chart = await createEnterpriseChart(candleOptions([candlestick()], candleAxes({ snap: true })));
                await hoverDatum(CANDLES[1].date, 120);
                expectLines('left', { openKey: 110, highKey: 140, lowKey: 95, closeKey: 105 });
            });

            it.each<[string, AgTimeAxisCrosshairOptions['snapInterval'], Date, Date]>([
                ['a unit', 'day', new Date(2024, 0, 2, 10, 8), new Date(2024, 0, 2)],
                [
                    'an interval object',
                    { unit: 'minute', step: 15 },
                    new Date(2024, 0, 2, 10, 8),
                    new Date(2024, 0, 2, 10, 15),
                ],
                ['milliseconds', 15 * 60 * 1000, new Date(2024, 0, 2, 10, 7), new Date(2024, 0, 2, 10, 0)],
                [
                    'an interval aligned to an epoch',
                    { unit: 'hour', step: 6, epoch: new Date(2024, 0, 1, 3) },
                    new Date(2024, 0, 2, 10, 7),
                    new Date(2024, 0, 2, 9),
                ],
            ])('rounds a time axis to %s', async (_name, snapInterval, date, expected) => {
                chart = await createEnterpriseChart({
                    data: [
                        { date: new Date(2024, 0, 1, 9, 31), value: 5 },
                        { date, value: 8 },
                        { date: new Date(2024, 0, 3, 13, 52), value: 3 },
                    ],
                    series: [{ type: 'line', xKey: 'date', yKey: 'value' }],
                    axes: {
                        x: { type: 'time', position: 'bottom', crosshair: { snapInterval } },
                        y: { type: 'number', position: 'left' },
                    },
                });
                await hoverDatum(date, 8);
                expectLineAt('bottom', expected);
            });

            it('draws one line for values that round to the same tick', async () => {
                chart = await createEnterpriseChart(
                    candleOptions([candlestick()], candleAxes({ snap: true, snapInterval: 15 }))
                );
                await hoverDatum(CANDLES[1].date, 120);
                const byPosition = (a: number, b: number) => a - b;
                const positions = getCrosshairLines(chart, 'left').map(({ position }) => position);
                expect(positions.toSorted(byPosition)).toEqual(
                    [90, 105, 135].map((value) => axisPositionOf('left', value)).toSorted(byPosition)
                );
                expect(visibleLabelCount('left')).toBe(3);
            });

            it('formats the rounded value with the axis crosshair label format', async () => {
                chart = await createEnterpriseChart(roundedLine({ snapInterval: 25, label: { format: '#{.1f}' } }));
                await hoverDatum('B', 137);
                const label = document.querySelector(
                    `.ag-charts-crosshair-label[data-axis-id="${findAxis(chart, 'left').id}"]:not(.ag-charts-crosshair-label--hidden)`
                );
                expect(label?.textContent?.trim()).toBe('125.0');
            });

            it('leaves snap unset by default', async () => {
                chart = await createEnterpriseChart(candleOptions([candlestick()]));
                const { axes } = deproxy(chart).chartOptions.processedOptions as {
                    axes: Record<string, { crosshair?: { snap?: boolean } }>;
                };
                expect(axes.y.crosshair?.snap).toBeUndefined();
                expect(axes.x.crosshair?.snap).toBeUndefined();
            });

            describe('validation', () => {
                it.each<[string, AgCartesianChartOptions]>([
                    ['a number on a number axis', roundedLine({ snapInterval: 0.25 })],
                    [
                        'a unit on a time axis',
                        candleOptions([candlestick()], {
                            ...candleAxes({}),
                            x: { type: 'time', position: 'bottom', crosshair: { snapInterval: 'day' } },
                        }),
                    ],
                ])('accepts %s without a warning', async (_name, options) => {
                    chart = await createEnterpriseChart(options);
                    expectWarningsCalls().toEqual([]);
                });

                it.each<[string, unknown, string]>([
                    ['zero', 0, '`0`'],
                    ['a negative step', -1, '`-1`'],
                    ['a unit', 'day', '`"day"`'],
                    ['an interval object', { unit: 'day' }, '`{"unit":"day"}`'],
                ])('warns about %s on a number axis and ignores it', async (_name, snapInterval, shown) => {
                    chart = await createEnterpriseChart(roundedLine({ snapInterval } as AgNumericAxisCrosshairOptions));
                    expectWarningsCalls().toEqual([
                        [
                            `AG Charts - Option \`axes.y.crosshair.snapInterval\` cannot be set to ${shown}; expecting a number greater than 0, ignoring.`,
                        ],
                    ]);
                    await hoverDatum('B', 137);
                    expectLineAt('left', 137);
                });

                it('warns about the option on a category axis', async () => {
                    chart = await createEnterpriseChart({
                        ...roundedLine({}),
                        axes: {
                            x: {
                                type: 'category',
                                position: 'bottom',
                                crosshair: { snapInterval: 1 } as AgCrosshairOptions,
                            },
                            y: { type: 'number', position: 'left' },
                        },
                    });
                    expectWarningsCalls().toEqual([[expect.stringContaining('Unknown option')]]);
                });
            });
        });
    });
});
