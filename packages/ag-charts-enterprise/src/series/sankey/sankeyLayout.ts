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
    nodes.sort((a, b) => Math.round(a.datum.y - b.datum.y * 100) / 100 || -(a.datum.size - b.datum.size));

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

function removeColumnCrossovers(column: Column) {
    console.group(column.index);
    const singleCrossoverColumns = column.nodes.filter((node) => node.linksAfter.length === 1);
    for (const { datum: node, linksAfter } of singleCrossoverColumns) {
        const nodeAfter = linksAfter[0].node.datum;
        // Use reciprocal gradients because there will always be a change in x so no infinities
        const recM0 = (nodeAfter.x - node.x) / (nodeAfter.y - node.y);
        for (const { datum: other, linksAfter: otherLinksAfter } of singleCrossoverColumns) {
            if (other === node) continue;

            const otherNodeAfter = otherLinksAfter[0].node.datum;
            const recM1 = (otherNodeAfter.x - other.x) / (otherNodeAfter.y - other.y);

            const x = ((other.y - node.y) * (recM0 * recM1) + node.x * recM1 + other.x * recM0) / (recM1 - recM0);

            const crossover = x > node.x && x < Math.max(nodeAfter.x, otherNodeAfter.x);

            if (crossover) {
                console.log('Swap', node.id, other.id, node.y, other.y);
                if (node.y < other.y) {
                    console.log('1');
                    const y = node.y;
                    node.y = other.y + other.height - node.height;
                    other.y = y;
                } else {
                    console.log('2');
                    const y = other.y;
                    other.y = node.y + node.height - other.height;
                    node.y = y;
                }
                console.groupEnd();
                return;
            }
        }
    }

    console.groupEnd();
}

export function layoutColumns(columns: Column[], layout: Layout) {
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

    columns.forEach(removeColumnCrossovers);
}
