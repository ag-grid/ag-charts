import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgDropShadowOptions, AgGlowOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    HIGHLIGHT_GLOW,
    HIGHLIGHT_SHADOW,
    ITEM_GLOW,
    ITEM_SHADOW,
    type ItemCast,
    SERIES_GLOW,
    THEME_GLOW,
    countCastMerges,
    countCastSerialisations,
    endHover,
    expectParamsInState,
    expectWarningMessages,
    getSeriesAt,
    getSeriesSelectionNodes,
    glowShadow,
    hoverDatum,
    hoverNode,
    isOn,
    recordParamsByHighlightState,
    resetMockConsole,
    setupMockCanvas,
    setupMockConsole,
    themeShadow,
} from 'ag-charts-community-test';
import { Rect, Sector } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';

import { getFlowLinkData, getSeriesGroup } from '../test/enterpriseSeriesAccessors';
import { getHierarchyRootNode } from '../test/seriesAccessors';
import { HIERARCHY_SHADOW_DATA, SHADOW, collectShapes, createEnterpriseChart } from '../test/utils';
import type { HierarchyNode } from './hierarchy/hierarchySeries';
import { SankeyLink } from './sankey/sankeyLink';

type HighlightNodeDatum = _ModuleSupport.HighlightNodeDatum;

const FLOW_DATA = [
    { from: 'A', to: 'C', size: 8 },
    { from: 'A', to: 'D', size: 4 },
    { from: 'B', to: 'C', size: 5 },
    { from: 'B', to: 'D', size: 7 },
];

/** What a glow with no fields of its own casts on a hierarchy tile: flush, with no blur, in the neutral colour (Defaults sheet). */
const TILE_THEME_GLOW = { ...THEME_GLOW, fillOpacity: 1, blur: 0, spread: 1, gap: 0 };

const hierarchyRoot = (chart: AgChartInstance): HierarchyNode => {
    const root = getHierarchyRootNode(chart);
    if (root == null) throw new Error('the hierarchy series has no root node');
    return root;
};
const leavesOf = (chart: AgChartInstance) => {
    const leaves: HierarchyNode[] = [];
    for (const node of hierarchyRoot(chart)) if (node.children.length === 0) leaves.push(node);
    return leaves;
};

interface Layers {
    /** The in-place shapes of the items, the first being the item whose styler result the case sets. */
    inPlace: Shape[];
    /** The visible shapes of the highlight layer. */
    highlighted: Shape[];
}

interface Case {
    name: string;
    /** The series, with the styler on the part it belongs to and the cast options where this series reads them from. */
    series: (opts: {
        shadow?: AgDropShadowOptions;
        glow?: AgGlowOptions;
        highlight?: object;
        itemStyler: (params: any) => object;
    }) => object;
    data: object[];
    /** For the series that read their glow from a cascade shared by the slot: `count` leaves, named `L0`, `L1`, and so on. */
    leaves?: (count: number) => object[];
    /** Whether the styler is called for the item whose result the test sets. */
    isFirst: (params: any) => boolean;
    /** The datum to hover: the first item. */
    hover: (chart: AgChartInstance) => HighlightNodeDatum | undefined;
    layers: (chart: AgChartInstance) => Layers;
    /** The slot of a shape that holds the glow it casts: the glow slot, or the shadow slot of a series with one slot per item. */
    glowSlot: 'fillGlow' | 'fillShadow';
    /** A series with one slot per item shows its glow in place of its shadow; others cast both. */
    oneSlot: boolean;
    /** Whether the series has a series-level `glow` option; the hierarchy series take a glow from their highlight styles only. */
    seriesGlow: boolean;
    /** What a glow with no fields of its own casts for this series. */
    themeGlow: typeof THEME_GLOW;
}

const visible = (shapes: Iterable<Shape>, kind: abstract new (...args: never[]) => Shape) =>
    [...shapes].filter((shape) => (shape.constructor as unknown) === kind && shape.visible);

