import type { ModuleContext } from '../../../module/moduleContext';
import * as easing from '../../../motion/easing';
import { resetMotion } from '../../../motion/resetMotion';
import { StateMachine } from '../../../motion/states';
import type {
    AgPieSeriesFormat,
    AgPieSeriesFormatterParams,
    AgPieSeriesTooltipRendererParams,
    AgTooltipRendererResult,
} from '../../../options/agChartOptions';
import { LinearScale } from '../../../scale/linearScale';
import { BBox } from '../../../scene/bbox';
import type { DropShadow } from '../../../scene/dropShadow';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { Selection } from '../../../scene/selection';
import { Line } from '../../../scene/shape/line';
import { Sector } from '../../../scene/shape/sector';
import { Text } from '../../../scene/shape/text';
import { normalizeAngle180, toRadians } from '../../../util/angle';
import { mod, toFixed } from '../../../util/number';
import { boxCollidesSector, isPointInSector } from '../../../util/sector';
import type { Has } from '../../../util/types';
import {
    BOOLEAN,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    NUMBER,
    OPT_COLOR_STRING_ARRAY,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_NUMBER,
    OPT_STRING,
    STRING,
    Validate,
} from '../../../util/validation';
import { zipObject } from '../../../util/zip';
import { Caption } from '../../caption';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DataModel } from '../../data/dataModel';
import { createDatumId, diff, normalisePropertyTo } from '../../data/processors';
import type { LegendItemClickChartEvent } from '../../interaction/chartEventManager';
import { Label } from '../../label';
import { Layers } from '../../layers';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import { Circle } from '../../marker/circle';
import type { SeriesNodeDatum, SeriesNodeEventTypes } from '../series';
import {
    HighlightStyle,
    SeriesNodeClickEvent,
    accumulativeValueProperty,
    keyProperty,
    rangedValueProperty,
    valueProperty,
} from '../series';
import { seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { SeriesTooltip } from '../seriesTooltip';
import { type PolarAnimationData, PolarSeries } from './polarSeries';

class PieSeriesNodeClickEvent<TEvent extends string = SeriesNodeEventTypes> extends SeriesNodeClickEvent<
    PieNodeDatum,
    TEvent
> {
    readonly angleKey?: string;
    readonly calloutLabelKey?: string;
    readonly sectorLabelKey?: string;
    readonly radiusKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: PieNodeDatum, series: PieSeries) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.angleKey;
        this.calloutLabelKey = series.calloutLabelKey;
        this.sectorLabelKey = series.sectorLabelKey;
        this.radiusKey = series.radiusKey;
    }
}

interface PieNodeDatum extends SeriesNodeDatum {
    readonly index: number;
    readonly radius: number; // in the [0, 1] range
    readonly angleValue: number;
    readonly radiusValue?: number;
    readonly startAngle: number;
    readonly endAngle: number;
    readonly midAngle: number;
    readonly midCos: number;
    readonly midSin: number;

    readonly calloutLabel?: {
        readonly text: string;
        readonly textAlign: CanvasTextAlign;
        readonly textBaseline: CanvasTextBaseline;
        hidden: boolean;
        collisionTextAlign?: CanvasTextAlign;
        collisionOffsetY: number;
        box?: BBox;
    };

    readonly sectorLabel?: {
        readonly text: string;
    };

    readonly sectorFormat: Required<AgPieSeriesFormat>;
    readonly legendItem?: { key: string; text: string };
    readonly legendItemValue?: string;
}

enum PieNodeTag {
    Sector,
    Callout,
    Label,
}

class PieSeriesCalloutLabel extends Label {
    @Validate(NUMBER(0))
    offset = 3; // from the callout line

    @Validate(NUMBER(0))
    minAngle = 0; // in degrees

    @Validate(NUMBER(0))
    minSpacing = 4;

    @Validate(NUMBER(0))
    maxCollisionOffset = 50;

    @Validate(BOOLEAN)
    avoidCollisions = true;
}

class PieSeriesSectorLabel extends Label<{ sectorLabelKey?: string }> {
    @Validate(NUMBER())
    positionOffset = 0;

    @Validate(NUMBER(0, 1))
    positionRatio = 0.5;
}

class PieSeriesCalloutLine {
    @Validate(OPT_COLOR_STRING_ARRAY)
    colors?: string[];

    @Validate(NUMBER(0))
    length: number = 10;

    @Validate(NUMBER(0))
    strokeWidth: number = 1;
}

export class PieTitle extends Caption {
    @Validate(BOOLEAN)
    showInLegend = false;
}

export class DoughnutInnerLabel extends Label {
    @Validate(STRING)
    text = '';
    @Validate(NUMBER())
    margin = 2;
}

export class DoughnutInnerCircle {
    @Validate(COLOR_STRING)
    fill = 'transparent';
    @Validate(OPT_NUMBER(0, 1))
    fillOpacity? = 1;
}

export class PieSeries extends PolarSeries<PieNodeDatum> {
    static className = 'PieSeries';
    static type = 'pie' as const;

    private radiusScale: LinearScale = new LinearScale();
    private groupSelection: Selection<Group, PieNodeDatum> = Selection.select(this.contentGroup, Group, false);
    private highlightSelection: Selection<Group, PieNodeDatum> = Selection.select(this.highlightGroup, Group, false);
    private calloutLabelSelection: Selection<Group, PieNodeDatum>;
    private sectorLabelSelection: Selection<Text, PieNodeDatum>;
    private innerLabelsSelection: Selection<Text, DoughnutInnerLabel>;

    // The group node that contains the background graphics.
    readonly backgroundGroup: Group;

    private nodeData: PieNodeDatum[] = [];
    private angleScale: LinearScale;

    // When a user toggles a series item (e.g. from the legend), its boolean state is recorded here.
    public seriesItemEnabled: boolean[] = [];

    title?: PieTitle = undefined;
    private oldTitle?: PieTitle;

    calloutLabel = new PieSeriesCalloutLabel();

    readonly sectorLabel = new PieSeriesSectorLabel();

    calloutLine = new PieSeriesCalloutLine();

    tooltip = new SeriesTooltip<AgPieSeriesTooltipRendererParams>();

    /**
     * The key of the numeric field to use to determine the angle (for example,
     * a pie sector angle).
     */
    @Validate(STRING)
    angleKey = '';

    @Validate(STRING)
    angleName = '';

    readonly innerLabels: DoughnutInnerLabel[] = [];

    innerCircle?: DoughnutInnerCircle = undefined;
    private oldInnerCircle?: DoughnutInnerCircle;
    private innerCircleNode?: Circle;

    /**
     * The key of the numeric field to use to determine the radii of pie sectors.
     * The largest value will correspond to the full radius and smaller values to
     * proportionally smaller radii.
     */
    @Validate(OPT_STRING)
    radiusKey?: string = undefined;

    @Validate(OPT_STRING)
    radiusName?: string = undefined;

    @Validate(OPT_NUMBER(0))
    radiusMin?: number = undefined;

    @Validate(OPT_NUMBER(0))
    radiusMax?: number = undefined;

    @Validate(OPT_STRING)
    calloutLabelKey?: string = undefined;

    @Validate(OPT_STRING)
    calloutLabelName?: string = undefined;

    @Validate(OPT_STRING)
    sectorLabelKey?: string = undefined;

    @Validate(OPT_STRING)
    sectorLabelName?: string = undefined;

    @Validate(OPT_STRING)
    legendItemKey?: string = undefined;

