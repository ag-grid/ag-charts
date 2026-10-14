import {
    type AgSunburstHighlightState,
    type AgSunburstSeriesLabelFormatterParams,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    BBox,
    type CallbackParamRules,
    type DynamicContext,
    type FitRegion,
    type FittedLabelStack,
    Group,
    type LabelStackBlock,
    type NormalisedSunburstInnerLabelOptions,
    type NormalisedSunburstSeriesOwnOptions,
    type NormalisedSunburstSeriesStyle,
    type NormalisedTextOrSegments,
    type OrientationAnchor,
    type PlacedLabel,
    type Point,
    type PointLabelDatum,
    PointerEvents,
    type PositionedLabelCandidate,
    type RequireOptional,
    STROKE_STYLE_THEME_DEFAULTS,
    ScalableGroup,
    Sector,
    Selection,
    Text,
    TransformableText,
    cachedTextMeasurer,
    cycledValue,
    findDiscreteColorBinLabel,
    fontWithSize,
    formatValue,
    isGradientFill,
    measureLabelText,
    mergeDefaults,
    normalizeAngle360,
} from 'ag-charts-core';
import type { Path } from 'ag-charts-core';
import type { AgSunburstSeriesItemStylerParams, FontStyle, FontWeight, PaddingOptions } from 'ag-charts-types';

import { HierarchyNode, HierarchySeries, toHierarchyHighlightString } from '../hierarchy/hierarchySeries';
import { autoSizedLabelFit, labelPairBlocks } from '../util/autoSizedLabelFit';

const { fromToMotion, createDatumId, expandLabelBoxExtent, fitLabelToContainer, getLabelStyles } = _ModuleSupport;

class SunburstNode extends HierarchyNode<SunburstNode> {
    labelText: NormalisedTextOrSegments | undefined = undefined;
    secondaryLabelText: NormalisedTextOrSegments | undefined = undefined;
    ring: SunburstLabelRing | undefined = undefined;
    label: LabelLayout | undefined = undefined;
    secondaryLabel: LabelLayout | undefined = undefined;
    contentHeight: number = 0;
    bbox: BBox | undefined = undefined; // cspell:ignore bbox
    startAngle: number = 0;
    endAngle: number = 0;
}

interface LabelLayout {
    text: NormalisedTextOrSegments;
    fontSize: number;
    lineHeight: number;
    fontStyle: FontStyle;
    fontFamily: string;
    fontWeight: FontWeight;
    color: string;
    labelPlacement: LabelPlacement;
    circleQuarter: number;
    radius: number;
    theta: number;
    width: number;
    height: number;
}

/** The annular sector a node's labels are fitted to, in the series' centred frame. */
interface SunburstLabelRing {
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly sweep: number;
    readonly theta: number;
    readonly radiusScale: number;
    /** The depth-0 sector of a sunburst with no hole, which reaches the centre. */
    readonly wedge: boolean;
    /** A sole depth-0 node filling the whole disc. */
    readonly centreCircle: boolean;
}

interface SunburstPlacedLabelDatum extends PointLabelDatum {
    readonly node: SunburstNode;
    readonly tags: readonly TextNodeTag[];
}

interface SunburstLabelCandidate extends PositionedLabelCandidate {
    readonly labelPlacement: LabelPlacement;
}

const NO_PADDING: Required<PaddingOptions> = { top: 0, right: 0, bottom: 0, left: 0 };

/** A region whose width depends only on the height of the stack it holds, minus `padding` on every side. */
function heightBoundRegion(padding: number, widthFor: (height: number) => number): FitRegion {
    return {
        spanAt(top, bottom) {
            const half = (widthFor(bottom - top + 2 * padding) - 2 * padding) / 2;
            return half > 0 ? [-half, half] : [0, 0];
        },
        extentAbove: Infinity,
        extentBelow: Infinity,
    };
}

/** How far from the centre a sector's labels are drawn, for a stack of the given size. */
function sectorLabelRadius(
    ring: SunburstLabelRing,
    labelPlacement: LabelPlacement,
    width: number,
    height: number,
    padding: number
): number {
    const { innerRadius, outerRadius, sweep, radiusScale, wedge } = ring;
    switch (labelPlacement) {
        case LabelPlacement.CenterCircle:
            return 0;
        case LabelPlacement.Parallel: {
            const opticalCentering = 0.58; // Between 0 and 1 - there's no maths behind this, just what visually looks good
            const idealRadius = outerRadius - (radiusScale - height) * opticalCentering;
            // A label kept by `collision.alwaysShow` can be wider than the sector's outer chord.
            const maximumRadius = Math.sqrt(Math.max(0, (outerRadius - padding) ** 2 - (width / 2) ** 2));
            return Math.min(idealRadius, maximumRadius);
        }
        case LabelPlacement.Perpendicular: {
            if (!wedge) return (innerRadius + outerRadius) * 0.5;
            const minimumRadius = height / (2 * Math.tan(sweep * 0.5)) + width * 0.5;
            const maximumRadius = Math.sqrt(Math.max(0, outerRadius ** 2 - (height * 0.5) ** 2)) - width * 0.5;
            return (minimumRadius + maximumRadius) * 0.5;
        }
    }
}

