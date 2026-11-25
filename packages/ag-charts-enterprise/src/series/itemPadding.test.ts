import { afterEach, describe, expect, it } from 'vitest';

import type {
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgChartLabelCollisionPlacement,
    AgChartOptions,
} from 'ag-charts-community';
import {
    type ChartOrProxy,
    clickAction,
    compareImageSnapshot,
    expectWarningsCalls,
    getSeriesOptions,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
} from 'ag-charts-community-test';
import { type BBox, type Node, RotatableText, Shape, Text, Transformable, TransformableText } from 'ag-charts-core';

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
    /** Where the series reads the padding, `itemPadding` unless it keeps an option of its own. */
    readonly paddingOption?: PaddingOption;
    /** Reads the padding the series resolved, defaulted or set; `itemPadding` unless given. */
    readonly resolvedPadding?: (options: Record<string, any>) => unknown;
    /** The item shapes, for a series that does not draw each item as its own shape node. */
    readonly items?: (chart: ChartOrProxy) => Item[];
}

/** An item as drawn, in canvas coordinates. */
interface Item {
    readonly contains: (x: number, y: number) => boolean;
    readonly area: number;
}

// Most labels draw a box, so the distance is measured to what is drawn rather than to the glyphs.
const BOXED = { fill: '#ffffffcc', padding: 2 };
// The labels are long enough to fill their items, so the fit is what keeps them clear of the edges.
const UNBOXED_FITTED = { wrapping: 'on-space', minimumFontSize: 6 } as const;
const FITTED = { ...BOXED, ...UNBOXED_FITTED };
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

const sectorChart = (
    type: 'pie' | 'donut',
    data: object[],
    padding?: Record<string, unknown>,
    sectorLabel: object = FITTED
): AgChartOptions => ({
    data,
    width: 400,
    height: 300,
    legend: { enabled: false },
    series: [
        {
            type,
            angleKey: 'value',
            legendItemKey: 'stage',
            sectorLabelKey: 'stage',
            calloutLabel: { enabled: false },
            sectorLabel: { ...sectorLabel, formatter: () => LONG_TEXT },
            ...padding,
        },
    ],
});

const sunburstChart = (data: object[], series?: Record<string, unknown>): AgChartOptions => ({
    data,
    width: 400,
    height: 400,
    series: [
        { type: 'sunburst', labelKey: 'name', sizeKey: 'size', label: { ...BOXED, minimumFontSize: 6 }, ...series },
    ],
});

const TREEMAP_TILE = { label: { ...BOXED, minimumFontSize: 6 } };

