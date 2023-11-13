import type { AgHistogramSeriesLabelFormatterParams } from 'ag-charts-community';
import {
    type AgHistogramSeriesOptions,
    type AgHistogramSeriesTooltipRendererParams,
    type AgTooltipRendererResult,
    type FontStyle,
    type FontWeight,
    _ModuleSupport,
    _Scene,
    _Util,
} from 'ag-charts-community';

const {
    predicateWithMessage,
    Validate,
    groupCount,
    groupSum,
    groupAverage,
    area,
    BOOLEAN,
    CartesianSeries,
    ChartAxisDirection,
    NUMBER,
    OPT_ARRAY,
    OPT_COLOR_STRING,
    OPT_LINE_DASH,
    OPT_NUMBER,
    OPT_STRING,
    SORT_DOMAIN_GROUPS,
    Series,
    SeriesNodePickMode,
    SeriesTooltip,
    createDatumId,
    diff,
    fixNumericExtent,
    keyProperty,
    valueProperty,
    prepareBarAnimationFunctions,
    collapsedStartingBarPosition,
    resetBarSelectionsFn,
    resetLabelFn,
    seriesLabelFadeInAnimation,
} = _ModuleSupport;
const { Rect, Label, PointerEvents, motion } = _Scene;
const { ticks, sanitizeHtml, tickStep } = _Util;

const HISTOGRAM_AGGREGATIONS = ['count', 'sum', 'mean'];
const HISTOGRAM_AGGREGATION = predicateWithMessage(
    (v: any) => HISTOGRAM_AGGREGATIONS.includes(v),
    `expecting a histogram aggregation keyword such as 'count', 'sum' or 'mean`
);

enum HistogramSeriesNodeTag {
    Bin,
    Label,
}

const defaultBinCount = 10;

interface HistogramNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly aggregatedValue: number;
    readonly frequency: number;
    readonly domain: [number, number];
    readonly label?: {
        readonly text: string;
        readonly x: number;
        readonly y: number;
        readonly fontStyle?: FontStyle;
        readonly fontWeight?: FontWeight;
        readonly fontSize: number;
        readonly fontFamily: string;
        readonly fill: string;
    };
}

type HistogramAggregation = NonNullable<AgHistogramSeriesOptions['aggregation']>;

type HistogramAnimationData = _ModuleSupport.CartesianAnimationData<_Scene.Rect, HistogramNodeDatum>;

export class HistogramSeries extends CartesianSeries<_Scene.Rect, HistogramNodeDatum> {
    static className = 'HistogramSeries';
    static type = 'histogram' as const;

    readonly label = new Label<AgHistogramSeriesLabelFormatterParams>();

    tooltip = new SeriesTooltip<AgHistogramSeriesTooltipRendererParams<HistogramNodeDatum>>();

    @Validate(OPT_COLOR_STRING)
    fill?: string = undefined;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = undefined;

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(BOOLEAN)
    areaPlot: boolean = false;

    @Validate(OPT_ARRAY())
    bins?: [number, number][];

    @Validate(HISTOGRAM_AGGREGATION)
    aggregation: HistogramAggregation = 'sum';

    @Validate(OPT_NUMBER(0))
    binCount?: number = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    @Validate(NUMBER(0))
    strokeWidth: number = 1;

    shadow?: _Scene.DropShadow = undefined;
    calculatedBins: [number, number][] = [];

    // During processData phase, used to unify different ways of the user specifying
    // the bins. Returns bins in format[[min1, max1], [min2, max2], ... ].
    private deriveBins(xDomain: [number, number]): [number, number][] {
        if (this.binCount === undefined) {
            const binStarts = ticks(xDomain[0], xDomain[1], defaultBinCount);
            const binSize = tickStep(xDomain[0], xDomain[1], defaultBinCount);
            const firstBinEnd = binStarts[0];

            const expandStartToBin: (n: number) => [number, number] = (n) => [n, n + binSize];

            return [[firstBinEnd - binSize, firstBinEnd], ...binStarts.map(expandStartToBin)];
        } else {
            return this.calculateNiceBins(xDomain, this.binCount);
        }
    }

