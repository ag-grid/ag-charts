import { type Point, type RequireOptional, isDate, isNumber } from 'ag-charts-core';
import type {
    AgHistogramBinDatum,
    AgHistogramSeriesLabelFormatterParams,
    AgHistogramSeriesOptions,
    AgHistogramSeriesStyle,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import { deepClone } from '../../../util/json';
import { findMinMax } from '../../../util/number';
import { mergeDefaults } from '../../../util/object';
import { createTicks, tickStep } from '../../../util/ticks';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { area, groupAverage, groupCount, groupSum } from '../../data/aggregateFunctions';
import type { DataController } from '../../data/dataController';
import type {
    AggregatePropertyDefinition,
    DataGroup,
    DataPropertyDefinition,
    GroupByFn,
    GroupedData,
    ProcessedOutputDiff,
} from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import { SORT_DOMAIN_GROUPS, createDatumId, keyProperty, rowCountProperty, valueProperty } from '../../data/processors';
import { getLabelStyles } from '../../labelUtil';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { type TooltipContent, type TooltipContentDataRow } from '../../tooltip/tooltip';
import {
    type PickFocusInputs,
    type SeriesNodePickMatch,
    SeriesNodePickMode,
    type SeriesNodeStyleContext,
} from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import type { HighlightState } from '../seriesProperties';
import { applyShapeStyle } from '../shapeUtil';
import { getItemStyles } from '../util';
import {
    collapsedStartingBarPosition,
    computeBarFocusBounds,
    prepareBarAnimationFunctions,
    resetBarSelectionsFn,
} from './barUtil';
import {
    type CartesianAnimationData,
    CartesianSeries,
    type CartesianSeriesNodeDataContext,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { type HistogramNodeDatum, HistogramSeriesProperties } from './histogramSeriesProperties';
import { addHitTestersToQuadtree, findQuadtreeMatch } from './quadtreeUtil';

const defaultBinCount = 10;

type HistogramAnimationData = CartesianAnimationData<Rect<HistogramNodeDatum>, HistogramNodeDatum>;

interface CalculatedBin {
    domain: [number, number];
    groupIndex: number;
    datum: any[];
    frequency: number;
    total: number;
}

interface HistogramSeriesNodeDataContext extends CartesianSeriesNodeDataContext<HistogramNodeDatum> {
    styles: SeriesNodeStyleContext<AgHistogramSeriesStyle>;
}

export class HistogramSeries extends CartesianSeries<
    Rect<HistogramNodeDatum>,
    AgHistogramSeriesOptions,
    HistogramSeriesProperties,
    HistogramNodeDatum,
    HistogramNodeDatum,
    HistogramSeriesNodeDataContext
> {
    static readonly className = 'HistogramSeries';
    static readonly type = 'histogram' as const;

    override properties = new HistogramSeriesProperties();

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            propertyKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            propertyNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            categoryKey: undefined,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            datumSelectionGarbageCollection: true,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    calculatedBins: CalculatedBin[] = [];

    override get hasData(): boolean {
        return this.calculatedBins.length > 0;
    }

    // During processData phase, used to unify different ways of the user specifying
    // the bins. Returns bins in format[[min1, max1], [min2, max2], ... ].
    private deriveBins(xDomain: [number, number]): [number, number][] {
        const binStarts = createTicks(xDomain[0], xDomain[1], defaultBinCount).ticks;
        const binSize = tickStep(xDomain[0], xDomain[1], defaultBinCount);
        const [firstBinEnd] = binStarts;

        const expandStartToBin = (n: number): [number, number] => [n, n + binSize];
        return [[firstBinEnd - binSize, firstBinEnd], ...binStarts.map(expandStartToBin)];
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
        const precision = this.calculatePrecision(step);

        for (let i = 0; i < count; i++) {
            const a = Math.round((start + i * step) * precision) / precision;
            let b = Math.round((start + (i + 1) * step) * precision) / precision;
            if (i === count - 1) {
                b = Math.max(b, stop);
            }

            bins[i] = [a, b];
        }

        return bins;
    }

    private calculatePrecision(step: number): number {
        let precision = 10;
        if (Number.isFinite(step) && step > 0) {
            while (step < 1) {
                precision *= 10;
                step *= 10;
            }
        }
        return precision;
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

    override async processData(dataController: DataController) {
        const { visible } = this;
        const { xKey, yKey, areaPlot, aggregation } = this.properties;

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ yScale, xScale });

        const visibleProps = visible ? {} : { forceValue: 0 };

        const props: DataPropertyDefinition<any>[] = [keyProperty(xKey, xScaleType), SORT_DOMAIN_GROUPS];
        if (yKey) {
            let aggProp: AggregatePropertyDefinition<any, any, any> = groupCount('groupAgg', { visible });

            if (aggregation === 'count') {
                // Nothing to do.
            } else if (aggregation === 'sum') {
                aggProp = groupSum('groupAgg', { visible });
            } else if (aggregation === 'mean') {
                aggProp = groupAverage('groupAgg', { visible });
            }
            if (areaPlot) {
                aggProp = area('groupAgg', aggProp);
            }
            props.push(valueProperty(yKey, yScaleType, { invalidValue: undefined, ...visibleProps }), aggProp);
        } else {
            // Special property - data model needs at least one value property to perform grouping.
            props.push(rowCountProperty('count'));

            let aggProp = groupCount('groupAgg', { visible });

            if (areaPlot) {
                aggProp = area('groupAgg', aggProp);
            }
            props.push(aggProp);
        }

        let calculatedBinDomains: [number, number][] = [];
        const groupByFn: GroupByFn = (dataSet) => {
            const xExtent = fixNumericExtent(dataSet.domain.keys[0]);
            if (xExtent.length === 0) {
                // No buckets can be calculated.
                dataSet.domain.groups = [];
                return () => [];
            }

            const bins = isNumber(this.properties.binCount)
                ? this.calculateNiceBins(xExtent, this.properties.binCount)
                : this.properties.bins ?? this.deriveBins(xExtent);
            const binCount = bins.length;
            calculatedBinDomains = [...bins];

            return (keys) => {
                let xValue = keys[0];
                if (isDate(xValue)) {
                    xValue = xValue.getTime();
                }
                if (!isNumber(xValue)) return [];

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

        const { dataModel, processedData: p } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props,
            groupByFn,
        });
        const processedData = p as any as GroupedData<any>;

        const groups = new Map<string, { group: DataGroup; groupIndex: number }>();
        for (const [groupIndex, group] of processedData.groups.entries()) {
            const domain = group.keys;
            groups.set(createDatumId(...domain), { group, groupIndex });
        }

        this.calculatedBins = calculatedBinDomains.map((domain): CalculatedBin => {
            const g = groups.get(createDatumId(...domain));

            if (g) {
                const { group, groupIndex } = g;
                const [[negativeAgg, positiveAgg] = [0, 0]] = group.aggregation;
                const datum = [...dataModel.forEachDatum(this, processedData, group, groupIndex)];
                const frequency = this.frequency(group);
                const total = negativeAgg + positiveAgg;
                return { domain, datum, groupIndex, frequency, total };
            } else {
                return { domain, datum: [], groupIndex: -1, frequency: 0, total: 0 };
            }
        });

        this.animationState.transition('updateData');
    }

    override xCoordinateRange(): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    override yCoordinateRange(): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;

        if (!processedData || !dataModel || !this.calculatedBins.length) return [];

        const yDomain = dataModel.getDomain(this, `groupAgg`, 'aggregate', processedData);
        const xDomainMin = this.calculatedBins[0].domain[0];
        const xDomainMax = this.calculatedBins[(this.calculatedBins?.length ?? 0) - 1].domain[1];
        if (direction === ChartAxisDirection.X) {
            return fixNumericExtent([xDomainMin, xDomainMax]);
        }

        return fixNumericExtent(yDomain);
    }

    override getSeriesRange(_direction: ChartAxisDirection, [r0, r1]: [any, any]): [number, number] {
        const { dataModel, processedData } = this;
        if (!dataModel || processedData?.type !== 'grouped') return [Number.NaN, Number.NaN];

        const xScale = this.axes[ChartAxisDirection.X]!.scale;

        const yMin = 0;
        let yMax = -Infinity;
        for (const { keys, aggregation } of processedData.groups) {
            const [[negativeAgg, positiveAgg] = [0, 0]] = aggregation;
            const [xDomainMin, xDomainMax] = keys;

            const [x0, x1] = findMinMax([xScale.convert(xDomainMin), xScale.convert(xDomainMax)]);

            if (x1 >= r0 && x0 <= r1) {
                const total = negativeAgg + positiveAgg;
                yMax = Math.max(yMax, total);
            }
        }

        if (yMin > yMax) return [Number.NaN, Number.NaN];

        return [yMin, yMax];
    }

    private frequency(group: DataGroup) {
        return group.datumIndices.reduce((acc, datumIndices) => acc + datumIndices.length, 0);
    }

    override createNodeData() {
        const { axes, processedData, dataModel } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis || !dataModel) {
            return;
        }

        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;
        const { xKey, yKey, xName, yName, label } = this.properties;
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const nodeData: HistogramNodeDatum[] = [];
        const context = {
            itemId: this.properties.yKey ?? this.id,
            nodeData,
            labelData: nodeData,
            scales: this.calculateScaling(),
            animationValid: true,
            visible: this.visible || animationEnabled,
            styles: getItemStyles(this.getItemStyle.bind(this)),
        };
        if (processedData == null || processedData.type !== 'grouped') {
            return context;
        }

        for (const { domain, datum, groupIndex, frequency, total } of this.calculatedBins) {
            const [xDomainMin, xDomainMax] = domain;
            const xMinPx = xScale.convert(xDomainMin);
            const xMaxPx = xScale.convert(xDomainMax);

            const yZeroPx = yScale.convert(0);
            const yMaxPx = yScale.convert(total);
            const w = Math.abs(xMaxPx - xMinPx);
            const h = Math.abs(yMaxPx - yZeroPx);

            const x = Math.min(xMinPx, xMaxPx);
            const y = Math.min(yZeroPx, yMaxPx);

            let selectionDatumLabel = undefined;
            if (label.enabled && total !== 0) {
                selectionDatumLabel = {
                    x: x + w / 2,
                    y: y + h / 2,
                    text: this.getLabelText<AgHistogramSeriesLabelFormatterParams>(
                        total,
                        datum,
                        yKey!,
                        'y',
                        [],
                        label,
                        { value: total, datum, xKey, yKey, xName, yName }
                    ),
                };
            }

            const nodeMidPoint = {
                x: x + w / 2,
                y: y + h / 2,
            };

            const yAxisReversed = yAxis.isReversed();

            nodeData.push({
                series: this,
                datumIndex: groupIndex,
                datum, // required by SeriesNodeDatum, but might not make sense here
                // since each selection is an aggregation of multiple data.
                aggregatedValue: total,
                frequency,
                domain,
                yKey,
                xKey,
                x,
                y,
                xValue: xMinPx,
                yValue: yMaxPx,
                width: w,
                height: h,
                midPoint: nodeMidPoint,
                topLeftCornerRadius: !yAxisReversed,
                topRightCornerRadius: !yAxisReversed,
                bottomRightCornerRadius: yAxisReversed,
                bottomLeftCornerRadius: yAxisReversed,
                label: selectionDatumLabel,
                crisp: true,
            });
        }

        // AG-11323 Sort bins from left-to-right for intuitive keyboard navigation.
        nodeData.sort((a, b) => a.x - b.x);

        return context;
    }

    protected override nodeFactory() {
        return new Rect();
    }

    protected override updateDatumSelection(opts: {
        nodeData: HistogramNodeDatum[];
        datumSelection: Selection<Rect, HistogramNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;

        return datumSelection.update(nodeData, undefined, (datum: HistogramNodeDatum) =>
            createDatumId(...datum.domain)
        );
    }

    private getItemStyle(
        datumIndex: number | undefined,
        isHighlight: boolean,
        highlightState?: HighlightState
    ): RequireOptional<AgHistogramSeriesStyle> {
        const { properties } = this;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        return mergeDefaults(highlightStyle, properties.getStyle());
    }

    protected override updateDatumStyles(opts: {
        datumSelection: Selection<Rect, HistogramNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        datumSelection.each((node, datum) => {
            if (!datumSelection.isGarbage(node)) {
                datum.style = this.getItemStyle(datum.datumIndex, isHighlight);
            }
        });
    }

    protected override updateDatumNodes(opts: {
        datumSelection: Selection<Rect, HistogramNodeDatum>;
        isHighlight: boolean;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        const { shadow } = this.properties;
        const fillBBox = this.getShapeFillBBox();

        opts.datumSelection.each((rect, datum) => {
            const style =
                datum.style ??
                contextNodeData.styles[this.getHighlightState(highlightedDatum, opts.isHighlight, datum.datumIndex)];
            const { cornerRadius = 0 } = style;
            const { topLeftCornerRadius, topRightCornerRadius, bottomRightCornerRadius, bottomLeftCornerRadius } =
                datum;

            applyShapeStyle(rect, style, fillBBox);
            rect.topLeftCornerRadius = topLeftCornerRadius ? cornerRadius : 0;
            rect.topRightCornerRadius = topRightCornerRadius ? cornerRadius : 0;
            rect.bottomRightCornerRadius = bottomRightCornerRadius ? cornerRadius : 0;
            rect.bottomLeftCornerRadius = bottomLeftCornerRadius ? cornerRadius : 0;
            rect.crisp = datum.crisp;
            rect.fillShadow = shadow;
        });
    }

    protected override updateLabelSelection(opts: {
        labelData: HistogramNodeDatum[];
        labelSelection: Selection<Text, HistogramNodeDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
            text.textAlign = 'center';
            text.textBaseline = 'middle';
        });
    }

    protected updateLabelNodes(opts: { labelSelection: Selection<Text, HistogramNodeDatum> }) {
        const labelEnabled = this.isLabelEnabled();

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        opts.labelSelection.each((text, datum) => {
            const style = getLabelStyles(this, datum, this.properties, this.properties.label, false, activeHighlight);
            const { enabled, fontStyle, fontWeight, fontSize, fontFamily, color } = style;
            if (enabled && labelEnabled && datum?.label) {
                text.text = datum.label.text;
                text.x = datum.label.x;
                text.y = datum.label.y;
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontFamily = fontFamily;
                text.fontSize = fontSize;
                text.fill = color;
                text.visible = true;
                text.fillOpacity = this.getHighlightStyle(false, datum.datumIndex).opacity ?? 1;
                text.setBoxing(style);
            } else {
                text.visible = false;
            }
        });
    }

    protected override initQuadTree(quadtree: QuadtreeNearest<HistogramNodeDatum>) {
        const { value: childNode } = this.contentGroup.children().next();
        if (childNode instanceof Group) {
            addHitTestersToQuadtree(quadtree, childNode.children() as Iterable<Rect>);
        }
    }

    protected override pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        return findQuadtreeMatch(this, point);
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const {
            id: seriesId,
            dataModel,
            processedData,
            axes,
            properties,
            ctx: { localeManager },
        } = this;
        const { xKey, xName, yKey, yName, tooltip, legendItemName } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || processedData?.type !== 'grouped' || !xAxis || !yAxis) {
            return;
        }

        const group = processedData.groups[datumIndex];
        const { aggregation, keys } = group;
        const [[negativeAgg, positiveAgg] = [0, 0]] = aggregation;
        const frequency = this.frequency(group);
        const domain = keys;
        const [rangeMin, rangeMax]: number[] = domain;
        const aggregatedValue = negativeAgg + positiveAgg;
        const datum: AgHistogramBinDatum<any> = {
            data: [...dataModel.forEachDatum(this, processedData, group, datumIndex)],
            aggregatedValue,
            frequency,
            domain: domain as any,
        };

        const data: TooltipContentDataRow[] = [
            {
                label: xName,
                fallbackLabel: xKey,
                value: `${this.getAxisValueText(xAxis, 'tooltip', rangeMin, datum, xKey, legendItemName)} - ${this.getAxisValueText(xAxis, 'tooltip', rangeMax, datum, xKey, legendItemName)}`,
            },
            {
                label: localeManager.t('seriesHistogramTooltipFrequency'),
                value: this.getAxisValueText(yAxis, 'tooltip', frequency, datum, yKey!, legendItemName),
            },
        ];

        if (yKey != null) {
            let label: string;
            switch (properties.aggregation) {
                case 'sum':
                    label = localeManager.t('seriesHistogramTooltipSum', { yName: yName ?? yKey });
                    break;
                case 'mean':
                    label = localeManager.t('seriesHistogramTooltipMean', { yName: yName ?? yKey });
                    break;
                case 'count':
                    label = localeManager.t('seriesHistogramTooltipCount', { yName: yName ?? yKey });
                    break;
            }

            data.push({
                label,
                value: this.getAxisValueText(yAxis, 'tooltip', aggregatedValue, datum, yKey, legendItemName),
            });
        }

        return this.formatTooltipWithContext(
            tooltip,
            {
                symbol: this.legendItemSymbol(),
                data,
            },
            {
                seriesId,
                datum,
                title: yName,
                xKey: xKey as any, // HistogramSeries is an outlier since it's callbacks don't use TDatum.
                xName,
                yKey: yKey as any, // HistogramSeries is an outlier since it's callbacks don't use TDatum.
                yName,
                xRange: [rangeMin, rangeMax] satisfies [number, number],
                frequency,
                ...this.getItemStyle(datumIndex, false),
            }
        );
    }

    private legendItemSymbol(): LegendSymbolOptions {
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.properties;

        return {
            marker: {
                fill: deepClone(fill) ?? 'rgba(0, 0, 0, 0)',
                stroke: stroke ?? 'rgba(0, 0, 0, 0)',
                fillOpacity: fillOpacity,
                strokeOpacity: strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
            },
        };
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        const { xKey: itemId, yName, showInLegend } = this.properties;

        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId }),
                label: {
                    text: yName ?? itemId ?? 'Frequency',
                },
                symbol: this.legendItemSymbol(),
                hideInLegend: !showInLegend,
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection }: HistogramAnimationData) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(true, this.axes, 'normal'), 'unknown');
        fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], fns);

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    override animateWaitingUpdateReady(data: HistogramAnimationData) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(true, this.axes, 'normal'), 'added');

        const dataDiff: ProcessedOutputDiff = {
            changed: true,
            added: new Set(),
            updated: new Set(),
            removed: new Set(),
            moved: new Set(),
        };

        fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            [data.datumSelection],
            fns,
            (_, datum) => createDatumId(...datum.domain),
            dataDiff
        );

        if (dataDiff?.changed) {
            seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, data.labelSelection);
        }
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected computeFocusBounds({ datumIndex }: PickFocusInputs): BBox | undefined {
        return computeBarFocusBounds(this, this.contextNodeData?.nodeData[datumIndex]);
    }

    protected override hasItemStylers(): boolean {
        return this.properties.label.itemStyler != null;
    }
}
