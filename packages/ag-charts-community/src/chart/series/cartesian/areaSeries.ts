import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import type {
    AgAreaSeriesLabelFormatterParams,
    AgAreaSeriesOptionsKeys,
    AgCartesianSeriesTooltipRendererParams,
} from '../../../options/agChartOptions';
import { ContinuousScale } from '../../../scale/continuousScale';
import type { DropShadow } from '../../../scene/dropShadow';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { Path2D } from '../../../scene/path2D';
import type { SizedPoint } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/array';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { COLOR_STRING, NUMBER, OPT_LINE_DASH, OPT_NUMBER, OPT_STRING, Validate } from '../../../util/validation';
import { isContinuous, isNumber } from '../../../util/value';
import { LogAxis } from '../../axis/logAxis';
import { TimeAxis } from '../../axis/timeAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DatumPropertyDefinition } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import { animationValidation, normaliseGroupTo } from '../../data/processors';
import { diff } from '../../data/processors';
import { Label } from '../../label';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import { SeriesNodePickMode, groupAccumulativeValueProperty, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import {
    type AreaPathPoint,
    type AreaSeriesNodeDataContext,
    AreaSeriesTag,
    type LabelSelectionDatum,
    type MarkerSelectionDatum,
    prepareAreaPathAnimation,
} from './areaUtil';
import type { CartesianAnimationData } from './cartesianSeries';
import { CartesianSeries } from './cartesianSeries';
import { markerSwipeScaleInAnimation, resetMarkerFn, resetMarkerPositionFn } from './markerUtil';
import { buildResetPathFn, pathFadeInAnimation, pathSwipeInAnimation } from './pathUtil';

type AreaAnimationData = CartesianAnimationData<
    Group,
    MarkerSelectionDatum,
    LabelSelectionDatum,
    AreaSeriesNodeDataContext
>;

export class AreaSeries extends CartesianSeries<
    Group,
    MarkerSelectionDatum,
    LabelSelectionDatum,
    AreaSeriesNodeDataContext
> {
    static className = 'AreaSeries';
    static type = 'area' as const;

    tooltip = new SeriesTooltip<AgCartesianSeriesTooltipRendererParams>();

    readonly marker = new SeriesMarker<AgAreaSeriesOptionsKeys, MarkerSelectionDatum>();

    readonly label = new Label<AgAreaSeriesLabelFormatterParams>();

    @Validate(COLOR_STRING)
    fill: string = '#c16068';

    @Validate(COLOR_STRING)
    stroke: string = '#874349';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            pathsPerSeries: 2,
            pathsZIndexSubOrderOffset: [0, 1000],
            hasMarkers: true,
            markerSelectionGarbageCollection: false,
            pickModes: [SeriesNodePickMode.NEAREST_BY_MAIN_AXIS_FIRST, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            animationResetFns: {
                path: buildResetPathFn({ getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                marker: (node, datum) => ({ ...resetMarkerFn(node), ...resetMarkerPositionFn(node, datum) }),
            },
        });
    }

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string;

    @Validate(OPT_STRING)
    yName?: string;

    @Validate(OPT_NUMBER(0))
    normalizedTo?: number;

    @Validate(NUMBER(0))
    strokeWidth = 2;

    shadow?: DropShadow = undefined;

    override async processData(dataController: DataController) {
        const { xKey, yKey, normalizedTo, data, visible, seriesGrouping: { groupIndex = this.id } = {} } = this;

        if (xKey == null || yKey == null || data == null) return;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const { isContinuousX, isContinuousY } = this.isContinuous();
        const ids = [
            `area-stack-${groupIndex}-yValues`,
            `area-stack-${groupIndex}-yValues-trailing`,
            `area-stack-${groupIndex}-yValues-prev`,
            `area-stack-${groupIndex}-yValues-trailing-prev`,
            `area-stack-${groupIndex}-yValues-marker`,
        ];

        const extraProps = [];
        const normaliseTo = normalizedTo && isFinite(normalizedTo) ? normalizedTo : undefined;
        if (normaliseTo) {
            extraProps.push(normaliseGroupTo(this, [ids[0], ids[1], ids[4]], normaliseTo, 'range'));
            extraProps.push(normaliseGroupTo(this, [ids[2], ids[3]], normaliseTo, 'range'));
        }

        // If two or more datums share an x-value, i.e. lined up vertically, they will have the same datum id.
        // They must be identified this way when animated to ensure they can be tracked when their y-value
        // is updated. If this is a static chart, we can instead not bother with identifying datums and
        // automatically garbage collect the marker selection.
        if (!isContinuousX && animationEnabled && this.processedData) {
            extraProps.push(diff(this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation(this));
        }

        const common: Partial<DatumPropertyDefinition<unknown>> = { invalidValue: null };
        if (!visible) {
            common.forceValue = 0;
        }
        await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                valueProperty(this, yKey, isContinuousY, { id: `yValueRaw`, ...common }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'window', 'current', {
                    id: `yValueEnd`,
                    ...common,
                    groupId: ids[0],
                }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'window-trailing', 'current', {
                    id: `yValueStart`,
                    ...common,
                    groupId: ids[1],
                }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'window', 'last', {
                    id: `yValuePreviousEnd`,
                    ...common,
                    groupId: ids[2],
                }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'window-trailing', 'last', {
                    id: `yValuePreviousStart`,
                    ...common,
                    groupId: ids[3],
                }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'normal', 'current', {
                    id: `yValueCumulative`,
                    ...common,
                    groupId: ids[4],
                }),
                ...extraProps,
            ],
            groupByKeys: true,
        });

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { processedData, dataModel, axes } = this;
        if (!processedData || !dataModel) return [];

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
        const yExtent = dataModel.getDomain(this, `yValueEnd`, 'value', processedData);

        if (direction === ChartAxisDirection.X) {
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }

            return fixNumericExtent(extent(keys), xAxis);
        } else if (yAxis instanceof LogAxis || yAxis instanceof TimeAxis) {
            return fixNumericExtent(yExtent as any, yAxis);
        } else {
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return fixNumericExtent(fixedYExtent as any, yAxis);
        }
    }

    async createNodeData() {
        const { axes, data, processedData: { data: groupedData } = {}, dataModel } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis || !data || !dataModel) {
            return [];
        }

        const { yKey = '', xKey = '', marker, label, fill: seriesFill, stroke: seriesStroke } = this;
        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;

        const continuousY = ContinuousScale.is(yScale);

        const xOffset = (xScale.bandwidth ?? 0) / 2;

        const defs = dataModel.resolveProcessedDataDefsByIds(this, [
            `yValueStart`,
            `yValueEnd`,
            `yValueRaw`,
            `yValuePreviousStart`,
            `yValuePreviousEnd`,
            `yValueCumulative`,
        ]);

        const createMovePoint = (plainPoint: AreaPathPoint) => {
            const { point, ...stroke } = plainPoint;
            return { ...stroke, point: { ...point, moveTo: true } };
        };

        const createPathCoordinates = (xValue: any, lastYEnd: number, yEnd: number): [AreaPathPoint, AreaPathPoint] => {
            const x = xScale.convert(xValue) + xOffset;

            const prevYCoordinate = yScale.convert(lastYEnd);
            const currYCoordinate = yScale.convert(yEnd);

            return [
                { point: { x, y: currYCoordinate }, yValue: yEnd, xValue },
                { point: { x, y: prevYCoordinate }, yValue: lastYEnd, xValue },
            ];
        };

        const createMarkerCoordinate = (xDatum: any, yEnd: number, rawYDatum: any): SizedPoint => {
            let currY;

            // if not normalized, the invalid data points will be processed as `undefined` in processData()
            // if normalized, the invalid data points will be processed as 0 rather than `undefined`
            // check if unprocessed datum is valid as we only want to show markers for valid points
            const normalized = this.normalizedTo && isFinite(this.normalizedTo);
            const normalizedAndValid = normalized && continuousY && isContinuous(rawYDatum);

            const valid = (!normalized && !isNaN(rawYDatum)) || normalizedAndValid;

            if (valid) {
                currY = yEnd;
            }

            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(currY);

            return { x, y, size: marker.size };
        };

        const itemId = yKey;
        const labelData: LabelSelectionDatum[] = [];
        const markerData: MarkerSelectionDatum[] = [];
        const context: AreaSeriesNodeDataContext = {
            itemId,
            fillData: { itemId, points: [] },
            strokeData: { itemId, points: [] },
            labelData,
            nodeData: markerData,
            scales: super.calculateScaling(),
            visible: this.visible,
        };

        const fillPoints = context.fillData.points;
        const fillPhantomPoints: AreaPathPoint[] = [];

        const strokePoints = context.strokeData.points;

        let datumIdx = -1;
        let lastXDatum: any;
        let lastYDatum: any = -Infinity;
        groupedData?.forEach((datumGroup) => {
            const {
                keys,
                keys: [xDatum],
                datum: datumArray,
                values: valuesArray,
            } = datumGroup;

            valuesArray.forEach((values, valueIdx) => {
                datumIdx++;

                const seriesDatum = datumArray[valueIdx];
                const dataValues = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
                const { yValueRaw: yDatum, yValueCumulative } = dataValues;
                let { yValueStart, yValueEnd, yValuePreviousStart, yValuePreviousEnd } = dataValues;

                const validPoint = yDatum != null;

                // marker data
                const point = createMarkerCoordinate(xDatum, +yValueCumulative, yDatum);

                if (validPoint && marker) {
                    markerData.push({
                        index: datumIdx,
                        series: this,
                        itemId,
                        datum: seriesDatum,
                        midPoint: { x: point.x, y: point.y },
                        cumulativeValue: yValueEnd,
                        yValue: yDatum,
                        xValue: xDatum,
                        yKey,
                        xKey,
                        point,
                        fill: marker.fill ?? seriesFill,
                        stroke: marker.stroke ?? seriesStroke,
                        strokeWidth: marker.strokeWidth ?? this.getStrokeWidth(this.strokeWidth),
                    });
                }

                // label data
                if (validPoint && label) {
                    const labelText = this.getLabelText(
                        label,
                        {
                            value: yDatum,
                            datum: seriesDatum,
                            xKey,
                            yKey,
                            xName: this.xName,
                            yName: this.yName,
                        },
                        (value) => (isNumber(value) ? value.toFixed(2) : String(value))
                    );

                    labelData.push({
                        index: datumIdx,
                        series: this,
                        itemId: yKey,
                        datum: seriesDatum,
                        x: point.x,
                        y: point.y,
                        label: labelText
                            ? {
                                  text: labelText,
                                  fontStyle: label.fontStyle,
                                  fontWeight: label.fontWeight,
                                  fontSize: label.fontSize,
                                  fontFamily: label.fontFamily,
                                  textAlign: 'center',
                                  textBaseline: 'bottom',
                                  fill: label.color,
                              }
                            : undefined,
                    });
                }

                // fill data
                if (lastYDatum == null || yDatum == null) {
                    // Reset all coordinates to 'zero' value.
                    yValueStart = yValueStart ?? 0;
                    yValueEnd = yValueStart ?? 0;
                    yValuePreviousStart = yValuePreviousStart ?? 0;
                    yValuePreviousEnd = yValuePreviousStart ?? 0;
                }

                const [prevTop, prevBottom] = createPathCoordinates(lastXDatum, yValuePreviousStart, yValuePreviousEnd);
                const [top, bottom] = createPathCoordinates(xDatum, yValueStart, yValueEnd);

                const xValid = lastXDatum != null && xDatum != null;
                if (xValid) {
                    fillPoints.push(prevTop);
                    fillPhantomPoints.push(prevBottom);
                    fillPoints.push(top);
                    fillPhantomPoints.push(bottom);
                }

                // stroke data
                if (validPoint && lastYDatum != null && datumIdx > 0) {
                    strokePoints.push(createMovePoint(prevTop));
                    strokePoints.push(top);
                }

                lastXDatum = xDatum;
                lastYDatum = yDatum;
            });
        });

        if (strokePoints.length > 0) {
            strokePoints[0] = createMovePoint(strokePoints[0]);
        }

        fillPhantomPoints.reverse();
        fillPoints.push(...fillPhantomPoints);

        return [context];
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.marker.isDirty();
    }

    protected override markerFactory() {
        const { shape } = this.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    protected override async updatePathNodes(opts: {
        paths: Path[];
        opacity: number;
        visible: boolean;
        animationEnabled: boolean;
    }) {
        const { opacity, visible, animationEnabled } = opts;
        const [fill, stroke] = opts.paths;
        const { seriesRectHeight: height, seriesRectWidth: width } = this.nodeDataDependencies;

        const strokeWidth = this.getStrokeWidth(this.strokeWidth);
        stroke.setProperties({
            tag: AreaSeriesTag.Stroke,
            fill: undefined,
            lineJoin: (stroke.lineCap = 'round'),
            pointerEvents: PointerEvents.None,
            stroke: this.stroke,
            strokeWidth,
            strokeOpacity: this.strokeOpacity,
            lineDash: this.lineDash,
            lineDashOffset: this.lineDashOffset,
            opacity,
            visible,
        });
        fill.setProperties({
            tag: AreaSeriesTag.Fill,
            stroke: undefined,
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            fill: this.fill,
            fillOpacity: this.fillOpacity,
            lineDash: this.lineDash,
            lineDashOffset: this.lineDashOffset,
            strokeOpacity: this.strokeOpacity,
            fillShadow: this.shadow,
            opacity,
            visible: visible || animationEnabled,
            strokeWidth,
        });

        const updateClipPath = (path: Path) => {
            if (path.clipPath == null) {
                path.clipPath = new Path2D();
                path.clipScalingX = 1;
                path.clipScalingY = 1;
            }
            path.clipPath?.clear({ trackChanges: true });
            path.clipPath?.rect(-25, -25, (width ?? 0) + 50, (height ?? 0) + 50);
        };
        updateClipPath(stroke);
        updateClipPath(fill);
    }

    protected override async updatePaths(opts: { contextData: AreaSeriesNodeDataContext; paths: Path[] }) {
        this.updateAreaPaths([opts.paths], [opts.contextData]);
    }

    private updateAreaPaths(paths: Path[][], contextData: AreaSeriesNodeDataContext[]) {
        this.updateFillPath(paths, contextData);
        this.updateStrokePath(paths, contextData);
    }

    private updateFillPath(paths: Path[][], contextData: AreaSeriesNodeDataContext[]) {
        contextData.forEach(({ fillData }, contextDataIndex) => {
            const [fill] = paths[contextDataIndex];
            const { path: fillPath } = fill;
            fillPath.clear({ trackChanges: true });
            for (const { point } of fillData.points) {
                if (point.moveTo) {
                    fillPath.moveTo(point.x, point.y);
                } else {
                    fillPath.lineTo(point.x, point.y);
                }
            }
            fillPath.closePath();
            fill.checkPathDirty();
        });
    }

    private updateStrokePath(paths: Path[][], contextData: AreaSeriesNodeDataContext[]) {
        contextData.forEach(({ strokeData }, contextDataIndex) => {
            const [, stroke] = paths[contextDataIndex];
            const { path: strokePath } = stroke;
            strokePath.clear({ trackChanges: true });
            for (const { point } of strokeData.points) {
                if (point.moveTo) {
                    strokePath.moveTo(point.x, point.y);
                } else {
                    strokePath.lineTo(point.x, point.y);
                }
            }
            stroke.checkPathDirty();
        });
    }

    protected override async updateMarkerSelection(opts: {
        nodeData: MarkerSelectionDatum[];
        markerSelection: Selection<Marker, MarkerSelectionDatum>;
    }) {
        const { nodeData, markerSelection } = opts;
        const {
            marker: { enabled },
        } = this;
        const data = enabled && nodeData ? nodeData : [];

        if (this.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }

        return markerSelection.update(data);
    }

    protected override async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, MarkerSelectionDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const { xKey = '', yKey = '', marker, fill, stroke, strokeWidth, fillOpacity, strokeOpacity } = this;
        const baseStyle = mergeDefaults(highlighted && this.highlightStyle.item, marker.getStyle(), {
            fill,
            stroke,
            strokeWidth,
            fillOpacity,
            strokeOpacity,
        });

        markerSelection.each((node, datum) => {
            this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey }, baseStyle);
        });

        if (!highlighted) {
            this.marker.markClean();
        }
    }

    protected async updateLabelSelection(opts: {
        labelData: LabelSelectionDatum[];
        labelSelection: Selection<Text, LabelSelectionDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.tag = AreaSeriesTag.Label;
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, LabelSelectionDatum> }) {
        const { labelSelection } = opts;
        const { enabled: labelEnabled, fontStyle, fontWeight, fontSize, fontFamily, color } = this.label;
        labelSelection.each((text, datum) => {
            const { x, y, label } = datum;

            if (label && labelEnabled && this.visible) {
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.textAlign = label.textAlign;
                text.textBaseline = label.textBaseline;
                text.text = label.text;
                text.x = x;
                text.y = y - 10;
                text.fill = color;
                text.visible = true;
            } else {
                text.visible = false;
            }
        });
    }

    getTooltipHtml(nodeDatum: MarkerSelectionDatum): string {
        const { xKey, id: seriesId, axes, xName, yName, tooltip, marker, dataModel } = this;
        const { yKey, xValue, yValue, datum } = nodeDatum;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(xKey && yKey) || !(xAxis && yAxis && isNumber(yValue)) || !dataModel) {
            return '';
        }

        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        const baseStyle = mergeDefaults({ fill: this.fill }, marker.getStyle(), {
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
        });
        const { fill: color } = this.getMarkerStyle(
            marker,
            { datum: nodeDatum, xKey, yKey, highlighted: false },
            baseStyle
        );

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
            }
        );
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const { data, id, xKey, yKey, yName, marker, fill, stroke, fillOpacity, strokeOpacity, visible } = this;

        if (!data?.length || !xKey || !yKey || legendType !== 'category') {
            return [];
        }

        return [
            {
                legendType,
                id,
                itemId: yKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: yName ?? yKey,
                },
                marker: {
                    shape: marker.shape,
                    fill: marker.fill ?? fill,
                    stroke: marker.stroke ?? stroke,
                    fillOpacity: marker.fillOpacity ?? fillOpacity,
                    strokeOpacity: marker.strokeOpacity ?? strokeOpacity,
                    strokeWidth: marker.strokeWidth ?? 0,
                },
            },
        ];
    }

    override animateEmptyUpdateReady(animationData: AreaAnimationData) {
        const { markerSelections, labelSelections, contextData, paths } = animationData;
        const { animationManager } = this.ctx;
        const { seriesRectWidth: width = 0 } = this.nodeDataDependencies;

        this.updateAreaPaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, paths.flat());
        resetMotion(markerSelections, resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelections, width);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
    }

    protected override animateReadyResize(animationData: AreaAnimationData): void {
        const { contextData, paths } = animationData;
        this.updateAreaPaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    override animateWaitingUpdateReady(animationData: AreaAnimationData) {
        const { animationManager } = this.ctx;
        const { markerSelections, labelSelections, contextData, paths, previousContextData } = animationData;

        super.resetAllAnimation(animationData);

        if (contextData.length === 0 || !previousContextData || previousContextData.length === 0) {
            animationManager.skipCurrentBatch();
            this.updateAreaPaths(paths, contextData);
            return;
        }

        const [[fill, stroke]] = paths;
        const [newData] = contextData;
        const [oldData] = previousContextData;

        const fns = prepareAreaPathAnimation(newData, oldData, this.processedData?.reduced?.diff);
        if (fns === undefined) {
            animationManager.skipCurrentBatch();
            this.updateAreaPaths(paths, contextData);
            return;
        }

        fromToMotion(this.id, 'marker_update', animationManager, markerSelections as any, fns.marker as any);
        fromToMotion(this.id, 'fill_path_properties', animationManager, [fill], fns.fill.pathProperties);
        pathMotion(this.id, 'fill_path_update', animationManager, [fill], fns.fill.path);

        this.updateStrokePath(paths, contextData);
        pathFadeInAnimation(this, 'stroke', animationManager, [stroke]);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    protected nodeFactory() {
        return new Group();
    }
}
