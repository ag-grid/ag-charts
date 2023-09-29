import type {
    AgRadialColumnSeriesFormat,
    AgRadialColumnSeriesFormatterParams,
    AgRadialColumnSeriesLabelFormatterParams,
    AgRadialColumnSeriesTooltipRendererParams,
    AgTooltipRendererResult,
} from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { RadiusCategoryAxis } from '../../axes/radius-category/radiusCategoryAxis';
import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';

const {
    ChartAxisDirection,
    HighlightStyle,
    NUMBER,
    OPT_COLOR_STRING,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_NUMBER,
    OPT_STRING,
    PolarAxis,
    StateMachine,
    STRING,
    Validate,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    valueProperty,
} = _ModuleSupport;

const { BandScale } = _Scale;
const { Group, Sector, Selection, Text } = _Scene;
const { angleBetween, isNumber, sanitizeHtml } = _Util;

class RadialBarSeriesNodeClickEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeClickEvent<RadialBarNodeDatum, TEvent> {
    readonly angleKey?: string;
    readonly radiusKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: RadialBarNodeDatum, series: RadialBarSeries) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.angleKey;
        this.radiusKey = series.radiusKey;
    }
}

interface RadialBarLabelNodeDatum {
    text: string;
    x: number;
    y: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}

export interface RadialBarNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly label?: RadialBarLabelNodeDatum;
    readonly angleValue: any;
    readonly radiusValue: any;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly startAngle: number;
    readonly endAngle: number;
    readonly index: number;
}

class RadialBarSeriesLabel extends _Scene.Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgRadialColumnSeriesLabelFormatterParams) => string = undefined;
}

type RadialBarAnimationState = 'empty' | 'ready';
type RadialBarAnimationEvent = 'update' | 'resize';

export class RadialBarSeries extends _ModuleSupport.PolarSeries<RadialBarNodeDatum> {
    static className = 'RadialBarSeries';

    readonly label = new RadialBarSeriesLabel();

    protected itemSelection: _Scene.Selection<_Scene.Sector, RadialBarNodeDatum>;
    protected labelSelection: _Scene.Selection<_Scene.Text, RadialBarNodeDatum>;
    protected highlightSelection: _Scene.Selection<_Scene.Sector, RadialBarNodeDatum>;

    protected animationState: _ModuleSupport.StateMachine<RadialBarAnimationState, RadialBarAnimationEvent>;

    protected nodeData: RadialBarNodeDatum[] = [];

    tooltip = new _ModuleSupport.SeriesTooltip<AgRadialColumnSeriesTooltipRendererParams>();

    @Validate(STRING)
    angleKey = '';

    @Validate(OPT_STRING)
    angleName?: string = undefined;

    @Validate(STRING)
    radiusKey: string = '';

    @Validate(OPT_STRING)
    radiusName?: string = undefined;

