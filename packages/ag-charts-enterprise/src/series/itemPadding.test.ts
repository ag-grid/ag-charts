import { afterEach, describe, expect, it } from 'vitest';

import type {
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgChartLabelCollisionPlacement,
    AgChartOptions,
} from 'ag-charts-community';
import {
    type ChartOrProxy,
    compareImageSnapshot,
    expectWarningsCalls,
    getSeriesOptions,
    setupMockCanvas,
    setupMockConsole,
} from 'ag-charts-community-test';
import { type Node, Shape, Text, Transformable } from 'ag-charts-core';

import { getSeriesGroup, getSeriesInstance } from '../test/enterpriseSeriesAccessors';
import { createEnterpriseChart } from '../test/utils';
import { HeatmapCellBatch } from './heatmap/heatmapCellBatch';
import { HeatmapSeries } from './heatmap/heatmapSeries';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';

/** Where a series reads the distance its labels keep from the edge of the item they sit in. */
type PaddingOption = (padding: number) => Record<string, unknown>;

const itemPadding: PaddingOption = (padding) => ({ itemPadding: padding });

interface ItemPaddingCase {
    readonly name: string;
    /** The chart, with `padding` set through `paddingOption` when given. */
    readonly options: (padding?: Record<string, unknown>) => AgChartOptions;
    readonly paddingOption: PaddingOption;
    /** Reads the padding the series resolved, defaulted or set. */
    readonly resolvedPadding: (options: Record<string, any>) => unknown;
    /** The item shapes, for a series that does not draw each item as its own shape node. */
    readonly items?: (chart: ChartOrProxy) => Item[];
}

/** An item as drawn, in canvas coordinates. */
interface Item {
    readonly contains: (x: number, y: number) => boolean;
    readonly area: number;
}

// Every label draws a box, so the distance is measured to what is drawn rather than to the glyphs.
const BOXED = { fill: '#ffffffcc', padding: 2 };
// The labels are long enough to fill their items, so the fit is what keeps them clear of the edges.
const FITTED = { ...BOXED, wrapping: 'on-space', minimumFontSize: 6 } as const;
const LONG_TEXT = 'Revenue grew strongly across every region this quarter';

const cartesian = (series: AgCartesianSeriesOptions, data: object[]): AgCartesianChartOptions => ({
    data,
    legend: { enabled: false },
    width: 400,
    height: 300,
    series: [series],
});

const barData = [
    { x: 'Q1', y: 60, low: 10, high: 70 },
    { x: 'Q2', y: 85, low: 20, high: 95 },
    { x: 'Q3', y: 40, low: 15, high: 55 },
];
const markerData = [
    { x: 1, y: 20, size: 30, name: 'North' },
    { x: 2, y: 45, size: 50, name: 'South' },
    { x: 3, y: 30, size: 40, name: 'East' },
];
const INSIDE: AgChartLabelCollisionPlacement = 'inside';
const markerLabel = { ...FITTED, enabled: true, placement: INSIDE, formatter: () => 'Growth figure' };
const stageData = [
    { stage: 'Visited', value: 1200 },
    { stage: 'Signed up', value: 800 },
    { stage: 'Purchased', value: 300 },
];
const hierarchy = [
    {
        name: 'Technology and communication services',
        children: [
            { name: 'Semiconductors and equipment makers', size: 40 },
            { name: 'Software and cloud platform providers', size: 30 },
        ],
    },
    { name: 'Healthcare providers and services', children: [{ name: 'Pharmaceutical research', size: 30 }] },
];

const TREEMAP_TILE = { label: { ...BOXED, minimumFontSize: 6 } };

