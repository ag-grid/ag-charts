import type {
    AgRangeAreaSeriesLabelFormatterParams,
    AgRangeAreaSeriesLabelPlacement,
    AgRangeAreaSeriesOptionsKeys,
    AgRangeAreaSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const {
    Validate,
    valueProperty,
    trailingValueProperty,
    keyProperty,
    ChartAxisDirection,
    NUMBER,
    STRING_UNION,
    OPT_NUMBER,
    OPT_STRING,
    OPT_COLOR_STRING,
    OPT_LINE_DASH,
    mergeDefaults,
    updateLabelNode,
    fixNumericExtent,
    AreaSeriesTag,
    buildResetPathFn,
    resetLabelFn,
    resetMarkerFn,
    resetMarkerPositionFn,
    pathSwipeInAnimation,
    resetMotion,
    markerSwipeScaleInAnimation,
    seriesLabelFadeInAnimation,
    animationValidation,
    diff,
} = _ModuleSupport;
const { getMarker, PointerEvents, Path2D } = _Scene;
const { sanitizeHtml, extent, isNumber } = _Util;

const DEFAULT_DIRECTION_KEYS = {
    [_ModuleSupport.ChartAxisDirection.X]: ['xKey'],
    [_ModuleSupport.ChartAxisDirection.Y]: ['yLowKey', 'yHighKey'],
};
const DEFAULT_DIRECTION_NAMES = {
    [ChartAxisDirection.X]: ['xName'],
    [ChartAxisDirection.Y]: ['yLowName', 'yHighName', 'yName'],
};

type RangeAreaLabelDatum = Readonly<_Scene.Point> & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId?: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
};

interface RangeAreaMarkerDatum extends Required<Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'>> {
    readonly index: number;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: number;
    readonly yHighValue: number;
}

interface RangeAreaContext
    extends _ModuleSupport.CartesianSeriesNodeDataContext<RangeAreaMarkerDatum, RangeAreaLabelDatum> {
    fillData: RadarAreaPathDatum;
    strokeData: RadarAreaPathDatum;
}

class RangeAreaSeriesNodeClickEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeClickEvent<RangeAreaMarkerDatum, TEvent> {
    readonly xKey?: string;
    readonly yLowKey?: string;
    readonly yHighKey?: string;

    constructor(type: TEvent, nativeEvent: MouseEvent, datum: RangeAreaMarkerDatum, series: RangeAreaSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.xKey;
        this.yLowKey = series.yLowKey;
        this.yHighKey = series.yHighKey;
    }
}

class RangeAreaSeriesLabel extends _Scene.Label<AgRangeAreaSeriesLabelFormatterParams> {
    @Validate(STRING_UNION('inside', 'outside'))
    placement: AgRangeAreaSeriesLabelPlacement = 'outside';

    @Validate(OPT_NUMBER(0))
    padding: number = 6;
}

type RadarAreaPoint = _ModuleSupport.AreaPathPoint & { size: number };

type RadarAreaPathDatum = {
    readonly points: RadarAreaPoint[];
    readonly itemId: string;
};

export class RangeAreaSeries extends _ModuleSupport.CartesianSeries<
    _Scene.Group,
    RangeAreaMarkerDatum,
    RangeAreaLabelDatum,
    RangeAreaContext
