import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import type {
    AgBarSeriesFormatterParams,
    AgBarSeriesLabelFormatterParams,
    AgBarSeriesLabelPlacement,
    AgBarSeriesStyle,
    AgBarSeriesTooltipRendererParams,
    FontStyle,
    FontWeight,
} from '../../../options/agChartOptions';
import { BandScale } from '../../../scale/bandScale';
import { ContinuousScale } from '../../../scale/continuousScale';
import { BBox } from '../../../scene/bbox';
import type { DropShadow } from '../../../scene/dropShadow';
import { PointerEvents } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/array';
import { sanitizeHtml } from '../../../util/sanitize';
import {
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    PLACEMENT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} from '../../../util/validation';
import { isNumber } from '../../../util/value';
import { CategoryAxis } from '../../axis/categoryAxis';
import { GroupedCategoryAxis } from '../../axis/groupedCategoryAxis';
import { LogAxis } from '../../axis/logAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { fixNumericExtent } from '../../data/dataModel';
import { SMALLEST_KEY_INTERVAL, animationValidation, diff, normaliseGroupTo } from '../../data/processors';
import { Label } from '../../label';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import { SeriesNodePickMode, groupAccumulativeValueProperty, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { SeriesTooltip } from '../seriesTooltip';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { AbstractBarSeries } from './abstractBarSeries';
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
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly cornerRadius: number;
    readonly cornerRadiusBbox: BBox | undefined;
    readonly label?: BarNodeLabelDatum;
}

type BarAnimationData = CartesianAnimationData<Rect, BarNodeDatum>;

enum BarSeriesNodeTag {
    Bar,
    Label,
}

class BarSeriesLabel extends Label<AgBarSeriesLabelFormatterParams> {
    @Validate(PLACEMENT)
    placement: AgBarSeriesLabelPlacement = 'inside';
}

export class BarSeries extends AbstractBarSeries<Rect, BarNodeDatum> {
    static className = 'BarSeries';
    static type = 'bar' as const;

    readonly label = new BarSeriesLabel();

    tooltip = new SeriesTooltip<AgBarSeriesTooltipRendererParams>();

    @Validate(COLOR_STRING, { optional: true })
    fill: string = '#c16068';

