import type {
    AgPieSeriesFormatterParams,
    AgPieSeriesTooltipRendererParams,
    AgPieSeriesFormat,
    AgTooltipRendererResult,
} from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import type {
    AgNightingaleSeriesLabelFormatterParams,
} from './typings';

const {
    ChartAxisDirection,
    HighlightStyle,
    NUMBER,
    OPT_COLOR_STRING,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_STRING,
    STRING,
    SeriesNodePickMode,
    Validate,
    valueProperty,
} = _ModuleSupport;

const { Group, Sector, Selection, Text } = _Scene;
const { extent, isNumberEqual } = _Util;

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
}

class NightingaleSeriesLabel extends _Scene.Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgNightingaleSeriesLabelFormatterParams) => string = undefined;
}

class NightingaleSeriesTooltip extends _ModuleSupport.SeriesTooltip {
    @Validate(OPT_FUNCTION)
    renderer?: (params: AgPieSeriesTooltipRendererParams) => string | AgTooltipRendererResult = undefined;
    @Validate(OPT_STRING)
    format?: string = undefined;
}

type NightingaleAnimationState = 'empty' | 'ready';
type NightingaleAnimationEvent = 'update' | 'resize';
class NightingaleStateMachine extends _ModuleSupport.StateMachine<NightingaleAnimationState, NightingaleAnimationEvent> {}

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
    formatter?: (params: AgPieSeriesFormatterParams<any>) => AgPieSeriesFormat = undefined;

    /**
     * The series rotation in degrees.
     */
    @Validate(NUMBER(-360, 360))
    rotation = 0;

    @Validate(NUMBER(0))
    strokeWidth = 1;

    readonly highlightStyle = new HighlightStyle();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            useLabelLayer: true,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
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
                        action: () => {},
                    },
                },
            },
            ready: {
                on: {
                    update: {
                        target: 'ready',
                        action: () => {},
                    },
                    resize: {
                        target: 'ready',
                        action: () => {},
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
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        if (direction === ChartAxisDirection.X) {
            return dataModel.getDomain(this, `angleValue`, 'value', processedData);
        } else {
            const domain = dataModel.getDomain(this, `radiusValue`, 'value', processedData);
            const ext = extent(domain.length === 0 ? domain : [0].concat(domain));
            return this.fixNumericExtent(ext);
        }
    }

    async processData(dataController: _ModuleSupport.DataController) {
        const { data = [] } = this;
        const { angleKey, radiusKey } = this;

        if (!angleKey || !radiusKey) return;

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, data, {
            props: [
                valueProperty(this, angleKey, false, { id: 'angleValue' }),
                valueProperty(this, radiusKey, false, { id: 'radiusValue', invalidValue: undefined }),
            ],
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

        const angleScale = this.axes[ChartAxisDirection.X]?.scale;
        const radiusScale = this.axes[ChartAxisDirection.Y]?.scale;

        if (!angleScale || !radiusScale) {
            return [];
        }

        const angleIdx = dataModel.resolveProcessedDataIndexById(this, `angleValue`, 'value').index;
        const radiusIdx = dataModel.resolveProcessedDataIndexById(this, `radiusValue`, 'value').index;

        const { label, id: seriesId } = this;

        const anglesCount = angleScale.domain.length ?? 0;
        const angleStep = 2 * Math.PI / anglesCount;

        const nodeData = processedData.data.map((group): NightingaleNodeDatum => {
            const { datum, values } = group;

            const angleDatum = values[angleIdx];
            const radiusDatum = values[radiusIdx];

            const angle = angleScale.convert(angleDatum);
            const radius = this.radius - radiusScale.convert(radiusDatum);

            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            const x = cos * radius;
            const y = sin * radius;

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
                        textAlign: isNumberEqual(cos, 0) ? 'center' : cos > 0 ? 'left' : 'right',
                        textBaseline: isNumberEqual(sin, 0) ? 'middle' : sin > 0 ? 'top' : 'bottom',
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
                innerRadius: 0,
                outerRadius: radius,
                startAngle: angle - angleStep / 2,
                endAngle: angle + angleStep / 2,
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

        this.updateSectorSelection();
        this.updateLabels();

        this.animationState.transition('update');
    }

    protected updateSectorSelection() {
        const { sectorSelection, nodeData } = this;
        sectorSelection.update(nodeData).each((node, datum) => {
            node.centerX = 0;
            node.centerY = 0;
            node.innerRadius = datum.innerRadius;
            node.outerRadius = datum.outerRadius;
            node.startAngle = datum.startAngle;
            node.endAngle = datum.endAngle;
            node.fill = this.fill;
            node.fillOpacity = this.fillOpacity;
            node.stroke = this.stroke;
            node.strokeWidth = this.strokeWidth;
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

    protected getNodeClickEvent(event: MouseEvent, datum: NightingaleNodeDatum): NightingaleSeriesNodeClickEvent {
        return new NightingaleSeriesNodeClickEvent(this.angleKey, this.radiusKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(event: MouseEvent, datum: NightingaleNodeDatum): NightingaleSeriesNodeDoubleClickEvent {
        return new NightingaleSeriesNodeDoubleClickEvent(this.angleKey, this.radiusKey, event, datum, this);
    }

    getTooltipHtml(_nodeDatum: NightingaleNodeDatum): string {
        return '';
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

    protected pickNodeClosestDatum(point: _Scene.Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        const { x, y } = point;
        const { rootGroup, nodeData, centerX: cx, centerY: cy } = this;
        const hitPoint = rootGroup.transformPoint(x, y);
        const radius = this.radius;

        const distanceFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (distanceFromCenter > radius) {
            return;
        }

        let minDistance = Infinity;
        let closestDatum: NightingaleNodeDatum | undefined;

        for (const datum of nodeData) {
            const { point: { x: datumX = NaN, y: datumY = NaN } = {} } = datum;
            if (isNaN(datumX) || isNaN(datumY)) {
                continue;
            }

            const distance = Math.sqrt((hitPoint.x - datumX - cx) ** 2 + (hitPoint.y - datumY - cy) ** 2);
            if (distance < minDistance) {
                minDistance = distance;
                closestDatum = datum;
            }
        }

        if (closestDatum) {
            const distance = Math.max(minDistance - (closestDatum.point?.size ?? 0), 0);
            return { datum: closestDatum, distance };
        }
    }

    computeLabelsBBox() {
        return null;
    }
}