const hierarchyLayers =
    (kind: abstract new (...args: never[]) => Shape) =>
    (chart: AgChartInstance): Layers => {
        // Leaves only: a group of a treemap is a shape of the same kind in the same selection.
        const leaves = (name: 'datumSelection' | 'highlightGlowSelection') =>
            visible(getSeriesSelectionNodes<Shape<HierarchyNode>>(chart, name), kind).filter(
                (shape) => !(shape as Shape<HierarchyNode>).datum?.hasChildren
            );
        return { inPlace: leaves('datumSelection'), highlighted: leaves('highlightGlowSelection') };
    };

const CASES: Case[] = [
    {
        name: 'sankey link',
        data: FLOW_DATA,
        glowSlot: 'fillGlow',
        oneSlot: false,
        seriesGlow: true,
        themeGlow: THEME_GLOW,
        isFirst: (params) => params.datum.from === 'A' && params.datum.to === 'C',
        hover: (chart) => getFlowLinkData(chart)[0],
        series: ({ shadow, glow, highlight, itemStyler }) => ({
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            link: { shadow, glow, itemStyler },
            highlight,
        }),
        layers: (chart) => ({
            inPlace: visible(collectShapes(getSeriesAt(chart).contentGroup), SankeyLink),
            highlighted: visible(collectShapes(getSeriesGroup(chart, 'highlightLinkGroup')), SankeyLink),
        }),
    },
    {
        name: 'treemap tile',
        data: HIERARCHY_SHADOW_DATA,
        leaves: (count) => [
            { name: 'Root', children: Array.from({ length: count }, (_, id) => ({ name: `L${id}`, size: 10 })) },
        ],
        glowSlot: 'fillGlow',
        oneSlot: false,
        seriesGlow: true,
        themeGlow: TILE_THEME_GLOW,
        isFirst: (params) => params.datum.name === 'A1',
        hover: (chart) => leavesOf(chart)[0],
        series: ({ shadow, glow, highlight, itemStyler }) => ({
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'size',
            tile: { shadow, glow, highlight },
            itemStyler,
        }),
        layers: hierarchyLayers(Rect),
    },
    {
        name: 'sunburst',
        data: HIERARCHY_SHADOW_DATA,
        leaves: (count) => [
            { name: 'Root', children: Array.from({ length: count }, (_, id) => ({ name: `L${id}`, size: 10 })) },
        ],
        glowSlot: 'fillGlow',
        oneSlot: false,
        seriesGlow: true,
        themeGlow: TILE_THEME_GLOW,
        isFirst: (params) => params.datum.name === 'A1',
        hover: (chart) => leavesOf(chart)[0],
        series: ({ shadow, glow, highlight, itemStyler }) => ({
            type: 'sunburst',
            labelKey: 'name',
            sizeKey: 'size',
            shadow,
            glow,
            highlight,
            itemStyler,
        }),
        layers: hierarchyLayers(Sector),
    },
];