    @Validate(COLOR_STRING_ARRAY)
    fills: string[] = ['#c16068', '#a2bf8a', '#ebcc87', '#80a0c3', '#b58dae', '#85c0d1'];

    @Validate(COLOR_STRING_ARRAY)
    strokes: string[] = ['#874349', '#718661', '#a48f5f', '#5a7088', '#7f637a', '#5d8692'];

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

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

    @Validate(NUMBER())
    outerRadiusOffset = 0;

    @Validate(NUMBER(0))
    outerRadiusRatio = 1;

    @Validate(NUMBER())
    innerRadiusOffset = 0;

    @Validate(NUMBER(0))
    innerRadiusRatio = 1;

    @Validate(NUMBER(0))
    strokeWidth = 1;

    shadow?: DropShadow = undefined;

    override readonly highlightStyle = new HighlightStyle();

    surroundingRadius?: number = undefined;

    constructor(moduleCtx: ModuleContext) {
        super({ moduleCtx, useLabelLayer: true });

        this.angleScale = new LinearScale();
        // Each sector is a ratio of the whole, where all ratios add up to 1.
        this.angleScale.domain = [0, 1];
        // Add 90 deg to start the first pie at 12 o'clock.
        this.angleScale.range = [-Math.PI, Math.PI].map((angle) => angle + Math.PI / 2);

        this.backgroundGroup = this.rootGroup.appendChild(
            new Group({
                name: `${this.id}-background`,
                layer: true,
                zIndex: Layers.SERIES_BACKGROUND_ZINDEX,
            })
        );

        const pieCalloutLabels = new Group({ name: 'pieCalloutLabels' });
        const pieSectorLabels = new Group({ name: 'pieSectorLabels' });
        const innerLabels = new Group({ name: 'innerLabels' });
        this.labelGroup?.append(pieCalloutLabels);
        this.labelGroup?.append(pieSectorLabels);
        this.labelGroup?.append(innerLabels);
        this.calloutLabelSelection = Selection.select(pieCalloutLabels, Group);
        this.sectorLabelSelection = Selection.select(pieSectorLabels, Text);
        this.innerLabelsSelection = Selection.select(innerLabels, Text);

        this.animationState = new StateMachine('empty', {
            empty: {
                update: {
                    target: 'ready',
                    action: (data) => this.animateEmptyUpdateReady(data),
                },
            },
            ready: {
                update: {
                    target: 'ready',
                    action: () => this.animateReadyUpdateReady(),
                },
                updateData: {
                    target: 'waiting',
                },
                clear: {
                    target: 'clearing',
                },
            },
            waiting: {
                update: {
                    target: 'ready',
                    action: () => this.animateWaitingUpdateReady(),
                },
            },
            clearing: {
                update: {
                    target: 'empty',
                    action: () => this.animateClearingUpdateEmpty(),
                },
            },
        });
    }

    override addChartEventListeners(): void {
        this.ctx.chartEventManager?.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
    }

    override visibleChanged() {
        this.processSeriesItemEnabled();
    }

    private processSeriesItemEnabled() {
        const { data, visible } = this;
        this.seriesItemEnabled = data?.map(() => visible) ?? [];
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        if (direction === ChartAxisDirection.X) {
            return this.angleScale.domain;
        } else {
            return this.radiusScale.domain;
        }
    }

