import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import type { Group } from 'ag-charts-core';

import { getFlowLinkData, getFlowNodeData } from '../../test/enterpriseSeriesAccessors';
import { collectShapes, createEnterpriseChart } from '../../test/utils';

const DATA = [
    { from: 'A', to: 'C', size: 8 },
    { from: 'A', to: 'D', size: 4 },
    { from: 'B', to: 'C', size: 5 },
    { from: 'B', to: 'D', size: 7 },
];
const GLOW = { fill: '#cc0000', fillOpacity: 1, blur: 5, spread: 3 };
const NO_GLOW = { highlight: { highlightedItem: { glow: { enabled: false } } } };

describe('sankey glow on hover', () => {
    setupMockConsole();
    setupMockCanvas();
    let chart: any;
    afterEach(() => chart?.destroy());

    /** What each node and link casts in its glow slot, in place and in the highlight layer's copy, after hovering one. */
    const hover = async (series: object, target?: 'node' | 'link') => {
        chart = deproxy(
            await createEnterpriseChart({
                data: DATA,
                legend: { enabled: false },
                series: [{ type: 'sankey', fromKey: 'from', toKey: 'to', sizeKey: 'size', ...series }],
            } as AgChartOptions)
        );
        if (target != null) {
            const datum = (target === 'node' ? getFlowNodeData(chart) : getFlowLinkData(chart))[0];
            chart.ctx.highlightManager.updateHighlight(chart.id, datum);
            await waitForChartStability(chart);
        }
        const s = chart.series[0];
        const glows = (group: Group) =>
            collectShapes(group)
                .filter((shape) => shape.visible)
                .map((shape) => shape.fillGlow);
        const highlightCasts = (group: Group) =>
            collectShapes(group)
                .filter((shape) => shape.visible)
                .map((shape) => shape.fillShadow);
        return {
            nodes: glows(s.nodeGroup),
            links: glows(s.linkGroup),
            highlightNode: highlightCasts(s.highlightNodeGroup),
            highlightLink: highlightCasts(s.highlightLinkGroup),
        };
    };

    it('casts the node glow from every node but the hovered one while highlightedItem has none', async () => {
        const { nodes, highlightNode } = await hover({ node: { glow: GLOW } }, 'node');
        expect(nodes.map((glow) => glow?.fill)).toEqual([undefined, GLOW.fill, GLOW.fill, GLOW.fill]);
        expect(highlightNode).toHaveLength(1);
        expect(highlightNode[0]).toMatchObject({ enabled: true, glow: true, fill: GLOW.fill });
    });

    it('lets highlightedItem.glow turn the hovered node off', async () => {
        const { nodes, highlightNode } = await hover({ node: { glow: GLOW }, ...NO_GLOW }, 'node');
        expect(nodes.map((glow) => glow?.fill)).toEqual([undefined, GLOW.fill, GLOW.fill, GLOW.fill]);
        expect(highlightNode[0]?.enabled).not.toBe(true);
    });

    it('lets highlightedItem.glow replace, not add to, the node glow on the hovered node', async () => {
        const { nodes, highlightNode } = await hover(
            { node: { glow: GLOW }, highlight: { highlightedItem: { glow: { gap: 5 } } } },
            'node'
        );
        expect(nodes[0]).toBeUndefined();
        expect(nodes.slice(1).map((glow) => glow?.gap)).toEqual([undefined, undefined, undefined]);
        expect(highlightNode[0]).toMatchObject({ enabled: true, glow: true, gap: 5 });
    });

    it('lets highlightedItem.glow turn the hovered link off', async () => {
        const { links, highlightLink } = await hover({ node: { glow: GLOW }, link: { glow: GLOW }, ...NO_GLOW }, 'link');
        expect(links.map((glow) => glow?.fill)).toEqual([undefined, GLOW.fill, GLOW.fill, GLOW.fill]);
        expect(highlightLink[0]?.enabled).not.toBe(true);
    });

    describe('link.glow with no node.glow', () => {
        // The highlight buckets follow `node.glow`, so they are off here and override `link.glow` once anything is hovered.
        it('casts at rest', async () => {
            const { links } = await hover({ link: { glow: GLOW } });
            expect(links.map((glow) => glow?.fill)).toEqual([GLOW.fill, GLOW.fill, GLOW.fill, GLOW.fill]);
        });

        it.each(['node', 'link'] as const)('casts nothing once a %s is hovered', async (target) => {
            const { links, highlightNode, highlightLink } = await hover({ link: { glow: GLOW } }, target);
            expect(links.every((glow) => glow == null)).toBe(true);
            expect([...highlightNode, ...highlightLink].every((shadow) => shadow?.enabled !== true)).toBe(true);
        });
    });

    describe('node.glow with no link.glow', () => {
        it('casts a default glow from every link once a node is hovered', async () => {
            const { links } = await hover({ node: { glow: GLOW } }, 'node');
            expect(links.every((glow) => glow?.enabled === true)).toBe(true);
        });
    });
});