const CASES: ItemPaddingCase[] = [
    {
        name: 'bar',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) =>
            cartesian(
                { type: 'bar', xKey: 'x', yKey: 'y', label: { ...FITTED, formatter: () => LONG_TEXT }, ...padding },
                barData
            ),
    },
    {
        name: 'histogram',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) =>
            cartesian(
                { type: 'histogram', xKey: 'x', label: { ...FITTED, formatter: () => LONG_TEXT }, ...padding },
                [1, 2, 2, 3, 3, 3, 4, 4, 5].map((x) => ({ x }))
            ),
    },
    {
        name: 'waterfall',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) =>
            cartesian(
                {
                    type: 'waterfall',
                    xKey: 'x',
                    yKey: 'y',
                    item: {
                        positive: { label: { ...FITTED, placement: 'inside-center', formatter: () => LONG_TEXT } },
                    },
                    ...padding,
                },
                barData
            ),
    },
    {
        name: 'range-bar',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) =>
            cartesian(
                {
                    type: 'range-bar',
                    xKey: 'x',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: { ...FITTED, formatter: () => LONG_TEXT },
                    ...padding,
                },
                barData
            ),
    },
    {
        name: 'funnel',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) => ({
            data: stageData,
            width: 400,
            height: 300,
            series: [
                {
                    type: 'funnel',
                    stageKey: 'stage',
                    valueKey: 'value',
                    stageLabel: { enabled: false },
                    label: { ...FITTED, formatter: () => LONG_TEXT },
                    ...padding,
                },
            ],
        }),
    },
    {
        name: 'pyramid',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) => ({
            data: stageData,
            width: 400,
            height: 300,
            series: [
                {
                    type: 'pyramid',
                    stageKey: 'stage',
                    valueKey: 'value',
                    stageLabel: { enabled: false },
                    label: { ...FITTED, formatter: () => LONG_TEXT },
                    ...padding,
                },
            ],
        }),
    },
    {
        name: 'heatmap',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) =>
            cartesian(
                {
                    type: 'heatmap',
                    xKey: 'x',
                    yKey: 'row',
                    colorKey: 'y',
                    label: { ...FITTED, enabled: true, formatter: () => LONG_TEXT },
                    ...padding,
                },
                barData.flatMap((d) => [
                    { ...d, row: 'North' },
                    { ...d, row: 'South' },
                ])
            ),
        items: heatmapCells,
    },
    {
        name: 'pie',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) => ({
            data: stageData,
            width: 400,
            height: 300,
            legend: { enabled: false },
            series: [
                {
                    type: 'pie',
                    angleKey: 'value',
                    legendItemKey: 'stage',
                    sectorLabelKey: 'stage',
                    calloutLabel: { enabled: false },
                    sectorLabel: { ...FITTED, formatter: () => LONG_TEXT },
                    ...padding,
                },
            ],
        }),
    },
    {
        // A lone sector centres its label in the square inscribed in the pie.
        name: 'pie with one sector',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) => ({
            data: stageData.slice(0, 1),
            width: 400,
            height: 300,
            legend: { enabled: false },
            series: [
                {
                    type: 'pie',
                    angleKey: 'value',
                    legendItemKey: 'stage',
                    sectorLabelKey: 'stage',
                    calloutLabel: { enabled: false },
                    sectorLabel: { ...FITTED, fontSize: 40, formatter: () => LONG_TEXT },
                    ...padding,
                },
            ],
        }),
    },
    {
        name: 'donut',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) => ({
            data: stageData,
            width: 400,
            height: 300,
            legend: { enabled: false },
            series: [
                {
                    type: 'donut',
                    angleKey: 'value',
                    legendItemKey: 'stage',
                    sectorLabelKey: 'stage',
                    calloutLabel: { enabled: false },
                    sectorLabel: { ...FITTED, formatter: () => LONG_TEXT },
                    ...padding,
                },
            ],
        }),
    },
    {
        name: 'sunburst',
        paddingOption: (padding) => ({ padding }),
        resolvedPadding: (o) => o.padding,
        options: (padding) => ({
            data: hierarchy,
            width: 400,
            height: 400,
            series: [
                {
                    type: 'sunburst',
                    labelKey: 'name',
                    sizeKey: 'size',
                    label: { ...BOXED, minimumFontSize: 6 },
                    ...padding,
                },
            ],
        }),
    },
    {
        name: 'treemap',
        paddingOption: (padding) => ({ tile: { ...TREEMAP_TILE, padding } }),
        resolvedPadding: (o) => o.tile.padding,
        options: (padding) => ({
            data: hierarchy,
            width: 400,
            height: 300,
            series: [
                {
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'size',
                    group: { label: { enabled: false } },
                    tile: TREEMAP_TILE,
                    ...padding,
                },
            ],
        }),
    },
    {
        name: 'map-shape',
        paddingOption: (padding) => ({ padding }),
        resolvedPadding: (o) => o.padding,
        options: (padding) => ({
            data: ukData,
            topology: ukTopology,
            width: 400,
            height: 400,
            series: [{ type: 'map-shape', idKey: 'name', labelKey: 'name', label: { ...BOXED }, ...padding }],
        }),
    },
    {
        name: 'scatter',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) =>
            cartesian(
                { type: 'scatter', xKey: 'x', yKey: 'y', labelKey: 'name', size: 60, label: markerLabel, ...padding },
                markerData
            ),
    },
    {
        name: 'bubble',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) =>
            cartesian(
                {
                    type: 'bubble',
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    labelKey: 'name',
                    minSize: 40,
                    maxSize: 70,
                    label: markerLabel,
                    ...padding,
                },
                markerData
            ),
    },
    {
        name: 'line',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) =>
            cartesian(
                { type: 'line', xKey: 'x', yKey: 'y', marker: { size: 60 }, label: markerLabel, ...padding },
                markerData
            ),
    },
    {
        name: 'area',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) =>
            cartesian(
                {
                    type: 'area',
                    xKey: 'x',
                    yKey: 'y',
                    marker: { enabled: true, size: 60 },
                    label: markerLabel,
                    ...padding,
                },
                markerData
            ),
    },
    {
        name: 'map-marker',
        paddingOption: itemPadding,
        resolvedPadding: (o) => o.itemPadding,
        options: (padding) => ({
            data: [
                { name: 'London', lat: 51.5, lon: -0.12 },
                { name: 'Edinburgh', lat: 55.95, lon: -3.19 },
            ],
            width: 400,
            height: 400,
            series: [
                {
                    type: 'map-marker',
                    latitudeKey: 'lat',
                    longitudeKey: 'lon',
                    labelKey: 'name',
                    size: 70,
                    // Map markers shrink no font, so they wrap and truncate to fit.
                    label: { ...BOXED, enabled: true, placement: 'inside', formatter: () => 'Growth figure' },
                    ...padding,
                },
            ],
        }),
    },
];