describe.each(CASES)('itemStyler shadow and glow ($name)', (testCase) => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const create = async (
        opts: {
            shadow?: AgDropShadowOptions;
            glow?: AgGlowOptions;
            highlight?: object;
            hover?: boolean;
            first?: ItemCast;
            styler?: (params: any) => object;
            data?: object[];
        } = {}
    ) => {
        const { first = {} } = opts;
        const itemStyler = opts.styler ?? ((params: any) => (testCase.isFirst(params) ? first : {}));
        chart = await createEnterpriseChart({
            data: opts.data ?? testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [testCase.series({ ...opts, itemStyler })],
        } as AgChartOptions);

        if (opts.hover) {
            await hoverNode(chart, testCase.hover(chart));
        }
        return testCase.layers(chart);
    };

    // A series with one slot per item holds the glow where it would hold the shadow; the shadow is cast where it has no glow.
    const glowOf = (shape: Shape) => shape[testCase.glowSlot];
    const highlightGlowOf = (shape: Shape) => shape[testCase.glowSlot];

    describe('override', () => {
        it('casts the shadow that the styler returns for an item, and the series shadow for the others', async () => {
            const { inPlace } = await create({ shadow: SHADOW, first: { shadow: ITEM_SHADOW } });

            expect(inPlace.length).toBeGreaterThan(1);
            expect(inPlace[0].fillShadow).toMatchObject(ITEM_SHADOW);
            for (const shape of inPlace.slice(1)) expect(shape.fillShadow).toMatchObject(SHADOW);
        });

        it('fills the fields that neither the styler nor the series set from the theme shadow', async () => {
            const { inPlace } = await create({ first: { shadow: { blur: 8 } } });

            expect(inPlace[0].fillShadow).toMatchObject({ ...themeShadow(0.5), blur: 8 });
        });

        it('casts the glow that the styler returns for an item, and none for the others', async () => {
            const { inPlace } = await create({ first: { glow: ITEM_GLOW } });

            expect(glowOf(inPlace[0])).toMatchObject(glowShadow(ITEM_GLOW));
            for (const shape of inPlace.slice(1)) expect(isOn(glowOf(shape))).toBe(false);
        });

        it.runIf(testCase.seriesGlow)(
            'merges the glow of the styler over the series glow, field by field',
            async () => {
                const { inPlace } = await create({ glow: SERIES_GLOW, first: { glow: { blur: 9 } } });

                expect(glowOf(inPlace[0])).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 9 }));
                for (const shape of inPlace.slice(1)) expect(glowOf(shape)).toMatchObject(glowShadow(SERIES_GLOW));
            }
        );

        it.runIf(testCase.seriesGlow)(
            'turns on a bare glow: {} over a disabled series glow, which keeps none of its fields',
            async () => {
                // Option normalisation strips every field of an option object that has `enabled: false`.
                const { inPlace } = await create({ glow: { ...SERIES_GLOW, enabled: false }, first: { glow: {} } });

                expect(glowOf(inPlace[0])).toMatchObject(glowShadow(testCase.themeGlow));
                for (const shape of inPlace.slice(1)) expect(isOn(glowOf(shape))).toBe(false);
            }
        );

        it('keeps the theme glow for the fields that a partial glow leaves unset, with no series glow', async () => {
            const { inPlace } = await create({ first: { glow: { blur: 7 } } });

            expect(glowOf(inPlace[0])).toMatchObject(glowShadow({ ...testCase.themeGlow, blur: 7 }));
            for (const shape of inPlace.slice(1)) expect(isOn(glowOf(shape))).toBe(false);
        });

        it.each([
            ['no series shadow', undefined],
            ['a disabled series shadow, which keeps none of its fields', { ...SHADOW, enabled: false }],
        ])(
            'keeps the theme shadow for the fields that a partial shadow leaves unset, over %s',
            async (_name, shadow) => {
                const { inPlace } = await create({ shadow, first: { shadow: { blur: 12 } } });

                expect(inPlace[0].fillShadow).toEqual({ ...themeShadow(0.5), blur: 12 });
                for (const shape of inPlace.slice(1)) expect(isOn(shape.fillShadow)).toBe(false);
            }
        );

        it('casts a shadow and a glow together from a series that has a slot for each', async () => {
            const { inPlace } = await create({ first: { shadow: ITEM_SHADOW, glow: ITEM_GLOW } });

            expect(glowOf(inPlace[0])).toMatchObject(glowShadow(ITEM_GLOW));
            if (testCase.oneSlot) return;
            expect(inPlace[0].fillShadow).toMatchObject(ITEM_SHADOW);
        });

        it('shares one object between the items that return equal values', async () => {
            const { inPlace } = await create({
                styler: () => ({ shadow: { ...ITEM_SHADOW }, glow: { ...ITEM_GLOW } }),
            });

            for (const shape of inPlace.slice(1)) {
                expect(shape.fillShadow).toBe(inPlace[0].fillShadow);
                expect(shape.fillGlow).toBe(inPlace[0].fillGlow);
            }
        });
    });

    describe('disable', () => {
        it('turns the shadow off for the item that returns enabled: false, and not for the others', async () => {
            const { inPlace } = await create({ shadow: SHADOW, first: { shadow: { enabled: false } } });

            expect(isOn(inPlace[0].fillShadow)).toBe(false);
            for (const shape of inPlace.slice(1)) expect(shape.fillShadow).toMatchObject(SHADOW);
        });

        it.runIf(testCase.seriesGlow)(
            'turns the glow off for the item that returns enabled: false, and not for the others',
            async () => {
                const { inPlace } = await create({ glow: SERIES_GLOW, first: { glow: { enabled: false } } });

                expect(isOn(glowOf(inPlace[0]))).toBe(false);
                for (const shape of inPlace.slice(1)) expect(glowOf(shape)).toMatchObject(glowShadow(SERIES_GLOW));
            }
        );
    });

    describe('invalid values', () => {
        it.each(['shadow', 'glow'] as const)(
            'casts nothing for an invalid %s over a disabled series %s, whatever else it holds',
            async (key) => {
                const disabled = key === 'shadow' ? { ...SHADOW, enabled: false } : { ...SERIES_GLOW, enabled: false };
                const { inPlace } = await create({
                    // A series with no series-level `glow` has no cast to disable.
                    [key]: key === 'glow' && !testCase.seriesGlow ? undefined : disabled,
                    first: { [key]: { blur: 'wide', fill: '#00ff00' } } as unknown as ItemCast,
                });

                expectWarningMessages([expect.stringContaining(key)]);
                for (const shape of inPlace)
                    expect(isOn(key === 'shadow' ? shape.fillShadow : glowOf(shape))).toBe(false);
            }
        );

        it('casts the series shadow, not the valid fields of an invalid one, for that item', async () => {
            const { inPlace } = await create({
                shadow: SHADOW,
                first: { shadow: { blur: 'wide', fill: '#00ff00' } } as unknown as ItemCast,
            });

            expectWarningMessages([expect.stringContaining('shadow')]);
            expect(inPlace[0].fillShadow).toMatchObject(SHADOW);
        });

        it.runIf(testCase.seriesGlow)(
            'casts the series glow, not the valid fields of an invalid one, for that item',
            async () => {
                const { inPlace } = await create({
                    glow: SERIES_GLOW,
                    first: { glow: { blur: 'wide', fill: '#00ff00' } } as unknown as ItemCast,
                });

                expectWarningMessages([expect.stringContaining('glow')]);
                expect(glowOf(inPlace[0])).toMatchObject(glowShadow(SERIES_GLOW));
            }
        );
    });

    describe('the merged casts', () => {
        it('does not serialise the casts again when the items update in a state that they were merged in', async () => {
            const cast: ItemCast = { shadow: { ...ITEM_SHADOW }, glow: { ...ITEM_GLOW } };
            const { inPlace } = await create({ shadow: SHADOW, styler: () => cast });
            const merged = [inPlace[0].fillShadow, glowOf(inPlace[0])];

            // Hovering then leaving makes the items update in each state once, and leaving returns to the first.
            await hoverNode(chart, testCase.hover(chart));
            const castsSerialised = await countCastSerialisations(() => endHover(chart));
            expect(castsSerialised).toBe(0);
            const after = testCase.layers(chart).inPlace[0];
            expect(after.fillShadow).toBe(merged[0]);
            expect(glowOf(after)).toBe(merged[1]);
        });
    });

    describe('the recalled casts', () => {
        it('builds no merge when the items update in a state that they were merged in', async () => {
            const cast: ItemCast = { shadow: { ...ITEM_SHADOW }, glow: { ...ITEM_GLOW } };
            await create({ shadow: SHADOW, styler: () => cast });

            const hoverAndLeave = async () => {
                await hoverNode(chart, testCase.hover(chart));
                await endHover(chart);
            };
            await hoverAndLeave();

            expect(await countCastMerges(getSeriesAt(chart), hoverAndLeave)).toBe(0);
        });
    });

    describe('the hovered item', () => {
        it('casts the shadow of the styler from the hovered item in place when it branches on the highlightState', async () => {
            const { inPlace } = await create({
                hover: true,
                styler: (params) =>
                    testCase.isFirst(params) && params.highlightState === 'highlighted-item'
                        ? { shadow: ITEM_SHADOW }
                        : {},
            });

            expect(inPlace[0].fillShadow).toMatchObject(ITEM_SHADOW);
        });

        it('casts the glow of the styler from the glow-only copy, with every field the styler sets', async () => {
            const { highlighted } = await create({
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { glow: ITEM_GLOW },
            });

            expect(highlighted).toHaveLength(1);
            expect(highlightGlowOf(highlighted[0])).toMatchObject(glowShadow(ITEM_GLOW));
        });

        it('casts the glow of the highlightedItem from the copy of an item whose styler returns none', async () => {
            const { highlighted } = await create({
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
            });

            expect(highlighted).toHaveLength(1);
            expect(highlightGlowOf(highlighted[0])).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
        });

        it('merges a partial glow of the styler over the highlightedItem glow, field by field', async () => {
            const { highlighted } = await create({
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { glow: { blur: 20 } },
            });

            expect(highlighted).toHaveLength(1);
            expect(highlightGlowOf(highlighted[0])).toMatchObject(glowShadow({ ...HIGHLIGHT_GLOW, blur: 20 }));
        });

        it('casts no glow from the copy when the styler turns the glow off for the item', async () => {
            const { highlighted } = await create({
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { glow: { enabled: false } },
            });

            expect(highlighted).toHaveLength(1);
            expect(isOn(highlightGlowOf(highlighted[0]))).toBe(false);
        });

        it.each(['shadow', 'glow'] as const)(
            'casts what a styler returning no %s casts, for an item that is hovered and has an invalid one',
            async (key) => {
                const hovered = {
                    highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW, shadow: HIGHLIGHT_SHADOW } },
                    hover: true,
                };
                const castsOf = ({ inPlace, highlighted }: Layers) =>
                    [...inPlace, ...highlighted].flatMap((shape) => [shape.fillShadow, glowOf(shape)]);
                const expected = castsOf(await create({ ...hovered, first: {} }));
                chart.destroy();

                const styled = await create({
                    ...hovered,
                    first: { [key]: { blur: 'wide', fill: '#00ff00' } } as unknown as ItemCast,
                });

                // The invalid cast warns once per call of the styler, which varies by series; the warning is asserted above.
                resetMockConsole();
                expect(castsOf(styled)).toEqual(expected);
            }
        );

        it('keeps the shadow of the styler on the hovered item in place', async () => {
            const { inPlace } = await create({
                shadow: SHADOW,
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { shadow: ITEM_SHADOW },
            });

            expect(inPlace[0].fillShadow).toMatchObject(ITEM_SHADOW);
        });

        it('gives the styler params the shadow and glow that the highlight state casts', async () => {
            const { byState, styler } = recordParamsByHighlightState();
            await create({
                shadow: SHADOW,
                glow: testCase.seriesGlow ? SERIES_GLOW : undefined,
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW }, unhighlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                styler,
            });

            expect([...byState.values()].flat().length).toBeGreaterThan(testCase.data.length);
            expectParamsInState(byState, 'highlighted-item', { shadow: SHADOW, glow: HIGHLIGHT_GLOW });
        });

        it('gives the styler params the glow of the state they are called in, and the series glow, or none, before the hover', async () => {
            const { byState, styler } = recordParamsByHighlightState();
            await create({
                glow: testCase.seriesGlow ? SERIES_GLOW : undefined,
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                styler,
            });

            expectParamsInState(byState, 'highlighted-item', { glow: HIGHLIGHT_GLOW });
            // The leaves: a group of a treemap has a glow of its own.
            const others = (byState.get('none') ?? []).filter((itemParams) => itemParams.datum.children == null);
            expect(others.length).toBeGreaterThan(1);
            for (const itemParams of others) {
                expect(itemParams.glow).toEqual(
                    testCase.seriesGlow ? { ...SERIES_GLOW, gap: testCase.themeGlow.gap } : undefined
                );
                expect(itemParams.glow).toBe(others[0].glow);
            }
        });
    });

    describe('with a series shadow fill', () => {
        // A `fillOpacity` makes the theme set `_fillOpacitySet`, which the styler params must not carry back to it.
        const FILLED_SHADOW: AgDropShadowOptions = { enabled: true, fill: 'red', fillOpacity: 0.5, blur: 3 };

        it('gives the styler a shadow that it can spread into the shadow it returns, with no warning of its own', async () => {
            const { inPlace } = await create({
                shadow: FILLED_SHADOW,
                styler: (params) => (testCase.isFirst(params) ? { shadow: { ...params.shadow, blur: 9 } } : {}),
            });

            expect(inPlace.length).toBeGreaterThan(1);
            expect(inPlace[0].fillShadow).toMatchObject({ fill: 'red', blur: 9 });
            for (const shape of inPlace.slice(1)) expect(shape.fillShadow).toMatchObject({ fill: 'red', blur: 3 });
            expectWarningMessages([]);
        });

        it('gives the styler a shadow that it can return as it is, in the hovered state too', async () => {
            const { inPlace } = await create({
                shadow: FILLED_SHADOW,
                hover: true,
                styler: (params) => ({ shadow: params.shadow }),
            });

            expect(inPlace.length).toBeGreaterThan(1);
            for (const shape of inPlace) expect(shape.fillShadow).toMatchObject({ fill: 'red', blur: 3 });
            expectWarningMessages([]);
        });

        it('gives every leaf in a state the same shadow object', async () => {
            const { byState, styler } = recordParamsByHighlightState();
            await create({ shadow: FILLED_SHADOW, hover: true, styler });

            // The leaves: a group of a treemap has a shadow of its own.
            const others = (byState.get('none') ?? []).filter((itemParams) => itemParams.datum.children == null);
            expect(others.length).toBeGreaterThan(1);
            for (const itemParams of others) expect(itemParams.shadow).toBe(others[0].shadow);
            expectWarningMessages([]);
        });
    });

    describe.runIf(testCase.leaves != null)('the cap on distinct casts', () => {
        const CAP = 16;
        const nameOf = (shape: Shape) => (shape as Shape<HierarchyNode>).datum?.datum?.name as string;
        const blurOf = (id: number) => glowShadow({ ...SERIES_GLOW, blur: id + 1 });
        /** A styler that casts a glow whose blur is `blurFor(id)` on the leaf `L<id>`, recording the leaves in the order it first sees them. */
        const blurBy = (blurFor: (id: number) => number) => {
            const seen: string[] = [];
            const styler = (params: any) => {
                const name: string = params.datum.name;
                if (!/^L\d+$/.test(name)) return {};
                if (!seen.includes(name)) seen.push(name);
                return { glow: { blur: blurFor(Number(name.slice(1))) } };
            };
            return { seen, styler };
        };
        const warnsOfTheCap = () => [
            expect.stringContaining(`series '${getSeriesAt(chart).id}' has more than ${CAP} distinct`),
        ];

        it('casts every distinct glow up to the cap, with no warning', async () => {
            const { styler } = blurBy((id) => id + 1);
            const { inPlace } = await create({ data: testCase.leaves!(CAP), glow: SERIES_GLOW, styler });

            expect(inPlace).toHaveLength(CAP);
            for (const shape of inPlace) {
                expect(glowOf(shape)).toMatchObject(blurOf(Number(nameOf(shape).slice(1))));
            }
            expectWarningMessages([]);
        });

        it('casts the series glow from the 17th distinct glow, and warns once for the series', async () => {
            const { seen, styler } = blurBy((id) => id + 1);
            const { inPlace } = await create({ data: testCase.leaves!(CAP + 4), glow: SERIES_GLOW, styler });

            expect(inPlace).toHaveLength(CAP + 4);
            // Each leaf has a glow of its own, so the leaves past the 16th that the styler reached fall back.
            const within = new Set(seen.slice(0, CAP));
            for (const shape of inPlace) {
                const name = nameOf(shape);
                expect(glowOf(shape)).toMatchObject(
                    within.has(name) ? blurOf(Number(name.slice(1))) : glowShadow(SERIES_GLOW)
                );
            }
            expect(inPlace.filter((shape) => !within.has(nameOf(shape)))).toHaveLength(4);
            expectWarningMessages(warnsOfTheCap());
        });

        it('counts equal glows once, however many leaves return them', async () => {
            const { styler } = blurBy((id) => (id % CAP) + 1);
            const { inPlace } = await create({ data: testCase.leaves!(CAP * 3), glow: SERIES_GLOW, styler });

            expect(inPlace).toHaveLength(CAP * 3);
            for (const shape of inPlace) {
                expect(glowOf(shape)).toMatchObject(blurOf(Number(nameOf(shape).slice(1)) % CAP));
            }
            expectWarningMessages([]);
        });
    });
});