function naturalStackHeight(blocks: readonly LabelStackBlock[], spacing: number) {
    let height = spacing * (blocks.length - 1);
    for (const { fit } of blocks) {
        const padding = fit.boxPadding ?? NO_PADDING;
        height += measureLabelText(fit.text, fit.font).height + padding.top + padding.bottom;
    }
    return height;
}

function setAngleData(node: SunburstNode, startAngle = 0, angleScale = (2 * Math.PI) / node.sumSize) {
    for (const child of node.children) {
        const endAngle = startAngle + child.sumSize * angleScale;
        child.startAngle = startAngle;
        child.endAngle = endAngle;
        setAngleData(child, startAngle, angleScale);
        startAngle = endAngle;
    }
}

enum CircleQuarter {
    TopLeft = 0b0001,
    TopRight = 0b0010,
    BottomRight = 0b0100,
    BottomLeft = 0b1000,
    Top = 0b0011,
    Right = 0b0110,
    Bottom = 0b1100,
    Left = 0b1001,
}

enum LabelPlacement {
    CenterCircle,
    Parallel,
    Perpendicular,
}

enum TextNodeTag {
    Primary,
    Secondary,
}

type ItemStyle = Required<NormalisedSunburstSeriesStyle> & { opacity: number };

export class SunburstSeries extends HierarchySeries<
    SunburstNode,
    Sector<SunburstNode>,
    NormalisedSunburstSeriesOwnOptions