function isDrawn(node: Node): boolean {
    for (const n of [node, ...node.traverseUp()]) {
        if (!n.visible) return false;
    }
    return true;
}

function shapeItems(chart: ChartOrProxy): Item[] {
    const items: Item[] = [];
    for (const node of getSeriesGroup(chart, 'contentGroup').descendants()) {
        if (!(node instanceof Shape) || node instanceof Text || !isDrawn(node)) continue;
        const { width, height } = Transformable.toCanvas(node);
        items.push({
            area: width * height,
            contains: (canvasX, canvasY) => {
                const { x, y } = Transformable.fromCanvasPoint(node, { canvasX, canvasY });
                return node.isPointInPath(x, y);
            },
        });
    }
    return items;
}

// A plain heatmap paints its cells from one batched node rather than a node per cell.
function heatmapCells(chart: ChartOrProxy): Item[] {
    const series = getSeriesInstance(chart, HeatmapSeries);
    const batch = Array.from(series.contentGroup.descendants()).find(
        (node): node is HeatmapCellBatch => node instanceof HeatmapCellBatch && node.visible
    );
    if (batch == null) return shapeItems(chart);
    const items: Item[] = [];
    for (let index = 0; index < batch.size; index++) {
        const { x, y, width, height } = batch.readCell(index);
        const { canvasX: left, canvasY: top } = Transformable.toCanvasPoint(batch, x, y);
        items.push({
            area: width * height,
            contains: (px, py) => px >= left && px <= left + width && py >= top && py <= top + height,
        });
    }
    return items;
}

/** The labels a series drew, each as the drawn box around it in its own frame and how to take that to the canvas. */
function drawnLabels(chart: ChartOrProxy): Text[] {
    const labels: Text[] = [];
    for (const group of [getSeriesGroup(chart, 'labelGroup'), getSeriesGroup(chart, 'contentGroup')]) {
        for (const node of group.descendants()) {
            if (node instanceof Text && isDrawn(node) && node.text !== '' && node.text != null) labels.push(node);
        }
    }
    return labels;
}

/** Points around `label`'s drawn box grown by `grow`, in canvas coordinates. */
function boxOutline(label: Text, grow: number) {
    const { x, y, width, height } = label.getTextMeasureBBox();
    const left = x - grow;
    const top = y - grow;
    const right = x + width + grow;
    const bottom = y + height + grow;
    const steps = 8;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        for (const [px, py] of [
            [left + (right - left) * t, top],
            [left + (right - left) * t, bottom],
            [left, top + (bottom - top) * t],
            [right, top + (bottom - top) * t],
        ]) {
            const { canvasX, canvasY } = Transformable.toCanvasPoint(label, px, py);
            points.push({ x: canvasX, y: canvasY });
        }
    }
    const centre = Transformable.toCanvasPoint(label, x + width / 2, y + height / 2);
    return { points, centre: { x: centre.canvasX, y: centre.canvasY } };
}

