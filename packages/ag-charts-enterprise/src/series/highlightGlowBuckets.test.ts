import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgGlowOptions } from 'ag-charts-community';
import {
    HIGHLIGHT_GLOW,
    deproxy,
    getSeriesSelectionNodes,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { Shape } from 'ag-charts-core';

import { getHierarchyRootNode } from '../test/seriesAccessors';
import { SHADOW, createEnterpriseChart } from '../test/utils';
import type { HierarchyNode } from './hierarchy/hierarchySeries';

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

const GLOW_SHADOW = { ...HIGHLIGHT_GLOW, xOffset: 0, yOffset: 0 };

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
        series: (bucket: Bucket, glow: AgGlowOptions, shadow?: object) => object;
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

        it(`${name} resolves the branch glow under a highlightedItem glow field by field`, async () => {
            const options: any = series('highlightedBranch', { ...HIGHLIGHT_GLOW, color: '#aa0000' });
            const target = options.type === 'sunburst' ? options.highlight : options.tile.highlight;
            target.highlightedItem = { glow: { color: '#0000aa' } };

            const { highlighted } = await hover(options);

            // The item bucket overrides the colour alone; blur and spread come from the branch bucket.
            expect(highlighted.find(({ shape }) => shape.fillShadow?.enabled)?.shape.fillShadow).toMatchObject({
                color: '#0000aa',
                blur: HIGHLIGHT_GLOW.blur,
                xOffset: 0,
                yOffset: 0,
            });
        });
    });
});