    @Validate(COLOR_STRING, { optional: true })
    stroke: string = '#874349';

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgBarSeriesFormatterParams<any>) => AgBarSeriesStyle = undefined;

    @Validate(STRING, { optional: true })
    xKey?: string = undefined;

    @Validate(STRING, { optional: true })
    xName?: string = undefined;

    @Validate(STRING, { optional: true })
    yKey?: string = undefined;

    @Validate(STRING, { optional: true })
    yName?: string = undefined;

    @Validate(STRING, { optional: true })
    stackGroup?: string = undefined;

    @Validate(NUMBER, { optional: true })
    normalizedTo?: number;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    shadow?: DropShadow = undefined;

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 0,
            hasHighlightedLabels: true,
            datumSelectionGarbageCollection: false,
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
        const { xKey, yKey, normalizedTo, seriesGrouping: { groupIndex = this.id } = {}, data = [] } = this;

        if (xKey == null || yKey == null || data == null) return;

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
        if (!processedData || !dataModel) return [];

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
            if (direction === ChartAxisDirection.Y) {
                return fixNumericExtent([keysExtent[0] + -scalePadding, keysExtent[1]], categoryAxis);
            }
            return fixNumericExtent([keysExtent[0], keysExtent[1] + scalePadding], categoryAxis);
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

        if (!(dataModel && xAxis && yAxis)) {
            return [];
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const {
            groupScale,
            yKey = '',
            xKey = '',
            fill,
            stroke,
            strokeWidth,
            cornerRadius,
            label,
            processedData,
            ctx: { seriesStateManager },
            smallestDataInterval,
        } = this;

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
        const context: CartesianSeriesNodeDataContext<BarNodeDatum> = {
            itemId: yKey,
            nodeData: [],
            labelData: [],
            scales: super.calculateScaling(),
            visible: this.visible || animationEnabled,
        };
        processedData?.data.forEach(({ keys, datum: seriesDatum, values, aggValues }) => {
            const xValue = keys[xIndex];
            const x = xScale.convert(xValue);

            const currY = +values[0][yEndIndex];
            const prevY = +values[0][yStartIndex];
            const yRawValue = values[0][yRawIndex];
            const yRange = aggValues?.[yRangeIndex][1] ?? 0;
            const barX = x + groupScale.convert(String(groupIndex));

            if (isNaN(currY)) {
                return;
            }

            const y = yScale.convert(currY);
            const bottomY = yScale.convert(prevY);

            const barAlongX = this.getBarDirection() === ChartAxisDirection.X;

            const bboxHeight = yScale.convert(yRange);
            const bboxOrigin = yScale.convert(0);
            const cornerRadiusBbox = new BBox(
                barAlongX ? Math.min(bboxOrigin, bboxHeight) : barX,
                barAlongX ? barX : Math.min(bboxOrigin, bboxHeight),
                barAlongX ? Math.abs(bboxOrigin - bboxHeight) : barWidth,
                barAlongX ? barWidth : Math.abs(bboxOrigin - bboxHeight)
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
                this.label,
                {
                    datum: seriesDatum[0],
                    value: yRawValue,
                    xKey,
                    yKey,
                    xName: this.xName,
                    yName: this.yName,
                    legendItemName: this.legendItemName,
                },
                (value) => (isNumber(value) ? value.toFixed(2) : '')
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
                          isPositive: yRawValue >= 0,
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
                datum: seriesDatum[0],
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
                strokeWidth,
                cornerRadius,
                cornerRadiusBbox,
                label: labelDatum,
            };
            context.nodeData.push(nodeData);
            context.labelData.push(nodeData);
        });

        return [context];
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
            (datum) => datum.xValue
        );
    }

    protected override async updateDatumNodes(opts: {
        datumSelection: Selection<Rect, BarNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const {
            yKey = '',
            fill,
            stroke,
            fillOpacity,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            shadow,
            cornerRadius,
            formatter,
            id: seriesId,
            highlightStyle: { item: itemHighlightStyle },
            ctx,
            stackGroup,
        } = this;

        const xAxis = this.axes[ChartAxisDirection.X];
        const crisp = checkCrisp(xAxis?.visibleRange);
        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        datumSelection.each((rect, datum) => {
            const style: RectConfig = {
                fill,
                stroke,
                fillOpacity,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                fillShadow: shadow,
                strokeWidth: this.getStrokeWidth(this.strokeWidth),
                cornerRadius,
                cornerRadiusBbox: datum.cornerRadiusBbox,
            };
            const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            const config = getRectConfig({
                datum,
                isHighlighted: isHighlight,
                style,
                highlightStyle: itemHighlightStyle,
                formatter,
                seriesId,
                stackGroup,
                ctx,
                yKey,
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
        const data = this.label.enabled ? opts.labelData : [];
        return opts.labelSelection.update(data, (text) => {
            text.tag = BarSeriesNodeTag.Label;
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, BarNodeDatum> }) {
        opts.labelSelection.each((textNode, datum) => {
            updateLabelNode(textNode, this.label, datum.label);
        });
    }

    getTooltipHtml(nodeDatum: BarNodeDatum): string {
        const {
            xKey,
            yKey,
            processedData,
            ctx: { callbackCache },
        } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        const { xValue, yValue, datum } = nodeDatum;

        if (!processedData || !xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yName, fill, stroke, tooltip, formatter, id: seriesId, stackGroup } = this;
        const strokeWidth = this.getStrokeWidth(this.strokeWidth);
        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        let format: AgBarSeriesStyle | undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                datum,
                fill,
                stroke,
                strokeWidth,
                highlighted: false,
                xKey,
                yKey,
                seriesId,
                stackGroup,
            });
        }

        const color = format?.fill ?? fill;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                datum,
                xKey,
                xName,
                yKey,
                yName,
                color,
                title,
                seriesId,
                stackGroup,
                ...this.getModuleTooltipParams(),
            }
        );
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const {
            id,
            data,
            xKey,
            yKey,
            yName,
            legendItemName,
            fill,
            stroke,
            strokeWidth,
            fillOpacity,
            strokeOpacity,
            visible,
            showInLegend,
        } = this;

        if (legendType !== 'category' || !showInLegend || !data?.length || !xKey || !yKey) {
            return [];
        }

        return [
            {
                legendType: 'category',
                id,
                itemId: yKey,
                seriesId: id,
                enabled: visible,
                label: { text: legendItemName ?? yName ?? yKey },
                marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth },
                legendItemName,
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelections, labelSelections, annotationSelections }: BarAnimationData) {
        const fns = prepareBarAnimationFunctions(
            collapsedStartingBarPosition(this.direction === 'vertical', this.axes)
        );

        fromToMotion(this.id, 'nodes', this.ctx.animationManager, datumSelections, fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
        seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, annotationSelections);
    }

    override animateWaitingUpdateReady(data: BarAnimationData) {
        const { datumSelections, labelSelections, annotationSelections } = data;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        const diff = this.processedData?.reduced?.diff;
        const fns = prepareBarAnimationFunctions(
            collapsedStartingBarPosition(this.direction === 'vertical', this.axes)
        );

        fromToMotion(
            this.id,
            'nodes',
            this.ctx.animationManager,
            datumSelections,
            fns,
            (_, datum) => String(datum.xValue),
            diff
        );

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
        seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, annotationSelections);
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }
}
