import {
    type AgLinearGaugeMarkerShape,
    type AgLinearGaugeTargetPlacement,
    type FontStyle,
    type FontWeight,
    type TextAlign,
    type VerticalAlign,
    _ModuleSupport,
    _Scale,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { LineMarker } from '../gauge-util/lineMarker';
import {
    type LinearGaugeNodeDatum,
    LinearGaugeSeriesProperties,
    type LinearGaugeTargetDatum,
    type LinearGaugeTargetDatumLabel,
    NodeDataType,
} from './linearGaugeSeriesProperties';
import { prepareLinearGaugeSeriesAnimationFunctions, resetLinearGaugeSeriesResetRectFunction } from './linearGaugeUtil';

const {
    fromToMotion,
    resetMotion,
    SeriesNodePickMode,
    StateMachine,
    createDatumId,
    ChartAxisDirection,
    EMPTY_TOOLTIP_CONTENT,
} = _ModuleSupport;
const { BBox, Group, PointerEvents, Selection, Rect, Text, LinearGradient, getMarker } = _Scene;
const { ColorScale } = _Scale;
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

type LinearGaugeLabelDatum = never;

interface LinearGaugeNodeDataContext
    extends _ModuleSupport.SeriesNodeDataContext<LinearGaugeNodeDatum, LinearGaugeLabelDatum> {
    targetData: LinearGaugeTargetDatum[];
    scaleData: LinearGaugeNodeDatum[];
}

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

    // REMOVE ME
    textAlign: TextAlign = 'center';
    verticalAlign: VerticalAlign = 'middle';

    public originX = 0;
    public originY = 0;
    get horizontal() {
        return this.properties.horizontal;
    }
    get thickness() {
        return this.properties.thickness;
    }

    private readonly scaleGroup = this.contentGroup.appendChild(new Group({ name: 'scaleGroup' }));
    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));
    private readonly itemTargetGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetGroup' }));
    private readonly itemTargetLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetLabelGroup' }));
    // private readonly itemLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemLabelGroup' }));
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
    // private labelSelection: _Scene.Selection<_Scene.Text, LinearGaugeLabelDatum> = Selection.select(
    //     this.itemLabelGroup,
    //     Text
    // );
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

        this.scaleGroup.pointerEvents = PointerEvents.None;
        this.itemTargetLabelGroup.pointerEvents = PointerEvents.None;
        // this.itemLabelGroup.pointerEvents = PointerEvents.None;
    }

    override get hasData(): boolean {
        return true;
    }

    private nodeFactory(): _Scene.Rect {
        return new Rect();
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
        const angleAxis = this.axes[ChartAxisDirection.X];
        if (angleAxis == null) return '';

        const [min, max] = angleAxis.scale.domain;
        const minLog10 = min !== 0 ? Math.ceil(Math.log10(Math.abs(min))) : 0;
        const maxLog10 = max !== 0 ? Math.ceil(Math.log10(Math.abs(max))) : 0;
        const dp = Math.max(2 - Math.max(minLog10, maxLog10), 0);
        return value.toFixed(dp);
    }

    private createLinearGradient(colorScale: _Scale.ColorScale | undefined, bbox: _Scene.BBox) {
        if (colorScale == null) return;

        const { horizontal } = this.properties;

        const stops = colorScale.range.map((color, i, range): _Scene.GradientColorStop => {
            const offset = i > 0 ? i / (range.length - 1) : 0;
            return { offset, color };
        });

        return new LinearGradient('oklch', stops, horizontal ? 90 : 0, bbox);
    }

    private getTargets(): Target[] {
        const { properties } = this;
        const defaultTarget = properties.defaultTarget;
        return Array.from(properties.targets).map((target): Target => {
            const {
                text = defaultTarget.text,
                value = defaultTarget.value ?? 0,
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

            let {
                shape = defaultTarget.shape,
                rotation = defaultTarget.rotation,
                strokeWidth = defaultTarget.strokeWidth,
            } = target;
            switch (placement) {
                case 'before':
                    shape ??= 'triangle';
                    rotation ??= 90;
                    break;
                case 'after':
                    shape ??= 'triangle';
                    rotation ??= -90;
                    break;
                default:
                    shape ??= 'circle';
                    rotation ??= 0;
            }
            rotation = toRadians(rotation);

            strokeWidth ??= shape === 'line' ? 2 : 0;

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

        const { properties, originX, originY } = this;
        const { horizontal, thickness } = properties;
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

            switch (placement) {
                case 'after':
                    textBaseline = 'top';
                    offsetY = offset;
                    break;
                default:
                    textBaseline = 'bottom';
                    offsetY = -offset;
                    break;
            }
        } else {
            textBaseline = 'middle';

            switch (placement) {
                case 'before':
                    textAlign = 'right';
                    offsetX = -offset;
                    break;
                default:
                    textAlign = 'left';
                    offsetX = offset;
                    break;
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

    override async createNodeData() {
        const { id: seriesId, properties, originX, originY } = this;
        const {
            value,
            horizontal,
            thickness,
            cornerRadius,
            cornerMode,
            bar,
            scale,
            // label,
            // secondaryLabel,
            barSpacing,
            defaultColorRange,
        } = properties;
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

        let [x0, x1] = xAxis.range;
        if (xAxis.isReversed()) {
            [x1, x0] = [x0, x1];
        }
        let [y0, y1] = yAxis.range;
        if (yAxis.isReversed()) {
            [y1, y0] = [y0, y1];
        }

        const cornersOnAllItems = cornerMode === 'item';
        let mainAxisInset = 0;
        if (properties.segments == null && cornersOnAllItems) {
            const [m0, m1] = mainAxisScale.range;
            const mainAxisSize = Math.abs(m1 - m0);
            const appliedCornerRadius = Math.min(cornerRadius, thickness / 2, mainAxisSize / 2);
            mainAxisInset = appliedCornerRadius;
        }
        if (mainAxis.isReversed()) {
            mainAxisInset = -mainAxisInset;
        }

        const xAxisInset = horizontal ? mainAxisInset : 0;
        const yAxisInset = horizontal ? 0 : mainAxisInset;

        const containerX = horizontal ? xScale.convert(value) : x1;
        const containerY = horizontal ? y1 : yScale.convert(value);

        const gradientBBox = new BBox(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));

        const horizontalInset = horizontal ? barSpacing / 2 : 0;
        const verticalInset = horizontal ? 0 : barSpacing / 2;

        let barColorScale: _Scale.ColorScale | undefined;
        if (bar.enabled || bar.colorRange != null) {
            barColorScale = new ColorScale();
            barColorScale.domain = [0, 1];
            barColorScale.range = bar.colorRange ?? defaultColorRange;
        }

        let scaleColorScale: _Scale.ColorScale | undefined;
        if (!bar.enabled || scale.colorRange != null) {
            scaleColorScale = new ColorScale();
            scaleColorScale.domain = [0, 1];
            scaleColorScale.range = scale.colorRange ?? defaultColorRange;
        }

        if (properties.segments == null) {
            if (bar.enabled) {
                const barFill: string | _Scene.Gradient | undefined =
                    bar.fill ?? this.createLinearGradient(barColorScale, gradientBBox);
                const sizeParams = cornersOnAllItems
                    ? {
                          x0: originX + x0 - xAxisInset,
                          y0: originY + y0 - yAxisInset,
                          x1: originX + containerX + 2 * xAxisInset,
                          y1: originY + containerY + 2 * yAxisInset,
                          clipX0: undefined,
                          clipY0: undefined,
                          clipX1: undefined,
                          clipY1: undefined,
                      }
                    : {
                          x0: originX + x0,
                          y0: originY + y0,
                          x1: originX + x1,
                          y1: originY + y1,
                          clipX0: originX + x0,
                          clipY0: originY + y0,
                          clipX1: originX + containerX,
                          clipY1: originY + containerY,
                      };

                nodeData.push({
                    series: this,
                    itemId: `value`,
                    datum: value,
                    type: NodeDataType.Node,
                    x0: sizeParams.x0,
                    y0: sizeParams.y0,
                    x1: sizeParams.x1,
                    y1: sizeParams.y1,
                    clipX0: sizeParams.clipX0,
                    clipY0: sizeParams.clipY0,
                    clipX1: sizeParams.clipX1,
                    clipY1: sizeParams.clipY1,
                    topLeftCornerRadius: cornerRadius,
                    topRightCornerRadius: cornerRadius,
                    bottomRightCornerRadius: cornerRadius,
                    bottomLeftCornerRadius: cornerRadius,
                    fill: barFill,
                    horizontalInset,
                    verticalInset,
                });
            }

            const scaleFill: string | _Scene.Gradient | undefined =
                scale.fill ?? this.createLinearGradient(scaleColorScale, gradientBBox) ?? scale.defaultFill;

            scaleData.push({
                series: this,
                itemId: `scale`,
                datum: value,
                type: NodeDataType.Node,
                x0: originX + x0 - xAxisInset,
                y0: originY + y0 - yAxisInset,
                x1: originX + x1 + 2 * xAxisInset,
                y1: originY + y1 + 2 * yAxisInset,
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
            let segments: number[];
            if (Array.isArray(properties.segments)) {
                segments = properties.segments.filter((v) => v > domain[0] && v < domain[1]).sort((a, b) => a - b);
                segments = [domain[0], ...segments, domain[1]];
            } else {
                const numSegments = properties.segments;
                segments = Array.from(
                    { length: properties.segments + 1 },
                    (_, i) => (i / numSegments) * (domain[1] - domain[0]) + domain[0]
                );
            }

            for (let i = 0; i < segments.length - 1; i += 1) {
                const startValue = segments[i + 0];
                const endValue = segments[i + 1];
                const colorValue = i > 0 ? i / (segments.length - 2) : 0;

                const isStart = i === 0;
                const isEnd = i === segments.length - 2;

                const itemStart = mainAxisScale.convert(startValue);
                const itemEnd = mainAxisScale.convert(endValue);

                const startCornerRadius = cornersOnAllItems || isStart ? cornerRadius : 0;
                const endCornerRadius = cornersOnAllItems || isEnd ? cornerRadius : 0;
                const topLeftCornerRadius = horizontal ? startCornerRadius : endCornerRadius;
                const topRightCornerRadius = endCornerRadius;
                const bottomRightCornerRadius = horizontal ? endCornerRadius : startCornerRadius;
                const bottomLeftCornerRadius = startCornerRadius;

                if (bar.enabled) {
                    const barFill = bar.fill ?? barColorScale?.convert(colorValue);

                    nodeData.push({
                        series: this,
                        itemId: `value-${i}`,
                        datum: value,
                        type: NodeDataType.Node,
                        x0: originX + (horizontal ? itemStart : x0),
                        y0: originY + (horizontal ? y0 : itemStart),
                        x1: originX + (horizontal ? itemEnd : x1),
                        y1: originY + (horizontal ? y1 : itemEnd),
                        clipX0: originX + x0,
                        clipY0: originY + y0,
                        clipX1: originX + containerX,
                        clipY1: originY + containerY,
                        topLeftCornerRadius,
                        topRightCornerRadius,
                        bottomRightCornerRadius,
                        bottomLeftCornerRadius,
                        fill: barFill,
                        horizontalInset,
                        verticalInset,
                    });
                }

                const scaleFill = scale.fill ?? scaleColorScale?.convert(colorValue) ?? scale.defaultFill;

                scaleData.push({
                    series: this,
                    itemId: `scale-${i}`,
                    datum: value,
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

        // if (label.enabled) {
        //     const { color: fill, fontSize, fontStyle, fontWeight, fontFamily, lineHeight, formatter } = label;
        //     labelData.push({
        //         label: LabelType.Primary,
        //         centerX,
        //         centerY,
        //         text: label.text,
        //         value,
        //         fill,
        //         fontSize,
        //         fontStyle,
        //         fontWeight,
        //         fontFamily,
        //         lineHeight,
        //         formatter,
        //     });
        // }

        // if (secondaryLabel.enabled) {
        //     const { color: fill, fontSize, fontStyle, fontWeight, fontFamily, lineHeight, formatter } = secondaryLabel;
        //     labelData.push({
        //         label: LabelType.Secondary,
        //         centerX,
        //         centerY,
        //         text: secondaryLabel.text,
        //         value,
        //         fill,
        //         fontSize,
        //         fontStyle,
        //         fontWeight,
        //         fontFamily,
        //         lineHeight,
        //         formatter,
        //     });
        // }

        for (let i = 0; i < targets.length; i += 1) {
            const target = targets[i];
            const {
                value: targetValue,
                text,
                shape,
                rotation,
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

            targetData.push({
                series: this,
                itemId: `target-${i}`,
                midPoint: targetPoint,
                datum: targetValue,
                type: NodeDataType.Target,
                value: targetValue,
                text,
                x: targetPoint.x,
                y: targetPoint.y,
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
            // labelSelection,
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
        // const labelData = this.contextNodeData?.labelData ?? [];
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

        // this.labelSelection = await this.updateLabelSelection({ labelData, labelSelection });
        // await this.updateLabelNodes({ labelSelection });

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

            if (animationDisabled) {
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
        const { horizontal } = this.properties;
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
            target.rotation = (horizontal ? Math.PI / 2 : 0) + rotation;
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

    // private async updateLabelSelection(opts: {
    //     labelData: LinearGaugeLabelDatum[];
    //     labelSelection: _Scene.Selection<_Scene.Text, LinearGaugeLabelDatum>;
    // }) {
    //     return opts.labelSelection.update(opts.labelData, undefined, (datum) => datum.label);
    // }

    // private async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, LinearGaugeLabelDatum> }) {
    //     const { labelSelection } = opts;
    //     const animationDisabled = this.ctx.animationManager.isSkipped();

    //     labelSelection.each((label, datum) => {
    //         label.fill = datum.fill;
    //         label.fontStyle = datum.fontStyle;
    //         label.fontWeight = datum.fontWeight;
    //         label.fontFamily = datum.fontFamily;
    //     });

    //     if (animationDisabled || this.labelsHaveExplicitText()) {
    //         this.formatLabelText();
    //     }
    // }

    // labelsHaveExplicitText() {
    //     for (const { datum } of this.labelSelection) {
    //         if (datum.text == null) {
    //             return false;
    //         }
    //     }

    //     return true;
    // }

    // formatLabelText(datum?: { label: number; secondaryLabel: number }) {
    //     const angleAxis = this.axes[ChartAxisDirection.X];
    //     if (angleAxis == null) return;

    //     const { labelSelection, textAlign, verticalAlign } = this;
    //     const { label, secondaryLabel, margin: padding } = this.properties;

    //     formatLinearGaugeLabels(
    //         this,
    //         labelSelection,
    //         label,
    //         secondaryLabel,
    //         { padding, textAlign, verticalAlign },
    //         0,
    //         (value) => this.formatLabel(value),
    //         datum
    //     );
    // }

    protected resetAllAnimation() {
        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        resetMotion([this.datumSelection], resetLinearGaugeSeriesResetRectFunction);
        // this.formatLabelText();
    }

    resetAnimation(phase: _ModuleSupport.ChartAnimationPhase) {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        } else if (phase === 'ready') {
            this.animationState.transition('skip');
        }
    }

    // private animateLabelText(params: { from?: number; phase?: _ModuleSupport.AnimationPhase } = {}) {
    //     const { animationManager } = this.ctx;

    //     let labelFrom = 0;
    //     let labelTo = 0;
    //     let secondaryLabelFrom = 0;
    //     let secondaryLabelTo = 0;
    //     this.labelSelection.each((label, datum) => {
    //         // Reset animation
    //         label.opacity = 1;

    //         if (datum.label === LabelType.Primary) {
    //             labelFrom = label.previousDatum?.value ?? params.from ?? datum.value;
    //             labelTo = datum.value;
    //         } else if (datum.label === LabelType.Secondary) {
    //             secondaryLabelFrom = label.previousDatum?.value ?? params.from ?? datum.value;
    //             secondaryLabelTo = datum.value;
    //         }
    //     });

    //     if (this.labelsHaveExplicitText()) {
    //         // Ignore
    //     } else if (labelFrom === labelTo && secondaryLabelFrom === secondaryLabelTo) {
    //         this.formatLabelText({ label: labelTo, secondaryLabel: secondaryLabelTo });
    //     } else if (!this.labelsHaveExplicitText()) {
    //         const animationId = `${this.id}_labels`;

    //         animationManager.animate({
    //             id: animationId,
    //             groupId: 'label',
    //             from: { label: labelFrom, secondaryLabel: secondaryLabelFrom },
    //             to: { label: labelTo, secondaryLabel: secondaryLabelTo },
    //             phase: params.phase ?? 'update',
    //             onUpdate: (datum) => this.formatLabelText(datum),
    //         });
    //     }
    // }

    animateEmptyUpdateReady() {
        const { animationManager } = this.ctx;

        const { node } = prepareLinearGaugeSeriesAnimationFunctions(true, this.horizontal);
        fromToMotion(this.id, 'node', animationManager, [this.datumSelection], node, (_sector, datum) => datum.itemId!);

        // fromToMotion(
        //     this.id,
        //     'label',
        //     animationManager,
        //     [this.labelSelection],
        //     fadeInFns,
        //     (_label, datum) => datum.label
        // );

        // this.animateLabelText({ from: 0, phase: 'initial' });
    }

    animateWaitingUpdateReady() {
        const { animationManager } = this.ctx;

        const { node } = prepareLinearGaugeSeriesAnimationFunctions(false, this.horizontal);
        fromToMotion(this.id, 'node', animationManager, [this.datumSelection], node, (_sector, datum) => datum.itemId!);

        // this.animateLabelText();
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

    private readonly nodeDatum: any = { series: this, datum: this };
    override pickNode(
        point: _Scene.Point,
        intent: _ModuleSupport.SeriesNodePickIntent
    ): _ModuleSupport.PickResult | undefined {
        switch (intent) {
            case 'event':
            case 'context-menu':
                return undefined;
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
                    : { pickMode: _ModuleSupport.SeriesNodePickMode.NEAREST_NODE, match: this.nodeDatum, distance: 0 };
            }
        }
    }

    override getTooltipHtml(nodeDatum: _ModuleSupport.SeriesNodeDatum): _ModuleSupport.TooltipContent {
        const { id: seriesId, properties } = this;

        if (!properties.isValid()) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const datum = this.highlightDatum(nodeDatum);

        const value = datum?.value ?? properties.value;
        const text = datum?.text;
        const { tooltip } = properties;

        const title = text ?? '';
        const content = this.formatLabel(value);

        const itemId = datum?.itemId;
        const color = datum?.fill;

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
