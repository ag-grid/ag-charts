import type { ModuleContext } from '../../../module/moduleContext';
import * as easing from '../../../motion/easing';
import type { AgTooltipRendererResult } from '../../../options/chart/tooltipOptions';
import type { FontStyle, FontWeight } from '../../../options/chart/types';
import type {
    AgBarSeriesFormat,
    AgBarSeriesFormatterParams,
    AgBarSeriesLabelPlacement,
    AgBarSeriesTooltipRendererParams,
} from '../../../options/series/cartesian/barOptions';
import type { AgCartesianSeriesLabelFormatterParams } from '../../../options/series/cartesian/cartesianLabelOptions';
import { BandScale } from '../../../scale/bandScale';
import { ContinuousScale } from '../../../scale/continuousScale';
import type { DropShadow } from '../../../scene/dropShadow';
import { PointerEvents } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/array';
import { sanitizeHtml } from '../../../util/sanitize';
import type { ValidatePredicate } from '../../../util/validation';
import {
    NUMBER,
    OPTIONAL,
    OPT_COLOR_STRING,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_NUMBER,
    OPT_STRING,
    STRING_UNION,
    Validate,
} from '../../../util/validation';
import { zipObject } from '../../../util/zip';
import { CategoryAxis } from '../../axis/categoryAxis';
import { GroupedCategoryAxis } from '../../axis/groupedCategoryAxis';
import { LogAxis } from '../../axis/logAxis';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { SMALLEST_KEY_INTERVAL, diff, normaliseGroupTo } from '../../data/processors';
import { Label } from '../../label';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import type { SeriesNodeDataContext } from '../series';
import { SeriesNodePickMode, groupAccumulativeValueProperty, keyProperty, valueProperty } from '../series';
import { SeriesTooltip } from '../seriesTooltip';
import type { RectConfig } from './barUtil';
import { checkCrisp, getRectConfig, updateRect } from './barUtil';
import type { CartesianAnimationData, CartesianSeriesNodeDatum } from './cartesianSeries';
import { CartesianSeries, CartesianSeriesNodeClickEvent } from './cartesianSeries';
import { createLabelData, updateLabel } from './labelUtil';

const BAR_LABEL_PLACEMENTS: AgBarSeriesLabelPlacement[] = ['inside', 'outside'];
const OPT_BAR_LABEL_PLACEMENT: ValidatePredicate = (v: any, ctx) =>
    OPTIONAL(v, ctx, (v: any) => BAR_LABEL_PLACEMENTS.includes(v));

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

interface BarNodeDatum extends CartesianSeriesNodeDatum, Readonly<Point> {
    readonly index: number;
    readonly xValue: number;
    readonly yValue: number;
    readonly cumulativeValue: number;
    readonly width: number;
    readonly height: number;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly label?: BarNodeLabelDatum;
}

type BarAnimationData = CartesianAnimationData<Rect, BarNodeDatum>;

enum BarSeriesNodeTag {
    Bar,
    Label,
}

class BarSeriesLabel extends Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgCartesianSeriesLabelFormatterParams) => string = undefined;

    @Validate(OPT_BAR_LABEL_PLACEMENT)
    placement: AgBarSeriesLabelPlacement = 'inside';
}

export class BarSeries extends CartesianSeries<Rect, BarNodeDatum> {
    static className = 'BarSeries';
    static type = 'bar' as const;

    readonly label = new BarSeriesLabel();

    tooltip = new SeriesTooltip<AgBarSeriesTooltipRendererParams>();

    @Validate(OPT_COLOR_STRING)
    fill: string = '#c16068';

