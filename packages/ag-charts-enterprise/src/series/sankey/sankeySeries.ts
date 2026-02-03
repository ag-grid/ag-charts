import {
    type AgSankeySeriesLabelFormatterParams,
    type AgSankeySeriesNodeStyle,
    type AgSankeySeriesOptions,
    type FillOptions,
    type LineDashOptions,
    type StrokeOptions,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    Logger,
    type RequireOptional,
    TextMeasurer,
    cachedTextMeasurer,
    calcLineHeight,
    mergeDefaults,
    toPlainText,
    wrapText,
} from 'ag-charts-core';

import { FlowProportionDatumType } from '../flow-proportion/flowDatumIndex';
import type { FlowProportionNodeDatumIndex } from '../flow-proportion/flowDatumIndex';
import {
    type FlowProportionLinkDatum,
    type FlowProportionNodeDatum,
    FlowProportionSeries,
} from '../flow-proportion/flowProportionSeries';
import type { NodeGraphEntry } from '../flow-proportion/flowProportionUtil';
import { SankeyLink } from './sankeyLink';
import {
    type SankeyDatum,
    type SankeyLinkDatum,
    type SankeyNodeDatum,
    type SankeyNodeLabelDatum,
    SankeySeriesProperties,
} from './sankeySeriesProperties';

const { Transformable, SeriesNodePickMode, createDatumId, getShapeStyle, getLabelStyles, Rect, BBox } = _ModuleSupport;

type NodeStyle = Pick<FillOptions & StrokeOptions & LineDashOptions, 'fill' | 'stroke'> &
    Omit<Required<FillOptions & StrokeOptions & LineDashOptions>, 'fill' | 'stroke'>;

interface GhostNodeGraphEntry {
    ghost: boolean;
    columnIndex: number;
    datum: {
        size: number;
        y: number;
        height: number;
    };
    closestColumnDiff: number;
    size: number;
    weight: number;
    link: SankeyLinkDatum;
    linksBefore: { node: { columnIndex: number; datum: { size: number } } }[];
    linksAfter: { node: { columnIndex: number; datum: { size: number } } }[];
    fromNode: { y: number };
    toNode: { y: number };
}

type EnhancedNodeGraphEntry = NodeGraphEntry<SankeyNodeDatum, SankeyLinkDatum> & {
    weight: number;
    columnIndex: number;
    closestColumnDiff: number;
};

type Column = {
    index: number;
    nodes: ((NodeGraphEntry<SankeyNodeDatum, SankeyLinkDatum> & { weight: number }) | GhostNodeGraphEntry)[];
    size: number;
    x: number;
};

export class SankeySeries extends FlowProportionSeries<
    SankeyNodeDatum,
    SankeyLinkDatum,
    SankeyNodeLabelDatum,
    AgSankeySeriesOptions,
    SankeySeriesProperties,
    _ModuleSupport.Rect,
    SankeyLink
