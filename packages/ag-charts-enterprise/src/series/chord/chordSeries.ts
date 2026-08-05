import { _ModuleSupport } from 'ag-charts-community';
import {
    type CallbackParamRules,
    type DynamicContext,
    type FillStrokeMorph,
    type Normalised,
    type RequireOptional,
    angleBetween,
    cachedTextMeasurer,
    calcLineHeight,
    evaluateBezier,
    fitLabelText,
    isBetweenAngles,
    mergeDefaults,
    normalizeAngle360,
    resolveLabelFit,
    toPlainText,
    wrapText,
} from 'ag-charts-core';
import type {
    AgChordSeriesLabelFormatterParams,
    AgChordSeriesNodeItemStylerParams,
    AgChordSeriesNodeStyle,
    AgChordSeriesOptions,
} from 'ag-charts-types';

import { type FlowLinkDatumIndex, type FlowNodeDatumIndex, toFlowNodeOffset } from '../flow-proportion/flowDatumIndex';
import {
    type FlowProportionLinkDatum,
    type FlowProportionNodeDatum,
    FlowProportionSeries,
    type FlowProportionSeriesContext,
} from '../flow-proportion/flowProportionSeries';
import { ChordLink, bezierControlPoints } from './chordLink';
import { ChordSeriesProperties } from './chordSeriesProperties';

const { SeriesNodePickMode, createDatumId, Sector, getShapeStyle, getLabelStyles, BBox } = _ModuleSupport;

type NormalisedChordSeriesNodeStyle = Normalised<AgChordSeriesNodeStyle, never, FillStrokeMorph>;

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
    size: number;
    nodeDatum: ChordNodeDatum;
    datumIndex: _ModuleSupport.DatumIndex;
}

interface ChordNodeDataContext extends FlowProportionSeriesContext<
    ChordNodeDatum,
    ChordLinkDatum,
    ChordNodeLabelDatum
> {}

const nodeMidAngle = (node: ChordNodeDatum) => node.startAngle + angleBetween(node.startAngle, node.endAngle) / 2;
export class ChordSeries extends FlowProportionSeries<
    ChordNodeDatum,
    ChordLinkDatum,
    ChordNodeLabelDatum,
    AgChordSeriesOptions,
    ChordSeriesProperties,
    _ModuleSupport.Sector<ChordNodeDatum>,
    ChordLink<ChordLinkDatum>
