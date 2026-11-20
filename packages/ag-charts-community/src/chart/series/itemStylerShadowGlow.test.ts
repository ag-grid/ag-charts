import { afterEach, describe, expect, it, vi } from 'vitest';

import { Rect, Sector, Shape } from 'ag-charts-core';
import type { AgChartOptions, AgDropShadowOptions, AgGlowOptions } from 'ag-charts-types';

import type { Chart } from '../chart';
import { Marker } from '../marker/marker';
import { endHover, hoverDatum } from '../test/glowRender';
import { getSeriesAt } from '../test/seriesAccessors';
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
    countCastMerges,
    countCastSerialisations,
    expectParamsInState,
    glowShadow,
    isOn,
    recordParamsByHighlightState,
    shapesOf,
    spyOnCastMerges,
    themeShadow,
} from '../test/shadowFixtures';
import {
    createChart,
    deproxy,
    expectWarningMessages,
    prepareTestOptions,
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
    /** `count` rows of this series' data, each with a distinct `id`. */
    rows: (count: number) => Array<{ id: number }>;
}

const categoryRows = (count: number) =>
    Array.from({ length: count }, (_, id) => ({ id, category: `C${id}`, value: 1 + (id % 5) }));
const xyRows = (count: number) => Array.from({ length: count }, (_, id) => ({ id, x: id, y: 1 + (id % 5), size: 10 }));

