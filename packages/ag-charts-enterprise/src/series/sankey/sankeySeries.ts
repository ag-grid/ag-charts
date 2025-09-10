import {
    type AgSankeySeriesLabelFormatterParams,
    type AgSankeySeriesNodeStyle,
    type AgSankeySeriesOptions,
    type FillOptions,
    type LineDashOptions,
    type StrokeOptions,
    _ModuleSupport,
} from 'ag-charts-community';
import { Logger, cachedTextMeasurer, calcLineHeight, wrapText } from 'ag-charts-core';

import {
    FlowProportionDatumType,
    type FlowProportionNodeDatumIndex,
    FlowProportionSeries,
} from '../flow-proportion/flowProportionSeries';
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

const {
    Transformable,
    applyShapeStyle,
    SeriesNodePickMode,
    createDatumId,
    getShapeStyle,
    getLabelStyles,
    Rect,
    BBox,
    mergeDefaults,
} = _ModuleSupport;

type NodeStyle = Pick<FillOptions & StrokeOptions & LineDashOptions, 'fill' | 'stroke'> &
    Omit<Required<FillOptions & StrokeOptions & LineDashOptions>, 'fill' | 'stroke'>;

export class SankeySeries extends FlowProportionSeries<
    SankeyNodeDatum,
    SankeyLinkDatum,
    SankeyNodeLabelDatum,
    AgSankeySeriesOptions,
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
            labelKey,
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
            node.label = labelText;

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
        const measurer = cachedTextMeasurer(this.properties.label);
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
                    const lineHeight = calcLineHeight(fontSize);
                    const y1 = y - lineHeight;
                    const y2 = y + lineHeight;
                    let maxX = seriesRectWidth;
                    nodeGraph.forEach(({ datum }) => {
                        const intersectsLabel =
                            datum.x > node.x && Math.max(datum.y, y1) <= Math.min(datum.y + datum.height, y2);
                        if (intersectsLabel) {
                            maxX = Math.min(maxX, datum.x - labelSpacing);
                        }
                    });
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
                    const labelInset = leading || trailing ? labelSpacing : labelSpacing * 2;
                    text = wrapText(node.label, {
                        maxWidth: columnWidth - labelInset,
                        maxHeight: node.height,
                        font: this.properties.label,
                        textWrap: 'never',
                    });
                }
                if (text === '') return;

                const { height } = measurer.measureText(text);
                const y0 = y - height / 2;
                const y1 = y + height / 2;

                if (y0 >= bottom) {
                    labelData.push({ x, y, leading, text, size: node.size });
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
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        opts.labelSelection.each((label, datum) => {
            const { x, y, leading, text } = datum;
            const params: AgSankeySeriesLabelFormatterParams = datum;
            const style = getLabelStyles(this, undefined, params, this.properties.label, false, activeHighlight);
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
            label.textAlign = leading ? 'right' : 'left';
            label.textBaseline = 'middle';
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
            highlighted: isHighlight,
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

            applyShapeStyle(rect, style, fillBBox);
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
                        highlighted: isHighlight,
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

            applyShapeStyle(link, style, fillBBox);

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
                ? linksProcessedData?.dataSources.get(this.id)?.[datumIndex.index]
                : nodesProcessedData?.dataSources.get(this.id)?.[datumIndex.index];
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
