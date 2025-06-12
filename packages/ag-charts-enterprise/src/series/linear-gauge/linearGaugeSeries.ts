import {
    type AgGradientColorMode,
    type AgLinearGaugeMarkerShape,
    type AgLinearGaugeTargetPlacement,
    type AgTimeInterval,
    type AgTimeIntervalUnit,
    type FontStyle,
    type FontWeight,
    _ModuleSupport,
} from 'ag-charts-community';

import { formatWithContext } from '../../utils/formatter';
import { DatumUnion } from '../gauge-util/datumUnion';
import { fadeInFns, formatLabel, getLabelText } from '../gauge-util/label';
import { lineMarker } from '../gauge-util/lineMarker';
import { pickGaugeFocus, pickGaugeNearestDatum } from '../gauge-util/pick';
import { getLineHeight } from '../util/labelFormatter';
import {
    type LinearGaugeLabelDatum,
    LinearGaugeLabelProperties,
    type LinearGaugeNodeDatum,
    type LinearGaugeNodeDatumIndex,
    LinearGaugeSeriesProperties,
    type LinearGaugeTargetDatum,
    type LinearGaugeTargetDatumLabel,
    NodeDataType,
} from './linearGaugeSeriesProperties';
import {
    formatLinearGaugeLabels,
    prepareLinearGaugeSeriesAnimationFunctions,
    resetLinearGaugeSeriesResetRectFunction,
} from './linearGaugeUtil';

