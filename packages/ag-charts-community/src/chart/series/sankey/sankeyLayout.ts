import type { SankeyNodeDatum } from './sankeySeriesProperties';
import type { Link, LinkedNode, NodeGraphEntry } from './sankeyUtil';

type Column<L extends Link> = {
    nodes: NodeGraphEntry<SankeyNodeDatum, L>[];
    size: number;
    readonly x: number;
};

interface Layout {
    seriesRectHeight: number;
    nodeSpacing: number;
    sizeScale: number;
}

function justifyNodesAcrossColumn({ nodes, size }: Column<any>, { seriesRectHeight, nodeSpacing, sizeScale }: Layout) {
    const nodesHeight = seriesRectHeight * size * sizeScale;
    const outerPadding = (seriesRectHeight - (nodesHeight + nodeSpacing * (nodes.length - 1))) / 2;
    let y = outerPadding;
    nodes.forEach(({ datum: node }) => {
        const height = seriesRectHeight * node.size * sizeScale;
        node.y = y;
        node.height = height;
        y += height + nodeSpacing;
    });
}

function separateNodesInColumn(column: Column<any>, layout: Layout) {
    const { nodes } = column;
    const { seriesRectHeight, nodeSpacing } = layout;
    nodes.sort((a, b) => Math.round(a.datum.y - b.datum.y * 100) / 100);

    let totalShift = 0;
    let currentTop = 0;
    for (let i = 0; i < nodes.length; i += 1) {
        const { datum: node } = nodes[i];
        const shift = Math.max(currentTop - node.y, 0);

        node.y += shift;
        totalShift += shift;

        currentTop = node.y + node.height + nodeSpacing;
    }

    const lastNodeBottom = currentTop - nodeSpacing;

    if (lastNodeBottom < seriesRectHeight) {
        return totalShift > 0;
    }

    let currentBottom = seriesRectHeight;
    for (let i = nodes.length - 1; i >= 0; i -= 1) {
        const { datum: node } = nodes[i];
        const nodeBottom = node.y + node.height;

        const shift = Math.min(currentBottom - nodeBottom, 0);

        node.y += shift;
        totalShift += shift;

        currentBottom = node.y - nodeSpacing;
    }

    return true;
}

function weightedNodeY(links: LinkedNode<SankeyNodeDatum, any>[]): number | undefined {
    if (links.length === 0) return;

    let totalYValues = 0;
    let totalSize = 0;
    for (const {
        node: { datum: node },
    } of links) {
        totalYValues += node.y * node.size;
        totalSize += node.size;
    }

    return totalYValues / totalSize;
}

function layoutColumn(column: Column<any>, layout: Layout, weight: number, direction: -1 | 1) {
    column.nodes.forEach(({ datum: node, linksBefore, linksAfter }) => {
        const forwardLinks = direction === 1 ? linksBefore : linksAfter;
        const backwardsLinks = direction === 1 ? linksAfter : linksBefore;

        const nextY = weightedNodeY(forwardLinks);
        if (nextY != null) {
            const nodeWeight = backwardsLinks.length !== 0 ? weight : 1;
            node.y = node.y + (nextY - node.y) * nodeWeight;
        }
    });

    return separateNodesInColumn(column, layout);
}

function layoutColumnsForward(columns: Column<any>[], layout: Layout, weight: number) {
    let didShift = false;
    for (let i = 0; i < columns.length; i += 1) {
        didShift = layoutColumn(columns[i], layout, weight, 1) || didShift;
    }
    return didShift;
}

function layoutColumnsBackwards(columns: Column<any>[], layout: Layout, weight: number) {
    let didShift = false;
    for (let i = columns.length - 1; i >= 0; i -= 1) {
        didShift = layoutColumn(columns[i], layout, weight, -1) || didShift;
    }
    return didShift;
}

export function layoutColumns(columns: Column<any>[], layout: Layout) {
    columns.forEach((column) => {
        justifyNodesAcrossColumn(column, layout);
    });

    let didLayoutColumnsBackwards = false;
    for (let i = 0; i < 6; i += 1) {
        const didLayoutColumnsForward = layoutColumnsForward(columns, layout, 1);
        didLayoutColumnsBackwards = layoutColumnsBackwards(columns, layout, 0.5);
        if (!didLayoutColumnsForward && !didLayoutColumnsBackwards) {
            break;
        }
    }

    if (didLayoutColumnsBackwards) {
        layoutColumnsForward(columns, layout, 1);
    }
}
