import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import type { SizedPoint } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/array';
import { iterate, iterateReverseArray } from '../../../util/function';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { isDefined, isFiniteNumber } from '../../../util/type-guards';
import { isContinuous } from '../../../util/value';
import { LogAxis } from '../../axis/logAxis';
import { TimeAxis } from '../../axis/timeAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DatumPropertyDefinition } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import { animationValidation, diff, normaliseGroupTo } from '../../data/processors';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import { EMPTY_TOOLTIP_CONTENT, TooltipContent } from '../../tooltip/tooltip';
import {
    PickFocusInputs,
    SeriesNodePickMode,
    groupAccumulativeValueProperty,
    keyProperty,
    valueProperty,
} from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { AreaSeriesProperties } from './areaSeriesProperties';
import {
    type AreaPathPoint,
    type AreaSeriesNodeDataContext,
    AreaSeriesTag,
    type LabelSelectionDatum,
    type MarkerSelectionDatum,
    prepareAreaPathAnimation,
} from './areaUtil';
import type { CartesianAnimationData } from './cartesianSeries';
import {
    CartesianSeries,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import {
    computeMarkerFocusBounds,
    markerFadeInAnimation,
    markerSwipeScaleInAnimation,
    resetMarkerFn,
    resetMarkerPositionFn,
} from './markerUtil';
import { buildResetPathFn, pathFadeInAnimation, pathSwipeInAnimation, updateClipPath } from './pathUtil';

type AreaAnimationData = CartesianAnimationData<
    Group,
    MarkerSelectionDatum,
    LabelSelectionDatum,
    AreaSeriesNodeDataContext
>;

export class AreaSeries extends CartesianSeries<
    Group,
    AreaSeriesProperties,
    MarkerSelectionDatum,
    LabelSelectionDatum,
    AreaSeriesNodeDataContext
> {
    static readonly className = 'AreaSeries';
    static readonly type = 'area' as const;

    override properties = new AreaSeriesProperties();

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
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

    override async processData(dataController: DataController) {
        if (this.data == null || !this.properties.isValid()) {
            return;
        }

        const { data, visible, seriesGrouping: { groupIndex = this.id, stackCount = 1 } = {} } = this;
        const { xKey, yKey, connectMissingData, normalizedTo } = this.properties;
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const ids = [
            `area-stack-${groupIndex}-yValues`,
            `area-stack-${groupIndex}-yValues-trailing`,
            `area-stack-${groupIndex}-yValues-prev`,
            `area-stack-${groupIndex}-yValues-trailing-prev`,
            `area-stack-${groupIndex}-yValues-marker`,
        ];

        const extraProps = [];
        if (isDefined(normalizedTo)) {
            extraProps.push(normaliseGroupTo([ids[0], ids[1], ids[4]], normalizedTo, 'range'));
            extraProps.push(normaliseGroupTo([ids[2], ids[3]], normalizedTo, 'range'));
        }

        // If two or more datums share an x-value, i.e. lined up vertically, they will have the same datum id.
        // They must be identified this way when animated to ensure they can be tracked when their y-value
        // is updated. If this is a static chart, we can instead not bother with identifying datums and
        // automatically garbage collect the marker selection.
        if (!isContinuousX && animationEnabled && this.processedData) {
            extraProps.push(diff(this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation());
        }

        const common: Partial<DatumPropertyDefinition<unknown>> = { invalidValue: null };
        if (connectMissingData && stackCount > 1) {
            common.invalidValue = 0;
        }
        if (!visible) {
            common.forceValue = 0;
        }
        await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                keyProperty(xKey, xScaleType, { id: 'xValue' }),
                valueProperty(yKey, yScaleType, { id: `yValueRaw`, ...common }),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'window',
                    'current',
                    {
                        id: `yValueEnd`,
                        ...common,
                        groupId: ids[0],
                    },
                    yScaleType
                ),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'window-trailing',
                    'current',
                    {
                        id: `yValueStart`,
                        ...common,
                        groupId: ids[1],
                    },
                    yScaleType
                ),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'window',
                    'last',
                    {
                        id: `yValuePreviousEnd`,
                        ...common,
                        groupId: ids[2],
                    },
                    yScaleType
                ),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'window-trailing',
                    'last',
                    {
                        id: `yValuePreviousStart`,
                        ...common,
                        groupId: ids[3],
                    },
                    yScaleType
                ),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'normal',
                    'current',
                    {
                        id: `yValueCumulative`,
                        ...common,
                        groupId: ids[4],
                    },
                    yScaleType
                ),
                ...extraProps,
            ],
            groupByKeys: true,
            groupByData: false,
        });

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { processedData, dataModel, axes } = this;
        if (!processedData || !dataModel || processedData.data.length === 0) return [];

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

        if (!xAxis || !yAxis || !data || !dataModel || !this.properties.isValid()) {
            return;
        }

        const {
            yKey,
            xKey,
            marker,
            label,
            fill: seriesFill,
            stroke: seriesStroke,
            connectMissingData,
        } = this.properties;
        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;

        const { isContinuousY } = this.getScaleInformation({ xScale, yScale });

        const xOffset = (xScale.bandwidth ?? 0) / 2;

        const defs = dataModel.resolveProcessedDataDefsByIds(this, [
            `yValueStart`,
            `yValueEnd`,
            `yValueRaw`,
            `yValuePreviousStart`,
            `yValuePreviousEnd`,
            `yValueCumulative`,
        ]);

        const createMovePoint = (plainPoint: AreaPathPoint) => ({
            ...plainPoint,
            point: { ...plainPoint.point, moveTo: true },
        });

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
            if (
                isDefined(this.properties.normalizedTo) ? isContinuousY && isContinuous(rawYDatum) : !isNaN(rawYDatum)
            ) {
                currY = yEnd;
            }

            return {
                x: xScale.convert(xDatum) + xOffset,
                y: yScale.convert(currY),
                size: marker.size,
            };
        };

        const itemId = yKey;
        const labelData: LabelSelectionDatum[] = [];
        const markerData: MarkerSelectionDatum[] = [];
        const { visibleSameStackCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
        const context: AreaSeriesNodeDataContext = {
            itemId,
            fillData: { itemId, points: [], phantomPoints: [] },
            strokeData: { itemId, points: [] },
            labelData,
            nodeData: markerData,
            scales: this.calculateScaling(),
            visible: this.visible,
            stackVisible: visibleSameStackCount > 0,
        };

        const fillPoints = context.fillData.points;
        const fillPhantomPoints = context.fillData.phantomPoints!;

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
                        strokeWidth: marker.strokeWidth ?? this.getStrokeWidth(this.properties.strokeWidth),
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
                            xName: this.properties.xName,
                            yName: this.properties.yName,
                        },
                        (value) => (isFiniteNumber(value) ? value.toFixed(2) : String(value))
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

                const xValid = lastXDatum != null && xDatum != null;
                const yValid = lastYDatum != null && validPoint;

                // fill data
                if (!yValid) {
                    // Reset all coordinates to 'zero' value.
                    yValueStart = yValueStart ?? 0;
                    yValueEnd = yValueStart ?? 0;
                    yValuePreviousStart = yValuePreviousStart ?? 0;
                    yValuePreviousEnd = yValuePreviousStart ?? 0;
                }

                const [prevTop, prevBottom] = createPathCoordinates(lastXDatum, yValuePreviousStart, yValuePreviousEnd);
                const [top, bottom] = createPathCoordinates(xDatum, yValueStart, yValueEnd);

                if (xValid && (!connectMissingData || yValid)) {
                    fillPoints.push(prevTop, top);
                    fillPhantomPoints.push(prevBottom, bottom);
                }

                // stroke data
                if (yValid && datumIdx > 0) {
                    strokePoints.push(createMovePoint(prevTop), top);
                }

                lastXDatum = xDatum;
                lastYDatum = yDatum;
            });
        });

        if (strokePoints.length > 0) {
            strokePoints[0] = createMovePoint(strokePoints[0]);
        }

        return context;
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.properties.marker.isDirty();
    }

    protected override markerFactory() {
        const { shape } = this.properties.marker;
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

        const strokeWidth = this.getStrokeWidth(this.properties.strokeWidth);
        stroke.setProperties({
            tag: AreaSeriesTag.Stroke,
            fill: undefined,
            lineJoin: (stroke.lineCap = 'round'),
            pointerEvents: PointerEvents.None,
            stroke: this.properties.stroke,
            strokeWidth,
            strokeOpacity: this.properties.strokeOpacity,
            lineDash: this.properties.lineDash,
            lineDashOffset: this.properties.lineDashOffset,
            opacity,
            visible,
        });
        fill.setProperties({
            tag: AreaSeriesTag.Fill,
            stroke: undefined,
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            fill: this.properties.fill,
            fillOpacity: this.properties.fillOpacity,
            lineDash: this.properties.lineDash,
            lineDashOffset: this.properties.lineDashOffset,
            strokeOpacity: this.properties.strokeOpacity,
            fillShadow: this.properties.shadow,
            opacity,
            visible: visible || animationEnabled,
            strokeWidth,
        });

        updateClipPath(this, stroke);
        updateClipPath(this, fill);
    }

    protected override async updatePaths(opts: { contextData: AreaSeriesNodeDataContext; paths: Path[] }) {
        this.updateAreaPaths(opts.paths, opts.contextData);
    }

    private updateAreaPaths(paths: Path[], contextData: AreaSeriesNodeDataContext) {
        this.updateFillPath(paths, contextData);
        this.updateStrokePath(paths, contextData);
    }

    private updateFillPath(paths: Path[], contextData: AreaSeriesNodeDataContext) {
        const { fillData } = contextData;
        const [fill] = paths;
        const { path: fillPath } = fill;
        fillPath.clear(true);

        let lastPoint: { x: number; y: number; moveTo?: boolean } | undefined;
        for (const { point } of iterate(fillData.points, iterateReverseArray(fillData.phantomPoints!))) {
            if (point.moveTo) {
                fillPath.moveTo(point.x, point.y);
            } else if (lastPoint?.y !== point.y) {
                if (lastPoint) {
                    fillPath.lineTo(lastPoint.x, lastPoint.y);
                }
                fillPath.lineTo(point.x, point.y);
            }
            lastPoint = point;
        }
        if (lastPoint) {
            fillPath.lineTo(lastPoint.x, lastPoint.y);
        }
        fillPath.closePath();
        fill.checkPathDirty();
    }

    private updateStrokePath(paths: Path[], contextData: AreaSeriesNodeDataContext) {
        const { strokeData } = contextData;
        const [, stroke] = paths;
        const { path: strokePath } = stroke;
        strokePath.clear(true);
        for (const { point } of strokeData.points) {
            if (point.moveTo) {
                strokePath.moveTo(point.x, point.y);
            } else {
                strokePath.lineTo(point.x, point.y);
            }
        }
        stroke.checkPathDirty();
    }

    protected override async updateMarkerSelection(opts: {
        nodeData: MarkerSelectionDatum[];
        markerSelection: Selection<Marker, MarkerSelectionDatum>;
    }) {
        const { nodeData, markerSelection } = opts;

        if (this.properties.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }

        return markerSelection.update(this.properties.marker.enabled ? nodeData : []);
    }

    protected override async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, MarkerSelectionDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const { xKey, yKey, marker, fill, stroke, strokeWidth, fillOpacity, strokeOpacity, highlightStyle } =
            this.properties;
        const baseStyle = mergeDefaults(highlighted && highlightStyle.item, marker.getStyle(), {
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
            this.properties.marker.markClean();
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
        const { enabled: labelEnabled, fontStyle, fontWeight, fontSize, fontFamily, color } = this.properties.label;
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

    getTooltipHtml(nodeDatum: MarkerSelectionDatum): TooltipContent {
        const { id: seriesId, axes, dataModel } = this;
        const { xKey, xName, yName, tooltip, marker } = this.properties;
        const { yKey, xValue, yValue, datum, itemId } = nodeDatum;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!this.properties.isValid() || !(xAxis && yAxis && isFiniteNumber(yValue)) || !dataModel) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        const baseStyle = mergeDefaults({ fill: this.properties.fill }, marker.getStyle(), {
            stroke: this.properties.stroke,
            strokeWidth: this.properties.strokeWidth,
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
                itemId,
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
        if (!this.data?.length || !this.properties.isValid() || legendType !== 'category') {
            return [];
        }

        const { yKey, yName, fill, stroke, fillOpacity, strokeOpacity, strokeWidth, lineDash, marker, visible } =
            this.properties;

        const useAreaFill = !marker.enabled || marker.fill === undefined;
        return [
            {
                legendType,
                id: this.id,
                itemId: yKey,
                seriesId: this.id,
                enabled: visible,
                label: {
                    text: yName ?? yKey,
                },
                marker: {
                    shape: marker.shape,
                    fill: useAreaFill ? fill : marker.fill,
                    fillOpacity: useAreaFill ? fillOpacity : marker.fillOpacity,
                    stroke: marker.stroke ?? stroke,
                    strokeOpacity: marker.strokeOpacity ?? strokeOpacity,
                    strokeWidth: marker.strokeWidth ?? 0,
                    enabled: marker.enabled || strokeWidth <= 0,
                },
                line: {
                    stroke,
                    strokeOpacity,
                    strokeWidth,
                    lineDash,
                },
            },
        ];
    }

    override animateEmptyUpdateReady(animationData: AreaAnimationData) {
        const { markerSelection, labelSelection, contextData, paths } = animationData;
        const { animationManager } = this.ctx;

        this.updateAreaPaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, ...paths);
        resetMotion([markerSelection], resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelection);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
    }

    protected override animateReadyResize(animationData: AreaAnimationData): void {
        const { contextData, paths } = animationData;
        this.updateAreaPaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    override animateWaitingUpdateReady(animationData: AreaAnimationData) {
        const { animationManager } = this.ctx;
        const { markerSelection, labelSelection, contextData, paths, previousContextData } = animationData;
        const [fill, stroke] = paths;

        // Handling initially hidden series case gracefully.
        if (fill == null && stroke == null) return;

        super.resetAllAnimation(animationData);

        const update = () => {
            this.updateAreaPaths(paths, contextData);
            this.updateStrokePath(paths, contextData);
        };
        const skip = () => {
            animationManager.skipCurrentBatch();
            update();
        };

        if (contextData == null || previousContextData == null) {
            // Added series to existing chart case - fade in series.
            update();

            markerFadeInAnimation(this, animationManager, 'added', markerSelection);
            pathFadeInAnimation(this, 'fill_path_properties', animationManager, 'add', fill);
            pathFadeInAnimation(this, 'stroke', animationManager, 'trailing', stroke);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
            return;
        }

        const fns = prepareAreaPathAnimation(contextData, previousContextData, this.processedData?.reduced?.diff);
        if (fns === undefined) {
            // Un-animatable diff in data, skip all animations.
            skip();
            return;
        } else if (fns.status === 'no-op') {
            return;
        }

        markerFadeInAnimation(this, animationManager, undefined, markerSelection);
        fromToMotion(this.id, 'fill_path_properties', animationManager, [fill], fns.fill.pathProperties);
        pathMotion(this.id, 'fill_path_update', animationManager, [fill], fns.fill.path);

        this.updateStrokePath(paths, contextData);
        pathFadeInAnimation(this, 'stroke', animationManager, 'trailing', stroke);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected nodeFactory() {
        return new Group();
    }

    public getFormattedMarkerStyle(datum: MarkerSelectionDatum) {
        const { xKey, yKey } = datum;
        return this.getMarkerStyle(this.properties.marker, { datum, xKey, yKey, highlighted: true });
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }
}
