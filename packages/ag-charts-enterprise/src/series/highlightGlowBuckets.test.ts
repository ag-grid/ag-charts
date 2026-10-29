import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import {
    HIGHLIGHT_GLOW,
    deproxy,
    getSeriesNodeData,
    getSeriesSelectionNodes,
    glowShadow,
    internalOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { Group, InternalAgGlowOptions, Rect, Shape } from 'ag-charts-core';

import {
    getFlowLinkData,
    getFlowNodeData,
    getHierarchyHighlightStyle,
    getSeriesGroup,
    getTreemapGroupHighlightStyle,
} from '../test/enterpriseSeriesAccessors';
import { getHierarchyRootNode } from '../test/seriesAccessors';
import { SHADOW, collectShapes, createEnterpriseChart } from '../test/utils';
import { HierarchyHighlightState, type HierarchyNode } from './hierarchy/hierarchySeries';

// Two top-level branches, so that hovering a leaf of A leaves B as the other branch.
const TWO_BRANCH_DATA = [
    {
        name: 'A',
        children: [
            { name: 'A1', size: 10 },
            { name: 'A2', size: 6 },
        ],
    },
    {
        name: 'B',
        children: [
            { name: 'B1', size: 8 },
            { name: 'B2', size: 4 },
        ],
    },
];

const GLOW_SHADOW = glowShadow(HIGHLIGHT_GLOW);

type Bucket = 'highlightedItem' | 'unhighlightedItem' | 'highlightedBranch' | 'unhighlightedBranch';

/** A node's role relative to the hovered leaf A1. */
type Role = 'hovered' | 'sameBranch' | 'otherBranch';

describe('highlight glow on every hierarchy bucket', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const leaves = () => {
        const out: HierarchyNode[] = [];
        for (const node of getHierarchyRootNode(chart)!) if (node.children.length === 0) out.push(node);
        return out;
    };

    const roleOf = (node: HierarchyNode, hovered: HierarchyNode): Role => {
        if (node.datumIndex === hovered.datumIndex) return 'hovered';
        return node.path[0] === hovered.path[0] ? 'sameBranch' : 'otherBranch';
    };

    const SERIES: Array<{
        name: string;
        series: (bucket: Bucket, glow: InternalAgGlowOptions, shadow?: object) => object;
    }> = [
        {
            name: 'sunburst',
            series: (bucket, glow, shadow) => ({
                type: 'sunburst',
                labelKey: 'name',
                sizeKey: 'size',
                shadow,
                highlight: { [bucket]: { glow } },
            }),
        },
        {
            name: 'treemap tile',
            series: (bucket, glow, shadow) => ({
                type: 'treemap',
                labelKey: 'name',
                sizeKey: 'size',
                tile: { shadow, highlight: { [bucket]: { glow } } },
            }),
        },
    ];

    /** Hovers A1 and returns the in-place and highlight-layer leaf shapes with the role of each shape's node. */
    const hover = async (series: object) => {
        chart = await createEnterpriseChart({
            data: TWO_BRANCH_DATA,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [series],
        } as AgChartOptions);

        const target = leaves().find((leaf) => leaf.datum?.name === 'A1')!;
        const { ctx, id } = deproxy(chart);
        ctx.highlightManager.updateHighlight(id, target as any);
        await waitForChartStability(chart);

        const withRoles = (name: 'datumSelection' | 'highlightSelection') =>
            getSeriesSelectionNodes<Shape<HierarchyNode>>(chart, name)
                .filter((shape) => shape.visible && shape.datum?.children.length === 0)
                .map((shape) => ({ shape, role: roleOf(shape.datum!, target) }));
        return { inPlace: withRoles('datumSelection'), highlighted: withRoles('highlightSelection') };
    };

    const cast = (entries: Array<{ shape: Shape; role: Role }>) =>
        entries.filter(({ shape }) => shape.fillShadow?.enabled === true).map(({ role }) => role);

    describe.each(SERIES)('$name', ({ name, series }) => {
        // Which roles cast the glow of each bucket, from the highlight state each role is in.
        it('casts highlightedItem.glow from the hovered leaf only, via the highlight copy', async () => {
            const { inPlace, highlighted } = await hover(series('highlightedItem', HIGHLIGHT_GLOW));

            expect(cast(highlighted)).toEqual(['hovered']);
            expect(highlighted.find(({ shape }) => shape.fillShadow?.enabled)?.shape.fillShadow).toMatchObject(
                GLOW_SHADOW
            );
            expect(cast(inPlace)).toEqual([]);
        });

        it('casts highlightedBranch.glow from the hovered leaf and the other leaves of its branch, not the other branch', async () => {
            const { inPlace, highlighted } = await hover(series('highlightedBranch', HIGHLIGHT_GLOW));

            expect(cast(highlighted)).toEqual(['hovered']);
            expect(cast(inPlace)).toEqual(['sameBranch']);
            for (const { shape } of inPlace.filter(({ role }) => role === 'sameBranch')) {
                expect(shape.fillShadow).toMatchObject(GLOW_SHADOW);
            }
        });

        it('casts unhighlightedItem.glow from the other leaves of the hovered branch only', async () => {
            const { inPlace, highlighted } = await hover(series('unhighlightedItem', HIGHLIGHT_GLOW));

            expect(cast(highlighted)).toEqual([]);
            expect(cast(inPlace)).toEqual(['sameBranch']);
        });

        it('casts unhighlightedBranch.glow from the leaves of the other branch only, in the base pass', async () => {
            const { inPlace, highlighted } = await hover(series('unhighlightedBranch', HIGHLIGHT_GLOW));

            expect(cast(highlighted)).toEqual([]);
            expect(cast(inPlace)).toEqual(['otherBranch', 'otherBranch']);
            for (const { shape } of inPlace.filter(({ role }) => role === 'otherBranch')) {
                expect(shape.fillShadow).toMatchObject(GLOW_SHADOW);
            }
        });

        it('shares one shadow object between the nodes in a highlight state, so an unchanged glow is not redrawn', async () => {
            const { inPlace } = await hover(series('unhighlightedBranch', HIGHLIGHT_GLOW));

            const [first, ...rest] = inPlace.filter(({ role }) => role === 'otherBranch');
            expect(rest.length).toBeGreaterThan(0);
            for (const { shape } of rest) expect(shape.fillShadow).toBe(first.shape.fillShadow);
        });

        it('lets the glow replace the base shadow of an item in that state, and keeps the shadow elsewhere', async () => {
            const { inPlace, highlighted } = await hover(series('unhighlightedBranch', HIGHLIGHT_GLOW, SHADOW));

            for (const { shape, role } of inPlace) {
                expect(shape.fillShadow).toMatchObject(role === 'otherBranch' ? GLOW_SHADOW : SHADOW);
            }
            // The hovered leaf's highlight copy casts no shadow when no glow is set for it.
            expect(cast(highlighted)).toEqual([]);
        });

        it("keeps the hovered leaf's in-place shadow beneath its glowing copy", async () => {
            const { inPlace, highlighted } = await hover(series('highlightedBranch', HIGHLIGHT_GLOW, SHADOW));

            const hoveredInPlace = inPlace.find(({ role }) => role === 'hovered')!;
            expect(hoveredInPlace.shape.fillShadow).toMatchObject(SHADOW);
            expect(highlighted.find(({ role }) => role === 'hovered')!.shape.fillShadow).toMatchObject(GLOW_SHADOW);
            // The other leaves of the branch have the glow in place of their shadow.
            for (const { shape } of inPlace.filter(({ role }) => role === 'sameBranch')) {
                expect(shape.fillShadow).toMatchObject(GLOW_SHADOW);
            }
        });

        it('casts no glow from a bucket that is disabled', async () => {
            const { inPlace, highlighted } = await hover(
                series('highlightedBranch', { ...HIGHLIGHT_GLOW, enabled: false })
            );

            expect(cast(highlighted)).toEqual([]);
            expect(cast(inPlace)).toEqual([]);
        });

        it('resolves the glow-free highlight style of each state once, until the options change', async () => {
            const options: any = series('highlightedBranch', HIGHLIGHT_GLOW);
            await hover(options);

            const styles = () =>
                [HierarchyHighlightState.Item, HierarchyHighlightState.Branch, HierarchyHighlightState.OtherBranch].map(
                    (state) => getHierarchyHighlightStyle(chart, state)
                );

            const [item, branch, otherBranch] = styles();
            expect(item).not.toHaveProperty('glow');
            expect(branch).not.toHaveProperty('glow');
            expect(otherBranch).not.toHaveProperty('glow');
            const [itemAgain, branchAgain, otherBranchAgain] = styles();
            expect(itemAgain).toBe(item);
            expect(branchAgain).toBe(branch);
            expect(otherBranchAgain).toBe(otherBranch);

            const next = series('highlightedBranch', HIGHLIGHT_GLOW, undefined) as any;
            const nextHighlight = next.type === 'sunburst' ? next.highlight : next.tile.highlight;
            nextHighlight.unhighlightedBranch = { fillOpacity: 0.5 };
            await chart.update({ data: TWO_BRANCH_DATA, series: [next] } as AgChartOptions);
            await waitForChartStability(chart);
            expect(styles()[2]).toMatchObject({ fillOpacity: 0.5 });
            expect(styles()[2]).not.toBe(otherBranch);
        });

        it(`${name} resolves the branch glow under a highlightedItem glow field by field`, async () => {
            const options: any = series('highlightedBranch', { ...HIGHLIGHT_GLOW, fill: '#aa0000' });
            const target = options.type === 'sunburst' ? options.highlight : options.tile.highlight;
            target.highlightedItem = { glow: { fill: '#0000aa' } };

            const { highlighted } = await hover(options);

            // The item bucket overrides the colour alone; blur and spread come from the branch bucket.
            expect(highlighted.find(({ shape }) => shape.fillShadow?.enabled)?.shape.fillShadow).toMatchObject({
                fill: '#0000aa',
                blur: HIGHLIGHT_GLOW.blur,
                xOffset: 0,
                yOffset: 0,
            });
        });
    });
});