> {
    static override readonly className = 'ChordSeries';
    static readonly type = 'chord' as const;

    override properties = new ChordSeriesProperties();

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
        });
    }

    private isLabelEnabled() {
        return (this.properties.labelKey != null || this.nodes == null) && this.properties.label.enabled;
    }

    protected linkFactory() {
        return new ChordLink<ChordLinkDatum>();
    }

    protected nodeFactory() {
        return new Sector<ChordNodeDatum>();
    }

    override createNodeData(): ChordNodeDataContext | undefined {
        const {
            id: seriesId,
            _nodeDataDependencies: { seriesRectWidth, seriesRectHeight } = { seriesRectWidth: 0, seriesRectHeight: 0 },
            properties,
        } = this;
        const {
            fromKey,
            toKey,
            sizeKey,
            labelKey,
            label: { spacing: labelSpacing, maxWidth: labelMaxWidth, fontSize },
            node: { width: nodeWidth, spacing: nodeSpacing },
        } = properties;
        const centerX = seriesRectWidth / 2;
        const centerY = seriesRectHeight / 2;

        let labelData: ChordNodeLabelDatum[] = [];

        const { nodeGraph, links } = this.getNodeGraph(
            (node) => ({
                ...node,
                centerX,
                centerY,
                innerRadius: Number.NaN,
                outerRadius: Number.NaN,
                startAngle: Number.NaN,
                endAngle: Number.NaN,
            }),
            (link) => ({
                ...link,
                centerX,
                centerY,
                radius: Number.NaN,
                startAngle1: Number.NaN,
                endAngle1: Number.NaN,
                startAngle2: Number.NaN,
                endAngle2: Number.NaN,
            }),
            { includeCircularReferences: true }
        );

        const labelFit = resolveLabelFit(properties.label, false);

        let totalSize = 0;
        for (const [id, { datum: node, linksBefore, linksAfter }] of nodeGraph.entries()) {
            const size =
                linksBefore.reduce((acc, { link }) => acc + link.size, 0) +
                linksAfter.reduce((acc, { link }) => acc + link.size, 0);
            if (size === 0) {
                nodeGraph.delete(id);
            } else {
                const { label } = properties;
                node.size = size;
                totalSize += node.size;

                let labelText = label.enabled
                    ? this.getLabelText<AgChordSeriesLabelFormatterParams>(
                          node.label,
                          node.datum,
                          labelKey!,
                          'label',
                          [],
                          label,
                          { datum: node.datum, value: node.label, fromKey, toKey, sizeKey, size: node.size }
                      )
                    : undefined;
                if (labelText != null) {
                    labelText = fitLabelText(labelText, labelFit, label);
                }
                node.label = toPlainText(labelText);
            }
        }

        let labelInset = 0;
        if (this.isLabelEnabled()) {
            const measurer = cachedTextMeasurer(this.properties.label);
            let maxMeasuredLabelWidth = 0;
            for (const { datum: node } of nodeGraph.values()) {
                const { id, label } = node;
                if (label == null) continue;

                const text = wrapText(label, {
                    maxWidth: labelMaxWidth,
                    font: this.properties.label,
                    textWrap: 'never',
                });
                const { width } = measurer.measureLines(text);
                maxMeasuredLabelWidth = Math.max(width, maxMeasuredLabelWidth);

                labelData.push({
                    id,
                    text,
                    centerX,
                    centerY,
                    angle: Number.NaN,
                    radius: Number.NaN,
                    size: node.size,
                    datumIndex: node.datumIndex,
                    nodeDatum: node,
                });
            }

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
            this.ctx.logger.warnOnce('There was insufficient space to display the Chord Series.');
            return;
        }

        const innerRadius = radius;
        const outerRadius = radius + nodeWidth;

        const sizeScale = Math.max((2 * Math.PI - nodeCount * spacingSweep) / totalSize, 0);
        let nodeAngle = 0;
        for (const { datum: node } of nodeGraph.values()) {
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
        }

        const nodeData: ChordDatum[] = [];
        for (const { datum: node, linksBefore, linksAfter } of nodeGraph.values()) {
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
            for (const { link, after } of combinedLinks.toSorted((a, b) => a.distance - b.distance)) {
                const linkSweep = link.size * sizeScale;
                if (after) {
                    link.startAngle1 = linkAngle;
                    link.endAngle1 = linkAngle + linkSweep;
                } else {
                    link.startAngle2 = linkAngle;
                    link.endAngle2 = linkAngle + linkSweep;
                }
                linkAngle += link.size * sizeScale;
            }

            nodeData.push(node);
        }
        const { tension } = this.properties.link;
        for (const link of links) {
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
        }

        for (const label of labelData) {
            const node = nodeGraph.get(label.id)?.datum;
            if (node == null) continue;
            label.radius = outerRadius + labelSpacing;
            label.angle = normalizeAngle360(node.startAngle + angleBetween(node.startAngle, node.endAngle) / 2);
            label.datumIndex = node.datumIndex;
            label.nodeDatum = node;
        }
        labelData.sort((a, b) => a.angle - b.angle);

        let minAngle = Infinity;
        let maxAngle = -Infinity;
        labelData = labelData.filter((label) => {
            const labelHeight = calcLineHeight(fontSize);
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
        labelSelection: _ModuleSupport.Selection<
            ChordNodeLabelDatum,
            _ModuleSupport.TransformableText<ChordNodeLabelDatum>
        >;
    }) {
        const labels = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(labels);
    }

    protected updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<
            ChordNodeLabelDatum,
            _ModuleSupport.TransformableText<ChordNodeLabelDatum>
        >;
    }) {
        const params: AgChordSeriesLabelFormatterParams = {
            toKey: this.properties.toKey,
            fromKey: this.properties.fromKey,
            sizeKey: this.properties.sizeKey,
            size: Number.NaN,
        } satisfies RequireOptional<AgChordSeriesLabelFormatterParams>;

        const activeHighlightDatum = this.getHighlightedDatum();
        opts.labelSelection.each((label, labelNodeDatum) => {
            const { size, text, centerX, centerY, radius, angle, datumIndex, nodeDatum } = labelNodeDatum;
            params.size = size;
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
            if (!style.enabled) {
                label.visible = false;
                return;
            }
            const { fontStyle, fontWeight, fontSize, fontFamily, color: fill } = style;
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
            const opacity = highlightStyle.opacity ?? 1;
            label.opacity = opacity;
            label.fillOpacity = opacity;
            label.setBoxing(style);
        });
    }

    protected updateNodeSelection(opts: {
        nodeData: ChordNodeDatum[];
        datumSelection: _ModuleSupport.Selection<ChordNodeDatum, _ModuleSupport.Sector<ChordNodeDatum>>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.type, datum.id));
    }

    protected override getNodeStyle(
        nodeDatum: Partial<ChordNodeDatum>,
        fromNodeDatumIndex: FlowNodeDatumIndex,
        isHighlight: boolean
    ) {
        const { properties } = this;
        const { fills, strokes, fillGradientDefaults, fillPatternDefaults, fillImageDefaults } = properties;
        const { itemStyler } = properties.node;

        const nodeOffset = toFlowNodeOffset(fromNodeDatumIndex);
        const highlightStyle = this.getHighlightStyle(isHighlight, nodeDatum.datumIndex);
        const selectionStyle = this.getSelectionStyle(nodeDatum.datumIndex);
        const baseStyle = mergeDefaults(
            selectionStyle,
            highlightStyle,
            properties.node.getStyle(fills, strokes, nodeOffset)
        );

        let style = getShapeStyle(baseStyle, fillGradientDefaults, fillPatternDefaults, fillImageDefaults);

        if (itemStyler != null && nodeDatum.datumIndex != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(nodeDatum.datumIndex, 'node', isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(nodeDatum, isHighlight, style);
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(itemStyler, params)
                    );
                }
            );
            if (overrides) {
                style = getShapeStyle(
                    mergeDefaults(overrides, style),
                    fillGradientDefaults,
                    fillPatternDefaults,
                    fillImageDefaults
                );
            }
        }

        style.opacity = 1;

        return style;
    }

    private makeItemStylerParams(
        { datum, datumIndex, size = 0, label }: Partial<ChordNodeDatum>,
        isHighlight: boolean,
        style: Required<NormalisedChordSeriesNodeStyle>
    ) {
        const { id: seriesId } = this;
        const { fromKey, toKey, sizeKey } = this.properties;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const selectionState = this.getSelectionStateString(datumIndex);
        const candidateState = this.getCandidateStateString(datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum,
            highlightState,
            selectionState,
            candidateState,
            ...style,
            size,
            label,
            fill,
            fromKey,
            toKey,
            sizeKey,
        } satisfies CallbackParamRules<AgChordSeriesNodeItemStylerParams<unknown, unknown>>;
    }

    protected updateNodeNodes(opts: {
        datumSelection: _ModuleSupport.Selection<ChordNodeDatum, _ModuleSupport.Sector<ChordNodeDatum>>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((sector, datum) => {
            const { datumIndex } = datum;
            const style = this.getNodeStyle(datum, datumIndex, isHighlight);

            sector.setStyleProperties(style, fillBBox);

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
        datumSelection: _ModuleSupport.Selection<ChordLinkDatum, ChordLink<ChordLinkDatum>>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) =>
            createDatumId(datum.type, datum.datumIndex, datum.fromNode.id, datum.toNode.id)
        );
    }

    protected override getLinkStyle(
        datum: ChordLinkDatum['datum'],
        datumIndex: FlowLinkDatumIndex,
        fromNodeDatumIndex: FlowNodeDatumIndex,
        isHighlight: boolean
    ) {
        const { id: seriesId, properties } = this;
        const { fills, strokes, fillGradientDefaults, fillPatternDefaults, fillImageDefaults } = properties;
        const { itemStyler } = properties.link;

        const nodeOffset = toFlowNodeOffset(fromNodeDatumIndex);
        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const selectionStyle = this.getSelectionStyle(datumIndex);
        const baseStyle = mergeDefaults(
            selectionStyle,
            highlightStyle,
            properties.link.getStyle(fills, strokes, nodeOffset)
        );

        let style = getShapeStyle(baseStyle, fillGradientDefaults, fillPatternDefaults, fillImageDefaults);

        if (itemStyler != null && datumIndex != null) {
            const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex, 'link', isHighlight ? 'highlight' : 'node'),
                () => {
                    const highlightState = this.getHighlightStateString(
                        activeHighlight,
                        isHighlight,
                        fromNodeDatumIndex
                    );
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(itemStyler, {
                            seriesId,
                            datum,
                            highlightState,
                            ...style,
                        })
                    );
                }
            );

            if (overrides) {
                style = getShapeStyle(
                    mergeDefaults(overrides, style),
                    fillGradientDefaults,
                    fillPatternDefaults,
                    fillImageDefaults
                );
            }
        }

        style.opacity = 1;

        return style;
    }

    protected updateLinkNodes(opts: {
        datumSelection: _ModuleSupport.Selection<ChordLinkDatum, ChordLink<ChordLinkDatum>>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((link, datum) => {
            const style = this.getLinkStyle(datum.datum, datum.datumIndex, datum.fromNode.datumIndex, isHighlight);

            link.centerX = datum.centerX;
            link.centerY = datum.centerY;
            link.radius = datum.radius;
            link.startAngle1 = datum.startAngle1;
            link.endAngle1 = datum.endAngle1;
            link.startAngle2 = datum.startAngle2;
            link.endAngle2 = datum.endAngle2;

            link.tension = style.tension;
            link.setStyleProperties(style, fillBBox);
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

    protected computeFocusBounds(
        node: _ModuleSupport.Sector | ChordLink
    ): _ModuleSupport.BBox | _ModuleSupport.Path | undefined {
        return node;
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.selection.enabled ||
            this.properties.node.itemStyler != null ||
            this.properties.link.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
