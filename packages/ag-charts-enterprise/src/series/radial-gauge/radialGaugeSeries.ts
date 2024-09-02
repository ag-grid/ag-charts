import { type TextAlign, type VerticalAlign, _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { LineMarker } from './lineMarker';
import { RadialGaugeNeedle } from './radialGaugeNeedle';
import {
    type AgRadialGaugeColorStopDatum,
    LabelType,
    NodeDataType,
    type RadialGaugeLabelDatum,
    type RadialGaugeNodeDatum,
    RadialGaugeSeriesProperties,
    type RadialGaugeTargetDatum,
    type RadialGaugeTargetProperties,
} from './radialGaugeSeriesProperties';
import {
    clipSectorVisibility,
    computeClipSector,
    fadeInFns,
    formatRadialGaugeLabels,
    getLabelText,
    prepareRadialGaugeSeriesAnimationFunctions,
    resetRadialGaugeSeriesAnimationFunctions,
} from './radialGaugeUtil';

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
const { Group, PointerEvents, Selection, Sector, Text, ConicGradient, getMarker } = _Scene;
const { ColorScale } = _Scale;
const { normalizeAngle360, normalizeAngle360Inclusive, toDegrees, toRadians } = _Util;

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
    backgroundData: RadialGaugeNodeDatum[];
}