/** The labels drawn closer than `padding` to the edge of the item they sit in. */
function labelsTooCloseToTheirItem(chart: ChartOrProxy, items: Item[], padding: number) {
    // Shapes are drawn on whole or half pixels, so the edge a label is measured to can be up to a pixel out.
    const tolerance = 1;
    const offenders: string[] = [];
    for (const label of drawnLabels(chart)) {
        const { points, centre } = boxOutline(label, Math.max(0, padding - tolerance));
        const owner = items
            .filter((item) => item.contains(centre.x, centre.y))
            .sort((a, b) => a.area - b.area)
            .at(0);
        if (owner == null || points.some((point) => !owner.contains(point.x, point.y))) {
            offenders.push(String(label.text));
        }
    }
    return offenders;
}

/**
 * How much room the labels took: the text drawn, weighted by size, which shrinking, truncating and hiding reduce,
 * and the summed width of the drawn boxes, which wrapping to a narrower room reduces.
 */
function drawnLabelFootprint(chart: ChartOrProxy) {
    let mass = 0;
    let width = 0;
    for (const label of drawnLabels(chart)) {
        mass += String(label.text).replace(/\s|…/g, '').length * label.fontSize;
        width += label.getTextMeasureBBox().width;
    }
    return { mass, width };
}

describe('itemPadding', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: ChartOrProxy | undefined;
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const render = async (options: AgChartOptions) => {
        chart?.destroy();
        chart = await createEnterpriseChart(options);
        return chart;
    };

    describe.each(CASES)('$name', (c) => {
        const itemsOf = (target: ChartOrProxy) => (c.items ?? shapeItems)(target);

        it('defaults to 2', async () => {
            await render(c.options());
            expect(c.resolvedPadding(getSeriesOptions(chart!))).toBe(2);
        });

        it.each([0, 2, 6])('keeps every label inside its item at least %ipx from its edge', async (padding) => {
            await render(c.options(c.paddingOption(padding)));
            expect(drawnLabels(chart!).length).toBeGreaterThan(0);
            expect(labelsTooCloseToTheirItem(chart!, itemsOf(chart!), padding)).toEqual([]);
        });

        it('takes room from the labels as it grows, shrinking or hiding what no longer fits', async () => {
            const loose = drawnLabelFootprint(await render(c.options(c.paddingOption(0))));
            const tight = drawnLabelFootprint(await render(c.options(c.paddingOption(24))));
            const shrunk = tight.mass < loose.mass || tight.width < loose.width;
            expect(shrunk, JSON.stringify({ loose, tight })).toBe(true);
        });
    });

    describe('sector shapes', () => {
        const wedges = (padding: number, innerRadiusRatio?: number): AgChartOptions => ({
            data: [
                { name: 'Alpha', size: 90 },
                { name: 'Beta', size: 10 },
            ],
            width: 400,
            height: 400,
            series: [
                {
                    type: 'sunburst',
                    labelKey: 'name',
                    sizeKey: 'size',
                    label: { ...BOXED, minimumFontSize: 6 },
                    padding,
                    ...(innerRadiusRatio == null ? {} : { innerRadiusRatio }),
                },
            ],
        });

        it.each([
            { shape: 'a wedge from the centre', innerRadiusRatio: undefined },
            { shape: 'a sector around a hole', innerRadiusRatio: 0.3 },
        ])('keeps a sunburst label in $shape clear of every edge', async ({ innerRadiusRatio }) => {
            await render(wedges(12, innerRadiusRatio));
            expect(drawnLabels(chart!).length).toBe(2);
            expect(labelsTooCloseToTheirItem(chart!, shapeItems(chart!), 12)).toEqual([]);
        });
    });

    describe('labels placed outside their items', () => {
        const OUTSIDE: { name: string; options: (padding: number) => AgChartOptions }[] = [
            {
                name: 'bar',
                options: (padding) =>
                    cartesian(
                        {
                            type: 'bar',
                            xKey: 'x',
                            yKey: 'y',
                            itemPadding: padding,
                            label: { placement: 'outside-end' },
                        },
                        barData
                    ),
            },
            {
                name: 'range-bar',
                options: (padding) =>
                    cartesian(
                        {
                            type: 'range-bar',
                            xKey: 'x',
                            yLowKey: 'low',
                            yHighKey: 'high',
                            itemPadding: padding,
                            label: { placement: 'outside' },
                        },
                        barData
                    ),
            },
            {
                name: 'waterfall',
                options: (padding) =>
                    cartesian(
                        {
                            type: 'waterfall',
                            xKey: 'x',
                            yKey: 'y',
                            itemPadding: padding,
                            item: { positive: { label: { placement: 'outside-end' } } },
                        },
                        barData
                    ),
            },
            {
                name: 'scatter',
                options: (padding) =>
                    cartesian(
                        {
                            type: 'scatter',
                            xKey: 'x',
                            yKey: 'y',
                            labelKey: 'name',
                            size: 30,
                            itemPadding: padding,
                            label: { placement: 'top' },
                        },
                        markerData
                    ),
            },
            {
                name: 'line',
                options: (padding) =>
                    cartesian(
                        {
                            type: 'line',
                            xKey: 'x',
                            yKey: 'y',
                            itemPadding: padding,
                            label: { enabled: true, placement: 'top' },
                        },
                        markerData
                    ),
            },
        ];

        const drawn = (target: ChartOrProxy) =>
            drawnLabels(target).map((label) => ({ text: label.text, box: label.getTextMeasureBBox() }));

        it.each(OUTSIDE)('leaves $name labels where they were', async ({ options }) => {
            const without = drawn(await render(options(0)));
            const withPadding = drawn(await render(options(20)));
            expect(without.length).toBeGreaterThan(0);
            expect(withPadding).toEqual(without);
        });
    });

    describe('series without labels inside their items', () => {
        const WITHOUT: { name: string; options: (padding: Record<string, unknown>) => AgChartOptions }[] = [
            {
                name: 'box-plot',
                options: (padding) =>
                    cartesian(
                        {
                            type: 'box-plot',
                            xKey: 'x',
                            minKey: 'low',
                            q1Key: 'low',
                            medianKey: 'y',
                            q3Key: 'high',
                            maxKey: 'high',
                            ...padding,
                        },
                        barData
                    ),
            },
            {
                name: 'candlestick',
                options: (padding) =>
                    cartesian(
                        {
                            type: 'candlestick',
                            xKey: 'x',
                            openKey: 'low',
                            closeKey: 'high',
                            lowKey: 'low',
                            highKey: 'high',
                            ...padding,
                        },
                        barData
                    ),
            },
            {
                name: 'range-area',
                options: (padding) =>
                    cartesian({ type: 'range-area', xKey: 'x', yLowKey: 'low', yHighKey: 'high', ...padding }, barData),
            },
            {
                name: 'cone-funnel',
                options: (padding) => ({
                    data: stageData,
                    series: [{ type: 'cone-funnel', stageKey: 'stage', valueKey: 'value', ...padding }],
                }),
            },
            {
                name: 'radar-line',
                options: (padding) => ({
                    data: barData,
                    series: [{ type: 'radar-line', angleKey: 'x', radiusKey: 'y', ...padding }],
                }),
            },
            ...(['radial-bar', 'radial-column', 'nightingale'] as const).map((type) => ({
                name: type,
                options: (padding: Record<string, unknown>): AgChartOptions => ({
                    data: barData,
                    series: [{ type, angleKey: 'x', radiusKey: 'y', label: { enabled: true }, ...padding }],
                }),
            })),
            {
                name: 'sunburst',
                options: (padding) => ({
                    data: hierarchy,
                    series: [{ type: 'sunburst', labelKey: 'name', sizeKey: 'size', ...padding }],
                }),
            },
            {
                name: 'treemap',
                options: (padding) => ({
                    data: hierarchy,
                    series: [{ type: 'treemap', labelKey: 'name', sizeKey: 'size', ...padding }],
                }),
            },
            {
                name: 'map-shape',
                options: (padding) => ({
                    data: ukData,
                    topology: ukTopology,
                    series: [{ type: 'map-shape', idKey: 'name', ...padding }],
                }),
            },
        ];

        it.each(WITHOUT)('rejects itemPadding on $name', async ({ options }) => {
            await render(options(itemPadding(4)));
            expect(getSeriesOptions(chart!).itemPadding).toBeUndefined();
            expectWarningsCalls().toEqual(expect.arrayContaining([[expect.stringContaining('itemPadding')]]));
        });
    });

    describe('image snapshots', () => {
        it.each(['bar', 'pyramid', 'pie', 'scatter', 'heatmap', 'sunburst', 'treemap', 'map-shape'])(
            'draws %s labels held 6px clear of their items',
            async (name) => {
                const c = CASES.find((entry) => entry.name === name)!;
                await render(c.options(c.paddingOption(6)));
                await compareImageSnapshot(chart!, ctx);
            }
        );
    });
});
