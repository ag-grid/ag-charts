import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { RangeAreaMarkerDatum, RangeAreaProperties } from './rangeAreaProperties';

const {
    valueProperty,
    keyProperty,
    ChartAxisDirection,
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
    updateClipPath,
    isFiniteNumber,
} = _ModuleSupport;
const { getMarker, PointerEvents } = _Scene;
const { sanitizeHtml, extent } = _Util;

type RangeAreaLabelDatum = Readonly<_Scene.Point> & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId?: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
};

interface RangeAreaContext
    extends _ModuleSupport.CartesianSeriesNodeDataContext<RangeAreaMarkerDatum, RangeAreaLabelDatum> {
    fillData: RadarAreaPathDatum;
    strokeData: RadarAreaPathDatum;
}

class RangeAreaSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<RangeAreaMarkerDatum, TEvent> {
    readonly xKey?: string;
    readonly yLowKey?: string;
    readonly yHighKey?: string;

    constructor(type: TEvent, nativeEvent: MouseEvent, datum: RangeAreaMarkerDatum, series: RangeAreaSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.yLowKey = series.properties.yLowKey;
        this.yHighKey = series.properties.yHighKey;
    }
}

type RadarAreaPoint = _ModuleSupport.AreaPathPoint & { size: number };

type RadarAreaPathDatum = {
    readonly points: RadarAreaPoint[];
    readonly itemId: string;
};

export class RangeAreaSeries extends _ModuleSupport.CartesianSeries<
    _Scene.Group,
    RangeAreaProperties,
    RangeAreaMarkerDatum,
    RangeAreaLabelDatum,
    RangeAreaContext