describe('highlight glow on treemap groups', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const SIBLING_DATA = [
        { name: 'A', children: [{ name: 'A1', size: 10 }] },
        { name: 'B', children: [{ name: 'B1', size: 8 }] },
        { name: 'C', children: [{ name: 'C1', size: 6 }] },
    ];

    /** Hovers group A and returns, by group name, the group rects of each layer that cast a shadow. */
    const hoverGroupA = async (highlight: object, shadow?: object) => {
        chart = await createEnterpriseChart(
            internalOptions<AgChartOptions>({
                data: SIBLING_DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'size',
                        group: { shadow, gap: 12, padding: 10, interactive: true, highlight },
                    },
                ],
            })
        );

        const groupA = getHierarchyRootNode(chart)!.children.find((node) => node.datum?.name === 'A')!;
        const { ctx, id } = deproxy(chart);
        ctx.highlightManager.updateHighlight(id, groupA);
        await waitForChartStability(chart);

        const groups = (name: 'datumSelection' | 'highlightSelection') =>
            getSeriesSelectionNodes<Shape<HierarchyNode>>(chart, name).filter(
                (shape) => shape.visible && shape.datum?.hasChildren && shape.datum.depth === groupA.depth
            );
        const castBy = (shapes: Array<Shape<HierarchyNode>>) =>
            shapes.filter((shape) => shape.fillShadow?.enabled).map((shape) => shape.datum!.datum?.name);
        return { inPlace: groups('datumSelection'), highlighted: groups('highlightSelection'), castBy };
    };

    it('casts unhighlightedItem.glow from the sibling groups of the hovered group, not from the group itself', async () => {
        const { inPlace, highlighted, castBy } = await hoverGroupA({ unhighlightedItem: { glow: HIGHLIGHT_GLOW } });

        expect(castBy(inPlace).sort((a, b) => String(a).localeCompare(String(b)))).toEqual(['B', 'C']);
        for (const shape of inPlace.filter((s) => s.datum?.datum?.name !== 'A')) {
            expect(shape.fillShadow).toMatchObject(GLOW_SHADOW);
        }
        expect(castBy(highlighted)).toEqual([]);
    });

    it('casts highlightedItem.glow from the hovered group alone, via the highlight copy', async () => {
        const { inPlace, highlighted, castBy } = await hoverGroupA({ highlightedItem: { glow: HIGHLIGHT_GLOW } });

        expect(castBy(highlighted)).toEqual(['A']);
        expect(highlighted.find((s) => s.fillShadow?.enabled)?.fillShadow).toMatchObject(GLOW_SHADOW);
        expect(castBy(inPlace)).toEqual([]);
    });

    it('resolves the glow-free group highlight style of each state once', async () => {
        await hoverGroupA({
            highlightedItem: { glow: HIGHLIGHT_GLOW },
            unhighlightedItem: { glow: HIGHLIGHT_GLOW },
        });

        for (const state of [HierarchyHighlightState.Item, HierarchyHighlightState.OtherItem]) {
            const style = getTreemapGroupHighlightStyle(chart, state);
            expect(style).not.toHaveProperty('glow');
            expect(getTreemapGroupHighlightStyle(chart, state)).toBe(style);
        }
    });

    it('lets unhighlightedItem.glow replace the base shadow of the sibling groups only', async () => {
        const { inPlace } = await hoverGroupA({ unhighlightedItem: { glow: HIGHLIGHT_GLOW } }, SHADOW);

        for (const shape of inPlace) {
            expect(shape.fillShadow).toMatchObject(shape.datum?.datum?.name === 'A' ? SHADOW : GLOW_SHADOW);
        }
    });
});