    @Validate(OPT_COLOR_STRING)
    stroke: string = '#874349';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgBarSeriesFormatterParams<any>) => AgBarSeriesFormat = undefined;

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    @Validate(STRING_UNION('vertical', 'horizontal'))
    direction: 'vertical' | 'horizontal' = 'vertical';

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 0,
            hasHighlightedLabels: true,
        });

        this.label.enabled = false;
    }

    /**
     * Used to get the position of bars within each group.
     */
    private groupScale = new BandScale<string>();

    protected resolveKeyDirection(direction: ChartAxisDirection) {
        if (this.getBarDirection() === ChartAxisDirection.X) {
            if (direction === ChartAxisDirection.X) {
                return ChartAxisDirection.Y;
            }
            return ChartAxisDirection.X;
        }
        return direction;
    }

    @Validate(OPT_STRING)
    stackGroup?: string = undefined;

    @Validate(OPT_NUMBER())
    normalizedTo?: number;

    @Validate(NUMBER(0))
    strokeWidth: number = 1;

    shadow?: DropShadow = undefined;

    protected smallestDataInterval?: { x: number; y: number } = undefined;

    async processData(dataController: DataController) {
        const { xKey, yKey, normalizedTo, seriesGrouping: { groupIndex = this.id } = {}, data = [] } = this;
        const normalizedToAbs = Math.abs(normalizedTo ?? NaN);

        const isContinuousX = this.getCategoryAxis()?.scale instanceof ContinuousScale;
        const isContinuousY = this.getValueAxis()?.scale instanceof ContinuousScale;
        const stackGroupName = `bar-stack-${groupIndex}-yValues`;
        const stackGroupTrailingName = `${stackGroupName}-trailing`;

        const normaliseTo = normalizedToAbs && isFinite(normalizedToAbs) ? normalizedToAbs : undefined;
        const extraProps = [];
        if (normaliseTo) {
            extraProps.push(normaliseGroupTo(this, [stackGroupName, stackGroupTrailingName], normaliseTo, 'range'));
        }

        if (!this.ctx.animationManager.isSkipped() && this.processedData) {
            extraProps.push(diff(this.processedData));
        }

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                valueProperty(this, yKey, isContinuousY, { id: `yValue-raw`, invalidValue: null }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'normal', 'current', {
                    id: `yValue-end`,
                    invalidValue: null,
                    groupId: stackGroupName,
                    separateNegative: true,
                }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'trailing', 'current', {
                    id: `yValue-start`,
                    invalidValue: null,
                    groupId: stackGroupTrailingName,
                    separateNegative: true,
                }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
            groupByKeys: true,
            dataVisible: this.visible,
        });

        this.dataModel = dataModel;
        this.processedData = processedData;

        this.smallestDataInterval = {
            x: processedData.reduced?.[SMALLEST_KEY_INTERVAL.property] ?? Infinity,
            y: Infinity,
        };

        this.animationState.transition('updateData');
    }

    getDomain(direction: ChartAxisDirection): any[] {
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

            const scalePadding = isFinite(smallestX) ? smallestX : 0;
            const keysExtent = extent(keys) ?? [NaN, NaN];
            if (direction === ChartAxisDirection.Y) {
                return this.fixNumericExtent([keysExtent[0] + -scalePadding, keysExtent[1]], categoryAxis);
            }
            return this.fixNumericExtent([keysExtent[0], keysExtent[1] + scalePadding], categoryAxis);
        } else if (this.getValueAxis() instanceof LogAxis) {
            return this.fixNumericExtent(yExtent as any, valueAxis);
        } else {
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return this.fixNumericExtent(fixedYExtent as any, valueAxis);
        }
    }

    protected getNodeClickEvent(
        event: MouseEvent,
        datum: BarNodeDatum
    ): CartesianSeriesNodeClickEvent<BarNodeDatum, BarSeries, 'nodeClick'> {
        return new CartesianSeriesNodeClickEvent('nodeClick', event, datum, this);
    }

    protected getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: BarNodeDatum
    ): CartesianSeriesNodeClickEvent<BarNodeDatum, BarSeries, 'nodeDoubleClick'> {
        return new CartesianSeriesNodeClickEvent('nodeDoubleClick', event, datum, this);
    }

    private getCategoryAxis(): ChartAxis | undefined {
        const direction = this.getCategoryDirection();
        return this.axes[direction];
    }

    private getValueAxis(): ChartAxis | undefined {
        const direction = this.getBarDirection();
        return this.axes[direction];
    }

    async createNodeData() {
        const { visible, dataModel } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(dataModel && visible && xAxis && yAxis)) {
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
            label,
            id: seriesId,
            processedData,
            ctx,
            ctx: { seriesStateManager },
            smallestDataInterval,
        } = this;

        const xBandWidth =
            xScale instanceof ContinuousScale ? xScale.calcBandwidth(smallestDataInterval?.x) : xScale.bandwidth;

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
        const context: SeriesNodeDataContext<BarNodeDatum> = {
            itemId: yKey,
            nodeData: [],
            labelData: [],
        };
        processedData?.data.forEach(({ keys, datum: seriesDatum, values }, dataIndex) => {
            const xValue = keys[xIndex];
            const x = xScale.convert(xValue);

            const currY = +values[0][yEndIndex];
            const prevY = +values[0][yStartIndex];
            const yRawValue = values[0][yRawIndex];
            const barX = x + groupScale.convert(String(groupIndex));

            if (isNaN(currY)) {
                return;
            }

            const y = yScale.convert(currY);
            const bottomY = yScale.convert(prevY);

            const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
            const rect = {
                x: barAlongX ? Math.min(y, bottomY) : barX,
                y: barAlongX ? barX : Math.min(y, bottomY),
                width: barAlongX ? Math.abs(bottomY - y) : barWidth,
                height: barAlongX ? barWidth : Math.abs(bottomY - y),
            };
            const nodeMidPoint = {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
            };

            const {
                fontStyle: labelFontStyle,
                fontWeight: labelFontWeight,
                fontSize: labelFontSize,
                fontFamily: labelFontFamily,
                color: labelColor,
                formatter,
                placement,
            } = label;

            const {
                text: labelText,
                textAlign: labelTextAlign,
                textBaseline: labelTextBaseline,
                x: labelX,
                y: labelY,
            } = createLabelData({ value: yRawValue, rect, formatter, placement, seriesId, barAlongX, ctx });

            const nodeData: BarNodeDatum = {
                index: dataIndex,
                series: this,
                itemId: yKey,
                datum: seriesDatum[0],
                cumulativeValue: currY,
                xValue,
                yValue: yRawValue,
                yKey,
                xKey,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                nodeMidPoint,
                fill,
                stroke,
                strokeWidth,
                label: labelText
                    ? {
                          text: labelText,
                          fontStyle: labelFontStyle,
                          fontWeight: labelFontWeight,
                          fontSize: labelFontSize,
                          fontFamily: labelFontFamily,
                          textAlign: labelTextAlign,
                          textBaseline: labelTextBaseline,
                          fill: labelColor,
                          x: labelX,
                          y: labelY,
                      }
                    : undefined,
            };
            context.nodeData.push(nodeData);
            context.labelData.push(nodeData);
        });

        return [context];
    }

    protected nodeFactory() {
        return new Rect();
    }

    datumSelectionGarbageCollection = false;

    protected async updateDatumSelection(opts: {
        nodeData: BarNodeDatum[];
        datumSelection: Selection<Rect, BarNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;

        const getDatumId = (datum: BarNodeDatum) => datum.xValue;

        return datumSelection.update(nodeData, (rect) => (rect.tag = BarSeriesNodeTag.Bar), getDatumId);
    }

    protected async updateDatumNodes(opts: { datumSelection: Selection<Rect, BarNodeDatum>; isHighlight: boolean }) {
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
        const { labelData, labelSelection } = opts;
        const { enabled } = this.label;
        const data = enabled ? labelData : [];

        return labelSelection.update(data, (text) => {
            text.tag = BarSeriesNodeTag.Label;
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, BarNodeDatum> }) {
        const { labelSelection } = opts;

        labelSelection.each((text, datum) => {
            const labelDatum = datum.label;

            updateLabel({ labelNode: text, labelDatum, config: this.label, visible: true });
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

        let format: AgBarSeriesFormat | undefined = undefined;

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

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        return tooltip.toTooltipHtml(defaults, {
            datum,
            xKey,
            xValue,
            xName,
            yKey,
            yValue,
            yName,
            color,
            title,
            seriesId,
            stackGroup,
        });
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

        if (!showInLegend || !data?.length || !xKey || !yKey || legendType !== 'category') {
            return [];
        }

        return [
            {
                legendType: 'category',
                id,
                itemId: yKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: legendItemName ?? yName ?? yKey,
                },
                legendItemName,
                marker: {
                    fill,
                    stroke,
                    fillOpacity: fillOpacity,
                    strokeOpacity: strokeOpacity,
                    strokeWidth: strokeWidth,
                },
            },
        ];
    }

    animateEmptyUpdateReady({ datumSelections, labelSelections }: BarAnimationData) {
        const duration = this.ctx.animationManager.defaultDuration;
        const isVertical = this.getBarDirection() === ChartAxisDirection.Y;
        const { startingX, startingY } = this.getDirectionStartingValues(datumSelections);

        datumSelections.forEach((datumSelection) => {
            datumSelection.each((rect, datum) => {
                this.ctx.animationManager.animate({
                    id: `${this.id}_empty-update-ready_${rect.id}`,
                    from: {
                        x: isVertical ? datum.x : startingX,
                        y: isVertical ? startingY : datum.y,
                        width: isVertical ? datum.width : 0,
                        height: isVertical ? 0 : datum.height,
                    },
                    to: { x: datum.x, y: datum.y, width: datum.width, height: datum.height },
                    duration,
                    ease: easing.easeOut,
                    onUpdate(props) {
                        rect.setProperties(props);
                    },
                });
            });
        });

        labelSelections.forEach((labelSelection) => {
            this.ctx.animationManager.animate({
                id: `${this.id}_empty-update-ready_labels`,
                from: 0,
                to: 1,
                duration: 200,
                delay: duration,
                onUpdate(opacity) {
                    labelSelection.each((label) => {
                        label.opacity = opacity;
                    });
                },
            });
        });
    }

    animateReadyHighlight(highlightSelection: Selection<Rect, BarNodeDatum>) {
        this.resetSelectionRects(highlightSelection);
    }

    animateReadyResize({ datumSelections }: BarAnimationData) {
        datumSelections.forEach((datumSelection) => {
            this.resetSelectionRects(datumSelection);
        });
    }

    animateWaitingUpdateReady({ datumSelections, labelSelections }: BarAnimationData) {
        const { processedData } = this;
        const diff = processedData?.reduced?.diff;

        if (!diff?.changed) {
            datumSelections.forEach((datumSelection) => {
                this.resetSelectionRects(datumSelection);
            });
            return;
        }

        const duration = this.ctx.animationManager.defaultDuration;
        const labelDuration = 200;

        const { startingX, startingY } = this.getDirectionStartingValues(datumSelections);

        const addedIds = zipObject(diff.added, true);
        const removedIds = zipObject(diff.removed, true);

        datumSelections.forEach((datumSelection) => {
            datumSelection.each((rect, datum) => {
                let from = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
                let to = { x: datum.x, y: datum.y, width: datum.width, height: datum.height };

                let cleanup = false;

                const isAdded = datum.xValue !== undefined && addedIds[datum.xValue] !== undefined;
                const isRemoved = datum.xValue !== undefined && removedIds[datum.xValue] !== undefined;
                const isVertical = this.getBarDirection() === ChartAxisDirection.Y;

                const context = {
                    x: isVertical ? datum.x : startingX,
                    y: isVertical ? startingY : datum.y,
                    width: isVertical ? datum.width : 0,
                    height: isVertical ? 0 : datum.height,
                };

                if (isAdded) {
                    from = context;
                } else if (isRemoved) {
                    from = to;
                    to = context;
                    cleanup = true;
                }

                this.ctx.animationManager.animate({
                    id: `${this.id}_waiting-update-ready_${rect.id}`,
                    from,
                    to,
                    ease: easing.easeOut,
                    onUpdate(props) {
                        rect.setProperties(props);
                    },
                    onComplete() {
                        if (cleanup) {
                            datumSelection.cleanup();
                        }
                    },
                });
            });
        });

        labelSelections.forEach((labelSelection) => {
            this.ctx.animationManager.animate({
                id: `${this.id}_waiting-update-ready_labels`,
                from: 0,
                to: 1,
                delay: duration,
                duration: labelDuration,
                onUpdate(opacity) {
                    labelSelection.each((label) => {
                        label.opacity = opacity;
                    });
                },
            });
        });
    }

    resetSelectionRects(selection: Selection<Rect, BarNodeDatum>) {
        selection.each((rect, { x, y, width, height }) => {
            rect.setProperties({ x, y, width, height });
        });
        selection.cleanup();
    }

    protected getDirectionStartingValues(datumSelections: Array<Selection<Rect, BarNodeDatum>>) {
        const isColumnSeries = this.getBarDirection() === ChartAxisDirection.Y;

        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        const isContinuousX = xAxis?.scale instanceof ContinuousScale;
        const isContinuousY = yAxis?.scale instanceof ContinuousScale;

        let startingX = Infinity;
        let startingY = 0;

        if (yAxis && isColumnSeries) {
            if (isContinuousY) {
                startingY = yAxis.scale.convert(0);
            } else {
                datumSelections.forEach((datumSelection) =>
                    datumSelection.each((_, datum) => {
                        if (datum.yValue >= 0) {
                            startingY = Math.max(startingY, datum.height + datum.y);
                        }
                    })
                );
            }
        }

        if (xAxis && !isColumnSeries) {
            if (isContinuousX) {
                startingX = xAxis.scale.convert(0);
            } else {
                datumSelections.forEach((datumSelection) =>
                    datumSelection.each((_, datum) => {
                        if (datum.yValue >= 0) {
                            startingX = Math.min(startingX, datum.x);
                        }
                    })
                );
            }
        }

        return { startingX, startingY };
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    getBandScalePadding() {
        return { inner: 0.2, outer: 0.1 };
    }

    protected getBarDirection() {
        if (this.direction === 'vertical') {
            return ChartAxisDirection.Y;
        }
        return ChartAxisDirection.X;
    }

    protected getCategoryDirection() {
        if (this.direction === 'vertical') {
            return ChartAxisDirection.X;
        }
        return ChartAxisDirection.Y;
    }
}
