import {
    type AgChordSeriesLinkStyle,
    type AgChordSeriesNodeStyle,
    _ModuleSupport,
    _Scene,
    _Util,
} from 'ag-charts-community';

import {
    FlowProportionDatumType,
    type FlowProportionLinkDatum,
    type FlowProportionNodeDatum,
    FlowProportionSeries,
} from '../flow-proportion/flowProportionSeries';
import { ChordLink, bezierControlPoints } from './chordLink';
import { ChordSeriesProperties } from './chordSeriesProperties';

const { SeriesNodePickMode, CachedTextMeasurerPool, TextWrapper, TextUtils, createDatumId, EMPTY_TOOLTIP_CONTENT } =
    _ModuleSupport;
const { angleBetween, normalizeAngle360, isBetweenAngles, sanitizeHtml, Logger } = _Util;
const { Sector, evaluateBezier } = _Scene;

interface ChordNodeDatum extends FlowProportionNodeDatum {
    size: number;
    centerX: number;
    centerY: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
}
interface ChordLinkDatum extends FlowProportionLinkDatum<ChordNodeDatum> {
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

export interface ChordNodeDataContext extends _ModuleSupport.SeriesNodeDataContext<ChordDatum, ChordNodeLabelDatum> {}

const nodeMidAngle = (node: ChordNodeDatum) => node.startAngle + angleBetween(node.startAngle, node.endAngle) / 2;
export class ChordSeries extends FlowProportionSeries<
    ChordNodeDatum,
    ChordLinkDatum,
    ChordNodeLabelDatum,
    ChordSeriesProperties,
    _Scene.Sector,
    ChordLink
> {
    static readonly className = 'ChordSeries';
    static readonly type = 'chord' as const;

    override properties = new ChordSeriesProperties();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            contentGroupVirtual: false,
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

    override async createNodeData(): Promise<ChordNodeDataContext | undefined> {
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
                size: 0,
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
            const canvasFont = this.properties.label.getFont();
            let maxMeasuredLabelWidth = 0;
            nodeGraph.forEach(({ datum: node }) => {
                const { id, label } = node;
                if (label == null) return;

                const text = TextWrapper.wrapText(label, {
                    maxWidth: labelMaxWidth,
                    font: this.properties.label,
                    textWrap: 'never',
                });
                const { width } = CachedTextMeasurerPool.measureText(text, {
                    font: canvasFont,
                    textAlign: 'left',
                    textBaseline: 'middle',
                });
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
                .sort((a, b) => a.distance - b.distance)
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

    protected async updateLabelSelection(opts: {
        labelData: ChordNodeLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.TransformableText, ChordNodeLabelDatum>;
    }) {
        const labels = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(labels);
    }

    protected async updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.TransformableText, ChordNodeLabelDatum>;
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

    protected async updateNodeSelection(opts: {
        nodeData: ChordNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Sector, ChordNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId([datum.type, datum.id]));
    }

    protected async updateNodeNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Sector, ChordNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const {
            id: seriesId,
            properties,
            ctx: { callbackCache },
        } = this;
        const { fromKey, toKey, sizeKey } = this.properties;
        const {
            fill: baseFill,
            fillOpacity,
            stroke: baseStroke,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            itemStyler,
        } = properties.node;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;
        const strokeWidth = this.getStrokeWidth(properties.node.strokeWidth);

        datumSelection.each((sector, datum) => {
            const fill = baseFill ?? datum.fill;
            const stroke = baseStroke ?? datum.stroke;

            let format: AgChordSeriesNodeStyle | undefined;
            if (itemStyler != null) {
                const { label, size } = datum;
                format = callbackCache.call(itemStyler, {
                    seriesId,
                    datum: datum.datum,
                    label,
                    size,
                    fromKey,
                    toKey,
                    sizeKey,
                    fill,
                    fillOpacity,
                    strokeOpacity,
                    stroke,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                    highlighted: isHighlight,
                });
            }

            sector.centerX = datum.centerX;
            sector.centerY = datum.centerY;
            sector.innerRadius = datum.innerRadius;
            sector.outerRadius = datum.outerRadius;
            sector.startAngle = datum.startAngle;
            sector.endAngle = datum.endAngle;
            sector.fill = highlightStyle?.fill ?? format?.fill ?? fill;
            sector.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
            sector.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke;
            sector.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
            sector.strokeWidth = highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth;
            sector.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
            sector.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
            sector.inset = sector.strokeWidth / 2;
        });
    }

    protected async updateLinkSelection(opts: {
        nodeData: ChordLinkDatum[];
        datumSelection: _Scene.Selection<ChordLink, ChordLinkDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) =>
            createDatumId([datum.type, datum.index, datum.fromNode.id, datum.toNode.id])
        );
    }

    protected async updateLinkNodes(opts: {
        datumSelection: _Scene.Selection<ChordLink, ChordLinkDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const {
            id: seriesId,
            properties,
            ctx: { callbackCache },
        } = this;
        const { fromKey, toKey, sizeKey } = properties;
        const {
            fill: baseFill,
            fillOpacity,
            stroke: baseStroke,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            tension,
            itemStyler,
        } = properties.link;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;
        const strokeWidth = this.getStrokeWidth(properties.link.strokeWidth);

        datumSelection.each((link, datum) => {
            const fill = baseFill ?? datum.fromNode.fill;
            const stroke = baseStroke ?? datum.fromNode.stroke;

            let format: AgChordSeriesLinkStyle | undefined;
            if (itemStyler != null) {
                format = callbackCache.call(itemStyler, {
                    seriesId,
                    datum: datum.datum,
                    fromKey,
                    toKey,
                    sizeKey,
                    fill: fill!,
                    fillOpacity,
                    strokeOpacity,
                    stroke: stroke!,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                    tension,
                    highlighted: isHighlight,
                });
            }

            link.centerX = datum.centerX;
            link.centerY = datum.centerY;
            link.radius = datum.radius;
            link.startAngle1 = datum.startAngle1;
            link.endAngle1 = datum.endAngle1;
            link.startAngle2 = datum.startAngle2;
            link.endAngle2 = datum.endAngle2;
            link.fill = highlightStyle?.fill ?? format?.fill ?? fill;
            link.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
            link.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke;
            link.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
            link.strokeWidth = highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth;
            link.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
            link.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
            link.tension = format?.tension ?? tension;
        });
    }

    override resetAnimation(_chartAnimationPhase: _ModuleSupport.ChartAnimationPhase): void {}

    override getTooltipHtml(nodeDatum: ChordDatum): _ModuleSupport.TooltipContent {
        const {
            id: seriesId,
            processedData,
            ctx: { callbackCache },
            properties,
        } = this;

        if (!processedData || !properties.isValid()) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const { fromKey, toKey, sizeKey, sizeName, tooltip } = properties;
        const { datum, itemId, size } = nodeDatum;

        let title: string;
        const contentLines: string[] = [];
        let fill: string;
        if (nodeDatum.type === FlowProportionDatumType.Link) {
            const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset, tension, itemStyler } =
                properties.link;
            const { fromNode, toNode } = nodeDatum;
            title = `${fromNode.label ?? fromNode.id} - ${toNode.label ?? toNode.id}`;
            if (sizeKey != null) {
                contentLines.push(sanitizeHtml(`${sizeName ?? sizeKey}: ` + size));
            }

            fill = properties.link.fill ?? fromNode.fill;
            const stroke = properties.link.stroke ?? fromNode.stroke;

            let format: AgChordSeriesLinkStyle | undefined;
            if (itemStyler != null) {
                format = callbackCache.call(itemStyler, {
                    seriesId,
                    datum: datum.datum,
                    fromKey,
                    toKey,
                    sizeKey,
                    fill,
                    fillOpacity,
                    strokeOpacity,
                    stroke,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                    tension,
                    highlighted: true,
                });
            }

            fill = format?.fill ?? fill;
        } else {
            const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset, itemStyler } = properties.node;
            const { id, label } = nodeDatum;
            title = label ?? id;
            if (sizeKey != null) {
                contentLines.push(sanitizeHtml(`${sizeName ?? sizeKey}: ` + size));
            }

            fill = properties.link.fill ?? nodeDatum.fill;
            const stroke = properties.link.stroke ?? nodeDatum.stroke;

            let format: AgChordSeriesNodeStyle | undefined;
            if (itemStyler != null) {
                format = callbackCache.call(itemStyler, {
                    seriesId,
                    datum: datum.datum,
                    label,
                    size,
                    fromKey,
                    toKey,
                    sizeKey,
                    fill,
                    fillOpacity,
                    strokeOpacity,
                    stroke,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                    highlighted: true,
                });
            }

            fill = format?.fill ?? nodeDatum.fill;
        }
        const content = contentLines.join('<br>');

        const color = fill;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                datum,
                title,
                color,
                itemId,
                fromKey,
                toKey,
                sizeKey,
                sizeName,
                size,
                ...this.getModuleTooltipParams(),
            }
        );
    }

    override getLabelData(): _Util.PointLabelDatum[] {
        return [];
    }

    protected override computeFocusBounds({
        datumIndex,
    }: _ModuleSupport.PickFocusInputs): _Scene.BBox | _Scene.Path | undefined {
        const datum = this.contextNodeData?.nodeData[datumIndex];

        if (datum?.type === FlowProportionDatumType.Node) {
            for (const node of this.nodeSelection) {
                if (node.datum === datum) {
                    return node.node;
                }
            }
            return undefined;
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
