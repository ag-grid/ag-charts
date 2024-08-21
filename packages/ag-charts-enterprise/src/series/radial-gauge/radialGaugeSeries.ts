import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { AngleNumberAxis } from '../../axes/angle-number/angleNumberAxis';
import { RadialGaugeNeedle } from './radialGaugeNeedle';
import {
    LabelType,
    type RadialGaugeLabelDatum,
    type RadialGaugeNodeDatum,
    RadialGaugeSeriesProperties,
    type RadialGaugeTargetDatum,
} from './radialGaugeSeriesProperties';
import {
    clipSectorVisibility,
    computeClipSector,
    fadeInFns,
    formatRadialGaugeLabels,
    prepareRadialGaugeSeriesAnimationFunctions,
    resetRadialGaugeSeriesAnimationFunctions,
} from './radialGaugeUtil';

const { fromToMotion, resetMotion, SeriesNodePickMode, StateMachine, createDatumId, EMPTY_TOOLTIP_CONTENT } =
    _ModuleSupport;
const { Group, PointerEvents, Selection, Sector, Text, getMarker } = _Scene;
const { LinearScale, ColorScale } = _Scale;

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

export class RadialGaugeSeries extends _ModuleSupport.Series<
    RadialGaugeNodeDatum,
    RadialGaugeSeriesProperties,
    RadialGaugeLabelDatum,
    RadialGaugeNodeDataContext
