import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import type { AgBarSeriesStyle, FontStyle, FontWeight } from '../../../options/agChartOptions';
import { BandScale } from '../../../scale/bandScale';
import { ContinuousScale } from '../../../scale/continuousScale';
import { BBox } from '../../../scene/bbox';
import { PointerEvents } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/array';
import { sanitizeHtml } from '../../../util/sanitize';
import { isFiniteNumber } from '../../../util/type-guards';
import { CategoryAxis } from '../../axis/categoryAxis';
import { GroupedCategoryAxis } from '../../axis/groupedCategoryAxis';
import { LogAxis } from '../../axis/logAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { fixNumericExtent } from '../../data/dataModel';
import {
    SMALLEST_KEY_INTERVAL,
    animationValidation,
    createDatumId,
    diff,
    normaliseGroupTo,
} from '../../data/processors';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import { SeriesNodePickMode, groupAccumulativeValueProperty, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { AbstractBarSeries } from './abstractBarSeries';
import { BarSeriesProperties } from './barSeriesProperties';
import type { RectConfig } from './barUtil';
import {
    checkCrisp,
    collapsedStartingBarPosition,
    getRectConfig,
    prepareBarAnimationFunctions,
    resetBarSelectionsFn,
    updateRect,
} from './barUtil';
import type {
    CartesianAnimationData,
    CartesianSeriesNodeDataContext,
    CartesianSeriesNodeDatum,
} from './cartesianSeries';
import { adjustLabelPlacement, updateLabelNode } from './labelUtil';

interface BarNodeLabelDatum extends Readonly<Point> {
    readonly text: string;
    readonly fontStyle?: FontStyle;
    readonly fontWeight?: FontWeight;
    readonly fontSize: number;
    readonly fontFamily: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    readonly fill: string;
}

interface BarNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum, Readonly<Point> {
    readonly xValue: string | number;
    readonly yValue: string | number;
    readonly cumulativeValue: number;
    readonly width: number;
    readonly height: number;
    readonly fill: string | undefined;
    readonly stroke: string | undefined;
    readonly opacity: number | undefined;
    readonly strokeWidth: number;
    readonly cornerRadius: number;
    readonly topLeftCornerRadius: boolean;
    readonly topRightCornerRadius: boolean;
    readonly bottomRightCornerRadius: boolean;
    readonly bottomLeftCornerRadius: boolean;
    readonly cornerRadiusBbox: BBox | undefined;
    readonly label?: BarNodeLabelDatum;
}

type BarAnimationData = CartesianAnimationData<Rect, BarNodeDatum>;

enum BarSeriesNodeTag {
    Bar,
    Label,
}

export class BarSeries extends AbstractBarSeries<Rect, BarNodeDatum> {
    static className = 'BarSeries';
    static type = 'bar' as const;

    override properties = new BarSeriesProperties();

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 0,
            hasHighlightedLabels: true,
            datumSelectionGarbageCollection: false,
            animationAlwaysUpdateSelections: true,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    /**
     * Used to get the position of bars within each group.
     */
    private groupScale = new BandScale<string>();

    protected override resolveKeyDirection(direction: ChartAxisDirection) {
        if (this.getBarDirection() === ChartAxisDirection.X) {
            if (direction === ChartAxisDirection.X) {
                return ChartAxisDirection.Y;
            }
            return ChartAxisDirection.X;
        }
        return direction;
    }

    protected smallestDataInterval?: { x: number; y: number } = undefined;

    override async processData(dataController: DataController) {
        if (!this.properties.isValid() || !this.data) {
            return;
        }

        const { seriesGrouping: { groupIndex = this.id } = {}, data = [] } = this;
        const { xKey, yKey, normalizedTo } = this.properties;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const normalizedToAbs = Math.abs(normalizedTo ?? NaN);

        const isContinuousX = ContinuousScale.is(this.getCategoryAxis()?.scale);
        const isContinuousY = ContinuousScale.is(this.getValueAxis()?.scale);
        const stackGroupName = `bar-stack-${groupIndex}-yValues`;
        const stackGroupTrailingName = `${stackGroupName}-trailing`;

        const normaliseTo = normalizedToAbs && isFinite(normalizedToAbs) ? normalizedToAbs : undefined;
        const extraProps = [];
        if (normaliseTo) {
            extraProps.push(normaliseGroupTo(this, [stackGroupName, stackGroupTrailingName], normaliseTo, 'range'));
        }
        if (animationEnabled && this.processedData) {
            extraProps.push(diff(this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation(this));
        }

        const visibleProps = !this.visible ? { forceValue: 0 } : {};
        const { processedData } = await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                valueProperty(this, yKey, isContinuousY, { id: `yValue-raw`, invalidValue: null, ...visibleProps }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'normal', 'current', {
                    id: `yValue-end`,
                    rangeId: `yValue-range`,
                    invalidValue: null,
                    missingValue: 0,
                    groupId: stackGroupName,
                    separateNegative: true,
                    ...visibleProps,
                }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'trailing', 'current', {
                    id: `yValue-start`,
                    invalidValue: null,
                    missingValue: 0,
                    groupId: stackGroupTrailingName,
                    separateNegative: true,
                    ...visibleProps,
                }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
            groupByKeys: true,
            groupByData: false,
        });

        this.smallestDataInterval = {
            x: processedData.reduced?.smallestKeyInterval ?? Infinity,
            y: Infinity,
        };

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;
        if (!processedData || !dataModel || processedData.data.length === 0) return [];

        const { reduced: { [SMALLEST_KEY_INTERVAL.property]: smallestX } = {} } = processedData;

        const categoryAxis = this.getCategoryAxis();
        const valueAxis = this.getValueAxis();

        const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
        const yExtent = dataModel.getDomain(this, `yValue-end`, 'value', processedData);

        if (direction === this.getCategoryDirection()) {
            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                return keys;
            }

            const scalePadding = smallestX != null && isFinite(smallestX) ? smallestX : 0;
            const keysExtent = extent(keys) ?? [NaN, NaN];
            const isReversed = categoryAxis?.isReversed();

            if (direction === ChartAxisDirection.Y) {
                const d0 = keysExtent[0] + (isReversed ? 0 : -scalePadding);
                const d1 = keysExtent[1] + (isReversed ? scalePadding : 0);
                return fixNumericExtent([d0, d1], categoryAxis);
            }

            const d0 = keysExtent[0] + (isReversed ? -scalePadding : 0);
            const d1 = keysExtent[1] + (isReversed ? 0 : scalePadding);
            return fixNumericExtent([d0, d1], categoryAxis);
        } else if (this.getValueAxis() instanceof LogAxis) {
            return fixNumericExtent(yExtent as any, valueAxis);
        } else {
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return fixNumericExtent(fixedYExtent as any, valueAxis);
        }
    }

    async createNodeData() {
        const { dataModel } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(dataModel && xAxis && yAxis && this.properties.isValid())) {
            return [];
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const {
            groupScale,
            processedData,
            smallestDataInterval,
            ctx: { seriesStateManager },
        } = this;
        const { xKey, yKey, xName, yName, fill, stroke, strokeWidth, cornerRadius, legendItemName, label } =
            this.properties;

        const yReversed = yAxis.isReversed();
        const xBandWidth = ContinuousScale.is(xScale)
            ? xScale.calcBandwidth(smallestDataInterval?.x)
            : xScale.bandwidth;

        const domain = [];
        const { index: groupIndex, visibleGroupCount } = seriesStateManager.getVisiblePeerGroupIndex(this);
        for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
            domain.push(String(groupIdx));
        }
        groupScale.domain = domain;
        groupScale.range = [0, xBandWidth ?? 0];

        if (xAxis instanceof CategoryAxis) {
            groupScale.paddingInner = xAxis.groupPaddingInner;
        } else if (xAxis instanceof GroupedCategoryAxis) {
            groupScale.padding = 0.1;
        } else {
            // Number or Time axis
            groupScale.padding = 0;
        }

        // To get exactly `0` padding we need to turn off rounding
        groupScale.round = groupScale.padding !== 0;

        const barWidth =
            groupScale.bandwidth >= 1
                ? // Pixel-rounded value for low-volume bar charts.
                  groupScale.bandwidth
                : // Handle high-volume bar charts gracefully.
                  groupScale.rawBandwidth;

        const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
        const yRawIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-raw`).index;
        const yStartIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-start`).index;
        const yEndIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-end`).index;
        const yRangeIndex = dataModel.resolveProcessedDataDefById(this, `yValue-range`).index;
        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const contexts: Array<CartesianSeriesNodeDataContext<BarNodeDatum>> = [];

        processedData?.data.forEach(({ keys, datum: seriesDatum, values, aggValues }) => {
            values.forEach((value, contextIndex) => {
                contexts[contextIndex] ??= {
                    itemId: yKey,
                    nodeData: [],
                    labelData: [],
                    scales: super.calculateScaling(),
                    visible: this.visible || animationEnabled,
                };

                const xValue = keys[xIndex];
                const x = xScale.convert(xValue);

                const currY = +value[yEndIndex];
                const prevY = +value[yStartIndex];
                const yRawValue = value[yRawIndex];
                const isPositive = yRawValue >= 0 && !Object.is(yRawValue, -0);
                const isUpward = isPositive !== yReversed;
                const yRange = aggValues?.[yRangeIndex][isPositive ? 1 : 0] ?? 0;
                const barX = x + groupScale.convert(String(groupIndex));

                if (isNaN(currY)) {
                    return;
                }

                const y = yScale.convert(currY);
                const bottomY = yScale.convert(prevY);

                const barAlongX = this.getBarDirection() === ChartAxisDirection.X;

                const bboxHeight = yScale.convert(yRange);
                const bboxBottom = yScale.convert(0);
                const cornerRadiusBbox = new BBox(
                    barAlongX ? Math.min(bboxBottom, bboxHeight) : barX,
                    barAlongX ? barX : Math.min(bboxBottom, bboxHeight),
                    barAlongX ? Math.abs(bboxBottom - bboxHeight) : barWidth,
                    barAlongX ? barWidth : Math.abs(bboxBottom - bboxHeight)
                );

                const rect = {
                    x: barAlongX ? Math.min(y, bottomY) : barX,
                    y: barAlongX ? barX : Math.min(y, bottomY),
                    width: barAlongX ? Math.abs(bottomY - y) : barWidth,
                    height: barAlongX ? barWidth : Math.abs(bottomY - y),
                    cornerRadiusBbox,
                };

                const {
                    fontStyle: labelFontStyle,
                    fontWeight: labelFontWeight,
                    fontSize: labelFontSize,
                    fontFamily: labelFontFamily,
                    color: labelColor,
                    placement,
                } = label;

                const labelText = this.getLabelText(
                    this.properties.label,
                    {
                        datum: seriesDatum[contextIndex],
                        value: yRawValue,
                        xKey,
                        yKey,
                        xName,
                        yName,
                        legendItemName,
                    },
                    (value) => (isFiniteNumber(value) ? value.toFixed(2) : '')
                );
                const labelDatum = labelText
                    ? {
                          text: labelText,
                          fill: labelColor,
                          fontStyle: labelFontStyle,
                          fontWeight: labelFontWeight,
                          fontSize: labelFontSize,
                          fontFamily: labelFontFamily,
                          ...adjustLabelPlacement({
                              isPositive,
                              isVertical: !barAlongX,
                              placement,
                              rect,
                          }),
                      }
                    : undefined;

                const lengthRatioMultiplier = this.shouldFlipXY() ? rect.height : rect.width;
                const nodeData: BarNodeDatum = {
                    series: this,
                    itemId: yKey,
                    datum: seriesDatum[contextIndex],
                    cumulativeValue: currY,
                    xValue,
                    yValue: yRawValue,
                    yKey,
                    xKey,
                    capDefaults: {
                        lengthRatioMultiplier: lengthRatioMultiplier,
                        lengthMax: lengthRatioMultiplier,
                    },
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    midPoint: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
                    fill,
                    stroke,
                    opacity: 1,
                    strokeWidth,
                    cornerRadius,
                    topLeftCornerRadius: barAlongX !== isUpward,
                    topRightCornerRadius: isUpward,
                    bottomRightCornerRadius: barAlongX === isUpward,
                    bottomLeftCornerRadius: !isUpward,
                    cornerRadiusBbox,
                    label: labelDatum,
                };
                contexts[contextIndex].nodeData.push(nodeData);
                contexts[contextIndex].labelData.push(nodeData);
            });
        });

        return contexts;
    }

    protected nodeFactory() {
        return new Rect();
    }

    protected override async updateDatumSelection(opts: {
        nodeData: BarNodeDatum[];
        datumSelection: Selection<Rect, BarNodeDatum>;
    }) {
        return opts.datumSelection.update(
            opts.nodeData,
            (rect) => {
                rect.tag = BarSeriesNodeTag.Bar;
            },
            (datum) => createDatumId(datum.xValue)
        );
    }

    protected override async updateDatumNodes(opts: {
        datumSelection: Selection<Rect, BarNodeDatum>;
        isHighlight: boolean;
    }) {
        if (!this.properties.isValid()) {
            return;
        }

        const {
            yKey,
            stackGroup,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            formatter,
            shadow,
            highlightStyle: { item: itemHighlightStyle },
        } = this.properties;

        const xAxis = this.axes[ChartAxisDirection.X];
        const crisp = checkCrisp(xAxis?.visibleRange);
        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        opts.datumSelection.each((rect, datum) => {
            const style: RectConfig = {
                fill,
                stroke,
                fillOpacity,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                fillShadow: shadow,
                strokeWidth: this.getStrokeWidth(strokeWidth),
                cornerRadius: datum.cornerRadius,
                topLeftCornerRadius: datum.topLeftCornerRadius,
                topRightCornerRadius: datum.topRightCornerRadius,
                bottomRightCornerRadius: datum.bottomRightCornerRadius,
                bottomLeftCornerRadius: datum.bottomLeftCornerRadius,
            };
            const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            const config = getRectConfig({
                datum,
                ctx: this.ctx,
                seriesId: this.id,
                isHighlighted: opts.isHighlight,
                highlightStyle: itemHighlightStyle,
                yKey,
                style,
                formatter,
                stackGroup,
            });
            config.crisp = crisp;
            config.visible = visible;
            updateRect({ rect, config });
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: BarNodeDatum[];
        labelSelection: Selection<Text, BarNodeDatum>;
    }) {
        const data = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(data, (text) => {
            text.tag = BarSeriesNodeTag.Label;
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, BarNodeDatum> }) {
        opts.labelSelection.each((textNode, datum) => {
            updateLabelNode(textNode, this.properties.label, datum.label);
        });
    }

    getTooltipHtml(nodeDatum: BarNodeDatum): string {
        const {
            id: seriesId,
            processedData,
            ctx: { callbackCache },
        } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!processedData || !this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }

        const { xKey, yKey, xName, yName, fill, stroke, strokeWidth, tooltip, formatter, stackGroup } = this.properties;
        const { xValue, yValue, datum } = nodeDatum;

        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        let format: AgBarSeriesStyle | undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                seriesId,
                datum,
                xKey,
                yKey,
                stackGroup,
                fill,
                stroke,
                strokeWidth: this.getStrokeWidth(strokeWidth),
                highlighted: false,
            });
        }

        const color = format?.fill ?? fill;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                datum,
                xKey,
                yKey,
                xName,
                yName,
                stackGroup,
                title,
                color,
                ...this.getModuleTooltipParams(),
            }
        );
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const { showInLegend } = this.properties;

        if (legendType !== 'category' || !this.data?.length || !this.properties.isValid() || !showInLegend) {
            return [];
        }

        const { yKey, yName, fill, stroke, strokeWidth, fillOpacity, strokeOpacity, legendItemName, visible } =
            this.properties;

        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: yKey,
                seriesId: this.id,
                enabled: visible,
                label: { text: legendItemName ?? yName ?? yKey },
                marker: { fill, fillOpacity, stroke, strokeWidth, strokeOpacity },
                legendItemName,
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelections, labelSelections, annotationSelections }: BarAnimationData) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, 'normal'));

        fromToMotion(this.id, 'nodes', this.ctx.animationManager, datumSelections, fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
        seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, annotationSelections);
    }

    override animateWaitingUpdateReady(data: BarAnimationData) {
        const { datumSelections, labelSelections, annotationSelections, previousContextData } = data;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        const diff = this.processedData?.reduced?.diff;
        const mode = previousContextData?.length === 0 ? 'fade' : 'normal';
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, mode));

        fromToMotion(
            this.id,
            'nodes',
            this.ctx.animationManager,
            datumSelections,
            fns,
            (_, datum) => createDatumId(datum.xValue),
            diff
        );

        const hasMotion = diff?.changed ?? true;
        if (hasMotion) {
            seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
            seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, annotationSelections);
        }
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }
}