const outsideLabelPlacements: _Util.LabelPlacement[] = ['bottom-right', 'bottom-left', 'top-left', 'top-right'];
const insideLabelPlacements: _Util.LabelPlacement[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

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

    private readonly backgroundGroup = this.contentGroup.appendChild(new Group({ name: 'backgroundGroup' }));
    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));
    private readonly itemNeedleGroup = this.contentGroup.appendChild(new Group({ name: 'itemNeedleGroup' }));
    private readonly itemTargetGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetGroup' }));
    private readonly itemTargetLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetLabelGroup' }));
    private readonly itemLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemLabelGroup' }));
    private readonly highlightTargetGroup = this.highlightGroup.appendChild(
        new Group({ name: 'itemTargetLabelGroup' })
    );

    private backgroundSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum> = Selection.select(
        this.backgroundGroup,
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
    private targetLabelSelection: _Scene.Selection<_Scene.Text, _Util.PlacedLabel<_Util.PointLabelDatum>> =
        Selection.select(this.itemTargetLabelGroup, Text);
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

        this.backgroundGroup.pointerEvents = PointerEvents.None;
        this.itemTargetLabelGroup.pointerEvents = PointerEvents.None;
        this.itemLabelGroup.pointerEvents = PointerEvents.None;
    }

    override get hasData(): boolean {
        return true;
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
        const angleAxis = this.axes[ChartAxisDirection.X];
        if (angleAxis == null) return '';

        const [min, max] = angleAxis.scale.domain;
        const minLog10 = min !== 0 ? Math.ceil(Math.log10(Math.abs(min))) : 0;
        const maxLog10 = max !== 0 ? Math.ceil(Math.log10(Math.abs(max))) : 0;
        const dp = Math.max(2 - Math.max(minLog10, maxLog10), 0);
        return value.toFixed(dp);
    }

    private getColorStops(domain: number[], mode: 'continuous' | 'segmented') {
        const [min, max] = domain;
        const domainRange = max - min;

        const { colorStops, defaultColorStops } = this.properties;
        if (colorStops.length === 0) {
            return defaultColorStops.map((color, index, { length }) => ({
                color,
                stop: ((max - min) * index) / (length - 1) + min,
            }));
        }

        const segmented = mode === 'segmented';
        const rangeDelta = segmented ? 1 : 0;

        const stops = new Float64Array(colorStops.length);
        let previousDefinedStopIndex = 0;
        let nextDefinedStopIndex = -1;
        for (let i = 0; i < colorStops.length; i += 1) {
            const colorStop = colorStops[i];

            if (i >= nextDefinedStopIndex) {
                nextDefinedStopIndex = colorStops.length - 1;

                for (let j = i + 1; j < colorStops.length; j += 1) {
                    if (colorStops[j].stop != null) {
                        nextDefinedStopIndex = j;
                        break;
                    }
                }
            }

            let { stop } = colorStop;

            if (stop == null) {
                const value0 = colorStops[previousDefinedStopIndex].stop ?? min;
                const value1 = colorStops[nextDefinedStopIndex].stop ?? max;
                stop =
                    value0 +
                    ((value1 - value0) * (i - previousDefinedStopIndex)) /
                        (nextDefinedStopIndex - previousDefinedStopIndex + rangeDelta);
            } else {
                previousDefinedStopIndex = i;
            }

            stops[i] = stop;
        }

        let colorScale: _Scale.ColorScale | undefined;
        let lastDefinedColor = colorStops.find((c) => c.color != null)?.color;

        return colorStops.map(({ color }, i): AgRadialGaugeColorStopDatum => {
            const stop = stops[i];

            if (color != null) {
                lastDefinedColor = color;
            } else if (lastDefinedColor != null) {
                color = lastDefinedColor;
            } else {
                if (colorScale == null) {
                    colorScale = new ColorScale();
                    colorScale.domain = domain;
                    colorScale.range = defaultColorStops;
                }

                if (segmented) {
                    const nextStop = i < stops.length - 1 ? stops[i + 1] : max;
                    const adjustedStop = (stop / (domainRange - (nextStop - stop))) * domainRange + min;
                    color = colorScale.convert(adjustedStop);
                } else {
                    color = colorScale.convert(stop);
                }
            }

            return { stop, color };
        });
    }

    private createConicGradient(
        colorStops: AgRadialGaugeColorStopDatum[] | undefined,
        [min, max]: number[],
        startAngle: number,
        endAngle: number
    ) {
        if (colorStops == null) return;

        const conicAngle = normalizeAngle360((startAngle + endAngle) / 2 + Math.PI);
        const sweepAngle = normalizeAngle360Inclusive(endAngle - startAngle);

        const stops = colorStops.map((colorStop): _Scene.GradientColorStop => {
            const { stop, color } = colorStop;
            const angle = startAngle + (sweepAngle * stop - min) / (max - min);
            const offset = (angle - conicAngle) / (2 * Math.PI);
            return { offset, color };
        });

        return new ConicGradient('oklch', stops, toDegrees(conicAngle) - 90);
    }

    private getTargetRadius(targetProperties: RadialGaugeTargetProperties) {
        const { radius, properties } = this;
        const { innerRadiusRatio, outerRadiusRatio, target } = properties;
        const { placement = target.placement, spacing = target.spacing, size = target.size } = targetProperties;

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

    override async createNodeData() {
        const angleAxis = this.axes[ChartAxisDirection.X];
        if (angleAxis == null) return;

        const { id: seriesId, properties, radius, centerX, centerY } = this;
        const {
            value,
            innerRadiusRatio,
            outerRadiusRatio,
            cornerRadius,
            appearance,
            cornerMode,
            needle,
            targets,
            bar,
            background,
            label,
            secondaryLabel,
        } = properties;

        const { domain } = angleAxis.scale;
        const colorStops = this.getColorStops(domain, appearance);
        const nodeData: RadialGaugeNodeDatum[] = [];
        const targetData: RadialGaugeTargetDatum[] = [];
        const needleData: RadialGaugeNeedleDatum[] = [];
        const labelData: RadialGaugeLabelDatum[] = [];
        const backgroundData: RadialGaugeNodeDatum[] = [];

        const [startAngle, endAngle] = angleAxis.range;
        const angleScale = angleAxis.scale;

        const outerRadius = radius * outerRadiusRatio;
        const innerRadius = radius * innerRadiusRatio;

        const isContinuous = appearance === 'continuous';
        const cornersOnAllItems = cornerMode === 'item';
        let angleInset = 0;
        if (isContinuous && cornersOnAllItems) {
            const appliedCornerRadius = Math.min(cornerRadius, (outerRadius - innerRadius) / 2);
            angleInset = appliedCornerRadius / ((innerRadius + outerRadius) / 2);
        }

        const containerStartAngle = angleScale.convert(domain[0]);
        const containerEndAngle = angleScale.convert(value);

        if (isContinuous) {
            if (bar.enabled) {
                const barFill: string | _Scene.Gradient | undefined =
                    bar.fill ?? this.createConicGradient(colorStops, domain, startAngle, endAngle);
                const angleParams = cornersOnAllItems
                    ? {
                          startAngle: containerStartAngle - angleInset,
                          endAngle: containerEndAngle + angleInset,
                          clipStartAngle: undefined,
                          clipEndAngle: undefined,
                      }
                    : {
                          startAngle: startAngle,
                          endAngle: endAngle,
                          clipStartAngle: containerStartAngle,
                          clipEndAngle: containerEndAngle,
                      };
                nodeData.push({
                    series: this,
                    itemId: `value`,
                    datum: value,
                    type: NodeDataType.Node,
                    centerX,
                    centerY,
                    outerRadius,
                    innerRadius,
                    startAngle: angleParams.startAngle,
                    endAngle: angleParams.endAngle,
                    clipStartAngle: angleParams.clipStartAngle,
                    clipEndAngle: angleParams.clipEndAngle,
                    startCornerRadius: cornerRadius,
                    endCornerRadius: cornerRadius,
                    fill: barFill,
                });
            }

            const backgroundFill: string | _Scene.Gradient | undefined =
                background.fill ??
                this.createConicGradient(!bar.enabled ? colorStops : undefined, domain, startAngle, endAngle) ??
                background.defaultFill;

            backgroundData.push({
                series: this,
                itemId: `background`,
                datum: value,
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
                fill: backgroundFill,
            });
        } else {
            let stops: Array<{ startValue: number; endValue: number; color: string | undefined }>;
            const domainRange = domain[1] - domain[0];
            if (this.properties.colorStops.length !== 0) {
                // User provided colour stops
                stops = colorStops.map(({ color, stop }, i) => {
                    const startValue = i > 0 ? stop : domain[0];
                    const endValue = i < colorStops.length - 1 ? colorStops[i + 1].stop : domain[1];
                    return { startValue, endValue, color };
                });
            } else {
                // No colour stops defined, use the theme
                const colorScale = new ColorScale();
                colorScale.domain = domain;
                colorScale.range = colorStops.map((cs) => cs.color);

                const ticks = angleAxis.scale.ticks?.().length;
                const numSegments = ticks != null ? ticks - 1 : 8;

                stops = Array.from({ length: numSegments }, (_, i) => {
                    const startValue = domain[0] + (i + 0) * (domainRange / numSegments);
                    const endValue = domain[0] + (i + 1) * (domainRange / numSegments);
                    const colorScaleValue = domain[0] + i * (domainRange / (numSegments - 1));
                    const color = colorScale?.convert(colorScaleValue);
                    return { startValue, endValue, color };
                });
            }

            for (let i = 0; i < stops.length; i += 1) {
                const { startValue, endValue, color } = stops[i];
                const isStart = i === 0;
                const isEnd = i === stops.length - 1;

                const itemStartAngle = angleScale.convert(startValue);
                const itemEndAngle = angleScale.convert(endValue);

                if (bar.enabled) {
                    const barFill = bar.fill ?? color;

                    nodeData.push({
                        series: this,
                        itemId: `value-${i}`,
                        datum: value,
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

                const backgroundBarFill = !bar.enabled ? color : undefined;
                const backgroundFill = background.fill ?? backgroundBarFill ?? background.defaultFill;

                backgroundData.push({
                    series: this,
                    itemId: `background-${i}`,
                    datum: value,
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
                    fill: backgroundFill,
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

        const { target } = properties;
        for (let i = 0; i < targets.length; i += 1) {
            const t = targets[i];
            const {
                value: targetValue,
                text,
                placement = target.placement,
                size = target.size,
                fill = target.fill,
                fillOpacity = target.fillOpacity,
                stroke = target.stroke,
                strokeOpacity = target.strokeOpacity,
                lineDash = target.lineDash,
                lineDashOffset = target.lineDashOffset,
            } = t;

            const targetRadius = this.getTargetRadius(t);
            const targetAngle = angleScale.convert(targetValue);

            let { shape = target.shape, rotation = target.rotation } = t;
            switch (placement) {
                case 'outside':
                    shape ??= 'triangle';
                    rotation ??= 180;
                    break;
                case 'inside':
                    shape ??= 'triangle';
                    rotation ??= 0;
                    break;
                default:
                    shape ??= 'circle';
                    rotation ??= 0;
            }
            rotation = toRadians(rotation);

            const strokeWidth = t.strokeWidth ?? target.strokeWidth ?? (shape === 'line' ? 2 : 0);

            targetData.push({
                series: this,
                itemId: `target-${i}`,
                midPoint: {
                    x: targetRadius * Math.cos(targetAngle) + centerX,
                    y: targetRadius * Math.sin(targetAngle) + centerY,
                },
                datum: targetValue,
                type: NodeDataType.Target,
                value: targetValue,
                text,
                centerX,
                centerY,
                shape,
                radius: targetRadius,
                angle: targetAngle,
                size,
                rotation,
                fill,
                fillOpacity,
                stroke,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
            });
        }

        return {
            itemId: seriesId,
            nodeData,
            needleData,
            targetData,
            labelData,
            backgroundData,
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
            backgroundSelection,
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
        const backgroundData = this.contextNodeData?.backgroundData ?? [];

        const highlightTargetDatum = this.highlightDatum(this.ctx.highlightManager.getActiveHighlight());

        this.backgroundSelection = await this.updateBackgroundSelection({ backgroundData, backgroundSelection });
        await this.updateBackgroundNodes({ backgroundSelection });

        this.needleSelection = await this.updateNeedleSelection({ needleData, needleSelection });
        await this.updateNeedleNodes({ needleSelection });

        this.targetSelection = await this.updateTargetSelection({ targetData, targetSelection });
        await this.updateTargetNodes({ targetSelection, isHighlight: false });

        this.targetLabelSelection = await this.updateTargetLabelSelection({ targetLabelSelection });
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
        const { sectorSpacing, bar } = properties;
        const { fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = bar;
        const strokeWidth = this.getStrokeWidth(bar.strokeWidth);
        const animationDisabled = ctx.animationManager.isSkipped();

        datumSelection.each((sector, datum) => {
            const {
                centerX,
                centerY,
                innerRadius,
                outerRadius,
                startAngle,
                endAngle,
                startCornerRadius,
                endCornerRadius,
                fill,
            } = datum;
            sector.centerX = centerX;
            sector.centerY = centerY;
            if (animationDisabled) {
                const clipSector = computeClipSector(datum);

                sector.innerRadius = innerRadius;
                sector.outerRadius = outerRadius;
                sector.startAngle = startAngle;
                sector.endAngle = endAngle;
                sector.clipSector = clipSector;

                sector.visible = clipSector == null || clipSectorVisibility(startAngle, endAngle, clipSector);
            }

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
        });
    }

    private async updateBackgroundSelection(opts: {
        backgroundData: RadialGaugeNodeDatum[];
        backgroundSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum>;
    }) {
        return opts.backgroundSelection.update(opts.backgroundData, undefined, (datum) => {
            return createDatumId(opts.backgroundData.length, datum.itemId!);
        });
    }

    private async updateBackgroundNodes(opts: {
        backgroundSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum>;
    }) {
        const { backgroundSelection } = opts;
        const { sectorSpacing, background } = this.properties;
        const { fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = background;

        backgroundSelection.each((sector, datum) => {
            const {
                centerX,
                centerY,
                innerRadius,
                outerRadius,
                startAngle,
                endAngle,
                startCornerRadius,
                endCornerRadius,
                fill,
            } = datum;
            sector.centerX = centerX;
            sector.centerY = centerY;
            sector.innerRadius = innerRadius;
            sector.outerRadius = outerRadius;
            sector.startAngle = startAngle;
            sector.endAngle = endAngle;
            sector.clipSector = computeClipSector(datum);

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
            const { centerX, centerY, radius, angle } = datum;

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
                needle.rotation = angle;
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
            target.rotation = angle + Math.PI / 2 + rotation;
        });
    }

    private async updateTargetLabelSelection(opts: {
        targetLabelSelection: _Scene.Selection<_Scene.Text, _Util.PlacedLabel<_Util.PointLabelDatum>>;
    }) {
        const targetLabelData = this.chart?.placeLabels(this.properties.target.label.spacing).get(this) ?? [];
        return opts.targetLabelSelection.update(targetLabelData);
    }

    private async updateTargetLabelNodes(opts: {
        targetLabelSelection: _Scene.Selection<_Scene.Text, _Util.PlacedLabel<_Util.PointLabelDatum>>;
    }) {
        const { targetLabelSelection } = opts;
        const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = this.properties.target.label;

        targetLabelSelection.each((label, { x, y, width, height, text }) => {
            label.visible = true;
            label.x = x + width / 2;
            label.y = y + height / 2;
            label.text = text;
            label.fill = fill;
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;
            label.fontSize = fontSize;
            label.fontFamily = fontFamily;
            label.textAlign = 'center';
            label.textBaseline = 'middle';
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

    formatLabelText(datum?: { label: number; secondaryLabel: number }) {
        const angleAxis = this.axes[ChartAxisDirection.X];
        if (angleAxis == null) return;

        const { labelSelection, radius, textAlign, verticalAlign } = this;
        const { label, secondaryLabel, margin: padding, innerRadiusRatio } = this.properties;

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

        resetMotion([this.backgroundSelection, this.datumSelection], resetRadialGaugeSeriesAnimationFunctions);
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
        let secondaryLabelFrom = 0;
        let secondaryLabelTo = 0;
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

        this.animateLabelText({ from: 0, phase: 'initial' });
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
        const angleAxis = this.axes[ChartAxisDirection.X];
        if (angleAxis == null) return [];

        const { radius, centerX, centerY, properties } = this;
        const { innerRadiusRatio, outerRadiusRatio, target } = properties;
        const { label } = target;
        const angleScale = angleAxis.scale;

        const gaugeThickness = radius * (outerRadiusRatio - innerRadiusRatio);

        const font = label.getFont();
        const textMeasurer = CachedTextMeasurerPool.getMeasurer({ font });

        return this.properties.targets
            .filter((t) => t.text != null)
            .map((t) => {
                const { text = '', value, shape = target.shape, size = target.size, placement = target.placement } = t;
                const { width, height } = textMeasurer.measureText(text);
                const angle = angleScale.convert(value);

                const sizeOffset = (size / 2) * Math.min(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)));
                const quadrant = (normalizeAngle360(angle) / (Math.PI / 2)) | 0;

                let labelPlacement: _Util.LabelPlacement;
                let radiusOffset = 0;
                switch (placement) {
                    case 'outside':
                        labelPlacement = outsideLabelPlacements[quadrant];
                        radiusOffset = sizeOffset;
                        break;
                    case 'inside':
                        labelPlacement = insideLabelPlacements[quadrant];
                        radiusOffset = -sizeOffset;
                        break;
                    default:
                        labelPlacement = 'top';
                        break;
                }

                const targetRadius = this.getTargetRadius(t) - radiusOffset;

                let point: _Scene.SizedPoint;
                if (shape === 'line' && placement === 'middle' && size >= gaugeThickness) {
                    point = {
                        x: (targetRadius + size / 2) * Math.cos(angle) + centerX,
                        y: (targetRadius + size / 2) * Math.sin(angle) + centerY,
                        size: 1,
                    };
                } else {
                    point = {
                        x: targetRadius * Math.cos(angle) + centerX,
                        y: targetRadius * Math.sin(angle) + centerY,
                        size,
                    };
                }

                return {
                    point,
                    marker: undefined,
                    label: { text, width, height },
                    placement: labelPlacement,
                };
            });
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override getLegendData(
        _legendType: unknown
    ): _ModuleSupport.ChartLegendDatum<any>[] | _ModuleSupport.ChartLegendDatum<_ModuleSupport.ChartLegendType>[] {
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