    @Validate(OPT_COLOR_STRING)
    fill?: string = 'black';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = 'black';

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgRadialColumnSeriesFormatterParams<any>) => AgRadialColumnSeriesFormat = undefined;

    @Validate(NUMBER(-360, 360))
    rotation = 0;

    @Validate(NUMBER(0))
    strokeWidth = 1;

    @Validate(OPT_STRING)
    stackGroup?: string = undefined;

    @Validate(OPT_NUMBER())
    normalizedTo?: number;

    readonly highlightStyle = new HighlightStyle();

    private groupScale = new BandScale<string>();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            useLabelLayer: true,
            canHaveAxes: true,
        });

        const sectorGroup = new Group();
        this.contentGroup.append(sectorGroup);
        sectorGroup.zIndexSubOrder = [() => this._declarationOrder, 1];
        this.itemSelection = Selection.select(sectorGroup, Sector);

        this.labelSelection = Selection.select(this.labelGroup!, Text);

        this.highlightSelection = Selection.select(this.highlightGroup, Sector);

        this.animationState = new StateMachine('empty', {
            empty: {
                update: {
                    target: 'ready',
                    action: () => this.animateEmptyUpdateReady(),
                },
            },
            ready: {
                update: {
                    target: 'ready',
                    action: () => this.animateReadyUpdate(),
                },
                resize: {
                    target: 'ready',
                    action: () => this.animateReadyResize(),
                },
            },
        });
    }

    addChartEventListeners(): void {
        this.ctx.chartEventManager?.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
        this.ctx.chartEventManager?.addListener('legend-item-double-click', (event) =>
            this.onLegendItemDoubleClick(event)
        );
    }

    getDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { axes, dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        if (direction === ChartAxisDirection.X) {
            const angleAxis = axes[ChartAxisDirection.X];
            const xExtent = dataModel.getDomain(this, 'angleValue-end', 'value', processedData);
            const fixedXExtent = [xExtent[0] > 0 ? 0 : xExtent[0], xExtent[1] < 0 ? 0 : xExtent[1]];
            return this.fixNumericExtent(fixedXExtent as any, angleAxis);
        } else {
            return dataModel.getDomain(this, 'radiusValue', 'key', processedData);
        }
    }

    async processData(dataController: _ModuleSupport.DataController) {
        const { data = [], visible } = this;
        const { angleKey, radiusKey } = this;

        if (!angleKey || !radiusKey) return;

        const stackGroupId = this.getStackId();
        const stackGroupTrailingId = `${stackGroupId}-trailing`;

        const normalizedToAbs = Math.abs(this.normalizedTo ?? NaN);
        const normaliseTo = normalizedToAbs && isFinite(normalizedToAbs) ? normalizedToAbs : undefined;
        const extraProps = [];
        if (normaliseTo) {
            extraProps.push(normaliseGroupTo(this, [stackGroupId, stackGroupTrailingId], normaliseTo, 'range'));
        }

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, data, {
            props: [
                keyProperty(this, radiusKey, false, { id: 'radiusValue' }),
                valueProperty(this, angleKey, true, { id: 'angleValue-raw', invalidValue: undefined }),
                ...groupAccumulativeValueProperty(this, angleKey, true, 'window', 'current', {
                    id: `angleValue-end`,
                    invalidValue: null,
                    groupId: stackGroupId,
                }),
                ...groupAccumulativeValueProperty(this, angleKey, true, 'window-trailing', 'current', {
                    id: `angleValue-start`,
                    invalidValue: null,
                    groupId: stackGroupTrailingId,
                }),
                ...extraProps,
            ],
            dataVisible: visible,
        });

        this.dataModel = dataModel;
        this.processedData = processedData;
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

    protected async maybeRefreshNodeData() {
        const circleChanged = this.didCircleChange();
        if (!circleChanged && !this.nodeDataRefresh) return;
        const [{ nodeData = [] } = {}] = await this.createNodeData();
        this.nodeData = nodeData;
        this.nodeDataRefresh = false;
    }

    protected getAxisInnerRadius() {
        const radiusAxis = this.axes[ChartAxisDirection.Y];
        return radiusAxis instanceof PolarAxis ? this.radius * radiusAxis.innerRadiusRatio : 0;
    }

    async createNodeData() {
        const { processedData, dataModel, angleKey, radiusKey } = this;

        if (!processedData || !dataModel || !angleKey || !radiusKey) {
            return [];
        }

        const angleAxis = this.axes[ChartAxisDirection.X];
        const radiusAxis = this.axes[ChartAxisDirection.Y];
        const angleScale = angleAxis?.scale;
        const radiusScale = radiusAxis?.scale;

        if (!angleScale || !radiusScale) {
            return [];
        }

        const angleStartIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-start`).index;
        const angleEndIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-end`).index;
        const angleRawIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-raw`).index;

        const { label, id: seriesId } = this;

        let groupPaddingInner = 0;
        if (radiusAxis instanceof RadiusCategoryAxis) {
            groupPaddingInner = radiusAxis.groupPaddingInner;
        }

        const { groupScale } = this;
        const { index: groupIndex, visibleGroupCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
        groupScale.domain = Array.from({ length: visibleGroupCount }).map((_, i) => String(i));
        groupScale.range = [0, Math.abs(radiusScale.bandwidth ?? 0)];
        groupScale.paddingInner = visibleGroupCount > 1 ? groupPaddingInner : 0;

        const barWidth = groupScale.bandwidth >= 1 ? groupScale.bandwidth : groupScale.rawBandwidth;

        const axisInnerRadius = this.getAxisInnerRadius();
        const axisOuterRadius = this.radius;
        const axisTotalRadius = axisOuterRadius + axisInnerRadius;

        const getLabelNodeDatum = (angleDatum: number, x: number, y: number): RadialBarLabelNodeDatum | undefined => {
            let labelText = '';
            if (label.formatter) {
                labelText = label.formatter({ value: angleDatum, seriesId });
            } else if (typeof angleDatum === 'number' && isFinite(angleDatum)) {
                labelText = angleDatum.toFixed(2);
            } else if (angleDatum) {
                labelText = String(angleDatum);
            }
            if (labelText) {
                return {
                    x,
                    y,
                    text: labelText,
                    textAlign: 'center',
                    textBaseline: 'middle',
                };
            }
        };

        const nodeData = processedData.data.map((group, index): RadialBarNodeDatum => {
            const { datum, keys, values } = group;

            const radiusDatum = keys[0];
            const angleDatum = values[angleRawIndex];
            const angleStartDatum = values[angleStartIndex];
            const angleEndDatum = values[angleEndIndex];

            const startAngle = angleScale.convert(angleStartDatum);
            const endAngle = angleScale.convert(angleEndDatum);
            const midAngle = startAngle + angleBetween(startAngle, endAngle) / 2;

            const dataRadius = axisTotalRadius - radiusScale.convert(radiusDatum);
            const innerRadius = dataRadius + groupScale.convert(String(groupIndex));
            const outerRadius = innerRadius + barWidth;
            const midRadius = (innerRadius + outerRadius) / 2;

            const cos = Math.cos(midAngle);
            const sin = Math.sin(midAngle);

            const x = cos * midRadius;
            const y = sin * midRadius;

            const labelNodeDatum = label.enabled ? getLabelNodeDatum(angleDatum, x, y) : undefined;

            return {
                series: this,
                datum,
                point: { x, y, size: 0 },
                nodeMidPoint: { x, y },
                label: labelNodeDatum,
                angleValue: angleDatum,
                radiusValue: radiusDatum,
                innerRadius,
                outerRadius,
                startAngle,
                endAngle,
                index,
            };
        });

        return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
    }

    async update() {
        await this.maybeRefreshNodeData();

        this.contentGroup.translationX = this.centerX;
        this.contentGroup.translationY = this.centerY;
        this.highlightGroup.translationX = this.centerX;
        this.highlightGroup.translationY = this.centerY;
        if (this.labelGroup) {
            this.labelGroup.translationX = this.centerX;
            this.labelGroup.translationY = this.centerY;
        }

        this.updateSectorSelection(this.itemSelection, false);
        this.updateSectorSelection(this.highlightSelection, true);
        this.updateLabels();

        this.animationState.transition('update');
    }

    protected updateSectorSelection(
        selection: _Scene.Selection<_Scene.Sector, RadialBarNodeDatum>,
        highlight: boolean
    ) {
        let selectionData: RadialBarNodeDatum[] = [];
        if (highlight) {
            const highlighted = this.ctx.highlightManager?.getActiveHighlight();
            if (highlighted?.datum && highlighted.series === this) {
                selectionData = [highlighted as RadialBarNodeDatum];
            }
        } else {
            selectionData = this.nodeData;
        }

        const highlightedStyle = highlight ? this.highlightStyle.item : undefined;
        const fill = highlightedStyle?.fill ?? this.fill;
        const fillOpacity = highlightedStyle?.fillOpacity ?? this.fillOpacity;
        const stroke = highlightedStyle?.stroke ?? this.stroke;
        const strokeOpacity = this.strokeOpacity;
        const strokeWidth = highlightedStyle?.strokeWidth ?? this.strokeWidth;
        selection.update(selectionData).each((node, datum) => {
            const format = this.formatter
                ? this.ctx.callbackCache.call(this.formatter, {
                      datum,
                      fill,
                      stroke,
                      strokeWidth,
                      highlighted: highlight,
                      angleKey: this.angleKey,
                      radiusKey: this.radiusKey,
                      seriesId: this.id,
                  })
                : undefined;

            this.updateItemPath(node, datum);
            node.fill = format?.fill ?? fill;
            node.fillOpacity = format?.fillOpacity ?? fillOpacity;
            node.stroke = format?.stroke ?? stroke;
            node.strokeOpacity = strokeOpacity;
            node.strokeWidth = format?.strokeWidth ?? strokeWidth;
            node.lineDash = this.lineDash;
            node.lineJoin = 'round';
        });
    }

    protected updateLabels() {
        const { label, labelSelection } = this;
        labelSelection.update(this.nodeData).each((node, datum) => {
            if (label.enabled && datum.label) {
                node.x = datum.label.x;
                node.y = datum.label.y;

                node.fill = label.color;

                node.fontFamily = label.fontFamily;
                node.fontSize = label.fontSize;
                node.fontStyle = label.fontStyle;
                node.fontWeight = label.fontWeight;
                node.text = datum.label.text;
                node.textAlign = datum.label.textAlign;
                node.textBaseline = datum.label.textBaseline;

                node.visible = true;
            } else {
                node.visible = false;
            }
        });
    }

    protected beforeSectorAnimation() {
        const {
            formatter,
            fill,
            fillOpacity,
            stroke,
            strokeOpacity,
            strokeWidth,
            id: seriesId,
            angleKey,
            radiusKey,
        } = this;
        const { callbackCache } = this.ctx;

        this.itemSelection.each((node, datum) => {
            const format = formatter
                ? callbackCache.call(formatter, {
                      datum,
                      fill,
                      stroke,
                      strokeWidth,
                      highlighted: false,
                      angleKey,
                      radiusKey,
                      seriesId,
                  })
                : undefined;

            this.updateItemPath(node, datum);
            node.fill = format?.fill ?? fill;
            node.fillOpacity = format?.fillOpacity ?? fillOpacity;
            node.stroke = format?.stroke ?? stroke;
            node.strokeOpacity = strokeOpacity;
            node.strokeWidth = format?.strokeWidth ?? strokeWidth;
            node.lineDash = this.lineDash;
            node.lineJoin = 'round';
        });
    }

    protected animateEmptyUpdateReady() {
        if (!this.visible) {
            return;
        }

        const { labelSelection } = this;

        this.beforeSectorAnimation();
        this.animateItemsShapes();

        this.ctx.animationManager.animate({
            id: `${this.id}_empty-update-ready_labels`,
            from: 0,
            to: 1,
            delay: this.ctx.animationManager.defaultDuration,
            duration: 200,
            onUpdate: (opacity) => {
                labelSelection.each((label) => {
                    label.opacity = opacity;
                });
            },
        });
    }

    protected animateReadyUpdate() {
        this.resetSectors();
    }

    protected animateReadyResize() {
        this.resetSectors();
    }

    protected resetSectors() {
        this.itemSelection.each((node, datum) => {
            this.updateItemPath(node, datum);
        });
    }

    protected getNodeClickEvent(
        event: MouseEvent,
        datum: RadialColumnNodeDatum
    ): RadialBarSeriesNodeClickEvent<'nodeClick'> {
        return new RadialBarSeriesNodeClickEvent('nodeClick', event, datum, this);
    }

    protected getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: RadialColumnNodeDatum
    ): RadialBarSeriesNodeClickEvent<'nodeDoubleClick'> {
        return new RadialBarSeriesNodeClickEvent('nodeDoubleClick', event, datum, this);
    }

    getTooltipHtml(nodeDatum: RadialBarNodeDatum): string {
        const {
            id: seriesId,
            axes,
            angleKey,
            angleName,
            radiusKey,
            radiusName,
            fill,
            formatter,
            stroke,
            strokeWidth,
            tooltip,
            dataModel,
        } = this;
        const { angleValue, radiusValue, datum } = nodeDatum;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(angleKey && radiusKey) || !(xAxis && yAxis && isNumber(angleValue)) || !dataModel) {
            return '';
        }

        const angleString = xAxis.formatDatum(angleValue);
        const radiusString = yAxis.formatDatum(radiusValue);
        const title = sanitizeHtml(angleName);
        const content = sanitizeHtml(`${radiusString}: ${angleString}`);

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: fill,
            content,
        };
        const { callbackCache } = this.ctx;

        const format = formatter
            ? callbackCache.call(formatter, {
                  datum,
                  fill,
                  stroke,
                  strokeWidth,
                  highlighted: false,
                  angleKey,
                  radiusKey,
                  seriesId,
              })
            : undefined;

        return tooltip.toTooltipHtml(defaults, {
            datum,
            angleKey,
            angleName,
            angleValue,
            radiusKey,
            radiusName,
            radiusValue,
            color: format?.fill ?? fill,
            title,
            seriesId,
        });
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const { id, data, angleKey, angleName, radiusKey, visible } = this;

        if (!(data?.length && angleKey && radiusKey && legendType === 'category')) {
            return [];
        }

        return [
            {
                legendType: 'category',
                id,
                itemId: angleKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: angleName ?? angleKey,
                },
                marker: {
                    fill: this.fill ?? 'rgba(0, 0, 0, 0)',
                    stroke: this.stroke ?? 'rgba(0, 0, 0, 0)',
                    fillOpacity: this.fillOpacity ?? 1,
                    strokeOpacity: this.strokeOpacity ?? 1,
                    strokeWidth: this.strokeWidth,
                },
            },
        ];
    }

    onLegendItemClick(event: _ModuleSupport.LegendItemClickChartEvent) {
        const { enabled, itemId, series } = event;

        if (series.id === this.id) {
            this.toggleSeriesItem(itemId, enabled);
        }
    }

    onLegendItemDoubleClick(event: _ModuleSupport.LegendItemDoubleClickChartEvent) {
        const { enabled, itemId, series, numVisibleItems } = event;

        const totalVisibleItems = Object.values(numVisibleItems).reduce((p, v) => p + v, 0);

        const wasClicked = series.id === this.id;
        const newEnabled = wasClicked || (enabled && totalVisibleItems === 1);

        this.toggleSeriesItem(itemId, newEnabled);
    }

    computeLabelsBBox() {
        return null;
    }

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `radialBar-stack-${groupIndex}-xValues`;
    }

    protected updateItemPath(node: _Scene.Sector, datum: RadialBarNodeDatum) {
        node.centerX = 0;
        node.centerY = 0;
        node.innerRadius = datum.innerRadius;
        node.outerRadius = datum.outerRadius;
        node.startAngle = datum.startAngle;
        node.endAngle = datum.endAngle;
    }

    protected animateItemsShapes() {
        const axisStartAngle = this.axes[ChartAxisDirection.X]?.scale.range[0] ?? 0;
        this.itemSelection.each((node, datum) => {
            this.ctx.animationManager.animate({
                id: `${this.id}_empty-update-ready_${node.id}`,
                from: { startAngle: axisStartAngle, endAngle: axisStartAngle },
                to: { startAngle: datum.startAngle, endAngle: datum.endAngle },
                onUpdate(props) {
                    node.setProperties(props);
                },
            });
        });
    }
}
