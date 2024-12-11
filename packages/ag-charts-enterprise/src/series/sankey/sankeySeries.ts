import { type FillOptions, type LineDashOptions, type StrokeOptions, _ModuleSupport } from 'ag-charts-community';

import { FlowProportionDatumType, FlowProportionSeries } from '../flow-proportion/flowProportionSeries';
import type { NodeGraphEntry } from '../flow-proportion/flowProportionUtil';
import { type Column, layoutColumns } from './sankeyLayout';
import { SankeyLink } from './sankeyLink';
import {
    type SankeyDatum,
    type SankeyLinkDatum,
    type SankeyNodeDatum,
    type SankeyNodeLabelDatum,
    SankeySeriesProperties,
} from './sankeySeriesProperties';

const { Transformable } = _ModuleSupport;

const { SeriesNodePickMode, CachedTextMeasurerPool, TextWrapper, TextUtils, createDatumId, Logger, Rect, BBox } =
    _ModuleSupport;

type NodeStyle = Pick<FillOptions & StrokeOptions & LineDashOptions, 'fill' | 'stroke'> &
    Omit<Required<FillOptions & StrokeOptions & LineDashOptions>, 'fill' | 'stroke'>;

type LinkStyle = NodeStyle;

export class SankeySeries extends FlowProportionSeries<
    SankeyNodeDatum,
    SankeyLinkDatum,
    SankeyNodeLabelDatum,
    SankeySeriesProperties,
    _ModuleSupport.Rect,
    SankeyLink