describe('itemStyler glow params of a treemap tile', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    it('are the glow the tile casts, with a group highlighted', async () => {
        const seen = new Map<string, any>();
        chart = await createEnterpriseChart({
            data: HIERARCHY_SHADOW_DATA,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [
                {
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'size',
                    tile: {
                        glow: { enabled: true, blur: 3 },
                        highlight: {
                            highlightedItem: { glow: { enabled: true, blur: 9 } },
                            highlightedBranch: { glow: { enabled: true, blur: 9 } },
                        },
                    },
                    itemStyler: (params: any) => {
                        if (params.depth > 1) seen.set(params.datum.name, params.glow);
                        return {};
                    },
                },
            ],
        } as AgChartOptions);

        const [group] = hierarchyRoot(chart).children;
        seen.clear();
        await hoverNode(chart, group);

        // The glow of a tile in the hovered group is cast by its glow-only copy, not by the tile drawn in place.
        const tiles = visible(
            getSeriesSelectionNodes<Shape<HierarchyNode>>(chart, 'highlightGlowSelection'),
            Rect
        ).filter((shape) => !(shape as Shape<HierarchyNode>).datum?.hasChildren);
        expect(tiles.length).toBeGreaterThan(1);
        for (const tile of tiles) {
            const name = (tile as Shape<{ datum: { name: string } }>).datum?.datum?.name ?? '';
            expect(seen.get(name)?.blur).toBe(3);
            expect((tile.fillGlow as { blur?: number }).blur).toBe(3);
        }
    });
});

