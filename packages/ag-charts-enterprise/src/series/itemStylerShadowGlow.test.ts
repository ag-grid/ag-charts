import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgDropShadowOptions, AgGlowOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    HIGHLIGHT_GLOW,
    ITEM_GLOW,
    ITEM_SHADOW,
    type ItemCast,
    SERIES_GLOW,
    THEME_GLOW,
    countCastMerges,
    countCastSerialisations,
    deproxy,
    expectWarningMessages,
    getSeriesAt,
    getSeriesNodeData,
    getSeriesSelectionNodes,
    glowShadow,
    isOn,
    setupMockCanvas,
    setupMockConsole,
    themeShadow,
    waitForChartStability,
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
}

const visible = (shapes: Iterable<Shape>, kind: abstract new (...args: never[]) => Shape) =>
    [...shapes].filter((shape) => (shape.constructor as unknown) === kind && shape.visible);

const hierarchyLayers =
    (kind: abstract new (...args: never[]) => Shape) =>
    (chart: AgChartInstance): Layers => {
        // Leaves only: a group of a treemap is a shape of the same kind in the same selection.
        const leaves = (name: 'datumSelection' | 'highlightSelection') =>
            visible(getSeriesSelectionNodes<Shape<HierarchyNode>>(chart, name), kind).filter(
                (shape) => !(shape as Shape<HierarchyNode>).datum?.hasChildren
            );
        return { inPlace: leaves('datumSelection'), highlighted: leaves('highlightSelection') };
    };

const CASES: Case[] = [
    {
        name: 'sankey link',
        data: FLOW_DATA,
        glowSlot: 'fillGlow',
        oneSlot: false,
        seriesGlow: true,
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
        glowSlot: 'fillShadow',
        oneSlot: true,
        seriesGlow: false,
        isFirst: (params) => params.datum.name === 'A1',
        hover: (chart) => leavesOf(chart)[0],
        series: ({ shadow, highlight, itemStyler }) => ({
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'size',
            tile: { shadow, highlight },
            itemStyler,
        }),
        layers: hierarchyLayers(Rect),
    },
    {
        name: 'sunburst',
        data: HIERARCHY_SHADOW_DATA,
        glowSlot: 'fillShadow',
        oneSlot: true,
        seriesGlow: false,
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
        } = {}
    ) => {
        const { first = {} } = opts;
        const itemStyler = opts.styler ?? ((params: any) => (testCase.isFirst(params) ? first : {}));
        chart = await createEnterpriseChart({
            data: testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [testCase.series({ ...opts, itemStyler })],
        } as AgChartOptions);

        if (opts.hover) {
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, testCase.hover(chart));
            await waitForChartStability(chart);
        }
        return testCase.layers(chart);
    };

    // A series with one slot per item holds the glow where it would hold the shadow; the shadow is cast where it has no glow.
    const glowOf = (shape: Shape) => shape[testCase.glowSlot];

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

                expect(glowOf(inPlace[0])).toMatchObject(glowShadow(THEME_GLOW));
                for (const shape of inPlace.slice(1)) expect(isOn(glowOf(shape))).toBe(false);
            }
        );

        it('keeps the theme glow for the fields that a partial glow leaves unset, with no series glow', async () => {
            const { inPlace } = await create({ first: { glow: { blur: 7 } } });

            expect(glowOf(inPlace[0])).toMatchObject(glowShadow({ ...THEME_GLOW, blur: 7 }));
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
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, testCase.hover(chart));
            await waitForChartStability(chart);
            const castsSerialised = await countCastSerialisations(async () => {
                ctx.highlightManager.updateHighlight(id);
                await waitForChartStability(chart);
            });
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

            const { ctx, id } = deproxy(chart);
            const hoverAndLeave = async () => {
                ctx.highlightManager.updateHighlight(id, testCase.hover(chart));
                await waitForChartStability(chart);
                ctx.highlightManager.updateHighlight(id);
                await waitForChartStability(chart);
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

        it('casts the glow of the styler from the highlight copy, with every field the styler sets', async () => {
            const { highlighted } = await create({
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { glow: ITEM_GLOW },
            });

            expect(highlighted).toHaveLength(1);
            expect(glowOf(highlighted[0])).toMatchObject(glowShadow(ITEM_GLOW));
        });

        it('casts the glow of the highlightedItem from the copy of an item whose styler returns none', async () => {
            const { highlighted } = await create({
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
            });

            expect(highlighted).toHaveLength(1);
            expect(glowOf(highlighted[0])).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
        });

        it('merges a partial glow of the styler over the highlightedItem glow, field by field', async () => {
            const { highlighted } = await create({
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { glow: { blur: 20 } },
            });

            expect(highlighted).toHaveLength(1);
            expect(glowOf(highlighted[0])).toMatchObject(glowShadow({ ...HIGHLIGHT_GLOW, blur: 20 }));
        });

        it('casts no glow from the copy when the styler turns the glow off for the item', async () => {
            const { highlighted } = await create({
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { glow: { enabled: false } },
            });

            expect(highlighted).toHaveLength(1);
            expect(isOn(glowOf(highlighted[0]))).toBe(false);
        });

        it('keeps the shadow of the styler on the hovered item in place', async () => {
            const { inPlace } = await create({
                shadow: SHADOW,
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                hover: true,
                first: { shadow: ITEM_SHADOW },
            });

            expect(inPlace[0].fillShadow).toMatchObject(ITEM_SHADOW);
        });

        it('gives the styler params neither a shadow nor a glow, in any highlight state', async () => {
            const params: object[] = [];
            await create({
                shadow: SHADOW,
                glow: testCase.seriesGlow ? SERIES_GLOW : undefined,
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW }, unhighlightedItem: { glow: HIGHLIGHT_GLOW } },
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
        const glowing = groups.filter((shape) => isOn(shape.fillShadow));

        expect(glowing).toHaveLength(1);
        expect((glowing[0] as Shape<HierarchyNode>).datum?.datum?.name).toBe('A');
        expect(glowing[0].fillShadow).toMatchObject(glowShadow(ITEM_GLOW));
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
                        itemStyler: (params: any) =>
                            params.datum.c !== 1
                                ? {}
                                : params.highlightState === 'highlighted-item'
                                  ? hoveredCell
                                  : cell,
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

            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, getSeriesNodeData<HighlightNodeDatum & { datum: any }>(chart)[0]);
            await waitForChartStability(chart);

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
