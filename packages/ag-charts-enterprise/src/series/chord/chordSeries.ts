import { type FillOptions, type LineDashOptions, type StrokeOptions, _ModuleSupport } from 'ag-charts-community';
import { Logger } from 'ag-charts-core';

import {
    FlowProportionDatumType,
    type FlowProportionLinkDatum,
    type FlowProportionNodeDatum,
    type FlowProportionNodeDatumIndex,
    FlowProportionSeries,
    type FlowProportionSeriesContext,
} from '../flow-proportion/flowProportionSeries';
import { ChordLink, bezierControlPoints } from './chordLink';
import { ChordSeriesProperties } from './chordSeriesProperties';

const {
    SeriesNodePickMode,
    CachedTextMeasurerPool,
    TextWrapper,
    TextUtils,
    createDatumId,
    angleBetween,
    normalizeAngle360,
    isBetweenAngles,
    Sector,
    evaluateBezier,
    applyShapeStyle,
    getShapeStyle,
    BBox,
} = _ModuleSupport;

interface ChordNodeDatum extends FlowProportionNodeDatum<ChordNodeDatum, ChordLinkDatum> {
    centerX: number;
    centerY: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
}
interface ChordLinkDatum extends FlowProportionLinkDatum<ChordNodeDatum, ChordLinkDatum> {
    centerX: number;
    centerY: number;
    radius: number;
    startAngle1: number;
    endAngle1: number;
    startAngle2: number;
    endAngle2: number;
}

type ChordDatum = ChordLinkDatum | ChordNodeDatum;

interface ChordNodeLabelDatum {
    id: string;
    text: string;
    centerX: number;
    centerY: number;
    angle: number;
    radius: number;
}

type NodeStyle = Pick<FillOptions & StrokeOptions & LineDashOptions, 'fill' | 'stroke'> &
    Omit<Required<FillOptions & StrokeOptions & LineDashOptions>, 'fill' | 'stroke'>;
type LinkStyle = NodeStyle & { tension: number };

interface ChordNodeDataContext
    extends FlowProportionSeriesContext<ChordNodeDatum, ChordLinkDatum, ChordNodeLabelDatum> {}

const nodeMidAngle = (node: ChordNodeDatum) => node.startAngle + angleBetween(node.startAngle, node.endAngle) / 2;
export class ChordSeries extends FlowProportionSeries<
    ChordNodeDatum,
    ChordLinkDatum,
    ChordNodeLabelDatum,
    ChordSeriesProperties,
    _ModuleSupport.Sector,
    ChordLink