> {
    static readonly className = 'RadialGaugeSeries';
    static readonly type = 'radial-gauge' as const;

    override properties = new RadialGaugeSeriesProperties();

    public radius: number = 0;
    private readonly axis: AngleNumberAxis;

    public getNodeData(): RadialGaugeNodeDatum[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    private readonly backgroundGroup = this.contentGroup.appendChild(new Group({ name: 'backgroundGroup' }));
    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));
    private readonly itemNeedleGroup = this.contentGroup.appendChild(new Group({ name: 'itemNeedleGroup' }));
    private readonly itemTargetGroup = this.contentGroup.appendChild(new Group({ name: 'itemTargetGroup' }));
    private readonly itemLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemLabelGroup' }));

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
    private labelSelection: _Scene.Selection<_Scene.Text, RadialGaugeLabelDatum> = Selection.select(
        this.itemLabelGroup,
        Text
    );
    private highlightDatumSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum> = Selection.select(
        this.highlightNode,
        () => this.nodeFactory()
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

        this.axis = new AngleNumberAxis(moduleCtx);

        this.backgroundGroup.pointerEvents = PointerEvents.None;
        this.itemLabelGroup.pointerEvents = PointerEvents.None;
    }

    override get hasData(): boolean {
        return true;
    }

    private nodeFactory(): _Scene.Sector {
        return new Sector();
    }

    private markerFactory(datum: RadialGaugeTargetDatum): _Scene.Marker {
        const { shape = 'circle' } = datum;
        const MarkerShape = getMarker(shape);
        const marker = new MarkerShape();
        marker.size = 1;
        return marker;
    }

    override async processData(): Promise<void> {
        this.nodeDataRefresh = true;

        this.animationState.transition('updateData');
    }

    private createDefaultLabelFormatter() {
        const [r0, r1] = this.properties.range;
        const r0Log10 = r0 !== 0 ? Math.ceil(Math.log10(Math.abs(r0))) : 0;
        const r1Log10 = r1 !== 0 ? Math.ceil(Math.log10(Math.abs(r1))) : 0;
        const dp = Math.max(2 - Math.max(r0Log10, r1Log10), 0);
        return (value: number) => value.toFixed(dp);
    }

    override async createNodeData() {
        const { id: seriesId, properties } = this;
        const { width, height } = this.chart!.seriesRect!;
        const {
            value,
            range: domain,
            innerRadiusRatio,
            outerRadiusRatio,
            startAngle,
            endAngle,
            cornerRadius,
            itemMode,
            cornerMode,
            needle,
            targets,
            foreground,
            background,
            label,
            secondaryLabel,
        } = properties;
        const colorStops = properties.colorStops.length !== 0 ? properties.colorStops : undefined;
        const nodeData: RadialGaugeNodeDatum[] = [];
        const targetData: RadialGaugeTargetDatum[] = [];
        const needleData: RadialGaugeNeedleDatum[] = [];
        const labelData: RadialGaugeLabelDatum[] = [];
        const backgroundData: RadialGaugeNodeDatum[] = [];

        this.radius = Math.min(width, height) / 2;

        const centerX = width / 2;
        const centerY = height / 2;
        const outerRadius = this.radius * outerRadiusRatio;
        const innerRadius = this.radius * innerRadiusRatio;

        const isContinuous = itemMode === 'continuous';
        const cornersOnAllItems = cornerMode === 'item';
        let angleInset = 0;
        if (isContinuous && cornersOnAllItems) {
            const appliedCornerRadius = Math.min(cornerRadius, (outerRadius - innerRadius) / 2);
            angleInset = appliedCornerRadius / ((innerRadius + outerRadius) / 2);
        }

        const range: [number, number] = [startAngle + angleInset, endAngle - angleInset];

        this.axis.setDomain(domain);
        this.axis.range = range;

        const scale = new LinearScale();
        scale.domain = domain;
        scale.range = range;

        const containerStartAngle = scale.convert(domain[0]);
        const containerEndAngle = scale.convert(value);

        let foregroundColorScale: _Scale.ColorScale | undefined;
        if (foreground.colorRange != null) {
            foregroundColorScale = new ColorScale();
            foregroundColorScale.domain = domain;
            foregroundColorScale.range = foreground.colorRange!;
        }

        let backgroundColorScale: _Scale.ColorScale | undefined;
        if (background.colorRange != null) {
            backgroundColorScale = new ColorScale();
            backgroundColorScale.domain = domain;
            backgroundColorScale.range = background.colorRange!;
        }

        if (isContinuous) {
            if (foreground.enabled) {
                const { fill } = foreground;
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
                    fill,
                });
            }

            if (background.enabled) {
                const { fill } = background;
                backgroundData.push({
                    series: this,
                    itemId: `background`,
                    datum: value,
                    centerX,
                    centerY,
                    outerRadius,
                    innerRadius,
                    startAngle: startAngle,
                    endAngle: endAngle,
                    clipStartAngle: undefined,
                    clipEndAngle: undefined,
                    startCornerRadius: cornerRadius,
                    endCornerRadius: cornerRadius,
                    fill,
                });
            }
        } else {
            const colorRangeStops = colorStops?.length ?? 8;
            const domainStep = (domain[1] - domain[0]) / colorRangeStops;

            let value0 = domain[0];
            for (let i = 0; i < colorRangeStops; i += 1) {
                const colorStop = colorStops?.[i];
                const isStart = i === 0;
                const isEnd = i === colorRangeStops - 1;
                const value1 = colorStop != null ? colorStop.stop ?? domain[1] : value0 + domainStep;
                const itemStartAngle = scale.convert(value0);
                const itemEndAngle = scale.convert(value1);

                if (foreground.enabled) {
                    const fill = colorStop?.color ?? foregroundColorScale?.convert(value0) ?? foreground.fill;

                    nodeData.push({
                        series: this,
                        itemId: `value-${i}`,
                        datum: value,
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
                        fill,
                    });
                }

                if (background.enabled) {
                    const fill = backgroundColorScale?.convert(value0) ?? background.fill;

                    backgroundData.push({
                        series: this,
                        itemId: `background-${i}`,
                        datum: value,
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
                        fill,
                    });
                }

                value0 = value1;
            }
        }

        if (label.enabled) {
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

        if (secondaryLabel.enabled) {
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
            const { spacing } = needle;
            let radius = needle.radiusRatio != null ? this.radius * needle.radiusRatio : innerRadius;
            radius = Math.max(radius - spacing, 0);
            const angle = scale.convert(value);

            needleData.push({
                centerX,
                centerY,
                radius,
                angle,
            });
        }

        for (let index = 0; index < targets.length; index += 1) {
            const target = targets[index];
            const {
                value,
                shape,
                sizeRatio,
                radiusRatio,
                rotation,
                fill,
                fillOpacity,
                stroke,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
            } = target;
            const angle = scale.convert(value);
            const radius = radiusRatio != null ? radiusRatio * this.radius : (innerRadius + outerRadius) / 2;
            const size = sizeRatio * this.radius;
            targetData.push({
                index,
                centerX,
                centerY,
                shape,
                radius,
                angle,
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

    async updateSelections(): Promise<void> {
        if (this.nodeDataRefresh) {
            this.contextNodeData = await this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    override async update(): Promise<void> {
        const {
            datumSelection,
            labelSelection,
            needleSelection,
            targetSelection,
            backgroundSelection,
            highlightDatumSelection,
        } = this;

        await this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity = this.getOpacity();

        const isHighlight = this.ctx.highlightManager?.getActiveHighlight()?.series === this;

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];
        const needleData = this.contextNodeData?.needleData ?? [];
        const targetData = this.contextNodeData?.targetData ?? [];
        const backgroundData = this.contextNodeData?.backgroundData ?? [];

        this.backgroundSelection = await this.updateBackgroundSelection({ backgroundData, backgroundSelection });
        await this.updateBackgroundNodes({ backgroundSelection });

        this.needleSelection = await this.updateNeedleSelection({ needleData, needleSelection });
        await this.updateNeedleNodes({ needleSelection });

        this.targetSelection = await this.updateTargetSelection({ targetData, targetSelection });
        await this.updateTargetNodes({ targetSelection });

        this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
        await this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.highlightDatumSelection = await this.updateDatumSelection({
            nodeData: isHighlight ? nodeData : [],
            datumSelection: highlightDatumSelection,
        });
        await this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });

        this.labelSelection = await this.updateLabelSelection({ labelData, labelSelection });
        await this.updateLabelNodes({ labelSelection });

        this.animationState.transition('update');
    }

    private async updateDatumSelection(opts: {
        nodeData: RadialGaugeNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => datum.itemId!);
    }

    private async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { ctx, properties } = this;
        const { sectorSpacing, foreground } = properties;
        const { fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = foreground;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;
        const strokeWidth = this.getStrokeWidth(foreground.strokeWidth);
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
            if (animationDisabled || isHighlight) {
                const clipSector = computeClipSector(datum);

                sector.innerRadius = innerRadius;
                sector.outerRadius = outerRadius;
                sector.startAngle = startAngle;
                sector.endAngle = endAngle;
                sector.clipSector = clipSector;

                sector.visible = clipSector == null || clipSectorVisibility(startAngle, endAngle, clipSector);
            }

            sector.fill = highlightStyle?.fill ?? fill;
            sector.fillOpacity = highlightStyle?.fillOpacity ?? fillOpacity;
            sector.stroke = highlightStyle?.stroke ?? stroke;
            sector.strokeOpacity = highlightStyle?.strokeOpacity ?? strokeOpacity;
            sector.strokeWidth = highlightStyle?.strokeWidth ?? strokeWidth;
            sector.lineDash = highlightStyle?.lineDash ?? lineDash;
            sector.lineDashOffset = highlightStyle?.lineDashOffset ?? lineDashOffset;
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
        return opts.backgroundSelection.update(opts.backgroundData, undefined, (datum) => datum.itemId!);
    }

    private async updateBackgroundNodes(opts: {
        backgroundSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum>;
    }) {
        const { backgroundSelection } = opts;
        const { sectorSpacing, background } = this.properties;
        const { fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = background;
        const animationDisabled = this.ctx.animationManager.isSkipped();

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
            if (animationDisabled) {
                sector.innerRadius = innerRadius;
                sector.outerRadius = outerRadius;
                sector.startAngle = startAngle;
                sector.endAngle = endAngle;
                sector.clipSector = computeClipSector(datum);
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

            needle.d = RadialGaugeNeedle.defaultPathData;

            needle.fill = fill;
            needle.fillOpacity = fillOpacity;
            needle.stroke = stroke;
            needle.strokeOpacity = strokeOpacity;
            needle.strokeWidth = strokeWidth;
            needle.lineDash = lineDash;
            needle.lineDashOffset = lineDashOffset;
            needle.translationX = centerX;
            needle.translationY = centerY;
            needle.scalingX = radius * 2;
            needle.scalingY = radius * 2;

            if (animationDisabled) {
                needle.rotation = angle;
            }
        });
    }

    private async updateTargetSelection(opts: {
        targetData: RadialGaugeTargetDatum[];
        targetSelection: _Scene.Selection<_Scene.Marker, RadialGaugeTargetDatum>;
    }) {
        return opts.targetSelection.update(opts.targetData, undefined, () => createDatumId([]));
    }

    private async updateTargetNodes(opts: {
        targetSelection: _Scene.Selection<_Scene.Marker, RadialGaugeTargetDatum>;
    }) {
        const { targetSelection } = opts;
        const animationDisabled = this.ctx.animationManager.isSkipped();

        targetSelection.each((target, datum) => {
            const {
                centerX,
                centerY,
                size,
                angle,
                radius,
                rotation,
                fill,
                fillOpacity,
                stroke,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
            } = datum;

            target.fill = fill;
            target.fillOpacity = fillOpacity;
            target.stroke = stroke;
            target.strokeOpacity = strokeOpacity;
            target.strokeWidth = strokeWidth;
            target.lineDash = lineDash;
            target.lineDashOffset = lineDashOffset;
            target.translationX = centerX + radius * Math.cos(angle);
            target.translationY = centerY + radius * Math.sin(angle);
            target.scalingX = size;
            target.scalingY = size;
            target.rotation = angle + Math.PI / 2 + rotation;

            if (animationDisabled) {
                target.scalingX = size;
                target.scalingY = size;
            }
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
            label.fontSize = datum.fontSize;
            label.fontFamily = datum.fontFamily;

            label.textAlign = 'center';
            label.textBaseline = 'middle';
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
        const { labelSelection, radius } = this;
        const { label, secondaryLabel, padding, innerRadiusRatio } = this.properties;
        formatRadialGaugeLabels(
            this,
            labelSelection,
            label,
            secondaryLabel,
            padding,
            radius * innerRadiusRatio,
            this.createDefaultLabelFormatter(),
            datum
        );
    }

    protected resetAllAnimation() {
        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        resetMotion(
            [this.backgroundSelection, this.datumSelection, this.highlightDatumSelection],
            resetRadialGaugeSeriesAnimationFunctions
        );

        this.backgroundSelection.cleanup();
        this.datumSelection.cleanup();
        this.highlightDatumSelection.cleanup();
        this.labelSelection.cleanup();
    }

    resetAnimation(phase: _ModuleSupport.ChartAnimationPhase) {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        } else if (phase === 'ready') {
            this.animationState.transition('skip');
        }
    }

    animateEmptyUpdateReady() {
        const { animationManager } = this.ctx;

        const { node, needle, target } = prepareRadialGaugeSeriesAnimationFunctions(true);
        fromToMotion(
            this.id,
            'node',
            animationManager,
            [this.backgroundSelection, this.datumSelection, this.highlightDatumSelection],
            node,
            (_sector, datum) => datum.itemId!
        );
        fromToMotion(this.id, 'needle', animationManager, [this.needleSelection], needle, () => 'needle');
        fromToMotion(this.id, 'target', animationManager, [this.targetSelection], target, (_, datum) => `${datum}`);

        fromToMotion(
            this.id,
            'label',
            animationManager,
            [this.labelSelection],
            fadeInFns,
            (_label, datum) => datum.label
        );

        if (!this.labelsHaveExplicitText()) {
            this.formatLabelText();
        }
    }

    animateWaitingUpdateReady() {
        const { animationManager } = this.ctx;

        const { node, needle, target } = prepareRadialGaugeSeriesAnimationFunctions(false);
        fromToMotion(
            this.id,
            'node',
            animationManager,
            [this.backgroundSelection, this.datumSelection, this.highlightDatumSelection],
            node,
            (_sector, datum) => datum.itemId!
        );
        fromToMotion(this.id, 'needle', animationManager, [this.needleSelection], needle, () => 'needle');
        fromToMotion(
            this.id,
            'target',
            animationManager,
            [this.targetSelection],
            target,
            (_, datum) => `${datum.index}`
        );

        let labelFrom = 0;
        let labelTo = 0;
        let secondaryLabelFrom = 0;
        let secondaryLabelTo = 0;
        this.labelSelection.each((label, datum) => {
            // Reset animation
            label.opacity = 1;

            if (datum.label === LabelType.Primary) {
                labelFrom = label.previousDatum?.value ?? 0;
                labelTo = datum.value;
            } else if (datum.label === LabelType.Secondary) {
                secondaryLabelFrom = label.previousDatum?.value ?? 0;
                secondaryLabelTo = datum.value;
            }
        });

        if (!this.labelsHaveExplicitText()) {
            const animationId = `${this.id}_labels`;

            animationManager.animate({
                id: animationId,
                groupId: 'label',
                from: { label: labelFrom, secondaryLabel: secondaryLabelFrom },
                to: { label: labelTo, secondaryLabel: secondaryLabelTo },
                phase: 'update',
                onUpdate: (datum) => this.formatLabelText(datum),
            });
        }
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

    override getLegendData(
        _legendType: unknown
    ): _ModuleSupport.ChartLegendDatum<any>[] | _ModuleSupport.ChartLegendDatum<_ModuleSupport.ChartLegendType>[] {
        return [];
    }

    override getTooltipHtml(nodeDatum: _Scene.Sector): _ModuleSupport.TooltipContent {
        const { id: seriesId, properties } = this;

        if (!properties.isValid()) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const { value, tooltip } = properties;
        const { datum, fill } = nodeDatum;

        const title = '';
        const content = `${this.createDefaultLabelFormatter()(value)}`;

        const color = fill;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                datum,
                title,
                color,
                itemId: undefined!,
                ...this.getModuleTooltipParams(),
            }
        );
    }

    computeFocusBounds(_opts: _ModuleSupport.PickFocusInputs): _Scene.Path | undefined {
        return;
    }
}
