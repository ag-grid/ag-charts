import type {
    AgChartLabelFormatterParams,
    AgRadialGaugeSeriesLabelFormatterParams,
    AgRadialGaugeSeriesStyle,
    FontStyle,
    FontWeight,
    Formatter,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { resetMotion } from '../../../motion/resetMotion';
import { LinearScale } from '../../../scale/linearScale';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { SectorBox } from '../../../scene/sectorBox';
import { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import { Sector } from '../../../scene/shape/sector';
import { Text } from '../../../scene/shape/text';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { StateMachine } from '../../../util/stateMachine';
import type { RequireOptional } from '../../../util/types';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import { createDatumId } from '../../data/processors';
import type { ChartLegendDatum, ChartLegendType } from '../../legendDatum';
import { EMPTY_TOOLTIP_CONTENT, type TooltipContent } from '../../tooltip/tooltip';
import { type PickFocusInputs, Series, type SeriesNodeDataContext, SeriesNodePickMode } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import { RadialGaugeSeriesProperties } from './radialGaugeSeriesProperties';
import {
    prepareRadialGaugeSeriesAnimationFunctions,
    resetRadialGaugeSeriesAnimationFunctions,
} from './radialGaugeUtil';

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

interface RadialGaugeNodeDatum extends SeriesNodeDatum {
    centerX: number;
    centerY: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipStartAngle: number | undefined;
    clipEndAngle: number | undefined;
}
type RadialGaugeLabelDatum = {
    label: 'primary' | 'secondary';
    centerX: number;
    centerY: number;
    text: string | undefined;
    value: number;
    fill: string | undefined;
    fontStyle: FontStyle | undefined;
    fontWeight: FontWeight | undefined;
    fontSize: number;
    fontFamily: string;
    lineHeight: number | undefined;
    formatter:
        | Formatter<AgChartLabelFormatterParams<any> & RequireOptional<AgRadialGaugeSeriesLabelFormatterParams>>
        | undefined;
};

export interface RadialGaugeNodeDataContext extends SeriesNodeDataContext<RadialGaugeNodeDatum, RadialGaugeLabelDatum> {
    backgroundData: RadialGaugeNodeDatum[];
}

export class RadialGaugeSeries extends Series<
    RadialGaugeNodeDatum,
    RadialGaugeSeriesProperties,
    RadialGaugeLabelDatum,
    RadialGaugeNodeDataContext
> {
    static readonly className = 'RadialGaugeSeries';
    static readonly type = 'radial-gauge' as const;

    override properties = new RadialGaugeSeriesProperties();

    public getNodeData(): RadialGaugeNodeDatum[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    private readonly backgroundGroup = this.contentGroup.appendChild(new Group({ name: 'backgroundGroup' }));
    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));
    private readonly itemLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemLabelGroup' }));

    private backgroundSelection: Selection<Sector, RadialGaugeNodeDatum> = Selection.select(this.backgroundGroup, () =>
        this.nodeFactory()
    );
    private datumSelection: Selection<Sector, RadialGaugeNodeDatum> = Selection.select(this.itemGroup, () =>
        this.nodeFactory()
    );
    private labelSelection: Selection<Text, RadialGaugeLabelDatum> = Selection.select(this.itemLabelGroup, Text);
    private highlightDatumSelection: Selection<Sector, RadialGaugeNodeDatum> = Selection.select(
        this.highlightNode,
        () => this.nodeFactory()
    );

    private animationState: StateMachine<GaugeAnimationState, GaugeAnimationEvent>;

    public contextNodeData?: RadialGaugeNodeDataContext;

    constructor(moduleCtx: ModuleContext) {
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
        this.itemLabelGroup.pointerEvents = PointerEvents.None;
    }

    override get hasData(): boolean {
        return true;
    }

    private nodeFactory(): Sector {
        return new Sector();
    }

    override async processData(): Promise<void> {
        this.animationState.transition('updateData');
    }

    override async createNodeData() {
        const { id: seriesId } = this;
        const { width, height } = this.chart!.seriesRect!;
        const {
            value,
            range,
            innerRadiusRatio,
            startAngle,
            endAngle,
            cornerRadius,
            cornerRadiusMode,
            label,
            secondaryLabel,
        } = this.properties;
        const nodeData: RadialGaugeNodeDatum[] = [];
        const labelData: RadialGaugeLabelDatum[] = [];
        const backgroundData: RadialGaugeNodeDatum[] = [];

        const centerX = width / 2;
        const centerY = height / 2;
        const outerRadius = Math.min(width, height) / 2;
        const innerRadius = outerRadius * innerRadiusRatio;

        if (cornerRadiusMode === 'item') {
            const appliedCornerRadius = Math.min(cornerRadius, (outerRadius - innerRadius) / 2);
            const angleInset = appliedCornerRadius / ((innerRadius + outerRadius) / 2);
            const scale = new LinearScale();
            scale.domain = range;
            scale.range = [startAngle + angleInset, endAngle - angleInset];

            nodeData.push({
                series: this,
                itemId: 'value',
                datum: value,
                centerX,
                centerY,
                outerRadius,
                innerRadius,
                startAngle: scale.convert(range[0]) - angleInset,
                endAngle: scale.convert(value) + angleInset,
                clipStartAngle: undefined,
                clipEndAngle: undefined,
            });
        } else {
            const scale = new LinearScale();
            scale.domain = range;
            scale.range = [startAngle, endAngle];

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
            const {
                color: fill,
                fontSize,
                fontStyle,
                fontWeight,
                fontFamily,
                lineHeight,
                formatter,
            } = this.properties.label;
            labelData.push({
                label: 'primary',
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
            const {
                color: fill,
                fontSize,
                fontStyle,
                fontWeight,
                fontFamily,
                lineHeight,
                formatter,
            } = this.properties.secondaryLabel;
            labelData.push({
                label: 'secondary',
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

        return {
            itemId: seriesId,
            nodeData,
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
        const { datumSelection, labelSelection, backgroundSelection, highlightDatumSelection } = this;

        await this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity = this.getOpacity();

        let highlightedDatum: RadialGaugeNodeDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
            highlightedDatum = undefined;
        }

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];
        const backgroundData = this.contextNodeData?.backgroundData ?? [];

        this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
        await this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.labelSelection = await this.updateLabelSelection({ labelData, labelSelection });
        await this.updateLabelNodes({ labelSelection });

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
        datumSelection: Selection<Sector, RadialGaugeNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, () => createDatumId([]));
    }

    private async updateDatumNodes(opts: {
        datumSelection: Selection<Sector, RadialGaugeNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { ctx, properties } = this;
        const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset, cornerRadius } = properties;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;
        const strokeWidth = this.getStrokeWidth(properties.strokeWidth);
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

    private async updateBackgroundSelection(opts: {
        backgroundData: RadialGaugeNodeDatum[];
        backgroundSelection: Selection<Sector, RadialGaugeNodeDatum>;
    }) {
        return opts.backgroundSelection.update(opts.backgroundData, undefined, () => createDatumId([]));
    }

    private async updateBackgroundNodes(opts: { backgroundSelection: Selection<Sector, RadialGaugeNodeDatum> }) {
        const { backgroundSelection } = opts;
        const { cornerRadius } = this.properties;
        const { fill, fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
            this.properties.background;
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
        labelSelection: Selection<Text, RadialGaugeLabelDatum>;
    }) {
        return opts.labelSelection.update(opts.labelData, undefined, (datum) => datum.label);
    }

    private async updateLabelNodes(opts: { labelSelection: Selection<Text, RadialGaugeLabelDatum> }) {
        const { labelSelection } = opts;
        const animationDisabled = this.ctx.animationManager.isSkipped();

        const fixMeLabelRectHeight =
            (this.properties.label.lineHeight ?? this.properties.label.fontSize * Text.defaultLineHeightRatio) +
            (this.properties.secondaryLabel.lineHeight ??
                this.properties.secondaryLabel.fontSize * Text.defaultLineHeightRatio);

        labelSelection.each((label, datum) => {
            label.x = datum.centerX;
            const fixMeLabelHeight = datum.lineHeight ?? datum.fontSize * Text.defaultLineHeightRatio;
            const fixMeLabelRectOriginInLabelRect =
                datum.label === 'primary' ? fixMeLabelHeight / 2 : fixMeLabelRectHeight - fixMeLabelHeight / 2;
            label.y = datum.centerY + fixMeLabelRectOriginInLabelRect - fixMeLabelRectHeight / 2;

            label.fill = datum.fill;
            label.fontStyle = datum.fontStyle;
            label.fontWeight = datum.fontWeight;
            label.fontSize = datum.fontSize;
            label.fontFamily = datum.fontFamily;

            label.textAlign = 'center';
            label.textBaseline = 'middle';

            if (datum.text != null) {
                label.text = datum.text;
            } else if (animationDisabled) {
                label.text = datum.formatter?.({ seriesId: this.id, datum: undefined, value: datum.value });
            }
        });
    }

    protected resetAllAnimation() {
        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        resetMotion(
            [this.backgroundSelection, this.datumSelection, this.highlightDatumSelection],
            resetRadialGaugeSeriesAnimationFunctions
        );

        this.datumSelection.cleanup();
        this.labelSelection.cleanup();
    }

    resetAnimation(phase: ChartAnimationPhase) {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        } else if (phase === 'ready') {
            this.animationState.transition('skip');
        }
    }

    animateEmptyUpdateReady() {
        const { animationManager } = this.ctx;

        const fns = prepareRadialGaugeSeriesAnimationFunctions(true);
        fromToMotion(
            this.id,
            'nodes',
            animationManager,
            [this.backgroundSelection, this.datumSelection, this.highlightDatumSelection],
            fns,
            (_sector, datum) => datum.itemId!
        );

        this.labelSelection.each((label, datum) => {
            label.text = datum.text ?? datum?.formatter?.({ seriesId: this.id, datum: undefined, value: datum.value });

            animationManager.animate({
                id: this.id,
                groupId: 'label',
                from: 0,
                to: 1,
                phase: 'initial',
                onUpdate(opacity) {
                    label.opacity = opacity;
                },
            });
        });
    }

    animateWaitingUpdateReady() {
        const { animationManager } = this.ctx;

        const fns = prepareRadialGaugeSeriesAnimationFunctions(false);
        fromToMotion(
            this.id,
            'nodes',
            animationManager,
            [this.backgroundSelection, this.datumSelection, this.highlightDatumSelection],
            fns,
            (_sector, datum) => datum.itemId!
        );

        this.labelSelection.each((label, datum) => {
            if (datum.text != null) return;

            animationManager.animate({
                id: this.id,
                groupId: 'label',
                from: label.previousDatum?.value ?? 0,
                to: datum.value,
                phase: 'update',
                onUpdate(value) {
                    label.text = datum?.formatter?.({ seriesId: this.id, datum: undefined, value });
                },
            });
        });
    }

    protected animateReadyResize() {
        this.resetAllAnimation();
    }

    override getLabelData(): PointLabelDatum[] {
        return [];
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override getLegendData(_legendType: unknown): ChartLegendDatum<any>[] | ChartLegendDatum<ChartLegendType>[] {
        return [];
    }

    override getTooltipHtml(nodeDatum: Sector): TooltipContent {
        const { id: seriesId, properties } = this;

        if (!properties.isValid()) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const { tooltip } = properties;
        const { datum, fill } = nodeDatum;

        const title = '';
        const content = '';

        let format: AgRadialGaugeSeriesStyle | undefined;

        // if (itemStyler) {
        //     format = callbackCache.call(itemStyler, {
        //         seriesId,
        //         datum,
        //         highlighted: false,
        //     });
        // }

        const color = format?.fill ?? fill;

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

    computeFocusBounds(_opts: PickFocusInputs): Path | undefined {
        return;
    }
}