    private calculateNiceBins(domain: number[], binCount: number): [number, number][] {
        const startGuess = Math.floor(domain[0]);
        const stop = domain[1];

        const segments = binCount || 1;
        const { start, binSize } = this.calculateNiceStart(startGuess, stop, segments);

        return this.getBins(start, stop, binSize, segments);
    }

    private getBins(start: number, stop: number, step: number, count: number): [number, number][] {
        const bins: [number, number][] = [];

        for (let i = 0; i < count; i++) {
            const a = Math.round((start + i * step) * 10) / 10;
            let b = Math.round((start + (i + 1) * step) * 10) / 10;
            if (i === count - 1) {
                b = Math.max(b, stop);
            }

            bins[i] = [a, b];
        }

        return bins;
    }

    private calculateNiceStart(a: number, b: number, segments: number): { start: number; binSize: number } {
        const binSize = Math.abs(b - a) / segments;
        const order = Math.floor(Math.log10(binSize));
        const magnitude = Math.pow(10, order);

        const start = Math.floor(a / magnitude) * magnitude;

        return {
            start,
            binSize,
        };
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { xKey, yKey, data, areaPlot, aggregation } = this;

        const props: _ModuleSupport.PropertyDefinition<any>[] = [keyProperty(this, xKey, true), SORT_DOMAIN_GROUPS];
        if (yKey) {
            let aggProp: _ModuleSupport.AggregatePropertyDefinition<any, any, any> = groupCount(this, 'groupCount');

            if (aggregation === 'count') {
                // Nothing to do.
            } else if (aggregation === 'sum') {
                aggProp = groupSum(this, 'groupAgg');
            } else if (aggregation === 'mean') {
                aggProp = groupAverage(this, 'groupAgg');
            }
            if (areaPlot) {
                aggProp = area(this, 'groupAgg', aggProp);
            }
            props.push(valueProperty(this, yKey, true, { invalidValue: undefined }), aggProp);
        } else {
            let aggProp = groupCount(this, 'groupAgg');

            if (areaPlot) {
                aggProp = area(this, 'groupAgg', aggProp);
            }
            props.push(aggProp);
        }

        const groupByFn: _ModuleSupport.GroupByFn = (dataSet) => {
            const xExtent = fixNumericExtent(dataSet.domain.keys[0]);
            if (xExtent.length === 0) {
                // No buckets can be calculated.
                dataSet.domain.groups = [];
                return () => [];
            }

            const bins = this.bins ?? this.deriveBins(xExtent);
            const binCount = bins.length;
            this.calculatedBins = [...bins];

            return (item) => {
                const xValue = item.keys[0];
                for (let i = 0; i < binCount; i++) {
                    const nextBin = bins[i];
                    if (xValue >= nextBin[0] && xValue < nextBin[1]) {
                        return nextBin;
                    }
                    if (i === binCount - 1 && xValue <= nextBin[1]) {
                        // Handle edge case of a value being at the maximum extent, and the
                        // final bin aligning with it.
                        return nextBin;
                    }
                }

                return [];
            };
        };

        if (!this.ctx.animationManager.isSkipped() && this.processedData) {
            props.push(diff(this.processedData, false));
        }

        await this.requestDataModel<any>(dataController, data ?? [], {
            props,
            dataVisible: this.visible,
            groupByFn,
        });

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;

        if (!processedData || !dataModel || !this.calculatedBins.length) return [];

        const yDomain = dataModel.getDomain(this, `groupAgg`, 'aggregate', processedData);
        const xDomainMin = this.calculatedBins?.[0][0];
        const xDomainMax = this.calculatedBins?.[(this.calculatedBins?.length ?? 0) - 1][1];
        if (direction === ChartAxisDirection.X) {
            return fixNumericExtent([xDomainMin, xDomainMax]);
        }

        return fixNumericExtent(yDomain);
    }