> {
    static override readonly className = 'SunburstSeries';
    static readonly type = 'sunburst' as const;

    NodeClass = SunburstNode;

    private readonly scalingGroup = this.contentGroup.appendChild(new ScalableGroup());
    private readonly sectorGroup = this.scalingGroup.appendChild(new Group<SunburstNode>({ batchShadows: 'by-layer' }));
    private readonly highlightSectorGroup = this.scalingGroup.appendChild(new Group<SunburstNode>());
    // Above every sector fill so the centre reads as chrome, and below the labels so no sector label
    // is painted over. Inside `scalingGroup`, so it takes the series' entry animation.
    private readonly innerCircleGroup = this.scalingGroup.appendChild(new Group());
    private readonly sectorLabelGroup = this.scalingGroup.appendChild(new Group<SunburstNode>());
    // Last in `scalingGroup`, so the inner labels paint above both the inner circle and the sector
    // labels, and named so the scene sampler cannot renumber the unnamed groups around it.
    private readonly innerLabelsGroup = this.scalingGroup.appendChild(new Group({ name: 'innerLabels' }));

    readonly datumSelection = Selection.select<Sector<SunburstNode>>(this.sectorGroup, Sector<SunburstNode>);
    private readonly labelSelection = Selection.select<Group<SunburstNode>>(this.sectorLabelGroup, Group);
    private readonly highlightSelection = Selection.select<Sector<SunburstNode>>(this.highlightSectorGroup, Sector);
    private readonly innerCircleSelection = Selection.select<Sector<{ radius: number }>>(
        this.innerCircleGroup,
        Sector<{ radius: number }>
    );
    readonly innerLabelsSelection = Selection.select<Text<NormalisedSunburstInnerLabelOptions>>(
        this.innerLabelsGroup,
        Text
    );

    /** Resolved once per layout pass; read back by `resolveCentreCircle()`. */
    private centreCircle: { radius: number } | null = null;

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super(moduleCtx);

        this.sectorLabelGroup.pointerEvents = PointerEvents.None;
        // Load-bearing: `pickNodesExactShape` walks `contentGroup` and accepts any non-missing object
        // datum, so without this the painted circle would show a tooltip and reach `itemStyler`.
        this.innerCircleGroup.pointerEvents = PointerEvents.None;
        this.innerLabelsGroup.pointerEvents = PointerEvents.None;
    }

    override processData() {
        super.processData();

        setAngleData(this.rootNode!);
    }

    updateSelections() {
        const { label, secondaryLabel } = this.options;
        this.usesPlacedLabels = label.enabled || secondaryLabel.enabled;
        const highlightedNode = this.getActiveHighlightNode();
        const getDatumId = (node: SunburstNode) => node.datumIndex;
        this.highlightSelection.update(highlightedNode == null ? [] : [highlightedNode], undefined, getDatumId);

        if (!this.nodeDataRefresh) return;
        this.nodeDataRefresh = false;

        const { chart } = this;
        if (chart == null) return;

        const seriesRect = chart.seriesRect;
        if (seriesRect == null) return;

        const descendants = Array.from(this.rootNode!);

        const updateLabelGroup = (group: Group) => {
            group.append([
                new TransformableText({ tag: TextNodeTag.Primary }),
                new TransformableText({ tag: TextNodeTag.Secondary }),
            ]);
        };

        this.datumSelection.update(descendants, undefined, (node) => node.datumIndex);
        this.labelSelection.update(descendants, updateLabelGroup, (node) => node.datumIndex);
    }

    protected getItemStyle(nodeDatum: SunburstNode, isHighlight: boolean) {
        const { options, colorScale } = this;

        const { itemStyler, colorKey } = options;
        const { missingDataFill } = options.colorScale;
        const rootIndex = nodeDatum.path?.[0] ?? 0;

        const highlightedNode = this.getActiveHighlightNode();
        const highlightState = this.getHierarchyHighlightState(isHighlight, highlightedNode, nodeDatum);
        const highlightStyles = this.getHierarchyHighlightStyles(highlightState, this.options.highlight);
        const selectionState = this.getSelectionStyle(nodeDatum.datumIndex);
        const baseStyle = mergeDefaults(selectionState, highlightStyles, this.itemStyle(rootIndex));

        if (nodeDatum.colorValue != null && highlightStyles?.fill == null) {
            baseStyle.fill = colorScale.convert(nodeDatum.colorValue);
        } else if (colorKey != null && missingDataFill != null && highlightStyles?.fill == null) {
            baseStyle.fill = missingDataFill;
        }

        let style = baseStyle;

        if (itemStyler != null && nodeDatum != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(nodeDatum.datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(
                        nodeDatum,
                        style,
                        toHierarchyHighlightString(highlightState)
                    );
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(itemStyler, params)
                    );
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, style);
            }
        }

        return style;
    }

    private itemStyle(index: number): ItemStyle {
        const { fills, strokes, fillOpacity, strokeWidth, strokeOpacity } = this.options;
        return {
            fill: cycledValue(fills, index),
            fillOpacity,
            stroke: cycledValue(strokes, index),
            strokeWidth,
            strokeOpacity,
            opacity: 1,
        };
    }

    private makeItemStylerParams(nodeDatum: SunburstNode, style: ItemStyle, highlightState: AgSunburstHighlightState) {
        const { id: seriesId } = this;
        const { colorKey, childrenKey, sizeKey, labelKey, secondaryLabelKey } = this.options;
        // `style` is the resolved item style, so its `fill` never carries unresolved colour refs.
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum: nodeDatum.datum,
            depth: nodeDatum.depth ?? 0,
            colorKey,
            childrenKey,
            sizeKey,
            labelKey,
            secondaryLabelKey,
            highlightState,
            selectionState: this.getSelectionStateString(nodeDatum.datumIndex),
            candidateState: this.getCandidateStateString(nodeDatum.datumIndex),
            ...style,
            fill,
        } satisfies CallbackParamRules<AgSunburstSeriesItemStylerParams<unknown, unknown>>;
    }

    updateNodes() {
        // Reset before the early return, so a layout pass that cannot run leaves no stale centre.
        this.centreCircle = null;

        const { chart, data, maxDepth } = this;

        if (chart == null || data == null) {
            return;
        }

        const { width, height } = chart.seriesRect!;
        const {
            sectorSpacing,
            cornerRadius,
            shadow,
            childrenKey,
            colorKey,
            colorName,
            labelKey,
            secondaryLabelKey,
            sizeKey,
            sizeName,
            innerRadiusRatio,
            innerRadiusSize,
            innerCircle,
        } = this.options;

        this.contentGroup.translationX = width / 2;
        this.contentGroup.translationY = height / 2;

        const baseInset = sectorSpacing * 0.5;
        const radius = Math.min(width, height) / 2;
        // No hole unless one of the inner-radius options is explicitly set - the short-circuit keeps an
        // unconfigured sunburst identical to before.
        const requestedHole =
            innerRadiusRatio == null && innerRadiusSize == null
                ? 0
                : radius * (innerRadiusRatio ?? 0) + (innerRadiusSize ?? 0);
        // The hole is measured outwards from the centre and is deliberately NOT capped at the series
        // radius: a hole larger than the radius leaves the sectors no room, which renders an empty
        // chart rather than silently snapping back to a full sunburst.
        const hole = Math.max(requestedHole, 0);
        const radiusScale = Math.max(radius - hole, 0) / (maxDepth + 1);
        const angleOffset = -Math.PI / 2;

        const seriesFillBBox: _ModuleSupport.ShapeFillBBox = {
            series: new BBox(-radius, -radius, 2 * radius, 2 * radius),
            axis: new BBox(-radius, -radius, 2 * radius, 2 * radius),
        };

        const { rootNode } = this;
        // The centre region is the carved hole and nothing else. Without an inner-radius option the
        // series renders exactly as it did before the inner circle existed - including a sole 100%
        // root node, whose depth-0 disc keeps its own centre label rather than becoming a container.
        // A hole that swallows the whole radius leaves no chart at all, centre included.
        if (hole > 0 && hole < radius) {
            this.centreCircle = { radius: hole };
        }

        rootNode?.walk((node) => {
            const { startAngle, endAngle } = node;
            if (node.depth != null) {
                const midAngle = (startAngle + endAngle) / 2 + angleOffset;
                const midRadius = hole + (node.depth + 0.5) * radiusScale;
                node.midPoint.x = Math.cos(midAngle) * midRadius;
                node.midPoint.y = Math.sin(midAngle) * midRadius;
            }
        });

        rootNode?.walk((node) => {
            const { datum, depth, startAngle, endAngle, parent, sumSize } = node;

            let labelValue: NormalisedTextOrSegments | undefined;
            if (datum != null && depth != null && labelKey != null) {
                const value = (datum as any)[labelKey];
                labelValue = this.getLabelText<AgSunburstSeriesLabelFormatterParams>(
                    value,
                    datum,
                    labelKey,
                    'label',
                    [],
                    this.options.label,
                    {
                        depth,
                        datum,
                        childrenKey,
                        colorKey,
                        colorName,
                        labelKey,
                        secondaryLabelKey,
                        sizeKey,
                        sizeName,
                        value,
                    }
                );
            }
            if (labelValue === '') {
                labelValue = undefined;
            }

            let secondaryLabelValue: NormalisedTextOrSegments | undefined;
            if (datum != null && depth != null && secondaryLabelKey != null) {
                const value = (datum as any)[secondaryLabelKey];
                secondaryLabelValue = this.getLabelText<AgSunburstSeriesLabelFormatterParams>(
                    value,
                    datum,
                    secondaryLabelKey,
                    'secondaryLabel',
                    [],
                    this.options.secondaryLabel,
                    {
                        depth,
                        datum,
                        childrenKey,
                        colorKey,
                        colorName,
                        labelKey,
                        secondaryLabelKey,
                        sizeKey,
                        sizeName,
                        value,
                    }
                );
            }
            if (secondaryLabelValue === '') {
                secondaryLabelValue = undefined;
            }

            node.labelText = labelValue;
            node.secondaryLabelText = secondaryLabelValue;
            node.ring = undefined;
            if (depth == null) return;
            // An oversized hole collapses every sector to zero thickness, and fitting a label to a
            // zero-height annulus only yields non-finite geometry.
            if (radiusScale <= 0) return;

            const innerRadius = hole + depth * radiusScale + baseInset;
            const outerRadius = hole + (depth + 1) * radiusScale - baseInset;
            node.ring = {
                innerRadius,
                outerRadius,
                sweep: endAngle - startAngle,
                theta: angleOffset + (startAngle + endAngle) / 2,
                radiusScale,
                // With a hole carved, depth 0 is a genuine annulus rather than a disc, so the
                // centre-circle and wedge-from-centre label forms no longer apply to it.
                wedge: depth === 0 && hole === 0,
                centreCircle: depth === 0 && hole === 0 && parent?.sumSize === sumSize,
            };
        });

        // Placed labels are written back once the label manager has fitted them to this layout.
        if (!this.usesPlacedLabels) {
            rootNode?.walk((node) => {
                node.label = undefined;
                node.secondaryLabel = undefined;
                node.contentHeight = 0;
            });
        }

        const updateSector = (nodeDatum: SunburstNode, sector: Sector, highlighted: boolean) => {
            const { depth, startAngle, endAngle } = nodeDatum;
            if (depth == null) {
                sector.visible = false;
                return;
            }

            sector.visible = true;

            const style = this.getItemStyle(nodeDatum, highlighted);

            const fill = style.fill;
            const strokeWidth = style.strokeWidth;

            const fillBBox = isGradientFill(fill) && fill.bounds !== 'item' ? seriesFillBBox : undefined;
            sector.setStyleProperties(style, fillBBox);
            sector.fillShadow = this.resolveItemShadow(shadow, highlighted, nodeDatum.datumIndex);
            // Outer rings draw after inner ones, so a later inner-ring sector's shadow cannot cut across an
            // earlier branch's outer ring.
            sector.zIndex = depth;
            sector.centerX = 0;
            sector.centerY = 0;
            sector.innerRadius = hole + depth * radiusScale;
            sector.outerRadius = hole + (depth + 1) * radiusScale;
            sector.startAngle = startAngle + angleOffset;
            sector.endAngle = endAngle + angleOffset;
            sector.inset = baseInset + strokeWidth * 0.5;
            sector.cornerRadius = cornerRadius;
        };

        this.datumSelection.each((sector, datum) => {
            updateSector(datum, sector, false);
        });
        this.highlightSelection.each((rect, datum) => {
            updateSector(datum, rect, true);
        });

        const { innerLabels = [] } = this.options;
        const centre = this.resolveCentreCircle();
        this.innerCircleSelection.update(innerCircle == null || centre == null ? [] : [centre]);
        this.innerLabelsSelection.update(centre == null ? [] : innerLabels, (node) => {
            node.pointerEvents = PointerEvents.None;
        });
        // Gate the warning on whether the inner-radius options are set, not on the hole they compute:
        // a deliberate `innerRadiusRatio: 0` is a configured series, not a misconfigured one, so it
        // renders without a hole and says nothing.
        if ((innerCircle != null || innerLabels.length > 0) && innerRadiusRatio == null && innerRadiusSize == null) {
            this.ctx.logger.warnOnce(
                'Options [series.innerCircle] and [series.innerLabels] have no effect unless either [series.innerRadiusRatio] or [series.innerRadiusSize] is set.'
            );
        } else if (innerCircle != null) {
            const { fill, fillOpacity = 1 } = innerCircle;
            const fillBBox = isGradientFill(fill) && fill.bounds !== 'item' ? seriesFillBBox : undefined;
            this.innerCircleSelection.each((sector, { radius: circleRadius }) => {
                sector.setStyleProperties({ fill, fillOpacity }, fillBBox);
                sector.centerX = 0;
                sector.centerY = 0;
                sector.innerRadius = 0;
                sector.outerRadius = circleRadius;
                sector.startAngle = 0;
                sector.endAngle = 2 * Math.PI;
            });
        }

        this.updateLabelNodes();

        if (centre != null && innerLabels.length > 0) {
            this.updateInnerLabelNodes(centre);
        }
    }

    override getLabelData(): PointLabelDatum[] {
        if (!this.usesPlacedLabels) return [];
        const data: SunburstPlacedLabelDatum[] = [];
        this.rootNode?.walk((node) => {
            const datum = this.sectorLabelDatum(node);
            if (datum != null) data.push(datum);
        });
        return data;
    }

    private sectorLabelDatum(node: SunburstNode): SunburstPlacedLabelDatum | undefined {
        const { ring, labelText, secondaryLabelText } = node;
        if (ring == null) return;
        const { label, secondaryLabel } = this.options;
        const primary =
            label.enabled && labelText != null
                ? autoSizedLabelFit(labelText, label, this.labelBoxExtent(node, label))
                : undefined;
        const secondary =
            secondaryLabel.enabled && secondaryLabelText != null
                ? autoSizedLabelFit(secondaryLabelText, secondaryLabel, this.labelBoxExtent(node, secondaryLabel))
                : undefined;
        const fit = primary ?? secondary;
        if (fit == null) return;
        const blocks = labelPairBlocks(primary, secondary);
        const tags: TextNodeTag[] = [];
        if (primary != null) tags.push(TextNodeTag.Primary);
        if (secondary != null) tags.push(TextNodeTag.Secondary);

        const { width, height } = measureLabelText(fit.text, fit.font);
        return {
            point: { x: 0, y: 0, size: 0 },
            label: { text: fit.text, width, height },
            fit,
            stack: { blocks, spacing: label.spacing ?? 0 },
            anchor: undefined,
            placement: undefined,
            neverDrop: blocks.some((block) => block.fit.fitOverflow != null),
            positionedCandidates: this.sectorLabelCandidates(ring, naturalStackHeight(blocks, label.spacing ?? 0)),
            node,
            tags,
        };
    }

    /**
     * The forms a sector's labels can take. Each holds only the heights at which it is the wider, so a stack
     * takes the form the sector favours at the size it is fitted at; the form favoured at full size is first.
     */
    private sectorLabelCandidates(ring: SunburstLabelRing, naturalHeight: number): SunburstLabelCandidate[] {
        const { padding } = this.options;
        const { innerRadius, outerRadius, sweep, wedge } = ring;
        const chordAt = (offset: number) => Math.sqrt(Math.max(0, outerRadius ** 2 - offset ** 2));
        if (ring.centreCircle) {
            const shape = heightBoundRegion(padding, (height) => 2 * chordAt(height * 0.5));
            return [this.sectorLabelCandidate(ring, LabelPlacement.CenterCircle, shape)];
        }

        const straightEdges = sweep < Math.PI ? 2 * innerRadius * Math.tan(sweep * 0.5) : Infinity;
        const parallelWidth = (height: number) => Math.min(2 * chordAt(innerRadius + height), straightEdges);
        let perpendicularWidth: ((height: number) => number) | undefined;
        if (wedge) {
            perpendicularWidth = (height) => {
                const apex = sweep < Math.PI ? height / (2 * Math.tan(sweep * 0.5)) : 0;
                return chordAt(height * 0.5) - apex;
            };
        } else if (normalizeAngle360(sweep) < Math.PI / 4) {
            // Measured across the sector's full height at its inner edge, however short the text.
            const across = chordAt(straightEdges * 0.5) - innerRadius;
            perpendicularWidth = () => across;
        }
        if (perpendicularWidth == null) {
            return [
                this.sectorLabelCandidate(ring, LabelPlacement.Parallel, heightBoundRegion(padding, parallelWidth)),
            ];
        }

        const widthAcross = perpendicularWidth;
        const parallelWins = (height: number) => parallelWidth(height) >= widthAcross(height);
        const parallel = heightBoundRegion(padding, (height) => (parallelWins(height) ? parallelWidth(height) : 0));
        const perpendicular = heightBoundRegion(padding, (height) => {
            if (parallelWins(height) || (!wedge && height > straightEdges)) return 0;
            return widthAcross(height);
        });
        const candidates = [
            this.sectorLabelCandidate(ring, LabelPlacement.Parallel, parallel),
            this.sectorLabelCandidate(ring, LabelPlacement.Perpendicular, perpendicular),
        ];
        return parallelWins(naturalHeight + 2 * padding) ? candidates : candidates.reverse();
    }

    private sectorLabelCandidate(
        ring: SunburstLabelRing,
        labelPlacement: LabelPlacement,
        shape: FitRegion
    ): SunburstLabelCandidate {
        const { translationX: centreX, translationY: centreY } = this.contentGroup;
        const { padding } = this.options;
        const { theta } = ring;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const centreFor = (width: number, height: number) => {
            const radius = sectorLabelRadius(ring, labelPlacement, width, height, padding);
            return { x: centreX + cos * radius, y: centreY + sin * radius };
        };
        const { x, y } = centreFor(0, 0);
        const anchor: OrientationAnchor = { x, y, textAlign: 'center', textBaseline: 'middle' };
        let rotation = 0;
        if (labelPlacement === LabelPlacement.Parallel) {
            rotation = theta + Math.PI * 0.5;
        } else if (labelPlacement === LabelPlacement.Perpendicular) {
            rotation = theta;
        }
        return {
            box: { x, y, width: 0, height: 0 },
            region: { x: 0, y: 0, width: 2 * centreX, height: 2 * centreY },
            rotation: (rotation * 180) / Math.PI,
            fitTo: { shape, anchor, centreFor, padding: NO_PADDING },
            labelPlacement,
        };
    }

    override updatePlacedLabelData(placed: PlacedLabel<SunburstNode>[]) {
        this.rootNode?.walk((node) => {
            node.label = undefined;
            node.secondaryLabel = undefined;
            node.contentHeight = 0;
        });
        for (const placedLabel of placed as PlacedLabel<unknown>[]) {
            if (placedLabel.stack == null) continue;
            const { labelPlacement } = placedLabel.candidate as SunburstLabelCandidate;
            this.writeSectorLabels(placedLabel.datum as SunburstPlacedLabelDatum, labelPlacement, placedLabel.stack);
        }
        this.updateLabelNodes();
    }

    private writeSectorLabels(
        { node, tags }: SunburstPlacedLabelDatum,
        labelPlacement: LabelPlacement,
        stack: FittedLabelStack
    ) {
        const { ring } = node;
        if (ring == null) return;
        const { theta } = ring;
        const { width: labelWidth, height: labelHeight } = stack;

        const top = Math.sin(theta) >= 0;
        const right = Math.cos(theta) >= 0;
        const circleQuarter =
            (top ? CircleQuarter.Top : CircleQuarter.Bottom) & (right ? CircleQuarter.Right : CircleQuarter.Left);

        const labelRadius = sectorLabelRadius(ring, labelPlacement, labelWidth, labelHeight, this.options.padding);

        for (let index = 0; index < tags.length; index++) {
            const tag = tags[index];
            const fitted = stack.blocks[index];
            if (fitted == null) continue;
            const primary = tag === TextNodeTag.Primary;
            const props = primary ? this.options.label : this.options.secondaryLabel;
            const box = this.labelBoxExtent(node, props);
            const { fontStyle = 'normal', fontFamily, fontWeight = 'normal', color = 'black' } = props;
            const layout: LabelLayout = {
                text: fitted.text,
                fontSize: fitted.fontSize,
                lineHeight: props.lineHeight ?? cachedTextMeasurer(fontWithSize(props, fitted.fontSize)).lineHeight(),
                fontStyle,
                fontFamily,
                fontWeight,
                color,
                labelPlacement,
                circleQuarter,
                radius: labelRadius,
                theta,
                width: fitted.width,
                height: fitted.height + box.top + box.bottom,
            };
            if (primary) {
                node.label = layout;
            } else {
                node.secondaryLabel = layout;
            }
        }
        node.contentHeight = labelHeight;
    }

    private labelFormatterParams(node: SunburstNode): RequireOptional<AgSunburstSeriesLabelFormatterParams> {
        const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName } = this.options;
        return {
            childrenKey,
            colorKey,
            colorName: colorName ?? colorKey,
            depth: node.depth ?? Number.NaN,
            labelKey,
            secondaryLabelKey,
            sizeKey,
            sizeName: sizeName ?? sizeKey,
        };
    }

    /** The drawn box around a label at rest, so the fit reserves room for an `itemStyler`'s padding and border. */
    private labelBoxExtent(
        node: SunburstNode,
        props: NormalisedSunburstSeriesOwnOptions['label'] | NormalisedSunburstSeriesOwnOptions['secondaryLabel']
    ) {
        if (props.itemStyler == null) return expandLabelBoxExtent(props);
        return expandLabelBoxExtent(
            getLabelStyles(this, node, this.labelFormatterParams(node), props, false, undefined)
        );
    }

    private updateLabelNodes() {
        const highlightedNode = this.getActiveHighlightNode();

        const updateText = (node: SunburstNode, text: TransformableText, tag: TextNodeTag, highlighted: boolean) => {
            const { depth, contentHeight } = node;
            const primary = tag === TextNodeTag.Primary;
            const label = primary ? node.label : node.secondaryLabel;
            if (depth == null || label == null) {
                text.visible = false;
                return;
            }

            const { labelPlacement, circleQuarter, radius: textRadius, theta } = label;

            const highlightState = this.getHierarchyHighlightState(highlighted, highlightedNode, node);

            const { opacity: highlightOpacity } =
                this.getHierarchyHighlightStyles(highlightState, this.options.highlight) ?? {};

            const baseLabelStyle = primary ? this.options.label : this.options.secondaryLabel;
            const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
            const params = this.labelFormatterParams(node);
            const style = getLabelStyles(this, node, params, baseLabelStyle, highlighted, activeHighlight);
            text.text = label.text;
            text.fontSize = label.fontSize;
            text.lineHeight = label.lineHeight;
            text.fontStyle = label.fontStyle;
            text.fontFamily = label.fontFamily;
            text.fontWeight = label.fontWeight;
            text.fillOpacity = highlightOpacity ?? 1;
            text.fill = style.color;
            text.setBoxing(style);

            switch (labelPlacement) {
                case LabelPlacement.CenterCircle:
                    // No precedence to arbitrate against the inner labels: this placement is only
                    // chosen when no hole is carved, which is exactly when no centre circle resolves.
                    text.textAlign = 'center';
                    text.textBaseline = 'top';
                    text.translationX = 0;
                    text.translationY = (primary ? 0 : contentHeight - label.height) - contentHeight * 0.5;
                    text.rotation = 0;
                    break;
                case LabelPlacement.Parallel: {
                    const topHalf = (circleQuarter & CircleQuarter.Top) !== 0;
                    const translationRadius =
                        primary === !topHalf ? textRadius : textRadius - (contentHeight - label.height);
                    text.textAlign = 'center';
                    text.textBaseline = topHalf ? 'bottom' : 'top';
                    text.translationX = Math.cos(theta) * translationRadius;
                    text.translationY = Math.sin(theta) * translationRadius;
                    text.rotation = topHalf ? theta - Math.PI * 0.5 : theta + Math.PI * 0.5;
                    break;
                }
                case LabelPlacement.Perpendicular: {
                    const rightHalf = (circleQuarter & CircleQuarter.Right) !== 0;
                    const translation =
                        primary === !rightHalf
                            ? (contentHeight - label.height) * 0.5
                            : (label.height - contentHeight) * 0.5;
                    text.textAlign = 'center';
                    text.textBaseline = 'middle';
                    text.translationX = Math.cos(theta) * textRadius + Math.cos(theta + Math.PI / 2) * translation;
                    text.translationY = Math.sin(theta) * textRadius + Math.sin(theta + Math.PI / 2) * translation;
                    text.rotation = rightHalf ? theta : theta + Math.PI;
                    break;
                }
            }
            text.visible = true;
        };
        for (const text of this.labelSelection.selectByClass(TransformableText)) {
            // eslint-disable-next-line sonarjs/deprecation
            const datum = text.unsafeClosestDatum();
            updateText(datum, text, text.tag, datum === highlightedNode);
        }
    }

    private updateInnerLabelNodes(centre: { radius: number }) {
        const { radius } = centre;
        const textBBoxes: BBox[] = [];
        const margins: number[] = [];
        // The inner labels fit the square inscribed in the centre circle (diagonal 2·r ⇒ side r·√2).
        const extent = radius * Math.SQRT2;
        const box = { width: extent, height: extent };
        this.innerLabelsSelection.each((text, datum) => {
            const { fontStyle, fontWeight, fontSize, fontFamily, color } = datum;
            text.fontStyle = fontStyle;
            text.fontWeight = fontWeight;
            text.fontSize = fontSize;
            text.fontFamily = fontFamily;
            text.text = fitLabelToContainer(datum.text, undefined, datum, box);
            text.x = 0;
            text.y = 0;
            text.fill = color;
            text.textAlign = 'center';
            // `textBottoms` below positions each line by the bottom of its box, so the node must
            // measure and paint from that edge too - the default `alphabetic` baseline would drop
            // every line by one text descent.
            text.textBaseline = 'bottom';
            textBBoxes.push(text.getBBox());
            margins.push(datum.spacing);
        });
        const getMarginTop = (index: number) => (index === 0 ? 0 : margins[index]);
        const getMarginBottom = (index: number) => (index === margins.length - 1 ? 0 : margins[index]);
        const totalWidth = textBBoxes.reduce((max, bbox) => Math.max(max, bbox.width), 0);
        const totalHeight = textBBoxes.reduce(
            (sum, bbox, i) => sum + bbox.height + getMarginTop(i) + getMarginBottom(i),
            0
        );
        const labelRadius = Math.sqrt(Math.pow(totalWidth / 2, 2) + Math.pow(totalHeight / 2, 2));
        const labelsVisible = labelRadius <= radius;

        const textBottoms: number[] = [];
        for (let i = 0, prev = -totalHeight / 2; i < textBBoxes.length; i++) {
            const bbox = textBBoxes[i];
            const bottom = bbox.height + prev + getMarginTop(i);
            textBottoms.push(bottom);
            prev = bottom + getMarginBottom(i);
        }
        this.innerLabelsSelection.each((text, _datum, index) => {
            text.visible = labelsVisible;
            text.y = textBottoms[index];
        });
    }

    override getTooltipContent(datumIndex: _ModuleSupport.DatumIndex): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, options, ctx } = this;
        const { labelKey, secondaryLabelKey, childrenKey, sizeKey, sizeName, colorKey, colorName, tooltip } = options;
        const { formatManager } = ctx;
        const nodeDatum = this.dfsFind(datumIndex);
        if (nodeDatum == null) return;
        const { datum, depth } = nodeDatum;
        if (datum == null || depth == null) return;

        const data: _ModuleSupport.TooltipContentDataRow[] = [];

        const datumSize = sizeKey == null ? undefined : datum[sizeKey];
        if (datumSize != null) {
            const sizeDomain = [0, this.rootNode?.sumSize ?? 0];
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value: datumSize,
                datum,
                seriesId,
                legendItemName: undefined,
                key: sizeKey,
                source: 'tooltip',
                property: 'size',
                boundSeries: this.getFormatterContext('size'),
                domain: sizeDomain,
                fractionDigits: undefined,
                visibleDomain: undefined,
            });
            data.push({ label: sizeName, fallbackLabel: sizeKey!, value: content ?? formatValue(datumSize) });
        }

        const datumColor = colorKey == null ? undefined : datum[colorKey];
        if (datumColor != null) {
            const { colorDomain } = this;
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value: datumColor,
                datum,
                seriesId,
                legendItemName: undefined,
                key: colorKey,
                source: 'tooltip',
                property: 'color',
                boundSeries: this.getFormatterContext('color'),
                domain: colorDomain,
                fractionDigits: undefined,
                visibleDomain: undefined,
            });
            const binLabel = findDiscreteColorBinLabel(
                this.colorScale,
                options.colorScale.fills,
                datumColor,
                formatValue
            );
            data.push({
                label: colorName,
                fallbackLabel: colorKey!,
                value: content ?? binLabel ?? formatValue(datumColor),
            });
        }

        const format: Required<NormalisedSunburstSeriesStyle> = this.getItemStyle(
            { ...nodeDatum, colorValue: datumColor ?? nodeDatum.colorValue } as SunburstNode,
            false
        );

        const color = format.fill;

        const markerStyle = {
            shape: 'square' as const,
            fill: color,
            fillOpacity: 1,
            stroke: undefined,
            strokeWidth: 0,
            ...STROKE_STYLE_THEME_DEFAULTS,
        };

        if (isGradientFill(markerStyle.fill)) {
            markerStyle.fill = { ...markerStyle.fill, gradient: 'linear', rotation: 0, reverse: false };
        }

        return this.formatTooltipWithContext(
            tooltip,
            {
                title: labelKey == null ? undefined : datum[labelKey],
                symbol: {
                    marker: markerStyle,
                },
                data,
            },
            {
                seriesId,
                datum,
                title: undefined,
                depth,
                labelKey,
                secondaryLabelKey,
                childrenKey,
                sizeKey,
                sizeName,
                colorKey,
                colorName,
                ...format,
            }
        );
    }

    override createNodeData() {
        return undefined;
    }

    /**
     * The centre region of the series, resolved by the last layout pass: the hole carved by
     * `innerRadiusRatio`/`innerRadiusSize`, or `null` when neither carves one.
     */
    resolveCentreCircle(): { radius: number } | null {
        return this.centreCircle;
    }

    protected override pickNodeClosestDatum(point: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        return this.pickNodeNearestDistantObject(point, this.datumSelection.nodes());
    }

    protected override pickNodesInBBoxPredicate() {
        return _ModuleSupport.pickSectorsInBBoxPredicate(this);
    }

    protected override animateEmptyUpdateReady() {
        fromToMotion<SunburstNode, ScalableGroup<SunburstNode>, Pick<ScalableGroup, 'scalingX' | 'scalingY'>>(
            this.id,
            'nodes',
            this.ctx.animationManager,
            [this.scalingGroup] as any,
            {
                toFn() {
                    return { scalingX: 1, scalingY: 1 };
                },
                fromFn() {
                    return { scalingX: 0, scalingY: 0 };
                },
            }
        );
    }

    protected override computeFocusBounds(node: Sector): Path | undefined {
        return node;
    }

    protected override hasItemStylers(): boolean {
        return this.isSelectionEnabled() || this.options.itemStyler != null || this.options.label.itemStyler != null;
    }
}