> {
    static readonly className = 'ChordSeries';
    static readonly type = 'chord' as const;

    override properties = new ChordSeriesProperties();

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
        return new ChordLink();
    }

    protected nodeFactory() {
        return new Sector();
    }

    override createNodeData(): ChordNodeDataContext | undefined {
        const {
            id: seriesId,
            _nodeDataDependencies: { seriesRectWidth, seriesRectHeight } = { seriesRectWidth: 0, seriesRectHeight: 0 },
        } = this;
        const {
            fromKey,
            toKey,
            sizeKey,
            label: { spacing: labelSpacing, maxWidth: labelMaxWidth, fontSize },
            node: { width: nodeWidth, spacing: nodeSpacing },
        } = this.properties;
        const centerX = seriesRectWidth / 2;
        const centerY = seriesRectHeight / 2;

        let labelData: ChordNodeLabelDatum[] = [];

        const { nodeGraph, links } = this.getNodeGraph(
            (node) => ({
                ...node,
                centerX,
                centerY,
                innerRadius: NaN,
                outerRadius: NaN,
                startAngle: NaN,
                endAngle: NaN,
            }),
            (link) => ({
                ...link,
                centerX,
                centerY,
                radius: NaN,
                startAngle1: NaN,
                endAngle1: NaN,
                startAngle2: NaN,
                endAngle2: NaN,
            }),
            { includeCircularReferences: true }
        );

        let totalSize = 0;
        nodeGraph.forEach(({ datum: node, linksBefore, linksAfter }, id) => {
            const size =
                linksBefore.reduce((acc, { link }) => acc + link.size, 0) +
                linksAfter.reduce((acc, { link }) => acc + link.size, 0);
            if (size === 0) {
                nodeGraph.delete(id);
            } else {
                node.size = size;
                totalSize += node.size;

                const label = this.getLabelText(this.properties.label, {
                    datum: node.datum,
                    value: node.label,
                    fromKey,
                    toKey,
                    sizeKey,
                    size: node.size,
                });
                node.label = String(label);
            }
        });

        let labelInset = 0;
        if (this.isLabelEnabled()) {
            const measurer = CachedTextMeasurerPool.getMeasurer({ font: this.properties.label });
            let maxMeasuredLabelWidth = 0;
            nodeGraph.forEach(({ datum: node }) => {
                const { id, label } = node;
                if (label == null) return;

                const text = TextWrapper.wrapText(label, {
                    maxWidth: labelMaxWidth,
                    font: this.properties.label,
                    textWrap: 'never',
                });
                const { width } = measurer.measureText(text);
                maxMeasuredLabelWidth = Math.max(width, maxMeasuredLabelWidth);

                labelData.push({
                    id,
                    text,
                    centerX,
                    centerY,
                    angle: NaN,
                    radius: NaN,
                });
            });

            labelInset = maxMeasuredLabelWidth + labelSpacing;
        }

        const nodeCount = nodeGraph.size;
        let radius = Math.min(seriesRectWidth, seriesRectHeight) / 2 - nodeWidth - labelInset;
        let spacingSweep = nodeSpacing / radius;

        if (labelInset !== 0 && (nodeCount * spacingSweep >= 1.5 * Math.PI || radius <= 0)) {
            // Spacing taking up more than 3/4 the circle
            labelData = [];
            radius = Math.min(seriesRectWidth, seriesRectHeight) / 2 - nodeWidth;
            spacingSweep = nodeSpacing / radius;
        }

        if (nodeCount * spacingSweep >= 2 * Math.PI || radius <= 0) {
            Logger.warnOnce('There was insufficient space to display the Chord Series.');
            return;
        }

        const innerRadius = radius;
        const outerRadius = radius + nodeWidth;

        const sizeScale = Math.max((2 * Math.PI - nodeCount * spacingSweep) / totalSize, 0);
        let nodeAngle = 0;
        nodeGraph.forEach(({ datum: node }) => {
            node.innerRadius = innerRadius;
            node.outerRadius = outerRadius;
            node.startAngle = nodeAngle;
            node.endAngle = nodeAngle + node.size * sizeScale;
            nodeAngle = node.endAngle + spacingSweep;

            const midR = (node.innerRadius + node.outerRadius) / 2;
            const midAngle = nodeMidAngle(node);
            node.midPoint = {
                x: node.centerX + midR * Math.cos(midAngle),
                y: node.centerY + midR * Math.sin(midAngle),
            };
        });

        const nodeData: ChordDatum[] = [];
        nodeGraph.forEach(({ datum: node, linksBefore, linksAfter }) => {
            const midAngle = nodeMidAngle(node);
            const combinedLinks = [
                ...linksBefore.map((l) => ({
                    link: l.link,
                    distance: angleBetween(nodeMidAngle(l.node.datum), midAngle),
                    after: false,
                })),
                ...linksAfter.map((l) => ({
                    link: l.link,
                    distance: angleBetween(nodeMidAngle(l.node.datum), midAngle),
                    after: true,
                })),
            ];

            let linkAngle = node.startAngle;
            combinedLinks
                .toSorted((a, b) => a.distance - b.distance)
                .forEach(({ link, after }) => {
                    const linkSweep = link.size * sizeScale;
                    if (after) {
                        link.startAngle1 = linkAngle;
                        link.endAngle1 = linkAngle + linkSweep;
                    } else {
                        link.startAngle2 = linkAngle;
                        link.endAngle2 = linkAngle + linkSweep;
                    }
                    linkAngle += link.size * sizeScale;
                });

            nodeData.push(node);
        });
        const { tension } = this.properties.link;
        links.forEach((link) => {
            link.radius = radius;

            const outer = bezierControlPoints({
                radius,
                startAngle: link.startAngle1,
                endAngle: link.endAngle2,
                tension,
            });
            const inner = bezierControlPoints({
                radius,
                startAngle: link.startAngle2,
                endAngle: link.endAngle1,
                tension,
            });

            const outerX = evaluateBezier(...outer.x, 0.5);
            const outerY = evaluateBezier(...outer.y, 0.5);
            const innerX = evaluateBezier(...inner.x, 0.5);
            const innerY = evaluateBezier(...inner.y, 0.5);

            link.midPoint = {
                x: link.centerX + (outerX + innerX) / 2,
                y: link.centerY + (outerY + innerY) / 2,
            };

            nodeData.push(link);
        });

        labelData.forEach((label) => {
            const node = nodeGraph.get(label.id)?.datum;
            if (node == null) return;
            label.radius = outerRadius + labelSpacing;
            label.angle = normalizeAngle360(node.startAngle + angleBetween(node.startAngle, node.endAngle) / 2);
        });
        labelData.sort((a, b) => a.angle - b.angle);

        let minAngle = Infinity;
        let maxAngle = -Infinity;
        labelData = labelData.filter((label) => {
            const labelHeight = TextUtils.getLineHeight(fontSize);
            const da = Math.atan2(labelHeight / 2, label.radius);

            const a0 = label.angle - da;
            const a1 = label.angle + da;

            if (isBetweenAngles(minAngle, a0, a1)) return false;
            if (isBetweenAngles(maxAngle, a0, a1)) return false;

            minAngle = Math.min(a0, minAngle);
            maxAngle = Math.max(a1, maxAngle);

            return true;
        });

        return {
            itemId: seriesId,
            nodeData,
            labelData,
        };
    }

    protected updateLabelSelection(opts: {
        labelData: ChordNodeLabelDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, ChordNodeLabelDatum>;
    }) {
        const labels = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(labels);
    }

    protected updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, ChordNodeLabelDatum>;
    }) {
        const { labelSelection } = opts;
        const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = this.properties.label;

        labelSelection.each((label, { text, centerX, centerY, radius, angle }) => {
            label.visible = true;
            label.translationX = centerX + radius * Math.cos(angle);
            label.translationY = centerY + radius * Math.sin(angle);
            label.text = text;
            label.fill = fill;
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;
            label.fontSize = fontSize;
            label.fontFamily = fontFamily;
            label.textBaseline = 'middle';
            if (Math.cos(angle) >= 0) {
                label.textAlign = 'left';
                label.rotation = angle;
            } else {
                label.textAlign = 'right';
                label.rotation = angle - Math.PI;
            }
        });
    }

    protected updateNodeSelection(opts: {
        nodeData: ChordNodeDatum[];
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Sector, ChordNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId([datum.type, datum.id]));
    }

    protected getBaseNodeStyle(highlighted: boolean): NodeStyle {
        const { properties } = this;
        const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = properties.node;
        const highlightStyle = highlighted ? properties.highlightStyle.item : undefined;

        return getShapeStyle(
            {
                fill: highlightStyle?.fill ?? fill,
                fillOpacity: highlightStyle?.fillOpacity ?? fillOpacity,
                stroke: highlightStyle?.stroke ?? stroke,
                strokeOpacity: highlightStyle?.strokeOpacity ?? strokeOpacity,
                strokeWidth: highlightStyle?.strokeWidth ?? this.getStrokeWidth(properties.node.strokeWidth),
                lineDash: highlightStyle?.lineDash ?? lineDash,
                lineDashOffset: highlightStyle?.lineDashOffset ?? lineDashOffset,
            },
            this.properties.fillGradientDefaults,
            this.properties.fillPatternDefaults,
            this.properties.fillImageDefaults
        );
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

        let overrides: Partial<NodeStyle> | undefined;

        if (!highlighted) {
            overrides ??= {};
            overrides.fill = fill;
            overrides.stroke = stroke;
        }

        if (itemStyler != null) {
            const itemStyle = this.cachedDatumCallback(
                createDatumId(datumId, 'node', highlighted ? 'highlight' : 'node'),
                () => {
                    const {
                        fillOpacity = 1,
                        strokeOpacity = 1,
                        strokeWidth = 0,
                        lineDash = [],
                        lineDashOffset = 0,
                    } = format;

                    return this.callWithContext(itemStyler, {
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

            overrides ??= {};
            Object.assign(overrides, itemStyle);
        }

        return getShapeStyle(
            overrides,
            this.properties.fillGradientDefaults,
            this.properties.fillPatternDefaults,
            this.properties.fillImageDefaults
        );
    }

    protected updateNodeNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Sector, ChordNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const format = this.getBaseNodeStyle(isHighlight);
        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((sector, datum) => {
            const { datumIndex, size, label } = datum;
            const overrides = this.getNodeStyleOverrides(
                String(datumIndex.index),
                datum.datum,
                datumIndex.index,
                size,
                label,
                format,
                isHighlight
            );

            applyShapeStyle(sector, format, overrides, fillBBox);

            sector.centerX = datum.centerX;
            sector.centerY = datum.centerY;
            sector.innerRadius = datum.innerRadius;
            sector.outerRadius = datum.outerRadius;
            sector.startAngle = datum.startAngle;
            sector.endAngle = datum.endAngle;
            sector.inset = sector.strokeWidth / 2;
        });
    }

    protected updateLinkSelection(opts: {
        nodeData: ChordLinkDatum[];
        datumSelection: _ModuleSupport.Selection<ChordLink, ChordLinkDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) =>
            createDatumId([datum.type, datum.index, datum.fromNode.id, datum.toNode.id])
        );
    }

    protected getBaseLinkStyle(highlighted: boolean): LinkStyle {
        const { properties } = this;
        const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset, tension } = properties.link;
        const highlightStyle = highlighted ? properties.highlightStyle.item : undefined;

        return getShapeStyle(
            {
                fill: highlightStyle?.fill ?? fill,
                fillOpacity: highlightStyle?.fillOpacity ?? fillOpacity,
                stroke: highlightStyle?.stroke ?? stroke,
                strokeOpacity: highlightStyle?.strokeOpacity ?? strokeOpacity,
                strokeWidth: highlightStyle?.strokeWidth ?? this.getStrokeWidth(properties.link.strokeWidth),
                lineDash: highlightStyle?.lineDash ?? lineDash,
                lineDashOffset: highlightStyle?.lineDashOffset ?? lineDashOffset,
                tension,
            },
            this.properties.fillGradientDefaults,
            this.properties.fillPatternDefaults,
            this.properties.fillImageDefaults
        );
    }

    protected getLinkStyleOverrides(
        datumId: string,
        datum: any,
        fromNodeDatumIndex: number,
        format: LinkStyle,
        highlighted: boolean
    ) {
        const { id: seriesId, properties } = this;
        const { fills, strokes } = properties;
        const { itemStyler } = properties.link;

        const fill = format.fill ?? fills[fromNodeDatumIndex % fills.length];
        const stroke = format.stroke ?? strokes[fromNodeDatumIndex % strokes.length];

        let overrides: Partial<LinkStyle> | undefined;

        if (!highlighted) {
            overrides ??= {};
            overrides.fill = fill;
            overrides.stroke = stroke;
        }

        if (itemStyler != null) {
            const itemStyle = this.cachedDatumCallback(
                createDatumId(datumId, 'link', highlighted ? 'highlight' : 'node'),
                () => {
                    const {
                        fillOpacity = 1,
                        strokeOpacity = 1,
                        strokeWidth = 0,
                        lineDash = [],
                        lineDashOffset = 0,
                        tension,
                    } = format;

                    return this.callWithContext(itemStyler, {
                        seriesId,
                        datum,
                        highlighted,
                        tension,
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

            overrides ??= {};
            Object.assign(overrides, itemStyle);
        }

        return getShapeStyle(
            overrides,
            this.properties.fillGradientDefaults,
            this.properties.fillPatternDefaults,
            this.properties.fillImageDefaults
        );
    }

    protected updateLinkNodes(opts: {
        datumSelection: _ModuleSupport.Selection<ChordLink, ChordLinkDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const style = this.getBaseLinkStyle(isHighlight);
        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((link, datum) => {
            const { datumIndex } = datum;
            const fromNodeDatumIndex = datum.fromNode.datumIndex;
            const overrides = this.getLinkStyleOverrides(
                String(datumIndex.index),
                datum.datum,
                fromNodeDatumIndex.index,
                style,
                isHighlight
            );

            link.centerX = datum.centerX;
            link.centerY = datum.centerY;
            link.radius = datum.radius;
            link.startAngle1 = datum.startAngle1;
            link.endAngle1 = datum.endAngle1;
            link.startAngle2 = datum.startAngle2;
            link.endAngle2 = datum.endAngle2;

            applyShapeStyle(link, style, overrides, fillBBox);

            link.tension = overrides?.tension ?? style.tension;
        });
    }

    private getShapeFillBBox(): _ModuleSupport.ShapeFillBBox {
        const width = this._nodeDataDependencies?.seriesRectWidth ?? 0;
        const height = this._nodeDataDependencies?.seriesRectHeight ?? 0;
        const size = Math.min(width, height);
        const x = (width - size) / 2;
        const y = (height - size) / 2;
        const bbox = new BBox(x, y, width, height);
        return { series: bbox, axis: bbox };
    }

    override getTooltipContent(datumIndex: FlowProportionNodeDatumIndex): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, linksProcessedData, nodesProcessedData, properties } = this;
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
            const linkFormat = this.getBaseLinkStyle(false);
            Object.assign(
                linkFormat,
                this.getLinkStyleOverrides(String(datumIndex.index), datum, fromNodeDatumIndex.index, linkFormat, false)
            );
            format = linkFormat as any;
        } else {
            const label = seriesDatum.label;
            const nodeFormat = this.getBaseNodeStyle(false);
            Object.assign(
                nodeFormat,
                this.getNodeStyleOverrides(
                    String(datumIndex.index),
                    datum,
                    datumIndex.index,
                    size,
                    label,
                    nodeFormat,
                    false
                )
            );
            format = nodeFormat as any;
        }

        return this.formatTooltipWithContext(
            tooltip,
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

    protected computeFocusBounds(
        node: _ModuleSupport.Sector | ChordLink
    ): _ModuleSupport.BBox | _ModuleSupport.Path | undefined {
        return node;
    }
}
