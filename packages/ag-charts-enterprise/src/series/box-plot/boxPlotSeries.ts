import {
    type AgBoxPlotHighlightStyleOptions,
    type AgBoxPlotSeriesOptions,
    type AgBoxPlotSeriesStyle,
    type AgBoxPlotSeriesStylerParams,
    _ModuleSupport,
} from 'ag-charts-community';
import type { CallbackParamRules, DeepRequired, Mutable } from 'ag-charts-core';
import { ChartAxisDirection, deepClone, mergeDefaults } from 'ag-charts-core';

import { prepareBoxPlotFromTo, resetBoxPlotSelectionsScalingCenterFn } from './blotPlotUtil';
import { BoxPlotNode } from './boxPlotNode';
import { BoxPlotSeriesProperties } from './boxPlotSeriesProperties';
import type { BoxPlotNodeDatum } from './boxPlotTypes';

const {
    fixNumericExtent,
    keyProperty,
    SeriesNodePickMode,
    SMALLEST_KEY_INTERVAL,
    valueProperty,
    diff,
    animationValidation,
    computeBarFocusBounds,
    createDatumId,
    HighlightState,
    motion,
    getItemStyles,
    calculateSegments,
    toHighlightString,
    processedDataIsAnimatable,
    upsertNodeDatum,
} = _ModuleSupport;

interface BoxPlotSeriesNodeDataContext extends _ModuleSupport.AbstractBarSeriesNodeDataContext<BoxPlotNodeDatum> {
    styles: _ModuleSupport.SeriesNodeStyleContext<AgBoxPlotSeriesStyle>;
}

/**
 * Consolidated type interface for BoxPlotSeries.
 * Defines all type parameters in one place for the series.
 */
interface BoxPlotSeriesTypes extends _ModuleSupport.AbstractBarSeriesTypes {
    readonly node: BoxPlotNode;
    readonly options: AgBoxPlotSeriesOptions;
    readonly properties: BoxPlotSeriesProperties;
    readonly datum: BoxPlotNodeDatum;
    readonly label: BoxPlotNodeDatum;
    readonly context: BoxPlotSeriesNodeDataContext;
    readonly stackContext: never;
    readonly createNodeDataContext: BoxPlotSeriesNodeDatumContext;
}

/** Context object caching expensive lookups for createNodeData(). */
interface BoxPlotSeriesNodeDatumContext extends _ModuleSupport.CartesianCreateNodeDataContext<BoxPlotNodeDatum> {
    // Box plot specific data arrays
    readonly minValues: any[];
    readonly q1Values: any[];
    readonly medianValues: any[];
    readonly q3Values: any[];
    readonly maxValues: any[];

    // Computed positioning (involves scale conversions - worth caching)
    readonly barWidth: number;
    readonly barOffset: number;
    readonly groupOffset: number;

    // Pre-computed values
    readonly isVertical: boolean;
    readonly xKey: string;
}

/** Scratch object for computed scaled values - reused across iterations */
interface ScaledBoxPlotValues {
    xValue: number;
    minValue: number;
    q1Value: number;
    medianValue: number;
    q3Value: number;
    maxValue: number;
}

/** Parameters for creating/updating a BoxPlotNodeDatum */
interface BoxPlotNodeDatumParams {
    datumIndex: number;
    datum: any;
    scaledValues: ScaledBoxPlotValues;
}

class BoxPlotSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<BoxPlotNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly minKey?: string;
    readonly q1Key?: string;
    readonly medianKey?: string;
    readonly q3Key?: string;
    readonly maxKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: BoxPlotNodeDatum, series: BoxPlotSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.minKey = series.properties.minKey;
        this.q1Key = series.properties.q1Key;
        this.medianKey = series.properties.medianKey;
        this.q3Key = series.properties.q3Key;
        this.maxKey = series.properties.maxKey;
    }
}

export class BoxPlotSeries extends _ModuleSupport.AbstractBarSeries<BoxPlotSeriesTypes> {
    static override readonly className = 'BoxPlotSeries';
    static readonly type = 'box-plot' as const;

    override properties = new BoxPlotSeriesProperties();