> {
    static readonly className = 'RangeAreaSeries';
    static readonly type = 'range-area' as const;

    override properties = new RangeAreaProperties();

    protected override readonly NodeEvent = RangeAreaSeriesNodeEvent;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            hasMarkers: true,
            pathsPerSeries: 2,
            directionKeys: {
                [ChartAxisDirection.X]: ['xKey'],
                [ChartAxisDirection.Y]: ['yLowKey', 'yHighKey'],
            },
            directionNames: {
                [ChartAxisDirection.X]: ['xName'],
                [ChartAxisDirection.Y]: ['yLowName', 'yHighName', 'yName'],
            },
            animationResetFns: {
                path: buildResetPathFn({ getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                marker: (node, datum) => ({ ...resetMarkerFn(node), ...resetMarkerPositionFn(node, datum) }),
            },
        });
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        if (!this.properties.isValid()) {
            return;
        }

        const { xKey, yLowKey, yHighKey } = this.properties;
        const { isContinuousX, isContinuousY } = this.isContinuous();

        const extraProps = [];
        const animationEnabled = !this.ctx.animationManager.isSkipped();
        if (!this.ctx.animationManager.isSkipped() && this.processedData) {
            extraProps.push(diff(this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation(this));
        }

        await this.requestDataModel<any, any, true>(dataController, this.data ?? [], {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: `xValue` }),
                valueProperty(this, yLowKey, isContinuousY, { id: `yLowValue`, invalidValue: undefined }),
                valueProperty(this, yHighKey, isContinuousY, { id: `yHighValue`, invalidValue: undefined }),
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

        const { xKey, yLowKey, yHighKey, connectMissingData, marker } = this.properties;

        const itemId = `${yLowKey}-${yHighKey}`;
        const xOffset = (xScale.bandwidth ?? 0) / 2;

        const defs = dataModel.resolveProcessedDataDefsByIds(this, [`xValue`, `yHighValue`, `yLowValue`]);

        const createCoordinates = (xValue: any, yHigh: number, yLow: number): [RadarAreaPoint, RadarAreaPoint] => {
            const x = xScale.convert(xValue) + xOffset;
            const yHighCoordinate = yScale.convert(yHigh);
            const yLowCoordinate = yScale.convert(yLow);

            return [
                { point: { x, y: yHighCoordinate }, size: marker.size, itemId: `high`, yValue: yHigh, xValue },
                { point: { x, y: yLowCoordinate }, size: marker.size, itemId: `low`, yValue: yLow, xValue },
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
            scales: this.calculateScaling(),
            visible: this.visible,
        };

        const fillHighPoints = fillData.points;
        const fillLowPoints: RadarAreaPoint[] = [];

        const strokeHighPoints = strokeData.points;
        const strokeLowPoints: RadarAreaPoint[] = [];

        let lastXValue: any;
        let lastYHighDatum: any = -Infinity;
        let lastYLowDatum: any = -Infinity;
        this.processedData?.data.forEach(({ keys, datum, values }, datumIdx) => {
            const dataValues = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
            const { xValue, yHighValue, yLowValue } = dataValues;

            const invalidRange = yHighValue == null || yLowValue == null;
            const points = invalidRange ? [] : createCoordinates(xValue, yHighValue, yLowValue);

            const inverted = yLowValue > yHighValue;
            points.forEach(({ point: { x, y }, size, itemId: datumItemId = '', yValue }) => {
                // marker data
                markerData.push({
                    index: datumIdx,
                    series: this,
                    itemId: datumItemId,
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
                    itemId: datumItemId,
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

            if (!connectMissingData) {
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
            }

            if (xValid && yValid) {
                fillHighPoints.push(high);
                fillLowPoints.push(low);
            }

            // stroke data
            const move = xValid && yValid && !lastValid && !connectMissingData && datumIdx > 0;
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
        const { xKey, yLowKey, yHighKey, xName, yName, yLowName, yHighName, label } = this.properties;
        const { placement, padding = 10 } = label;

        let actualItemId = itemId;
        if (inverted) {
            actualItemId = itemId === 'low' ? 'high' : 'low';
        }
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
                label,
                { value, datum, itemId, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName },
                (v) => (isFiniteNumber(v) ? v.toFixed(2) : String(v))
            ),
            textAlign: 'center',
            textBaseline: direction === -1 ? 'bottom' : 'top',
        };
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.properties.marker.isDirty();
    }

    protected override markerFactory() {
        const { shape } = this.properties.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    protected override async updatePathNodes(opts: { paths: _Scene.Path[]; opacity: number; visible: boolean }) {
        const { opacity, visible } = opts;
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
            strokeWidth,
            opacity,
            visible,
        });

        updateClipPath(this, stroke);
        updateClipPath(this, fill);
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
        if (this.properties.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }
        return markerSelection.update(this.properties.marker.enabled ? nodeData : []);
    }

    protected override async updateMarkerNodes(opts: {
        markerSelection: _Scene.Selection<_Scene.Marker, RangeAreaMarkerDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const { xKey, yLowKey, yHighKey, marker, fill, stroke, strokeWidth, fillOpacity, strokeOpacity } =
            this.properties;

        const baseStyle = mergeDefaults(highlighted && this.properties.highlightStyle.item, marker.getStyle(), {
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
            this.properties.marker.markClean();
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
            updateLabelNode(textNode, this.properties.label, datum);
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
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }

        const { id: seriesId } = this;
        const { xKey, yLowKey, yHighKey, xName, yName, yLowName, yHighName, fill, tooltip } = this.properties;
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
            { seriesId, itemId, datum, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, color }
        );
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const {
            yLowKey,
            yHighKey,
            yName,
            yLowName,
            yHighName,
            fill,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            visible,
            marker,
        } = this.properties;
        const legendItemText = yName ?? `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`;

        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: `${yLowKey}-${yHighKey}`,
                seriesId: this.id,
                enabled: visible,
                label: { text: `${legendItemText}` },
                marker: {
                    shape: marker.shape,
                    fill: marker.fill ?? fill,
                    stroke: marker.stroke ?? stroke,
                    fillOpacity: marker.fillOpacity,
                    strokeOpacity: marker.strokeOpacity,
                    strokeWidth: marker.strokeWidth,
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

    protected isLabelEnabled() {
        return this.properties.label.enabled;
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

        this.updateAreaPaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, paths.flat());
        resetMotion(markerSelections, resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelections);
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
