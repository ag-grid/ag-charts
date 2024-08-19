import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { AngleNumberAxis } from '../../axes/angle-number/angleNumberAxis';
import { RadialGaugeNeedle } from './radialGaugeNeedle';
import {
    LabelType,
    type RadialGaugeLabelDatum,
    type RadialGaugeNodeDatum,
    RadialGaugeSeriesProperties,
} from './radialGaugeSeriesProperties';
import {
    fadeInFns,
    formatRadialGaugeLabels,
    prepareRadialGaugeSeriesAnimationFunctions,
    resetRadialGaugeSeriesAnimationFunctions,
} from './radialGaugeUtil';

const { fromToMotion, resetMotion, SeriesNodePickMode, StateMachine, createDatumId, EMPTY_TOOLTIP_CONTENT } =
    _ModuleSupport;
const { Group, PointerEvents, SectorBox, Selection, Sector, Text } = _Scene;
const { LinearScale } = _Scale;

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
        const { id: seriesId } = this;
        const { width, height } = this.chart!.seriesRect!;
        const {
            value,
            range: domain,
            innerRadiusRatio,
            startAngle,
            endAngle,
            cornerRadius,
            cornerRadiusMode,
            needle,
            foreground,
            background,
            label,
            secondaryLabel,
        } = this.properties;
        const nodeData: RadialGaugeNodeDatum[] = [];
        const labelData: RadialGaugeLabelDatum[] = [];
        const needleData: any[] = [];
        const backgroundData: RadialGaugeNodeDatum[] = [];

        this.radius = Math.min(width, height) / 2;

        const centerX = width / 2;
        const centerY = height / 2;
        const outerRadius = this.radius;
        const innerRadius = outerRadius * innerRadiusRatio;

        let angleInset = 0;
        if (cornerRadiusMode === 'item') {
            const appliedCornerRadius = Math.min(cornerRadius, (outerRadius - innerRadius) / 2);
            angleInset = appliedCornerRadius / ((innerRadius + outerRadius) / 2);
        }

        const range: [number, number] = [startAngle + angleInset, endAngle - angleInset];

        this.axis.setDomain(domain);
        this.axis.range = range;

        const scale = new LinearScale();
        scale.domain = domain;
        scale.range = range;
        if (foreground.enabled && cornerRadiusMode === 'item') {
            nodeData.push({
                series: this,
                itemId: 'value',
                datum: value,
                centerX,
                centerY,
                outerRadius,
                innerRadius,
                startAngle: scale.convert(domain[0]) - angleInset,
                endAngle: scale.convert(value) + angleInset,
                clipStartAngle: undefined,
                clipEndAngle: undefined,
            });
        } else if (foreground.enabled) {
            nodeData.push({
                series: this,
                itemId: 'value',
                datum: value,
                centerX,
                centerY,
                outerRadius,
                innerRadius,
                startAngle,
                endAngle,
                clipStartAngle: startAngle,
                clipEndAngle: scale.convert(value),
            });
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

        if (background.enabled) {
            backgroundData.push({
                series: this,
                itemId: 'background',
                datum: value,
                centerX,
                centerY,
                outerRadius,
                innerRadius,
                startAngle,
                endAngle,
                clipStartAngle: undefined,
                clipEndAngle: undefined,
            });
        }

        return {
            itemId: seriesId,
            nodeData,
            labelData,
            needleData,
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
        const { datumSelection, labelSelection, needleSelection, backgroundSelection, highlightDatumSelection } = this;

        await this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity = this.getOpacity();

        let highlightedDatum: RadialGaugeNodeDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
            highlightedDatum = undefined;
        }

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];
        const needleData = this.contextNodeData?.needleData ?? [];
        const backgroundData = this.contextNodeData?.backgroundData ?? [];

        this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
        await this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.labelSelection = await this.updateLabelSelection({ labelData, labelSelection });
        await this.updateLabelNodes({ labelSelection });

        this.needleSelection = await this.updateNeedleSelection({ needleData, needleSelection });
        await this.updateNeedleNodes({ needleSelection });

        this.backgroundSelection = await this.updateBackgroundSelection({ backgroundData, backgroundSelection });
        await this.updateBackgroundNodes({ backgroundSelection });

        this.highlightDatumSelection = await this.updateDatumSelection({
            nodeData: highlightedDatum != null ? [highlightedDatum] : [],
            datumSelection: highlightDatumSelection,
        });
        await this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });

        this.animationState.transition('update');
    }

    private async updateDatumSelection(opts: {
        nodeData: RadialGaugeNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, () => createDatumId([]));
    }

    private async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { ctx, properties } = this;
        const { cornerRadius, foreground } = properties;
        const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = foreground;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;
        const strokeWidth = this.getStrokeWidth(foreground.strokeWidth);
        const animationDisabled = ctx.animationManager.isSkipped();

        datumSelection.each((sector, datum) => {
            const { centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, clipStartAngle, clipEndAngle } =
                datum;
            sector.centerX = centerX;
            sector.centerY = centerY;
            if (animationDisabled || isHighlight) {
                sector.innerRadius = innerRadius;
                sector.outerRadius = outerRadius;
                sector.startAngle = startAngle;
                sector.endAngle = endAngle;
                sector.clipSector =
                    clipStartAngle != null && clipEndAngle != null
                        ? new SectorBox(clipStartAngle, clipEndAngle, innerRadius, outerRadius)
                        : undefined;
            }

            sector.fill = highlightStyle?.fill ?? fill;
            sector.fillOpacity = highlightStyle?.fillOpacity ?? fillOpacity;
            sector.stroke = highlightStyle?.stroke ?? stroke;
            sector.strokeOpacity = highlightStyle?.strokeOpacity ?? strokeOpacity;
            sector.strokeWidth = highlightStyle?.strokeWidth ?? strokeWidth;
            sector.lineDash = highlightStyle?.lineDash ?? lineDash;
            sector.lineDashOffset = highlightStyle?.lineDashOffset ?? lineDashOffset;
            sector.cornerRadius = cornerRadius;

            sector.inset = sector.strokeWidth / 2;
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

    private async updateBackgroundSelection(opts: {
        backgroundData: RadialGaugeNodeDatum[];
        backgroundSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum>;
    }) {
        return opts.backgroundSelection.update(opts.backgroundData, undefined, () => createDatumId([]));
    }

    private async updateBackgroundNodes(opts: {
        backgroundSelection: _Scene.Selection<_Scene.Sector, RadialGaugeNodeDatum>;
    }) {
        const { backgroundSelection } = opts;
        const { cornerRadius, background } = this.properties;
        const { fill, fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = background;
        const animationDisabled = this.ctx.animationManager.isSkipped();

        backgroundSelection.each((sector, datum) => {
            const { centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, clipStartAngle, clipEndAngle } =
                datum;
            sector.centerX = centerX;
            sector.centerY = centerY;
            if (animationDisabled) {
                sector.innerRadius = innerRadius;
                sector.outerRadius = outerRadius;
                sector.startAngle = startAngle;
                sector.endAngle = endAngle;
                sector.clipSector =
                    clipStartAngle != null && clipEndAngle != null
                        ? new SectorBox(clipStartAngle, clipEndAngle, innerRadius, outerRadius)
                        : undefined;
            }

            sector.fill = fill;
            sector.fillOpacity = fillOpacity;
            sector.stroke = stroke;
            sector.strokeOpacity = strokeOpacity;
            sector.strokeWidth = strokeWidth;
            sector.lineDash = lineDash;
            sector.lineDashOffset = lineDashOffset;
            sector.cornerRadius = cornerRadius;

            sector.inset = sector.strokeWidth / 2;
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

        resetMotion([this.backgroundSelection, this.datumSelection], resetRadialGaugeSeriesAnimationFunctions);

        this.datumSelection.cleanup();
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

        const { node, needle } = prepareRadialGaugeSeriesAnimationFunctions(true);
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

        const { node, needle } = prepareRadialGaugeSeriesAnimationFunctions(false);
        fromToMotion(
            this.id,
            'node',
            animationManager,
            [this.backgroundSelection, this.datumSelection],
            node,
            (_sector, datum) => datum.itemId!
        );
        fromToMotion(this.id, 'needle', animationManager, [this.needleSelection], needle, () => 'needle');

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

        const { tooltip } = properties;
        const { datum, fill } = nodeDatum;

        const title = '';
        const content = '';

        // let format: AgRadialGaugeSeriesStyle | undefined;
        // if (itemStyler) {
        //     format = callbackCache.call(itemStyler, {
        //         seriesId,
        //         datum,
        //         highlighted: false,
        //     });
        // }

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
