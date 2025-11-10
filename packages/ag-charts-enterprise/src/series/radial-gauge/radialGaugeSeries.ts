import {
    type AgRadialGaugeMarkerShape,
    type AgRadialGaugeOptions,
    type AgRadialGaugeTargetPlacement,
    type AgSeriesMarkerStyle,
    type FontStyle,
    type FontWeight,
    type TextAlign,
    type TextOrSegments,
    type VerticalAlign,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type Point,
    cachedTextMeasurer,
    isArray,
    isBetweenAngles,
    measureTextSegments,
    normalizeAngle360,
    normalizeAngle360Inclusive,
    toPlainText,
    toRadians,
    mergeDefaults,
} from 'ag-charts-core';

import { LinearAngleScale } from '../../axes/angle-number/linearAngleScale';
import { formatWithContext } from '../../utils/formatter';
import { DatumUnion } from '../gauge-util/datumUnion';
import { fadeInFns, formatLabel, getLabelText } from '../gauge-util/label';
import { lineMarker } from '../gauge-util/lineMarker';
import { pickGaugeFocus, pickGaugeNearestDatum } from '../gauge-util/pick';
import { RadialGaugeNeedle } from './radialGaugeNeedle';
import {
    LabelType,
    NodeDataType,
    type RadialGaugeLabelDatum,
    type RadialGaugeNodeDatum,
    type RadialGaugeNodeDatumIndex,
    RadialGaugeSeriesProperties,
    type RadialGaugeTargetDatum,
    type RadialGaugeTargetDatumLabel,
} from './radialGaugeSeriesProperties';
import {
    formatRadialGaugeLabels,
    prepareRadialGaugeSeriesAnimationFunctions,
    resetRadialGaugeSeriesResetNeedleFunction,
    resetRadialGaugeSeriesResetSectorFunction,
} from './radialGaugeUtil';

const {
    fromToMotion,
    resetMotion,
    SeriesNodePickMode,
    StateMachine,
    createDatumId,
    sectorBox,
    BBox,
    Group,
    PointerEvents,
    Selection,
    Sector,
    SectorBox,
    Text,
    Marker,
    tickFormat,
    applyShapeStyle,
} = _ModuleSupport;

interface TargetLabel {
    enabled: boolean;
    color: string;
    fontStyle: FontStyle;
    fontWeight: FontWeight;
    fontSize: number;
    fontFamily: string;
    spacing: number;
}

interface Target {
    text: string | undefined;
    value: number;
    shape: AgRadialGaugeMarkerShape;
    placement: AgRadialGaugeTargetPlacement;
    spacing: number;
    size: number;
    rotation: number;
    label: TargetLabel;
    style: AgSeriesMarkerStyle;
}

type GaugeAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
type GaugeAnimationEvent = {
    update: undefined;
    updateData: undefined;
    highlight: undefined;
    highlightMarkers: undefined;
    resize: undefined;
    clear: undefined;
    reset: undefined;
    skip: undefined;
};

interface RadialGaugeNeedleDatum {
    centerX: number;
    centerY: number;
    radius: number;
    angle: number;
    series: RadialGaugeSeries;
}

interface RadialGaugeTickDatum {
    index: number;
    value: number;
    text: TextOrSegments;
    width: number;
    height: number;
}

interface RadialGaugeNodeDataContext
    extends _ModuleSupport.SeriesNodeDataContext<
        RadialGaugeNodeDatumIndex,
        RadialGaugeNodeDatum,
        RadialGaugeLabelDatum
    > {
    needleData: RadialGaugeNeedleDatum[];
    targetData: RadialGaugeTargetDatum[];
    scaleData: RadialGaugeNodeDatum[];
    tickData: RadialGaugeTickDatum[];
}

const targetPlacementRotation: Record<AgRadialGaugeTargetPlacement, number> = {
    inside: 90,
    middle: 0,
    outside: -90,
};
const outsideLabelPlacements: Array<{ textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline }> = [
    { textAlign: 'left', textBaseline: 'top' },
    { textAlign: 'right', textBaseline: 'top' },
    { textAlign: 'right', textBaseline: 'bottom' },
    { textAlign: 'left', textBaseline: 'bottom' },
];
const insideLabelPlacements: Array<{ textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline }> = [
    { textAlign: 'right', textBaseline: 'bottom' },
    { textAlign: 'left', textBaseline: 'bottom' },
    { textAlign: 'left', textBaseline: 'top' },
    { textAlign: 'right', textBaseline: 'top' },
];

