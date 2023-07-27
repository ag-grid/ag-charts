import type { AgTooltipRendererResult } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';
import { AngleCategoryAxis } from '../../polar-axes/angle-category/angleCategoryAxis';

import type {
    AgNightingaleSeriesLabelFormatterParams,
    AgNightingaleSeriesFormat,
    AgNightingaleSeriesFormatterParams,
    AgNightingaleSeriesTooltipRendererParams,
} from './typings';

const {
    ChartAxisDirection,
    HighlightStyle,
    NUMBER,
    OPT_COLOR_STRING,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_NUMBER,
    OPT_STRING,
    STRING,
    Validate,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    valueProperty,
} = _ModuleSupport;

const { BandScale } = _Scale;
const { Group, Sector, Selection, Text, toTooltipHtml } = _Scene;
const { interpolateString, isNumber, sanitizeHtml } = _Util;

class NightingaleSeriesNodeBaseClickEvent extends _ModuleSupport.SeriesNodeBaseClickEvent<any> {
    readonly angleKey: string;
    readonly radiusKey: string;

    constructor(
        angleKey: string,
        radiusKey: string,
        nativeEvent: MouseEvent,
        datum: NightingaleNodeDatum,
        series: NightingaleSeries
    ) {
        super(nativeEvent, datum, series);
        this.angleKey = angleKey;
        this.radiusKey = radiusKey;
    }
}

class NightingaleSeriesNodeClickEvent extends NightingaleSeriesNodeBaseClickEvent {
    readonly type = 'nodeClick';
}

class NightingaleSeriesNodeDoubleClickEvent extends NightingaleSeriesNodeBaseClickEvent {
    readonly type = 'nodeDoubleClick';
}

interface NightingaleNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly label?: {
        text: string;
        x: number;
        y: number;
        textAlign: CanvasTextAlign;
        textBaseline: CanvasTextBaseline;
    };
    readonly angleValue: any;
    readonly radiusValue: any;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly startAngle: number;
    readonly endAngle: number;
    readonly index: number;
}

class NightingaleSeriesLabel extends _Scene.Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgNightingaleSeriesLabelFormatterParams) => string = undefined;
}

class NightingaleSeriesTooltip extends _ModuleSupport.SeriesTooltip {
    @Validate(OPT_FUNCTION)
    renderer?: (params: AgNightingaleSeriesTooltipRendererParams) => string | AgTooltipRendererResult = undefined;
    @Validate(OPT_STRING)
    format?: string = undefined;
}

type NightingaleAnimationState = 'empty' | 'ready';
type NightingaleAnimationEvent = 'update' | 'resize';
class NightingaleStateMachine extends _ModuleSupport.StateMachine<
    NightingaleAnimationState,
    NightingaleAnimationEvent
> {}

export class NightingaleSeries extends _ModuleSupport.PolarSeries<NightingaleNodeDatum> {
    static className = 'NightingaleSeries';

    readonly label = new NightingaleSeriesLabel();

    protected sectorSelection: _Scene.Selection<_Scene.Sector, NightingaleNodeDatum>;
    protected labelSelection: _Scene.Selection<_Scene.Text, NightingaleNodeDatum>;
    protected highlightSelection: _Scene.Selection<_Scene.Sector, NightingaleNodeDatum>;

    protected animationState: NightingaleStateMachine;

    protected nodeData: NightingaleNodeDatum[] = [];

    tooltip: NightingaleSeriesTooltip = new NightingaleSeriesTooltip();

    /**
     * The key of the numeric field to use to determine the angle (for example,
     * a pie sector angle).
     */
    @Validate(STRING)
    angleKey = '';

    @Validate(OPT_STRING)
    angleName?: string = undefined;

    /**
     * The key of the numeric field to use to determine the radii of pie sectors.
     * The largest value will correspond to the full radius and smaller values to
     * proportionally smaller radii.
     */
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
    formatter?: (params: AgNightingaleSeriesFormatterParams<any>) => AgNightingaleSeriesFormat = undefined;

    /**
     * The series rotation in degrees.
     */
    @Validate(NUMBER(-360, 360))
    rotation = 0;

    @Validate(NUMBER(0))
    strokeWidth = 1;

    @Validate(OPT_STRING)
    stackGroup?: string = undefined;

    @Validate(OPT_NUMBER())
    normalizedTo?: number;