describe('highlight glow on heatmap cells', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const GRID_DATA = [
        { x: 'a', y: 'p', value: 1 },
        { x: 'b', y: 'p', value: 3 },
        { x: 'a', y: 'q', value: 2 },
        { x: 'b', y: 'q', value: 5 },
    ];

    const hoverFirstCell = async (highlight: object) => {
        chart = await createEnterpriseChart({
            data: GRID_DATA,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'value', highlight }],
        } as AgChartOptions);
        const { ctx, id } = deproxy(chart);
        ctx.highlightManager.updateHighlight(id, getSeriesNodeData<any>(chart)[0]);
        await waitForChartStability(chart);
    };

    const cells = () => getSeriesSelectionNodes<Rect>(chart, 'datumSelection').filter((cell) => cell.visible);

    it('paints the cells as one batch, with no cell nodes, while no glow is enabled', async () => {
        await hoverFirstCell({});

        expect(cells()).toHaveLength(0);
    });

    it('draws each cell as its own node, with the other cells casting unhighlightedItem.glow', async () => {
        await hoverFirstCell({ unhighlightedItem: { glow: HIGHLIGHT_GLOW } });

        // The batch can't paint a glow, so every cell is a node, the hovered one beneath its highlight copy.
        expect(cells()).toHaveLength(GRID_DATA.length);
        const [hovered, ...others] = cells();
        expect(hovered.fillShadow?.enabled).not.toBe(true);
        for (const cell of others) expect(cell.fillShadow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
    });

    it('keeps the cell batch when unhighlightedItem.glow is configured but disabled', async () => {
        await hoverFirstCell({ unhighlightedItem: { glow: { ...HIGHLIGHT_GLOW, enabled: false } } });

        expect(cells()).toHaveLength(0);
    });

    it('casts the hovered cell glow from its highlight copy when only highlightedItem.glow is set', async () => {
        await hoverFirstCell({ highlightedItem: { glow: HIGHLIGHT_GLOW } });

        const highlighted = getSeriesSelectionNodes<Rect>(chart, 'highlightSelection').filter((cell) => cell.visible);
        expect(highlighted).toHaveLength(1);
        expect(highlighted[0].fillShadow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
    });
});