export class RadialGaugeSeries
    extends _ModuleSupport.Series<
        RadialGaugeNodeDatumIndex,
        RadialGaugeNodeDatum,
        AgRadialGaugeOptions,
        RadialGaugeSeriesProperties,
        RadialGaugeLabelDatum,
        RadialGaugeNodeDataContext
    >
    implements _ModuleSupport.GaugeSeries
{
    static readonly className = 'RadialGaugeSeries';
    static readonly type = 'radial-gauge' as const;

    public centerX: number = 0;
    public centerY: number = 0;
    public radius: number = 0;
    public textAlign: TextAlign = 'center';
    public verticalAlign: VerticalAlign = 'middle';
    override properties = new RadialGaugeSeriesProperties();

    public scale = new LinearAngleScale();

    private readonly scaleGroup = this.contentGroup.appendChild(new Group({ name: 'scaleGroup' }));
    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));
    private readonly itemNeedleGroup = this.contentGroup.appendChild(new Group({ name: 'itemNeedleGroup' }));
    private readonly itemTargetGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetGroup' }));
    private readonly itemTargetLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetLabelGroup' }));
    private readonly itemLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemLabelGroup' }));
    private readonly highlightTargetGroup = this.highlightGroup.appendChild(
        new Group({ name: 'itemTargetLabelGroup' })
    );
    private readonly tickGroup = this.contentGroup.appendChild(new Group({ name: 'tickGroup' }));

    private scaleSelection: _ModuleSupport.Selection<_ModuleSupport.Sector, RadialGaugeNodeDatum> = Selection.select(
        this.scaleGroup,
        () => this.nodeFactory()
    );
    private datumSelection: _ModuleSupport.Selection<_ModuleSupport.Sector, RadialGaugeNodeDatum> = Selection.select(
        this.itemGroup,
        () => this.nodeFactory()
    );
    private needleSelection: _ModuleSupport.Selection<RadialGaugeNeedle, RadialGaugeNeedleDatum> = Selection.select(
        this.itemNeedleGroup,
        RadialGaugeNeedle
    );
    public targetSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, RadialGaugeTargetDatum> = Selection.select(
        this.itemTargetGroup,
        () => this.markerFactory()
    );
    private targetLabelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, RadialGaugeTargetDatum> =
        Selection.select(this.itemTargetLabelGroup, Text);
    private labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, RadialGaugeLabelDatum> = Selection.select(
        this.itemLabelGroup,
        Text
    );
    private highlightTargetSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, RadialGaugeTargetDatum> =
        Selection.select(this.highlightTargetGroup, () => this.markerFactory());
    private tickSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, RadialGaugeTickDatum> =
        Selection.select(this.tickGroup, _ModuleSupport.TransformableText);

    public datumUnion: DatumUnion<_ModuleSupport.Sector, RadialGaugeNodeDatum> = new DatumUnion();
    private readonly animationState: _ModuleSupport.StateMachine<GaugeAnimationState, GaugeAnimationEvent>;

    public contextNodeData?: RadialGaugeNodeDataContext;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH, SeriesNodePickMode.NEAREST_NODE],
        });

        this.animationState = new StateMachine<GaugeAnimationState, GaugeAnimationEvent>('empty', {
            empty: {
                update: {
                    target: 'ready',
                    action: () => this.animateEmptyUpdateReady(),
                },
                reset: 'empty',
                skip: 'ready',
            },
            ready: {
                updateData: 'waiting',
                clear: 'clearing',
                resize: () => this.animateReadyResize(),
                reset: 'empty',
                skip: 'ready',
            },
            waiting: {
                update: {
                    target: 'ready',
                    action: () => this.animateWaitingUpdateReady(),
                },
                reset: 'empty',
                skip: 'ready',
            },
            clearing: {
                update: {
                    target: 'empty',
                },
                reset: 'empty',
                skip: 'ready',
            },
        });

        this.scaleGroup.pointerEvents = PointerEvents.None;
        this.tickGroup.pointerEvents = PointerEvents.None;
        this.itemNeedleGroup.pointerEvents = PointerEvents.None;
        this.itemLabelGroup.pointerEvents = PointerEvents.None;
    }

    override get hasData(): boolean {
        return this.properties.value != null;
    }

    private nodeFactory(): _ModuleSupport.Sector {
        return new Sector();
    }

    private markerFactory(): _ModuleSupport.Marker {
        const marker = new Marker();
        marker.size = 1;
        return marker;
    }

    override processData() {
        this.nodeDataRefresh = true;

        this.animationState.transition('updateData');
    }

    private formatLabel(value: number) {
        const { min, max } = this.properties.scale;
        return formatLabel(value, { min, max });
    }

    private layoutScale() {
        const { scale, properties } = this;
        const { seriesRectWidth, seriesRectHeight } = this.nodeDataDependencies;
        const { scale: scaleProps, outerRadius } = this.properties;
        const { min, max, label, interval } = scaleProps;

        const startAngle = toRadians(properties.startAngle - 90);
        const endAngle = toRadians(properties.endAngle - 90);

        const sweepAngle = normalizeAngle360Inclusive(endAngle - startAngle);
        const largerThanHalf = sweepAngle > Math.PI;
        const containsTop = largerThanHalf || isBetweenAngles(1.5 * Math.PI, startAngle, endAngle);
        const containsRight = largerThanHalf || isBetweenAngles(0 * Math.PI, startAngle, endAngle);
        const containsBottom = largerThanHalf || isBetweenAngles(0.5 * Math.PI, startAngle, endAngle);
        const containsLeft = largerThanHalf || isBetweenAngles(1 * Math.PI, startAngle, endAngle);

        let textAlign: TextAlign;
        if (containsLeft && !containsRight) {
            textAlign = 'right';
        } else if (!containsLeft && containsRight) {
            textAlign = 'left';
        } else {
            textAlign = 'center';
        }

        let verticalAlign: VerticalAlign;
        if (containsTop && !containsBottom) {
            verticalAlign = 'bottom';
        } else if (!containsTop && containsBottom) {
            verticalAlign = 'top';
        } else {
            verticalAlign = 'middle';
        }

        const unitBox = sectorBox({
            startAngle,
            endAngle,
            innerRadius: 0,
            outerRadius: 0.5,
        });
        const centerXOffset = -(unitBox.x + unitBox.width / 2) * 2;
        const centerYOffset = -(unitBox.y + unitBox.height / 2) * 2;
        const unitBoxSize = Math.min(seriesRectWidth / unitBox.width, seriesRectHeight / unitBox.height);

        scale.domain = [min, max];
        scale.range = [startAngle, endAngle];
        scale.arcLength = unitBoxSize / 2;

        const { maxSpacing, minSpacing } = interval;
        const { arcLength } = scale;
        const minTickCount = maxSpacing ? Math.floor(arcLength / maxSpacing) : 1;
        const maxTickCount = minSpacing ? Math.floor(arcLength / minSpacing) : Infinity;
        const preferredTickCount = Math.floor((4 / Math.PI) * Math.abs(scale.range[0] - scale.range[1]));
        const tickCount = Math.max(minTickCount, Math.min(maxTickCount, preferredTickCount));
        const ticks =
            interval.values ??
            scale.ticks({
                nice: false,
                interval: interval.step,
                minTickCount,
                maxTickCount,
                tickCount,
            })?.ticks ??
            [];
        const tickFormatter = tickFormat(ticks, typeof label.format === 'string' ? label.format : undefined);

        const measurer = cachedTextMeasurer(label);
        const tickData = ticks
            .map((value, index): RadialGaugeTickDatum | undefined => {
                let text: TextOrSegments | undefined;
                if (label.formatter) {
                    text = formatWithContext(this.ctx, label.formatter, {
                        value,
                        index,
                        domain: scale.domain,
                        boundSeries: undefined!,
                    });
                }
                text ??= tickFormatter?.(value);

                if (text == null) return;

                const { width, height } = isArray(text)
                    ? measureTextSegments(text, label)
                    : measurer.measureLines(text);
                return { index, value, text, width, height };
            })
            .filter((value): value is RadialGaugeTickDatum => value != null);

        const maxWidth = tickData.reduce((m, t) => Math.max(m, t.width), 0);
        const maxHeight = tickData.reduce((m, t) => Math.max(m, t.height), 0);

        const labelInset = label.enabled ? Math.max(maxWidth, maxHeight) + label.spacing : 0;
        const radiusBounds = Math.max(
            0.5 * unitBoxSize - labelInset,
            // seriesRect may have negative size
            0
        );
        const radius = outerRadius ?? radiusBounds;

        this.centerX = seriesRectWidth / 2 + centerXOffset * radius;
        this.centerY = seriesRectHeight / 2 + centerYOffset * radius;
        this.radius = radius;
        this.textAlign = textAlign;
        this.verticalAlign = verticalAlign;

        return tickData;
    }

    protected getShapeFillBBox(): _ModuleSupport.ShapeFillBBox {
        const { centerX, centerY, radius } = this;
        const bbox = new BBox(centerX - radius, centerY - radius, 2 * radius, 2 * radius);

        return {
            series: bbox,
            axis: bbox,
        };
    }

    private getTargets(): Target[] {
        const { properties } = this;
        const defaultTarget = properties.defaultTarget;
        return Array.from(properties.targets).map((target): Target => {
            const {
                text = defaultTarget.text,
                value = defaultTarget.value ?? 0,
                shape = defaultTarget.shape ?? 'triangle',
                rotation = defaultTarget.rotation ?? 0,
                placement = defaultTarget.placement ?? 'middle',
                spacing = defaultTarget.spacing ?? 0,
                size = defaultTarget.size ?? 0,
            } = target;
            const {
                enabled: labelEnabled = defaultTarget.label.enabled,
                color: labelColor = defaultTarget.label.color ?? 'black',
                fontStyle: labelFontStyle = defaultTarget.label.fontStyle ?? 'normal',
                fontWeight: labelFontWeight = defaultTarget.label.fontWeight ?? 'normal',
                fontSize: labelFontSize = defaultTarget.label.fontSize,
                fontFamily: labelFontFamily = defaultTarget.label.fontFamily,
                spacing: labelSpacing = defaultTarget.label.spacing ?? 0,
            } = target.label;

            return {
                text,
                value,
                shape,
                placement,
                spacing,
                size,
                rotation,
                label: {
                    enabled: labelEnabled,
                    color: labelColor,
                    fontStyle: labelFontStyle,
                    fontWeight: labelFontWeight,
                    fontSize: labelFontSize,
                    fontFamily: labelFontFamily,
                    spacing: labelSpacing,
                },
                style: target.getStyle(),
            };
        });
    }

    private getTargetRadius(target: Target) {
        const { radius, properties } = this;
        const { innerRadiusRatio, outerRadiusRatio } = properties;
        const { placement, spacing, size } = target;

        const outerRadius = radius * outerRadiusRatio;
        const innerRadius = radius * innerRadiusRatio;

        switch (placement) {
            case 'inside':
                return Math.max(innerRadius - spacing - size / 2, 0);
            case 'outside':
                return outerRadius + spacing + size / 2;
            default:
                return (innerRadius + outerRadius) / 2;
        }
    }

    private getTargetLabel(target: Target): RadialGaugeTargetDatumLabel {
        const { scale } = this;

        const { value, size, placement, label } = target;
        const { spacing, color: fill, fontStyle, fontWeight, fontSize, fontFamily } = label;
        const lineHeight = undefined;
        const angle = scale.convert(value);

        const quadrant = Math.trunc(normalizeAngle360(angle) / (Math.PI / 2));

        const offset = size / 2 + spacing;

        let textAlign: CanvasTextAlign;
        let textBaseline: CanvasTextBaseline;
        let offsetX: number;
        let offsetY: number;
        switch (placement) {
            case 'outside':
                ({ textAlign, textBaseline } = outsideLabelPlacements[quadrant]);
                offsetX = offset * Math.cos(angle);
                offsetY = offset * Math.sin(angle);
                break;
            case 'inside':
                ({ textAlign, textBaseline } = insideLabelPlacements[quadrant]);
                offsetX = -offset * Math.cos(angle);
                offsetY = -offset * Math.sin(angle);
                break;
            default:
                textAlign = 'center';
                textBaseline = 'bottom';
                offsetX = 0;
                offsetY = -offset;
                break;
        }

        return {
            offsetX,
            offsetY,
            fill,
            textAlign,
            textBaseline,
            fontStyle,
            fontWeight,
            fontSize,
            fontFamily,
            lineHeight,
        };
    }

    override createNodeData() {
        const tickData = this.layoutScale();
        const { id: seriesId, scale, properties, radius, centerX, centerY } = this;

        const {
            value,
            innerRadiusRatio,
            outerRadiusRatio,
            segmentation,
            cornerRadius,
            cornerMode,
            needle,
            bar,
            scale: scaleProps,
            label,
            secondaryLabel,
        } = properties;
        const {
            outerRadius = radius * outerRadiusRatio,
            innerRadius = radius * innerRadiusRatio,
            defaultColorRange,
        } = properties;
        const targets = this.getTargets();

        const nodeData: RadialGaugeNodeDatum[] = [];
        const targetData: RadialGaugeTargetDatum[] = [];
        const needleData: RadialGaugeNeedleDatum[] = [];
        const labelData: RadialGaugeLabelDatum[] = [];
        const scaleData: RadialGaugeNodeDatum[] = [];

        const cornersOnAllItems = cornerMode === 'item';

        const containerStartAngle = scale.convert(scale.domain[0]);
        const containerEndAngle = scale.convert(value);

        const maxTicks = Math.ceil(normalizeAngle360Inclusive(containerEndAngle - containerStartAngle) * radius);
        let segments = segmentation.enabled ? segmentation.interval.getSegments(scale, maxTicks) : undefined;

        const barStyle = bar.getStyle(defaultColorRange, scale);
        const scaleStyle = scaleProps.getStyle(bar.enabled, defaultColorRange, scale);

        if (segments == null && cornersOnAllItems) {
            const segmentStart = Math.min(...scale.domain);
            const segmentEnd = Math.max(...scale.domain);
            const datum = { value, segmentStart, segmentEnd };
            const appliedCornerRadius = Math.min(cornerRadius, (outerRadius - innerRadius) / 2);
            const angleInset = appliedCornerRadius / ((innerRadius + outerRadius) / 2);

            nodeData.push({
                series: this,
                itemId: `value`,
                datum,
                datumIndex: { type: NodeDataType.Node },
                type: NodeDataType.Node,
                centerX,
                centerY,
                outerRadius,
                innerRadius,
                startAngle: containerStartAngle - angleInset,
                endAngle: containerEndAngle + angleInset,
                clipStartAngle: undefined,
                clipEndAngle: undefined,
                startCornerRadius: cornerRadius,
                endCornerRadius: cornerRadius,
                style: barStyle,
            });

            scaleData.push({
                series: this,
                itemId: `scale`,
                datum,
                datumIndex: { type: NodeDataType.Node },
                type: NodeDataType.Node,
                centerX,
                centerY,
                outerRadius,
                innerRadius,
                startAngle: scale.range[0] - angleInset,
                endAngle: scale.range[1] + angleInset,
                clipStartAngle: undefined,
                clipEndAngle: undefined,
                startCornerRadius: cornerRadius,
                endCornerRadius: cornerRadius,
                style: scaleStyle,
            });
        } else {
            segments ??= scale.domain;

            for (let i = 0; i < segments.length - 1; i++) {
                const segmentStart = segments[i];
                const segmentEnd = segments[i + 1];
                const datum = { value, segmentStart, segmentEnd };

                const isStart = i === 0;
                const isEnd = i === segments.length - 2;

                const itemStartAngle = scale.convert(segmentStart);
                const itemEndAngle = scale.convert(segmentEnd);

                nodeData.push({
                    series: this,
                    itemId: `value-${i}`,
                    datum,
                    datumIndex: { type: NodeDataType.Node },
                    type: NodeDataType.Node,
                    centerX,
                    centerY,
                    outerRadius,
                    innerRadius,
                    startAngle: itemStartAngle,
                    endAngle: itemEndAngle,
                    clipStartAngle: containerStartAngle,
                    clipEndAngle: containerEndAngle,
                    startCornerRadius: cornersOnAllItems || isStart ? cornerRadius : 0,
                    endCornerRadius: cornersOnAllItems || isEnd ? cornerRadius : 0,
                    style: barStyle,
                });

                scaleData.push({
                    series: this,
                    itemId: `scale-${i}`,
                    datum,
                    datumIndex: { type: NodeDataType.Node },
                    type: NodeDataType.Node,
                    centerX,
                    centerY,
                    outerRadius,
                    innerRadius,
                    startAngle: itemStartAngle,
                    endAngle: itemEndAngle,
                    clipStartAngle: undefined,
                    clipEndAngle: undefined,
                    startCornerRadius: cornersOnAllItems || isStart ? cornerRadius : 0,
                    endCornerRadius: cornersOnAllItems || isEnd ? cornerRadius : 0,
                    style: scaleStyle,
                });
            }
        }

        if (!needle.enabled && label.enabled) {
            const {
                text,
                color: fill,
                fontSize,
                minimumFontSize,
                fontStyle,
                fontWeight,
                fontFamily,
                lineHeight,
                formatter = (params) => this.formatLabel(params.value),
            } = label;
            labelData.push({
                label: LabelType.Primary,
                centerX,
                centerY,
                text,
                value,
                fill,
                fontSize,
                minimumFontSize,
                fontStyle,
                fontWeight,
                fontFamily,
                lineHeight,
                formatter,
            });
        }

        if (!needle.enabled && secondaryLabel.enabled) {
            const {
                text,
                color: fill,
                fontSize,
                minimumFontSize,
                fontStyle,
                fontWeight,
                fontFamily,
                lineHeight,
                formatter,
            } = secondaryLabel;
            labelData.push({
                label: LabelType.Secondary,
                centerX,
                centerY,
                text,
                value,
                fill,
                fontSize,
                minimumFontSize,
                fontStyle,
                fontWeight,
                fontFamily,
                lineHeight,
                formatter,
            });
        }

        if (needle.enabled) {
            let needleRadius = needle.radiusRatio == null ? innerRadius : radius * needle.radiusRatio;
            needleRadius = Math.max(needleRadius - needle.spacing, 0);
            const needleAngle = scale.convert(value);

            needleData.push({
                centerX,
                centerY,
                radius: needleRadius,
                angle: needleAngle,
                series: this,
            });
        }

        for (let i = 0; i < targets.length; i += 1) {
            const target = targets[i];
            const { value: targetValue, text, size, shape, style } = target;

            if (targetValue < Math.min(...scale.domain) || targetValue > Math.max(...scale.domain)) {
                continue;
            }

            const targetRadius = this.getTargetRadius(target);
            const targetAngle = scale.convert(targetValue);
            const targetRotation = toRadians(target.rotation + targetPlacementRotation[target.placement]);

            targetData.push({
                series: this,
                itemId: `target-${i}`,
                midPoint: {
                    x: targetRadius * Math.cos(targetAngle) + centerX,
                    y: targetRadius * Math.sin(targetAngle) + centerY,
                },
                datum: { value: targetValue },
                datumIndex: { type: NodeDataType.Target, index: i },
                type: NodeDataType.Target,
                value: targetValue,
                text,
                centerX,
                centerY,
                shape,
                radius: targetRadius,
                angle: targetAngle,
                rotation: targetRotation,
                size,
                label: this.getTargetLabel(target),
                style,
            });
        }

        return {
            itemId: seriesId,
            nodeData,
            needleData,
            targetData,
            labelData,
            scaleData,
            tickData,
        };
    }

    updateSelections(resize: boolean) {
        if (this.nodeDataRefresh || resize) {
            this.contextNodeData = this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    private highlightDatum(node: _ModuleSupport.HighlightNodeDatum | undefined): RadialGaugeTargetDatum | undefined {
        if (node != null && node.series === this && (node as RadialGaugeTargetDatum).type === NodeDataType.Target) {
            return node as RadialGaugeTargetDatum;
        }
    }

    override update({ seriesRect }: { seriesRect?: _ModuleSupport.BBox }) {
        const {
            datumSelection,
            labelSelection,
            needleSelection,
            targetSelection,
            targetLabelSelection,
            scaleSelection,
            highlightTargetSelection,
            tickSelection,
        } = this;

        const resize = this.checkResize(seriesRect);
        this.updateSelections(resize);

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity = this.getOpacity();

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];
        const needleData = this.contextNodeData?.needleData ?? [];
        const targetData = this.contextNodeData?.targetData ?? [];
        const scaleData = this.contextNodeData?.scaleData ?? [];
        const tickData = this.contextNodeData?.tickData ?? [];

        const highlightTargetDatum = this.highlightDatum(this.ctx.highlightManager.getActiveHighlight());

        this.scaleSelection = this.updateScaleSelection({ scaleData, scaleSelection });
        this.updateScaleNodes({ scaleSelection });

        this.needleSelection = this.updateNeedleSelection({ needleData, needleSelection });
        this.updateNeedleNodes({ needleSelection });

        this.targetSelection = this.updateTargetSelection({ targetData, targetSelection });
        this.updateTargetStyles({ targetSelection, isHighlight: false });
        this.updateTargetNodes({ targetSelection });

        this.targetLabelSelection = this.updateTargetLabelSelection({ targetData, targetLabelSelection });
        this.updateTargetLabelNodes({ targetLabelSelection });

        this.datumSelection = this.updateDatumSelection({ nodeData, datumSelection });
        this.updateDatumNodes({ datumSelection });

        this.labelSelection = this.updateLabelSelection({ labelData, labelSelection });
        this.updateLabelNodes({ labelSelection });

        this.highlightTargetSelection = this.updateTargetSelection({
            targetData: highlightTargetDatum == null ? [] : [highlightTargetDatum],
            targetSelection: highlightTargetSelection,
        });
        this.updateTargetStyles({ targetSelection: highlightTargetSelection, isHighlight: true });
        this.updateTargetNodes({ targetSelection: highlightTargetSelection });

        this.tickSelection = this.updateTickSelection({ tickData, tickSelection });
        this.updateTickNodes({ tickSelection });

        if (resize) {
            this.animationState.transition('resize');
        }
        this.animationState.transition('update');
    }

    private updateDatumSelection(opts: {
        nodeData: RadialGaugeNodeDatum[];
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Sector, RadialGaugeNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => {
            return createDatumId(opts.nodeData.length, datum.itemId);
        });
    }

    private updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Sector, RadialGaugeNodeDatum>;
    }) {
        const { datumSelection } = opts;
        const { ctx, properties } = this;
        const { segmentation } = properties;
        const sectorSpacing = segmentation.spacing ?? 0;
        const animationDisabled = ctx.animationManager.isSkipped();

        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((sector, datum) => {
            const { centerX, centerY, innerRadius, outerRadius, startCornerRadius, endCornerRadius } = datum;
            sector.centerX = centerX;
            sector.centerY = centerY;
            sector.innerRadius = innerRadius;
            sector.outerRadius = outerRadius;
            sector.pointerEvents = this.properties.bar.enabled
                ? _ModuleSupport.PointerEvents.All
                : _ModuleSupport.PointerEvents.None;

            applyShapeStyle(sector, datum.style, fillBBox);

            sector.startOuterCornerRadius = startCornerRadius;
            sector.startInnerCornerRadius = startCornerRadius;
            sector.endOuterCornerRadius = endCornerRadius;
            sector.endInnerCornerRadius = endCornerRadius;

            sector.radialEdgeInset = (sectorSpacing + sector.strokeWidth) / 2;
            sector.concentricEdgeInset = sector.strokeWidth / 2;

            if (animationDisabled || sector.previousDatum == null) {
                sector.setProperties(resetRadialGaugeSeriesResetSectorFunction(sector, datum));
            }
        });

        this.datumUnion.update(datumSelection, this.itemGroup, _ModuleSupport.Sector, (node, first, last) => {
            node.clipSector ??= new SectorBox(Number.NaN, Number.NaN, Number.NaN, Number.NaN);
            node.centerX = first.centerX;
            node.centerY = first.centerY;
            node.outerRadius = node.clipSector.outerRadius = first.outerRadius;
            node.innerRadius = node.clipSector.innerRadius = first.innerRadius;
            node.startAngle = node.clipSector.startAngle = first.startAngle;
            node.startInnerCornerRadius = first.startInnerCornerRadius;
            node.startOuterCornerRadius = first.startOuterCornerRadius;
            node.endAngle = last.endAngle;
            node.clipSector.endAngle = last.clipSector?.endAngle ?? last.endAngle;
            node.endInnerCornerRadius = last.endInnerCornerRadius;
            node.endOuterCornerRadius = last.endOuterCornerRadius;
            node.pointerEvents = _ModuleSupport.PointerEvents.None;
        });
    }

    private updateScaleSelection(opts: {
        scaleData: RadialGaugeNodeDatum[];
        scaleSelection: _ModuleSupport.Selection<_ModuleSupport.Sector, RadialGaugeNodeDatum>;
    }) {
        return opts.scaleSelection.update(opts.scaleData, undefined, (datum) => {
            return createDatumId(opts.scaleData.length, datum.itemId);
        });
    }

    private updateScaleNodes(opts: {
        scaleSelection: _ModuleSupport.Selection<_ModuleSupport.Sector, RadialGaugeNodeDatum>;
    }) {
        const { scaleSelection } = opts;
        const { segmentation } = this.properties;
        const sectorSpacing = segmentation.spacing ?? 0;

        const fillBBox = this.getShapeFillBBox();

        scaleSelection.each((sector, datum) => {
            const { centerX, centerY, innerRadius, outerRadius, startCornerRadius, endCornerRadius } = datum;
            sector.centerX = centerX;
            sector.centerY = centerY;
            sector.innerRadius = innerRadius;
            sector.outerRadius = outerRadius;

            applyShapeStyle(sector, datum.style, fillBBox);

            sector.startOuterCornerRadius = startCornerRadius;
            sector.startInnerCornerRadius = startCornerRadius;
            sector.endOuterCornerRadius = endCornerRadius;
            sector.endInnerCornerRadius = endCornerRadius;

            sector.radialEdgeInset = (sectorSpacing + sector.strokeWidth) / 2;
            sector.concentricEdgeInset = sector.strokeWidth / 2;

            sector.setProperties(resetRadialGaugeSeriesResetSectorFunction(sector, datum));
        });
    }

    private updateNeedleSelection(opts: {
        needleData: RadialGaugeNeedleDatum[];
        needleSelection: _ModuleSupport.Selection<RadialGaugeNeedle, RadialGaugeNeedleDatum>;
    }) {
        return opts.needleSelection.update(opts.needleData, undefined, () => createDatumId(0));
    }

    private updateNeedleNodes(opts: {
        needleSelection: _ModuleSupport.Selection<RadialGaugeNeedle, RadialGaugeNeedleDatum>;
    }) {
        const { needleSelection } = opts;
        const { fill, fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
            this.properties.needle;
        const animationDisabled = this.ctx.animationManager.isSkipped();

        needleSelection.each((needle, datum) => {
            const { centerX, centerY, radius } = datum;

            const scale = radius * 2;

            needle.d = RadialGaugeNeedle.defaultPathData;

            applyShapeStyle(needle, {
                fill,
                fillOpacity,
                stroke,
                strokeOpacity,
                strokeWidth: strokeWidth / scale,
                lineDash: lineDash.map((d) => d / scale),
                lineDashOffset: lineDashOffset / scale,
            });

            needle.translationX = centerX;
            needle.translationY = centerY;
            needle.scalingX = scale;
            needle.scalingY = scale;

            if (animationDisabled) {
                needle.setProperties(resetRadialGaugeSeriesResetNeedleFunction(needle, datum));
            }
        });
    }

    private updateTargetSelection(opts: {
        targetData: RadialGaugeTargetDatum[];
        targetSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, RadialGaugeTargetDatum>;
    }) {
        return opts.targetSelection.update(opts.targetData, undefined, (target) => target.itemId);
    }

    private updateTargetStyles({
        targetSelection,
        isHighlight,
    }: {
        targetSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, RadialGaugeTargetDatum>;
        isHighlight: boolean;
    }) {
        targetSelection.each((_, datum) => {
            datum.style = this.getTargetStyle(isHighlight, datum);
        });
    }

    private updateTargetNodes({
        targetSelection,
    }: {
        targetSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, RadialGaugeTargetDatum>;
    }) {
        targetSelection.each((target, datum) => {
            const { centerX, centerY, angle, radius, shape, size, rotation } = datum;

            applyShapeStyle(target, datum.style);

            target.size = size;
            target.shape = shape === 'line' ? lineMarker : shape;
            target.translationX = centerX + radius * Math.cos(angle);
            target.translationY = centerY + radius * Math.sin(angle);
            target.rotation = angle + rotation;
        });
    }

    private getTargetStyle(isHighlight: boolean, { datumIndex, style }: RadialGaugeTargetDatum) {
        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);

        return mergeDefaults(highlightStyle, {
            ...style,
            opacity: 1,
        });
    }

    private updateTargetLabelSelection(opts: {
        targetData: RadialGaugeTargetDatum[];
        targetLabelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, RadialGaugeTargetDatum>;
    }) {
        return opts.targetLabelSelection.update(opts.targetData, undefined, (target) => target.itemId);
    }

    private updateTargetLabelNodes(opts: {
        targetLabelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, RadialGaugeTargetDatum>;
    }) {
        const { targetLabelSelection } = opts;

        targetLabelSelection.each((label, target) => {
            const { centerX, centerY, radius, angle, text } = target;
            const { offsetX, offsetY, fill, fontStyle, fontWeight, fontSize, fontFamily, textAlign, textBaseline } =
                target.label;

            if (text == null) {
                label.visible = false;
                return;
            }

            label.visible = true;
            label.x = centerX + radius * Math.cos(angle) + offsetX;
            label.y = centerY + radius * Math.sin(angle) + offsetY;
            label.text = text;
            label.fill = fill;
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;
            label.fontSize = fontSize;
            label.fontFamily = fontFamily;
            label.textAlign = textAlign;
            label.textBaseline = textBaseline;
        });
    }

    private updateLabelSelection(opts: {
        labelData: RadialGaugeLabelDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, RadialGaugeLabelDatum>;
    }) {
        return opts.labelSelection.update(opts.labelData, undefined, (datum) => datum.label);
    }

    private updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, RadialGaugeLabelDatum>;
    }) {
        const { labelSelection } = opts;
        const animationDisabled = this.ctx.animationManager.isSkipped();

        labelSelection.each((label, datum) => {
            label.fill = datum.fill;
            label.fontStyle = datum.fontStyle;
            label.fontWeight = datum.fontWeight;
            label.fontFamily = datum.fontFamily;
        });

        if (animationDisabled || this.labelsHaveExplicitText()) {
            this.formatLabelText();
        }
    }

    private updateTickSelection(opts: {
        tickData: RadialGaugeTickDatum[];
        tickSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, RadialGaugeTickDatum>;
    }) {
        return opts.tickSelection.update(opts.tickData, undefined, (datum) => datum.index);
    }

    private updateTickNodes(opts: {
        tickSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, RadialGaugeTickDatum>;
    }) {
        const { scale, radius, centerX, centerY, properties } = this;
        const { enabled, color, fontFamily, fontSize, fontStyle, fontWeight, spacing } = properties.scale.label;
        const rotation = toRadians(properties.scale.label.rotation ?? 0);

        opts.tickSelection.each((label, datum) => {
            if (!enabled) {
                label.visible = false;
                return;
            }

            label.visible = true;
            label.text = datum.text;
            label.fill = color;
            label.fontFamily = fontFamily;
            label.fontSize = fontSize;
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;

            label.textAlign = 'center';
            label.textBaseline = 'middle';

            const angle = scale.convert(datum.value);

            const { width, height } = datum;

            const originX = Math.abs(radius * Math.cos(angle));
            const originY = Math.abs(radius * Math.sin(angle));
            const x0 = Math.min(Math.max(Math.abs(radius / Math.tan(angle)), originX - width / 2), originX + width / 2);
            const y0 = Math.min(
                Math.max(Math.abs(radius * Math.tan(angle)), originY - height / 2),
                originY + height / 2
            );
            const outerR = Math.hypot(x0, y0);

            const x = centerX + (outerR + spacing) * Math.cos(angle);
            const y = centerY + (outerR + spacing) * Math.sin(angle);

            label.x = x;
            label.y = y;
            label.rotationCenterX = x;
            label.rotationCenterY = y;
            label.rotation = rotation;
        });
    }

    labelsHaveExplicitText() {
        for (const { datum } of this.labelSelection) {
            if (datum.text == null) {
                return false;
            }
        }

        return true;
    }

    formatLabelText(datum?: { label: number | undefined; secondaryLabel: number | undefined }) {
        const { labelSelection, radius, textAlign, verticalAlign } = this;
        const { spacing: padding, innerRadiusRatio } = this.properties;

        formatRadialGaugeLabels(
            this,
            this.ctx,
            labelSelection,
            { padding, textAlign, verticalAlign },
            radius * innerRadiusRatio,
            datum
        );
    }

    protected resetAllAnimation() {
        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        resetMotion([this.datumSelection], resetRadialGaugeSeriesResetSectorFunction);
        resetMotion([this.needleSelection], resetRadialGaugeSeriesResetNeedleFunction);
        this.formatLabelText();
    }

    resetAnimation(phase: _ModuleSupport.ChartAnimationPhase) {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        } else if (phase === 'ready') {
            this.animationState.transition('skip');
        }
    }

    private animateLabelText(params: { from?: number; phase?: _ModuleSupport.AnimationPhase } = {}) {
        const { animationManager } = this.ctx;

        let labelFrom: number | undefined;
        let labelTo: number | undefined;
        let secondaryLabelFrom: number | undefined;
        let secondaryLabelTo: number | undefined;
        this.labelSelection.each((label, datum) => {
            // Reset animation
            label.opacity = 1;

            if (datum.label === LabelType.Primary) {
                labelFrom = label.previousDatum?.value ?? params.from ?? datum.value;
                labelTo = datum.value;
            } else if (datum.label === LabelType.Secondary) {
                secondaryLabelFrom = label.previousDatum?.value ?? params.from ?? datum.value;
                secondaryLabelTo = datum.value;
            }
        });

        if (this.labelsHaveExplicitText()) {
            // Ignore
        } else if (labelTo == null || secondaryLabelTo == null) {
            this.formatLabelText();
        } else if (labelFrom === labelTo && secondaryLabelFrom === secondaryLabelTo) {
            this.formatLabelText({ label: labelTo, secondaryLabel: secondaryLabelTo });
        } else {
            const animationId = `${this.id}_labels`;

            animationManager.animate({
                id: animationId,
                groupId: 'label',
                from: { label: labelFrom, secondaryLabel: secondaryLabelFrom },
                to: { label: labelTo, secondaryLabel: secondaryLabelTo },
                phase: params.phase ?? 'update',
                onUpdate: (datum) => this.formatLabelText(datum),
                onStop: () => this.formatLabelText({ label: labelTo, secondaryLabel: secondaryLabelTo }),
            });
        }
    }

    animateEmptyUpdateReady() {
        const { animationManager } = this.ctx;

        const { node, needle } = prepareRadialGaugeSeriesAnimationFunctions(true, this.scale.range[0]);
        fromToMotion(this.id, 'node', animationManager, [this.datumSelection], node, (_sector, datum) => datum.itemId);
        fromToMotion(this.id, 'needle', animationManager, [this.needleSelection], needle, () => 'needle');

        fromToMotion(
            this.id,
            'label',
            animationManager,
            [this.labelSelection],
            fadeInFns,
            (_label, datum) => datum.label
        );

        this.animateLabelText({
            from: this.properties.scale.min,
            phase: 'initial',
        });
    }

    animateWaitingUpdateReady() {
        const { animationManager } = this.ctx;

        const { node, needle } = prepareRadialGaugeSeriesAnimationFunctions(false, this.scale.range[0]);
        fromToMotion(this.id, 'node', animationManager, [this.datumSelection], node, (_sector, datum) => datum.itemId);
        fromToMotion(this.id, 'needle', animationManager, [this.needleSelection], needle, () => 'needle');

        this.animateLabelText();
    }

    protected animateReadyResize() {
        this.resetAllAnimation();
    }

    override dataCount(): number {
        return Number.NaN; // Not used
    }

    override getSeriesDomain() {
        return [Number.NaN, Number.NaN];
    }

    override getSeriesRange(
        _direction: _ModuleSupport.ChartAxisDirection,
        _visibleRange: [any, any]
    ): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    override getLegendData(): _ModuleSupport.ChartLegendDatum<any>[] {
        return [];
    }

    override getTooltipContent(datumIndex: RadialGaugeNodeDatumIndex): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, properties } = this;
        const { tooltip } = properties;

        let value: number | undefined;
        let text: string | undefined;
        let fallbackLabel: string;
        if (datumIndex.type === NodeDataType.Node) {
            value = properties.value;
            text = properties.label.text;
            fallbackLabel = this.ctx.localeManager.t('ariaLabelGaugeValue');
        } else {
            ({ value, text } = properties.targets[datumIndex.index]);
            fallbackLabel = this.ctx.localeManager.t('ariaLabelGaugeTarget');
        }

        if (value == null) return;

        return this.formatTooltipWithContext(
            tooltip,
            {
                data: [{ label: text, fallbackLabel, value: this.formatLabel(value) }],
            },
            { seriesId, title: undefined, datum: undefined, value }
        );
    }

    override pickNodeClosestDatum(point: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        return pickGaugeNearestDatum(this, point);
    }

    override pickFocus(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.PickFocusOutputs | undefined {
        return pickGaugeFocus(this, opts);
    }

    getCaptionText(): string {
        const { value } = this.properties;

        const description: string[] = [];

        description.push(this.formatLabel(value));

        this.labelSelection.each((_label, datum) => {
            const text = getLabelText(this.id, this.ctx, datum);
            if (text != null) {
                description.push(toPlainText(text));
            }
        });

        return description.join('. ');
    }

    getCategoryValue(_datumIndex: RadialGaugeNodeDatumIndex) {
        return;
    }

    datumIndexForCategoryValue(_categoryValue: any): RadialGaugeNodeDatumIndex | undefined {
        return;
    }

    protected override hasItemStylers(): boolean {
        return this.properties.label.itemStyler != null;
    }
}
