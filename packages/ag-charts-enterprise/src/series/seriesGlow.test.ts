import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgGlowOptions, _ModuleSupport } from 'ag-charts-community';
import {
    deproxy,
    getSeriesAt,
    getSeriesNodeData,
    glowShadow,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { Shape } from 'ag-charts-core';

import { HIERARCHY_SHADOW_DATA, SHADOW, collectShapes, createEnterpriseChart } from '../test/utils';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';

type HighlightNodeDatum = _ModuleSupport.HighlightNodeDatum;
type AnySeriesOptions = NonNullable<AgChartOptions['series']>[number];

/** The series-level glow, with every field set, so that a bucket's field shows through only where it overrides. */
const GLOW: AgGlowOptions = { enabled: true, fill: '#aa0000', fillOpacity: 0.5, blur: 5, spread: 3 };
/** What a glow with no fields of its own casts, from the glow theme defaults. */
const THEME_GLOW = { enabled: true, fillOpacity: 0.4, blur: 2, spread: 4 };

const FLOW = [
    { from: 'A', to: 'C', size: 8 },
    { from: 'A', to: 'D', size: 4 },
    { from: 'B', to: 'C', size: 5 },
];
const STAGES = [
    { stage: 'Visits', value: 100 },
    { stage: 'Sign-ups', value: 60 },
    { stage: 'Paid', value: 20 },
];
const GRID = [
    { x: 'a', y: 'p', value: 1 },
    { x: 'b', y: 'p', value: 3 },
    { x: 'a', y: 'q', value: 2 },
    { x: 'b', y: 'q', value: 5 },
];
const POLAR = [
    { quarter: 'Q1', value: 5, low: 2 },
    { quarter: 'Q2', value: 8, low: 3 },
    { quarter: 'Q3', value: 3, low: 1 },
];
const RANGE = [
    { x: 'Q1', low: 2, high: 5 },
    { x: 'Q2', low: 3, high: 8 },
    { x: 'Q3', low: 1, high: 3 },
];
const OHLC = [
    { x: 'Q1', open: 6, high: 7, low: 3, close: 4 },
    { x: 'Q2', open: 5, high: 7, low: 4, close: 6 },
    { x: 'Q3', open: 4, high: 5, low: 4, close: 4.5 },
];
const OHLC_KEYS = { xKey: 'x', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' };
const BOX_PLOT = [
    { x: 'Q1', min: 3, q1: 4, median: 5, q3: 6, max: 7 },
    { x: 'Q2', min: 4, q1: 5, median: 6, q3: 7, max: 8 },
];
const WATERFALL = [
    { x: 'Start', y: 10 },
    { x: 'Down', y: -4 },
    { x: 'Up', y: 6 },
];
const XY = [
    { x: 1, y: 5, size: 10 },
    { x: 2, y: 8, size: 20 },
    { x: 3, y: 3, size: 30 },
];
const SLICES = [
    { category: 'A', value: 5 },
    { category: 'B', value: 8 },
    { category: 'C', value: 3 },
];
const HISTOGRAM = [{ x: 1 }, { x: 2 }, { x: 2.5 }, { x: 4 }, { x: 5 }, { x: 5.5 }, { x: 7 }];

interface SeriesCase {
    name: string;
    /** The series options, with `glow` placed where this series reads it from, and a `shadow` beside it where it has one. */
    series: (glow: object | undefined, shadow?: object) => AnySeriesOptions;
    data: object[];
    /** How many shapes of the series cast the glow, where only some of its shapes do. */
    count?: number;
    /** Which shapes the series casts the glow from, where they share the group with shapes that do not. */
    only?: (shape: Shape) => boolean;
    chartOptions?: object;
    /** The shapes the series casts the glow from have no `shadow` option to cast beside it. */
    noShadow?: boolean;
    /** The series has a datum to hover, and options to set on a highlight state. */
    hoverable?: boolean;
    /** How many shapes the hover moves to the highlight layer: the three markers of an HLC item. */
    copies?: number;
}

const isGroup = (shape: Shape) => (shape as Shape<{ hasChildren?: boolean }>).datum?.hasChildren === true;
const isTile = (shape: Shape) => !isGroup(shape);

const SERIES: SeriesCase[] = [
    {
        name: 'bubble',
        data: XY,
        hoverable: true,
        series: (glow, shadow) => ({ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'size', glow, shadow }),
    },
    {
        name: 'histogram',
        data: HISTOGRAM,
        series: (glow, shadow) => ({ type: 'histogram', xKey: 'x', glow, shadow }),
    },
    {
        name: 'range-bar',
        data: RANGE,
        hoverable: true,
        series: (glow, shadow) => ({
            type: 'range-bar',
            xKey: 'x',
            yLowKey: 'low',
            yHighKey: 'high',
            glow,
            shadow,
        }),
    },
    {
        name: 'box-plot',
        data: BOX_PLOT,
        hoverable: true,
        series: (glow, shadow) => ({
            type: 'box-plot',
            xKey: 'x',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
            glow,
            shadow,
        }),
    },
    {
        name: 'candlestick',
        data: OHLC,
        hoverable: true,
        series: (glow, shadow) => ({ type: 'candlestick', ...OHLC_KEYS, glow, shadow }),
    },
    {
        name: 'ohlc',
        data: OHLC,
        hoverable: true,
        series: (glow, shadow) => ({ type: 'ohlc', ...OHLC_KEYS, glow, shadow }),
    },
    {
        name: 'hlc markers',
        data: OHLC,
        hoverable: true,
        copies: 3,
        series: (glow, shadow) => ({
            type: 'hlc',
            xKey: 'x',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            marker: { enabled: true, glow, shadow },
        }),
    },
    {
        name: 'funnel',
        data: STAGES,
        series: (glow, shadow) => ({ type: 'funnel', stageKey: 'stage', valueKey: 'value', glow, shadow }),
    },
    {
        name: 'cone funnel connectors',
        data: STAGES,
        count: STAGES.length - 1,
        noShadow: true,
        series: (glow) => ({ type: 'cone-funnel', stageKey: 'stage', valueKey: 'value', glow }),
    },
    {
        name: 'heatmap',
        data: GRID,
        series: (glow, shadow) => ({
            type: 'heatmap',
            xKey: 'x',
            yKey: 'y',
            colorKey: 'value',
            glow,
            shadow,
        }),
    },
    {
        name: 'pyramid',
        data: STAGES,
        series: (glow, shadow) => ({ type: 'pyramid', stageKey: 'stage', valueKey: 'value', glow, shadow }),
    },
    {
        name: 'radial-column',
        data: POLAR,
        series: (glow, shadow) => ({
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'value',
            glow,
            shadow,
        }),
    },
    {
        name: 'radial-bar',
        data: POLAR,
        series: (glow, shadow) => ({ type: 'radial-bar', angleKey: 'value', radiusKey: 'quarter', glow, shadow }),
    },
    {
        name: 'nightingale',
        data: POLAR,
        series: (glow, shadow) => ({ type: 'nightingale', angleKey: 'quarter', radiusKey: 'value', glow, shadow }),
    },
    {
        name: 'radar-line markers',
        data: POLAR,
        series: (glow, shadow) => ({
            type: 'radar-line',
            angleKey: 'quarter',
            radiusKey: 'value',
            marker: { enabled: true, glow, shadow },
        }),
    },
    {
        name: 'radar-area markers',
        data: POLAR,
        series: (glow, shadow) => ({
            type: 'radar-area',
            angleKey: 'quarter',
            radiusKey: 'value',
            marker: { enabled: true, glow, shadow },
        }),
    },
    {
        // The area fill has no glow, so the markers are all that glow: one for each end of each range.
        name: 'range-area markers',
        data: RANGE,
        count: RANGE.length * 2,
        series: (glow, shadow) => ({
            type: 'range-area',
            xKey: 'x',
            yLowKey: 'low',
            yHighKey: 'high',
            marker: { enabled: true, glow, shadow },
        }),
    },
    {
        name: 'area markers',
        data: XY,
        count: XY.length,
        series: (glow, shadow) => ({
            type: 'area',
            xKey: 'x',
            yKey: 'y',
            marker: { enabled: true, glow, shadow },
        }),
    },
    {
        name: 'pie',
        data: SLICES,
        series: (glow, shadow) => ({ type: 'pie', angleKey: 'value', glow, shadow }),
    },
    {
        name: 'donut',
        data: SLICES,
        series: (glow, shadow) => ({ type: 'donut', angleKey: 'value', glow, shadow }),
    },
    {
        name: 'waterfall positive',
        data: WATERFALL,
        count: 2,
        series: (glow, shadow) => ({
            type: 'waterfall',
            xKey: 'x',
            yKey: 'y',
            item: { positive: { glow, shadow } },
        }),
    },
    {
        name: 'waterfall negative',
        data: WATERFALL,
        count: 1,
        series: (glow, shadow) => ({
            type: 'waterfall',
            xKey: 'x',
            yKey: 'y',
            item: { negative: { glow, shadow } },
        }),
    },
    {
        name: 'waterfall total',
        data: [...WATERFALL, { x: 'Total', y: 12 }],
        count: 1,
        series: (glow, shadow) => ({
            type: 'waterfall',
            xKey: 'x',
            yKey: 'y',
            item: { total: { glow, shadow } },
            totals: [{ totalType: 'subtotal', index: 3, axisLabel: 'Total' }],
        }),
    },
    {
        name: 'sankey nodes',
        data: FLOW,
        count: 4,
        series: (glow, shadow) => ({
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            node: { glow, shadow },
        }),
    },
    {
        name: 'sankey links',
        data: FLOW,
        count: FLOW.length,
        series: (glow, shadow) => ({
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            link: { glow, shadow },
        }),
    },
    {
        name: 'chord nodes',
        data: FLOW,
        count: 4,
        series: (glow, shadow) => ({
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            node: { glow, shadow },
        }),
    },
    {
        name: 'chord links',
        data: FLOW,
        count: FLOW.length,
        series: (glow, shadow) => ({
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            link: { glow, shadow },
        }),
    },
    {
        name: 'treemap tiles',
        data: HIERARCHY_SHADOW_DATA,
        only: isTile,
        series: (glow, shadow) => ({
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'size',
            group: { gap: 12, padding: 10 },
            tile: { glow, shadow },
        }),
    },
    {
        name: 'treemap groups',
        data: HIERARCHY_SHADOW_DATA,
        only: isGroup,
        series: (glow, shadow) => ({
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'size',
            group: { gap: 12, padding: 10, glow, shadow },
        }),
    },
    {
        name: 'sunburst',
        data: HIERARCHY_SHADOW_DATA,
        series: (glow, shadow) => ({ type: 'sunburst', labelKey: 'name', sizeKey: 'size', glow, shadow }),
    },
    {
        name: 'map-shape',
        data: ukData,
        chartOptions: { topology: ukTopology },
        series: (glow, shadow) => ({ type: 'map-shape', idKey: 'name', glow, shadow }),
    },
    {
        name: 'map-marker',
        data: ukData,
        chartOptions: { topology: ukTopology },
        series: (glow, shadow) => ({ type: 'map-marker', idKey: 'name', glow, shadow }),
    },
];

describe('series-level glow (enterprise series)', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const create = async (testCase: SeriesCase, glow: object | undefined, shadow?: object, highlight?: object) => {
        const series = { ...testCase.series(glow, shadow), ...(highlight ? { highlight } : {}) };
        chart = await createEnterpriseChart({
            data: testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            ...testCase.chartOptions,
            series: [series],
        } as AgChartOptions);
        await waitForChartStability(chart);
    };

    /** The shapes of the case that cast in the glow slot, in the content and in the highlight layer. */
    const glowing = (testCase: SeriesCase, group: 'contentGroup' | 'highlightGroup' = 'contentGroup') =>
        collectShapes(getSeriesAt(chart)[group]).filter(
            (shape) => shape.visible && shape.fillGlow?.enabled === true && (testCase.only?.(shape) ?? true)
        );

    describe.each(SERIES)('$name', (testCase) => {
        it('casts the glow from its shapes, in the glow slot', async () => {
            await create(testCase, GLOW);

            const shapes = glowing(testCase);
            expect(shapes.length).toBeGreaterThan(0);
            if (testCase.count != null) expect(shapes).toHaveLength(testCase.count);
            for (const shape of shapes) {
                expect(shape.fillGlow).toMatchObject(glowShadow(GLOW));
                expect(shape.fillShadow?.enabled).not.toBe(true);
            }
        });

        it('casts the theme glow for a glow with no fields', async () => {
            await create(testCase, {});

            const shapes = glowing(testCase);
            expect(shapes.length).toBeGreaterThan(0);
            for (const shape of shapes) expect(shape.fillGlow).toMatchObject(glowShadow(THEME_GLOW));
        });

        it.each([
            ['is disabled', { ...GLOW, enabled: false }],
            ['is not set', undefined],
        ])('casts no glow where the glow %s', async (_name, glow) => {
            await create(testCase, glow);

            expect(glowing(testCase)).toHaveLength(0);
        });

        it.skipIf(testCase.noShadow)(
            'casts the shadow and the glow of a shape together, each in its own slot',
            async () => {
                await create(testCase, GLOW, SHADOW);

                const shapes = glowing(testCase);
                expect(shapes.length).toBeGreaterThan(0);
                for (const shape of shapes) {
                    expect(shape.fillGlow).toMatchObject(glowShadow(GLOW));
                    expect(shape.fillShadow).toMatchObject(SHADOW);
                }
            }
        );
    });

    describe.each(SERIES.filter((testCase) => testCase.hoverable))('$name, hovered', (testCase) => {
        const copies = testCase.copies ?? 1;
        const hover = async (glow: object | undefined, highlight: object) => {
            await create(testCase, glow, undefined, highlight);
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
            await waitForChartStability(chart);
        };

        it('casts the highlight copy from highlightedItem over the series glow, field by field', async () => {
            await hover(GLOW, { highlightedItem: { glow: { blur: 9 } } });

            const drawn = glowing(testCase, 'highlightGroup');
            expect(drawn).toHaveLength(copies);
            for (const copy of drawn) {
                expect(copy.fillGlow).toMatchObject(glowShadow({ ...GLOW, blur: 9 }));
                expect(copy.fillShadow?.enabled).not.toBe(true);
            }
        });

        it('keeps the series glow on the items that are not hovered, and takes it off the hovered one in place', async () => {
            await create(testCase, GLOW);
            const before = glowing(testCase).length;
            expect(before).toBeGreaterThan(copies);

            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
            await waitForChartStability(chart);

            const inPlace = glowing(testCase);
            expect(inPlace).toHaveLength(before - copies);
            for (const shape of inPlace) expect(shape.fillGlow).toMatchObject(glowShadow(GLOW));
            // The highlight copy casts the glow the hovered item gave up.
            expect(glowing(testCase, 'highlightGroup')).toHaveLength(copies);
        });
    });
});