    async createNodeData() {
        const {
            axes,
            processedData,
            ctx: { callbackCache },
        } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!this.visible || !xAxis || !yAxis || !processedData || processedData.type !== 'grouped') {
            return [];
        }

        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;
        const { fill, stroke, strokeWidth, id: seriesId, yKey = '', xKey = '' } = this;

        const nodeData: HistogramNodeDatum[] = [];

        const {
            label: {
                formatter: labelFormatter = (params) => String(params.value),
                fontStyle: labelFontStyle,
                fontWeight: labelFontWeight,
                fontSize: labelFontSize,
                fontFamily: labelFontFamily,
                color: labelColor,
            },
        } = this;

        processedData.data.forEach((group) => {
            const {
                aggValues: [[negativeAgg, positiveAgg]] = [[0, 0]],
                datum,
                datum: { length: frequency },
                keys: domain,
                keys: [xDomainMin, xDomainMax],
            } = group;

            const xMinPx = xScale.convert(xDomainMin);
            const xMaxPx = xScale.convert(xDomainMax);

            const total = negativeAgg + positiveAgg;

            const yZeroPx = yScale.convert(0);
            const yMaxPx = yScale.convert(total);
            const w = xMaxPx - xMinPx;
            const h = Math.abs(yMaxPx - yZeroPx);

            const selectionDatumLabel =
                total !== 0
                    ? {
                          text:
                              callbackCache.call(labelFormatter, {
                                  value: total,
                                  datum,
                                  seriesId,
                                  xKey,
                                  yKey,
                                  xName: this.xName,
                                  yName: this.yName,
                              }) ?? String(total),
                          fontStyle: labelFontStyle,
                          fontWeight: labelFontWeight,
                          fontSize: labelFontSize,
                          fontFamily: labelFontFamily,
                          fill: labelColor,
                          x: xMinPx + w / 2,
                          y: yMaxPx + h / 2,
                      }
                    : undefined;

            const nodeMidPoint = {
                x: xMinPx + w / 2,
                y: yMaxPx + h / 2,
            };

            nodeData.push({
                series: this,
                datum, // required by SeriesNodeDatum, but might not make sense here
                // since each selection is an aggregation of multiple data.
                aggregatedValue: total,
                frequency,
                domain: domain as [number, number],
                yKey,
                xKey,
                x: xMinPx,
                y: yMaxPx,
                xValue: xMinPx,
                yValue: yMaxPx,
                width: w,
                height: h,
                midPoint: nodeMidPoint,
                fill: fill,
                stroke: stroke,
                strokeWidth: strokeWidth,
                label: selectionDatumLabel,
            });
        });

