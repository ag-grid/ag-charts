import {
    type AgBaseRadarSeriesOptions,
    type AgDrawingMode,
    type AgRadarSeriesLabelFormatterParams,
    type AgRadarSeriesStyle,
    type AgSeriesMarkerStyle,
    type ContextDefault,
    type DatumDefault,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type CallbackParam,
    ChartAxisDirection,
    type DomainWithMetadata,
    type Point,
    type RequireOptional,
    extent,
    isFiniteNumber,
    isNumberEqual,
    mergeDefaults,
} from 'ag-charts-core';

import { type RadarNodeDatum, RadarSeriesProperties } from './radarSeriesProperties';

const {
    DEFAULT_POLAR_DIRECTION_KEYS,
    DEFAULT_POLAR_DIRECTION_NAMES,
    PolarAxis,
    SeriesNodePickMode,
    valueProperty,
    fixNumericExtent,
    seriesLabelFadeInAnimation,
    markerFadeInAnimation,
    resetMarkerFn,
    resetLabelFn,
    animationValidation,
    computeMarkerFocusBounds,
    BBox,
    Group,
    Path,
    Selection,
    Text,
    Marker,
    hasDimmedOpacity,
    updateLabelNode,
    getMarkerStyles,
} = _ModuleSupport;

export interface RadarPathPoint {
    x: number;
    y: number;
    moveTo: boolean;
    radius?: number;
    startAngle?: number;
    endAngle?: number;
    arc?: boolean;
}

interface RadarSeriesNodeDataContext extends _ModuleSupport.SeriesNodeDataContext<number, RadarNodeDatum> {
    styles: _ModuleSupport.SeriesNodeStyleContext<AgSeriesMarkerStyle>;
}

type StylerResult<TStyle extends AgRadarSeriesStyle> = TStyle & { marker?: { enabled?: boolean } };

type BaseRadarSeries = RadarSeries<
    AgRadarSeriesStyle,
    AgBaseRadarSeriesOptions<DatumDefault, ContextDefault, AgRadarSeriesStyle>,
    RadarSeriesProperties<
        AgRadarSeriesStyle,
        AgBaseRadarSeriesOptions<DatumDefault, ContextDefault, AgRadarSeriesStyle>
    >
>;

export type ResolvedRadarStyle<TStyle extends AgRadarSeriesStyle> = {
    [K in keyof TStyle]-?: Exclude<TStyle[K], undefined>;
} & {
    marker: Required<AgSeriesMarkerStyle> & { enabled: boolean };
};

class RadarSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<RadarNodeDatum, TEvent> {
    readonly angleKey?: string;
    readonly radiusKey?: string;
    constructor(type: TEvent, nativeEvent: Event, datum: RadarNodeDatum, series: BaseRadarSeries) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.properties.angleKey;
        this.radiusKey = series.properties.radiusKey;
    }
}

export abstract class RadarSeries<
    TStyle extends AgRadarSeriesStyle,
    TOpts extends AgBaseRadarSeriesOptions<DatumDefault, ContextDefault, TStyle>,
    TProps extends RadarSeriesProperties<TStyle, TOpts>,