> {
    static className = 'RangeAreaSeries';
    static type = 'range-area' as const;

    protected override readonly NodeClickEvent = RangeAreaSeriesNodeClickEvent;

    readonly marker = new _ModuleSupport.SeriesMarker<AgRangeAreaSeriesOptionsKeys, RangeAreaMarkerDatum>();
    readonly label = new RangeAreaSeriesLabel();

    tooltip = new _ModuleSupport.SeriesTooltip<AgRangeAreaSeriesTooltipRendererParams>();

    shadow?: _Scene.DropShadow = undefined;

    @Validate(OPT_COLOR_STRING)
    fill: string = '#99CCFF';

    @Validate(OPT_COLOR_STRING)
    stroke: string = '#99CCFF';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(NUMBER(0))
    strokeWidth: number = 1;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            hasHighlightedLabels: true,
            hasMarkers: true,
            pathsPerSeries: 2,
            directionKeys: DEFAULT_DIRECTION_KEYS,
            directionNames: DEFAULT_DIRECTION_NAMES,
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
    yLowKey?: string = undefined;

    @Validate(OPT_STRING)
    yLowName?: string = undefined;

    @Validate(OPT_STRING)
    yHighKey?: string = undefined;

    @Validate(OPT_STRING)
    yHighName?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    override async processData(dataController: _ModuleSupport.DataController) {
        const { xKey, yLowKey, yHighKey, data = [] } = this;

        if (!yLowKey || !yHighKey) return;

        const { isContinuousX, isContinuousY } = this.isContinuous();

        const extraProps = [];
        const animationEnabled = !this.ctx.animationManager.isSkipped();
        if (!this.ctx.animationManager.isSkipped() && this.processedData) {
            extraProps.push(diff(this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation(this));
        }

        await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: `xValue` }),
                valueProperty(this, yLowKey, isContinuousY, { id: `yLowValue`, invalidValue: undefined }),
                valueProperty(this, yHighKey, isContinuousY, { id: `yHighValue`, invalidValue: undefined }),
                trailingValueProperty(this, yLowKey, isContinuousY, {
                    id: `yLowTrailingValue`,
                    invalidValue: undefined,
                }),
                trailingValueProperty(this, yHighKey, isContinuousY, {
                    id: `yHighTrailingValue`,
                    invalidValue: undefined,
                }),
                ...extraProps,
            ],
            dataVisible: this.visible,
        });

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { processedData, dataModel, axes } = this;
        if (!(processedData && dataModel)) return [];

        const {
            domain: {
                keys: [keys],
                values,
            },
        } = processedData;

        if (direction === ChartAxisDirection.X) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);

            const xAxis = axes[ChartAxisDirection.X];
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }

            return fixNumericExtent(extent(keys), xAxis);
        } else {
            const yLowIndex = dataModel.resolveProcessedDataIndexById(this, 'yLowValue').index;
            const yLowExtent = values[yLowIndex];
            const yHighIndex = dataModel.resolveProcessedDataIndexById(this, 'yHighValue').index;
            const yHighExtent = values[yHighIndex];
            const fixedYExtent = [
                yLowExtent[0] > yHighExtent[0] ? yHighExtent[0] : yLowExtent[0],
                yHighExtent[1] < yLowExtent[1] ? yLowExtent[1] : yHighExtent[1],
            ];
            return fixNumericExtent(fixedYExtent as any);
        }
    }

    async createNodeData() {
        const { data, dataModel, axes, visible } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(data && visible && xAxis && yAxis && dataModel)) {
            return [];
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const { yLowKey = '', yHighKey = '', xKey = '', processedData } = this;

        const itemId = `${yLowKey}-${yHighKey}`;
        const xOffset = (xScale.bandwidth ?? 0) / 2;

        const defs = dataModel.resolveProcessedDataDefsByIds(this, [
            `xValue`,
            `yHighValue`,
            `yLowValue`,
            `yHighTrailingValue`,
            `yLowTrailingValue`,
        ]);

        const createCoordinates = (xValue: any, yHigh: number, yLow: number): [RadarAreaPoint, RadarAreaPoint] => {
            const x = xScale.convert(xValue) + xOffset;
            const yHighCoordinate = yScale.convert(yHigh);
            const yLowCoordinate = yScale.convert(yLow);

            return [
                { point: { x, y: yHighCoordinate }, size: this.marker.size, itemId: `high`, yValue: yHigh, xValue },
                { point: { x, y: yLowCoordinate }, size: this.marker.size, itemId: `low`, yValue: yLow, xValue },
            ];
        };

        const createMovePoint = (plainPoint: RadarAreaPoint) => {
            const { point, ...stroke } = plainPoint;
            return { ...stroke, point: { ...point, moveTo: true } };
        };

        const labelData: RangeAreaLabelDatum[] = [];
        const markerData: RangeAreaMarkerDatum[] = [];
        const strokeData: RadarAreaPathDatum = { itemId, points: [] };
        const fillData: RadarAreaPathDatum = { itemId, points: [] };
        const context: RangeAreaContext = {
            itemId,
            labelData,
            nodeData: markerData,
            fillData,
            strokeData,
            scales: super.calculateScaling(),
            visible: this.visible,
        };

        const fillHighPoints = fillData.points;
        const fillLowPoints: RadarAreaPoint[] = [];

        const strokeHighPoints = strokeData.points;
        const strokeLowPoints: RadarAreaPoint[] = [];

        let lastXValue: any;
        let lastYHighDatum: any = -Infinity;
        let lastYLowDatum: any = -Infinity;
        processedData?.data.forEach(({ keys, datum, values }, datumIdx) => {
            const dataValues = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
            const { xValue, yHighValue, yLowValue } = dataValues;

            const invalidRange = yHighValue == null || yLowValue == null;
            const points = invalidRange ? [] : createCoordinates(xValue, yHighValue, yLowValue);

            const inverted = yLowValue > yHighValue;
            points.forEach(({ point: { x, y }, size, itemId = '', yValue }) => {
                // marker data
                markerData.push({
                    index: datumIdx,
                    series: this,
                    itemId,
                    datum,
                    midPoint: { x, y },
                    yHighValue,
                    yLowValue,
                    xValue,
                    xKey,
                    yLowKey,
                    yHighKey,
                    point: { x, y, size },
                });

                // label data
                const labelDatum: RangeAreaLabelDatum = this.createLabelData({
                    point: { x, y },
                    value: yValue,
                    yLowValue,
                    yHighValue,
                    itemId,
                    inverted,
                    datum,
                    series: this,
                });
                labelData.push(labelDatum);
            });

            // fill data
            const lastYValid = lastYHighDatum != null && lastYLowDatum != null;
            const lastValid = lastXValue != null && lastYValid;
            const xValid = xValue != null;
            const yValid = yHighValue != null && yLowValue != null;

            let [high, low] = createCoordinates(xValue, yHighValue ?? 0, yLowValue ?? 0);

            // Handle missing Y-values by 'hiding' the area by making the area height zero between
            // valid points.
            if (!yValid) {
                const [prevHigh, prevLow] = createCoordinates(lastXValue, 0, 0);
                fillHighPoints.push(prevHigh);
                fillLowPoints.push(prevLow);
            } else if (!lastYValid) {
                const [prevHigh, prevLow] = createCoordinates(xValue, 0, 0);
                fillHighPoints.push(prevHigh);
                fillLowPoints.push(prevLow);
            }

            if (xValid && yValid) {
                fillHighPoints.push(high);
                fillLowPoints.push(low);
            }

            // stroke data
            const move = xValid && yValid && !lastValid && datumIdx > 0;
            if (move) {
                high = createMovePoint(high);
                low = createMovePoint(low);
            }
            if (xValid && yValid) {
                strokeHighPoints.push(high);
                strokeLowPoints.push(low);
            }

            lastXValue = xValue;
            lastYHighDatum = yHighValue;
            lastYLowDatum = yLowValue;
        });

        if (fillHighPoints.length > 0) {
            fillHighPoints[0] = createMovePoint(fillHighPoints[0]);
        }
        fillHighPoints.push(...fillLowPoints.reverse());

        if (strokeLowPoints.length > 0) {
            strokeLowPoints[0] = createMovePoint(strokeLowPoints[0]);
        }
        strokeHighPoints.push(...strokeLowPoints);

        return [context];
    }

    private createLabelData({
        point,
        value,
        itemId,
        inverted,
        datum,
        series,
    }: {
        point: _Scene.Point;
        value: any;
        yLowValue: any;
        yHighValue: any;
        itemId: string;
        inverted: boolean;
        datum: any;
        series: RangeAreaSeries;
    }): RangeAreaLabelDatum {
        const { placement, padding = 10 } = this.label;

        const actualItemId = inverted ? (itemId === 'low' ? 'high' : 'low') : itemId;
        const direction =
            (placement === 'outside' && actualItemId === 'high') || (placement === 'inside' && actualItemId === 'low')
                ? -1
                : 1;

        return {
            x: point.x,
            y: point.y + padding * direction,
            series,
            itemId,
            datum,
            text: this.getLabelText(
                this.label,
                {
                    value,
                    datum,
                    itemId,
                    xKey: this.xKey ?? '',
                    yLowKey: this.yLowKey ?? '',
                    yHighKey: this.yHighKey ?? '',
                    xName: this.xName,
                    yLowName: this.yLowName,
                    yHighName: this.yHighName,
                    yName: this.yName,
                },
                (value) => (isNumber(value) ? value.toFixed(2) : String(value))
            ),
            textAlign: 'center',
            textBaseline: direction === -1 ? 'bottom' : 'top',
        };
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.marker.isDirty();
    }

    protected override markerFactory() {
        const { shape } = this.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    protected override async updatePathNodes(opts: { paths: _Scene.Path[]; opacity: number; visible: boolean }) {
        const { opacity, visible } = opts;
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
            strokeWidth,
            opacity,
            visible,
        });

        const updateClipPath = (path: _Scene.Path) => {
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

    protected override async updatePaths(opts: { contextData: RangeAreaContext; paths: _Scene.Path[] }) {
        this.updateAreaPaths([opts.paths], [opts.contextData]);
    }

    private updateAreaPaths(paths: _Scene.Path[][], contextData: RangeAreaContext[]) {
        this.updateFillPath(paths, contextData);
        this.updateStrokePath(paths, contextData);
    }

    private updateFillPath(paths: _Scene.Path[][], contextData: RangeAreaContext[]) {
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

    private updateStrokePath(paths: _Scene.Path[][], contextData: RangeAreaContext[]) {
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
        nodeData: RangeAreaMarkerDatum[];
        markerSelection: _Scene.Selection<_Scene.Marker, RangeAreaMarkerDatum>;
    }) {
        const { nodeData, markerSelection } = opts;
        const {
            marker: { enabled },
        } = this;
        const data = enabled && nodeData ? nodeData : [];

        if (this.marker.isDirty()) {
            markerSelection.clear();
        }

        return markerSelection.update(data, (marker) => {
            marker.tag = AreaSeriesTag.Marker;
        });
    }

    protected override async updateMarkerNodes(opts: {
        markerSelection: _Scene.Selection<_Scene.Marker, RangeAreaMarkerDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const {
            xKey = '',
            yLowKey = '',
            yHighKey = '',
            marker,
            fill,
            stroke,
            strokeWidth,
            fillOpacity,
            strokeOpacity,
        } = this;

        const baseStyle = mergeDefaults(highlighted && this.highlightStyle.item, marker.getStyle(), {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
        });

        markerSelection.each((node, datum) => {
            this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yHighKey, yLowKey }, baseStyle);
        });

        if (!highlighted) {
            this.marker.markClean();
        }
    }

    protected async updateLabelSelection(opts: {
        labelData: RangeAreaLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, RangeAreaLabelDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.tag = AreaSeriesTag.Label;
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, RangeAreaLabelDatum> }) {
        opts.labelSelection.each((textNode, datum) => {
            updateLabelNode(textNode, this.label, datum);
        });
    }

    protected override getHighlightLabelData(
        labelData: RangeAreaLabelDatum[],
        highlightedItem: RangeAreaMarkerDatum
    ): RangeAreaLabelDatum[] | undefined {
        const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
        return labelItems.length > 0 ? labelItems : undefined;
    }

    protected override getHighlightData(
        nodeData: RangeAreaMarkerDatum[],
        highlightedItem: RangeAreaMarkerDatum
    ): RangeAreaMarkerDatum[] | undefined {
        const highlightItems = nodeData.filter((nodeDatum) => nodeDatum.datum === highlightedItem.datum);
        return highlightItems.length > 0 ? highlightItems : undefined;
    }

    getTooltipHtml(nodeDatum: RangeAreaMarkerDatum): string {
        const { xKey, yLowKey, yHighKey, axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xKey || !yLowKey || !yHighKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yLowName, yHighName, yName, id: seriesId, fill, tooltip } = this;

        const { datum, itemId, xValue, yLowValue, yHighValue } = nodeDatum;

        const color = fill ?? 'gray';

        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yLowString = sanitizeHtml(yAxis.formatDatum(yLowValue));
        const yHighString = sanitizeHtml(yAxis.formatDatum(yHighValue));

        const xSubheading = xName ?? xKey;
        const yLowSubheading = yLowName ?? yLowKey;
        const yHighSubheading = yHighName ?? yHighKey;

        const title = sanitizeHtml(yName);

        const content = yName
            ? `<b>${sanitizeHtml(xSubheading)}</b>: ${xString}<br>` +
              `<b>${sanitizeHtml(yLowSubheading)}</b>: ${yLowString}<br>` +
              `<b>${sanitizeHtml(yHighSubheading)}</b>: ${yHighString}<br>`
            : `${xString}: ${yLowString} - ${yHighString}`;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                itemId,
                datum,
                xKey,
                yLowKey,
                yHighKey,
                xName,
                yLowName,
                yHighName,
                yName,
                color,
            }
        );
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const { id, visible } = this;

        if (legendType !== 'category') {
            return [];
        }

        const { fill, stroke, strokeWidth, fillOpacity, strokeOpacity, yName, yLowName, yHighName, yLowKey, yHighKey } =
            this;
        const legendItemText = yName ?? `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`;

        return [
            {
                legendType: 'category',
                id,
                itemId: `${yLowKey}-${yHighKey}`,
                seriesId: id,
                enabled: visible,
                label: {
                    text: `${legendItemText}`,
                },
                marker: {
                    fill,
                    stroke,
                    fillOpacity,
                    strokeOpacity,
                    strokeWidth,
                },
            },
        ];
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    override onDataChange() {}

    protected nodeFactory() {
        return new _Scene.Group();
    }

    override animateEmptyUpdateReady(
        animationData: _ModuleSupport.CartesianAnimationData<
            _Scene.Group,
            RangeAreaMarkerDatum,
            RangeAreaLabelDatum,
            RangeAreaContext
        >
    ) {
        const { markerSelections, labelSelections, contextData, paths } = animationData;
        const { animationManager } = this.ctx;
        const { seriesRectWidth: width = 0 } = this.nodeDataDependencies;

        this.updateAreaPaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, paths.flat());
        resetMotion(markerSelections, resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelections, width);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
    }

    protected override animateReadyResize(
        animationData: _ModuleSupport.CartesianAnimationData<
            _Scene.Group,
            RangeAreaMarkerDatum,
            RangeAreaLabelDatum,
            RangeAreaContext
        >
    ): void {
        const { contextData, paths } = animationData;
        this.updateAreaPaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    override animateWaitingUpdateReady(
        animationData: _ModuleSupport.CartesianAnimationData<
            _Scene.Group,
            RangeAreaMarkerDatum,
            RangeAreaLabelDatum,
            RangeAreaContext
        >
    ) {
        const { contextData, paths } = animationData;

        super.animateWaitingUpdateReady(animationData);
        this.updateAreaPaths(paths, contextData);
    }
}