    readonly highlightStyle = new HighlightStyle();

    /**
     * Used to get the position of bars within each group.
     */
    private groupScale = new BandScale<string>();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            useLabelLayer: true,
        });

        const sectorGroup = new Group();
        this.contentGroup.append(sectorGroup);
        this.sectorSelection = Selection.select(sectorGroup, Sector);
        sectorGroup.zIndexSubOrder = [() => this._declarationOrder, 1];

        this.labelSelection = Selection.select(this.labelGroup!, Text);

        this.highlightSelection = Selection.select(this.highlightGroup, Sector);

        this.animationState = new NightingaleStateMachine('empty', {
            empty: {
                on: {
                    update: {
                        target: 'ready',
                        action: () => this.animateEmptyUpdateReady(),
                    },
                },
            },
            ready: {
                on: {
                    update: {
                        target: 'ready',
                        action: () => this.animateReadyUpdate(),
                    },
                    resize: {
                        target: 'ready',
                        action: () => this.animateReadyResize(),
                    },
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
            return dataModel.getDomain(this, `angleValue`, 'key', processedData);
        } else {
            const radiusAxis = axes[ChartAxisDirection.Y];
            const yExtent = dataModel.getDomain(this, /radiusValue-(previous-)?end/, 'value', processedData);
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return this.fixNumericExtent(fixedYExtent as any, radiusAxis);
        }
    }

    async processData(dataController: _ModuleSupport.DataController) {
        const { data = [], visible } = this;
        const { angleKey, radiusKey } = this;

        if (!angleKey || !radiusKey) return;

        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        const stackGroupId = `nightingale-stack-${groupIndex}-yValues`;
        const stackGroupTrailingId = `nightingale-stack-${groupIndex}-yValues-trailing`;

        const normalizedToAbs = Math.abs(this.normalizedTo ?? NaN);
        const normaliseTo = normalizedToAbs && isFinite(normalizedToAbs) ? normalizedToAbs : undefined;
        const extraProps = [];
        if (normaliseTo) {
            extraProps.push(normaliseGroupTo(this, [stackGroupId, stackGroupTrailingId], normaliseTo, 'range'));
        }

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, data, {
            props: [
                keyProperty(this, angleKey, false, { id: 'angleValue' }),
                valueProperty(this, radiusKey, true, { id: 'radiusValue-raw', invalidValue: undefined }),
                ...groupAccumulativeValueProperty(this, radiusKey, true, 'window', 'current', {
                    id: `radiusValue-end`,
                    invalidValue: null,
                    groupId: stackGroupId,
                }),
                ...groupAccumulativeValueProperty(this, radiusKey, true, 'window-trailing', 'current', {
                    id: `radiusValue-start`,
                    invalidValue: null,
                    groupId: stackGroupTrailingId,
                }),
                ...extraProps,
            ],
            groupByKeys: true,
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

    maybeRefreshNodeData() {
        const didCircleChange = this.didCircleChange();
        if (!didCircleChange && !this.nodeDataRefresh) return;
        const [{ nodeData = [] } = {}] = this._createNodeData();
        this.nodeData = nodeData;
        this.nodeDataRefresh = false;
    }

    async createNodeData() {
        return this._createNodeData();
    }

    protected _createNodeData() {
        const { processedData, dataModel, angleKey, radiusKey } = this;

        if (!processedData || !dataModel || !angleKey || !radiusKey) {
            return [];
        }

        const angleAxis = this.axes[ChartAxisDirection.X];
        const angleScale = angleAxis?.scale;
        const radiusScale = this.axes[ChartAxisDirection.Y]?.scale;

        if (!angleScale || !radiusScale) {
            return [];
        }

        const radiusStartIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-start`).index;
        const radiusEndIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-end`).index;
        const radiusRawIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-raw`).index;
        const dataIndex = 0;

        const { label, id: seriesId } = this;

        let groupPaddingInner = 0;
        let groupPaddingOuter = 0;
        if (angleAxis instanceof AngleCategoryAxis) {
            groupPaddingInner = angleAxis.groupPaddingInner;
            groupPaddingOuter = angleAxis.groupPaddingOuter;
        }

        const groupAngleStep = angleScale.bandwidth ?? 0;
        const paddedGroupAngleStep = groupAngleStep * (1 - groupPaddingOuter);

        const { groupScale } = this;
        const { index: groupIndex, visibleGroupCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
        groupScale.domain = Array.from({ length: visibleGroupCount }).map((_, i) => String(i));
        groupScale.range = [-paddedGroupAngleStep / 2, paddedGroupAngleStep / 2];
        groupScale.paddingInner = groupPaddingInner;

        const nodeData = processedData.data.map((group, index): NightingaleNodeDatum => {
            const { datum, keys, values } = group;

            const angleDatum = keys[dataIndex];
            const radiusDatum = values[dataIndex][radiusRawIndex];
            const innerRadiusDatum = values[dataIndex][radiusStartIndex];
            const outerRadiusDatum = values[dataIndex][radiusEndIndex];

            const groupAngle = angleScale.convert(angleDatum);
            const startAngle = groupAngle + groupScale.convert(String(groupIndex));
            const endAngle = startAngle + groupScale.bandwidth;
            const angle = startAngle + groupScale.bandwidth / 2;

            const innerRadius = this.radius - radiusScale.convert(innerRadiusDatum);
            const outerRadius = this.radius - radiusScale.convert(outerRadiusDatum);
            const midRadius = (innerRadius + outerRadius) / 2;

            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            const x = cos * midRadius;
            const y = sin * midRadius;

            let labelNodeDatum: NightingaleNodeDatum['label'];
            if (label.enabled) {
                let labelText = '';
                if (label.formatter) {
                    labelText = label.formatter({ value: radiusDatum, seriesId });
                } else if (typeof radiusDatum === 'number' && isFinite(radiusDatum)) {
                    labelText = radiusDatum.toFixed(2);
                } else if (radiusDatum) {
                    labelText = String(radiusDatum);
                }
                if (labelText) {
                    const labelX = x;
                    const labelY = y;
                    labelNodeDatum = {
                        text: labelText,
                        x: labelX,
                        y: labelY,
                        textAlign: 'center',
                        textBaseline: 'middle',
                    };
                }
            }

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
        this.maybeRefreshNodeData();

        this.contentGroup.translationX = this.centerX;
        this.contentGroup.translationY = this.centerY;
        this.highlightGroup.translationX = this.centerX;
        this.highlightGroup.translationY = this.centerY;
        if (this.labelGroup) {
            this.labelGroup.translationX = this.centerX;
            this.labelGroup.translationY = this.centerY;
        }

        this.updateSectorSelection(this.sectorSelection, false);
        this.updateSectorSelection(this.highlightSelection, true);
        this.updateLabels();

        this.animationState.transition('update');
    }

    protected updateSectorSelection(
        selection: _Scene.Selection<_Scene.Sector, NightingaleNodeDatum>,
        highlight: boolean
    ) {
        let selectionData: NightingaleNodeDatum[] = [];
        if (highlight) {
            const highlighted = this.ctx.highlightManager?.getActiveHighlight();
            if (highlighted?.datum) {
                selectionData = [highlighted as NightingaleNodeDatum];
            }
        } else {
            selectionData = this.nodeData;
        }

        const highlightedStyle = highlight ? this.highlightStyle.item : undefined;
        const fill = highlightedStyle?.fill ?? this.fill;
        const fillOpacity = highlightedStyle?.fillOpacity ?? this.fillOpacity;
        const stroke = highlightedStyle?.stroke ?? this.stroke;
        const strokeWidth = highlightedStyle?.strokeWidth ?? this.strokeWidth;

        selection.update(selectionData).each((node, datum) => {
            node.centerX = 0;
            node.centerY = 0;
            node.innerRadius = datum.innerRadius;
            node.outerRadius = datum.outerRadius;
            node.startAngle = datum.startAngle;
            node.endAngle = datum.endAngle;
            node.fill = fill;
            node.fillOpacity = fillOpacity;
            node.stroke = stroke;
            node.strokeWidth = strokeWidth;
            node.lineDash = this.lineDash;
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
        const { fill, fillOpacity, stroke, strokeWidth } = this;
        this.sectorSelection.each((node, datum) => {
            node.centerX = 0;
            node.centerY = 0;
            node.startAngle = datum.startAngle;
            node.endAngle = datum.endAngle;
            node.fill = fill;
            node.fillOpacity = fillOpacity;
            node.stroke = stroke;
            node.strokeWidth = strokeWidth;
            node.lineDash = this.lineDash;
        });
    }

    protected animateEmptyUpdateReady() {
        if (!this.visible) {
            return;
        }

        const { sectorSelection, labelSelection } = this;

        const duration = 1000;
        const labelDuration = 200;
        const labelDelay = duration;

        this.beforeSectorAnimation();

        sectorSelection.each((node, datum) => {
            this.ctx.animationManager?.animateMany<number>(
                `${this.id}_empty-update-ready_${node.id}`,
                [
                    { from: 0, to: datum.innerRadius },
                    { from: 0, to: datum.outerRadius },
                ],
                {
                    duration,
                    onUpdate: ([innerRadius, outerRadius]) => {
                        node.innerRadius = innerRadius;
                        node.outerRadius = outerRadius;
                    },
                }
            );
        });

        labelSelection.each((label) => {
            this.ctx.animationManager?.animate(`${this.id}_empty-update-ready_${label.id}`, {
                from: 0,
                to: 1,
                delay: labelDelay,
                duration: labelDuration,
                onUpdate: (opacity) => {
                    label.opacity = opacity;
                },
            });
        });
    }

    protected animateReadyUpdate() {
        this.resetSectors();
    }

    protected animateReadyResize() {
        this.ctx.animationManager?.reset();
        this.resetSectors();
    }

    protected resetSectors() {
        this.sectorSelection.each((node, datum) => {
            node.innerRadius = datum.innerRadius;
            node.outerRadius = datum.outerRadius;
        });
    }

    protected getNodeClickEvent(event: MouseEvent, datum: NightingaleNodeDatum): NightingaleSeriesNodeClickEvent {
        return new NightingaleSeriesNodeClickEvent(this.angleKey, this.radiusKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: NightingaleNodeDatum
    ): NightingaleSeriesNodeDoubleClickEvent {
        return new NightingaleSeriesNodeDoubleClickEvent(this.angleKey, this.radiusKey, event, datum, this);
    }

    getTooltipHtml(nodeDatum: NightingaleNodeDatum): string {
        const { id: seriesId, axes, angleKey, angleName, radiusKey, radiusName, fill, tooltip, dataModel } = this;
        const { angleValue, radiusValue, datum } = nodeDatum;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(angleKey && radiusKey) || !(xAxis && yAxis && isNumber(radiusValue)) || !dataModel) {
            return '';
        }
        const yRawIndex = dataModel.resolveProcessedDataIndexById(this, 'radiusValue-raw').index;

        const angleString = xAxis.formatDatum(angleValue);
        const radiusString = yAxis.formatDatum(radiusValue);
        const processedYValue = this.processedData?.data[nodeDatum.index]?.values[0][yRawIndex];
        const title = sanitizeHtml(radiusName);
        const content = sanitizeHtml(`${angleString}: ${radiusString}`);

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: fill,
            content,
        };
        const { renderer: tooltipRenderer, format: tooltipFormat } = tooltip;

        if (tooltipFormat || tooltipRenderer) {
            const params = {
                datum,
                angleKey,
                angleName,
                angleValue,
                radiusKey,
                radiusName,
                radiusValue,
                processedYValue,
                color: fill,
                title,
                seriesId,
            };
            if (tooltipFormat) {
                return toTooltipHtml(
                    {
                        content: interpolateString(tooltipFormat, params),
                    },
                    defaults
                );
            }
            if (tooltipRenderer) {
                return toTooltipHtml(tooltipRenderer(params), defaults);
            }
        }

        return toTooltipHtml(defaults);
    }

    getLegendData(): _ModuleSupport.ChartLegendDatum[] {
        const { id, data, angleKey, radiusKey, radiusName, visible } = this;

        if (!(data?.length && angleKey && radiusKey)) {
            return [];
        }

        const legendData: _ModuleSupport.CategoryLegendDatum[] = [
            {
                legendType: 'category',
                id: id,
                itemId: radiusKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: radiusName ?? radiusKey,
                },
                marker: {
                    fill: this.fill ?? 'rgba(0, 0, 0, 0)',
                    stroke: this.stroke ?? 'rgba(0, 0, 0, 0)',
                    fillOpacity: this.fillOpacity ?? 1,
                    strokeOpacity: this.strokeOpacity ?? 1,
                },
            },
        ];
        return legendData;
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
}