> extends _ModuleSupport.PolarSeries<RadarNodeDatum, TOpts, TProps, _ModuleSupport.Marker> {
    static override readonly className: string = 'RadarSeries';

    protected override readonly NodeEvent = RadarSeriesNodeEvent;

    private readonly lineGroup = this.contentGroup.appendChild(new Group({ name: 'radar-line' }));
    protected lineSelection: _ModuleSupport.Selection<_ModuleSupport.Path, boolean> = Selection.select(
        this.lineGroup,
        Path
    );

    protected resetInvalidToZero: boolean = false;

    public contextNodeData?: RadarSeriesNodeDataContext;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            categoryKey: 'angleValue',
            propertyKeys: DEFAULT_POLAR_DIRECTION_KEYS,
            propertyNames: DEFAULT_POLAR_DIRECTION_NAMES,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            canHaveAxes: true,
            animationResetFns: {
                item: resetMarkerFn,
                label: resetLabelFn,
            },
            clipFocusBox: false,
        });

        this.lineGroup.zIndex = 0;
        this.itemGroup.zIndex = 1;
    }

    override renderToOffscreenCanvas(): boolean {
        const highlightActive = this.properties.highlight.enabled && this.ctx.highlightManager.getActiveHighlight() != null;
        const hasHighlightOpacity =
            highlightActive &&
            (hasDimmedOpacity(this.properties.highlight.unhighlightedItem) ||
                hasDimmedOpacity(this.properties.highlight.unhighlightedSeries));

        return super.renderToOffscreenCanvas() || hasHighlightOpacity;
    }

    protected override nodeFactory(): _ModuleSupport.Marker {
        return new Marker();
    }

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return { domain: [] };

        if (direction === ChartAxisDirection.Angle) {
            const domain = dataModel.getDomain(this, `angleValue`, 'value', processedData).domain;
            const sortMetadata = dataModel.getKeySortMetadata(this, 'angleValue', processedData);
            return { domain, sortMetadata };
        } else {
            const domain = dataModel.getDomain(this, `radiusValue`, 'value', processedData).domain;
            const ext = extent(domain.length === 0 ? domain : [0].concat(domain));
            return { domain: fixNumericExtent(ext) };
        }
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { angleKey, radiusKey } = this.properties;
        const extraProps = [];

        if (!this.ctx.animationManager.isSkipped()) {
            extraProps.push(animationValidation());
        }

        const radiusScaleType = this.axes[ChartAxisDirection.Radius]?.scale.type;
        const angleScaleType = this.axes[ChartAxisDirection.Angle]?.scale.type;

        await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                valueProperty(angleKey, angleScaleType, { id: 'angleValue' }),
                valueProperty(radiusKey, radiusScaleType, { id: 'radiusValue', invalidValue: undefined }),
                ...extraProps,
            ],
        });

        this.animationState.transition('updateData');
    }

    protected circleCache = { r: 0, cx: 0, cy: 0 };

    protected didCircleChange() {
        const r = this.radius;
        const cx = this.centerX;
        const cy = this.centerY;
        const cache = this.circleCache;
        if (!(r === cache.r && cx === cache.cx && cy === cache.cy)) {
            this.circleCache = { r, cx, cy };
            return true;
        }
        return false;
    }

    protected getAxisInnerRadius() {
        const radiusAxis = this.axes[ChartAxisDirection.Radius];
        return radiusAxis instanceof PolarAxis ? this.radius * radiusAxis.innerRadiusRatio : 0;
    }

    maybeRefreshNodeData() {
        const didCircleChange = this.didCircleChange();
        if (!didCircleChange && !this.nodeDataRefresh) return;
        this.contextNodeData = this.createNodeData();
        this.nodeData = this.contextNodeData?.nodeData ?? [];
        this.nodeDataRefresh = false;
    }

    override createNodeData() {
        const { processedData, dataModel } = this;

        if (!processedData || !dataModel) return;

        const { angleKey, radiusKey, angleName, radiusName, legendItemName, marker, label } = this.properties;
        const angleScale = this.axes[ChartAxisDirection.Angle]?.scale;
        const radiusScale = this.axes[ChartAxisDirection.Radius]?.scale;

        if (!angleScale || !radiusScale) {
            return;
        }

        const angleValues = dataModel.resolveColumnById<number | string>(this, `angleValue`, processedData);
        const radiusValues = dataModel.resolveColumnById<number>(this, `radiusValue`, processedData);
        const axisInnerRadius = this.getAxisInnerRadius();

        const radiusDomain = this.getSeriesDomain(ChartAxisDirection.Radius).domain;

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        const nodeData = rawData.map((datum, datumIndex): RadarNodeDatum => {
            const angleDatum = angleValues[datumIndex];
            const radiusDatum = radiusValues[datumIndex];

            const angle = angleScale.convert(angleDatum);
            const radius = this.radius + axisInnerRadius - radiusScale.convert(radiusDatum);

            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            const x = cos * radius;
            const y = sin * radius;

            let labelNodeDatum: RadarNodeDatum['label'];
            if (label.enabled) {
                const labelText = this.getLabelText<AgRadarSeriesLabelFormatterParams>(
                    radiusDatum,
                    datum,
                    radiusKey,
                    'radius',
                    radiusDomain,
                    label,
                    { value: radiusDatum, datum, angleKey, radiusKey, angleName, radiusName, legendItemName }
                );

                if (labelText) {
                    let textAlign: CanvasTextAlign = 'right';
                    if (isNumberEqual(cos, 0)) {
                        textAlign = 'center';
                    } else if (cos > 0) {
                        textAlign = 'left';
                    }

                    let textBaseline: CanvasTextBaseline = 'bottom';
                    if (isNumberEqual(sin, 0)) {
                        textBaseline = 'middle';
                    } else if (sin > 0) {
                        textBaseline = 'top';
                    }

                    labelNodeDatum = {
                        x: x + cos * marker.size,
                        y: y + sin * marker.size,
                        text: labelText,
                        textAlign,
                        textBaseline,
                    };
                }
            }

            return {
                series: this,
                datum,
                datumIndex,
                index: datumIndex,
                point: { x, y, size: marker.size },
                midPoint: { x, y },
                label: labelNodeDatum,
                angleValue: angleDatum,
                radiusValue: radiusDatum,
                missing: !isFiniteNumber(angle) || !isFiniteNumber(radius),
            };
        });

        return {
            itemId: radiusKey,
            nodeData,
            labelData: nodeData,
            styles: getMarkerStyles(this, this.properties, marker),
        };
    }

    update({ seriesRect }: { seriesRect?: _ModuleSupport.BBox }) {
        const resize = this.checkResize(seriesRect);

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const { series } = this.ctx.highlightManager?.getActiveHighlight() ?? {};
        this.highlightGroup.visible = (animationEnabled || this.visible) && series === this;

        this.maybeRefreshNodeData();

        this.contentGroup.translationX = this.centerX;
        this.contentGroup.translationY = this.centerY;
        this.highlightGroup.translationX = this.centerX;
        this.highlightGroup.translationY = this.centerY;
        if (this.labelGroup) {
            this.labelGroup.translationX = this.centerX;
            this.labelGroup.translationY = this.centerY;
        }

        this.updatePathSelections();
        this.updateMarkerSelection();
        this.updateHighlightSelection();

        this.updatePathNodes();

        if (this.hasItemStylers()) {
            this.updateDatumStyles(this.itemSelection, false);
            this.updateDatumStyles(this.highlightSelection, true);
        }

        const drawingMode = this.ctx.chartService.highlight?.drawingMode ?? 'overlay';

        this.updateMarkers(this.itemSelection, false, 'overlay');
        this.updateMarkers(this.highlightSelection, true, drawingMode);
        this.updateLabels();

        if (resize) {
            this.animationState.transition('resize');
        }
        this.animationState.transition('update');
    }

    protected updatePathSelections() {
        const pathData = this.visible ? [true] : [];
        this.lineSelection.update(pathData);
    }

    protected updateMarkerSelection() {
        const { marker, styler } = this.properties;
        if (marker.isDirty()) {
            this.itemSelection.clear();
            this.itemSelection.cleanup();
            this.itemSelection = Selection.select(this.itemGroup, () => this.nodeFactory(), false);
        }

        const markersEnabled = styler == null ? marker.enabled : this.getStyle().marker.enabled;
        const data = this.visible && marker.shape && markersEnabled ? this.nodeData : [];
        this.itemSelection.update(data);
    }

    protected updateHighlightSelection() {
        const { marker, styler } = this.properties;
        if (marker.isDirty()) {
            this.highlightSelection.clear();
            this.highlightSelection.cleanup();
            this.highlightSelection = Selection.select(this.highlightGroup, () => this.nodeFactory(), false);
        }

        const markersEnabled = styler == null ? marker.enabled : this.getStyle().marker.enabled;
        const highlighted = this.ctx.highlightManager?.getActiveHighlight();
        const data =
            this.visible && marker.shape && markersEnabled && highlighted?.datum
                ? [{ ...highlighted } as RadarNodeDatum]
                : [];
        this.highlightSelection.update(data);
    }

    protected getMarkerFill(highlightedStyle?: _ModuleSupport.SeriesItemHighlightStyle) {
        return highlightedStyle?.fill ?? this.getStyle().marker.fill;
    }

    protected getDatumStylerProperties(datum: any) {
        const { id: seriesId, properties } = this;
        const { angleKey, radiusKey } = properties;

        return {
            seriesId,
            datum,
            angleKey,
            radiusKey,
        };
    }

    protected updateDatumStyles(
        selection: _ModuleSupport.Selection<_ModuleSupport.Marker, RadarNodeDatum>,
        isHighlight: boolean
    ) {
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        selection.each((_, datum) => {
            const highlightState = this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex);
            const stylerStyle = this.getStyle(highlightState);
            const { stroke, strokeWidth, strokeOpacity } = stylerStyle;

            datum.style = this.getMarkerStyle(
                this.properties.marker,
                datum,
                this.getDatumStylerProperties(datum.datum),
                { isHighlight, highlightState },
                stylerStyle.marker,
                {
                    stroke,
                    strokeWidth,
                    strokeOpacity,
                }
            );
        });
    }

    protected updateMarkers(
        selection: _ModuleSupport.Selection<_ModuleSupport.Marker, RadarNodeDatum>,
        isHighlight: boolean,
        drawingMode: AgDrawingMode
    ) {
        const fillBBox = this.getShapeFillBBox();
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        if (this.renderToOffscreenCanvas() && !isHighlight) {
            drawingMode = 'cutout';
        }

        selection.each((node, datum) => {
            const style =
                datum.style ??
                contextNodeData.styles[this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)];
            this.applyMarkerStyle(style, node, datum.point, fillBBox);

            node.drawingMode = drawingMode;
        });
    }

    protected updateLabels() {
        const { properties } = this;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightData =
            activeHighlight?.series === this && activeHighlight?.datum
                ? [{ ...(activeHighlight as RadarNodeDatum) }]
                : [];

        this.labelSelection.update(this.nodeData).each((node, datum) => {
            if (datum.label) {
                const isHighlight = false;
                node.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
                updateLabelNode(this, node, properties, properties.label, datum.label, isHighlight, activeHighlight);
            }
        });

        this.highlightLabelSelection.update(highlightData).each((node, datum) => {
            if (datum.label) {
                const isHighlight = true;
                node.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
                updateLabelNode(this, node, properties, properties.label, datum.label, isHighlight, activeHighlight);
            }
        });
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties } = this;
        const { angleKey, angleName, radiusKey, radiusName, legendItemName, tooltip, marker } = properties;
        const angleAxis = axes[ChartAxisDirection.Angle];
        const radiusAxis = axes[ChartAxisDirection.Radius];

        if (!dataModel || !processedData || !angleAxis || !radiusAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const angleValue = dataModel.resolveColumnById(this, `angleValue`, processedData)[datumIndex];
        const radiusValue = dataModel.resolveColumnById(this, `radiusValue`, processedData)[datumIndex];

        if (angleValue == null) return;

        const activeStyle = this.getMarkerStyle(marker, { datum, datumIndex }, this.getDatumStylerProperties(datum), {
            isHighlight: false,
        });

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(angleAxis, 'tooltip', angleValue, datum, angleKey, undefined),
                symbol: this.legendItemSymbol(),
                data: [
                    {
                        label: radiusName,
                        fallbackLabel: radiusKey,
                        value: this.getAxisValueText(radiusAxis, 'tooltip', radiusValue, datum, radiusKey, undefined),
                        missing: _ModuleSupport.isTooltipValueMissing(radiusValue),
                    },
                ],
            },
            {
                seriesId,
                datum,
                title: angleName,
                angleKey,
                radiusKey,
                angleName,
                radiusName,
                legendItemName,
                ...(activeStyle as RequireOptional<AgSeriesMarkerStyle>),
            }
        );
    }

    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const { stroke, strokeWidth, strokeOpacity, lineDash, marker } = this.getStyle();

        const markerStyle = {
            shape: marker.shape,
            enabled: marker.enabled || strokeWidth <= 0,
            fill: this.getMarkerFill() ?? marker.stroke ?? stroke ?? 'rgba(0, 0, 0, 0)',
            stroke: marker.stroke ?? stroke ?? 'rgba(0, 0, 0, 0)',
            fillOpacity: marker.fillOpacity,
            strokeOpacity: marker.strokeOpacity,
            strokeWidth: marker.strokeWidth,
            lineDash: marker.lineDash,
            lineDashOffset: marker.lineDashOffset,
        };

        return {
            marker: markerStyle,
            line: {
                enabled: true,
                stroke,
                strokeOpacity,
                strokeWidth,
                lineDash,
            },
        };
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        const { radiusKey, radiusName, legendItemName, showInLegend } = this.properties;

        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId: radiusKey,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId: radiusKey }),
                label: {
                    text: legendItemName ?? radiusName ?? radiusKey,
                },
                symbol: this.legendItemSymbol(),
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }

    protected override pickNodeClosestDatum(hitPoint: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        const { nodeData, centerX: cx, centerY: cy } = this;
        const { x, y } = hitPoint;
        const radius = this.radius;

        const distanceFromCenter = Math.hypot(x - cx, y - cy);
        if (distanceFromCenter > radius + this.maxChartMarkerSize) {
            return;
        }

        let minDistance = Infinity;
        let closestDatum: RadarNodeDatum | undefined;

        for (const datum of nodeData) {
            const { point: { x: datumX = Number.NaN, y: datumY = Number.NaN } = {} } = datum;
            if (Number.isNaN(datumX) || Number.isNaN(datumY)) {
                continue;
            }

            const distance = Math.hypot(hitPoint.x - datumX - cx, hitPoint.y - datumY - cy);
            if (distance < minDistance) {
                minDistance = distance;
                closestDatum = datum;
            }
        }

        if (closestDatum) {
            const distance = Math.max(minDistance - (closestDatum.point?.size ?? 0) / 2, 0);
            return { datum: closestDatum, distance };
        }
    }

    override computeLabelsBBox() {
        const { label } = this.properties;

        this.maybeRefreshNodeData();

        const textBoxes: _ModuleSupport.BBox[] = [];
        const tempText = new Text();
        for (const nodeDatum of this.nodeData) {
            if (!label.enabled || !nodeDatum.label) {
                continue;
            }
            tempText.text = nodeDatum.label.text;
            tempText.x = nodeDatum.label.x;
            tempText.y = nodeDatum.label.y;
            tempText.setFont(label);
            tempText.setAlign(nodeDatum.label);
            const box = tempText.getBBox();
            textBoxes.push(box);
        }
        if (textBoxes.length === 0) {
            return null;
        }
        return BBox.merge(textBoxes);
    }

    protected getLineNode() {
        return this.lineSelection?.at(0);
    }

    protected beforePathAnimation() {
        this.updatePathNodes();
    }

    protected getPathNodesStyle() {
        const highlightDatum = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightState(highlightDatum);
        const highlightStyle = this.getHighlightStyle(undefined, undefined, highlightState);
        const stylerStyle = this.getStyle(highlightState);
        return mergeDefaults(highlightStyle, stylerStyle);
    }

    protected abstract updatePathNodes(): void;

    protected getLinePoints(): RadarPathPoint[] {
        const { nodeData, resetInvalidToZero } = this;
        const { connectMissingData } = this.properties;
        if (nodeData.length === 0) {
            return [];
        }

        const radiusAxis = this.axes[ChartAxisDirection.Radius];
        const angleAxis = this.axes[ChartAxisDirection.Angle];
        const reversedAngleAxis = angleAxis?.isReversed();
        const reversedRadiusAxis = radiusAxis?.isReversed();

        // For inverted radar area the inner line shape points must be anti-clockwise and the zero line points (outer
        // shape must be clockwise) to create a hole in the middle of the shape
        const data = reversedRadiusAxis && !reversedAngleAxis ? [...nodeData].reverse() : nodeData;
        const points: RadarPathPoint[] = [];
        let prevPointInvalid = false;
        let firstValid: RadarNodeDatum | undefined;

        for (const [index, datum] of data.entries()) {
            let { x, y } = datum.point;

            const isPointInvalid = Number.isNaN(x) || Number.isNaN(y);

            if (!isPointInvalid) {
                firstValid ??= datum;
            }

            if (isPointInvalid && !connectMissingData) {
                x = 0;
                y = 0;
            }

            const moveTo =
                index === 0 || (!resetInvalidToZero && !connectMissingData && (isPointInvalid || prevPointInvalid));

            points.push({ x, y, moveTo });

            prevPointInvalid = isPointInvalid;
        }

        if (firstValid !== undefined) {
            points.push({ x: firstValid.point.x, y: firstValid.point.y, moveTo: false });
        }

        return points;
    }

    protected animateSinglePath(pathNode: _ModuleSupport.Path, points: RadarPathPoint[], ratio: number) {
        const { path } = pathNode;

        path.clear(true);

        const axisInnerRadius = this.getAxisInnerRadius();
        const radiusAxis = this.axes[ChartAxisDirection.Radius];
        const reversedRadiusAxis = radiusAxis?.isReversed();
        const radiusZero = reversedRadiusAxis
            ? this.radius + axisInnerRadius - radiusAxis?.scale.convert(0)
            : axisInnerRadius;

        for (const point of points) {
            const { x: x1, y: y1, arc, radius = 0, startAngle = 0, endAngle = 0, moveTo } = point;
            const angle = Math.atan2(y1, x1);
            const x0 = radiusZero * Math.cos(angle);
            const y0 = radiusZero * Math.sin(angle);
            const t = ratio;
            const x = x0 * (1 - t) + x1 * t;
            const y = y0 * (1 - t) + y1 * t;

            if (arc) {
                path.arc(x1, y1, radius, startAngle, endAngle);
            } else if (moveTo) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }
        }

        pathNode.checkPathDirty();
    }

    protected animatePaths(ratio: number) {
        const linePoints = this.getLinePoints();
        const lineNode = this.getLineNode();
        if (!lineNode) return;
        this.animateSinglePath(lineNode, linePoints, ratio);
    }

    override animateEmptyUpdateReady() {
        const { itemSelection, labelSelection } = this;
        const { animationManager } = this.ctx;

        this.beforePathAnimation();

        animationManager.animate({
            id: `${this.id}_'path`,
            groupId: this.id,
            from: 0,
            to: 1,
            phase: 'initial',
            collapsable: false,
            onUpdate: (ratio) => this.animatePaths(ratio),
            onStop: () => this.animatePaths(1),
        });

        markerFadeInAnimation(this, animationManager, 'added', itemSelection);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection, this.highlightLabelSelection);
    }

    override animateWaitingUpdateReady(data: _ModuleSupport.PolarAnimationData) {
        super.animateWaitingUpdateReady(data);
        this.resetPaths();
    }

    override animateReadyResize(data: _ModuleSupport.PolarAnimationData) {
        super.animateReadyResize(data);
        this.resetPaths();
    }

    protected resetPaths(): ResolvedRadarStyle<TStyle> | undefined {
        const lineNode = this.getLineNode();

        if (lineNode) {
            const { path: linePath } = lineNode;
            const linePoints = this.getLinePoints();
            const stylerStyle = this.getStyle();

            lineNode.fill = undefined;
            lineNode.stroke = stylerStyle.stroke;
            lineNode.strokeWidth = stylerStyle.strokeWidth;
            lineNode.strokeOpacity = stylerStyle.strokeOpacity;

            lineNode.lineDash = stylerStyle.lineDash;
            lineNode.lineDashOffset = stylerStyle.lineDashOffset;

            linePath.clear(true);

            for (const { x, y, moveTo } of linePoints) {
                if (moveTo) {
                    linePath.moveTo(x, y);
                } else {
                    linePath.lineTo(x, y);
                }
            }

            lineNode.checkPathDirty();
            // return `getStyle` return so that RadarLineSeries does not need to call `getStyle` twice (once for the
            // lineNode, and once of the areaNode).
            return stylerStyle;
        }
    }

    protected abstract makeStylerParams(
        highlightStateEnum?: _ModuleSupport.HighlightState
    ): CallbackParam<NonNullable<TOpts['styler']>>;

    protected getStylerResult(
        stylerResult: StylerResult<TStyle>,
        highlightState?: _ModuleSupport.HighlightState
    ): StylerResult<TStyle> {
        const { styler } = this.properties;
        if (styler) {
            const stylerParams = this.makeStylerParams(highlightState);
            const cbResult = this.cachedCallWithContext(styler, stylerParams) ?? {};
            const resolved = this.ctx.optionsGraphService.resolvePartial(
                ['series', `${this.declarationOrder}`],
                cbResult,
                { pick: false }
            );
            if (resolved) {
                // The return-type of resolvePartial can stealthly introduce `any` (e.g. stylerResult.marker becomes of
                // type `any`). So convert back to TStyle to avoid this.
                stylerResult = resolved as StylerResult<TStyle>;
            }
        }
        return stylerResult;
    }

    abstract getStyle(highlightState?: _ModuleSupport.HighlightState): ResolvedRadarStyle<TStyle>;

    public getFormattedMarkerStyle(datum: RadarNodeDatum) {
        const { angleKey, radiusKey } = this.properties;
        return this.getMarkerStyle(this.properties.marker, datum, { angleKey, radiusKey }, { isHighlight: true });
    }

    protected override computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.styler != null ||
            this.properties.marker.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
