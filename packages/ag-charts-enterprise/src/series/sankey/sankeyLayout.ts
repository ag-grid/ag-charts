import type { LinkedNode, NodeGraphEntry } from '../flow-proportion/flowProportionUtil';
import type { SankeyLinkDatum, SankeyNodeDatum } from './sankeySeriesProperties';

export type Column = {
    index: number;
    nodes: NodeGraphEntry<SankeyNodeDatum, SankeyLinkDatum>[];
    size: number;
    readonly x: number;
};

interface Layout {
    seriesRectHeight: number;
    nodeSpacing: number;
    sizeScale: number;
}

function sortNodesByY(column: Column) {
    column.nodes.sort((a, b) => Math.round((a.datum.y - b.datum.y) * 100) / 100 || -(a.datum.size - b.datum.size));
}

function justifyNodesAcrossColumn({ nodes, size }: Column, { seriesRectHeight, nodeSpacing, sizeScale }: Layout) {
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

function separateNodesInColumn(column: Column, layout: Layout) {
    const { nodes } = column;
    const { seriesRectHeight, nodeSpacing } = layout;
    sortNodesByY(column);

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

function hasCrossOver(
    x00: number,
    y00: number,
    x01: number,
    y01: number,
    x10: number,
    y10: number,
    x11: number,
    y11: number
) {
    const recM0 = (x01 - x00) / (y01 - y00);
    const recM1 = (x11 - x10) / (y11 - y10);

    const x = ((y10 - y00) * (recM0 * recM1) + x00 * recM1 - x10 * recM0) / (recM1 - recM0);

    if (x00 < x01) {
        return x > x00 && x < Math.min(x01, x11);
    } else {
        return x < x00 && x > Math.max(x01, x11);
    }
}

function removeColumnCrossoversInDirection(
    column: Column,
    getLinks: (link: NodeGraphEntry<SankeyNodeDatum, SankeyLinkDatum>) => LinkedNode<SankeyNodeDatum, SankeyLinkDatum>[]
) {
    let didShift = false;
    const singleCrossoverColumns = column.nodes.filter((node) => getLinks(node).length === 1);
    let didRemoveCrossover = true;
    for (let runs = 0; didRemoveCrossover && runs < singleCrossoverColumns.length; runs += 1) {
        didRemoveCrossover = false;
        for (let i = 0; i < singleCrossoverColumns.length - 1; i += 1) {
            const { datum: node } = singleCrossoverColumns[i];
            const nodeAfter = getLinks(singleCrossoverColumns[i])[0].node.datum;
            const { datum: otherNode } = singleCrossoverColumns[i + 1];
            const otherNodeAfter = getLinks(singleCrossoverColumns[i + 1])[0].node.datum;

            const crossover =
                hasCrossOver(
                    node.x,
                    node.y,
                    nodeAfter.x,
                    nodeAfter.y,
                    otherNode.x,
                    otherNode.y,
                    otherNodeAfter.x,
                    otherNodeAfter.y
                ) ||
                hasCrossOver(
                    node.x,
                    node.y + node.height / 2,
                    nodeAfter.x,
                    nodeAfter.y + nodeAfter.height / 2,
                    otherNode.x,
                    otherNode.y + otherNode.height / 2,
                    otherNodeAfter.x,
                    otherNodeAfter.y + otherNodeAfter.height / 2
                ) ||
                hasCrossOver(
                    node.x,
                    node.y + node.height,
                    nodeAfter.x,
                    nodeAfter.y + nodeAfter.height,
                    otherNode.x,
                    otherNode.y + otherNode.height,
                    otherNodeAfter.x,
                    otherNodeAfter.y + otherNodeAfter.height
                );

            if (!crossover) continue;

            const current = singleCrossoverColumns[i];
            singleCrossoverColumns[i] = singleCrossoverColumns[i + 1];
            singleCrossoverColumns[i + 1] = current;
            const y = node.y;
            node.y = otherNode.y + otherNode.height - node.height;
            otherNode.y = y;

            didShift = true;
            didRemoveCrossover = true;
        }
    }
    return didShift;
}

function removeColumnCrossovers(column: Column) {
    let didShift = false;
    sortNodesByY(column);
    didShift = removeColumnCrossoversInDirection(column, (node) => node.linksBefore) || didShift;
    didShift = removeColumnCrossoversInDirection(column, (node) => node.linksAfter) || didShift;
    return didShift;
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

function layoutColumn(column: Column, layout: Layout, weight: number, direction: -1 | 1) {
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

function layoutColumnsForward(columns: Column[], layout: Layout, weight: number) {
    let didShift = false;
    for (let i = 0; i < columns.length; i += 1) {
        didShift = layoutColumn(columns[i], layout, weight, 1) || didShift;
    }
    return didShift;
}

function layoutColumnsBackwards(columns: Column[], layout: Layout, weight: number) {
    let didShift = false;
    for (let i = columns.length - 1; i >= 0; i -= 1) {
        didShift = layoutColumn(columns[i], layout, weight, -1) || didShift;
    }
    return didShift;
}

function removeColumnsCrossovers(columns: Column[]) {
    let didShift = false;
    for (let i = columns.length - 1; i >= 0; i -= 1) {
        didShift = removeColumnCrossovers(columns[i]) || didShift;
    }
    return didShift;
}

export function layoutColumns(columns: Column[], layout: Layout) {
    columns.forEach((column) => {
        justifyNodesAcrossColumn(column, layout);
    });

    let didLayoutColumnsBackwards = false;
    for (let i = 0; i < 6; i += 1) {
        const didLayoutColumnsForward = layoutColumnsForward(columns, layout, 1);
        didLayoutColumnsBackwards = layoutColumnsBackwards(columns, layout, 0.5);
        const didRemoveColumnCrossovers = removeColumnsCrossovers(columns);
        if (!didLayoutColumnsForward && !didLayoutColumnsBackwards && !didRemoveColumnCrossovers) {
            break;
        }
    }

    if (didLayoutColumnsBackwards) {
        layoutColumnsForward(columns, layout, 1);
        removeColumnsCrossovers(columns);
    }
}