        return [
            {
                itemId: this.yKey ?? this.id,
                nodeData,
                labelData: nodeData,
                scales: super.calculateScaling(),
                animationValid: true,
                visible: this.visible,
            },
        ];
    }

    protected override nodeFactory() {
        return new Rect();
    }

    protected override async updateDatumSelection(opts: {
        nodeData: HistogramNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, HistogramNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;

        return datumSelection.update(
            nodeData,
            (rect) => {
                rect.tag = HistogramSeriesNodeTag.Bin;
                rect.crisp = true;
            },
            (datum: HistogramNodeDatum) => datum.domain.join('_')
        );
    }

    protected override async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, HistogramNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight: isDatumHighlighted } = opts;
        const {
            fillOpacity: seriesFillOpacity,
            strokeOpacity,
            shadow,
            highlightStyle: {
                item: {
                    fill: highlightedFill,
                    fillOpacity: highlightFillOpacity = seriesFillOpacity,
                    stroke: highlightedStroke,
                    strokeWidth: highlightedDatumStrokeWidth,
                },
            },
        } = this;

        datumSelection.each((rect, datum, index) => {
            const strokeWidth =
                isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                    ? highlightedDatumStrokeWidth
                    : datum.strokeWidth;
            const fillOpacity = isDatumHighlighted ? highlightFillOpacity : seriesFillOpacity;

            rect.fill = (isDatumHighlighted ? highlightedFill : undefined) ?? datum.fill;
            rect.stroke = (isDatumHighlighted ? highlightedStroke : undefined) ?? datum.stroke;
            rect.fillOpacity = fillOpacity;
            rect.strokeOpacity = strokeOpacity;
            rect.strokeWidth = strokeWidth;
            rect.lineDash = this.lineDash;
            rect.lineDashOffset = this.lineDashOffset;
            rect.fillShadow = shadow;
            rect.zIndex = isDatumHighlighted ? Series.highlightedZIndex : index;
            rect.visible = datum.height > 0; // prevent stroke from rendering for zero height columns
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: HistogramNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, HistogramNodeDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.tag = HistogramSeriesNodeTag.Label;
            text.pointerEvents = PointerEvents.None;
            text.textAlign = 'center';
            text.textBaseline = 'middle';
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, HistogramNodeDatum> }) {
        const { labelSelection } = opts;
        const labelEnabled = this.label.enabled;

        labelSelection.each((text, datum) => {
            const label = datum.label;

            if (label && labelEnabled) {
                text.text = label.text;
                text.x = label.x;
                text.y = label.y;
                text.fontStyle = label.fontStyle;
                text.fontWeight = label.fontWeight;
                text.fontSize = label.fontSize;
                text.fontFamily = label.fontFamily;
                text.fill = label.fill;
                text.visible = true;
            } else {
                text.visible = false;
            }
        });
    }

    getTooltipHtml(nodeDatum: HistogramNodeDatum): string {
        const { xKey, yKey = '', axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yName, fill: color, tooltip, aggregation, id: seriesId } = this;
        const {
            aggregatedValue,
            frequency,
            domain: [rangeMin, rangeMax],
        } = nodeDatum;
        const title = `${sanitizeHtml(xName ?? xKey)}: ${xAxis.formatDatum(rangeMin)} - ${xAxis.formatDatum(rangeMax)}`;
        let content = yKey
            ? `<b>${sanitizeHtml(yName ?? yKey)} (${aggregation})</b>: ${yAxis.formatDatum(aggregatedValue)}<br>`
            : '';

        content += `<b>Frequency</b>: ${frequency}`;

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        return tooltip.toTooltipHtml(defaults, {
            datum: {
                data: nodeDatum.datum,
                aggregatedValue: nodeDatum.aggregatedValue,
                domain: nodeDatum.domain,
                frequency: nodeDatum.frequency,
            },
            xKey,
            xName,
            yKey,
            yName,
            color,
            title,
            seriesId,
        });
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const { id, data, xKey, yName, visible, fill, stroke, fillOpacity, strokeOpacity, strokeWidth } = this;

        if (!data || data.length === 0 || legendType !== 'category') {
            return [];
        }

        return [
            {
                legendType: 'category',
                id,
                itemId: xKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: yName ?? xKey ?? 'Frequency',
                },
                marker: {
                    fill: fill ?? 'rgba(0, 0, 0, 0)',
                    stroke: stroke ?? 'rgba(0, 0, 0, 0)',
                    fillOpacity: fillOpacity,
                    strokeOpacity: strokeOpacity,
                    strokeWidth,
                },
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelections, labelSelections }: HistogramAnimationData) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(true, this.axes));
        motion.fromToMotion(this.id, 'empty-update-ready', this.ctx.animationManager, datumSelections, fns);

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
    }

    override animateWaitingUpdateReady(data: HistogramAnimationData) {
        const diff = this.processedData?.reduced?.diff;
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(true, this.axes));

        motion.fromToMotion(
            this.id,
            'waiting-update-ready',
            this.ctx.animationManager,
            data.datumSelections,
            fns,
            (_, datum) => this.getDatumId(datum),
            diff
        );

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, data.labelSelections);
    }

    getDatumId(datum: HistogramNodeDatum) {
        return createDatumId(datum.domain.map((d) => `${d}`));
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }
}