> {
    static override readonly className = 'SankeySeries';
    static readonly type = 'sankey' as const;

    override properties = new SankeySeriesProperties();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
        });
    }

    private isLabelEnabled() {
        return (this.properties.labelKey != null || this.nodes == null) && this.properties.label.enabled;
    }

    protected linkFactory() {
        return new SankeyLink();
    }

    protected nodeFactory() {
        return new Rect();
    }

    override createNodeData() {
        const seriesRectWidth = this._nodeDataDependencies?.seriesRectWidth ?? 0;
        const nodeWidth = this.properties.node.width;

        // Create the base node graph. This is only a graph of nodes and links and does not include any columns.
        const {
            nodeGraph: baseNodeGraph,
            links,
            maxPathLength,
        } = this.getNodeGraph(this.createNode.bind(this, nodeWidth), this.createLink, {
            includeCircularReferences: false,
        });
        const nodeGraph = baseNodeGraph as Map<string, EnhancedNodeGraphEntry>;

        if (nodeGraph.size === 0) return;

        const columns = this.initialiseColumns(maxPathLength);
        this.assignNodesToColumns(nodeGraph, columns, maxPathLength);

        const measurer = cachedTextMeasurer(this.properties.label);
        const { columnLabelInsetBefore, columnLabelInsetAfter } = this.getColumnLabelInsets(
            columns,
            measurer,
            maxPathLength
        );
        const columnWidth =
            (seriesRectWidth - nodeWidth - columnLabelInsetBefore - columnLabelInsetAfter) / (maxPathLength - 1);

        this.positionNodesInColumnsX(columns, columnWidth, columnLabelInsetBefore);
        this.createGhostNodesAndColumnDiffs(nodeGraph, columns);
        this.weightNodes(columns);

        // Minimum visual height of nodes and links. Though they continue to be rendered in the correct positions as if
        // they were their calculated heights.
        const minSize = 1;

        const { sizeScale, nodeSpacing } = this.getScaleAndSpacing(columns, minSize);

        if (sizeScale < 0) {
            Logger.warnOnce(
                'There was insufficient space to display the Sankey Series. Reduce [node.spacing], [node.minSpacing], or provide a larger container.'
            );
            return;
        }

        this.positionNodesInColumnsY(columns, minSize, sizeScale, nodeSpacing);
        this.sortAndPositionLinks(nodeGraph, sizeScale);

        const nodeData: SankeyDatum[] = [];
        const labelData: SankeyNodeLabelDatum[] = [];

        this.createNodesNodeData(nodeData, nodeGraph, columns, columnWidth, measurer, labelData);
        this.createLinksNodeData(nodeData, links, minSize, sizeScale);

        return {
            itemId: this.id,
            nodeData,
            labelData,
        };
    }

    private createNode(nodeWidth: number, node: FlowProportionNodeDatum<SankeyNodeDatum, SankeyLinkDatum>) {
        return {
            ...node,
            x: Number.NaN,
            y: Number.NaN,
            width: nodeWidth,
            height: Number.NaN,
        };
    }

    private createLink(this: void, link: FlowProportionLinkDatum<SankeyNodeDatum, SankeyLinkDatum>) {
        return {
            ...link,
            x1: Number.NaN,
            x2: Number.NaN,
            y1: Number.NaN,
            y2: Number.NaN,
            height: Number.NaN,
            elbows: [],
        };
    }

    private initialiseColumns(maxPathLength: number) {
        const columns: Column[] = [];
        for (let index = 0; index < maxPathLength; index += 1) {
            columns.push({ index, size: 0, nodes: [], x: 0 });
        }
        return columns;
    }

    private assignNodesToColumns(
        nodeGraph: Map<string, EnhancedNodeGraphEntry>,
        columns: Column[],
        maxPathLength: number
    ) {
        const { fromKey, toKey, sizeKey, labelKey } = this.properties;

        for (const graphNode of nodeGraph.values()) {
            const { datum: node, linksBefore, linksAfter } = graphNode;
            const size = Math.max(
                linksBefore.reduce((acc, { link }) => acc + link.size, 0),
                linksAfter.reduce((acc, { link }) => acc + link.size, 0)
            );

            if ((linksBefore.length === 0 && linksAfter.length === 0) || size === 0) {
                graphNode.columnIndex = -1;
                continue;
            }

            const column = this.getNodeColumn(columns, graphNode, maxPathLength);

            node.size = size;

            const { label } = this.properties;
            const labelText = label.enabled
                ? this.getLabelText<AgSankeySeriesLabelFormatterParams>(
                      node.label,
                      node.datum,
                      labelKey!,
                      'label',
                      [],
                      this.properties.label,
                      { datum: node.datum, value: node.label, fromKey, toKey, sizeKey, size }
                  )
                : undefined;
            node.label = toPlainText(labelText);

            column.nodes.push(graphNode);
            column.size += size;

            graphNode.columnIndex = column.index;
        }
    }

    private getNodeColumn(columns: Column[], graphNode: EnhancedNodeGraphEntry, maxPathLength: number) {
        const {
            node: { alignment },
        } = this.properties;

        const { linksBefore, linksAfter, maxPathLengthBefore, maxPathLengthAfter } = graphNode;

        let column: Column;

        switch (alignment) {
            case 'left':
                column = columns[maxPathLengthBefore];
                break;
            case 'right':
                column = columns[maxPathLength - 1 - maxPathLengthAfter];
                break;
            case 'center': {
                if (linksBefore.length !== 0) {
                    column = columns[maxPathLengthBefore];
                } else if (linksAfter.length === 0) {
                    column = columns[0];
                } else {
                    const columnIndex =
                        linksAfter.reduce((acc, link) => Math.min(acc, link.node.maxPathLengthBefore), maxPathLength) -
                        1;
                    column = columns[columnIndex];
                }
                break;
            }
            case 'justify': {
                column = linksAfter.length === 0 ? columns[maxPathLength - 1] : columns[maxPathLengthBefore];
                break;
            }
        }

        return column;
    }

    private getColumnLabelInsets(columns: Column[], measurer: TextMeasurer, maxPathLength: number) {
        const {
            label: { spacing: labelSpacing, placement: labelPlacement, edgePlacement: edgeLabelPlacement },
            node: { width: nodeWidth },
        } = this.properties;

        const seriesRectWidth = this._nodeDataDependencies?.seriesRectWidth ?? 0;

        let columnLabelInsetBefore = 0;
        let columnLabelInsetAfter = 0;

        if (this.isLabelEnabled() && (edgeLabelPlacement === 'outside' || edgeLabelPlacement == null)) {
            // If the labels are either placed outside or unplaced, add extra spacing before and after
            // based on the width of the longest label in the first and last columns, respectively.
            const reduceLabelWidthFn = (acc: number, n: Column['nodes'][number]) => {
                const node = n as EnhancedNodeGraphEntry;
                if (node.datum.label == null || node.datum.label === '') return acc;
                let maxWidth = (seriesRectWidth - nodeWidth) / (maxPathLength - 1) - labelSpacing;
                if (labelPlacement === 'center' && edgeLabelPlacement == null) maxWidth /= 2;
                const text = wrapText(node.datum.label, {
                    maxWidth,
                    maxHeight: node.datum.height,
                    font: this.properties.label,
                    textWrap: 'never',
                });
                let { width } = measurer.measureLines(text);
                if (labelPlacement === 'center' && edgeLabelPlacement == null) width /= 2;
                return Math.max(acc, width);
            };
            if (labelPlacement !== 'right' || edgeLabelPlacement === 'outside') {
                columnLabelInsetBefore = nodeWidth + columns[0].nodes.reduce(reduceLabelWidthFn, 0);
            }
            if (labelPlacement !== 'left' || edgeLabelPlacement === 'outside') {
                columnLabelInsetAfter = nodeWidth + columns.at(-1)!.nodes.reduce(reduceLabelWidthFn, 0);
            }
        }

        return { columnLabelInsetBefore, columnLabelInsetAfter };
    }

    private positionNodesInColumnsX(columns: Column[], columnWidth: number, columnLabelInsetBefore: number) {
        for (let index = 0; index < columns.length; index++) {
            const column = columns[index];
            column.x = columnLabelInsetBefore + index * columnWidth;
            for (const graphNode of column.nodes) {
                (graphNode.datum as SankeyNodeDatum).x = column.x;
            }
        }
    }

    private createGhostNodesAndColumnDiffs(nodeGraph: Map<string, EnhancedNodeGraphEntry>, columns: Column[]) {
        for (const graphNode of nodeGraph.values()) {
            graphNode.weight = 0;

            // Get the distance to the closest column to which this link is attached, used for sorting later
            let closestColumnDiff = Infinity;
            for (const link of graphNode.linksAfter) {
                const node = link.node as EnhancedNodeGraphEntry;
                closestColumnDiff = Math.min(closestColumnDiff, node.columnIndex - graphNode.columnIndex);
            }
            if (closestColumnDiff === Infinity) {
                for (const link of graphNode.linksBefore) {
                    const node = link.node as EnhancedNodeGraphEntry;
                    closestColumnDiff = Math.min(closestColumnDiff, graphNode.columnIndex - node.columnIndex);
                }
            }
            graphNode.closestColumnDiff = closestColumnDiff;

            this.createNodeGhostNodes(graphNode, columns, closestColumnDiff);
        }
    }

    private createNodeGhostNodes(graphNode: EnhancedNodeGraphEntry, columns: Column[], closestColumnDiff: number) {
        // Add ghost nodes into spaces within columns through which the link must pass, to reduce crossovers
        for (const link of graphNode.linksAfter) {
            const node = link.node as EnhancedNodeGraphEntry;
            if (node.columnIndex <= graphNode.columnIndex) continue;

            for (let i = node.columnIndex - 1; i > graphNode.columnIndex; i--) {
                const size = link.link.size;
                const ghostNode: GhostNodeGraphEntry = {
                    ghost: true,
                    datum: { ...graphNode.datum, size, y: 0, height: 0 },
                    weight: 0,
                    linksBefore: [{ node: { columnIndex: i - 1, datum: { size } } }],
                    linksAfter: [{ node: { columnIndex: i + 1, datum: { size } } }],
                    link: link.link,
                    columnIndex: graphNode.columnIndex,
                    size: graphNode.datum.size,
                    closestColumnDiff,
                    fromNode: { y: node.datum.y },
                    toNode: { y: 0 },
                };
                columns[i].size += size;
                columns[i].nodes.push(ghostNode);
            }
        }
    }

    private weightNodes(columns: Column[]) {
        const { properties } = this;

        if (properties.node.sort === 'data') return;

        if (properties.node.sort !== 'auto') {
            for (const column of columns) {
                column.nodes.sort((a, b) => this.sortNodes(a as EnhancedNodeGraphEntry, b as EnhancedNodeGraphEntry));
            }
            return;
        }

        // Weight the columns into powers of 10 so that columns with fewer and larger nodes have more influence on each
        // node's weight.
        const sortedColumns = columns.toSorted((a, b) => {
            const aMax = a.nodes.reduce((acc, n) => Math.max(acc, n.datum.size), 0);
            const bMax = b.nodes.reduce((acc, n) => Math.max(acc, n.datum.size), 0);
            return bMax - aMax;
        });

        const columnWeights: Record<number, number> = {};
        for (let i = 0; i < sortedColumns.length; i++) {
            columnWeights[sortedColumns[i].index] = Math.pow(10, sortedColumns.length - i - 1);
        }

        // Sort nodes within columns by their weight plus the weight of their links, influenced by the column weight.
        // An initial pass sorts nodes exclusively by their own weight. The second pass then applies an influence
        // from their neighbours based on the now sorted index and column weight. This ensures nodes are always
        // sorted into groups next to their neighbours, even with close or identical neighbour sizes.
        for (const column of columns) {
            for (const node of column.nodes) {
                if ('ghost' in node && node.ghost) {
                    node.weight = (node.size / column.size) * columnWeights[column.index];
                    continue;
                }
                node.weight = (node.datum.size / column.size) * columnWeights[column.index];
            }
            column.nodes.sort((a, b) => a.weight - b.weight);
        }

        for (const column of columns) {
            for (const node of column.nodes) {
                // Ghost nodes ignore the weight of their links, as this is already factored in by the concrete nodes.
                if ('ghost' in node && node.ghost) {
                    continue;
                }

                node.weight += node.linksBefore.reduce((acc, before: any) => {
                    if (before.node.columnIndex !== column.index - 1) return acc;
                    const weight =
                        columns[before.node.columnIndex].nodes.indexOf(before.node) *
                        columnWeights[before.node.columnIndex];
                    return Math.max(acc, weight);
                }, 0);
                node.weight += node.linksAfter.reduce((acc, after: any) => {
                    if (after.node.columnIndex !== column.index + 1) return acc;
                    const weight =
                        columns[after.node.columnIndex].nodes.indexOf(after.node) *
                        columnWeights[after.node.columnIndex];
                    return Math.max(acc, weight);
                }, 0);
            }

            column.nodes.sort((a, b) => this.sortNodes(a as EnhancedNodeGraphEntry, b as EnhancedNodeGraphEntry));
        }
    }

    private getScaleAndSpacing(columns: Column[], minSize: number) {
        const seriesRectHeight = this._nodeDataDependencies?.seriesRectHeight ?? 0;

        // Get the spacing between nodes, reduced as necessary to fit into the series area
        const getSizeScale = (spacing: number) => {
            return columns.reduce((acc, { size, nodes }) => {
                const spacingAccomodation = seriesRectHeight - nodes.length * minSize;
                const spacingOccupation = ((nodes.length - 1) * spacing) / spacingAccomodation;
                const columnSizeScale = (1 - spacingOccupation) / size;
                return Math.min(acc, columnSizeScale);
            }, Infinity);
        };

        let nodeSpacing = this.properties.node.spacing;
        let sizeScale = getSizeScale(nodeSpacing);
        while (sizeScale < 0 && nodeSpacing > this.properties.node.minSpacing) {
            nodeSpacing -= 1;
            sizeScale = getSizeScale(nodeSpacing);
        }

        return { nodeSpacing, sizeScale };
    }

    private positionNodesInColumnsY(columns: Column[], minSize: number, sizeScale: number, nodeSpacing: number) {
        const seriesRectHeight = this._nodeDataDependencies?.seriesRectHeight ?? 0;

        for (const column of columns) {
            let columnNodesHeight = 0;
            for (const node of column.nodes) {
                const height = seriesRectHeight * node.datum.size * sizeScale;
                node.datum.height = Math.max(minSize, height);
                columnNodesHeight += height;
            }

            const spacingOccupation = nodeSpacing * (column.nodes.length - 1);
            let y = 0;
            if (this.properties.node.verticalAlignment === 'bottom') {
                y = seriesRectHeight - columnNodesHeight - spacingOccupation;
            } else if (this.properties.node.verticalAlignment === 'center') {
                y = (seriesRectHeight - columnNodesHeight - spacingOccupation) / 2;
            }

            for (const node of column.nodes) {
                node.datum.y = y;
                y += seriesRectHeight * node.datum.size * sizeScale + nodeSpacing;

                // Add an elbow to the link to align it with the ghost node in this column
                if ('ghost' in node && node.ghost) {
                    node.link.elbows.push({ x: column.x, y: node.datum.y });
                }
            }
        }
    }

    private sortAndPositionLinks(nodeGraph: Map<string, EnhancedNodeGraphEntry>, sizeScale: number) {
        const seriesRectHeight = this._nodeDataDependencies?.seriesRectHeight ?? 0;

        for (const { datum, linksBefore, linksAfter } of nodeGraph.values()) {
            let y2 = datum.y;
            linksBefore.sort((a, b) =>
                this.sortNodes(a.node as EnhancedNodeGraphEntry, b.node as EnhancedNodeGraphEntry)
            );
            for (const { link } of linksBefore) {
                link.y2 = y2;
                y2 += link.size * seriesRectHeight * sizeScale;
            }

            let y1 = datum.y;
            linksAfter.sort((a, b) =>
                this.sortNodes(a.node as EnhancedNodeGraphEntry, b.node as EnhancedNodeGraphEntry, {
                    invertColumnSort: true,
                })
            );
            for (const { link } of linksAfter) {
                link.y1 = y1;
                y1 += link.size * seriesRectHeight * sizeScale;
            }
        }
    }

    private createNodesNodeData(
        nodeData: SankeyDatum[],
        nodeGraph: Map<string, EnhancedNodeGraphEntry>,
        columns: Column[],
        columnWidth: number,
        measurer: TextMeasurer,
        labelData: SankeyNodeLabelDatum[]
    ) {
        for (const [index, column] of columns.entries()) {
            const leading = index === 0;
            const trailing = index === columns.length - 1;

            let bottom = -Infinity;
            column.nodes.sort((a, b) => a.datum.y - b.datum.y);
            for (const n of column.nodes) {
                if ('ghost' in n && n.ghost) continue;

                const { datum: node } = n as EnhancedNodeGraphEntry;

                node.midPoint = {
                    x: node.x + node.width / 2,
                    y: node.y + node.height / 2,
                };
                nodeData.push(node);

                bottom = this.createNodeLabelData(
                    nodeGraph,
                    columnWidth,
                    measurer,
                    labelData,
                    node,
                    leading,
                    trailing,
                    bottom
                );
            }
        }
    }

    private createNodeLabelData(
        nodeGraph: Map<string, EnhancedNodeGraphEntry>,
        columnWidth: number,
        measurer: TextMeasurer,
        labelData: SankeyNodeLabelDatum[],
        node: SankeyNodeDatum,
        leading: boolean,
        trailing: boolean,
        bottom: number
    ) {
        if (node.label == null) return bottom;

        const {
            label: { spacing: labelSpacing, edgePlacement: edgeLabelPlacement, fontSize },
        } = this.properties;

        const seriesRectWidth = this._nodeDataDependencies?.seriesRectWidth ?? 0;

        const y = node.y + node.height / 2;
        let text: string | undefined;

        if (!leading && !trailing) {
            const lineHeight = calcLineHeight(fontSize);
            const y1 = y - lineHeight;
            const y2 = y + lineHeight;
            let maxX = seriesRectWidth;
            for (const { datum } of nodeGraph.values()) {
                const intersectsLabel =
                    datum.x > node.x && Math.max(datum.y, y1) <= Math.min(datum.y + datum.height, y2);
                if (intersectsLabel) {
                    maxX = Math.min(maxX, datum.x - labelSpacing);
                }
            }
            const maxWidth = maxX - node.x - 2 * labelSpacing;
            text = wrapText(node.label, {
                maxWidth,
                maxHeight: node.height,
                font: this.properties.label,
                textWrap: 'never',
                overflow: 'hide',
            });
        }

        if (text == null || text === '') {
            const labelInset = edgeLabelPlacement == null && (leading || trailing) ? labelSpacing : labelSpacing * 2;
            text = wrapText(node.label, {
                maxWidth: columnWidth - labelInset,
                maxHeight: node.height,
                font: this.properties.label,
                textWrap: 'never',
            });
        }

        if (text === '') return bottom;

        const { height } = measurer.measureLines(text);
        const y0 = y - height / 2;
        const y1 = y + height / 2;

        const { x, textAlign } = this.getNodeLabelPlacement(node, leading, trailing);

        if (y0 >= bottom) {
            labelData.push({
                x,
                y,
                textAlign,
                text,
                size: node.size,
                nodeDatum: node,
                datumIndex: node.datumIndex,
            });
            bottom = y1;
        }

        return bottom;
    }

    private getNodeLabelPlacement(node: SankeyNodeDatum, leading: boolean, trailing: boolean) {
        const {
            label: { spacing: labelSpacing, placement: labelPlacement, edgePlacement: edgeLabelPlacement },
        } = this.properties;

        let x = node.x + node.width + labelSpacing;
        let textAlign: 'left' | 'right' | 'center' = 'left';

        let placement = labelPlacement;

        if (leading && edgeLabelPlacement == null && labelPlacement == null) {
            placement = 'left';
        }

        if (edgeLabelPlacement === 'outside') {
            if (leading) placement = 'left';
            if (trailing) placement = 'right';
        } else if (edgeLabelPlacement === 'inside') {
            if (leading) placement = 'right';
            if (trailing) placement = 'left';
        }

        if (placement === 'left') {
            x = node.x - labelSpacing;
            textAlign = 'right';
        } else if (placement === 'center') {
            x = node.x + node.width / 2;
            textAlign = 'center';
        }

        return { x, textAlign };
    }

    private createLinksNodeData(nodeData: SankeyDatum[], links: SankeyLinkDatum[], minSize: number, sizeScale: number) {
        const seriesRectHeight = this._nodeDataDependencies?.seriesRectHeight ?? 0;
        const nodeWidth = this.properties.node.width;

        for (const link of links) {
            const { fromNode, toNode, size } = link;
            link.height = Math.max(minSize, seriesRectHeight * size * sizeScale);
            link.x1 = fromNode.x + nodeWidth;
            link.x2 = toNode.x;
            link.midPoint = {
                x: (link.x1 + link.x2) / 2,
                y: (link.y1 + link.y2) / 2 + link.height / 2,
            };

            nodeData.push(link);
        }
    }

    private sortNodes(a: EnhancedNodeGraphEntry, b: EnhancedNodeGraphEntry, opts?: { invertColumnSort: boolean }) {
        const { properties } = this;

        if (properties.node.sort === 'ascending') {
            return (a.datum.label ?? '').localeCompare(b.datum.label ?? '');
        } else if (properties.node.sort === 'descending') {
            return (b.datum.label ?? '').localeCompare(a.datum.label ?? '');
        } else if (properties.node.sort === 'data') {
            return 0;
        }

        // Ghost nodes reference their concrete column index so are sorted such that ghosts linked before are
        // given priority
        if (a.columnIndex < b.columnIndex) return opts?.invertColumnSort ? 1 : -1;
        if (a.columnIndex > b.columnIndex) return opts?.invertColumnSort ? -1 : 1;

        // Ghost nodes with the same weight are compared by their associated concrete datum's size
        if (a.weight === b.weight) {
            return a.datum.size - b.datum.size;
        }

        // Sort nodes that have distal links to the top
        if (a.closestColumnDiff < b.closestColumnDiff) return 1;
        if (a.closestColumnDiff > b.closestColumnDiff) return -1;

        // Sort heavier nodes to the bottom
        return a.weight - b.weight;
    }

    protected updateLabelSelection(opts: {
        labelData: SankeyNodeLabelDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, SankeyNodeLabelDatum>;
    }) {
        const labels = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(labels);
    }

    protected updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, SankeyNodeLabelDatum>;
    }) {
        const activeHighlightDatum = this.getHighlightedDatum();
        opts.labelSelection.each((label, datum) => {
            const { x, y, textAlign, text, datumIndex, nodeDatum } = datum;
            const params: RequireOptional<AgSankeySeriesLabelFormatterParams> = {
                fromKey: this.properties.fromKey,
                size: datum.size,
                sizeKey: this.properties.sizeKey,
                toKey: this.properties.toKey,
            };

            const isHighlight = this.isLabelHighlighted(nodeDatum, activeHighlightDatum);
            const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
            const style = getLabelStyles(
                this,
                undefined,
                params,
                this.properties.label,
                isHighlight,
                activeHighlightDatum
            );
            const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = style;
            label.visible = true;
            label.x = x;
            label.y = y;
            label.text = text;
            label.fill = fill;
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;
            label.fontSize = fontSize;
            label.fontFamily = fontFamily;
            label.textAlign = textAlign;
            label.textBaseline = 'middle';
            const opacity = highlightStyle.opacity ?? 1;
            label.opacity = opacity;
            label.fillOpacity = opacity;
            label.setBoxing(style);
        });
    }

    protected updateNodeSelection(opts: {
        nodeData: SankeyNodeDatum[];
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, SankeyNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.type, datum.id));
    }

    protected getNodeStyle(nodeDatum: Partial<SankeyNodeDatum>, fromNodeDatumIndex: number, isHighlight: boolean) {
        const { properties } = this;
        const {
            fills,
            strokes,
            defaultColorRange,
            defaultPatternFills,
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults,
        } = properties;
        const { itemStyler } = properties.node;

        const defaultColorStops = defaultColorRange[fromNodeDatumIndex % defaultColorRange.length].map((color) => ({
            color,
        }));
        const defaultPatternFill = defaultPatternFills[fromNodeDatumIndex % defaultPatternFills.length];

        const highlightStyle = this.getHighlightStyle(isHighlight, nodeDatum.datumIndex);
        const baseStyle = mergeDefaults(highlightStyle, properties.getStyle(false, fills, strokes, fromNodeDatumIndex));
        const hasNodeFill = properties.node.fill != null;
        let style = getShapeStyle(
            baseStyle,
            hasNodeFill ? fillGradientDefaults : { ...fillGradientDefaults.toJson(), colorStops: defaultColorStops },
            hasNodeFill
                ? fillPatternDefaults
                : { ...fillPatternDefaults.toJson(), fill: defaultPatternFill, stroke: defaultPatternFill },
            fillImageDefaults
        );

        if (itemStyler != null && nodeDatum.datumIndex != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(nodeDatum.datumIndex.index, 'node', isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(nodeDatum, isHighlight, style);
                    return this.callWithContext(itemStyler, params);
                }
            );

            if (overrides) {
                style = mergeDefaults(
                    overrides,
                    style,
                    { ...fillGradientDefaults.toJson(), colorStops: defaultColorStops },
                    { ...fillPatternDefaults.toJson(), fill: defaultPatternFill, stroke: defaultPatternFill },
                    fillImageDefaults
                );
            }
        }

        style.opacity = 1;

        return style;
    }

    private makeItemStylerParams(
        { datum, datumIndex, size = 0, label }: Partial<SankeyNodeDatum>,
        isHighlight: boolean,
        style: Required<AgSankeySeriesNodeStyle>
    ) {
        const { id: seriesId } = this;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum,
            highlightState,
            ...style,
            size,
            label,
            fill,
        };
    }

    protected updateNodeNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, SankeyNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((rect, datum) => {
            const { datumIndex } = datum;
            const style = this.getNodeStyle(datum, datumIndex.index, isHighlight);

            rect.x = datum.x;
            rect.y = datum.y;
            rect.width = Math.max(datum.width, 0);
            rect.height = Math.max(datum.height, 0);

            rect.setStyleProperties(style, fillBBox);
        });
    }

    private getShapeFillBBox(): _ModuleSupport.ShapeFillBBox {
        const width = this._nodeDataDependencies?.seriesRectWidth ?? 0;
        const height = this._nodeDataDependencies?.seriesRectHeight ?? 0;
        const bbox = new BBox(0, 0, width, height);
        return { series: bbox, axis: bbox };
    }

    protected updateLinkSelection(opts: {
        nodeData: SankeyLinkDatum[];
        datumSelection: _ModuleSupport.Selection<SankeyLink, SankeyLinkDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) =>
            createDatumId(datum.type, datum.index, datum.fromNode.id, datum.toNode.id)
        );
    }

    protected override getLinkStyle(
        { datumIndex, datum }: Partial<SankeyLinkDatum>,
        fromNodeDatumIndex: FlowProportionNodeDatumIndex,
        isHighlight: boolean
    ) {
        const { id: seriesId, properties } = this;
        const {
            fills,
            strokes,
            defaultColorRange,
            defaultPatternFills,
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults,
        } = properties;
        const { itemStyler } = properties.link;

        const defaultColorStops = defaultColorRange[fromNodeDatumIndex.index % defaultColorRange.length].map(
            (color) => ({
                color,
            })
        );
        const defaultPatternFill = defaultPatternFills[fromNodeDatumIndex.index % defaultPatternFills.length];

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const baseStyle = mergeDefaults(
            highlightStyle,
            properties.getStyle(true, fills, strokes, fromNodeDatumIndex.index)
        );
        const hasLinkFill = properties.link.fill != null;
        let style = getShapeStyle(
            baseStyle,
            hasLinkFill ? fillGradientDefaults : { ...fillGradientDefaults.toJson(), colorStops: defaultColorStops },
            hasLinkFill
                ? fillPatternDefaults
                : { ...fillPatternDefaults.toJson(), fill: defaultPatternFill, stroke: defaultPatternFill },
            fillImageDefaults
        );

        if (itemStyler != null && datumIndex != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex.index, 'link', isHighlight ? 'highlight' : 'node'),
                () => {
                    const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
                    const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);

                    return this.callWithContext(itemStyler, {
                        seriesId,
                        datum,
                        highlightState,
                        ...style,
                    });
                }
            );

            if (overrides) {
                style = mergeDefaults(
                    overrides,
                    style,
                    { ...fillGradientDefaults.toJson(), colorStops: defaultColorStops },
                    { ...fillPatternDefaults.toJson(), fill: defaultPatternFill, stroke: defaultPatternFill },
                    fillImageDefaults
                );
            }
        }

        style.opacity = 1;
        return style;
    }

    protected updateLinkNodes(opts: {
        datumSelection: _ModuleSupport.Selection<SankeyLink, SankeyLinkDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((link, datum) => {
            const fromNodeDatumIndex = datum.fromNode.datumIndex;
            const style = this.getLinkStyle(datum, fromNodeDatumIndex, isHighlight);

            link.x1 = datum.x1;
            link.y1 = datum.y1;
            link.x2 = datum.x2;
            link.y2 = datum.y2;
            link.height = datum.height;
            link.elbows = datum.elbows;

            link.setStyleProperties(style, fillBBox);

            link.inset = link.strokeWidth / 2;
        });
    }

    override getTooltipContent(datumIndex: FlowProportionNodeDatumIndex): _ModuleSupport.TooltipContent | undefined {
        const {
            id: seriesId,
            linksProcessedData,
            nodesProcessedData,
            properties,
            ctx: { formatManager },
        } = this;
        const { fromKey, toKey, sizeKey, sizeName, tooltip } = properties;

        // This needs refactoring
        const seriesDatum = this.contextNodeData?.nodeData.find(
            (d) => d.datumIndex.type === datumIndex.type && d.datumIndex.index === datumIndex.index
        );
        if (seriesDatum == null) return;

        const nodeIndex =
            seriesDatum.type === FlowProportionDatumType.Link ? seriesDatum.fromNode.index : seriesDatum.index;
        const title =
            seriesDatum.type === FlowProportionDatumType.Link
                ? `${seriesDatum.fromNode.label} - ${seriesDatum.toNode.label}`
                : seriesDatum.label;
        const datum =
            datumIndex.type === FlowProportionDatumType.Link
                ? linksProcessedData?.dataSources.get(this.id)?.data[datumIndex.index]
                : nodesProcessedData?.dataSources.get(this.id)?.data[datumIndex.index];
        const size = seriesDatum.size;

        let format: Required<NodeStyle>;
        if (seriesDatum.type === FlowProportionDatumType.Link) {
            const fromNodeDatumIndex = seriesDatum.fromNode.datumIndex;
            format = this.getLinkStyle({ datumIndex, datum }, fromNodeDatumIndex, false);
        } else {
            format = this.getNodeStyle({ datumIndex, datum }, datumIndex.index, false);
        }

        const data: _ModuleSupport.TooltipContentDataRow[] = [];
        if (sizeKey != null) {
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value: size,
                datum,
                seriesId,
                legendItemName: undefined,
                key: sizeKey,
                source: 'tooltip',
                property: 'size',
                domain: [],
                boundSeries: this.getFormatterContext('size'),
                fractionDigits: undefined,
                visibleDomain: undefined,
            });
            data.push({ label: sizeName, fallbackLabel: sizeKey, value: content ?? String(size) });
        }

        return this.formatTooltipWithContext(
            tooltip,
            {
                title,
                symbol: this.legendItemSymbol(seriesDatum.type, nodeIndex, format),
                data,
            },
            {
                seriesId,
                datum,
                title,
                fromKey,
                toKey,
                sizeKey,
                sizeName,
                size,
                ...format,
            }
        );
    }

    protected computeFocusBounds(
        node: _ModuleSupport.Rect | SankeyLink
    ): _ModuleSupport.BBox | _ModuleSupport.Path | undefined {
        if (node instanceof Rect) {
            const { x, y, width, height } = node;
            const bbox = new BBox(x, y, width, height);
            return Transformable.toCanvas(this.contentGroup, bbox);
        }
        return node;
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.node.itemStyler != null ||
            this.properties.link.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