    protected override readonly NodeEvent = BoxPlotSeriesNodeEvent;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            propertyKeys: {
                x: ['xKey'],
                y: ['medianKey', 'q1Key', 'q3Key', 'minKey', 'maxKey'],
            },
            propertyNames: {
                x: ['xName'],
                y: ['medianName', 'q1Name', 'q3Name', 'minName', 'maxName'],
            },
            categoryKey: 'xValue',
            pathsPerSeries: [],
        });
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (!this.visible) return;

        const { xKey, minKey, q1Key, medianKey, q3Key, maxKey } = this.properties;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const extraProps = [];
        if (this.needsDataModelDiff() && this.processedData) {
            extraProps.push(diff(this.id, this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation());
        }

        const allowNullKey = this.properties.allowNullKeys ?? false;
        const { processedData } = await this.requestDataModel(dataController, this.data, {
            props: [
                keyProperty(xKey, xScaleType, { id: `xValue`, allowNullKey }),
                valueProperty(minKey, yScaleType, { id: `minValue` }),
                valueProperty(q1Key, yScaleType, { id: `q1Value` }),
                valueProperty(medianKey, yScaleType, { id: `medianValue` }),
                valueProperty(q3Key, yScaleType, { id: `q3Value` }),
                valueProperty(maxKey, yScaleType, { id: `maxValue` }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
        });

        this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: ChartAxisDirection) {
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel)) return { domain: [] };

        if (direction !== this.getBarDirection()) {
            const { index, def } = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const keys = processedData.domain.keys[index];
            if (def.type === 'key' && def.valueType === 'category') {
                const sortMetadata = dataModel.getKeySortMetadata(this, 'xValue', processedData);
                return { domain: keys, sortMetadata };
            }
            return { domain: this.padBandExtent(keys) };
        }

        const yExtent = this.domainForClippedRange(direction, ['minValue', 'maxValue'], 'xValue');
        return { domain: fixNumericExtent(yExtent) };
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [number, number]) {
        return this.domainForVisibleRange(ChartAxisDirection.Y, ['maxValue', 'minValue'], 'xValue', visibleRange);
    }

    /**
     * Creates the shared context for datum creation.
     * Caches expensive lookups and computations that are constant across all datums.
     */
    protected override createNodeDatumContext(
        xAxis: _ModuleSupport.ChartAxis,
        yAxis: _ModuleSupport.ChartAxis
    ): BoxPlotSeriesNodeDatumContext | undefined {
        const { dataModel, processedData, contextNodeData } = this;
        if (!dataModel || !processedData) return undefined;

        const canIncrementallyUpdate = contextNodeData?.nodeData != null && processedData.changeDescription != null;
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const { groupOffset, barOffset, barWidth } = this.getBarDimensions();

        return {
            xAxis,
            yAxis,
            rawData: processedData.dataSources.get(this.id)?.data ?? [],
            xValues: dataModel.resolveKeysById(this, 'xValue', processedData),
            minValues: dataModel.resolveColumnById(this, 'minValue', processedData),
            q1Values: dataModel.resolveColumnById(this, 'q1Value', processedData),
            medianValues: dataModel.resolveColumnById(this, 'medianValue', processedData),
            q3Values: dataModel.resolveColumnById(this, 'q3Value', processedData),
            maxValues: dataModel.resolveColumnById(this, 'maxValue', processedData),
            xScale: xAxis.scale,
            yScale: yAxis.scale,
            groupOffset,
            barOffset,
            barWidth,
            isVertical: this.isVertical(),
            xKey: this.properties.xKey,
            animationEnabled,
            canIncrementallyUpdate,
            nodes: canIncrementallyUpdate ? contextNodeData.nodeData : [],
            nodeIndex: 0,
        };
    }

    /**
     * Validates box plot values and checks ordering constraints.
     * Returns true if values are valid (all numbers, min <= q1 <= median <= q3 <= max).
     */
    private validateBoxPlotValues(minValue: any, q1Value: any, medianValue: any, q3Value: any, maxValue: any): boolean {
        return (
            [minValue, q1Value, medianValue, q3Value, maxValue].every((value) => typeof value === 'number') &&
            minValue <= q1Value &&
            q1Value <= medianValue &&
            medianValue <= q3Value &&
            q3Value <= maxValue
        );
    }

    /**
     * Computes scaled values for a single datum.
     * Populates the scratch object to avoid allocations.
     */
    private computeScaledValues(
        ctx: BoxPlotSeriesNodeDatumContext,
        scratch: ScaledBoxPlotValues,
        datumIndex: number
    ): void {
        scratch.xValue =
            ctx.xScale.convert(ctx.xValues[datumIndex]) + ctx.groupOffset + ctx.barOffset + ctx.barWidth / 2;
        scratch.minValue = ctx.yScale.convert(ctx.minValues[datumIndex]);
        scratch.q1Value = ctx.yScale.convert(ctx.q1Values[datumIndex]);
        scratch.medianValue = ctx.yScale.convert(ctx.medianValues[datumIndex]);
        scratch.q3Value = ctx.yScale.convert(ctx.q3Values[datumIndex]);
        scratch.maxValue = ctx.yScale.convert(ctx.maxValues[datumIndex]);
    }

    /**
     * Creates a skeleton BoxPlotNodeDatum with minimal required fields.
     * The node will be populated by updateNodeDatum.
     */
    private createSkeletonNodeDatum(
        ctx: BoxPlotSeriesNodeDatumContext,
        params: BoxPlotNodeDatumParams
    ): BoxPlotNodeDatum {
        return {
            series: this,
            itemId: ctx.xValues[params.datumIndex],
            datum: params.datum,
            datumIndex: params.datumIndex,
            xKey: ctx.xKey,
            bandwidth: ctx.barWidth,
            scaledValues: {
                xValue: 0,
                minValue: 0,
                q1Value: 0,
                medianValue: 0,
                q3Value: 0,
                maxValue: 0,
            },
            midPoint: { x: 0, y: 0 },
            focusRect: { x: 0, y: 0, width: 0, height: 0 },
        };
    }

    /**
     * Updates an existing BoxPlotNodeDatum in-place.
     * This is more efficient than recreating the entire node when only data values change.
     */
    private updateNodeDatum(
        ctx: BoxPlotSeriesNodeDatumContext,
        node: BoxPlotNodeDatum,
        params: BoxPlotNodeDatumParams
    ): void {
        const { isVertical, barWidth } = ctx;
        const scaledValues = params.scaledValues;
        const mutableNode = node as Mutable<BoxPlotNodeDatum>;

        // Update datum and index
        mutableNode.datum = params.datum;
        mutableNode.datumIndex = params.datumIndex;
        mutableNode.itemId = ctx.xValues[params.datumIndex];
        mutableNode.bandwidth = barWidth;

        // Update scaledValues in place
        const mutableScaledValues = mutableNode.scaledValues;
        mutableScaledValues.xValue = scaledValues.xValue;
        mutableScaledValues.minValue = scaledValues.minValue;
        mutableScaledValues.q1Value = scaledValues.q1Value;
        mutableScaledValues.medianValue = scaledValues.medianValue;
        mutableScaledValues.q3Value = scaledValues.q3Value;
        mutableScaledValues.maxValue = scaledValues.maxValue;

        // Compute midPoint
        const height = Math.abs(scaledValues.q3Value - scaledValues.q1Value);
        const midX = scaledValues.xValue;
        const midY = Math.min(scaledValues.q3Value, scaledValues.q1Value) + height / 2;

        const midPointX = isVertical ? midX : midY;
        const midPointY = isVertical ? midY : midX;

        // Update midPoint in place (or create if missing)
        if (mutableNode.midPoint) {
            mutableNode.midPoint.x = midPointX;
            mutableNode.midPoint.y = midPointY;
        } else {
            mutableNode.midPoint = { x: midPointX, y: midPointY };
        }

        // Update focusRect in place
        const focusRect = mutableNode.focusRect;
        if (isVertical) {
            focusRect.x = midPointX - barWidth / 2;
            focusRect.y = scaledValues.minValue;
            focusRect.width = barWidth;
            focusRect.height = scaledValues.maxValue - scaledValues.minValue;
        } else {
            focusRect.x = scaledValues.minValue;
            focusRect.y = midPointY - barWidth / 2;
            focusRect.width = scaledValues.maxValue - scaledValues.minValue;
            focusRect.height = barWidth;
        }
    }

    /**
     * Creates a BoxPlotNodeDatum for a single data point.
     * Creates a skeleton node and uses updateNodeDatum to populate it.
     */
    private createNodeDatum(ctx: BoxPlotSeriesNodeDatumContext, params: BoxPlotNodeDatumParams): BoxPlotNodeDatum {
        const node = this.createSkeletonNodeDatum(ctx, params);
        this.updateNodeDatum(ctx, node, params);
        return node;
    }

    /**
     * Initialize the result object shell before populating node data.
     */
    protected override initializeResult(ctx: BoxPlotSeriesNodeDatumContext): BoxPlotSeriesNodeDataContext {
        return {
            itemId: this.properties.xKey,
            nodeData: ctx.nodes,
            labelData: [],
            scales: this.calculateScaling(),
            visible: this.visible,
            // Set by assembleResult()
            groupScale: undefined,
            styles: undefined as unknown as _ModuleSupport.SeriesNodeStyleContext<AgBoxPlotSeriesStyle>,
            segments: undefined,
        };
    }

    /**
     * Populate node data by iterating over raw data.
     */
    protected override populateNodeData(ctx: BoxPlotSeriesNodeDatumContext): void {
        // Scratch objects for reuse across iterations
        const scaledValuesScratch: ScaledBoxPlotValues = {
            xValue: 0,
            minValue: 0,
            q1Value: 0,
            medianValue: 0,
            q3Value: 0,
            maxValue: 0,
        };

        const paramsScratch: BoxPlotNodeDatumParams = {
            datumIndex: 0,
            datum: undefined,
            scaledValues: scaledValuesScratch,
        };

        // Main iteration loop
        for (let datumIndex = 0; datumIndex < ctx.rawData.length; datumIndex++) {
            const datum = ctx.rawData[datumIndex];
            const xValue = ctx.xValues[datumIndex];
            if (xValue === undefined && !this.properties.allowNullKeys) continue;

            const minValue = ctx.minValues[datumIndex];
            const q1Value = ctx.q1Values[datumIndex];
            const medianValue = ctx.medianValues[datumIndex];
            const q3Value = ctx.q3Values[datumIndex];
            const maxValue = ctx.maxValues[datumIndex];

            if (!this.validateBoxPlotValues(minValue, q1Value, medianValue, q3Value, maxValue)) {
                continue;
            }

            this.computeScaledValues(ctx, scaledValuesScratch, datumIndex);

            // Update scratch params
            paramsScratch.datumIndex = datumIndex;
            paramsScratch.datum = datum;

            // Use shared utility for create/update logic
            upsertNodeDatum(
                ctx,
                paramsScratch,
                (c, p) => this.createNodeDatum(c, p),
                (c, n, p) => this.updateNodeDatum(c, n, p)
            );
        }
    }

    /**
     * Finalize node data by trimming excess nodes.
     */
    protected override finalizeNodeData(ctx: BoxPlotSeriesNodeDatumContext): void {
        if (ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length) {
            ctx.nodes.length = ctx.nodeIndex;
        }
    }

    /**
     * Assemble the final result with computed fields.
     */
    protected override assembleResult(
        ctx: BoxPlotSeriesNodeDatumContext,
        result: BoxPlotSeriesNodeDataContext
    ): BoxPlotSeriesNodeDataContext {
        const segments = calculateSegments(
            this.properties.segmentation,
            ctx.xAxis,
            ctx.yAxis,
            this.chart!.seriesRect!,
            this.ctx.scene
        );

        result.groupScale = this.getScaling(this.ctx.seriesStateManager.getGroupScale(this)!);
        result.styles = getItemStyles(this.getItemStyle.bind(this));
        result.segments = segments;

        return result;
    }

    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const { fill, stroke, strokeWidth, fillOpacity, strokeOpacity, lineDash, lineDashOffset } = this.getStyle(
            false,
            HighlightState.None
        );

        return {
            marker: {
                fill: deepClone(fill),
                fillOpacity,
                stroke,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
            },
        };
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;
        const { xKey, yName, showInLegend, legendItemName } = this.properties;

        if (!xKey || legendType !== 'category') {
            return [];
        }

        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId: seriesId,
                seriesId: seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId: seriesId }),
                label: {
                    text: legendItemName ?? yName ?? seriesId,
                },
                symbol: this.legendItemSymbol(),
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const {
            xKey,
            xName,
            yName,
            medianKey,
            medianName,
            q1Key,
            q1Name,
            q3Key,
            q3Name,
            minKey,
            minName,
            maxKey,
            maxName,
            legendItemName,
            tooltip,
        } = properties;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const minValue = dataModel.resolveColumnById(this, `minValue`, processedData)[datumIndex];
        const q1Value = dataModel.resolveColumnById(this, `q1Value`, processedData)[datumIndex];
        const medianValue = dataModel.resolveColumnById(this, `medianValue`, processedData)[datumIndex];
        const q3Value = dataModel.resolveColumnById(this, `q3Value`, processedData)[datumIndex];
        const maxValue = dataModel.resolveColumnById(this, `maxValue`, processedData)[datumIndex];

        // sonarjs/different-types-comparison: array access can return undefined if index is out of bounds
        const allowNullKeys = this.properties.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return; // eslint-disable-line sonarjs/different-types-comparison

        const format = this.getItemStyle(datumIndex, false);

        const data: _ModuleSupport.TooltipContentDataRow[] = [
            {
                label: minName,
                fallbackLabel: minKey,
                value: this.getAxisValueText(yAxis, 'tooltip', minValue, datum, minKey, legendItemName),
                missing: _ModuleSupport.isTooltipValueMissing(minValue),
            },
            {
                label: q1Name,
                fallbackLabel: q1Key,
                value: this.getAxisValueText(yAxis, 'tooltip', q1Value, datum, q1Key, legendItemName),
                missing: _ModuleSupport.isTooltipValueMissing(q1Value),
            },
            {
                label: medianName,
                fallbackLabel: medianKey,
                value: this.getAxisValueText(yAxis, 'tooltip', medianValue, datum, medianKey, legendItemName),
                missing: _ModuleSupport.isTooltipValueMissing(medianValue),
            },
            {
                label: q3Name,
                fallbackLabel: q3Key,
                value: this.getAxisValueText(yAxis, 'tooltip', q3Value, datum, q3Key, legendItemName),
                missing: _ModuleSupport.isTooltipValueMissing(q3Value),
            },
            {
                label: maxName,
                fallbackLabel: maxKey,
                value: this.getAxisValueText(yAxis, 'tooltip', maxValue, datum, maxKey, legendItemName),
                missing: _ModuleSupport.isTooltipValueMissing(maxValue),
            },
        ];

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
                title: legendItemName ?? yName,
                symbol: this.legendItemSymbol(),
                data: data,
            },
            {
                seriesId,
                datum,
                title: yName,
                xKey,
                xName,
                yName,
                medianKey,
                medianName,
                q1Key,
                q1Name,
                q3Key,
                q3Name,
                minKey,
                minName,
                maxKey,
                maxName,
                ...format,
            }
        );
    }

    protected override animateEmptyUpdateReady({
        datumSelection,
    }: _ModuleSupport.CartesianAnimationData<BoxPlotNode, BoxPlotNodeDatum>) {
        const isVertical = this.isVertical();
        const { from, to } = prepareBoxPlotFromTo(isVertical);
        motion.resetMotion([datumSelection], resetBoxPlotSelectionsScalingCenterFn(isVertical));
        motion.staticFromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], from, to, {
            phase: 'initial',
        });
    }

    protected isLabelEnabled(): boolean {
        return false;
    }

    protected override updateDatumSelection(opts: {
        nodeData: BoxPlotNodeDatum[];
        datumSelection: _ModuleSupport.Selection<BoxPlotNode, BoxPlotNodeDatum>;
        seriesIdx: number;
    }) {
        const data = opts.nodeData ?? [];

        if (!processedDataIsAnimatable(this.processedData!)) {
            // Optimised update path, no need to match nodes by id.
            return opts.datumSelection.update(data);
        }

        return opts.datumSelection.update(data, undefined, (datum) => createDatumId(datum.datumIndex));
    }

    private makeStylerParams(
        highlightStateEnum?: _ModuleSupport.HighlightState
    ): AgBoxPlotSeriesStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const {
            cornerRadius,
            cap: { lengthRatio },
            fill,
            fillOpacity,
            lineDash,
            lineDashOffset,
            stroke,
            strokeOpacity,
            strokeWidth,
            maxKey,
            maxName,
            medianKey,
            medianName,
            minKey,
            minName,
            q1Key,
            q1Name,
            q3Key,
            q3Name,
            whisker: {
                lineDash: whiskerLineDash,
                lineDashOffset: whiskerLineDashOffset,
                stroke: whiskerStroke,
                strokeOpacity: whiskerStrokeOpacity,
                strokeWidth: whiskerStrokeWidth,
            },
            xKey,
            xName,
            yName,
        } = this.properties;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);

        // Do not allow any of the returned properties to be `undefined`.
        // Exceptions:
        // -   `fill` is a required color property that can be a string or a partial-object.
        // -   `yName` key has no `yKey` fallback like `xName`.
        type T = ReturnType<BoxPlotSeries['makeStylerParams']>;
        type Rules = CallbackParamRules<DeepRequired<Omit<T, 'yName'>, 'fill'> & Pick<T, 'yName'>>;
        return {
            cap: { lengthRatio },
            cornerRadius,
            fill,
            fillOpacity,
            highlightState,
            lineDash,
            lineDashOffset,
            maxKey,
            maxName: maxName ?? maxKey,
            medianKey,
            medianName: medianName ?? medianKey,
            minKey,
            minName: minName ?? minKey,
            q1Key,
            q1Name: q1Name ?? q1Key,
            q3Key,
            q3Name: q3Name ?? q3Key,
            seriesId,
            stroke,
            strokeOpacity,
            strokeWidth,
            whisker: {
                lineDash: whiskerLineDash ?? lineDash,
                lineDashOffset: whiskerLineDashOffset ?? lineDashOffset,
                stroke: whiskerStroke ?? stroke,
                strokeOpacity: whiskerStrokeOpacity ?? strokeOpacity,
                strokeWidth: whiskerStrokeWidth ?? strokeWidth,
            },
            xKey,
            xName: xName ?? xKey,
            yName,
        } satisfies Rules;
    }

    private getStyle(
        ignoreStylerCallback: boolean,
        highlightState?: _ModuleSupport.HighlightState
    ): Required<AgBoxPlotSeriesStyle> & { opacity: number } {
        const {
            cap,
            cornerRadius,
            fill,
            fillOpacity,
            lineDash,
            lineDashOffset,
            stroke,
            strokeOpacity,
            strokeWidth,
            styler,
            whisker,
        } = this.properties;
        let stylerResult: AgBoxPlotSeriesStyle = {};
        if (!ignoreStylerCallback && styler) {
            const stylerParams = this.makeStylerParams(highlightState);
            stylerResult =
                this.ctx.optionsGraphService.resolvePartial(
                    ['series', `${this.declarationOrder}`],
                    this.cachedCallWithContext(styler, stylerParams) ?? {},
                    { pick: false }
                ) ?? {};
        }
        return {
            cornerRadius: stylerResult.cornerRadius ?? cornerRadius,
            fill: stylerResult.fill ?? fill,
            fillOpacity: stylerResult.fillOpacity ?? fillOpacity,
            lineDash: stylerResult.lineDash ?? lineDash,
            lineDashOffset: stylerResult.lineDashOffset ?? lineDashOffset,
            opacity: 1,
            stroke: stylerResult.stroke ?? stroke,
            strokeOpacity: stylerResult.strokeOpacity ?? strokeOpacity,
            strokeWidth: stylerResult.strokeWidth ?? strokeWidth,
            cap: { lengthRatio: stylerResult.cap?.lengthRatio ?? cap.lengthRatio },
            whisker: {
                lineDash: stylerResult.whisker?.lineDash ?? whisker.lineDash,
                lineDashOffset: stylerResult.whisker?.lineDashOffset ?? whisker.lineDashOffset,
                stroke: stylerResult.whisker?.stroke ?? whisker.stroke,
                strokeOpacity: stylerResult.whisker?.strokeOpacity ?? whisker.strokeOpacity,
                strokeWidth: stylerResult.whisker?.strokeWidth ?? whisker.strokeWidth,
            },
        };
    }

    private getItemStyle(
        datumIndex: number | undefined,
        isHighlight: boolean,
        highlightState?: _ModuleSupport.HighlightState
    ): Required<AgBoxPlotSeriesStyle> {
        const { properties } = this;
        const { itemStyler } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        let style = mergeDefaults(highlightStyle, this.getStyle(datumIndex === undefined, highlightState));

        if (itemStyler != null && datumIndex != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(datumIndex, isHighlight, style);
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(itemStyler, params)
                    );
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, style);
            }
        }

        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = style;

        style.whisker = mergeDefaults(style.whisker, {
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        });

        return style;
    }

    private makeItemStylerParams(datumIndex: number, isHighlight: boolean, style: Required<AgBoxPlotSeriesStyle>) {
        const { id: seriesId } = this;
        const { xKey, minKey, q1Key, medianKey, q3Key, maxKey } = this.properties;

        const datum = this.processedData?.dataSources.get(seriesId)?.data[datumIndex];
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightStateString = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum,
            xKey,
            minKey,
            q1Key,
            medianKey,
            q3Key,
            maxKey,
            highlightState: highlightStateString,
            ...style,
            fill,
        };
    }

    protected override updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<BoxPlotNode, BoxPlotNodeDatum>;
        isHighlight: boolean;
    }) {
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        datumSelection.each((_, nodeDatum) => {
            const highlightState = this.getHighlightState(highlightedDatum, isHighlight, nodeDatum.datumIndex);
            nodeDatum.style = this.getItemStyle(nodeDatum.datumIndex, isHighlight, highlightState);
        });
    }

    protected override updateDatumNodes({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<BoxPlotNode, BoxPlotNodeDatum>;
        isHighlight: boolean;
    }) {
        const { contextNodeData, properties } = this;
        if (!contextNodeData) {
            return;
        }
        const isVertical = this.isVertical();
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        const fillBBox = this.getShapeFillBBox();
        const strokeAlignment = this.getStyle(false, HighlightState.None).strokeWidth / 2;

        const wickStrokeAlignment = properties.whisker.strokeWidth ?? properties.strokeWidth;

        datumSelection.each((boxPlotNode, nodeDatum) => {
            const style = (nodeDatum.style ??
                contextNodeData.styles[
                    this.getHighlightState(highlightedDatum, isHighlight, nodeDatum.datumIndex)
                ]) as DeepRequired<AgBoxPlotHighlightStyleOptions>;
            boxPlotNode.setFillProperties(style.fill, fillBBox);

            const nodeOpacity = style.opacity ?? 1;
            const whiskerOpacity = style.whisker?.strokeOpacity ?? style.strokeOpacity;

            boxPlotNode.fill = style.fill;
            boxPlotNode.fillOpacity = style.fillOpacity * nodeOpacity;
            boxPlotNode.stroke = style.stroke;
            boxPlotNode.strokeWidth = style.strokeWidth;
            boxPlotNode.strokeOpacity = style.strokeOpacity * nodeOpacity;
            boxPlotNode.lineDash = style.lineDash;
            boxPlotNode.lineDashOffset = style.lineDashOffset;
            boxPlotNode.wickStroke = style.whisker.stroke;
            boxPlotNode.wickStrokeWidth = style.whisker.strokeWidth;
            boxPlotNode.wickStrokeOpacity = whiskerOpacity * nodeOpacity;
            boxPlotNode.wickLineDash = style.whisker.lineDash;
            boxPlotNode.wickLineDashOffset = style.whisker.lineDashOffset;
            boxPlotNode.cornerRadius = style.cornerRadius;

            boxPlotNode.crisp = true;

            boxPlotNode.horizontal = !isVertical;
            boxPlotNode.center = nodeDatum.scaledValues.xValue;
            boxPlotNode.thickness = nodeDatum.bandwidth;
            boxPlotNode.min = nodeDatum.scaledValues.minValue;
            boxPlotNode.q1 = nodeDatum.scaledValues.q1Value;
            boxPlotNode.median = nodeDatum.scaledValues.medianValue;
            boxPlotNode.q3 = nodeDatum.scaledValues.q3Value;
            boxPlotNode.max = nodeDatum.scaledValues.maxValue;

            boxPlotNode.capLengthRatio = style.cap.lengthRatio;

            boxPlotNode.strokeAlignment = strokeAlignment; // Ignore highlight style
            boxPlotNode.wickStrokeAlignment = wickStrokeAlignment;
        });
    }

    protected updateLabelNodes() {
        // Labels are unsupported.
    }

    protected override updateLabelSelection(opts: {
        labelData: BoxPlotNodeDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, BoxPlotNodeDatum>;
        seriesIdx: number;
    }) {
        const { labelData, labelSelection } = opts;
        return labelSelection.update(labelData);
    }

    protected override nodeFactory() {
        return new BoxPlotNode();
    }

    protected computeFocusBounds({ datumIndex }: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return computeBarFocusBounds(this, this.contextNodeData?.nodeData[datumIndex].focusRect);
    }

    protected override hasItemStylers(): boolean {
        return this.properties.itemStyler != null || this.properties.styler != null;
    }
}
