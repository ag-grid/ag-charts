import type { SankeyNodeDatum } from './sankeySeriesProperties';
import type { Link, NodeGraphEntry } from './sankeyUtil';

type Column<L extends Link> = {
    nodes: NodeGraphEntry<SankeyNodeDatum, L>[];
    size: number;
    readonly x: number;
};

interface LayoutProperties {
    seriesRectHeight: number;
    nodeSpacing: number;
    sizeScale: number;
}

function justifyNodesAcrossColumn(
    { nodes, size }: Column<any>,
    { seriesRectHeight, nodeSpacing, sizeScale }: LayoutProperties
) {
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

function separateNodesInColumn(column: Column<any>, { seriesRectHeight, nodeSpacing }: LayoutProperties) {
    column.nodes.sort((a, b) => a.datum.y - b.datum.y);

    let totalShift = 0;
    let currentY = 0;
    for (const { datum: node } of column.nodes) {
        const shift = Math.max(currentY - node.y, 0);

        node.y += shift;
        totalShift += shift;

        currentY = node.y + node.height + nodeSpacing;
    }

    const averageShift = totalShift / column.nodes.length;
    const lastNodeBottom = currentY - nodeSpacing;

    const shiftBackwards = Math.max(
        Math.min(averageShift / 2, column.nodes[0].datum.y),
        // Exceeded height
        lastNodeBottom - seriesRectHeight
    );
    if (shiftBackwards === 0) return totalShift !== 0;

    for (const { datum: node } of column.nodes) {
        node.y -= shiftBackwards;
    }

    return true;
}

function layoutColumnPass(columns: Column<any>[], properties: LayoutProperties) {
    let didShift = false;
    for (const column of columns) {
        column.nodes.forEach(({ datum: node, linksBefore }) => {
            if (linksBefore.length === 0) return;

            const totalMidPoints = linksBefore.reduce(
                (acc, { node: { datum: other } }) => acc + other.y + other.height / 2,
                0
            );
            const midPoint = totalMidPoints / linksBefore.length;
            node.y = midPoint - node.height / 2;
        });

        didShift = separateNodesInColumn(column, properties) || didShift;
    }

    return didShift;
}

export function layoutColumns(columns: Column<any>[], properties: LayoutProperties) {
    columns.forEach((column) => {
        justifyNodesAcrossColumn(column, properties);
    });

    for (let i = 0; i < 1; i += 1) {
        const didShift = layoutColumnPass(columns, properties);
        if (!didShift) {
            break;
        }
    }
}