    override async processData(dataController: DataController) {
        let { data = [] } = this;
        const { angleKey, radiusKey, calloutLabelKey, sectorLabelKey, legendItemKey, seriesItemEnabled } = this;

        if (!angleKey) return;

        const extraKeyProps = [];
        const extraProps = [];

        if (calloutLabelKey) {
            extraKeyProps.push(keyProperty(this, calloutLabelKey, false, { id: `calloutLabelKey` }));
        } else if (sectorLabelKey) {
            extraKeyProps.push(keyProperty(this, sectorLabelKey, false, { id: `sectorLabelKey` }));
        } else if (legendItemKey) {
            extraKeyProps.push(keyProperty(this, legendItemKey, false, { id: `legendItemKey` }));
        }

        if (radiusKey) {
            extraProps.push(
                rangedValueProperty(this, radiusKey, {
                    id: 'radiusValue',
                    min: this.radiusMin ?? 0,
                    max: this.radiusMax,
                }),
                valueProperty(this, radiusKey, true, { id: `radiusRaw` }), // Raw value pass-through.
                normalisePropertyTo(this, { id: 'radiusValue' }, [0, 1], this.radiusMin ?? 0, this.radiusMax)
            );
        }
        if (calloutLabelKey) {
            extraProps.push(valueProperty(this, calloutLabelKey, false, { id: `calloutLabelValue` }));
        }
        if (sectorLabelKey) {
            extraProps.push(valueProperty(this, sectorLabelKey, false, { id: `sectorLabelValue` }));
        }
        if (legendItemKey) {
            extraProps.push(valueProperty(this, legendItemKey, false, { id: `legendItemValue` }));
        }
        if (
            !this.ctx.animationManager.isSkipped() &&
            this.processedData &&
            (calloutLabelKey || sectorLabelKey || legendItemKey)
        ) {
            extraProps.push(diff(this.processedData));
        }

        data = data.map((d, idx) => (seriesItemEnabled[idx] ? d : { ...d, [angleKey]: 0 }));

        const { processedData } = await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                ...extraKeyProps,
                accumulativeValueProperty(this, angleKey, true, { id: `angleValue` }),
                valueProperty(this, angleKey, true, { id: `angleRaw` }), // Raw value pass-through.
                normalisePropertyTo(this, { id: 'angleValue' }, [0, 1], 0),
                ...extraProps,
            ],
        });

        if (processedData?.reduced?.diff?.added.length > 0 && processedData?.reduced?.diff?.removed.length > 0) {
            this.animationState.transition('clear');
        } else {
            this.animationState.transition('updateData');
        }
    }

    async maybeRefreshNodeData() {
        if (!this.nodeDataRefresh) return;
        const [{ nodeData = [] } = {}] = await this.createNodeData();
        this.nodeData = nodeData;
        this.nodeDataRefresh = false;
    }

    private getProcessedDataIndexes(dataModel: DataModel<any>) {
        const angleIdx = dataModel.resolveProcessedDataIndexById(this, `angleValue`).index;
        const radiusIdx = this.radiusKey ? dataModel.resolveProcessedDataIndexById(this, `radiusValue`).index : -1;
        const calloutLabelIdx = this.calloutLabelKey
            ? dataModel.resolveProcessedDataIndexById(this, `calloutLabelValue`).index
            : -1;
        const sectorLabelIdx = this.sectorLabelKey
            ? dataModel.resolveProcessedDataIndexById(this, `sectorLabelValue`).index
            : -1;
        const legendItemIdx = this.legendItemKey
            ? dataModel.resolveProcessedDataIndexById(this, `legendItemValue`).index
            : -1;

        return { angleIdx, radiusIdx, calloutLabelIdx, sectorLabelIdx, legendItemIdx };
    }

    async createNodeData() {
        const { id: seriesId, processedData, dataModel, rotation, angleScale } = this;

        if (!processedData || !dataModel || processedData.type !== 'ungrouped') return [];

        const { angleIdx, radiusIdx, calloutLabelIdx, sectorLabelIdx, legendItemIdx } =
            this.getProcessedDataIndexes(dataModel);

        let currentStart = 0;
        const nodeData = processedData.data.map((group, index): PieNodeDatum => {
            const { datum, values } = group;
            const currentValue = values[angleIdx];

            const startAngle = angleScale.convert(currentStart) + toRadians(rotation);
            currentStart = currentValue;
            const endAngle = angleScale.convert(currentStart) + toRadians(rotation);
            const span = Math.abs(endAngle - startAngle);
            const midAngle = startAngle + span / 2;

            const angleValue = values[angleIdx + 1];
            const radius = radiusIdx >= 0 ? values[radiusIdx] ?? 1 : 1;
            const radiusValue = radiusIdx >= 0 ? values[radiusIdx + 1] : undefined;
            const legendItemValue = legendItemIdx >= 0 ? values[legendItemIdx] : undefined;

            const labels = this.getLabels(
                datum,
                midAngle,
                span,
                true,
                values[calloutLabelIdx],
                values[sectorLabelIdx],
                legendItemValue
            );
            const sectorFormat = this.getSectorFormat(datum, index, index, false);

            return {
                itemId: index,
                series: this,
                datum,
                index,
                angleValue,
                midAngle,
                midCos: Math.cos(midAngle),
                midSin: Math.sin(midAngle),
                startAngle,
                endAngle,
                sectorFormat,
                radius,
                radiusValue,
                legendItemValue,
                ...labels,
            };
        });

        return [
            {
                itemId: seriesId,
                nodeData,
                labelData: nodeData,
            },
        ];
    }

    private getLabels(
        datum: any,
        midAngle: number,
        span: number,
        skipDisabled: boolean,
        calloutLabelValue: string,
        sectorLabelValue: string,
        legendItemValue?: string
    ): {
        calloutLabel?: any;
        legendItem?: {
            key: string;
            text: string;
        };
        sectorLabel?: { text: string };
    } {
        const {
            calloutLabel,
            sectorLabel,
            legendItemKey,
            ctx: { callbackCache },
        } = this;

        const calloutLabelKey = !skipDisabled || calloutLabel.enabled ? this.calloutLabelKey : undefined;
        const sectorLabelKey = !skipDisabled || sectorLabel.enabled ? this.sectorLabelKey : undefined;

        if (!calloutLabelKey && !sectorLabelKey && !legendItemKey) return {};

        const labelFormatterParams = this.getLabelFormatterParams(datum);

        let calloutLabelText;
        if (calloutLabelKey) {
            const calloutLabelMinAngle = toRadians(calloutLabel.minAngle);
            const calloutLabelVisible = span > calloutLabelMinAngle;

            if (!calloutLabelVisible) {
                calloutLabelText = undefined;
            } else if (calloutLabel.formatter) {
                calloutLabelText = callbackCache.call(calloutLabel.formatter, labelFormatterParams);
            } else {
                calloutLabelText = String(calloutLabelValue);
            }
        }

        let sectorLabelText;
        if (sectorLabelKey) {
            sectorLabelText = sectorLabel.formatter
                ? callbackCache.call(sectorLabel.formatter, labelFormatterParams)
                : String(sectorLabelValue);
        }

        return {
            ...(calloutLabelText != null
                ? {
                      calloutLabel: {
                          ...this.getTextAlignment(midAngle),
                          text: calloutLabelText,
                          hidden: false,
                          collisionTextAlign: undefined,
                          collisionOffsetY: 0,
                          box: undefined,
                      },
                  }
                : {}),
            ...(sectorLabelText != null ? { sectorLabel: { text: sectorLabelText } } : {}),
            ...(legendItemKey != null && legendItemValue != null
                ? { legendItem: { key: legendItemKey, text: legendItemValue } }
                : {}),
        };
    }

    private getLabelFormatterParams(datum: any) {
        const {
            id: seriesId,
            radiusKey,
            radiusName,
            angleKey,
            angleName,
            calloutLabelKey,
            calloutLabelName,
            sectorLabelKey,
            sectorLabelName,
        } = this;
        return {
            seriesId,
            datum,
            defaultValue: null,
            angleKey,
            angleName,
            radiusKey,
            radiusName,
            calloutLabelKey,
            calloutLabelName,
            sectorLabelKey,
            sectorLabelName,
        };
    }

    private getTextAlignment(midAngle: number) {
        const quadrantTextOpts: { textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline }[] = [
            { textAlign: 'center', textBaseline: 'bottom' },
            { textAlign: 'left', textBaseline: 'middle' },
            { textAlign: 'center', textBaseline: 'hanging' },
            { textAlign: 'right', textBaseline: 'middle' },
        ];

        const midAngle180 = normalizeAngle180(midAngle);

        // Split the circle into quadrants like so: ⊗
        const quadrantStart = (-3 * Math.PI) / 4; // same as `normalizeAngle180(toRadians(-135))`
        const quadrantOffset = midAngle180 - quadrantStart;
        const quadrant = Math.floor(quadrantOffset / (Math.PI / 2));
        const quadrantIndex = mod(quadrant, quadrantTextOpts.length);

        return quadrantTextOpts[quadrantIndex];
    }

    private getSectorFormat(datum: any, itemId: any, index: number, highlight: any) {
        const {
            angleKey,
            radiusKey,
            fills,
            strokes,
            fillOpacity: seriesFillOpacity,
            formatter,
            id: seriesId,
            ctx: { callbackCache, highlightManager },
        } = this;

        const highlightedDatum = highlightManager?.getActiveHighlight();
        const isDatumHighlighted = highlight && highlightedDatum?.series === this && itemId === highlightedDatum.itemId;
        const highlightedStyle = isDatumHighlighted ? this.highlightStyle.item : null;

        const fill = highlightedStyle?.fill ?? fills[index % fills.length];
        const fillOpacity = highlightedStyle?.fillOpacity ?? seriesFillOpacity;
        const stroke = highlightedStyle?.stroke ?? strokes[index % strokes.length];
        const strokeWidth = highlightedStyle?.strokeWidth ?? this.getStrokeWidth(this.strokeWidth);

        let format: AgPieSeriesFormat | undefined;
        if (formatter) {
            format = callbackCache.call(formatter, {
                datum,
                angleKey,
                radiusKey,
                fill,
                stroke,
                strokeWidth,
                highlighted: isDatumHighlighted,
                seriesId,
            });
        }

        return {
            fill: format?.fill ?? fill,
            fillOpacity: format?.fillOpacity ?? fillOpacity,
            stroke: format?.stroke ?? stroke,
            strokeWidth: format?.strokeWidth ?? strokeWidth,
        };
    }

    getInnerRadius() {
        const { radius, innerRadiusRatio, innerRadiusOffset } = this;
        const innerRadius = radius * (innerRadiusRatio ?? 1) + (innerRadiusOffset ? innerRadiusOffset : 0);
        if (innerRadius === radius || innerRadius < 0) {
            return 0;
        }
        return innerRadius;
    }

    getOuterRadius() {
        const { radius, outerRadiusRatio, outerRadiusOffset } = this;
        const outerRadius = radius * (outerRadiusRatio ?? 1) + (outerRadiusOffset ? outerRadiusOffset : 0);
        if (outerRadius < 0) {
            return 0;
        }
        return outerRadius;
    }

    updateRadiusScale() {
        const innerRadius = this.getInnerRadius();
        const outerRadius = this.getOuterRadius();
        this.radiusScale.range = [innerRadius, outerRadius];
    }

    private getTitleTranslationY() {
        const outerRadius = Math.max(0, this.radiusScale.range[1]);
        if (outerRadius === 0) {
            return NaN;
        }
        const spacing = this.title?.spacing ?? 0;
        const titleOffset = 2 + spacing;
        const dy = Math.max(0, -outerRadius);
        return -outerRadius - titleOffset - dy;
    }

    async update({ seriesRect }: { seriesRect: BBox }) {
        const { title } = this;

        await this.maybeRefreshNodeData();
        this.updateTitleNodes();
        this.updateRadiusScale();
        this.updateInnerCircleNodes();

        this.contentGroup.translationX = this.centerX;
        this.contentGroup.translationY = this.centerY;
        this.highlightGroup.translationX = this.centerX;
        this.highlightGroup.translationY = this.centerY;
        this.backgroundGroup.translationX = this.centerX;
        this.backgroundGroup.translationY = this.centerY;
        if (this.labelGroup) {
            this.labelGroup.translationX = this.centerX;
            this.labelGroup.translationY = this.centerY;
        }

        if (title) {
            const dy = this.getTitleTranslationY();
            const titleBox = title.node.computeBBox();
            title.node.visible =
                title.enabled && isFinite(dy) && !this.bboxIntersectsSurroundingSeries(titleBox, 0, dy);
            title.node.translationY = isFinite(dy) ? dy : 0;
        }

        this.updateNodeMidPoint();

        await this.updateSelections();
        await this.updateNodes(seriesRect);
    }

    private updateTitleNodes() {
        const { title, oldTitle } = this;

        if (oldTitle !== title) {
            if (oldTitle) {
                this.labelGroup?.removeChild(oldTitle.node);
            }

            if (title) {
                title.node.textBaseline = 'bottom';
                this.labelGroup?.appendChild(title.node);
            }

            this.oldTitle = title;
        }
    }

    private updateInnerCircleNodes() {
        const { innerCircle, oldInnerCircle, innerCircleNode: oldNode } = this;
        if (oldInnerCircle !== innerCircle) {
            let circle: Circle | undefined;
            if (oldNode) {
                this.backgroundGroup.removeChild(oldNode);
            }

            if (innerCircle) {
                circle = new Circle();
                circle.fill = innerCircle.fill;
                circle.fillOpacity = innerCircle.fillOpacity ?? 1;
                this.backgroundGroup.appendChild(circle);
            }

            this.oldInnerCircle = innerCircle;
            this.innerCircleNode = circle;
        }
    }

    private updateNodeMidPoint() {
        this.nodeData.forEach((d) => {
            const radius = this.radiusScale.convert(d.radius);
            d.midPoint = {
                x: d.midCos * Math.max(0, radius / 2),
                y: d.midSin * Math.max(0, radius / 2),
            };
        });
    }

    private async updateSelections() {
        await this.updateGroupSelection();
    }

    private async updateGroupSelection() {
        const {
            groupSelection,
            highlightSelection,
            calloutLabelSelection,
            sectorLabelSelection,
            innerLabelsSelection,
        } = this;

        const update = (selection: typeof groupSelection) => {
            return selection.update(
                this.nodeData,
                (group) => {
                    const sector = new Sector();
                    sector.tag = PieNodeTag.Sector;
                    group.appendChild(sector);
                },
                (datum) => this.getDatumId(datum)
            );
        };

        this.groupSelection = update(groupSelection);
        this.highlightSelection = update(highlightSelection);

        calloutLabelSelection.update(this.nodeData, (group) => {
            const line = new Line();
            line.tag = PieNodeTag.Callout;
            line.pointerEvents = PointerEvents.None;
            group.appendChild(line);

            const text = new Text();
            text.tag = PieNodeTag.Label;
            text.pointerEvents = PointerEvents.None;
            group.appendChild(text);
        });

        sectorLabelSelection.update(this.nodeData, (node) => {
            node.pointerEvents = PointerEvents.None;
        });

        innerLabelsSelection.update(this.innerLabels, (node) => {
            node.pointerEvents = PointerEvents.None;
        });
    }

    private async updateNodes(seriesRect: BBox) {
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        const isVisible = this.seriesItemEnabled.indexOf(true) >= 0;
        this.rootGroup.visible = isVisible;
        this.backgroundGroup.visible = isVisible;
        this.contentGroup.visible = isVisible;
        this.highlightGroup.visible = isVisible && highlightedDatum?.series === this;
        if (this.labelGroup) {
            this.labelGroup.visible = isVisible;
        }

        this.contentGroup.opacity = this.getOpacity();

        this.updateInnerCircle();

        const innerRadius = this.radiusScale.convert(0);

        const updateSectorFn = (sector: Sector, datum: PieNodeDatum, index: number, isDatumHighlighted: boolean) => {
            const radius = this.radiusScale.convert(datum.radius);
            // Bring highlighted sector's parent group to front.
            const sectorParent = sector.parent;
            const sectorGrandParent = sectorParent?.parent;
            if (isDatumHighlighted && sectorParent && sectorGrandParent) {
                sectorGrandParent.removeChild(sectorParent);
                sectorGrandParent.appendChild(sectorParent);
            }

            sector.innerRadius = Math.max(0, innerRadius);
            sector.outerRadius = Math.max(0, radius);

            if (isDatumHighlighted) {
                sector.startAngle = datum.startAngle;
                sector.endAngle = datum.endAngle;

                const format = this.getSectorFormat(datum.datum, datum.itemId, index, isDatumHighlighted);
                sector.fill = format.fill;
                sector.stroke = format.stroke;
                sector.strokeWidth = format.strokeWidth!;
                sector.fillOpacity = format.fillOpacity!;
            }

            sector.strokeOpacity = this.strokeOpacity;
            sector.lineDash = this.lineDash;
            sector.lineDashOffset = this.lineDashOffset;
            sector.fillShadow = this.shadow;
            sector.lineJoin = 'round';
            sector.visible = this.seriesItemEnabled[index];
        };

        this.groupSelection
            .selectByTag<Sector>(PieNodeTag.Sector)
            .forEach((node, index) => updateSectorFn(node, node.datum, index, false));
        this.highlightSelection.selectByTag<Sector>(PieNodeTag.Sector).forEach((node, index) => {
            // is datum highlighted
            if (highlightedDatum?.series === this && highlightedDatum.itemId === node.datum.itemId) {
                updateSectorFn(node, node.datum, index, true);
            } else {
                node.visible = false;
            }
        });

        this.animationState.transition('update');

        this.updateCalloutLineNodes();
        this.updateCalloutLabelNodes(seriesRect);
        this.updateSectorLabelNodes();
        this.updateInnerLabelNodes();
    }

    updateCalloutLineNodes() {
        const { radiusScale, calloutLine } = this;
        const calloutLength = calloutLine.length;
        const calloutStrokeWidth = calloutLine.strokeWidth;
        const calloutColors = calloutLine.colors ?? this.strokes;
        const { offset } = this.calloutLabel;

        this.calloutLabelSelection.selectByTag<Line>(PieNodeTag.Callout).forEach((line, index) => {
            const datum = line.datum as PieNodeDatum;
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);
            const label = datum.calloutLabel;

            if (label?.text && !label.hidden && outerRadius !== 0) {
                line.visible = true;
                line.strokeWidth = calloutStrokeWidth;
                line.stroke = calloutColors[index % calloutColors.length];
                line.fill = undefined;

                const x1 = datum.midCos * outerRadius;
                const y1 = datum.midSin * outerRadius;
                let x2 = datum.midCos * (outerRadius + calloutLength);
                let y2 = datum.midSin * (outerRadius + calloutLength);

                const isMoved = label.collisionTextAlign || label.collisionOffsetY !== 0;
                if (isMoved && label.box != null) {
                    // Get the closest point to the text bounding box
                    const box = label.box;
                    let cx = x2;
                    let cy = y2;
                    if (x2 < box.x) {
                        cx = box.x;
                    } else if (x2 > box.x + box.width) {
                        cx = box.x + box.width;
                    }
                    if (y2 < box.y) {
                        cy = box.y;
                    } else if (y2 > box.y + box.height) {
                        cy = box.y + box.height;
                    }
                    // Apply label offset
                    const dx = cx - x2;
                    const dy = cy - y2;
                    const length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                    const paddedLength = length - offset;
                    if (paddedLength > 0) {
                        x2 = x2 + (dx * paddedLength) / length;
                        y2 = y2 + (dy * paddedLength) / length;
                    }
                }

                line.x1 = x1;
                line.y1 = y1;
                line.x2 = x2;
                line.y2 = y2;
            } else {
                line.visible = false;
            }
        });
    }

    private getLabelOverflow(text: string, box: BBox, seriesRect: BBox) {
        const seriesLeft = seriesRect.x - this.centerX;
        const seriesRight = seriesRect.x + seriesRect.width - this.centerX;
        const seriesTop = seriesRect.y - this.centerY;
        const seriesBottom = seriesRect.y + seriesRect.height - this.centerY;
        const errPx = 1; // Prevents errors related to floating point calculations
        let visibleTextPart = 1;
        if (box.x + errPx < seriesLeft) {
            visibleTextPart = (box.x + box.width - seriesLeft) / box.width;
        } else if (box.x + box.width - errPx > seriesRight) {
            visibleTextPart = (seriesRight - box.x) / box.width;
        }

        const hasVerticalOverflow = box.y + errPx < seriesTop || box.y + box.height - errPx > seriesBottom;
        const textLength = visibleTextPart === 1 ? text.length : Math.floor(text.length * visibleTextPart) - 1;
        const hasSurroundingSeriesOverflow = this.bboxIntersectsSurroundingSeries(box);
        return { textLength, hasVerticalOverflow, hasSurroundingSeriesOverflow };
    }

    private bboxIntersectsSurroundingSeries(box: BBox, dx = 0, dy = 0) {
        const { surroundingRadius } = this;
        if (surroundingRadius == null) {
            return false;
        }
        const corners = [
            { x: box.x + dx, y: box.y + dy },
            { x: box.x + box.width + dx, y: box.y + dy },
            { x: box.x + box.width + dx, y: box.y + box.height + dy },
            { x: box.x + dx, y: box.y + box.height + dy },
        ];
        const sur2 = surroundingRadius ** 2;
        return corners.some((corner) => corner.x ** 2 + corner.y ** 2 > sur2);
    }

    private computeCalloutLabelCollisionOffsets() {
        const { radiusScale, calloutLabel, calloutLine } = this;
        const { offset, minSpacing } = calloutLabel;
        const innerRadius = radiusScale.convert(0);

        const shouldSkip = (datum: PieNodeDatum) => {
            const label = datum.calloutLabel;
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);
            return !label || outerRadius === 0;
        };

        const fullData = this.nodeData;
        const data = this.nodeData.filter((t): t is Has<'calloutLabel', PieNodeDatum> => !shouldSkip(t));
        data.forEach((datum) => {
            const label = datum.calloutLabel;
            if (label == null) return;

            label.hidden = false;
            label.collisionTextAlign = undefined;
            label.collisionOffsetY = 0;
        });

        if (data.length <= 1) {
            return;
        }

        const leftLabels = data.filter((d) => d.midCos < 0).sort((a, b) => a.midSin - b.midSin);
        const rightLabels = data.filter((d) => d.midCos >= 0).sort((a, b) => a.midSin - b.midSin);
        const topLabels = data
            .filter((d) => d.midSin < 0 && d.calloutLabel?.textAlign === 'center')
            .sort((a, b) => a.midCos - b.midCos);
        const bottomLabels = data
            .filter((d) => d.midSin >= 0 && d.calloutLabel?.textAlign === 'center')
            .sort((a, b) => a.midCos - b.midCos);

        const tempTextNode = new Text();
        const getTextBBox = (datum: (typeof data)[number]) => {
            const label = datum.calloutLabel;
            if (label == null) return new BBox(0, 0, 0, 0);

            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);

            const labelRadius = outerRadius + calloutLine.length + offset;
            const x = datum.midCos * labelRadius;
            const y = datum.midSin * labelRadius + label.collisionOffsetY;

            tempTextNode.text = label.text;
            tempTextNode.x = x;
            tempTextNode.y = y;
            tempTextNode.setFont(this.calloutLabel);
            tempTextNode.setAlign({
                textAlign: label.collisionTextAlign ?? label.textAlign,
                textBaseline: label.textBaseline,
            });
            return tempTextNode.computeBBox();
        };

        const avoidNeighbourYCollision = (
            label: (typeof data)[number],
            next: (typeof data)[number],
            direction: 'to-top' | 'to-bottom'
        ) => {
            const box = getTextBBox(label).grow(minSpacing / 2);
            const other = getTextBBox(next).grow(minSpacing / 2);
            // The full collision is not detected, because sometimes
            // the next label can appear behind the label with offset
            const collidesOrBehind =
                box.x < other.x + other.width &&
                box.x + box.width > other.x &&
                (direction === 'to-top' ? box.y < other.y + other.height : box.y + box.height > other.y);
            if (collidesOrBehind) {
                const dy = direction === 'to-top' ? box.y - other.y - other.height : box.y + box.height - other.y;
                next.calloutLabel.collisionOffsetY = dy;
            }
        };

        const avoidYCollisions = (labels: typeof data) => {
            const midLabel = labels.slice().sort((a, b) => Math.abs(a.midSin) - Math.abs(b.midSin))[0];
            const midIndex = labels.indexOf(midLabel);
            for (let i = midIndex - 1; i >= 0; i--) {
                const prev = labels[i + 1];
                const next = labels[i];
                avoidNeighbourYCollision(prev, next, 'to-top');
            }
            for (let i = midIndex + 1; i < labels.length; i++) {
                const prev = labels[i - 1];
                const next = labels[i];
                avoidNeighbourYCollision(prev, next, 'to-bottom');
            }
        };

        const avoidXCollisions = (labels: typeof data) => {
            const labelsCollideLabelsByY = data.some((datum) => datum.calloutLabel.collisionOffsetY !== 0);

            const boxes = labels.map((label) => getTextBBox(label));
            const paddedBoxes = boxes.map((box) => box.clone().grow(minSpacing / 2));

            let labelsCollideLabelsByX = false;
            for (let i = 0; i < paddedBoxes.length && !labelsCollideLabelsByX; i++) {
                const box = paddedBoxes[i];
                for (let j = i + 1; j < labels.length; j++) {
                    const other = paddedBoxes[j];
                    if (box.collidesBBox(other)) {
                        labelsCollideLabelsByX = true;
                        break;
                    }
                }
            }

            const sectors = fullData.map((datum) => {
                const { startAngle, endAngle } = datum;
                const radius = radiusScale.convert(datum.radius);
                const outerRadius = Math.max(0, radius);
                return { startAngle, endAngle, innerRadius, outerRadius };
            });
            const labelsCollideSectors = boxes.some((box) => {
                return sectors.some((sector) => boxCollidesSector(box, sector));
            });

            if (!labelsCollideLabelsByX && !labelsCollideLabelsByY && !labelsCollideSectors) {
                return;
            }

            labels
                .filter((d) => d.calloutLabel.textAlign === 'center')
                .forEach((d) => {
                    const label = d.calloutLabel;
                    if (d.midCos < 0) {
                        label.collisionTextAlign = 'right';
                    } else if (d.midCos > 0) {
                        label.collisionTextAlign = 'left';
                    } else {
                        label.collisionTextAlign = 'center';
                    }
                });
        };

        avoidYCollisions(leftLabels);
        avoidYCollisions(rightLabels);
        avoidXCollisions(topLabels);
        avoidXCollisions(bottomLabels);
    }

    private updateCalloutLabelNodes(seriesRect: BBox) {
        const { radiusScale, calloutLabel, calloutLine } = this;
        const calloutLength = calloutLine.length;
        const { offset, color } = calloutLabel;

        const tempTextNode = new Text();

        this.calloutLabelSelection.selectByTag<Text>(PieNodeTag.Label).forEach((text) => {
            const { datum } = text;
            const label = datum.calloutLabel;
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);

            if (!label?.text || outerRadius === 0 || label.hidden) {
                text.visible = false;
                return;
            }

            const labelRadius = outerRadius + calloutLength + offset;
            const x = datum.midCos * labelRadius;
            const y = datum.midSin * labelRadius + label.collisionOffsetY;

            // Detect text overflow
            const align = {
                textAlign: label.collisionTextAlign ?? label.textAlign,
                textBaseline: label.textBaseline,
            };
            tempTextNode.text = label.text;
            tempTextNode.x = x;
            tempTextNode.y = y;
            tempTextNode.setFont(this.calloutLabel);
            tempTextNode.setAlign(align);
            const box = tempTextNode.computeBBox();

            let displayText = label.text;
            let visible = true;
            if (calloutLabel.avoidCollisions) {
                const { textLength, hasVerticalOverflow } = this.getLabelOverflow(label.text, box, seriesRect);
                displayText = label.text.length === textLength ? label.text : `${label.text.substring(0, textLength)}…`;
                visible = !hasVerticalOverflow;
            }

            text.text = displayText;
            text.x = x;
            text.y = y;
            text.setFont(this.calloutLabel);
            text.setAlign(align);
            text.fill = color;
            text.visible = visible;
        });
    }

    override async computeLabelsBBox(options: { hideWhenNecessary: boolean }, seriesRect: BBox) {
        const { radiusScale, calloutLabel, calloutLine } = this;
        const calloutLength = calloutLine.length;
        const { offset, maxCollisionOffset, minSpacing } = calloutLabel;

        if (!calloutLabel.avoidCollisions) {
            return null;
        }

        await this.maybeRefreshNodeData();

        this.updateRadiusScale();
        this.computeCalloutLabelCollisionOffsets();

        const textBoxes: BBox[] = [];
        const text = new Text();

        let titleBox: BBox;
        if (this.title?.text && this.title.enabled) {
            const dy = this.getTitleTranslationY();
            if (isFinite(dy)) {
                text.text = this.title.text;
                text.x = 0;
                text.y = dy;
                text.setFont(this.title);
                text.setAlign({
                    textBaseline: 'bottom',
                    textAlign: 'center',
                });
                titleBox = text.computeBBox();
                textBoxes.push(titleBox);
            }
        }

        this.nodeData.forEach((datum) => {
            const label = datum.calloutLabel;
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);
            if (!label || outerRadius === 0) {
                return null;
            }

            const labelRadius = outerRadius + calloutLength + offset;
            const x = datum.midCos * labelRadius;
            const y = datum.midSin * labelRadius + label.collisionOffsetY;
            text.text = label.text;
            text.x = x;
            text.y = y;
            text.setFont(this.calloutLabel);
            text.setAlign({
                textAlign: label.collisionTextAlign ?? label.textAlign,
                textBaseline: label.textBaseline,
            });
            const box = text.computeBBox();
            label.box = box;

            // Hide labels that where pushed too far by the collision avoidance algorithm
            if (Math.abs(label.collisionOffsetY) > maxCollisionOffset) {
                label.hidden = true;
                return;
            }

            // Hide labels intersecting or above the title
            if (titleBox) {
                const seriesTop = seriesRect.y - this.centerY;
                const titleCleanArea = new BBox(
                    titleBox.x - minSpacing,
                    seriesTop,
                    titleBox.width + 2 * minSpacing,
                    titleBox.y + titleBox.height + minSpacing - seriesTop
                );
                if (box.collidesBBox(titleCleanArea)) {
                    label.hidden = true;
                    return;
                }
            }

            if (options.hideWhenNecessary) {
                const { textLength, hasVerticalOverflow, hasSurroundingSeriesOverflow } = this.getLabelOverflow(
                    label.text,
                    box,
                    seriesRect
                );
                const isTooShort = label.text.length > 2 && textLength < 2;

                if (hasVerticalOverflow || isTooShort || hasSurroundingSeriesOverflow) {
                    label.hidden = true;
                    return;
                }
            }

            label.hidden = false;
            textBoxes.push(box);
        });
        if (textBoxes.length === 0) {
            return null;
        }
        return BBox.merge(textBoxes);
    }

    private updateSectorLabelNodes() {
        const { radiusScale } = this;
        const innerRadius = radiusScale.convert(0);
        const { fontSize, fontStyle, fontWeight, fontFamily, positionOffset, positionRatio, color } = this.sectorLabel;

        const isDoughnut = innerRadius > 0;
        const singleVisibleSector = this.seriesItemEnabled.filter(Boolean).length === 1;

        this.sectorLabelSelection.each((text, datum) => {
            const sectorLabel = datum.sectorLabel;
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);

            let isTextVisible = false;
            if (sectorLabel && outerRadius !== 0) {
                const labelRadius = innerRadius * (1 - positionRatio) + radius * positionRatio + positionOffset;

                text.fill = color;
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.text = sectorLabel.text;
                const shouldPutTextInCenter = !isDoughnut && singleVisibleSector;
                if (shouldPutTextInCenter) {
                    text.x = 0;
                    text.y = 0;
                } else {
                    text.x = datum.midCos * labelRadius;
                    text.y = datum.midSin * labelRadius;
                }
                text.textAlign = 'center';
                text.textBaseline = 'middle';

                const bbox = text.computeBBox();
                const corners = [
                    [bbox.x, bbox.y],
                    [bbox.x + bbox.width, bbox.y],
                    [bbox.x + bbox.width, bbox.y + bbox.height],
                    [bbox.x, bbox.y + bbox.height],
                ];
                const { startAngle, endAngle } = datum;
                const sectorBounds = { startAngle, endAngle, innerRadius, outerRadius };
                if (corners.every(([x, y]) => isPointInSector(x, y, sectorBounds))) {
                    isTextVisible = true;
                }
            }
            text.visible = isTextVisible;
        });
    }

    private updateInnerCircle() {
        const circle = this.innerCircleNode;
        if (!circle) {
            return;
        }
        const innerRadius = this.getInnerRadius();
        if (innerRadius === 0) {
            circle.size = 0;
        } else {
            const circleRadius = Math.min(innerRadius, this.getOuterRadius());
            const antiAliasingPadding = 1;
            circle.size = Math.ceil(circleRadius * 2 + antiAliasingPadding);
        }
    }

    private updateInnerLabelNodes() {
        const textBBoxes: BBox[] = [];
        const margins: number[] = [];
        this.innerLabelsSelection.each((text, datum) => {
            const { fontStyle, fontWeight, fontSize, fontFamily, color } = datum;
            text.fontStyle = fontStyle;
            text.fontWeight = fontWeight;
            text.fontSize = fontSize;
            text.fontFamily = fontFamily;
            text.text = datum.text;
            text.x = 0;
            text.y = 0;
            text.fill = color;
            text.textAlign = 'center';
            text.textBaseline = 'alphabetic';
            textBBoxes.push(text.computeBBox());
            margins.push(datum.margin);
        });
        const getMarginTop = (index: number) => (index === 0 ? 0 : margins[index]);
        const getMarginBottom = (index: number) => (index === margins.length - 1 ? 0 : margins[index]);
        const totalHeight = textBBoxes.reduce((sum, bbox, i) => {
            return sum + bbox.height + getMarginTop(i) + getMarginBottom(i);
        }, 0);
        const totalWidth = Math.max(...textBBoxes.map((bbox) => bbox.width));
        const innerRadius = this.getInnerRadius();
        const labelRadius = Math.sqrt(Math.pow(totalWidth / 2, 2) + Math.pow(totalHeight / 2, 2));
        const labelsVisible = labelRadius <= (innerRadius > 0 ? innerRadius : this.getOuterRadius());

        const textBottoms: number[] = [];
        for (let i = 0, prev = -totalHeight / 2; i < textBBoxes.length; i++) {
            const bbox = textBBoxes[i];
            const bottom = bbox.height + prev + getMarginTop(i);
            textBottoms.push(bottom);
            prev = bottom + getMarginBottom(i);
        }
        this.innerLabelsSelection.each((text, _datum, index) => {
            text.y = textBottoms[index];
            text.visible = labelsVisible;
        });
    }

    protected override getNodeClickEvent(event: MouseEvent, datum: PieNodeDatum): PieSeriesNodeClickEvent<'nodeClick'> {
        return new PieSeriesNodeClickEvent('nodeClick', event, datum, this);
    }

    protected override getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: PieNodeDatum
    ): PieSeriesNodeClickEvent<'nodeDoubleClick'> {
        return new PieSeriesNodeClickEvent('nodeDoubleClick', event, datum, this);
    }

    getTooltipHtml(nodeDatum: PieNodeDatum): string {
        const { angleKey } = this;

        if (!angleKey) {
            return '';
        }

        const {
            tooltip,
            angleName,
            radiusKey,
            radiusName,
            calloutLabelKey,
            sectorLabelKey,
            calloutLabelName,
            sectorLabelName,
            id: seriesId,
        } = this;

        const {
            datum,
            angleValue,
            sectorFormat: { fill: color },
            calloutLabel: { text: label = '' } = {},
        } = nodeDatum;
        const formattedAngleValue = typeof angleValue === 'number' ? toFixed(angleValue) : String(angleValue);
        const title = this.title?.text;
        const labelPrefix = label ? `${label}: ` : '';
        const content = `${labelPrefix}${formattedAngleValue}`;
        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        return tooltip.toTooltipHtml(defaults, {
            datum,
            angleKey,
            angleName,
            radiusKey,
            radiusName,
            calloutLabelKey,
            calloutLabelName,
            sectorLabelKey,
            sectorLabelName,
            title,
            color,
            seriesId,
        });
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const { processedData, calloutLabelKey, legendItemKey, id, dataModel } = this;

        if (!dataModel || !processedData || processedData.data.length === 0 || legendType !== 'category') return [];

        if (!legendItemKey && !calloutLabelKey) return [];

        const { calloutLabelIdx, sectorLabelIdx, legendItemIdx } = this.getProcessedDataIndexes(dataModel);

        const titleText = this.title?.showInLegend && this.title.text;
        const legendData: CategoryLegendDatum[] = [];

        for (let index = 0; index < processedData.data.length; index++) {
            const { datum, values } = processedData.data[index];

            const labelParts = [];
            if (titleText) {
                labelParts.push(titleText);
            }
            const labels = this.getLabels(
                datum,
                2 * Math.PI,
                2 * Math.PI,
                false,
                values[calloutLabelIdx],
                values[sectorLabelIdx],
                values[legendItemIdx]
            );
            if (legendItemKey && labels.legendItem !== undefined) {
                labelParts.push(labels.legendItem.text);
            } else if (calloutLabelKey && labels.calloutLabel?.text !== undefined) {
                labelParts.push(labels.calloutLabel?.text);
            }

            if (labelParts.length === 0) continue;

            const sectorFormat = this.getSectorFormat(datum, index, index, false);

            legendData.push({
                legendType: 'category',
                id,
                itemId: index,
                seriesId: id,
                enabled: this.seriesItemEnabled[index],
                label: {
                    text: labelParts.join(' - '),
                },
                marker: {
                    fill: sectorFormat.fill,
                    stroke: sectorFormat.stroke,
                    fillOpacity: this.fillOpacity,
                    strokeOpacity: this.strokeOpacity,
                    strokeWidth: this.strokeWidth,
                },
            });
        }

        return legendData;
    }

    onLegendItemClick(event: LegendItemClickChartEvent) {
        const { enabled, itemId, series } = event;

        if (series.id === this.id) {
            this.toggleSeriesItem(itemId, enabled);
        } else if (series.type === 'pie') {
            this.toggleOtherSeriesItems(series as PieSeries, itemId, enabled);
        }
    }

    protected override toggleSeriesItem(itemId: number, enabled: boolean): void {
        this.seriesItemEnabled[itemId] = enabled;
        this.nodeDataRefresh = true;
    }

    toggleOtherSeriesItems(series: PieSeries, itemId: number, enabled: boolean): void {
        const { legendItemKey, dataModel } = this;

        if (!legendItemKey || !dataModel) return;

        const datumToggledLegendItemValue =
            series.legendItemKey && series.data?.find((_, index) => index === itemId)[series.legendItemKey];

        if (!datumToggledLegendItemValue) return;

        const legendItemIdx = dataModel.resolveProcessedDataIndexById(this, `legendItemValue`).index;
        this.processedData?.data.forEach(({ values }, datumItemId) => {
            if (values[legendItemIdx] === datumToggledLegendItemValue) {
                this.toggleSeriesItem(datumItemId, enabled);
            }
        });
    }

    override animateEmptyUpdateReady(data?: PolarAnimationData) {
        const duration = data?.duration ?? this.ctx.animationManager.defaultDuration;

        const rotation = Math.PI / -2 + toRadians(this.rotation);

        const sectors = this.sortSectorsByData(this.groupSelection.selectByTag<Sector>(PieNodeTag.Sector));
        sectors.forEach((sector, index) => {
            const datum: PieNodeDatum = sector.datum;
            const format = this.getSectorFormat(datum.datum, datum.itemId, index, false);
            const cleanup = index === sectors.length - 1;

            sector.fill = format.fill;
            sector.stroke = format.stroke;
            sector.strokeWidth = format.strokeWidth!;
            sector.fillOpacity = format.fillOpacity!;

            this.ctx.animationManager.animate({
                id: `${this.id}_empty-update-ready_${sector.id}`,
                from: { startAngle: rotation, endAngle: rotation },
                to: { startAngle: datum.startAngle, endAngle: datum.endAngle },
                duration,
                ease: easing.easeOut,
                onUpdate(props) {
                    sector.setProperties(props);
                },
                onComplete: () => {
                    if (cleanup) {
                        this.resetSectors();
                    }
                },
            });
        });

        seriesLabelFadeInAnimation(this, this.ctx.animationManager, [this.calloutLabelSelection]);
        seriesLabelFadeInAnimation(this, this.ctx.animationManager, [this.sectorLabelSelection]);
        seriesLabelFadeInAnimation(this, this.ctx.animationManager, [this.innerLabelsSelection]);
    }

    animateReadyUpdateReady() {
        this.resetSectors();
    }

    override animateWaitingUpdateReady() {
        const { groupSelection, processedData } = this;
        const diff = processedData?.reduced?.diff;

        if (!diff?.changed) {
            this.resetSectors();
            return;
        }

        const duration = this.ctx.animationManager.defaultDuration;
        const rotation = Math.PI / -2 + toRadians(this.rotation);
        const sectors = groupSelection.selectByTag<Sector>(PieNodeTag.Sector);

        const datumIndices: { [key: string]: number } = {};
        processedData?.data.forEach((d, index) => {
            const datumId = createDatumId(d.keys) ?? index;
            datumIndices[datumId] = index;
        });

        const addedIds = zipObject(diff.added, true);
        const removedIds = zipObject(diff.removed, true);

        // Copy sectors and shift removed sectors to the end
        const shiftedSectors = [...sectors].sort((a, b) => {
            const aId = this.getDatumId(a.datum);
            const bId = this.getDatumId(b.datum);

            if (removedIds[aId] && removedIds[bId]) return 0;
            if (removedIds[aId]) return 1;
            if (removedIds[bId]) return -1;
            return 0;
        });

        const sectorDatumIds = sectors.map((s) => this.getDatumId(s.datum));
        const sectorsByDatum = zipObject(sectorDatumIds, sectors);

        // Sort datum ids into the order they were prior to the change
        const sortedDatumIds: Array<string> = [];
        let ai = 0;
        let ri = 0;
        let ui = 0;
        for (let i = 0; i < sectors.length; i++) {
            if (diff.addedIndices[ai] === i) {
                sortedDatumIds.push(diff.added[ai++]);
            } else if (diff.removedIndices[ri] === i) {
                sortedDatumIds.push(diff.removed[ri++]);
            } else if (diff.updatedIndices[ui] === i) {
                sortedDatumIds.push(diff.updated[ui++]);
            }
        }

        sortedDatumIds.forEach((datumId, index) => {
            const sector = sectorsByDatum[datumId];
            const { datum } = sector;
            const cleanup = index === sectors.length - 1;
            const format = this.getSectorFormat(datum.datum, datum.itemId, index, false);
            const replacement = shiftedSectors[index];

            const from = {
                startAngle: sector.startAngle,
                endAngle: sector.endAngle,
                fill: sector.fill ?? format.fill,
                stroke: sector.stroke ?? format.stroke,
                strokeWidth: sector.strokeWidth,
                fillOpacity: sector.fillOpacity,
            };

            const to = {
                startAngle: diff.removed.length > 0 ? replacement.datum.startAngle : datum.startAngle,
                endAngle: diff.removed.length > 0 ? replacement.datum.endAngle : datum.endAngle,
                fill: format.fill,
                stroke: format.stroke,
                strokeWidth: format.strokeWidth,
                fillOpacity: format.fillOpacity,
            };

            if (index >= sectors.length - diff.removed.length) {
                to.startAngle = Math.PI * 1.5;
                to.endAngle = to.startAngle;
            } else if (addedIds[datumId]) {
                const previousSector = sectorsByDatum[sortedDatumIds[index - 1]];
                const nextSector = sectorsByDatum[sortedDatumIds[index + 1]];

                from.startAngle = previousSector?.endAngle ?? rotation;
                from.endAngle = nextSector?.startAngle ?? previousSector?.endAngle ?? rotation;
                from.fill = format.fill;
                to.startAngle = datum.startAngle;
                to.endAngle = datum.endAngle;
            }

            this.ctx.animationManager.animate({
                id: `${this.id}_waiting-update-ready_${sector.id}`,
                from,
                to,
                duration,
                ease: easing.easeOut,
                onUpdate(props) {
                    sector.setProperties(props);
                },
                onComplete: () => {
                    if (cleanup) this.resetSectors();
                },
            });

            // All sectors must be visible while animating, including removed ones, these are hidden in `resetSectors()`
            sector.visible = true;
        });

        this.highlightSelection.selectByTag<Sector>(PieNodeTag.Sector).forEach((sector) => {
            sector.visible = false;
        });

        seriesLabelFadeInAnimation(this, this.ctx.animationManager, [this.calloutLabelSelection]);
        seriesLabelFadeInAnimation(this, this.ctx.animationManager, [this.sectorLabelSelection]);
        seriesLabelFadeInAnimation(this, this.ctx.animationManager, [this.innerLabelsSelection]);
    }

    override animateClearingUpdateEmpty() {
        const updateDuration = this.ctx.animationManager.defaultDuration / 2;
        const clearDuration = 200;

        const sectors = this.groupSelection.selectByTag<Sector>(PieNodeTag.Sector);
        sectors.forEach((sector, index) => {
            const cleanup = index === sectors.length - 1;
            this.ctx.animationManager.animate({
                id: `${this.id}_animate-ready-clear_${sector.id}`,
                duration: clearDuration,
                from: 1,
                to: 0,
                ease: easing.easeOut,
                onUpdate(opacity) {
                    sector.opacity = opacity;
                },
                onComplete: () => {
                    sector.opacity = 1;
                    if (cleanup) {
                        this.resetSectors();
                        this.animationState.transition('update', { duration: updateDuration });
                    }
                },
            });
        });

        resetMotion([this.calloutLabelSelection], () => ({ opacity: 0 }));
        resetMotion([this.sectorLabelSelection], () => ({ opacity: 0 }));
        resetMotion([this.innerLabelsSelection], () => ({ opacity: 0 }));
    }

    resetSectors() {
        const sectors = this.sortSectorsByData(this.groupSelection.cleanup().selectByTag<Sector>(PieNodeTag.Sector));

        sectors.forEach((sector, index) => {
            const { datum } = sector;
            const format = this.getSectorFormat(datum.datum, datum.itemId, index, false);

            sector.startAngle = datum.startAngle;
            sector.endAngle = datum.endAngle;
            sector.fill = format.fill;
            sector.stroke = format.stroke;
            sector.strokeWidth = format.strokeWidth!;
            sector.fillOpacity = format.fillOpacity!;
            sector.visible = this.seriesItemEnabled[index];
        });

        this.highlightSelection
            .cleanup()
            .selectByTag<Sector>(PieNodeTag.Sector)
            .forEach((sector) => {
                const { datum } = sector;

                sector.startAngle = datum.startAngle;
                sector.endAngle = datum.endAngle;
            });
    }

    getDatumId(datum: PieNodeDatum) {
        const { calloutLabelKey, sectorLabelKey } = this;
        const { legendItemValue, index } = datum;

        let datumId = legendItemValue ?? `${index}`;

        if (calloutLabelKey) {
            datumId = datum.datum[calloutLabelKey];
        } else if (sectorLabelKey) {
            datumId = datum.datum[sectorLabelKey];
        }

        return datumId;
    }

    sortSectorsByData(sectors: Array<Sector>) {
        if (!this.processedData) return sectors;

        const datumIndices: { [key: string]: number } = {};
        this.processedData?.data.forEach((d, index) => {
            const datumId = createDatumId(d.keys) ?? index;
            datumIndices[datumId] = index;
        });

        sectors.sort((a, b) => {
            const aDatumId = this.getDatumId(a.datum);
            const bDatumId = this.getDatumId(b.datum);
            const aDatumIndex = datumIndices[aDatumId];
            const bDatumIndex = datumIndices[bDatumId];

            if (aDatumIndex === bDatumIndex) return 0;
            return aDatumIndex < bDatumIndex ? -1 : 1;
        });

        return sectors;
    }

    protected override onDataChange() {
        this.processSeriesItemEnabled();
    }
}