describe('itemStyler shadow and glow (nodes with their own paths)', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    it('casts the glow of the styler for a treemap group while the group highlight is off', async () => {
        chart = await createEnterpriseChart({
            data: HIERARCHY_SHADOW_DATA,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [
                {
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'size',
                    group: { highlight: { enabled: false } },
                    itemStyler: (params: any) => (params.datum.name === 'A' ? { glow: ITEM_GLOW } : {}),
                },
            ],
        } as AgChartOptions);

        const groups = visible(getSeriesSelectionNodes<Shape<HierarchyNode>>(chart, 'datumSelection'), Rect).filter(
            (shape) => (shape as Shape<HierarchyNode>).datum?.hasChildren
        );
        const glowing = groups.filter((shape) => isOn(shape.fillGlow));

        expect(glowing).toHaveLength(1);
        expect((glowing[0] as Shape<HierarchyNode>).datum?.datum?.name).toBe('A');
        expect(glowing[0].fillGlow).toMatchObject(glowShadow(ITEM_GLOW));
    });

    it('merges the glow of the styler for a treemap tile over the theme alone while a group is hovered', async () => {
        chart = await createEnterpriseChart({
            data: HIERARCHY_SHADOW_DATA,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [
                {
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'size',
                    tile: { highlight: { highlightedBranch: { glow: HIGHLIGHT_GLOW } } },
                    itemStyler: (params: any) => (params.datum.name === 'A1' ? { glow: { blur: 7 } } : {}),
                },
            ],
        } as AgChartOptions);

        // A tile in a hovered group inherits only the group's opacities, so no highlight glow is under the styler's.
        await hoverNode(
            chart,
            [...hierarchyRoot(chart)].find((node) => node.datum?.name === 'A')
        );

        // The glow of a tile in the hovered group is cast by its glow-only copy.
        const tile = visible(getSeriesSelectionNodes<Shape<HierarchyNode>>(chart, 'highlightGlowSelection'), Rect).find(
            (shape) => (shape as Shape<HierarchyNode>).datum?.datum?.name === 'A1'
        );

        expect(tile?.fillGlow).toMatchObject(glowShadow({ ...TILE_THEME_GLOW, blur: 7 }));
        expect(tile?.fillGlow?.fill).not.toBe(HIGHLIGHT_GLOW.fill);
    });

    describe('heatmap', () => {
        const create = async (cell: object, hoveredCell: object = {}) => {
            chart = await createEnterpriseChart({
                data: [
                    { x: 'a', y: 'p', c: 1 },
                    { x: 'b', y: 'p', c: 2 },
                    { x: 'a', y: 'q', c: 3 },
                    { x: 'b', y: 'q', c: 4 },
                ],
                animation: { enabled: false },
                legend: { enabled: false },
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'x',
                        yKey: 'y',
                        colorKey: 'c',
                        itemStyler: (params: any) => {
                            if (params.datum.c !== 1) return {};
                            return params.highlightState === 'highlighted-item' ? hoveredCell : cell;
                        },
                    },
                ],
            } as AgChartOptions);
            return getSeriesSelectionNodes<Shape>(chart, 'datumSelection');
        };

        it('paints the cells of a series whose styler returns no cast in one batch, with no node of their own', async () => {
            expect(await create({ fill: '#ff0000' })).toHaveLength(0);
        });

        it('casts the shadow that the styler returns for the hovered cell in place, though no other state returns one', async () => {
            const cells = await create({}, { shadow: ITEM_SHADOW });
            expect(cells).toHaveLength(0);

            await hoverDatum(chart);

            const nodes = getSeriesSelectionNodes<Shape<{ datum: { c: number } }>>(chart, 'datumSelection');
            expect(nodes).toHaveLength(4);
            const hovered = nodes.filter((node) => node.datum?.datum.c === 1);
            expect(hovered).toHaveLength(1);
            expect(hovered[0].fillShadow).toMatchObject(ITEM_SHADOW);
            expect(nodes.filter((node) => isOn(node.fillShadow))).toHaveLength(1);
        });

        it.each([{ shadow: ITEM_SHADOW }, { glow: ITEM_GLOW }])(
            'gives every cell a node of its own once the styler returns a cast for one cell: %o',
            async (cast) => {
                const cells = await create(cast);

                expect(cells).toHaveLength(4);
                const cast0 = 'shadow' in cast ? cells[0].fillShadow : cells[0].fillGlow;
                expect(isOn(cast0)).toBe(true);
            }
        );
    });
});
