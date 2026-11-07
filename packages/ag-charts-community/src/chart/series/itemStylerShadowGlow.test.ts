import { afterEach, describe, expect, it, vi } from 'vitest';

import { Rect, Sector, Shape } from 'ag-charts-core';
import type { AgChartOptions, AgDropShadowOptions, AgGlowOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { Marker } from '../marker/marker';
import { getSeriesAt, getSeriesNodeData } from '../test/seriesAccessors';
import {
    CATEGORY_DATA,
    HIGHLIGHT_GLOW,
    HIGHLIGHT_SHADOW,
    ITEM_GLOW,
    ITEM_SHADOW,
    type ItemCast,
    SERIES_GLOW,
    SERIES_SHADOW,
    THEME_GLOW,
    XY_DATA,
    countCastSerialisations,
    glowShadow,
    isOn,
    shapesOf,
    themeShadow,
} from '../test/shadowFixtures';
import {
    createChart,
    deproxy,
    expectWarningMessages,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

interface SeriesCase {
    name: string;
    data: object[];
    /** The shape class that casts the item. */
    kind: abstract new (...args: any[]) => Shape;
    /** The series options, with the `shadow` and `glow` where this series reads them from, and the `itemStyler`. */
    series: (opts: {
        shadow?: AgDropShadowOptions;
        glow?: AgGlowOptions;
        highlight?: object;
        itemStyler?: (params: any) => object;
    }) => object;
    /** The index in the data of the datum that the styler is called with. */
    indexOf: (datum: any) => number;
}

const SERIES: SeriesCase[] = [
    {
        name: 'bar',
        data: CATEGORY_DATA,
        kind: Rect,
        indexOf: (datum) => indexByKey(CATEGORY_DATA, datum, 'category'),
        series: ({ shadow, glow, highlight, itemStyler }) => ({
            type: 'bar',
            xKey: 'category',
            yKey: 'value',
            shadow,
            glow,
            highlight,
            itemStyler,
        }),
    },
    {
        name: 'scatter',
        data: XY_DATA,
        kind: Marker,
        indexOf: (datum) => indexByKey(XY_DATA, datum, 'x'),
        series: ({ shadow, glow, highlight, itemStyler }) => ({
            type: 'scatter',
            xKey: 'x',
            yKey: 'y',
            shadow,
            glow,
            highlight,
            itemStyler,
        }),
    },
    {
        // The marker of a line series takes its styler, shadow and glow on the marker.
        name: 'line marker',
        data: XY_DATA,
        kind: Marker,
        indexOf: (datum) => indexByKey(XY_DATA, datum, 'x'),
        series: ({ shadow, glow, highlight, itemStyler }) => ({
            type: 'line',
            xKey: 'x',
            yKey: 'y',
            highlight,
            marker: { enabled: true, shadow, glow, itemStyler },
        }),
    },
    {
        name: 'donut',
        data: CATEGORY_DATA,
        kind: Sector,
        indexOf: (datum) => indexByKey(CATEGORY_DATA, datum, 'category'),
        series: ({ shadow, glow, highlight, itemStyler }) => ({
            type: 'donut',
            angleKey: 'value',
            calloutLabelKey: 'category',
            shadow,
            glow,
            highlight,
            itemStyler,
        }),
    },
];

/** The index of the row of `data` that has the same `key` as `datum`. */
const indexByKey = (data: object[], datum: Record<string, unknown>, key: string) =>
    data.findIndex((row) => (row as Record<string, unknown>)[key] === datum[key]);

/** Whether a shape casts a shadow or glow in the given slot. */
describe.each(SERIES)('itemStyler shadow and glow ($name)', (testCase) => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        chart?.destroy();
        vi.restoreAllMocks();
    });

    /**
     * A chart whose item styler returns `cast(highlightState)` for the first item, and `others` for the rest; with the
     * first item hovered when `hover` is set. Returns the in-place shapes and the visible highlight copies.
     */
    const create = async (
        opts: {
            shadow?: AgDropShadowOptions;
            glow?: AgGlowOptions;
            highlight?: object;
            hover?: boolean;
            theme?: string;
            first?: ItemCast | ((highlightState: string | undefined) => ItemCast);
            others?: ItemCast;
            styler?: (params: any) => object;
            tooltipRenderer?: (params: any) => object;
        } = {}
    ) => {
        const { first, others, styler } = opts;
        const itemStyler =
            styler ??
            (first == null && others == null
                ? undefined
                : (params: any) => {
                      if (testCase.indexOf(params.datum) === 0) {
                          return typeof first === 'function' ? first(params.highlightState) : (first ?? {});
                      }
                      return others ?? {};
                  });
        const options = {
            data: testCase.data,
            theme: opts.theme,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [
                {
                    ...testCase.series({ shadow: opts.shadow, glow: opts.glow, highlight: opts.highlight, itemStyler }),
                    tooltip: opts.tooltipRenderer && { renderer: opts.tooltipRenderer },
                },
            ],
        } as AgChartOptions;
        chart = deproxy(await createChart(options));
        const series = getSeriesAt(chart);

        if (opts.hover) {
            const [datum] = getSeriesNodeData<HighlightNodeDatum>(chart);
            chart.ctx.highlightManager.updateHighlight(chart.id, datum);
            await waitForChartStability(chart);
        }

        return {
            inPlace: shapesOf(series.contentGroup, testCase.kind),
            highlighted: shapesOf(series.highlightNodeGroup, testCase.kind).filter((shape) => shape.visible),
        };
    };

    describe('override', () => {
        it('casts the shadow that the styler returns for an item, and the series shadow for the others', async () => {
            const { inPlace } = await create({ shadow: SERIES_SHADOW, first: { shadow: ITEM_SHADOW } });

            expect(inPlace).toHaveLength(testCase.data.length);
            expect(inPlace[0].fillShadow).toMatchObject(ITEM_SHADOW);
            for (const shape of inPlace.slice(1)) expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
        });

        it.each([
            { key: 'shadow', series: SERIES_SHADOW, expected: (cast: AgDropShadowOptions) => cast },
            { key: 'glow', series: SERIES_GLOW, expected: glowShadow },
        ] as const)(
            'merges the $key of the styler over the series $key, field by field',
            async ({ key, series, expected }) => {
                const { inPlace } = await create({ [key]: series, first: { [key]: { blur: 12 } } });
                const cast = (shape: Shape) => (key === 'shadow' ? shape.fillShadow : shape.fillGlow);

                expect(cast(inPlace[0])).toMatchObject(expected({ ...series, blur: 12 }));
                expect(cast(inPlace[1])).toMatchObject(expected(series));
            }
        );

        it('casts the glow that the styler returns for an item that has none from the series', async () => {
            const { inPlace } = await create({ first: { glow: ITEM_GLOW } });

            expect(inPlace[0].fillGlow).toMatchObject(glowShadow(ITEM_GLOW));
            for (const shape of inPlace.slice(1)) expect(isOn(shape.fillGlow)).toBe(false);
        });

        it('turns the glow on for a bare glow: {}, with the theme glow for the fields it leaves unset', async () => {
            const { inPlace } = await create({ first: { glow: {} } });

            expect(inPlace[0].fillGlow).toMatchObject(glowShadow(THEME_GLOW));
            for (const shape of inPlace.slice(1)) expect(isOn(shape.fillGlow)).toBe(false);
        });

        it('turns on a bare glow: {} over a disabled series glow, which keeps none of its fields', async () => {
            // Option normalisation strips every field of an option object that has `enabled: false`.
            const { inPlace } = await create({ glow: { ...SERIES_GLOW, enabled: false }, first: { glow: {} } });

            expect(inPlace[0].fillGlow).toMatchObject(glowShadow(THEME_GLOW));
            for (const shape of inPlace.slice(1)) expect(isOn(shape.fillGlow)).toBe(false);
        });

        it('keeps the theme glow for the fields that a partial glow leaves unset, with no series glow', async () => {
            const { inPlace } = await create({ first: { glow: { blur: 7 } } });

            expect(inPlace[0].fillGlow).toMatchObject(glowShadow({ ...THEME_GLOW, blur: 7 }));
            for (const shape of inPlace.slice(1)) expect(isOn(shape.fillGlow)).toBe(false);
        });

        it.each([
            ['no series shadow', undefined],
            ['a disabled series shadow, which keeps none of its fields', { ...SERIES_SHADOW, enabled: false }],
        ])(
            'keeps the theme shadow for the fields that a partial shadow leaves unset, over %s',
            async (_name, shadow) => {
                for (const [theme, opacity] of [
                    [undefined, 0.5],
                    ['ag-default-dark', 1],
                ] as const) {
                    chart?.destroy();
                    const { inPlace } = await create({ shadow, theme, first: { shadow: { blur: 12 } } });

                    expect(inPlace[0].fillShadow).toEqual({ ...themeShadow(opacity), blur: 12 });
                    for (const shape of inPlace.slice(1)) expect(isOn(shape.fillShadow)).toBe(false);
                }
            }
        );

        it('casts a shadow and a glow together from one item', async () => {
            const { inPlace } = await create({ first: { shadow: ITEM_SHADOW, glow: ITEM_GLOW } });

            expect(inPlace[0].fillShadow).toMatchObject(ITEM_SHADOW);
            expect(inPlace[0].fillGlow).toMatchObject(glowShadow(ITEM_GLOW));
            for (const shape of inPlace.slice(1)) {
                expect(isOn(shape.fillShadow)).toBe(false);
                expect(isOn(shape.fillGlow)).toBe(false);
            }
        });

        it('lets a styler that returns a shadow add it to an item of a series that has none', async () => {
            const { inPlace } = await create({ first: { shadow: ITEM_SHADOW } });

            expect(inPlace[0].fillShadow).toMatchObject(ITEM_SHADOW);
            for (const shape of inPlace.slice(1)) expect(isOn(shape.fillShadow)).toBe(false);
        });
    });

    describe('theme', () => {
        it('fills the fields that neither the styler nor the series set from the theme shadow', async () => {
            const { inPlace } = await create({ first: { shadow: { blur: 8 } } });

            expect(inPlace[0].fillShadow).toMatchObject({ ...themeShadow(0.5), blur: 8 });
            for (const shape of inPlace.slice(1)) expect(isOn(shape.fillShadow)).toBe(false);
        });
    });

    describe('disable', () => {
        it.each([
            { key: 'shadow', series: SERIES_SHADOW, expected: (cast: AgDropShadowOptions) => cast },
            { key: 'glow', series: SERIES_GLOW, expected: glowShadow },
        ] as const)(
            'turns the $key off for the item that returns enabled: false, and not for the others',
            async ({ key, series, expected }) => {
                const { inPlace } = await create({ [key]: series, first: { [key]: { enabled: false } } });
                const cast = (shape: Shape) => (key === 'shadow' ? shape.fillShadow : shape.fillGlow);

                expect(isOn(cast(inPlace[0]))).toBe(false);
                for (const shape of inPlace.slice(1)) expect(cast(shape)).toMatchObject(expected(series));
            }
        );

        it('turns off the glow and keeps the shadow of an item that returns only the glow disabled', async () => {
            const { inPlace } = await create({
                shadow: SERIES_SHADOW,
                glow: SERIES_GLOW,
                first: { glow: { enabled: false } },
            });

            expect(isOn(inPlace[0].fillGlow)).toBe(false);
            expect(inPlace[0].fillShadow).toMatchObject(SERIES_SHADOW);
        });

        it('turns off a series glow from an item, whichever state the item is drawn in', async () => {
            const { inPlace, highlighted } = await create({
                glow: SERIES_GLOW,
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { glow: { enabled: false } },
            });

            // The hovered item has its glow off in place and in its highlight copy; the others keep the series glow.
            expect(isOn(inPlace[0].fillGlow)).toBe(false);
            expect(highlighted).toHaveLength(1);
            expect(isOn(highlighted[0].fillGlow)).toBe(false);
            expect(inPlace[1].fillGlow).toBeDefined();
        });
    });

    describe('the hovered item', () => {
        it('casts the glow of the styler, with every field set, from its highlight copy over the highlightedItem glow', async () => {
            const { highlighted } = await create({
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { glow: ITEM_GLOW },
            });

            expect(highlighted).toHaveLength(1);
            expect(highlighted[0].fillGlow).toMatchObject(glowShadow(ITEM_GLOW));
        });

        it('casts the glow of the styler from its highlight copy, over the highlightedItem glow', async () => {
            const { highlighted } = await create({
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { glow: { fill: '#ff00ff', blur: 20 } },
            });

            expect(highlighted).toHaveLength(1);
            expect(highlighted[0].fillGlow).toMatchObject(glowShadow({ ...HIGHLIGHT_GLOW, fill: '#ff00ff', blur: 20 }));
        });

        it('casts a bare glow: {} from the copy, with the highlightedItem glow for the fields it leaves unset', async () => {
            const { highlighted } = await create({
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { glow: {} },
            });

            expect(highlighted[0].fillGlow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
        });

        it('casts the glow in place of the unhovered items too, when the styler returns it for them', async () => {
            const { inPlace } = await create({
                highlight: { unhighlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                others: { glow: { fill: '#ff00ff' } },
            });

            // The `unhighlightedItem` glow is the base of the styler's glow for every other item.
            for (const shape of inPlace.slice(1)) {
                expect(shape.fillGlow).toMatchObject(glowShadow({ ...HIGHLIGHT_GLOW, fill: '#ff00ff' }));
            }
        });

        it('merges the shadow of the styler over the highlightedItem shadow, field by field, in place', async () => {
            const { inPlace } = await create({
                shadow: SERIES_SHADOW,
                highlight: { highlightedItem: { shadow: HIGHLIGHT_SHADOW } },
                hover: true,
                first: { shadow: { blur: 12 } },
            });

            expect(inPlace[0].fillShadow).toMatchObject({ ...HIGHLIGHT_SHADOW, blur: 12 });
        });

        it('casts the glow of the highlightedItem from the copy of an item whose styler returns none', async () => {
            const { highlighted } = await create({
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: {},
            });

            expect(highlighted).toHaveLength(1);
            expect(highlighted[0].fillGlow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
        });

        it('casts the glow of the styler from the copy when the highlight styles have no glow', async () => {
            const { highlighted } = await create({ hover: true, first: { glow: ITEM_GLOW } });

            expect(highlighted).toHaveLength(1);
            expect(highlighted[0].fillGlow).toMatchObject(glowShadow(ITEM_GLOW));
        });

        it('casts the shadow of the styler from the hovered item in place, and none from its highlight copy', async () => {
            const { inPlace, highlighted } = await create({
                shadow: SERIES_SHADOW,
                hover: true,
                first: { shadow: ITEM_SHADOW },
            });

            expect(inPlace[0].fillShadow).toMatchObject(ITEM_SHADOW);
            expect(highlighted).toHaveLength(1);
            expect(isOn(highlighted[0].fillShadow)).toBe(false);
        });

        it('casts the shadow of the styler from the hovered item in place when it branches on the highlightState', async () => {
            const { inPlace } = await create({
                hover: true,
                first: (highlightState) => (highlightState === 'highlighted-item' ? { shadow: ITEM_SHADOW } : {}),
            });

            expect(inPlace[0].fillShadow).toMatchObject(ITEM_SHADOW);
            for (const shape of inPlace.slice(1)) expect(isOn(shape.fillShadow)).toBe(false);
        });

        it('keeps the shadow of the highlightedItem on the hovered item when the styler disables it for the others', async () => {
            const { inPlace } = await create({
                shadow: SERIES_SHADOW,
                highlight: { highlightedItem: { shadow: HIGHLIGHT_SHADOW } },
                hover: true,
                first: (highlightState) =>
                    highlightState === 'unhighlighted-item' ? { shadow: { enabled: false } } : {},
            });

            expect(inPlace[0].fillShadow).toMatchObject(HIGHLIGHT_SHADOW);
        });

        it('can cast a glow in one state only, by branching on the highlightState', async () => {
            const { inPlace, highlighted } = await create({
                hover: true,
                first: (highlightState) => (highlightState === 'highlighted-item' ? { glow: ITEM_GLOW } : {}),
            });

            // The highlight layer's copy is the one drawn as the highlighted item; the in-place copy is not.
            expect(highlighted[0].fillGlow).toMatchObject(glowShadow(ITEM_GLOW));
            expect(isOn(inPlace[0].fillGlow)).toBe(false);
        });

        it('casts the glow of the styler in place again when the hover moves away', async () => {
            const { inPlace } = await create({
                glow: SERIES_GLOW,
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { glow: { blur: 9 } },
            });
            expect(isOn(inPlace[0].fillGlow)).toBe(false);

            chart.ctx.highlightManager.updateHighlight(chart.id);
            await waitForChartStability(chart);

            // Back in place, the item casts the glow of its styler over the series glow.
            expect(inPlace[0].fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 9 }));
            expect(inPlace[1].fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
        });
    });

    describe('the params and the shared objects', () => {
        it('gives the styler params neither a shadow nor a glow, in any highlight state', async () => {
            const params: object[] = [];
            await create({
                shadow: SERIES_SHADOW,
                glow: SERIES_GLOW,
                highlight: {
                    highlightedItem: { glow: HIGHLIGHT_GLOW },
                    unhighlightedItem: { glow: HIGHLIGHT_GLOW },
                    highlightedSeries: { glow: HIGHLIGHT_GLOW },
                    unhighlightedSeries: { glow: HIGHLIGHT_GLOW },
                },
                hover: true,
                styler: (itemParams) => {
                    params.push(itemParams);
                    return {};
                },
            });

            expect(params.length).toBeGreaterThan(testCase.data.length);
            for (const itemParams of params) {
                expect(itemParams).not.toHaveProperty('shadow');
                expect(itemParams).not.toHaveProperty('glow');
            }
        });

        it('gives the tooltip params neither a shadow nor a glow', async () => {
            const params: object[] = [];
            await create({
                shadow: SERIES_SHADOW,
                glow: SERIES_GLOW,
                styler: () => ({ shadow: ITEM_SHADOW, glow: ITEM_GLOW }),
                tooltipRenderer: (tooltipParams) => {
                    params.push(tooltipParams);
                    return {};
                },
            });
            getSeriesAt(chart).getTooltipContent(0, undefined);

            expect(params).toHaveLength(1);
            expect(params[0]).not.toHaveProperty('shadow');
            expect(params[0]).not.toHaveProperty('glow');
        });

        it('shares one object between the items that return equal values, and not with those that return another', async () => {
            const { inPlace } = await create({
                styler: (params) => {
                    // A new object per call, as caller code returns it; the third item differs by one field.
                    const blur = testCase.indexOf(params.datum) === 2 ? 13 : 9;
                    return { shadow: { ...ITEM_SHADOW, blur }, glow: { ...ITEM_GLOW, blur } };
                },
            });

            expect(inPlace[0].fillShadow).toBeDefined();
            expect(inPlace[1].fillShadow).toBe(inPlace[0].fillShadow);
            expect(inPlace[1].fillGlow).toBe(inPlace[0].fillGlow);
            expect(inPlace[2].fillShadow).not.toBe(inPlace[0].fillShadow);
            expect(inPlace[2].fillShadow).toMatchObject({ blur: 13 });
            expect(inPlace[2].fillGlow).toMatchObject({ blur: 13 });
        });

        it('does not serialise the casts again when the items update in a state that they were merged in', async () => {
            const cast: ItemCast = { shadow: { ...ITEM_SHADOW }, glow: { ...ITEM_GLOW } };
            const { inPlace } = await create({ shadow: SERIES_SHADOW, glow: SERIES_GLOW, styler: () => cast });
            const merged = [inPlace[0].fillShadow, inPlace[0].fillGlow];

            // Hovering then leaving makes the items update in each state once, and leaving returns to the first.
            const [datum] = getSeriesNodeData<HighlightNodeDatum>(chart);
            chart.ctx.highlightManager.updateHighlight(chart.id, datum);
            await waitForChartStability(chart);
            const castsSerialised = await countCastSerialisations(async () => {
                chart.ctx.highlightManager.updateHighlight(chart.id);
                await waitForChartStability(chart);
            });
            expect(castsSerialised).toBe(0);
            const after = shapesOf(getSeriesAt(chart).contentGroup, testCase.kind);
            expect([after[0].fillShadow, after[0].fillGlow]).toEqual(merged);
            expect(after[0].fillShadow).toBe(merged[0]);
            expect(after[0].fillGlow).toBe(merged[1]);
        });

        it('shares the series shadow and glow between the items of a series with no styler', async () => {
            const { inPlace } = await create({ shadow: SERIES_SHADOW, glow: SERIES_GLOW });

            expect(inPlace[0].fillShadow).toMatchObject(SERIES_SHADOW);
            expect(inPlace[0].fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
            for (const shape of inPlace.slice(1)) {
                expect(shape.fillShadow).toBe(inPlace[0].fillShadow);
                expect(shape.fillGlow).toBe(inPlace[0].fillGlow);
            }
        });

        it('casts what a series with no styler casts when the styler returns neither field', async () => {
            const plain = await create({ shadow: SERIES_SHADOW, glow: SERIES_GLOW });
            const plainShadow = plain.inPlace.map((shape) => shape.fillShadow);
            const plainGlow = plain.inPlace.map((shape) => shape.fillGlow);
            chart.destroy();

            const styled = await create({
                shadow: SERIES_SHADOW,
                glow: SERIES_GLOW,
                styler: () => ({ fillOpacity: 0.5 }),
            });

            expect(styled.inPlace.map((shape) => shape.fillShadow)).toEqual(plainShadow);
            expect(styled.inPlace.map((shape) => shape.fillGlow)).toEqual(plainGlow);
            for (const shape of styled.inPlace.slice(1)) {
                expect(shape.fillShadow).toBe(styled.inPlace[0].fillShadow);
                expect(shape.fillGlow).toBe(styled.inPlace[0].fillGlow);
            }
        });
    });

    describe('invalid values', () => {
        const INVALID_CASTS = [
            { key: 'shadow', series: SERIES_SHADOW, expected: (cast: AgDropShadowOptions) => cast },
            { key: 'glow', series: SERIES_GLOW, expected: glowShadow },
        ] as const;
        const castOf = (key: 'shadow' | 'glow', shape: Shape) => (key === 'shadow' ? shape.fillShadow : shape.fillGlow);

        it.each(INVALID_CASTS)('warns about an invalid $key and casts the series $key for that item', async (c) => {
            const { inPlace } = await create({
                [c.key]: c.series,
                first: { [c.key]: { blur: 'wide' } } as unknown as ItemCast,
            });

            expectWarningMessages([expect.stringContaining(c.key)]);
            expect(castOf(c.key, inPlace[0])).toMatchObject(c.expected(c.series));
        });

        it.each(INVALID_CASTS)(
            'casts nothing for an invalid $key over a disabled series $key, whatever else it holds',
            async (c) => {
                const { inPlace } = await create({
                    [c.key]: { ...c.series, enabled: false },
                    first: { [c.key]: { blur: 'wide', fill: '#00ff00' } } as unknown as ItemCast,
                });

                expectWarningMessages([expect.stringContaining(c.key)]);
                for (const shape of inPlace) expect(isOn(castOf(c.key, shape))).toBe(false);
            }
        );

        it('casts the series cast, not the valid fields of an invalid one, for that item', async () => {
            const { inPlace } = await create({
                shadow: SERIES_SHADOW,
                glow: SERIES_GLOW,
                first: {
                    shadow: { blur: 'wide', fill: '#00ff00' },
                    glow: { blur: 'wide', fill: '#00ff00' },
                } as unknown as ItemCast,
            });

            expect(inPlace[0].fillShadow).toMatchObject(SERIES_SHADOW);
            expect(inPlace[0].fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
        });

        it('falls back to the cascade for the invalid field only, and keeps the other that the styler returned', async () => {
            const { inPlace } = await create({
                shadow: SERIES_SHADOW,
                first: { shadow: { blur: 'wide' }, glow: ITEM_GLOW } as unknown as ItemCast,
            });

            expect(inPlace[0].fillShadow).toMatchObject(SERIES_SHADOW);
            expect(inPlace[0].fillGlow).toMatchObject(glowShadow(ITEM_GLOW));
        });
    });
});