const SERIES: SeriesCase[] = [
    {
        name: 'bar',
        data: CATEGORY_DATA,
        kind: Rect,
        rows: categoryRows,
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
        rows: xyRows,
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
        rows: xyRows,
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
        rows: categoryRows,
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
            data?: object[];
            /** The series' own data, which a chart update leaves alone when it is unchanged. */
            seriesData?: object[];
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
            data: opts.data ?? testCase.data,
            theme: opts.theme,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [
                {
                    ...testCase.series({ shadow: opts.shadow, glow: opts.glow, highlight: opts.highlight, itemStyler }),
                    data: opts.seriesData,
                    tooltip: opts.tooltipRenderer && { renderer: opts.tooltipRenderer },
                },
            ],
        } as AgChartOptions;
        chart = deproxy(await createChart(options));
        const series = getSeriesAt(chart);

        if (opts.hover) {
            await hoverDatum(chart);
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

            await endHover(chart);

            // Back in place, the item casts the glow of its styler over the series glow.
            expect(inPlace[0].fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 9 }));
            expect(inPlace[1].fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
        });
    });

    describe('the params and the shared objects', () => {
        it('gives the styler params the shadow and glow that the highlight state casts', async () => {
            const { byState, styler } = recordParamsByHighlightState();
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
                styler,
            });

            expect([...byState.values()].flat().length).toBeGreaterThan(testCase.data.length);
            expectParamsInState(byState, 'highlighted-item', { shadow: SERIES_SHADOW, glow: HIGHLIGHT_GLOW });
        });

        describe('by highlight state', () => {
            const UNHIGHLIGHT_GLOW: AgGlowOptions = {
                enabled: true,
                fill: '#0000ff',
                fillOpacity: 0.3,
                blur: 7,
                spread: 1,
            };

            /** Every call of the styler while one item is hovered, by the highlight state that it was called in. */
            const paramsByState = async (opts: Parameters<typeof create>[0]) => {
                const { byState, styler } = recordParamsByHighlightState();
                await create({ hover: true, ...opts, styler });
                return byState;
            };

            it('gives each call the shadow and glow that its own highlight state casts', async () => {
                const byState = await paramsByState({
                    shadow: SERIES_SHADOW,
                    glow: SERIES_GLOW,
                    highlight: {
                        highlightedItem: { shadow: HIGHLIGHT_SHADOW, glow: HIGHLIGHT_GLOW },
                        unhighlightedItem: { glow: UNHIGHLIGHT_GLOW },
                    },
                });

                expectParamsInState(byState, 'highlighted-item', { shadow: HIGHLIGHT_SHADOW, glow: HIGHLIGHT_GLOW });
                expectParamsInState(byState, 'unhighlighted-item', { shadow: SERIES_SHADOW, glow: UNHIGHLIGHT_GLOW });
            });

            it('leaves the shadow and glow unset where nothing in the cascade sets them', async () => {
                const byState = await paramsByState({});

                expect([...byState.keys()]).toContain('highlighted-item');
                for (const itemParams of [...byState.values()].flat()) {
                    expect(itemParams.shadow).toBeUndefined();
                    expect(itemParams.glow).toBeUndefined();
                }
            });

            it('leaves the glow unset in a state that casts none, with the glow set in another', async () => {
                const byState = await paramsByState({ highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } } });

                expectParamsInState(byState, 'highlighted-item', { glow: HIGHLIGHT_GLOW });
                expectParamsInState(byState, 'unhighlighted-item', {});
                for (const itemParams of byState.get('unhighlighted-item') ?? []) {
                    expect(itemParams.glow).toBeUndefined();
                }
            });

            it('gives every item in a state the same shadow and glow objects', async () => {
                const byState = await paramsByState({
                    shadow: SERIES_SHADOW,
                    glow: SERIES_GLOW,
                    highlight: { unhighlightedItem: { glow: UNHIGHLIGHT_GLOW } },
                });

                const unhighlighted = byState.get('unhighlighted-item') ?? [];
                expect(unhighlighted.length).toBeGreaterThan(1);
                expect(unhighlighted[0].glow).toBeDefined();
                expect(unhighlighted[0].shadow).toBeDefined();
                for (const itemParams of unhighlighted) {
                    expect(itemParams.glow).toBe(unhighlighted[0].glow);
                    expect(itemParams.shadow).toBe(unhighlighted[0].shadow);
                }
            });
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
            await hoverDatum(chart);
            const castsSerialised = await countCastSerialisations(async () => {
                await endHover(chart);
            });
            expect(castsSerialised).toBe(0);
            const after = shapesOf(getSeriesAt(chart).contentGroup, testCase.kind);
            expect([after[0].fillShadow, after[0].fillGlow]).toEqual(merged);
            expect(after[0].fillShadow).toBe(merged[0]);
            expect(after[0].fillGlow).toBe(merged[1]);
        });

        it('builds no merge when the items update in a state that they were merged in', async () => {
            const cast: ItemCast = { shadow: { ...ITEM_SHADOW }, glow: { ...ITEM_GLOW } };
            await create({ shadow: SERIES_SHADOW, glow: SERIES_GLOW, styler: () => cast });

            const hoverAndLeave = async () => {
                await hoverDatum(chart);
                await endHover(chart);
            };
            await hoverAndLeave();

            expect(await countCastMerges(getSeriesAt(chart), hoverAndLeave)).toBe(0);
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

    describe('the cap on distinct casts', () => {
        const CAP = 16;
        const blurOf = (shape: Shape) => (shape.fillShadow as { blur?: number } | undefined)?.blur;
        /** A styler that casts a shadow whose blur is `blurFor(id)`, so that items with equal blurs cast equal shadows. */
        const blurBy = (blurFor: (id: number) => number) => (params: any) => ({
            shadow: { ...ITEM_SHADOW, blur: blurFor(params.datum.id) },
        });
        const capWarning = expect.stringMatching(new RegExp(`${CAP}.*distinct`));

        it('casts every distinct shadow up to the cap, with no warning', async () => {
            const { inPlace } = await create({
                data: testCase.rows(CAP),
                shadow: SERIES_SHADOW,
                styler: blurBy((id) => id + 1),
            });

            expect(inPlace.map(blurOf)).toEqual(Array.from({ length: CAP }, (_, id) => id + 1));
            expectWarningMessages([]);
        });

        it('casts the series shadow for the distinct shadows past the cap, with one warning naming the series and the cap', async () => {
            const { inPlace } = await create({
                data: testCase.rows(CAP + 4),
                shadow: SERIES_SHADOW,
                styler: blurBy((id) => id + 1),
            });

            expect(inPlace).toHaveLength(CAP + 4);
            expect(inPlace.slice(0, CAP).map(blurOf)).toEqual(Array.from({ length: CAP }, (_, id) => id + 1));
            for (const shape of inPlace.slice(CAP)) expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
            expectWarningMessages([
                expect.stringContaining(`series '${getSeriesAt(chart).id}' has more than ${CAP} distinct`),
            ]);
        });

        it('casts no shadow for the distinct shadows past the cap when the series casts none', async () => {
            const { inPlace } = await create({ data: testCase.rows(CAP + 1), styler: blurBy((id) => id + 1) });

            expect(inPlace.slice(0, CAP).every((shape) => isOn(shape.fillShadow))).toBe(true);
            expect(isOn(inPlace[CAP].fillShadow)).toBe(false);
        });

        it('casts the glow of the series for the distinct glows past the cap', async () => {
            const { inPlace } = await create({
                data: testCase.rows(CAP + 1),
                glow: SERIES_GLOW,
                styler: (params) => ({ glow: { blur: params.datum.id + 1 } }),
            });

            expect(inPlace[CAP - 1].fillGlow).toMatchObject({ blur: CAP });
            expect(inPlace[CAP].fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
            expectWarningMessages([capWarning]);
        });

        it('counts the shadows and glows of a series together', async () => {
            const { inPlace } = await create({
                data: testCase.rows(CAP),
                shadow: SERIES_SHADOW,
                glow: SERIES_GLOW,
                styler: (params) => ({
                    shadow: { ...ITEM_SHADOW, blur: params.datum.id + 1 },
                    glow: { blur: params.datum.id + 1 },
                }),
            });

            // Each of the 16 items casts a distinct shadow and a distinct glow: 32 casts, so the later ones fall back.
            expect(inPlace[0].fillShadow).toMatchObject({ blur: 1 });
            expect(inPlace[0].fillGlow).toMatchObject({ blur: 1 });
            expect(inPlace[CAP - 1].fillShadow).toMatchObject(SERIES_SHADOW);
            expectWarningMessages([capWarning]);
        });

        it('counts equal shadows once, however many items cast them', async () => {
            const { inPlace } = await create({
                data: testCase.rows(CAP * 3),
                shadow: SERIES_SHADOW,
                styler: blurBy((id) => (id % CAP) + 1),
            });

            expect(inPlace.map(blurOf)).toEqual(Array.from({ length: CAP * 3 }, (_, id) => (id % CAP) + 1));
            expectWarningMessages([]);
        });

        it('keeps casting a shadow that it has merged once the cap is reached', async () => {
            // The first 16 ids are distinct; the later items repeat the first one's shadow, which still counts as merged.
            const { inPlace } = await create({
                data: testCase.rows(CAP + 2),
                shadow: SERIES_SHADOW,
                styler: blurBy((id) => (id < CAP ? id + 1 : 1)),
            });

            expect(blurOf(inPlace[CAP])).toBe(1);
            expect(blurOf(inPlace[CAP + 1])).toBe(1);
            expectWarningMessages([]);
        });

        it('casts the same fallback for an item past the cap whenever it updates, with no second warning', async () => {
            const { inPlace } = await create({
                data: testCase.rows(CAP + 1),
                shadow: SERIES_SHADOW,
                styler: blurBy((id) => id + 1),
            });
            const fallback = inPlace[CAP].fillShadow;

            await hoverDatum(chart);
            await endHover(chart);

            expect(inPlace[CAP].fillShadow).toBe(fallback);
            expect(fallback).toMatchObject(SERIES_SHADOW);
            expectWarningMessages([capWarning]);
        });

        describe.each([
            { key: 'shadow', highlighted: HIGHLIGHT_SHADOW },
            { key: 'glow', highlighted: HIGHLIGHT_GLOW },
        ] as const)('with a $key set on the hovered item', ({ key, highlighted }) => {
            it(`counts each of ${CAP} distinct values once, however many items are hovered`, async () => {
                const { inPlace } = await create({
                    data: testCase.rows(CAP),
                    shadow: SERIES_SHADOW,
                    glow: SERIES_GLOW,
                    highlight: { highlightedItem: { [key]: highlighted } },
                    styler: (params) => ({
                        [key]: { ...(key === 'shadow' ? ITEM_SHADOW : ITEM_GLOW), blur: params.datum.id + 1 },
                    }),
                });
                const blursOf = () =>
                    inPlace.map(
                        (shape) => (shape[key === 'shadow' ? 'fillShadow' : 'fillGlow'] as { blur?: number })?.blur
                    );
                const stylerBlurs = Array.from({ length: CAP }, (_, id) => id + 1);

                for (let datumIndex = 0; datumIndex < 6; datumIndex++) await hoverDatum(chart, 0, datumIndex);
                // The hovered item of a glow casts it on its highlight copy, so the others are the ones to read.
                const hovered = 5;
                expect(blursOf().filter((_, id) => id !== hovered)).toEqual(
                    stylerBlurs.filter((_, id) => id !== hovered)
                );

                await endHover(chart);
                expect(blursOf()).toEqual(stylerBlurs);
                expectWarningMessages([]);
            });
        });

        it('warns once for each series that passes the cap', async () => {
            const data = testCase.rows(CAP + 1);
            const styler = blurBy((id) => id + 1);
            chart = deproxy(
                await createChart({
                    data,
                    animation: { enabled: false },
                    legend: { enabled: false },
                    series: [testCase.series({ itemStyler: styler }), testCase.series({ itemStyler: styler })],
                } as AgChartOptions)
            );

            const warnings = vi
                .mocked(console.warn)
                .mock.calls.map(([message]) => String(message))
                .filter((message) => message.includes('distinct item styler'));
            expect(warnings).toEqual([
                expect.stringContaining(`series '${getSeriesAt(chart, 0).id}'`),
                expect.stringContaining(`series '${getSeriesAt(chart, 1).id}'`),
            ]);
            // Both series share one scene; the legend's colour warning is not what this case is about.
            vi.mocked(console.warn).mockClear();
        });

        it.each([
            ['no styler', undefined],
            [
                'a styler that returns neither shadow nor glow',
                (params: any) => ({ fillOpacity: 0.1 + (params.datum.id % 9) / 10 }),
            ],
        ])('counts nothing for a series with %s', async (_name, styler) => {
            // Counting starts before the chart exists, so that creation is covered as well as the updates.
            const merges = spyOnCastMerges();
            try {
                const { inPlace } = await create({
                    data: testCase.rows(CAP * 2),
                    shadow: SERIES_SHADOW,
                    glow: SERIES_GLOW,
                    styler,
                });
                const expectSeriesCast = (shapes: Shape[]) => {
                    for (const shape of shapes) {
                        expect(shape.fillShadow).toBe(shapes[0].fillShadow);
                        expect(shape.fillGlow).toBe(shapes[0].fillGlow);
                    }
                    expect(shapes[0].fillShadow).toMatchObject(SERIES_SHADOW);
                    expect(shapes[0].fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
                };

                expect(inPlace).toHaveLength(CAP * 2);
                expectSeriesCast(inPlace);

                await hoverDatum(chart);
                await endHover(chart);
                expectSeriesCast(shapesOf(getSeriesAt(chart).contentGroup, testCase.kind));

                expect(merges.count()).toBe(0);
                expectWarningMessages([]);
            } finally {
                merges.restore();
                chart.destroy();
            }
        });

        describe('when the cap has been reached and', () => {
            const first = blurBy((id) => id + 1);
            const rows = () => testCase.rows(CAP + 1);

            /** Updates the chart with `data` and `itemStyler`, then reads what the items cast. */
            const update = async (data: object[], itemStyler: (params: any) => object, seriesData?: object[]) => {
                const options = {
                    data,
                    animation: { enabled: false },
                    legend: { enabled: false },
                    series: [{ ...testCase.series({ shadow: SERIES_SHADOW, itemStyler }), data: seriesData }],
                } as AgChartOptions;
                await chart.publicApi!.update(prepareTestOptions(options));
                await waitForChartStability(chart);
                return shapesOf(getSeriesAt(chart).contentGroup, testCase.kind);
            };

            it('only the data changes, it counts the distinct shadows afresh', async () => {
                const { inPlace } = await create({ data: rows(), shadow: SERIES_SHADOW, styler: first });
                expect(inPlace[CAP].fillShadow).toMatchObject(SERIES_SHADOW);
                expectWarningMessages([capWarning]);

                // The same styler, on 16 rows whose ids, and so shadows, are all new: none could be cast if the old ones still counted.
                const next = testCase.rows(CAP).map((row) => ({ ...row, id: row.id + 20 }));
                const after = await update(next, first);

                expect(after.map(blurOf)).toEqual(Array.from({ length: CAP }, (_, id) => id + 21));
                expectWarningMessages([]);
            });

            it('only the styler changes, it counts the distinct shadows afresh', async () => {
                // The data is the series' own, and one array: a chart update with the same data is not a data change
                // for the series, so only its options change between the two updates.
                const seriesData = rows();
                const { inPlace } = await create({ seriesData, shadow: SERIES_SHADOW, styler: first });
                expect(inPlace[CAP].fillShadow).toMatchObject(SERIES_SHADOW);
                expectWarningMessages([capWarning]);

                // 16 distinct values, all new: none could be cast if the shadows of the old styler still counted.
                const after = await update(
                    [],
                    blurBy((id) => (id % CAP) + 20),
                    seriesData
                );

                expect(after.map(blurOf)).toEqual(Array.from({ length: CAP + 1 }, (_, id) => (id % CAP) + 20));
                expectWarningMessages([]);
            });
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

        describe.each([
            ['with a series cast', true],
            ['with no series cast', false],
        ])('on the hovered item, %s', (_name, hasSeriesCast) => {
            const hovered = {
                ...(hasSeriesCast ? { shadow: SERIES_SHADOW, glow: SERIES_GLOW } : {}),
                highlight: { highlightedItem: { shadow: HIGHLIGHT_SHADOW, glow: HIGHLIGHT_GLOW } },
                hover: true,
            };
            const castsOf = (shapes: { inPlace: Shape[]; highlighted: Shape[] }) => [
                ...shapes.inPlace.map((shape) => shape.fillShadow),
                ...shapes.highlighted.map((shape) => shape.fillShadow),
                ...shapes.inPlace.map((shape) => shape.fillGlow),
                ...shapes.highlighted.map((shape) => shape.fillGlow),
            ];

            it.each(INVALID_CASTS)(
                'casts what the styler returning no $key does, not the series $key or the valid fields of an invalid one',
                async (c) => {
                    const plain = await create({ ...hovered, first: {} });
                    const expected = castsOf(plain);
                    chart.destroy();

                    const styled = await create({
                        ...hovered,
                        first: { [c.key]: { blur: 'wide', fill: '#00ff00' } } as unknown as ItemCast,
                    });

                    expectWarningMessages([expect.stringContaining(c.key)]);
                    expect(styled.highlighted).toHaveLength(1);
                    expect(castsOf(styled)).toEqual(expected);
                    // The hovered item casts the highlight cast, which is not the series one.
                    const hoveredCast =
                        c.key === 'shadow' ? styled.inPlace[0].fillShadow : styled.highlighted[0].fillGlow;
                    expect(hoveredCast).toMatchObject(
                        c.expected(c.key === 'shadow' ? HIGHLIGHT_SHADOW : HIGHLIGHT_GLOW)
                    );
                }
            );

            it.each(INVALID_CASTS)('keeps the other cast, when it is valid, beside an invalid $key', async (c) => {
                const other = c.key === 'shadow' ? 'glow' : 'shadow';
                const valid = other === 'glow' ? ITEM_GLOW : ITEM_SHADOW;
                const plain = await create({ ...hovered, first: { [other]: valid } });
                const expected = castsOf(plain);
                chart.destroy();

                const styled = await create({
                    ...hovered,
                    first: { [c.key]: { blur: 'wide' }, [other]: valid } as unknown as ItemCast,
                });

                expect(castsOf(styled)).toEqual(expected);
            });
        });

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
