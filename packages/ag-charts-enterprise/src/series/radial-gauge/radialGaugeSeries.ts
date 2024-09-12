import {
    type AgGaugeFillMode,
    type AgRadialGaugeMarkerShape,
    type AgRadialGaugeTargetPlacement,
    type FontStyle,
    type FontWeight,
    type TextAlign,
    type VerticalAlign,
    _ModuleSupport,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { formatLabel } from '../gauge-util/label';
import { LineMarker } from '../gauge-util/lineMarker';
import { type GaugeStopProperties, getColorStops } from '../gauge-util/stops';
import { RadialGaugeNeedle } from './radialGaugeNeedle';
import {
    LabelType,
    NodeDataType,
    type RadialGaugeLabelDatum,
    type RadialGaugeNodeDatum,
    RadialGaugeSeriesProperties,
    type RadialGaugeTargetDatum,
    type RadialGaugeTargetDatumLabel,
} from './radialGaugeSeriesProperties';
import {
    fadeInFns,
    formatRadialGaugeLabels,
    getLabelText,
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
    ChartAxisDirection,
    EMPTY_TOOLTIP_CONTENT,
} = _ModuleSupport;
const { BBox, Group, PointerEvents, Selection, Sector, Text, ConicGradient, getMarker } = _Scene;
const { normalizeAngle360, normalizeAngle360Inclusive, toDegrees, toRadians } = _Util;

interface TargetLabel {
    enabled: boolean;
    color: string;
    fontStyle: FontStyle;
    fontWeight: FontWeight;
    fontSize: number;
    fontFamily: string;
    spacing: number;
    // formatter: Formatter<AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>>;
}

interface Target {
    text: string | undefined;
    value: number;
    shape: AgRadialGaugeMarkerShape;
    placement: AgRadialGaugeTargetPlacement;
    spacing: number;
    size: number;
    rotation: number;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    label: TargetLabel;
}

export type GaugeAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
export type GaugeAnimationEvent =
    | 'update'
    | 'updateData'
    | 'highlight'
    | 'highlightMarkers'
    | 'resize'
    | 'clear'
    | 'reset'
    | 'skip';
export type GaugeAnimationData = { duration?: number };

interface RadialGaugeNeedleDatum {
    centerX: number;
    centerY: number;
    radius: number;
    angle: number;
}
interface RadialGaugeNodeDataContext
    extends _ModuleSupport.SeriesNodeDataContext<RadialGaugeNodeDatum, RadialGaugeLabelDatum> {
    needleData: RadialGaugeNeedleDatum[];
    targetData: RadialGaugeTargetDatum[];
    scaleData: RadialGaugeNodeDatum[];
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
        RadialGaugeNodeDatum,
        RadialGaugeSeriesProperties,
        RadialGaugeLabelDatum,
        RadialGaugeNodeDataContext
    >
    implements _ModuleSupport.RadialGaugeSeries
{
    static readonly className = 'RadialGaugeSeries';
    static readonly type = 'radial-gauge' as const;

    override canHaveAxes: boolean = true;

    override properties = new RadialGaugeSeriesProperties();

    public centerX: number = 0;
    public centerY: number = 0;
    public radius: number = 0;
    public textAlign: TextAlign = 'center';
    public verticalAlign: VerticalAlign = 'middle';

    public get maximumRadius() {
        return this.properties.outerRadius;
    }
    public get minimumRadius() {
        return this.properties.outerRadius;
    }

    private readonly scaleGroup = this.contentGroup.appendChild(new Group({ name: 'scaleGroup' }));
    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));
    private readonly itemNeedleGroup = this.contentGroup.appendChild(new Group({ name: 'itemNeedleGroup' }));
    private readonly itemTargetGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetGroup' }));
    private readonly itemTargetLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetLabelGroup' }));
    private readonly itemLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemLabelGroup' }));
    private readonly highlightTargetGroup = this.highlightGroup.appendChild(
        new Group({ name: 'itemTargetLabelGroup' })
    );

    private scaleSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum> = Selection.select(
        this.scaleGroup,
        () => this.nodeFactory()
    );
    private datumSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum> = Selection.select(
        this.itemGroup,
        () => this.nodeFactory()
    );
    private needleSelection: _Scene.Selection<RadialGaugeNeedle, RadialGaugeNeedleDatum> = Selection.select(
        this.itemNeedleGroup,
        RadialGaugeNeedle
    );
    private targetSelection: _Scene.Selection<_Scene.Marker, RadialGaugeTargetDatum> = Selection.select(
        this.itemTargetGroup,
        (datum) => this.markerFactory(datum)
    );
    private targetLabelSelection: _Scene.Selection<_Scene.Text, RadialGaugeTargetDatum> = Selection.select(
        this.itemTargetLabelGroup,
        Text
    );
    private labelSelection: _Scene.Selection<_Scene.Text, RadialGaugeLabelDatum> = Selection.select(
        this.itemLabelGroup,
        Text
    );
    private highlightTargetSelection: _Scene.Selection<_Scene.Marker, RadialGaugeTargetDatum> = Selection.select(
        this.highlightTargetGroup,
        (datum) => this.markerFactory(datum)
    );

    private readonly animationState: _ModuleSupport.StateMachine<GaugeAnimationState, GaugeAnimationEvent>;

    public contextNodeData?: RadialGaugeNodeDataContext;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            contentGroupVirtual: false,
            useLabelLayer: true,
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
                // highlight: (data) => this.animateReadyHighlight(data),
                // highlightMarkers: (data) => this.animateReadyHighlightMarkers(data),
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
                    // action: (data) => this.animateClearingUpdateEmpty(data),
                },
                reset: 'empty',
                skip: 'ready',
            },
        });

        this.itemGroup.pointerEvents = PointerEvents.None;
        this.itemTargetLabelGroup.pointerEvents = PointerEvents.None;
        this.itemLabelGroup.pointerEvents = PointerEvents.None;
    }

    override get hasData(): boolean {
        return this.properties.value != null;
    }

    private nodeFactory(): _Scene.Sector {
        return new Sector();
    }

    private markerFactory({ shape }: RadialGaugeTargetDatum): _Scene.Marker {
        const MarkerShape = shape !== 'line' ? getMarker(shape) : LineMarker;
        const marker = new MarkerShape();
        marker.size = 1;
        return marker;
    }

    override async processData(): Promise<void> {
        this.nodeDataRefresh = true;

        this.animationState.transition('updateData');
    }

    private formatLabel(value: number) {
        return formatLabel(value, this.axes[ChartAxisDirection.X]);
    }

    private createConicGradient(fills: GaugeStopProperties[], fillMode: AgGaugeFillMode) {
        const { centerX, centerY, radius } = this;
        const { domain, range } = this.axes[ChartAxisDirection.X]!.scale;
        const [startAngle, endAngle] = range;
        const { defaultColorRange } = this.properties;

        const conicAngle = normalizeAngle360((startAngle + endAngle) / 2 + Math.PI);
        const sweepAngle = normalizeAngle360Inclusive(endAngle - startAngle);

        const stops = getColorStops(fills, defaultColorRange, domain, fillMode).map(
            ({ color, offset }): _Scene.GradientColorStop => {
                offset = Math.min(Math.max(offset, 0), 1);
                const angle = startAngle + sweepAngle * offset;
                offset = (angle - conicAngle) / (2 * Math.PI);
                offset = ((offset % 1) + 1) % 1;
                return { offset, color };
            }
        );

        return new ConicGradient(
            'oklch',
            stops,
            toDegrees(conicAngle) - 90,
            new BBox(centerX - radius, centerY - radius, 2 * radius, 2 * radius)
        );
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
                strokeWidth = defaultTarget.strokeWidth ?? 0,
                placement = defaultTarget.placement ?? 'middle',
                spacing = defaultTarget.spacing ?? 0,
                size = defaultTarget.size ?? 0,
                fill = defaultTarget.fill ?? 'black',
                fillOpacity = defaultTarget.fillOpacity ?? 1,
                stroke = defaultTarget.stroke ?? 'black',
                strokeOpacity = defaultTarget.strokeOpacity ?? 1,
                lineDash = defaultTarget.lineDash ?? [0],
                lineDashOffset = defaultTarget.lineDashOffset ?? 0,
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
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                label: {
                    enabled: labelEnabled,
                    color: labelColor,
                    fontStyle: labelFontStyle,
                    fontWeight: labelFontWeight,
                    fontSize: labelFontSize,
                    fontFamily: labelFontFamily,
                    spacing: labelSpacing,
                },
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
        const angleAxis = this.axes[ChartAxisDirection.X]!;
        const angleScale = angleAxis.scale;

        const { value, size, placement, label } = target;
        const { spacing, color: fill, fontStyle, fontWeight, fontSize, fontFamily } = label;
        const lineHeight = undefined;
        const angle = angleScale.convert(value);

        const quadrant = (normalizeAngle360(angle) / (Math.PI / 2)) | 0;

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

    override async createNodeData() {
        const { id: seriesId, properties, radius, centerX, centerY } = this;

        if (!properties.isValid()) return;

        const angleAxis = this.axes[ChartAxisDirection.X];
        if (angleAxis == null) return;

        const {
            value,
            innerRadiusRatio,
            outerRadiusRatio,
            segmentation,
            cornerRadius,
            cornerMode,
            needle,
            bar,
            scale,
            label,
            secondaryLabel,
        } = properties;
        const { outerRadius = radius * outerRadiusRatio, innerRadius = radius * innerRadiusRatio } = properties;
        const targets = this.getTargets();

        const { domain } = angleAxis.scale;
        const nodeData: RadialGaugeNodeDatum[] = [];
        const targetData: RadialGaugeTargetDatum[] = [];
        const needleData: RadialGaugeNeedleDatum[] = [];
        const labelData: RadialGaugeLabelDatum[] = [];
        const scaleData: RadialGaugeNodeDatum[] = [];

        const [startAngle, endAngle] = angleAxis.range;
        const angleScale = angleAxis.scale;

        const cornersOnAllItems = cornerMode === 'item';

        const containerStartAngle = angleScale.convert(domain[0]);
        const containerEndAngle = angleScale.convert(value);

        const maxTicks = Math.ceil(normalizeAngle360Inclusive(containerEndAngle - containerStartAngle) * radius);
        let segments = segmentation.enabled ? segmentation.interval.getSegments(angleAxis.scale, maxTicks) : undefined;

        const barFill = bar.fill ?? this.createConicGradient(bar.fills, bar.fillMode);
        const scaleFill =
            scale.fill ??
            (bar.enabled && scale.fills.length === 0 ? scale.defaultFill : undefined) ??
            this.createConicGradient(scale.fills, scale.fillMode);

        if (segments == null && cornersOnAllItems) {
            const [segmentStart, segmentEnd] = domain;
            const datum = { value, segmentStart, segmentEnd };
            const appliedCornerRadius = Math.min(cornerRadius, (outerRadius - innerRadius) / 2);
            const angleInset = appliedCornerRadius / ((innerRadius + outerRadius) / 2);

            if (bar.enabled) {
                nodeData.push({
                    series: this,
                    itemId: `value`,
                    datum,
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
                    fill: barFill,
                });
            }

            scaleData.push({
                series: this,
                itemId: `scale`,
                datum,
                type: NodeDataType.Node,
                centerX,
                centerY,
                outerRadius,
                innerRadius,
                startAngle: startAngle - angleInset,
                endAngle: endAngle + angleInset,
                clipStartAngle: undefined,
                clipEndAngle: undefined,
                startCornerRadius: cornerRadius,
                endCornerRadius: cornerRadius,
                fill: scaleFill,
            });
        } else {
            segments ??= domain;

            for (let i = 0; i < segments.length - 1; i += 1) {
                const segmentStart = segments[i + 0];
                const segmentEnd = segments[i + 1];
                const datum = { value, segmentStart, segmentEnd };

                const isStart = i === 0;
                const isEnd = i === segments.length - 2;

                const itemStartAngle = angleScale.convert(segmentStart);
                const itemEndAngle = angleScale.convert(segmentEnd);

                if (bar.enabled) {
                    nodeData.push({
                        series: this,
                        itemId: `value-${i}`,
                        datum,
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
                        fill: barFill,
                    });
                }

                scaleData.push({
                    series: this,
                    itemId: `scale-${i}`,
                    datum,
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
                    fill: scaleFill,
                });
            }
        }

        if (!needle.enabled && label.enabled) {
            const { color: fill, fontSize, fontStyle, fontWeight, fontFamily, lineHeight, formatter } = label;
            labelData.push({
                label: LabelType.Primary,
                centerX,
                centerY,
                text: label.text,
                value,
                fill,
                fontSize,
                fontStyle,
                fontWeight,
                fontFamily,
                lineHeight,
                formatter,
            });
        }

        if (!needle.enabled && secondaryLabel.enabled) {
            const { color: fill, fontSize, fontStyle, fontWeight, fontFamily, lineHeight, formatter } = secondaryLabel;
            labelData.push({
                label: LabelType.Secondary,
                centerX,
                centerY,
                text: secondaryLabel.text,
                value,
                fill,
                fontSize,
                fontStyle,
                fontWeight,
                fontFamily,
                lineHeight,
                formatter,
            });
        }

        if (needle.enabled) {
            let needleRadius = needle.radiusRatio != null ? radius * needle.radiusRatio : innerRadius;
            needleRadius = Math.max(needleRadius - needle.spacing, 0);
            const needleAngle = angleScale.convert(value);

            needleData.push({
                centerX,
                centerY,
                radius: needleRadius,
                angle: needleAngle,
            });
        }

        for (let i = 0; i < targets.length; i += 1) {
            const target = targets[i];
            const {
                value: targetValue,
                text,
                size,
                shape,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            } = target;

            if (targetValue < Math.min(...domain) || targetValue > Math.max(...domain)) {
                continue;
            }

            const targetRadius = this.getTargetRadius(target);
            const targetAngle = angleScale.convert(targetValue);
            const targetRotation = toRadians(target.rotation + targetPlacementRotation[target.placement]);

            targetData.push({
                series: this,
                itemId: `target-${i}`,
                midPoint: {
                    x: targetRadius * Math.cos(targetAngle) + centerX,
                    y: targetRadius * Math.sin(targetAngle) + centerY,
                },
                datum: { value: targetValue },
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
                fill,
                fillOpacity,
                stroke,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
                label: this.getTargetLabel(target),
            });
        }

        return {
            itemId: seriesId,
            nodeData,
            needleData,
            targetData,
            labelData,
            scaleData,
        };
    }

    async updateSelections(resize: boolean): Promise<void> {
        if (this.nodeDataRefresh || resize) {
            this.contextNodeData = await this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    private highlightDatum(node: _ModuleSupport.HighlightNodeDatum | undefined): RadialGaugeTargetDatum | undefined {
        if (node != null && node.series === this && (node as RadialGaugeTargetDatum).type === NodeDataType.Target) {
            return node as RadialGaugeTargetDatum;
        }
    }

    override async update({ seriesRect }: { seriesRect?: _Scene.BBox }): Promise<void> {
        const {
            datumSelection,
            labelSelection,
            needleSelection,
            targetSelection,
            targetLabelSelection,
            scaleSelection,
            highlightTargetSelection,
        } = this;

        const resize = this.checkResize(seriesRect);
        await this.updateSelections(resize);

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity = this.getOpacity();

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];
        const needleData = this.contextNodeData?.needleData ?? [];
        const targetData = this.contextNodeData?.targetData ?? [];
        const scaleData = this.contextNodeData?.scaleData ?? [];

        const highlightTargetDatum = this.highlightDatum(this.ctx.highlightManager.getActiveHighlight());

        this.scaleSelection = await this.updateScaleSelection({ scaleData, scaleSelection });
        await this.updateScaleNodes({ scaleSelection });

        this.needleSelection = await this.updateNeedleSelection({ needleData, needleSelection });
        await this.updateNeedleNodes({ needleSelection });

        this.targetSelection = await this.updateTargetSelection({ targetData, targetSelection });
        await this.updateTargetNodes({ targetSelection, isHighlight: false });

        this.targetLabelSelection = await this.updateTargetLabelSelection({ targetData, targetLabelSelection });
        await this.updateTargetLabelNodes({ targetLabelSelection });

        this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
        await this.updateDatumNodes({ datumSelection });

        this.labelSelection = await this.updateLabelSelection({ labelData, labelSelection });
        await this.updateLabelNodes({ labelSelection });

        this.highlightTargetSelection = await this.updateTargetSelection({
            targetData: highlightTargetDatum != null ? [highlightTargetDatum] : [],
            targetSelection: highlightTargetSelection,
        });
        await this.updateTargetNodes({ targetSelection: highlightTargetSelection, isHighlight: true });

        if (resize) {
            this.animationState.transition('resize');
        }
        this.animationState.transition('update');
    }

    private async updateDatumSelection(opts: {
        nodeData: RadialGaugeNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => {
            return createDatumId(opts.nodeData.length, datum.itemId!);
        });
    }

    private async updateDatumNodes(opts: { datumSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum> }) {
        const { datumSelection } = opts;
        const { ctx, properties } = this;
        const { bar, segmentation } = properties;
        const sectorSpacing = segmentation.spacing ?? 0;
        const { fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = bar;
        const strokeWidth = this.getStrokeWidth(bar.strokeWidth);
        const animationDisabled = ctx.animationManager.isSkipped();

        datumSelection.each((sector, datum) => {
            const { centerX, centerY, innerRadius, outerRadius, startCornerRadius, endCornerRadius, fill } = datum;
            sector.centerX = centerX;
            sector.centerY = centerY;
            sector.innerRadius = innerRadius;
            sector.outerRadius = outerRadius;

            sector.fill = fill;
            sector.fillOpacity = fillOpacity;
            sector.stroke = stroke;
            sector.strokeOpacity = strokeOpacity;
            sector.strokeWidth = strokeWidth;
            sector.lineDash = lineDash;
            sector.lineDashOffset = lineDashOffset;
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
    }

    private async updateScaleSelection(opts: {
        scaleData: RadialGaugeNodeDatum[];
        scaleSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum>;
    }) {
        return opts.scaleSelection.update(opts.scaleData, undefined, (datum) => {
            return createDatumId(opts.scaleData.length, datum.itemId!);
        });
    }

    private async updateScaleNodes(opts: { scaleSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum> }) {
        const { scaleSelection } = opts;
        const { scale, segmentation } = this.properties;
        const sectorSpacing = segmentation.spacing ?? 0;
        const { fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = scale;

        scaleSelection.each((sector, datum) => {
            const { centerX, centerY, innerRadius, outerRadius, startCornerRadius, endCornerRadius, fill } = datum;
            sector.centerX = centerX;
            sector.centerY = centerY;
            sector.innerRadius = innerRadius;
            sector.outerRadius = outerRadius;

            sector.fill = fill;
            sector.fillOpacity = fillOpacity;
            sector.stroke = stroke;
            sector.strokeOpacity = strokeOpacity;
            sector.strokeWidth = strokeWidth;
            sector.lineDash = lineDash;
            sector.lineDashOffset = lineDashOffset;
            sector.startOuterCornerRadius = startCornerRadius;
            sector.startInnerCornerRadius = startCornerRadius;
            sector.endOuterCornerRadius = endCornerRadius;
            sector.endInnerCornerRadius = endCornerRadius;

            sector.radialEdgeInset = (sectorSpacing + sector.strokeWidth) / 2;
            sector.concentricEdgeInset = sector.strokeWidth / 2;

            sector.setProperties(resetRadialGaugeSeriesResetSectorFunction(sector, datum));
        });
    }

    private async updateNeedleSelection(opts: {
        needleData: RadialGaugeNeedleDatum[];
        needleSelection: _Scene.Selection<RadialGaugeNeedle, RadialGaugeNeedleDatum>;
    }) {
        return opts.needleSelection.update(opts.needleData, undefined, () => createDatumId([]));
    }

    private async updateNeedleNodes(opts: {
        needleSelection: _Scene.Selection<RadialGaugeNeedle, RadialGaugeNeedleDatum>;
    }) {
        const { needleSelection } = opts;
        const { fill, fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
            this.properties.needle;
        const animationDisabled = this.ctx.animationManager.isSkipped();

        needleSelection.each((needle, datum) => {
            const { centerX, centerY, radius } = datum;

            const scale = radius * 2;

            needle.d = RadialGaugeNeedle.defaultPathData;

            needle.fill = fill;
            needle.fillOpacity = fillOpacity;
            needle.stroke = stroke;
            needle.strokeOpacity = strokeOpacity;
            needle.strokeWidth = strokeWidth / scale;
            needle.lineDash = lineDash.map((d) => d / scale);
            needle.lineDashOffset = lineDashOffset / scale;
            needle.translationX = centerX;
            needle.translationY = centerY;
            needle.scalingX = scale;
            needle.scalingY = scale;

            if (animationDisabled) {
                needle.setProperties(resetRadialGaugeSeriesResetNeedleFunction(needle, datum));
            }
        });
    }

    private async updateTargetSelection(opts: {
        targetData: RadialGaugeTargetDatum[];
        targetSelection: _Scene.Selection<_Scene.Marker, RadialGaugeTargetDatum>;
    }) {
        return opts.targetSelection.update(opts.targetData, undefined, (target) => target.itemId);
    }

    private async updateTargetNodes(opts: {
        targetSelection: _Scene.Selection<_Scene.Marker, RadialGaugeTargetDatum>;
        isHighlight: boolean;
    }) {
        const { targetSelection, isHighlight } = opts;
        const highlightStyle = isHighlight ? this.properties.highlightStyle.item : undefined;

        targetSelection.each((target, datum) => {
            const {
                centerX,
                centerY,
                angle,
                radius,
                size,
                rotation,
                fill,
                fillOpacity,
                stroke,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
            } = datum;

            target.size = size;
            target.fill = highlightStyle?.fill ?? fill;
            target.fillOpacity = highlightStyle?.fillOpacity ?? fillOpacity;
            target.stroke = highlightStyle?.stroke ?? stroke;
            target.strokeOpacity = highlightStyle?.strokeOpacity ?? strokeOpacity;
            target.strokeWidth = highlightStyle?.strokeWidth ?? strokeWidth;
            target.lineDash = highlightStyle?.lineDash ?? lineDash;
            target.lineDashOffset = highlightStyle?.lineDashOffset ?? lineDashOffset;
            target.translationX = centerX + radius * Math.cos(angle);
            target.translationY = centerY + radius * Math.sin(angle);
            target.rotation = angle + rotation;
        });
    }

    private async updateTargetLabelSelection(opts: {
        targetData: RadialGaugeTargetDatum[];
        targetLabelSelection: _Scene.Selection<_Scene.Text, RadialGaugeTargetDatum>;
    }) {
        return opts.targetLabelSelection.update(opts.targetData, undefined, (target) => target.itemId);
    }

    private async updateTargetLabelNodes(opts: {
        targetLabelSelection: _Scene.Selection<_Scene.Text, RadialGaugeTargetDatum>;
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

    private async updateLabelSelection(opts: {
        labelData: RadialGaugeLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, RadialGaugeLabelDatum>;
    }) {
        return opts.labelSelection.update(opts.labelData, undefined, (datum) => datum.label);
    }

    private async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, RadialGaugeLabelDatum> }) {
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

    labelsHaveExplicitText() {
        for (const { datum } of this.labelSelection) {
            if (datum.text == null) {
                return false;
            }
        }

        return true;
    }

    formatLabelText(datum?: { label: number | undefined; secondaryLabel: number | undefined }) {
        const angleAxis = this.axes[ChartAxisDirection.X];
        if (angleAxis == null) return;

        const { labelSelection, radius, textAlign, verticalAlign } = this;
        const { label, secondaryLabel, spacing: padding, innerRadiusRatio } = this.properties;

        formatRadialGaugeLabels(
            this,
            labelSelection,
            label,
            secondaryLabel,
            { padding, textAlign, verticalAlign },
            radius * innerRadiusRatio,
            (value) => this.formatLabel(value),
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
        } else if (!this.labelsHaveExplicitText()) {
            const animationId = `${this.id}_labels`;

            animationManager.animate({
                id: animationId,
                groupId: 'label',
                from: { label: labelFrom, secondaryLabel: secondaryLabelFrom },
                to: { label: labelTo, secondaryLabel: secondaryLabelTo },
                phase: params.phase ?? 'update',
                onUpdate: (datum) => this.formatLabelText(datum),
            });
        }
    }

    animateEmptyUpdateReady() {
        const { animationManager } = this.ctx;

        const { node, needle } = prepareRadialGaugeSeriesAnimationFunctions(
            true,
            this.axes[ChartAxisDirection.X]?.range[0] ?? 0
        );
        fromToMotion(this.id, 'node', animationManager, [this.datumSelection], node, (_sector, datum) => datum.itemId!);
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
            from: this.axes[ChartAxisDirection.X]?.scale.domain[0] ?? 0,
            phase: 'initial',
        });
    }

    animateWaitingUpdateReady() {
        const { animationManager } = this.ctx;

        const { node, needle } = prepareRadialGaugeSeriesAnimationFunctions(
            false,
            this.axes[ChartAxisDirection.X]?.range[0] ?? 0
        );
        fromToMotion(this.id, 'node', animationManager, [this.datumSelection], node, (_sector, datum) => datum.itemId!);
        fromToMotion(this.id, 'needle', animationManager, [this.needleSelection], needle, () => 'needle');

        this.animateLabelText();
    }

    protected animateReadyResize() {
        this.resetAllAnimation();
    }

    override getLabelData(): _Util.PointLabelDatum[] {
        return [];
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override getLegendData():
        | _ModuleSupport.ChartLegendDatum<any>[]
        | _ModuleSupport.ChartLegendDatum<_ModuleSupport.ChartLegendType>[] {
        return [];
    }

    private readonly nodeDatum: any = { series: this, datum: {} };
    override pickNode(
        point: _Scene.Point,
        intent: _ModuleSupport.SeriesNodePickIntent
    ): _ModuleSupport.PickResult | undefined {
        switch (intent) {
            case 'event':
            case 'context-menu': {
                const sectorTarget = this.scaleGroup.pickNode(point.x, point.y);
                return sectorTarget != null
                    ? {
                          pickMode: _ModuleSupport.SeriesNodePickMode.EXACT_SHAPE_MATCH,
                          match: sectorTarget.datum,
                          distance: 0,
                      }
                    : undefined;
            }
            case 'tooltip':
            case 'highlight':
            case 'highlight-tooltip': {
                const highlightedTarget = this.itemTargetGroup.pickNode(point.x, point.y);
                return highlightedTarget != null
                    ? {
                          pickMode: _ModuleSupport.SeriesNodePickMode.EXACT_SHAPE_MATCH,
                          match: highlightedTarget.datum,
                          distance: 0,
                      }
                    : {
                          pickMode: _ModuleSupport.SeriesNodePickMode.NEAREST_NODE,
                          match: this.nodeDatum,
                          distance: 0,
                      };
            }
        }
    }

    override getTooltipHtml(nodeDatum: _ModuleSupport.SeriesNodeDatum): _ModuleSupport.TooltipContent {
        const { id: seriesId, properties } = this;

        if (!properties.isValid()) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const highlightDatum = this.highlightDatum(nodeDatum);

        const value = highlightDatum?.value ?? properties.value;
        const text = highlightDatum?.text;
        const { tooltip } = properties;

        const title = text ?? '';
        const content = this.formatLabel(value);

        const itemId = highlightDatum?.itemId;
        const datum = undefined;
        const color = highlightDatum?.fill;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                itemId,
                title,
                datum,
                color,
                value,
                ...this.getModuleTooltipParams(),
            }
        );
    }

    override pickFocus(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.PickFocusOutputs | undefined {
        const targetData = this.contextNodeData?.targetData;
        if (targetData == null || targetData.length === 0) return;

        const datumIndex = Math.min(Math.max(opts.datumIndex, 0), targetData.length - 1);

        const datum = targetData[datumIndex];

        for (const node of this.targetSelection) {
            if (node.datum === datum) {
                const bounds = node.node;
                return { bounds, showFocusBox: true, datum, datumIndex };
            }
        }
    }

    getCaptionText(): string {
        const { value, label, secondaryLabel } = this.properties;

        const description: string[] = [];

        description.push(this.formatLabel(value));

        const labelText = getLabelText(this, label, value);
        if (labelText != null) {
            description.push(labelText);
        }

        const secondaryLabelText = getLabelText(this, secondaryLabel, value);
        if (secondaryLabelText != null) {
            description.push(secondaryLabelText);
        }

        return description.join('. ');
    }
}
