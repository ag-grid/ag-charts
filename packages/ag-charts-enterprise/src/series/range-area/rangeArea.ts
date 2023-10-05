import type {
    AgCartesianSeriesMarkerFormat,
    AgRangeAreaSeriesLabelPlacement,
    AgRangeAreaSeriesMarkerFormatterParams,
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
    OPT_FUNCTION,
    OPT_COLOR_STRING,
    OPT_LINE_DASH,
    getMarkerConfig,
    updateMarker,
    updateLabel,
    fixNumericExtent,
    animateAreaInitialLoad,
    animateAreaUpdates,
    AreaSeriesTag,
} = _ModuleSupport;
const { getMarker, PointerEvents, SceneChangeDetection } = _Scene;
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

interface RangeAreaMarkerDatum extends Omit<Required<_ModuleSupport.CartesianSeriesNodeDatum>, 'yKey' | 'yValue'> {
    readonly index: number;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: number;
    readonly yHighValue: number;
}

type RangeAreaContext = _ModuleSupport.SeriesNodeDataContext<RangeAreaMarkerDatum, RangeAreaLabelDatum> & {
    fillData: _ModuleSupport.AreaPathData;
    strokeData: _ModuleSupport.AreaPathData;
};

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

type RangeAreaKeys = 'xKey' | 'yLowKey' | 'yHighKey';

class RangeAreaSeriesLabel extends _Scene.Label<{ [K in RangeAreaKeys]?: string }> {
    @Validate(STRING_UNION('inside', 'outside'))
    placement: AgRangeAreaSeriesLabelPlacement = 'outside';

    @Validate(OPT_NUMBER(0))
    padding: number = 6;
}

class RangeAreaSeriesMarker extends _ModuleSupport.SeriesMarker {
    @Validate(OPT_FUNCTION)
    @SceneChangeDetection({ redraw: _Scene.RedrawType.MAJOR })
    formatter?: (
        params: AgRangeAreaSeriesMarkerFormatterParams<RangeAreaMarkerDatum>
    ) => AgCartesianSeriesMarkerFormat = undefined;
}

export class RangeAreaSeries extends _ModuleSupport.CartesianSeries<
    _Scene.Group,
    RangeAreaMarkerDatum,
    RangeAreaLabelDatum,
    RangeAreaContext