const CASES: ItemPaddingCase[] = [
    {
        name: 'bar',
        options: (padding) =>
            cartesian(
                { type: 'bar', xKey: 'x', yKey: 'y', label: { ...FITTED, formatter: () => LONG_TEXT }, ...padding },
                barData
            ),
    },
    {
        name: 'histogram',
        options: (padding) =>
            cartesian(
                { type: 'histogram', xKey: 'x', label: { ...FITTED, formatter: () => LONG_TEXT }, ...padding },
                [1, 2, 2, 3, 3, 3, 4, 4, 5].map((x) => ({ x }))
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
        options: (padding) => sectorChart('pie', stageData, padding),
    },
    {
        // A lone sector centres its label in the square inscribed in the pie.
        name: 'pie with one sector',
        options: (padding) => sectorChart('pie', stageData.slice(0, 1), padding, { ...FITTED, fontSize: 40 }),
    },
    {
        name: 'donut',
        options: (padding) => sectorChart('donut', stageData, padding),
    },
    {
        // Without a background, each line is held clear of the wedge on its own.
        name: 'donut with unboxed labels',
        options: (padding) => sectorChart('donut', stageData, padding, UNBOXED_FITTED),
    },
    {
        name: 'sunburst',
        paddingOption: (padding) => ({ padding }),
        resolvedPadding: (o) => o.padding,
        options: (padding) => sunburstChart(hierarchy, padding),
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
        options: (padding) =>
            cartesian(
                { type: 'scatter', xKey: 'x', yKey: 'y', labelKey: 'name', size: 60, label: markerLabel, ...padding },
                markerData
            ),
    },
    {
        name: 'bubble',
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
        options: (padding) =>
            cartesian(
                { type: 'line', xKey: 'x', yKey: 'y', marker: { size: 60 }, label: markerLabel, ...padding },
                markerData
            ),
    },
    {
        name: 'area',
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

const paddedOptions = (c: ItemPaddingCase, padding: number) => c.options((c.paddingOption ?? itemPadding)(padding));

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

/** The labels a series drew. */
function drawnLabels(chart: ChartOrProxy): Text[] {
    const labels: Text[] = [];
    for (const group of [getSeriesGroup(chart, 'labelGroup'), getSeriesGroup(chart, 'contentGroup')]) {
        for (const node of group.descendants()) {
            if (node instanceof Text && isDrawn(node) && node.text !== '' && node.text != null) labels.push(node);
        }
    }
    return labels;
}

/**
 * The boxes `label` paints, in its own frame: each line of a plain unboxed label answers for itself, as the
 * series tests it, and anything else is its whole block, background included.
 */
function paintedBoxes(label: Text): BBox[] {
    const rotated = label instanceof RotatableText || label instanceof TransformableText;
    return rotated ? [label.getTextMeasureBBox()] : label.getDrawnBoxes();
}

/**
 * Points `grow` from a box `label` paints, in canvas coordinates: along each side, and round each corner, where
 * the nearest point of the box is the corner itself rather than a side.
 */
function boxOutline(label: Text, { x, y, width, height }: BBox, grow: number) {
    const steps = 8;
    const points: { x: number; y: number }[] = [];
    const push = (px: number, py: number) => {
        const { canvasX, canvasY } = Transformable.toCanvasPoint(label, px, py);
        points.push({ x: canvasX, y: canvasY });
    };
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        push(x + width * t, y - grow);
        push(x + width * t, y + height + grow);
        push(x - grow, y + height * t);
        push(x + width + grow, y + height * t);
    }
    const corners = [
        [x, y, Math.PI],
        [x + width, y, Math.PI * 1.5],
        [x + width, y + height, 0],
        [x, y + height, Math.PI * 0.5],
    ];
    for (const [cx, cy, from] of corners) {
        for (let i = 1; i < steps; i++) {
            const angle = from + (Math.PI / 2) * (i / steps);
            push(cx + grow * Math.cos(angle), cy + grow * Math.sin(angle));
        }
    }
    return points;
}

/** The labels drawn closer than `padding` to the edge of the item they sit in. */
function labelsTooCloseToTheirItem(chart: ChartOrProxy, items: Item[], padding: number) {
    // Shapes are drawn on whole or half pixels, so the edge a label is measured to can be half a pixel out.
    const tolerance = 0.5;
    const offenders: string[] = [];
    for (const label of drawnLabels(chart)) {
        const block = label.getTextMeasureBBox();
        const centre = Transformable.toCanvasPoint(label, block.x + block.width / 2, block.y + block.height / 2);
        const points = paintedBoxes(label).flatMap((box) => boxOutline(label, box, Math.max(0, padding - tolerance)));
        const owner = items
            .filter((item) => item.contains(centre.canvasX, centre.canvasY))
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
            const resolvedPadding = c.resolvedPadding ?? ((o) => o.itemPadding);
            expect(resolvedPadding(getSeriesOptions(chart!))).toBe(2);
        });

        it.each([0, 2, 6])('keeps every label inside its item at least %ipx from its edge', async (padding) => {
            await render(paddedOptions(c, padding));
            expect(drawnLabels(chart!).length).toBeGreaterThan(0);
            expect(labelsTooCloseToTheirItem(chart!, itemsOf(chart!), padding)).toEqual([]);
        });

        it('takes room from the labels as it grows, shrinking or hiding what no longer fits', async () => {
            const loose = drawnLabelFootprint(await render(paddedOptions(c, 0)));
            const tight = drawnLabelFootprint(await render(paddedOptions(c, 24)));
            const shrunk = tight.mass < loose.mass || tight.width < loose.width;
            expect(shrunk, JSON.stringify({ loose, tight })).toBe(true);
        });
    });

    it('keeps the whole background of a boxed sector label inside its wedge, not only each line', async () => {
        await render({
            data: [
                { name: 'North', size: 5 },
                { name: 'South', size: 3 },
                { name: 'East', size: 1 },
            ],
            width: 400,
            height: 300,
            legend: { enabled: false },
            series: [
                {
                    type: 'donut',
                    angleKey: 'size',
                    legendItemKey: 'name',
                    sectorLabelKey: 'name',
                    innerRadiusRatio: 0.7,
                    itemPadding: 0,
                    calloutLabel: { enabled: false },
                    sectorLabel: { fill: '#eee', padding: 6, wrapping: 'on-space', formatter: () => LONG_TEXT },
                },
            ],
        });
        expect(drawnLabels(chart!).length).toBeGreaterThan(0);
        expect(labelsTooCloseToTheirItem(chart!, shapeItems(chart!), 0)).toEqual([]);
    });

    describe('sector shapes', () => {
        const wedges = (padding: number, innerRadiusRatio?: number) =>
            sunburstChart(
                [
                    { name: 'Alpha', size: 90 },
                    { name: 'Beta', size: 10 },
                ],
                { padding, ...(innerRadiusRatio == null ? {} : { innerRadiusRatio }) }
            );

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

    describe('series that do not take itemPadding', () => {
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

    describe('stroke', () => {
        // Narrow bars, so the labels fill the room they are given.
        const narrowBarData = Array.from({ length: 8 }, (_, i) => ({ x: `Q${i + 1}`, y: 40 + 10 * (i % 3) }));
        // `depth` is how far the stroke reaches inside the item's geometric edge.
        const STROKED: { name: string; options: (padding: number, depth: number) => AgChartOptions }[] = [
            {
                name: 'bar',
                options: (padding, depth) =>
                    cartesian(
                        {
                            type: 'bar',
                            xKey: 'x',
                            yKey: 'y',
                            stroke: 'black',
                            strokeWidth: depth,
                            itemPadding: padding,
                            label: { ...FITTED, formatter: () => LONG_TEXT },
                        },
                        narrowBarData
                    ),
            },
            {
                name: 'sunburst',
                options: (padding, depth) =>
                    sunburstChart(hierarchy, { strokes: ['black'], strokeWidth: depth, padding }),
            },
            {
                // A marker's stroke is centred on its outline, so only half of it lies inside.
                name: 'scatter',
                options: (padding, depth) =>
                    cartesian(
                        {
                            type: 'scatter',
                            xKey: 'x',
                            yKey: 'y',
                            labelKey: 'name',
                            size: 80,
                            stroke: 'black',
                            strokeWidth: 2 * depth,
                            itemPadding: padding,
                            label: markerLabel,
                        },
                        markerData
                    ),
            },
        ];
        const MERGES = [
            { merge: 'flush with a stroke deeper than the padding', padding: 3, depth: 10, inset: 10 },
            { merge: 'the padding clear of a shallower stroke', padding: 10, depth: 4, inset: 10 },
            { merge: 'into the stroke by a negative padding', padding: -4, depth: 10, inset: 6 },
            { merge: 'at the edge for a negative padding past the stroke', padding: -20, depth: 10, inset: 0 },
        ];

        describe.each(STROKED)('$name', ({ options }) => {
            it.each(MERGES)('holds labels $merge', async ({ padding, depth, inset }) => {
                await render(options(padding, depth));
                expect(drawnLabels(chart!).length).toBeGreaterThan(0);
                expect(labelsTooCloseToTheirItem(chart!, shapeItems(chart!), inset)).toEqual([]);
                await compareImageSnapshot(chart!, ctx);
            });
        });

        // Each state draws every item with a stroke reaching `depth` inside it, so every label must re-fit to it.
        const stateStrokes = (strokeWidth: number) => ({
            highlight: { highlight: { highlightedItem: { strokeWidth }, unhighlightedItem: { strokeWidth } } },
            selection: { selection: { enabled: true, selectedItem: { strokeWidth }, unselectedItem: { strokeWidth } } },
        });
        const barAt =
            (placement: 'inside-center' | 'inside-end', orientation?: 'vertical' | 'vertical-reversed') =>
            (state: object): AgChartOptions =>
                cartesian(
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        stroke: 'black',
                        strokeWidth: 1,
                        // Turned text wraps to a horizontal bar's thickness, so it fills the bar.
                        direction: orientation == null ? undefined : 'horizontal',
                        ...state,
                        label: { ...FITTED, formatter: () => LONG_TEXT, placement, orientation },
                    },
                    narrowBarData
                );
        // Many stages, so each is short enough for its label to fill the room it is given.
        const stage = (name: string, strokeWidth: number) => (state: object) => ({
            ...CASES.find((c) => c.name === name)!.options({ strokes: ['black'], strokeWidth, ...state }),
            data: Array.from({ length: 8 }, (_, i) => ({ stage: `Stage ${i + 1}`, value: 1000 - 100 * i })),
        });
        const depth = 12;
        const RESTYLED = [
            { name: 'centred bar', options: barAt('inside-center'), states: stateStrokes(depth) },
            { name: 'end-anchored bar', options: barAt('inside-end'), states: stateStrokes(depth) },
            {
                name: 'rotated centred bar',
                options: barAt('inside-center', 'vertical'),
                states: { highlight: stateStrokes(depth).highlight },
            },
            {
                name: 'rotated end-anchored bar',
                options: barAt('inside-end', 'vertical-reversed'),
                states: { highlight: stateStrokes(depth).highlight },
            },
            { name: 'funnel', options: stage('funnel', 1), states: { highlight: stateStrokes(depth).highlight } },
            // A pyramid stage's stroke is centred on its outline, so twice the width reaches as deep.
            { name: 'pyramid', options: stage('pyramid', 2), states: { highlight: stateStrokes(2 * depth).highlight } },
        ].flatMap(({ name, options, states }) =>
            Object.entries(states).map(([state, stateOptions]) => ({
                name,
                state,
                options: options(stateOptions),
                act: state === 'selection' ? clickAction : hoverAction,
            }))
        );

        it.each(RESTYLED)('re-fits $name labels to the stroke $state draws', async ({ options, act }) => {
            await render(options);
            expect(labelsTooCloseToTheirItem(chart!, shapeItems(chart!), depth)).not.toEqual([]);

            // A label sits inside its item and takes no pointer events, so its centre picks the item.
            const { x, y, width, height } = Transformable.toCanvas(drawnLabels(chart!)[0]);
            await act(x + width / 2, y + height / 2)(chart!);

            expect(drawnLabels(chart!).length).toBeGreaterThan(0);
            expect(labelsTooCloseToTheirItem(chart!, shapeItems(chart!), depth)).toEqual([]);
            await compareImageSnapshot(chart!, ctx);
        });

        it('keeps an end-anchored label past an inner whisker when a state stroke stays shallower than it', async () => {
            const options = cartesian(
                {
                    type: 'bar',
                    xKey: 'x',
                    yKey: 'y',
                    stroke: 'black',
                    strokeWidth: 1,
                    ...stateStrokes(depth).highlight,
                    errorBar: { yLowerKey: 'lo', yUpperKey: 'y' },
                    label: { ...FITTED, formatter: () => LONG_TEXT, placement: 'inside-end', spacing: 2 },
                },
                narrowBarData.map((datum) => ({ ...datum, lo: datum.y - 10 }))
            );
            const tops = () => drawnLabels(chart!).map((label) => Transformable.toCanvas(label).y);
            await render(options);
            const resting = tops();
            expect(resting.length).toBe(narrowBarData.length);

            const { x, y, width, height } = Transformable.toCanvas(drawnLabels(chart!)[0]);
            await hoverAction(x + width / 2, y + height / 2)(chart!);

            expect(tops()).toEqual(resting);
            await compareImageSnapshot(chart!, ctx);
        });

        it('holds an end-anchored label clear of a stroke deeper than its spacing', async () => {
            await render(
                cartesian(
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        stroke: 'black',
                        strokeWidth: depth,
                        label: { placement: 'inside-end', spacing: 2, collision: { alwaysShow: true } },
                    },
                    barData
                )
            );
            expect(drawnLabels(chart!).length).toBe(barData.length);
            expect(labelsTooCloseToTheirItem(chart!, shapeItems(chart!), depth)).toEqual([]);
            await compareImageSnapshot(chart!, ctx);
        });

        it('moves a label placed outside a marker clear of its stroke', async () => {
            const scatter = (strokeWidth: number): AgChartOptions => ({
                ...cartesian(
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        labelKey: 'name',
                        size: 30,
                        stroke: 'black',
                        strokeWidth,
                        label: { placement: 'top' },
                    },
                    markerData
                ),
                // Room above every marker, so no label has to give way to the edge.
                axes: { y: { type: 'number', position: 'left', max: 100 }, x: { type: 'number', position: 'bottom' } },
            });
            const bottoms = (target: ChartOrProxy) =>
                drawnLabels(target).map((label) => {
                    const { y, height } = label.getTextMeasureBBox();
                    return Transformable.toCanvasPoint(label, 0, y + height).canvasY;
                });
            const unstroked = bottoms(await render(scatter(0)));
            const stroked = bottoms(await render(scatter(16)));
            expect(stroked.length).toBe(markerData.length);
            expect(stroked.map((bottom, i) => unstroked[i] - bottom)).toEqual(markerData.map(() => 8));
            await compareImageSnapshot(chart!, ctx);
        });
    });

    describe('image snapshots', () => {
        it.each(['bar', 'pyramid', 'pie', 'scatter', 'heatmap', 'sunburst', 'treemap', 'map-shape'])(
            'draws %s labels held 6px clear of their items',
            async (name) => {
                const c = CASES.find((entry) => entry.name === name)!;
                await render(paddedOptions(c, 6));
                await compareImageSnapshot(chart!, ctx);
            }
        );
    });
});