const {
    fromToMotion,
    resetMotion,
    SeriesNodePickMode,
    StateMachine,
    createDatumId,
    CachedTextMeasurerPool,
    toRadians,
    BBox,
    Group,
    PointerEvents,
    Selection,
    Rect,
    Text,
    TransformableText,
    Marker,
    LinearScale,
    AxisTickGenerator,
    NiceMode,
    easing,
    getColorStops,
    findRangeExtent,
    tickFormat,
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
    shape: AgLinearGaugeMarkerShape;
    placement: AgLinearGaugeTargetPlacement;
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

interface LinearGaugeNodeDataContext
    extends _ModuleSupport.SeriesNodeDataContext<
        LinearGaugeNodeDatumIndex,
        LinearGaugeNodeDatum,
        LinearGaugeLabelDatum
    > {
    tickData: _ModuleSupport.TickDatum[];
    targetData: LinearGaugeTargetDatum[];
    scaleData: LinearGaugeNodeDatum[];
}

const horizontalTargetPlacementRotation: Record<AgLinearGaugeTargetPlacement, number> = {
    before: 180,
    middle: 0,
    after: 0,
};
const verticalTargetPlacementRotation: Record<AgLinearGaugeTargetPlacement, number> = {
    before: 90,
    middle: 0,
    after: -90,
};

class LinearGaugeAxis implements _ModuleSupport.TickGenerationAxis<_ModuleSupport.LinearScale, number> {
    constructor(
        private readonly gauge: LinearGaugeSeries,
        private readonly ctx: _ModuleSupport.ModuleContext
    ) {}

    get scale() {
        return this.gauge.scale;
    }

    get label() {
        return this.gauge.properties.scale.label;
    }

    get interval() {
        return this.gauge.properties.scale.interval;
    }

    tickFormatter(
        domain: number[],
        ticks: number[],
        _primary: boolean,
        _fractionDigits?: number,
        _timeInterval?: AgTimeInterval | AgTimeIntervalUnit
    ): (value: number, index: number) => string {
        const { format } = this.label;
        let tickFormatter: ((value: number) => string) | undefined;
        if (format != null) {
            tickFormatter = tickFormat(ticks, typeof format === 'string' ? format : undefined);
        }

        return (value: number, index: number): string => {
            const { formatter } = this.label;
            let r: string | undefined = undefined;
            if (formatter) {
                r ??= formatWithContext(this.ctx, formatter, { value, index, domain, boundSeries: undefined! });
            }
            r ??= tickFormatter?.(value);
            return r ?? this.gauge.formatLabel(value);
        };
    }

    inRange(): boolean {
        return true;
    }
}

export class LinearGaugeSeries extends _ModuleSupport.Series<
    LinearGaugeNodeDatumIndex,
    LinearGaugeNodeDatum,
    LinearGaugeSeriesProperties,
    LinearGaugeLabelDatum,
    LinearGaugeNodeDataContext
> {
    static readonly className = 'LinearGaugeSeries';
    static readonly type = 'linear-gauge' as const;

    override properties = new LinearGaugeSeriesProperties();

    private seriesRect = BBox.NaN;
    private gaugeRect = BBox.NaN;

    public scale = new LinearScale();
    private readonly axis: LinearGaugeAxis;
    private readonly tickGenerator: _ModuleSupport.AxisTickGenerator<_ModuleSupport.LinearScale, number>;

    public get range(): [number, number] {
        return this.horizontal ? [0, this.gaugeRect.width] : [0, this.gaugeRect.height];
    }
    public originX = 0;
    public originY = 0;
    get horizontal() {
        return this.properties.direction === 'horizontal';
    }

    private readonly scaleGroup = this.contentGroup.appendChild(new Group({ name: 'scaleGroup' }));
    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));
    private readonly itemTargetGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetGroup' }));
    private readonly itemTargetLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetLabelGroup' }));
    private readonly itemLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemLabelGroup' }));
    private readonly highlightTargetGroup = this.highlightGroup.appendChild(
        new Group({ name: 'itemTargetLabelGroup' })
    );
    private readonly tickGroup = this.contentGroup.appendChild(new Group({ name: 'tickGroup' }));

    private scaleSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, LinearGaugeNodeDatum> = Selection.select(
        this.scaleGroup,
        () => this.nodeFactory()
    );
    private datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, LinearGaugeNodeDatum> = Selection.select(
        this.itemGroup,
        () => this.nodeFactory()
    );
    public targetSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, LinearGaugeTargetDatum> = Selection.select(
        this.itemTargetGroup,
        () => this.markerFactory()
    );
    private targetLabelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, LinearGaugeTargetDatum> =
        Selection.select(this.itemTargetLabelGroup, Text);
    private labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, LinearGaugeLabelDatum> = Selection.select(
        this.itemLabelGroup,
        Text
    );
    private highlightTargetSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, LinearGaugeTargetDatum> =
        Selection.select(this.highlightTargetGroup, () => this.markerFactory());
    private tickSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, _ModuleSupport.TickDatum> =
        Selection.select(this.tickGroup, TransformableText);

    public datumUnion: DatumUnion<_ModuleSupport.Rect, LinearGaugeNodeDatum> = new DatumUnion();
    private readonly animationState: _ModuleSupport.StateMachine<GaugeAnimationState, GaugeAnimationEvent>;

    public contextNodeData?: LinearGaugeNodeDataContext;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH, SeriesNodePickMode.NEAREST_NODE],
        });
        this.axis = new LinearGaugeAxis(this, moduleCtx);
        this.tickGenerator = new AxisTickGenerator<_ModuleSupport.LinearScale, number>(this.axis);

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
    }

    override get hasData(): boolean {
        return true;
    }

    private nodeFactory(): _ModuleSupport.Rect {
        const rect = new Rect();
        rect.crisp = true;
        return rect;
    }

    private markerFactory(): _ModuleSupport.Marker {
        return new Marker();
    }

    override processData() {
        this.nodeDataRefresh = true;

        this.animationState.transition('updateData');
    }

    public formatLabel(value: number) {
        return formatLabel(value, this.properties.scale);
    }

    private createLinearGradient(
        scale: _ModuleSupport.LinearScale,
        fills: _ModuleSupport.StopProperties[],
        fillMode: AgGradientColorMode
    ): _ModuleSupport.ShapeColor {
        const { properties, horizontal } = this;
        const { defaultColorRange } = properties;
        const colorStops = getColorStops(fills, defaultColorRange, scale.domain, fillMode);
        return {
            type: 'gradient',
            gradient: 'linear',
            colorSpace: 'oklch',
            colorStops,
            rotation: horizontal ? 90 : 0,
        };
    }

    protected getShapeFillBBox(): _ModuleSupport.BBox {
        const { properties, originX, originY, horizontal, scale } = this;
        const { thickness } = properties;

        const length = findRangeExtent(scale.range);

        return new BBox(originX, originY, horizontal ? length : thickness, horizontal ? thickness : length);
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

    private getTargetPoint(target: Target) {
        const { properties, originX, originY, horizontal, scale, gaugeRect } = this;
        const { thickness } = properties;
        const { value, placement, spacing, size } = target;

        const mainOffset = scale.convert(value);

        let crossOffset: number;
        switch (placement) {
            case 'before':
                crossOffset = -(spacing + size / 2);
                break;
            case 'after':
                crossOffset = thickness + spacing + size / 2;
                break;
            default:
                crossOffset = thickness / 2;
                break;
        }

        return {
            x: originX + gaugeRect.x + (horizontal ? mainOffset : crossOffset),
            y: originY + gaugeRect.y + (horizontal ? crossOffset : mainOffset),
        };
    }

    private getTargetLabel(target: Target): LinearGaugeTargetDatumLabel {
        const { size, placement, label } = target;
        const { spacing, color: fill, fontStyle, fontWeight, fontSize, fontFamily } = label;
        const lineHeight = undefined;

        const offset = size / 2 + spacing;

        let textAlign: CanvasTextAlign;
        let textBaseline: CanvasTextBaseline;
        let offsetX: number = 0;
        let offsetY: number = 0;
        if (this.horizontal) {
            textAlign = 'center';

            if (placement === 'after') {
                textBaseline = 'top';
                offsetY = offset;
            } else {
                textBaseline = 'bottom';
                offsetY = -offset;
            }
        } else {
            textBaseline = 'middle';

            if (placement === 'before') {
                textAlign = 'right';
                offsetX = -offset;
            } else {
                textAlign = 'left';
                offsetX = offset;
            }
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

    labelDatum(label: LinearGaugeLabelProperties, value: number): LinearGaugeLabelDatum {
        const {
            placement,
            avoidCollisions,
            spacing,
            text,
            color: fill,
            fontSize,
            minimumFontSize,
            fontStyle,
            fontWeight,
            fontFamily,
            lineHeight,
            wrapping,
            overflowStrategy,
            formatter = (params) => this.formatLabel(params.value),
        } = label;
        return {
            placement,
            avoidCollisions,
            spacing,
            text,
            value,
            fill,
            fontSize,
            minimumFontSize,
            fontStyle,
            fontWeight,
            fontFamily,
            lineHeight,
            wrapping,
            overflowStrategy,
            formatter,
        };
    }

    private verticalLabelInset() {
        const { properties } = this;
        const { label } = properties;

        const lines = label.text?.split('\n');

        const labelSize = getLineHeight(label, label.fontSize) * (lines?.length ?? 1);

        return label.spacing + labelSize;
    }

    private horizontalLabelInset() {
        const { scale, properties } = this;
        const { scale: scaleProps, label } = properties;

        const lines = label.text?.split('\n');

        const measurer = CachedTextMeasurerPool.getMeasurer({ font: label });
        const ticks =
            scaleProps.interval.values ??
            scale.ticks({
                nice: false,
                interval: scaleProps.interval.step,
                minTickCount: 0,
                maxTickCount: 6,
                tickCount: 5,
            })?.ticks ??
            [];
        const linesOrTicks =
            lines ?? ticks?.map((tick) => getLabelText(this.id, this.ctx, this.labelDatum(label, tick)) ?? '');

        const labelSize = linesOrTicks.reduce((accum, text) => {
            const { width } = measurer.measureText(text);
            return Math.max(accum, width);
        }, 0);

        return label.spacing + labelSize;
    }

    override createNodeData() {
        const { id: seriesId, properties, horizontal, scale, seriesRect } = this;
        const { value, segmentation, thickness, cornerRadius, cornerMode, bar, scale: scaleProps, label } = properties;

        scale.domain = [scaleProps.min, scaleProps.max];
        // Required to generate ticks in horizontalLabelInset
        scale.range = horizontal ? [0, seriesRect.width] : [seriesRect.height, 0];

        let parallelFlipRotation: number;
        let sideFlag: 1 | -1;
        if (horizontal) {
            sideFlag = 1;
            parallelFlipRotation = Math.PI / 2;
        } else if (scaleProps.label.placement === 'before') {
            sideFlag = 1;
            parallelFlipRotation = 0;
        } else {
            sideFlag = -1;
            parallelFlipRotation = 0;
        }

        const regularFlipRotation = parallelFlipRotation - Math.PI / 2;

        let x0: number;
        let x1: number;
        let y0: number;
        let y1: number;
        if (horizontal) {
            x0 = 0;
            x1 = seriesRect.width;
            y0 = (seriesRect.height - thickness) / 2;
            y1 = y0 + thickness;

            if (label.placement === 'outside-start') {
                x0 += this.horizontalLabelInset();
            } else if (label.placement === 'outside-end') {
                x1 -= this.horizontalLabelInset();
            }
        } else {
            x0 = (seriesRect.width - thickness) / 2;
            x1 = x0 + thickness;
            // Reversed
            y1 = 0;
            y0 = seriesRect.height;

            if (label.placement === 'outside-start') {
                y0 -= this.verticalLabelInset();
            } else if (label.placement === 'outside-end') {
                y1 += this.verticalLabelInset();
            }
        }

        this.gaugeRect = new BBox(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));

        const originX = 0;
        const originY = 0;
        scale.domain = [scaleProps.min, scaleProps.max];
        scale.range = horizontal ? [x0, x1] : [y0, y1];

        const { ticks: tickData } = this.tickGenerator.generateTicks({
            domain: scale.domain,
            range: this.range,
            reverse: false,
            primaryTickCount: undefined,
            defaultTickMinSpacing: 0,
            visibleRange: [0, 1],
            niceMode: NiceMode.Off,
            labelX: 0,
            parallelFlipRotation,
            regularFlipRotation,
            sideFlag,
            removeOverflowLabels: false,
        }).tickData;

        const isReversed = false; // Can this be removed?

        const targets = this.getTargets();

        const nodeData: LinearGaugeNodeDatum[] = [];
        const targetData: LinearGaugeTargetDatum[] = [];
        const labelData: LinearGaugeLabelDatum[] = [];
        const scaleData: LinearGaugeNodeDatum[] = [];

        const [m0, m1] = scale.range;
        const mainAxisSize = Math.abs(m1 - m0);

        const containerX = horizontal ? scale.convert(value) : x1;
        const containerY = horizontal ? y1 : scale.convert(value);

        const inset = segmentation.enabled ? segmentation.spacing / 2 : 0;
        const horizontalInset = horizontal ? inset : 0;
        const verticalInset = horizontal ? 0 : inset;

        const barThickness = Math.min(bar.thickness ?? Math.round(bar.thicknessRatio * thickness), thickness);

        const barInset = -(thickness - barThickness) / 2;
        const barXInset = horizontal ? 0 : barInset;
        const barYInset = horizontal ? barInset : 0;

        const cornersOnAllItems = cornerMode === 'item';

        const maxTicks = Math.ceil(mainAxisSize);
        let segments = segmentation.enabled ? segmentation.interval.getSegments(scale, maxTicks) : undefined;

        const barFill = bar.fill ?? this.createLinearGradient(scale, bar.fills, bar.fillMode);
        const scaleFill =
            scaleProps.fill ??
            (bar.enabled && scaleProps.fills.length === 0 ? scaleProps.defaultFill : undefined) ??
            this.createLinearGradient(scale, scaleProps.fills, scaleProps.fillMode);

        if (segments == null && cornersOnAllItems) {
            const segmentStart = Math.min(...scale.domain);
            const segmentEnd = Math.max(...scale.domain);
            const datum = { value, segmentStart, segmentEnd };

            if (bar.enabled) {
                const barAppliedCornerRadius = Math.min(cornerRadius, barThickness / 2, mainAxisSize / 2);
                const barCornerInset = barAppliedCornerRadius * (isReversed ? -1 : 1);

                const barCornerXInset = horizontal ? barCornerInset : 0;
                const barCornerYInset = horizontal ? 0 : barCornerInset;

                nodeData.push({
                    series: this,
                    itemId: `value`,
                    datum,
                    datumIndex: { type: NodeDataType.Node },
                    type: NodeDataType.Node,
                    x0: originX + x0 - barCornerXInset - barXInset,
                    y0: originY + y0 - barCornerYInset - barYInset,
                    x1: originX + containerX + barCornerXInset + barXInset,
                    y1: originY + containerY + barCornerYInset + barYInset,
                    clipX0: undefined,
                    clipY0: undefined,
                    clipX1: undefined,
                    clipY1: undefined,
                    topLeftCornerRadius: cornerRadius,
                    topRightCornerRadius: cornerRadius,
                    bottomRightCornerRadius: cornerRadius,
                    bottomLeftCornerRadius: cornerRadius,
                    fill: barFill,
                    horizontalInset,
                    verticalInset,
                });
            }

            const scaleAppliedCornerRadius = Math.min(cornerRadius, thickness / 2, mainAxisSize / 2);
            const scaleCornerInset = scaleAppliedCornerRadius * (isReversed ? -1 : 1);

            const scaleCornerXInset = horizontal ? scaleCornerInset : 0;
            const scaleCornerYInset = horizontal ? 0 : scaleCornerInset;

            scaleData.push({
                series: this,
                itemId: `scale`,
                datum,
                datumIndex: { type: NodeDataType.Node },
                type: NodeDataType.Node,
                x0: originX + x0 - scaleCornerXInset,
                y0: originY + y0 - scaleCornerYInset,
                x1: originX + x1 + scaleCornerXInset,
                y1: originY + y1 + scaleCornerYInset,
                clipX0: undefined,
                clipY0: undefined,
                clipX1: undefined,
                clipY1: undefined,
                topLeftCornerRadius: cornerRadius,
                topRightCornerRadius: cornerRadius,
                bottomRightCornerRadius: cornerRadius,
                bottomLeftCornerRadius: cornerRadius,
                fill: scaleFill,
                horizontalInset,
                verticalInset,
            });
        } else {
            segments ??= scale.domain;

            const clipX0 = originX + x0 - barXInset;
            const clipY0 = originY + y0 - barYInset;
            const clipX1 = originX + containerX + barXInset;
            const clipY1 = originY + containerY + barYInset;

            for (let i = 0; i < segments.length - 1; i += 1) {
                const segmentStart = segments[i + 0];
                const segmentEnd = segments[i + 1];
                const datum = { value, segmentStart, segmentEnd };

                const isStart = i === 0;
                const isEnd = i === segments.length - 2;

                const itemStart = scale.convert(segmentStart);
                const itemEnd = scale.convert(segmentEnd);

                const startCornerRadius = cornersOnAllItems || isStart ? cornerRadius : 0;
                const endCornerRadius = cornersOnAllItems || isEnd ? cornerRadius : 0;
                const topLeftCornerRadius = horizontal ? startCornerRadius : endCornerRadius;
                const topRightCornerRadius = endCornerRadius;
                const bottomRightCornerRadius = horizontal ? endCornerRadius : startCornerRadius;
                const bottomLeftCornerRadius = startCornerRadius;

                if (bar.enabled) {
                    nodeData.push({
                        series: this,
                        itemId: `value-${i}`,
                        datum,
                        datumIndex: { type: NodeDataType.Node },
                        type: NodeDataType.Node,
                        x0: originX + (horizontal ? itemStart : x0),
                        y0: originY + (horizontal ? y0 : itemStart),
                        x1: originX + (horizontal ? itemEnd : x1),
                        y1: originY + (horizontal ? y1 : itemEnd),
                        clipX0,
                        clipY0,
                        clipX1,
                        clipY1,
                        topLeftCornerRadius,
                        topRightCornerRadius,
                        bottomRightCornerRadius,
                        bottomLeftCornerRadius,
                        fill: barFill,
                        horizontalInset,
                        verticalInset,
                    });
                }

                scaleData.push({
                    series: this,
                    itemId: `scale-${i}`,
                    datum,
                    datumIndex: { type: NodeDataType.Node },
                    type: NodeDataType.Node,
                    x0: originX + (horizontal ? itemStart : x0),
                    y0: originY + (horizontal ? y0 : itemStart),
                    x1: originX + (horizontal ? itemEnd : x1),
                    y1: originY + (horizontal ? y1 : itemEnd),
                    clipX0: undefined,
                    clipY0: undefined,
                    clipX1: undefined,
                    clipY1: undefined,
                    topLeftCornerRadius,
                    topRightCornerRadius,
                    bottomRightCornerRadius,
                    bottomLeftCornerRadius,
                    fill: scaleFill,
                    horizontalInset,
                    verticalInset,
                });
            }
        }

        if (label.enabled) {
            labelData.push(this.labelDatum(label, value));
        }

        const targetPlacementRotation = horizontal
            ? horizontalTargetPlacementRotation
            : verticalTargetPlacementRotation;
        for (let i = 0; i < targets.length; i += 1) {
            const target = targets[i];
            const {
                value: targetValue,
                text,
                shape,
                size,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            } = target;

            const targetPoint = this.getTargetPoint(target);
            const targetRotation = toRadians(target.rotation + targetPlacementRotation[target.placement]);

            targetData.push({
                series: this,
                itemId: `target-${i}`,
                midPoint: targetPoint,
                datum: { value: targetValue },
                datumIndex: { type: NodeDataType.Target, index: i },
                type: NodeDataType.Target,
                value: targetValue,
                text,
                x: targetPoint.x,
                y: targetPoint.y,
                shape,
                size,
                rotation: targetRotation,
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
            tickData,
            targetData,
            labelData,
            scaleData,
        };
    }

    updateSelections(resize: boolean) {
        if (this.nodeDataRefresh || resize) {
            this.contextNodeData = this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    private highlightDatum(node: _ModuleSupport.HighlightNodeDatum | undefined): LinearGaugeTargetDatum | undefined {
        if (node != null && node.series === this && (node as LinearGaugeTargetDatum).type === NodeDataType.Target) {
            return node as LinearGaugeTargetDatum;
        }
    }

    override update({ seriesRect }: { seriesRect?: _ModuleSupport.BBox }) {
        const {
            datumSelection,
            labelSelection,
            targetSelection,
            targetLabelSelection,
            scaleSelection,
            highlightTargetSelection,
            tickSelection,
        } = this;

        this.seriesRect = seriesRect ?? BBox.NaN;

        const resize = this.checkResize(seriesRect);
        this.updateSelections(resize);

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity = this.getOpacity();

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];
        const targetData = this.contextNodeData?.targetData ?? [];
        const scaleData = this.contextNodeData?.scaleData ?? [];
        const tickData = this.contextNodeData?.tickData ?? [];

        const highlightTargetDatum = this.highlightDatum(this.ctx.highlightManager.getActiveHighlight());

        this.scaleSelection = this.updateScaleSelection({ scaleData, scaleSelection });
        this.updateScaleNodes({ scaleSelection });

        this.targetSelection = this.updateTargetSelection({ targetData, targetSelection });
        this.updateTargetNodes({ targetSelection, isHighlight: false });

        this.targetLabelSelection = this.updateTargetLabelSelection({ targetData, targetLabelSelection });
        this.updateTargetLabelNodes({ targetLabelSelection });

        this.datumSelection = this.updateDatumSelection({ nodeData, datumSelection });
        this.updateDatumNodes({ datumSelection });

        this.labelSelection = this.updateLabelSelection({ labelData, labelSelection });
        this.updateLabelNodes({ labelSelection });

        this.highlightTargetSelection = this.updateTargetSelection({
            targetData: highlightTargetDatum != null ? [highlightTargetDatum] : [],
            targetSelection: highlightTargetSelection,
        });
        this.updateTargetNodes({ targetSelection: highlightTargetSelection, isHighlight: true });

        this.tickSelection = this.updateTickSelection({ tickData, tickSelection });
        this.updateTickNodes({ tickSelection });

        if (resize) {
            this.animationState.transition('resize');
        }
        this.animationState.transition('update');
    }

    private updateDatumSelection(opts: {
        nodeData: LinearGaugeNodeDatum[];
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, LinearGaugeNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => {
            return createDatumId(opts.nodeData.length, datum.itemId);
        });
    }

    private updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, LinearGaugeNodeDatum>;
    }) {
        const { datumSelection } = opts;
        const { ctx, properties } = this;
        const { bar } = properties;
        const { fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = bar;
        const strokeWidth = this.getStrokeWidth(bar.strokeWidth);
        const animationDisabled = ctx.animationManager.isSkipped();
        const fillBBox = this.getShapeFillBBox();
        datumSelection.each((rect, datum) => {
            const { topLeftCornerRadius, topRightCornerRadius, bottomRightCornerRadius, bottomLeftCornerRadius, fill } =
                datum;

            rect.fill = fill;
            rect.fillBBox = fillBBox;
            rect.fillOpacity = fillOpacity;
            rect.stroke = stroke;
            rect.strokeOpacity = strokeOpacity;
            rect.strokeWidth = strokeWidth;
            rect.lineDash = lineDash;
            rect.lineDashOffset = lineDashOffset;
            rect.topLeftCornerRadius = topLeftCornerRadius;
            rect.topRightCornerRadius = topRightCornerRadius;
            rect.bottomRightCornerRadius = bottomRightCornerRadius;
            rect.bottomLeftCornerRadius = bottomLeftCornerRadius;
            rect.pointerEvents = this.properties.bar.enabled
                ? _ModuleSupport.PointerEvents.All
                : _ModuleSupport.PointerEvents.None;

            if (animationDisabled || rect.previousDatum == null) {
                rect.setProperties(resetLinearGaugeSeriesResetRectFunction(rect, datum));
            }
        });

        this.datumUnion.update(datumSelection, this.itemGroup, _ModuleSupport.Rect, (node, first, last) => {
            node.pointerEvents = _ModuleSupport.PointerEvents.None;
            node.clipBBox ??= new BBox(NaN, NaN, NaN, NaN);
            node.x = first.x;
            node.y = first.y;
            node.clipBBox.x = first.clipBBox?.x ?? first.x;
            node.clipBBox.y = first.clipBBox?.y ?? first.y;
            if (this.horizontal) {
                node.height = node.clipBBox.height = last.height;
                node.width = last === first ? last.width : last.x + last.width;
                node.clipBBox.width = node.width - (last.width - (last.clipBBox?.width ?? last.width));
                node.topLeftCornerRadius = first.topLeftCornerRadius;
                node.bottomLeftCornerRadius = first.bottomLeftCornerRadius;
                node.topRightCornerRadius = last.topRightCornerRadius;
                node.bottomRightCornerRadius = last.bottomRightCornerRadius;
            } else {
                node.width = node.clipBBox.width = last.width;
                node.height = last === first ? last.height : last.x + last.height;
                node.clipBBox.height = node.height - (last.height - (last.clipBBox?.height ?? last.height));
                node.topLeftCornerRadius = first.topLeftCornerRadius;
                node.topRightCornerRadius = first.topRightCornerRadius;
                node.bottomLeftCornerRadius = last.bottomLeftCornerRadius;
                node.bottomRightCornerRadius = last.bottomRightCornerRadius;
            }
        });
    }

    private updateScaleSelection(opts: {
        scaleData: LinearGaugeNodeDatum[];
        scaleSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, LinearGaugeNodeDatum>;
    }) {
        return opts.scaleSelection.update(opts.scaleData, undefined, (datum) => {
            return createDatumId(opts.scaleData.length, datum.itemId);
        });
    }

    private updateScaleNodes(opts: {
        scaleSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, LinearGaugeNodeDatum>;
    }) {
        const { scaleSelection } = opts;
        const { scale } = this.properties;
        const { fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = scale;
        const fillBBox = this.getShapeFillBBox();

        scaleSelection.each((rect, datum) => {
            const { topLeftCornerRadius, topRightCornerRadius, bottomRightCornerRadius, bottomLeftCornerRadius, fill } =
                datum;

            rect.fill = fill;
            rect.fillBBox = fillBBox;
            rect.fillOpacity = fillOpacity;
            rect.stroke = stroke;
            rect.strokeOpacity = strokeOpacity;
            rect.strokeWidth = strokeWidth;
            rect.lineDash = lineDash;
            rect.lineDashOffset = lineDashOffset;
            rect.topLeftCornerRadius = topLeftCornerRadius;
            rect.topRightCornerRadius = topRightCornerRadius;
            rect.bottomRightCornerRadius = bottomRightCornerRadius;
            rect.bottomLeftCornerRadius = bottomLeftCornerRadius;

            rect.setProperties(resetLinearGaugeSeriesResetRectFunction(rect, datum));
        });
    }

    private updateTargetSelection(opts: {
        targetData: LinearGaugeTargetDatum[];
        targetSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, LinearGaugeTargetDatum>;
    }) {
        return opts.targetSelection.update(opts.targetData, undefined, (target) => target.itemId);
    }

    private updateTargetNodes(opts: {
        targetSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, LinearGaugeTargetDatum>;
        isHighlight: boolean;
    }) {
        const { targetSelection, isHighlight } = opts;
        const highlightStyle = isHighlight ? this.properties.highlightStyle.item : undefined;

        targetSelection.each((target, datum) => {
            const {
                x,
                y,
                shape,
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
            target.shape = shape === 'line' ? lineMarker : shape;
            target.fill = highlightStyle?.fill ?? fill;
            target.fillOpacity = highlightStyle?.fillOpacity ?? fillOpacity;
            target.stroke = highlightStyle?.stroke ?? stroke;
            target.strokeOpacity = highlightStyle?.strokeOpacity ?? strokeOpacity;
            target.strokeWidth = highlightStyle?.strokeWidth ?? strokeWidth;
            target.lineDash = highlightStyle?.lineDash ?? lineDash;
            target.lineDashOffset = highlightStyle?.lineDashOffset ?? lineDashOffset;
            target.translationX = x;
            target.translationY = y;
            target.rotation = rotation;
        });
    }

    private updateTargetLabelSelection(opts: {
        targetData: LinearGaugeTargetDatum[];
        targetLabelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, LinearGaugeTargetDatum>;
    }) {
        return opts.targetLabelSelection.update(opts.targetData);
    }

    private updateTargetLabelNodes(opts: {
        targetLabelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, LinearGaugeTargetDatum>;
    }) {
        const { targetLabelSelection } = opts;

        targetLabelSelection.each((label, target) => {
            const { x, y, text } = target;
            const { offsetX, offsetY, fill, fontStyle, fontWeight, fontSize, fontFamily, textAlign, textBaseline } =
                target.label;

            label.visible = true;
            label.x = x + offsetX;
            label.y = y + offsetY;
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

    private updateTickSelection(opts: {
        tickData: _ModuleSupport.TickDatum[];
        tickSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, _ModuleSupport.TickDatum>;
    }) {
        return opts.tickSelection.update(opts.tickData, undefined, (datum) => datum.tickId);
    }

    private updateTickNodes(opts: {
        tickSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, _ModuleSupport.TickDatum>;
    }) {
        const { gaugeRect, properties } = this;
        const defaultScale = properties.defaultScale;
        const {
            enabled,
            color,
            fontFamily = defaultScale.label.fontFamily,
            fontSize = defaultScale.label.fontSize,
            fontStyle,
            fontWeight = defaultScale.label.fontWeight,
            spacing,
        } = properties.scale.label;
        let { placement } = properties.scale.label;
        const rotation = toRadians(properties.scale.label.rotation ?? 0);

        let textAlign: CanvasTextAlign;
        let textBaseline: CanvasTextBaseline;
        let textX: number | undefined;
        let textY: number | undefined;
        if (this.horizontal) {
            placement ??= 'after';
            textAlign = 'center';
            textBaseline = placement === 'before' ? 'bottom' : 'top';
            textY = this.originY + gaugeRect.y + (placement === 'before' ? -spacing : gaugeRect.height + spacing);
        } else {
            placement ??= 'before';
            textAlign = placement === 'before' ? 'end' : 'start';
            textBaseline = 'middle';
            textX = this.originX + gaugeRect.x + (placement === 'before' ? -spacing : gaugeRect.width + spacing);
        }

        opts.tickSelection.each((label, datum) => {
            if (!enabled) {
                label.visible = false;
                return;
            }

            const x = textX ?? datum.translation;
            const y = textY ?? datum.translation;
            label.visible = true;

            label.text = datum.tickLabel;
            label.fill = color;
            label.fontFamily = fontFamily;
            label.fontSize = fontSize;
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;
            label.textBaseline = textBaseline;
            label.textAlign = textAlign;
            label.x = x;
            label.y = y;
            label.rotationCenterX = x;
            label.rotationCenterY = y;
            label.rotation = rotation;
        });
    }

    private updateLabelSelection(opts: {
        labelData: LinearGaugeLabelDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, LinearGaugeLabelDatum>;
    }) {
        return opts.labelSelection.update(opts.labelData, undefined, (_datum) => 'primary');
    }

    private updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, LinearGaugeLabelDatum>;
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

    labelsHaveExplicitText() {
        for (const { datum } of this.labelSelection) {
            if (datum.text == null) {
                return false;
            }
        }

        return true;
    }

    formatLabelText(datum?: { label: number }) {
        const { labelSelection, horizontal, scale, seriesRect, gaugeRect } = this;
        const { x, y, width, height } = gaugeRect;

        const value = datum?.label ?? this.properties.value;

        let barRect: _ModuleSupport.BBox;
        if (horizontal) {
            const xValue = scale.convert(value);
            barRect = new BBox(x, y, xValue - x, height);
        } else {
            const yValue = scale.convert(value);
            barRect = new BBox(x, yValue, width, height - yValue);
        }

        const bboxes = { seriesRect, gaugeRect, barRect };

        const { margin: padding } = this.properties;

        formatLinearGaugeLabels(this, this.ctx, labelSelection, { padding, horizontal }, bboxes, datum);
    }

    protected resetAllAnimation() {
        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        resetMotion([this.datumSelection], resetLinearGaugeSeriesResetRectFunction);
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

        let labelFrom = 0;
        let labelTo = 0;
        this.labelSelection.each((label, datum) => {
            // Reset animation
            label.opacity = 1;

            labelFrom = label.previousDatum?.value ?? params.from ?? datum.value;
            labelTo = datum.value;
        });

        if (this.labelsHaveExplicitText()) {
            // Ignore
        } else if (labelFrom === labelTo) {
            this.formatLabelText({ label: labelTo });
        } else {
            const animationId = `${this.id}_labels`;

            animationManager.animate({
                id: animationId,
                groupId: 'label',
                from: { label: labelFrom },
                to: { label: labelTo },
                phase: params.phase ?? 'update',
                ease: easing.easeOut,
                onUpdate: (datum) => this.formatLabelText(datum),
            });
        }
    }

    animateEmptyUpdateReady() {
        const { animationManager } = this.ctx;

        const { node } = prepareLinearGaugeSeriesAnimationFunctions(true, this.horizontal);
        fromToMotion(this.id, 'node', animationManager, [this.datumSelection], node, (_sector, datum) => datum.itemId!);

        fromToMotion(this.id, 'label', animationManager, [this.labelSelection], fadeInFns, () => 'primary');

        this.animateLabelText({ from: 0, phase: 'initial' });
    }

    animateWaitingUpdateReady() {
        const { animationManager } = this.ctx;

        const { node } = prepareLinearGaugeSeriesAnimationFunctions(false, this.horizontal);
        fromToMotion(this.id, 'node', animationManager, [this.datumSelection], node, (_sector, datum) => datum.itemId!);

        this.animateLabelText();
    }

    protected animateReadyResize() {
        this.resetAllAnimation();
    }

    override getSeriesDomain() {
        // Not used - required to be set to a finite for animations
        return [0, 1];
    }

    override dataCount(): number {
        return NaN; // Not used
    }

    override getSeriesRange(
        _direction: _ModuleSupport.ChartAxisDirection,
        _visibleRange: [any, any]
    ): [number, number] {
        return [NaN, NaN];
    }

    override getLegendData(): _ModuleSupport.ChartLegendDatum<_ModuleSupport.ChartLegendType>[] {
        return [];
    }

    override getTooltipContent(datumIndex: LinearGaugeNodeDatumIndex): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, properties } = this;
        const { tooltip } = properties;

        let value: number | undefined;
        let text: string | undefined;
        if (datumIndex.type === NodeDataType.Node) {
            value = properties.value;
            text = properties.label.text;
        } else {
            ({ value, text } = properties.targets[datumIndex.index]);
        }

        if (value == null) return;

        return this.formatTooltipWithContext(
            tooltip,
            {
                data: [{ label: text, fallbackLabel: 'Value', value: this.formatLabel(value) }],
            },
            { seriesId, title: undefined, datum: undefined, value }
        );
    }

    override pickNodeClosestDatum(point: _ModuleSupport.Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        return pickGaugeNearestDatum(this, point);
    }

    override pickFocus(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.PickFocusOutputs | undefined {
        return pickGaugeFocus(this, opts);
    }

    getCaptionText(): string {
        return this.formatLabel(this.properties.value);
    }

    getCategoryValue(_datumIndex: LinearGaugeNodeDatumIndex) {
        return;
    }

    datumIndexForCategoryValue(_categoryValue: any): LinearGaugeNodeDatumIndex | undefined {
        return;
    }
}