// The connected items of a hovered flow node or link are drawn a second time, undimmed, over the dimmed content.
describe.each(['sankey', 'chord'] as const)('highlight glow on %s focus copies', (type) => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const FLOW_DATA = [
        { from: 'A', to: 'C', size: 8 },
        { from: 'A', to: 'D', size: 4 },
        { from: 'B', to: 'C', size: 5 },
        { from: 'B', to: 'D', size: 7 },
    ];

    const castCounts = (root: Group) => {
        const shapes = collectShapes(root).filter((shape) => shape.visible);
        return { glowing: shapes.filter((shape) => shape.fillShadow?.enabled).length };
    };

    /** Hovers the first node or link, and counts the shapes that cast in the content layer and in the focus layers. */
    const hover = async (target: 'node' | 'link', highlight: object) => {
        chart = await createEnterpriseChart({
            data: FLOW_DATA,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [{ type, fromKey: 'from', toKey: 'to', sizeKey: 'size', highlight }],
        } as AgChartOptions);

        const datum = target === 'node' ? getFlowNodeData(chart)[0] : getFlowLinkData(chart)[0];
        const { ctx, id } = deproxy(chart);
        ctx.highlightManager.updateHighlight(id, datum as any);
        await waitForChartStability(chart);

        // The hovered node's and link's own copies, and the focus layers redrawing their connected items undimmed.
        return {
            content: castCounts(getSeriesGroup(chart, 'contentGroup')),
            hovered:
                castCounts(getSeriesGroup(chart, 'highlightNodeGroup')).glowing +
                castCounts(getSeriesGroup(chart, 'highlightLinkGroup')).glowing,
            focus:
                castCounts(getSeriesGroup(chart, 'focusLinkGroup')).glowing +
                castCounts(getSeriesGroup(chart, 'focusNodeGroup')).glowing,
        };
    };

    it('casts unhighlightedItem.glow in the content layer and, for the connected items, again in the focus layer', async () => {
        const { content, hovered, focus } = await hover('node', { unhighlightedItem: { glow: HIGHLIGHT_GLOW } });

        // Every link and every node but the hovered one casts in the content layer ...
        expect(content.glowing).toBe(4 + 3);
        // ... the hovered node's own highlight copy casts none ...
        expect(hovered).toBe(0);
        // ... and its two links and two neighbouring nodes cast again from the focus layer.
        expect(focus).toBe(2 + 2);
    });

    it('casts nothing from the focus layer or the highlight copy for the hovered link', async () => {
        const { content, hovered, focus } = await hover('link', { unhighlightedItem: { glow: HIGHLIGHT_GLOW } });

        // The hovered link keeps no glow of its own in either layer; the other three links and every node do.
        expect(content.glowing).toBe(3 + 4);
        expect(hovered).toBe(0);
        expect(focus).toBe(2);
    });

    it('casts no glow anywhere when unhighlightedItem.glow is disabled', async () => {
        const { content, hovered, focus } = await hover('node', {
            unhighlightedItem: { glow: { ...HIGHLIGHT_GLOW, enabled: false } },
        });

        expect(content.glowing + hovered + focus).toBe(0);
    });
});