> {
    static className = 'RangeAreaSeries';
    static type = 'range-area' as const;

    readonly marker = new RangeAreaSeriesMarker();
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
            ],
            dataVisible: this.visible,
        });
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

    protected override getNodeClickEvent(
        event: MouseEvent,
        datum: RangeAreaMarkerDatum
    ): RangeAreaSeriesNodeClickEvent<'nodeClick'> {
        return new RangeAreaSeriesNodeClickEvent('nodeClick', event, datum, this);
    }

    protected override getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: RangeAreaMarkerDatum
    ): RangeAreaSeriesNodeClickEvent<'nodeDoubleClick'> {
        return new RangeAreaSeriesNodeClickEvent('nodeDoubleClick', event, datum, this);
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

        const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
        const yHighIndex = dataModel.resolveProcessedDataIndexById(this, `yHighValue`).index;
        const yLowIndex = dataModel.resolveProcessedDataIndexById(this, `yLowValue`).index;
        const yHighTrailingIndex = dataModel.resolveProcessedDataIndexById(this, `yHighTrailingValue`).index;
        const yLowTrailingIndex = dataModel.resolveProcessedDataIndexById(this, `yLowTrailingValue`).index;

        const createCoordinates = (
            xValue: any,
            yHigh: number,
            yLow: number
        ): [_ModuleSupport.AreaPathPoint & { size: number }, _ModuleSupport.AreaPathPoint & { size: number }] => {
            const x = xScale.convert(xValue) + xOffset;
            const yHighCoordinate = yScale.convert(yHigh);
            const yLowCoordinate = yScale.convert(yLow);

            return [
                { x, y: yHighCoordinate, size: this.marker.size, itemId: `high`, yValue: yHigh },
                { x, y: yLowCoordinate, size: this.marker.size, itemId: `low`, yValue: yLow },
            ];
        };

        const labelData: RangeAreaLabelDatum[] = [];
        const markerData: RangeAreaMarkerDatum[] = [];
        const strokeData: _ModuleSupport.AreaPathData = { itemId, points: [] };
        const fillData: _ModuleSupport.AreaPathData = { itemId, points: [] };
        const context: RangeAreaContext = {
            itemId,
            labelData,
            nodeData: markerData,
            fillData,
            strokeData,
        };

        const fillHighPoints = fillData.points;
        const fillLowPoints: _ModuleSupport.AreaPathPoint[] = [];

        const strokeHighPoints = strokeData.points;
        const strokeLowPoints: _ModuleSupport.AreaPathPoint[] = [];

        const moveTo: _ModuleSupport.AreaPathPoint = { x: NaN, y: NaN, yValue: undefined, itemId: 'moveTo' };

        let lastXValue: any;
        processedData?.data.forEach(({ keys, datum, values }, datumIdx) => {
            const xValue = keys[xIndex];
            const yHighValue = values[yHighIndex];
            const yLowValue = values[yLowIndex];
            const yHighTrailingValue = values[yHighTrailingIndex];
            const yLowTrailingValue = values[yLowTrailingIndex];

            const invalidRange = yHighValue == null || yLowValue == null;
            const points = invalidRange ? [] : createCoordinates(xValue, yHighValue, yLowValue);

            const inverted = yLowValue > yHighValue;
            points.forEach(({ x, y, size, itemId = '', yValue }) => {
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

            // Handle data in pairs of current and next x and y values
            const windowX = [lastXValue, xValue];
            const windowYHigh = [yHighTrailingValue, yHighValue];
            const windowYLow = [yLowTrailingValue, yLowValue];

            const invalidYValues = windowYHigh.some((v) => v == null) || windowYLow.some((v) => v == null);
            const invalidXValues = windowX.some((v) => v == null);

            if (invalidXValues) {
                lastXValue = xValue;
                return;
            }
            if (invalidYValues) {
                windowYHigh[0] = null;
                windowYHigh[1] = null;
                windowYLow[0] = null;
                windowYLow[1] = null;
            }

            const trailingCoordinates = createCoordinates(lastXValue, +windowYHigh[0], +windowYLow[0]);
            const currentCoordinates = createCoordinates(xValue, +windowYHigh[1], +windowYLow[1]);

            const highPoints = [trailingCoordinates[0], currentCoordinates[0]];
            const lowPoints = [trailingCoordinates[1], currentCoordinates[1]];

            // fill data
            fillHighPoints.push(...highPoints);
            fillLowPoints.push(...lowPoints);

            // stroke data
            if (invalidYValues) {
                strokeHighPoints.push(moveTo);
                strokeLowPoints.push(moveTo);
            } else {
                strokeHighPoints.push(...highPoints);
                strokeLowPoints.push(...lowPoints);
            }

            lastXValue = xValue;
        });

        for (let i = fillLowPoints.length - 1; i >= 0; i--) {
            fillHighPoints.push(fillLowPoints[i]);
        }

        strokeHighPoints.push(moveTo);
        for (let i = strokeLowPoints.length - 1; i >= 0; i--) {
            strokeHighPoints.push(strokeLowPoints[i]);
        }

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
            text: this.getLabelText({ itemId, datum, value }),
            textAlign: 'center',
            textBaseline: direction === -1 ? 'bottom' : 'top',
        };
    }

    private getLabelText({ itemId, datum, value }: { itemId: string; datum: RangeAreaMarkerDatum; value: any }) {
        let labelText;
        if (this.label.formatter) {
            labelText = this.ctx.callbackCache.call(this.label.formatter, {
                seriesId: this.id,
                itemId,
                datum,
                defaultValue: value,
                xKey: this.xKey,
                yLowKey: this.yLowKey,
                yHighKey: this.yHighKey,
            });
        }
        return labelText ?? (isNumber(value) ? value.toFixed(2) : String(value));
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.marker.isDirty();
    }

    protected override markerFactory() {
        const { shape } = this.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
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
            id: seriesId,
            xKey = '',
            yLowKey = '',
            yHighKey = '',
            marker,
            fill,
            stroke,
            strokeWidth,
            fillOpacity,
            strokeOpacity,
            highlightStyle: { item: markerHighlightStyle },
            visible,
            ctx,
        } = this;

        const customMarker = typeof marker.shape === 'function';

        markerSelection.each((node, datum) => {
            const styles = getMarkerConfig({
                datum,
                highlighted,
                formatter: marker.formatter,
                markerStyle: marker,
                seriesStyle: { fill, stroke, strokeWidth, fillOpacity, strokeOpacity },
                highlightStyle: markerHighlightStyle,
                seriesId,
                ctx,
                xKey,
                yHighKey,
                yLowKey,
                highValue: datum.yHighValue,
                lowValue: datum.yLowValue,
                itemId: datum.itemId,
                size: datum.point.size,
                strokeWidth,
            });

            const config = { ...styles, point: datum.point, visible, customMarker };
            updateMarker({ node, config });
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
        const { labelSelection } = opts;
        labelSelection.each((node, datum) => {
            const { label } = this;
            updateLabel({ labelNode: node, labelDatum: datum, config: label, visible: true });
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

    override animateEmptyUpdateReady({
        markerSelections,
        labelSelections,
        contextData,
        paths,
        seriesRect,
    }: {
        markerSelections: Array<_Scene.Selection<_Scene.Marker, RangeAreaMarkerDatum>>;
        labelSelections: Array<_Scene.Selection<_Scene.Text, RangeAreaLabelDatum>>;
        contextData: Array<RangeAreaContext>;
        paths: Array<Array<_Scene.Path>>;
        seriesRect?: _Scene.BBox;
    }) {
        const { id: seriesId, ctx, marker, xKey = '', yHighKey = '', yLowKey = '' } = this;
        const styles = {
            stroke: this.stroke,
            fill: this.fill,
            fillOpacity: this.fillOpacity,
            lineDash: this.lineDash,
            lineDashOffset: this.lineDashOffset,
            strokeOpacity: this.strokeOpacity,
            shadow: this.shadow,
            strokeWidth: this.getStrokeWidth(this.strokeWidth),
        };

        const { size, formatter } = marker;
        const fill = marker.fill ?? styles.fill;
        const stroke = marker.stroke ?? styles.stroke;
        const strokeWidth = marker.strokeWidth ?? this.strokeWidth;

        const getFormatterParams = (nodeDatum: RangeAreaMarkerDatum) => {
            const { datum, itemId, yLowValue, yHighValue } = nodeDatum;
            return {
                datum,
                lowValue: yLowValue,
                highValue: yHighValue,
                itemId,
                xKey,
                yLowKey,
                yHighKey,
                fill,
                stroke,
                strokeWidth,
                size,
                seriesId,
                highlighted: false,
            };
        };

        animateAreaInitialLoad({
            markerSelections: markerSelections as any,
            labelSelections,
            contextData: contextData as any,
            paths,
            seriesRect,
            styles,
            formatter: formatter as any,
            getFormatterParams: getFormatterParams as any,
            seriesId,
            ctx,
        });
    }

    // animateReadyUpdate({
    //     contextData,
    //     paths,
    // }: {
    //     contextData: Array<RangeAreaContext>;
    //     paths: Array<Array<_Scene.Path>>;
    // }) {
    //     const styles = {
    //         stroke: this.stroke,
    //         fill: this.fill,
    //         fillOpacity: this.fillOpacity,
    //         lineDash: this.lineDash,
    //         lineDashOffset: this.lineDashOffset,
    //         strokeOpacity: this.strokeOpacity,
    //         shadow: this.shadow,
    //         strokeWidth: this.getStrokeWidth(this.strokeWidth),
    //     };

    //     areaAnimateUpdates({ contextData, paths, styles });
    // }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    override onDataChange() {}

    protected nodeFactory() {
        return new _Scene.Group();
    }
}
