import {
    type AgGaugeFillMode,
    type AgLinearGaugeMarkerShape,
    type AgLinearGaugeTargetPlacement,
    type FontStyle,
    type FontWeight,
    _ModuleSupport,
    _Scale,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { fadeInFns, formatLabel, getLabelText } from '../gauge-util/label';
import { LineMarker } from '../gauge-util/lineMarker';
import { type GaugeStopProperties, getColorStops } from '../gauge-util/stops';
import { getLineHeight } from '../util/labelFormatter';
import {
    type LinearGaugeLabelDatum,
    LinearGaugeLabelProperties,
    type LinearGaugeNodeDatum,
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
    ChartAxisDirection,
    CachedTextMeasurerPool,
    EMPTY_TOOLTIP_CONTENT,
} = _ModuleSupport;
const { BBox, Group, PointerEvents, Selection, Rect, Text, LinearGradient, getMarker, easing } = _Scene;
const { toRadians } = _Util;

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

interface LinearGaugeNodeDataContext
    extends _ModuleSupport.SeriesNodeDataContext<LinearGaugeNodeDatum, LinearGaugeLabelDatum> {
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

export class LinearGaugeSeries
    extends _ModuleSupport.Series<
        LinearGaugeNodeDatum,
        LinearGaugeSeriesProperties,
        LinearGaugeLabelDatum,
        LinearGaugeNodeDataContext
    >
    implements _ModuleSupport.LinearGaugeSeries
{
    static readonly className = 'LinearGaugeSeries';
    static readonly type = 'linear-gauge' as const;

    override canHaveAxes: boolean = true;

    override properties = new LinearGaugeSeriesProperties();

    public originX = 0;
    public originY = 0;
    get horizontal() {
        return this.properties.direction === 'horizontal';
    }
    get thickness() {
        return this.properties.thickness;
    }
    computeInset(direction: _ModuleSupport.ChartAxisDirection, scale: _Scale.Scale<any, any>): number {
        const { label } = this.properties;
        let factor: 1 | -1;
        switch (label.placement) {
            case 'outside-start':
                factor = 1;
                break;
            case 'outside-end':
                factor = -1;
                break;
            default:
                return 0;
        }

        let size: number | undefined;
        if (direction === ChartAxisDirection.Y) {
            size = getLineHeight(label, label.fontSize);
        } else if (label.text != null) {
            const font = label.getFont();
            const { width } = CachedTextMeasurerPool.measureText(label.text, { font });
            size = width;
        } else {
            const font = label.getFont();
            size = scale.ticks?.()?.reduce((accum, tick) => {
                const text = getLabelText(this, this.labelDatum(label, tick));
                if (text == null) return accum;

                const { width } = CachedTextMeasurerPool.measureText(text, { font });
                return Math.max(accum, width);
            }, 0);
        }

        return factor * (label.spacing + (size ?? 0));
    }

    private readonly scaleGroup = this.contentGroup.appendChild(new Group({ name: 'scaleGroup' }));
    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));
    private readonly itemTargetGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetGroup' }));
    private readonly itemTargetLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetLabelGroup' }));
    private readonly itemLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemLabelGroup' }));
    private readonly highlightTargetGroup = this.highlightGroup.appendChild(
        new Group({ name: 'itemTargetLabelGroup' })
    );

    private scaleSelection: _Scene.Selection<_Scene.Rect, LinearGaugeNodeDatum> = Selection.select(
        this.scaleGroup,
        () => this.nodeFactory()
    );
    private datumSelection: _Scene.Selection<_Scene.Rect, LinearGaugeNodeDatum> = Selection.select(this.itemGroup, () =>
        this.nodeFactory()
    );
    private targetSelection: _Scene.Selection<_Scene.Marker, LinearGaugeTargetDatum> = Selection.select(
        this.itemTargetGroup,
        (datum) => this.markerFactory(datum)
    );
    private targetLabelSelection: _Scene.Selection<_Scene.Text, LinearGaugeTargetDatum> = Selection.select(
        this.itemTargetLabelGroup,
        Text
    );
    private labelSelection: _Scene.Selection<_Scene.Text, LinearGaugeLabelDatum> = Selection.select(
        this.itemLabelGroup,
        Text
    );
    private highlightTargetSelection: _Scene.Selection<_Scene.Marker, LinearGaugeTargetDatum> = Selection.select(
        this.highlightTargetGroup,
        (datum) => this.markerFactory(datum)
    );

    private readonly animationState: _ModuleSupport.StateMachine<GaugeAnimationState, GaugeAnimationEvent>;

    public contextNodeData?: LinearGaugeNodeDataContext;

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
        return true;
    }

    private nodeFactory(): _Scene.Rect {
        const rect = new Rect();
        rect.crisp = true;
        return rect;
    }

    private markerFactory({ shape }: LinearGaugeTargetDatum): _Scene.Marker {
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
        const { axes, horizontal } = this;
        const mainAxis = horizontal ? axes[ChartAxisDirection.X] : axes[ChartAxisDirection.Y];
        return formatLabel(value, mainAxis);
    }

    private createLinearGradient(fills: GaugeStopProperties[], fillMode: AgGaugeFillMode) {
        const { properties, originX, originY, horizontal, axes } = this;
        const { thickness, defaultColorRange } = properties;

        const mainAxis = horizontal ? axes[ChartAxisDirection.X] : axes[ChartAxisDirection.Y];
        const { domain, range } = mainAxis!.scale;

        const length = range[1] - range[0];

        const stops = getColorStops(fills, defaultColorRange, domain, fillMode);

        return new LinearGradient(
            'oklch',
            stops,
            horizontal ? 90 : 0,
            new BBox(originX, originY, horizontal ? length : thickness, horizontal ? thickness : length)
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

    private getTargetPoint(target: Target) {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        if (xAxis == null || yAxis == null) return { x: 0, y: 0 };

        const { properties, originX, originY, horizontal } = this;
        const { thickness } = properties;
        const { value, placement, spacing, size } = target;

        const mainAxis = horizontal ? xAxis : yAxis;
        const mainOffset = mainAxis.scale.convert(value) - mainAxis.scale.range[0];

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
            x: originX + xAxis.range[0] + (horizontal ? mainOffset : crossOffset),
            y: originY + yAxis.range[0] + (horizontal ? crossOffset : mainOffset),
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
            formatter,
        };
    }

    override async createNodeData() {
        const { id: seriesId, properties, originX, originY, horizontal } = this;

        if (!properties.isValid()) return;

        const { value, segmentation, thickness, cornerRadius, cornerMode, bar, scale, label } = properties;
        const targets = this.getTargets();

        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];
        if (xAxis == null || yAxis == null) return;
        const mainAxis = horizontal ? xAxis : yAxis;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const mainAxisScale = mainAxis.scale;

        let { domain } = mainAxis.scale;
        if (mainAxis.isReversed()) {
            domain = domain.slice().reverse();
        }

        const nodeData: LinearGaugeNodeDatum[] = [];
        const targetData: LinearGaugeTargetDatum[] = [];
        const labelData: LinearGaugeLabelDatum[] = [];
        const scaleData: LinearGaugeNodeDatum[] = [];

        const [m0, m1] = mainAxisScale.range;
        const mainAxisSize = Math.abs(m1 - m0);

        let [x0, x1] = xAxis.range;
        if (xAxis.isReversed()) {
            [x1, x0] = [x0, x1];
        }
        let [y0, y1] = yAxis.range;
        if (yAxis.isReversed()) {
            [y1, y0] = [y0, y1];
        }

        const containerX = horizontal ? xScale.convert(value) : x1;
        const containerY = horizontal ? y1 : yScale.convert(value);

        const inset = segmentation.enabled ? segmentation.spacing / 2 : 0;
        const horizontalInset = horizontal ? inset : 0;
        const verticalInset = horizontal ? 0 : inset;

        const barThickness = Math.min(bar.thickness ?? Math.round(bar.thicknessRatio * thickness), thickness);

        const barInset = -(thickness - barThickness) / 2;
        const barXInset = horizontal ? 0 : barInset;
        const barYInset = horizontal ? barInset : 0;

        const cornersOnAllItems = cornerMode === 'item';

        const maxTicks = Math.ceil(mainAxisSize);
        let segments = segmentation.enabled ? segmentation.interval.getSegments(mainAxisScale, maxTicks) : undefined;

        const barFill = bar.fill ?? this.createLinearGradient(bar.fills, bar.fillMode);
        const scaleFill =
            scale.fill ??
            (bar.enabled && scale.fills.length === 0 ? scale.defaultFill : undefined) ??
            this.createLinearGradient(scale.fills, scale.fillMode);

        if (segments == null && cornersOnAllItems) {
            const segmentStart = Math.min(...domain);
            const segmentEnd = Math.max(...domain);
            const datum = { value, segmentStart, segmentEnd };

            if (bar.enabled) {
                const barAppliedCornerRadius = Math.min(cornerRadius, barThickness / 2, mainAxisSize / 2);
                const barCornerInset = barAppliedCornerRadius * (mainAxis.isReversed() ? -1 : 1);

                const barCornerXInset = horizontal ? barCornerInset : 0;
                const barCornerYInset = horizontal ? 0 : barCornerInset;

                nodeData.push({
                    series: this,
                    itemId: `value`,
                    datum,
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
            const scaleCornerInset = scaleAppliedCornerRadius * (mainAxis.isReversed() ? -1 : 1);

            const scaleCornerXInset = horizontal ? scaleCornerInset : 0;
            const scaleCornerYInset = horizontal ? 0 : scaleCornerInset;

            scaleData.push({
                series: this,
                itemId: `scale`,
                datum,
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
            segments ??= domain;

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

                const itemStart = mainAxisScale.convert(segmentStart);
                const itemEnd = mainAxisScale.convert(segmentEnd);

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

    private highlightDatum(node: _ModuleSupport.HighlightNodeDatum | undefined): LinearGaugeTargetDatum | undefined {
        if (node != null && node.series === this && (node as LinearGaugeTargetDatum).type === NodeDataType.Target) {
            return node as LinearGaugeTargetDatum;
        }
    }

    override async update({ seriesRect }: { seriesRect?: _Scene.BBox }): Promise<void> {
        const {
            datumSelection,
            labelSelection,
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
        const targetData = this.contextNodeData?.targetData ?? [];
        const scaleData = this.contextNodeData?.scaleData ?? [];

        const highlightTargetDatum = this.highlightDatum(this.ctx.highlightManager.getActiveHighlight());

        this.scaleSelection = await this.updateScaleSelection({ scaleData, scaleSelection });
        await this.updateScaleNodes({ scaleSelection });

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
        nodeData: LinearGaugeNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, LinearGaugeNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => {
            return createDatumId(opts.nodeData.length, datum.itemId!);
        });
    }

    private async updateDatumNodes(opts: { datumSelection: _Scene.Selection<_Scene.Rect, LinearGaugeNodeDatum> }) {
        const { datumSelection } = opts;
        const { ctx, properties } = this;
        const { bar } = properties;
        const { fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = bar;
        const strokeWidth = this.getStrokeWidth(bar.strokeWidth);
        const animationDisabled = ctx.animationManager.isSkipped();

        datumSelection.each((rect, datum) => {
            const { topLeftCornerRadius, topRightCornerRadius, bottomRightCornerRadius, bottomLeftCornerRadius, fill } =
                datum;

            rect.fill = fill;
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

            if (animationDisabled || rect.previousDatum == null) {
                rect.setProperties(resetLinearGaugeSeriesResetRectFunction(rect, datum));
            }
        });
    }

    private async updateScaleSelection(opts: {
        scaleData: LinearGaugeNodeDatum[];
        scaleSelection: _Scene.Selection<_Scene.Rect, LinearGaugeNodeDatum>;
    }) {
        return opts.scaleSelection.update(opts.scaleData, undefined, (datum) => {
            return createDatumId(opts.scaleData.length, datum.itemId!);
        });
    }

    private async updateScaleNodes(opts: { scaleSelection: _Scene.Selection<_Scene.Rect, LinearGaugeNodeDatum> }) {
        const { scaleSelection } = opts;
        const { scale } = this.properties;
        const { fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = scale;

        scaleSelection.each((rect, datum) => {
            const { topLeftCornerRadius, topRightCornerRadius, bottomRightCornerRadius, bottomLeftCornerRadius, fill } =
                datum;

            rect.fill = fill;
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

    private async updateTargetSelection(opts: {
        targetData: LinearGaugeTargetDatum[];
        targetSelection: _Scene.Selection<_Scene.Marker, LinearGaugeTargetDatum>;
    }) {
        return opts.targetSelection.update(opts.targetData, undefined, (target) => target.itemId);
    }

    private async updateTargetNodes(opts: {
        targetSelection: _Scene.Selection<_Scene.Marker, LinearGaugeTargetDatum>;
        isHighlight: boolean;
    }) {
        const { targetSelection, isHighlight } = opts;
        const highlightStyle = isHighlight ? this.properties.highlightStyle.item : undefined;

        targetSelection.each((target, datum) => {
            const {
                x,
                y,
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
            target.translationX = x;
            target.translationY = y;
            target.rotation = rotation;
        });
    }

    private async updateTargetLabelSelection(opts: {
        targetData: LinearGaugeTargetDatum[];
        targetLabelSelection: _Scene.Selection<_Scene.Text, LinearGaugeTargetDatum>;
    }) {
        return opts.targetLabelSelection.update(opts.targetData);
    }

    private async updateTargetLabelNodes(opts: {
        targetLabelSelection: _Scene.Selection<_Scene.Text, LinearGaugeTargetDatum>;
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

    private async updateLabelSelection(opts: {
        labelData: LinearGaugeLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, LinearGaugeLabelDatum>;
    }) {
        return opts.labelSelection.update(opts.labelData, undefined, (_datum) => 'primary');
    }

    private async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, LinearGaugeLabelDatum> }) {
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
        const { labelSelection, horizontal, axes } = this;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];
        if (xAxis == null || yAxis == null) return;
        const [x0, x1] = xAxis.range;
        const [y0, y1] = yAxis.range;

        const x = this.originX + Math.min(x0, x1);
        const y = this.originY + Math.min(y0, y1);
        const width = Math.abs(x1 - x0);
        const height = Math.abs(y1 - y0);

        const value = datum?.label ?? this.properties.value;

        let barBBox: _Scene.BBox;
        if (horizontal) {
            const xValue = xAxis.scale.convert(value);
            barBBox = new BBox(x, y, xValue - x, height);
        } else {
            const yValue = yAxis.scale.convert(value);
            barBBox = new BBox(x, yValue, width, height - yValue);
        }

        const bboxes = {
            scale: new BBox(x, y, width, height),
            bar: barBBox,
        };

        const { margin: padding } = this.properties;

        formatLinearGaugeLabels(this, labelSelection, { padding, horizontal }, bboxes, datum);
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
        // const { value, label, secondaryLabel } = this.properties;
        const { value } = this.properties;

        const description: string[] = [];

        description.push(this.formatLabel(value));

        // const labelText = getLabelText(this, label, value);
        // if (labelText != null) {
        //     description.push(labelText);
        // }

        // const secondaryLabelText = getLabelText(this, secondaryLabel, value);
        // if (secondaryLabelText != null) {
        //     description.push(secondaryLabelText);
        // }

        return description.join('. ');
    }
}