> {
    static readonly className = 'SankeySeries';
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
        const {
            id: seriesId,
            _nodeDataDependencies: { seriesRectWidth, seriesRectHeight } = { seriesRectWidth: 0, seriesRectHeight: 0 },
        } = this;

        const {
            fromKey,
            toKey,
            sizeKey,
            label: { spacing: labelSpacing },
            node: { spacing: nodeSpacing, width: nodeWidth, alignment },
        } = this.properties;

        const {
            nodeGraph: baseNodeGraph,
            links,
            maxPathLength,
        } = this.getNodeGraph(
            (node) => ({
                ...node,
                x: NaN,
                y: NaN,
                width: nodeWidth,
                height: NaN,
            }),
            (link) => ({
                ...link,
                x1: NaN,
                x2: NaN,
                y1: NaN,
                y2: NaN,
                height: NaN,
            }),
            { includeCircularReferences: false }
        );
        type EnhancedNodeGraphEntry = NodeGraphEntry<SankeyNodeDatum, SankeyLinkDatum> & {
            columnIndex: number;
            closestColumnIndex: number;
            maxSizeOfClosestNodesAfter: number;
        };
        const nodeGraph = baseNodeGraph as Map<string, EnhancedNodeGraphEntry>;

        const inset = this.isLabelEnabled()
            ? (seriesRectWidth - nodeWidth) * (1 - maxPathLength / (maxPathLength + 1))
            : 0;
        const columnWidth = (seriesRectWidth - nodeWidth - 2 * inset) / (maxPathLength - 1);

        const columns: Column[] = [];
        for (let index = 0; index < maxPathLength; index += 1) {
            const x = inset + index * columnWidth;
            columns.push({ index, size: 0, nodes: [], x });
        }

        nodeGraph.forEach((graphNode) => {
            const { datum: node, linksBefore, linksAfter, maxPathLengthBefore, maxPathLengthAfter } = graphNode;
            const size = Math.max(
                linksBefore.reduce((acc, { link }) => acc + link.size, 0),
                linksAfter.reduce((acc, { link }) => acc + link.size, 0)
            );

            if ((linksBefore.length === 0 && linksAfter.length === 0) || size === 0) {
                graphNode.columnIndex = -1;
                return;
            }

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
                        // eslint-disable-next-line no-negated-condition
                    } else if (linksAfter.length !== 0) {
                        const columnIndex =
                            linksAfter.reduce(
                                (acc, link) => Math.min(acc, link.node.maxPathLengthBefore),
                                maxPathLength
                            ) - 1;
                        column = columns[columnIndex];
                    } else {
                        column = columns[0];
                    }
                    break;
                }
                case 'justify': {
                    column = linksAfter.length === 0 ? columns[maxPathLength - 1] : columns[maxPathLengthBefore];
                    break;
                }
            }

            node.x = column.x;
            node.size = size;

            const label = this.getLabelText(this.properties.label, {
                datum: node.datum,
                value: node.label,
                fromKey,
                toKey,
                sizeKey,
                size,
            });
            node.label = String(label);

            column.nodes.push(graphNode);
            column.size += size;

            graphNode.columnIndex = column.index;
        });

        nodeGraph.forEach((graphNode) => {
            let closestColumnIndex = Infinity;
            let maxSizeOfClosestNodesAfter = 0;
            graphNode.linksAfter.forEach((link) => {
                const node = link.node as EnhancedNodeGraphEntry;
                const { columnIndex } = node;
                if (columnIndex < closestColumnIndex) {
                    closestColumnIndex = columnIndex;
                    maxSizeOfClosestNodesAfter = node.datum.size;
                } else if (columnIndex === closestColumnIndex) {
                    maxSizeOfClosestNodesAfter = Math.max(maxSizeOfClosestNodesAfter, node.datum.size);
                }
            });
            graphNode.closestColumnIndex = closestColumnIndex;
            graphNode.maxSizeOfClosestNodesAfter = maxSizeOfClosestNodesAfter;
        });

        const sizeScale = columns.reduce((acc, { size, nodes }) => {
            const columnSizeScale = (1 - (nodes.length - 1) * (nodeSpacing / seriesRectHeight)) / size;
            return Math.min(acc, columnSizeScale);
        }, Infinity);

        for (let i = columns.length - 1; i >= 0; i -= 1) {
            const nodes = columns[i].nodes as EnhancedNodeGraphEntry[];
            nodes.sort(
                (a, b) =>
                    a.closestColumnIndex - b.closestColumnIndex ||
                    a.maxSizeOfClosestNodesAfter - b.maxSizeOfClosestNodesAfter ||
                    a.datum.size - b.datum.size
            );
        }

        layoutColumns(columns, {
            seriesRectHeight,
            nodeSpacing,
            sizeScale,
        });

        let hasNegativeNodeHeight = false;
        nodeGraph.forEach(({ datum: node, linksBefore, linksAfter }) => {
            hasNegativeNodeHeight ||= node.height < 0;

            const bottom = node.y + node.height;
            const sortNodes = (l: typeof linksBefore) => {
                return l.sort((a, b) => {
                    const aNode = a.node.datum;
                    const bNode = b.node.datum;
                    const aBottom = aNode.y + aNode.height;
                    const bBottom = bNode.y + bNode.height;
                    const dAngleTop =
                        Math.atan2(aNode.y - node.y, Math.abs(aNode.x - node.x)) -
                        Math.atan2(bNode.y - node.y, Math.abs(bNode.x - node.x));
                    const dAngleBottom =
                        Math.atan2(aBottom - bottom, Math.abs(aNode.x - node.x)) -
                        Math.atan2(bBottom - bottom, Math.abs(bNode.x - node.x));
                    return dAngleTop + dAngleBottom;
                });
            };

            let y2 = node.y;
            sortNodes(linksBefore).forEach(({ link }) => {
                link.y2 = y2;
                y2 += link.size * seriesRectHeight * sizeScale;
            });

            let y1 = node.y;
            sortNodes(linksAfter).forEach(({ link }) => {
                link.y1 = y1;
                y1 += link.size * seriesRectHeight * sizeScale;
            });
        });

        if (hasNegativeNodeHeight) {
            Logger.warnOnce(
                'There was insufficient space to display the Sankey Series. Reduce the node spacing, or provide a larger container.'
            );
            return;
        }

        const nodeData: SankeyDatum[] = [];
        const labelData: SankeyNodeLabelDatum[] = [];
        const { fontSize } = this.properties.label;
        const canvasFont = this.properties.label.getFont();
        columns.forEach((column, index) => {
            const leading = index === 0;
            const trailing = index === columns.length - 1;

            let bottom = -Infinity;
            column.nodes.sort((a, b) => a.datum.y - b.datum.y);
            column.nodes.forEach(({ datum: node }) => {
                node.midPoint = {
                    x: node.x + node.width / 2,
                    y: node.y + node.height / 2,
                };
                nodeData.push(node);

                if (node.label == null) return;

                const x = leading ? node.x - labelSpacing : node.x + node.width + labelSpacing;
                const y = node.y + node.height / 2;
                let text: string | undefined;
                if (!leading && !trailing) {
                    const y1 = y - TextUtils.getLineHeight(fontSize);
                    const y2 = y + TextUtils.getLineHeight(fontSize);
                    let maxX = seriesRectWidth;
                    nodeGraph.forEach(({ datum }) => {
                        const intersectsLabel =
                            datum.x > node.x && Math.max(datum.y, y1) <= Math.min(datum.y + datum.height, y2);
                        if (intersectsLabel) {
                            maxX = Math.min(maxX, datum.x - labelSpacing);
                        }
                    });
                    const maxWidth = maxX - node.x - 2 * labelSpacing;
                    text = TextWrapper.wrapText(node.label, {
                        maxWidth,
                        maxHeight: node.height,
                        font: this.properties.label,
                        textWrap: 'never',
                        overflow: 'hide',
                    });
                }
                if (text == null || text === '') {
                    const labelInset = leading || trailing ? labelSpacing : labelSpacing * 2;
                    text = TextWrapper.wrapText(node.label, {
                        maxWidth: columnWidth - labelInset,
                        maxHeight: node.height,
                        font: this.properties.label,
                        textWrap: 'never',
                    });
                }
                if (text === '') return;

                const { height } = CachedTextMeasurerPool.measureText(text, {
                    font: canvasFont,
                    textAlign: 'left',
                    textBaseline: 'middle',
                });
                const y0 = y - height / 2;
                const y1 = y + height / 2;

                if (y0 >= bottom) {
                    labelData.push({ x, y, leading, text });
                    bottom = y1;
                }
            });
        });
        links.forEach((link) => {
            const { fromNode, toNode, size } = link;
            link.height = seriesRectHeight * size * sizeScale;
            link.x1 = fromNode.x + nodeWidth;
            link.x2 = toNode.x;
            link.midPoint = {
                x: (link.x1 + link.x2) / 2,
                y: (link.y1 + link.y2) / 2 + link.height / 2,
            };

            nodeData.push(link);
        });

        return {
            itemId: seriesId,
            nodeData,
            labelData,
        };
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
        const { labelSelection } = opts;
        const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = this.properties.label;

        labelSelection.each((label, { x, y, leading, text }) => {
            label.visible = true;
            label.x = x;
            label.y = y;
            label.text = text;
            label.fill = fill;
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;
            label.fontSize = fontSize;
            label.fontFamily = fontFamily;
            label.textAlign = leading ? 'right' : 'left';
            label.textBaseline = 'middle';
        });
    }

    protected updateNodeSelection(opts: {
        nodeData: SankeyNodeDatum[];
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, SankeyNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId([datum.type, datum.id]));
    }

    protected getBaseNodeStyle(highlighted: boolean): NodeStyle {
        const { properties } = this;
        const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = properties.node;
        const strokeWidth = this.getStrokeWidth(properties.node.strokeWidth);
        const highlightStyle = highlighted ? properties.highlightStyle.item : undefined;

        return {
            fill: highlightStyle?.fill ?? fill,
            fillOpacity: highlightStyle?.fillOpacity ?? fillOpacity,
            stroke: highlightStyle?.stroke ?? stroke,
            strokeOpacity: highlightStyle?.strokeOpacity ?? strokeOpacity,
            strokeWidth: highlightStyle?.strokeWidth ?? strokeWidth,
            lineDash: highlightStyle?.lineDash ?? lineDash,
            lineDashOffset: highlightStyle?.lineDashOffset ?? lineDashOffset,
        };
    }

    protected getNodeStyleOverrides(
        datumId: string,
        datum: any,
        datumIndex: number,
        size: number,
        label: string | undefined,
        format: NodeStyle,
        highlighted: boolean
    ) {
        const { id: seriesId, properties } = this;
        const { fills, strokes } = properties;
        const { itemStyler } = properties.node;

        const fill = format.fill ?? fills[datumIndex % fills.length];
        const stroke = format.stroke ?? strokes[datumIndex % strokes.length];

        const overrides: Partial<NodeStyle> = {};

        if (!highlighted) {
            overrides.fill = fill;
            overrides.stroke = stroke;
        }

        if (itemStyler != null) {
            const itemStyle = this.cachedDatumCallback(
                createDatumId(datumId, highlighted ? 'highlight' : 'node'),
                () => {
                    const {
                        fillOpacity = 1,
                        strokeOpacity = 1,
                        strokeWidth = 0,
                        lineDash = [],
                        lineDashOffset = 0,
                    } = format;

                    return itemStyler({
                        seriesId,
                        datum,
                        highlighted,
                        label,
                        size,
                        fill,
                        fillOpacity,
                        stroke,
                        strokeOpacity,
                        strokeWidth,
                        lineDash,
                        lineDashOffset,
                    });
                }
            );

            Object.assign(overrides, itemStyle);
        }

        return overrides;
    }

    protected updateNodeNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, SankeyNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const format = this.getBaseNodeStyle(isHighlight);

        datumSelection.each((rect, datum) => {
            const { datumIndex, size, label } = datum;
            const overrides = this.getNodeStyleOverrides(
                String(datumIndex),
                datum,
                datumIndex,
                size,
                label,
                format,
                isHighlight
            );

            rect.x = datum.x;
            rect.y = datum.y;
            rect.width = Math.max(datum.width, 0);
            rect.height = Math.max(datum.height, 0);
            rect.fill = overrides?.fill ?? format.fill;
            rect.fillOpacity = overrides?.fillOpacity ?? format.fillOpacity;
            rect.stroke = overrides?.stroke ?? format.stroke;
            rect.strokeOpacity = overrides?.strokeOpacity ?? format.strokeOpacity;
            rect.strokeWidth = overrides?.strokeWidth ?? format.strokeWidth;
            rect.lineDash = overrides?.lineDash ?? format.lineDash;
            rect.lineDashOffset = overrides?.lineDashOffset ?? format.lineDashOffset;
        });
    }

    protected updateLinkSelection(opts: {
        nodeData: SankeyLinkDatum[];
        datumSelection: _ModuleSupport.Selection<SankeyLink, SankeyLinkDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) =>
            createDatumId([datum.type, datum.index, datum.fromNode.id, datum.toNode.id])
        );
    }

    protected getBaseLinkStyle(highlighted: boolean): LinkStyle {
        const { properties } = this;
        const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = properties.link;
        const strokeWidth = this.getStrokeWidth(properties.link.strokeWidth);
        const highlightStyle = highlighted ? properties.highlightStyle.item : undefined;

        return {
            fill: highlightStyle?.fill ?? fill,
            fillOpacity: highlightStyle?.fillOpacity ?? fillOpacity,
            stroke: highlightStyle?.stroke ?? stroke,
            strokeOpacity: highlightStyle?.strokeOpacity ?? strokeOpacity,
            strokeWidth: highlightStyle?.strokeWidth ?? strokeWidth,
            lineDash: highlightStyle?.lineDash ?? lineDash,
            lineDashOffset: highlightStyle?.lineDashOffset ?? lineDashOffset,
        };
    }

    protected getLinkStyleOverrides(
        datumId: string,
        datum: any,
        datumIndex: number,
        format: LinkStyle,
        highlighted: boolean
    ) {
        const { id: seriesId, properties } = this;
        const { fills, strokes } = properties;
        const { itemStyler } = properties.link;

        const fill = format.fill ?? fills[datumIndex % fills.length];
        const stroke = format.stroke ?? strokes[datumIndex % strokes.length];

        const overrides: Partial<LinkStyle> = {};

        if (!highlighted) {
            overrides.fill = fill;
            overrides.stroke = stroke;
        }

        if (itemStyler != null) {
            const itemStyle = this.cachedDatumCallback(
                createDatumId(datumId, highlighted ? 'highlight' : 'node'),
                () => {
                    const {
                        fillOpacity = 1,
                        strokeOpacity = 1,
                        strokeWidth = 0,
                        lineDash = [],
                        lineDashOffset = 0,
                    } = format;

                    return itemStyler({
                        seriesId,
                        datum,
                        highlighted,
                        fill,
                        fillOpacity,
                        stroke,
                        strokeOpacity,
                        strokeWidth,
                        lineDash,
                        lineDashOffset,
                    });
                }
            );

            Object.assign(overrides, itemStyle);
        }

        return overrides;
    }

    protected updateLinkNodes(opts: {
        datumSelection: _ModuleSupport.Selection<SankeyLink, SankeyLinkDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const format = this.getBaseLinkStyle(isHighlight);

        datumSelection.each((link, datum) => {
            const { datumIndex } = datum;
            const fromNodeDatumIndex = datum.fromNode.datumIndex;
            const overrides = this.getLinkStyleOverrides(
                String(datumIndex),
                datum,
                fromNodeDatumIndex,
                format,
                isHighlight
            );

            link.x1 = datum.x1;
            link.y1 = datum.y1;
            link.x2 = datum.x2;
            link.y2 = datum.y2;
            link.height = datum.height;
            link.fill = overrides?.fill ?? format?.fill;
            link.fillOpacity = overrides?.fillOpacity ?? format?.fillOpacity;
            link.stroke = overrides?.stroke ?? format?.stroke;
            link.strokeOpacity = overrides?.strokeOpacity ?? format?.strokeOpacity;
            link.strokeWidth = Math.min(overrides?.strokeWidth ?? format?.strokeWidth, datum.height / 2);
            link.lineDash = overrides?.lineDash ?? format?.lineDash;
            link.lineDashOffset = overrides?.lineDashOffset ?? format?.lineDashOffset;
            link.inset = link.strokeWidth / 2;
        });
    }

    override getTooltipContent(seriesDatum: SankeyDatum): _ModuleSupport.TooltipContent | string | undefined {
        const { id: seriesId, processedData, nodesProcessedData, properties } = this;
        const { fromKey, toKey, sizeKey, sizeName, tooltip } = properties;

        const { datumIndex } = seriesDatum;
        const nodeIndex =
            seriesDatum.type === FlowProportionDatumType.Link ? seriesDatum.fromNode.index : seriesDatum.index;
        const title =
            seriesDatum.type === FlowProportionDatumType.Link
                ? `${seriesDatum.fromNode.label} - ${seriesDatum.toNode.label}`
                : seriesDatum.label;
        const datum =
            seriesDatum.type === FlowProportionDatumType.Link
                ? processedData?.rawData[seriesDatum.datumIndex]
                : nodesProcessedData?.rawData[seriesDatum.datumIndex];
        const size = seriesDatum.size;

        let format: Required<NodeStyle>;
        if (seriesDatum.type === FlowProportionDatumType.Link) {
            const fromNodeDatumIndex = seriesDatum.fromNode.datumIndex;
            const linkFormat = this.getBaseLinkStyle(false);
            Object.assign(
                linkFormat,
                this.getLinkStyleOverrides(String(datumIndex), datum, fromNodeDatumIndex, linkFormat, false)
            );
            format = linkFormat as any;
        } else {
            const label = seriesDatum.label;
            const nodeFormat = this.getBaseNodeStyle(false);
            Object.assign(
                nodeFormat,
                this.getNodeStyleOverrides(String(datumIndex), datum, datumIndex, size, label, nodeFormat, false)
            );
            format = nodeFormat as any;
        }

        return tooltip.formatTooltip(
            {
                title,
                symbol: this.legendItemSymbol(seriesDatum.type, nodeIndex, format),
                data: sizeKey != null ? [{ label: sizeName, fallbackLabel: sizeKey, value: String(size) }] : [],
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

    protected override computeFocusBounds({
        datumIndex,
    }: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | _ModuleSupport.Path | undefined {
        const datum = this.contextNodeData?.nodeData[datumIndex];

        if (datum?.type === FlowProportionDatumType.Node) {
            const { x, y, width, height } = datum;
            const bbox = new BBox(x, y, width, height);
            return Transformable.toCanvas(this.contentGroup, bbox);
        } else if (datum?.type === FlowProportionDatumType.Link) {
            for (const link of this.linkSelection) {
                if (link.datum === datum) {
                    return link.node;
                }
            }
            return undefined;
        }
    }
}
