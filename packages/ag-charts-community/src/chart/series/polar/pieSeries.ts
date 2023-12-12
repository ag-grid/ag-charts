import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import type {
    AgPieSeriesFormat,
    AgPieSeriesFormatterParams,
    AgPieSeriesLabelFormatterParams,
    AgPieSeriesTooltipRendererParams,
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
import { jsonDiff } from '../../../util/json';
import { Logger } from '../../../util/logger';
import { mod, toFixed } from '../../../util/number';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { boxCollidesSector, isPointInSector } from '../../../util/sector';
import type { Has } from '../../../util/types';
import {
    BOOLEAN,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    DEGREE,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} from '../../../util/validation';
import { isNumber } from '../../../util/value';
import { Caption } from '../../caption';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DataModel } from '../../data/dataModel';
import { animationValidation, diff, normalisePropertyTo } from '../../data/processors';
import type { LegendItemClickChartEvent } from '../../interaction/chartEventManager';
import { Label } from '../../label';
import { Layers } from '../../layers';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import { Circle } from '../../marker/circle';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import type { SeriesNodeEventTypes } from '../series';
import {
    HighlightStyle,
    SeriesNodeClickEvent,
    accumulativeValueProperty,
    keyProperty,
    rangedValueProperty,
    valueProperty,
} from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation, seriesLabelFadeOutAnimation } from '../seriesLabelUtil';
import { SeriesTooltip } from '../seriesTooltip';
import type { SeriesNodeDatum } from '../seriesTypes';
import { preparePieSeriesAnimationFunctions, resetPieSelectionsFn } from './pieUtil';
import { type PolarAnimationData, PolarSeries } from './polarSeries';

class PieSeriesNodeClickEvent<TEvent extends string = SeriesNodeEventTypes> extends SeriesNodeClickEvent<
    PieNodeDatum,
    TEvent
> {
    readonly angleKey: string;
    readonly radiusKey?: string;
    readonly calloutLabelKey?: string;
    readonly sectorLabelKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: PieNodeDatum, series: PieSeries) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.angleKey;
        this.radiusKey = series.radiusKey;
        this.calloutLabelKey = series.calloutLabelKey;
        this.sectorLabelKey = series.sectorLabelKey;
    }
}

interface PieNodeDatum extends SeriesNodeDatum {
    readonly index: number;
    readonly radius: number; // in the [0, 1] range
    readonly innerRadius: number;
    readonly outerRadius: number;
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

    readonly sectorFormat: { [key in keyof Required<AgPieSeriesFormat>]: AgPieSeriesFormat[key] };
    readonly legendItem?: { key: string; text: string };
    readonly legendItemValue?: string;
}

enum PieNodeTag {
    Sector,
    Callout,
    Label,
}

class PieSeriesCalloutLabel extends Label<AgPieSeriesLabelFormatterParams> {
    @Validate(POSITIVE_NUMBER)
    offset = 3; // from the callout line

    @Validate(POSITIVE_NUMBER)
    minAngle = 0; // in degrees

    @Validate(POSITIVE_NUMBER)
    minSpacing = 4;

    @Validate(POSITIVE_NUMBER)
    maxCollisionOffset = 50;

    @Validate(BOOLEAN)
    avoidCollisions = true;
}

class PieSeriesSectorLabel extends Label<AgPieSeriesLabelFormatterParams> {
    @Validate(NUMBER)
    positionOffset = 0;

    @Validate(RATIO)
    positionRatio = 0.5;
}

class PieSeriesCalloutLine {
    @Validate(COLOR_STRING_ARRAY, { optional: true })
    colors?: string[];

    @Validate(POSITIVE_NUMBER)
    length: number = 10;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;
}

export class PieTitle extends Caption {
    @Validate(BOOLEAN)
    showInLegend = false;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx);
    }
}

export class DoughnutInnerLabel extends Label<AgPieSeriesLabelFormatterParams> {
    @Validate(STRING)
    text = '';
    @Validate(NUMBER)
    margin = 2;
}

export class DoughnutInnerCircle {
    @Validate(COLOR_STRING)
    fill = 'transparent';
    @Validate(RATIO, { optional: true })
    fillOpacity? = 1;
}

export class PieSeries extends PolarSeries<PieNodeDatum, Sector> {
    static className = 'PieSeries';
    static type = 'pie' as const;

    private readonly previousRadiusScale: LinearScale = new LinearScale();
    private readonly radiusScale: LinearScale = new LinearScale();
    private readonly calloutLabelSelection: Selection<Group, PieNodeDatum>;
    private readonly sectorLabelSelection: Selection<Text, PieNodeDatum>;
    private readonly innerLabelsSelection: Selection<Text, DoughnutInnerLabel>;
    private readonly innerCircleSelection: Selection<Circle, { radius: number }>;

    // The group node that contains the background graphics.
    readonly backgroundGroup = this.rootGroup.appendChild(
        new Group({
            name: `${this.id}-background`,
            layer: true,
            zIndex: Layers.SERIES_BACKGROUND_ZINDEX,
        })
    );
    readonly innertCircleGroup = this.backgroundGroup.appendChild(new Group({ name: `${this.id}-innerCircle` }));

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

    /**
     * The key of the numeric field to use to determine the radii of pie sectors.
     * The largest value will correspond to the full radius and smaller values to
     * proportionally smaller radii.
     */
    @Validate(STRING, { optional: true })
    radiusKey?: string = undefined;

    @Validate(STRING, { optional: true })
    radiusName?: string = undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    radiusMin?: number = undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    radiusMax?: number = undefined;

    @Validate(STRING, { optional: true })
    calloutLabelKey?: string = undefined;

    @Validate(STRING, { optional: true })
    calloutLabelName?: string = undefined;

    @Validate(STRING, { optional: true })
    sectorLabelKey?: string = undefined;

    @Validate(STRING, { optional: true })
    sectorLabelName?: string = undefined;

    @Validate(STRING, { optional: true })
    legendItemKey?: string = undefined;

    @Validate(COLOR_STRING_ARRAY)
    fills: string[] = Object.values(DEFAULT_FILLS);

    @Validate(COLOR_STRING_ARRAY)
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgPieSeriesFormatterParams<any>) => AgPieSeriesFormat = undefined;

    /**
     * The series rotation in degrees.
     */
    @Validate(DEGREE)
    rotation = 0;

    @Validate(NUMBER)
    outerRadiusOffset = 0;

    @Validate(POSITIVE_NUMBER)
    outerRadiusRatio = 1;

    @Validate(NUMBER)
    innerRadiusOffset = 0;

    @Validate(POSITIVE_NUMBER)
    innerRadiusRatio = 1;

    @Validate(POSITIVE_NUMBER)
    strokeWidth = 1;

    @Validate(POSITIVE_NUMBER)
    sectorSpacing = 1;

    shadow?: DropShadow = undefined;

    override readonly highlightStyle = new HighlightStyle();

    surroundingRadius?: number = undefined;

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            useLabelLayer: true,
            animationResetFns: { item: resetPieSelectionsFn, label: resetLabelFn },
        });

        this.angleScale = new LinearScale();
        // Each sector is a ratio of the whole, where all ratios add up to 1.
        this.angleScale.domain = [0, 1];
        // Add 90 deg to start the first pie at 12 o'clock.
        this.angleScale.range = [-Math.PI, Math.PI].map((angle) => angle + Math.PI / 2);

        const pieCalloutLabels = new Group({ name: 'pieCalloutLabels' });
        const pieSectorLabels = new Group({ name: 'pieSectorLabels' });
        const innerLabels = new Group({ name: 'innerLabels' });
        this.labelGroup.append(pieCalloutLabels);
        this.labelGroup.append(pieSectorLabels);
        this.labelGroup.append(innerLabels);
        this.calloutLabelSelection = Selection.select(pieCalloutLabels, Group);
        this.sectorLabelSelection = Selection.select(pieSectorLabels, Text);
        this.innerLabelsSelection = Selection.select(innerLabels, Text);
        this.innerCircleSelection = Selection.select(this.innertCircleGroup, Circle);
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

    protected override nodeFactory(): Sector {
        return new Sector();
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        if (direction === ChartAxisDirection.X) {
            return this.angleScale.domain;
        } else {
            return this.radiusScale.domain;
        }
    }

    override async processData(dataController: DataController) {
        let { data } = this;
        const { angleKey, radiusKey, calloutLabelKey, sectorLabelKey, legendItemKey, seriesItemEnabled } = this;

        if (angleKey == null || data == null) return;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const extraKeyProps = [];
        const extraProps = [];

        // Order here should match `getDatumIdFromData()`.
        if (legendItemKey) {
            extraKeyProps.push(keyProperty(this, legendItemKey, false, { id: `legendItemKey` }));
        } else if (calloutLabelKey) {
            extraKeyProps.push(keyProperty(this, calloutLabelKey, false, { id: `calloutLabelKey` }));
        } else if (sectorLabelKey) {
            extraKeyProps.push(keyProperty(this, sectorLabelKey, false, { id: `sectorLabelKey` }));
        }

        if (radiusKey) {
            extraProps.push(
                rangedValueProperty(this, radiusKey, {
                    id: 'radiusValue',
                    min: this.radiusMin ?? 0,
                    max: this.radiusMax,
                }),
                valueProperty(this, radiusKey, true, { id: `radiusRaw` }), // Raw value pass-through.
                normalisePropertyTo(this, { id: 'radiusValue' }, [0, 1], 1, this.radiusMin ?? 0, this.radiusMax)
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
        if (animationEnabled && this.processedData && extraKeyProps.length > 0) {
            extraProps.push(diff(this.processedData));
        }
        extraProps.push(animationValidation(this));

        data = data.map((d, idx) => (seriesItemEnabled[idx] ? d : { ...d, [angleKey]: 0 }));

        await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                ...extraKeyProps,
                accumulativeValueProperty(this, angleKey, true, { id: `angleValue`, onlyPositive: true }),
                valueProperty(this, angleKey, true, { id: `angleRaw` }), // Raw value pass-through.
                normalisePropertyTo(this, { id: 'angleValue' }, [0, 1], 0, 0),
                ...extraProps,
            ],
        });

        // AG-9879 Warning about missing data.
        for (const valueDef of this.processedData?.defs?.values ?? []) {
            // The 'angleRaw' is an undocumented property for the internal implementation, so ignore this.
            // If any 'angleRaw' values are missing, then we'll also be missing 'angleValue' values and
            // will log a warning anyway.
            const { id, missing, property } = valueDef;
            if (id !== 'angleRaw' && missing !== undefined && missing > 0) {
                Logger.warnOnce(
                    `no value was found for the key '${String(property)}' on ${missing} data element${
                        missing > 1 ? 's' : ''
                    }`
                );
            }
        }

        this.animationState.transition('updateData');
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
            const sectorFormat = this.getSectorFormat(datum, index, false);

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
                radiusValue,
                radius,
                innerRadius: Math.max(this.radiusScale.convert(0), 0),
                outerRadius: Math.max(this.radiusScale.convert(radius), 0),
                legendItemValue,
                ...labels,
            };
        });

        return [{ itemId: seriesId, nodeData, labelData: nodeData }];
    }

    private getLabels(
        datum: any,
        midAngle: number,
        span: number,
        skipDisabled: boolean,
        calloutLabelValue: string,
        sectorLabelValue: string,
        legendItemValue?: string
    ) {
        const { calloutLabel, sectorLabel, legendItemKey } = this;

        const calloutLabelKey = !skipDisabled || calloutLabel.enabled ? this.calloutLabelKey : undefined;
        const sectorLabelKey = !skipDisabled || sectorLabel.enabled ? this.sectorLabelKey : undefined;

        if (!calloutLabelKey && !sectorLabelKey && !legendItemKey) {
            return {};
        }

        const labelFormatterParams = {
            datum,
            angleKey: this.angleKey,
            angleName: this.angleName,
            radiusKey: this.radiusKey,
            radiusName: this.radiusName,
            calloutLabelKey: this.calloutLabelKey,
            calloutLabelName: this.calloutLabelName,
            sectorLabelKey: this.sectorLabelKey,
            sectorLabelName: this.sectorLabelName,
            legendItemKey: this.legendItemKey,
        };

        const result: {
            calloutLabel?: { text: string } & any;
            sectorLabel?: { text: string };
            legendItem?: { key: string; text: string };
        } = {};

        if (calloutLabelKey && span > toRadians(calloutLabel.minAngle)) {
            result.calloutLabel = {
                ...this.getTextAlignment(midAngle),
                text: this.getLabelText(calloutLabel, {
                    ...labelFormatterParams,
                    value: calloutLabelValue,
                }),
                hidden: false,
                collisionTextAlign: undefined,
                collisionOffsetY: 0,
                box: undefined,
            };
        }

        if (sectorLabelKey) {
            result.sectorLabel = {
                text: this.getLabelText(sectorLabel, {
                    ...labelFormatterParams,
                    value: sectorLabelValue,
                }),
            };
        }

        if (legendItemKey != null && legendItemValue != null) {
            result.legendItem = { key: legendItemKey, text: legendItemValue };
        }

        return result;
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

    private getSectorFormat(datum: any, formatIndex: number, highlight: boolean) {
        const {
            angleKey,
            radiusKey,
            fills,
            strokes,
            formatter,
            id: seriesId,
            ctx: { callbackCache, highlightManager },
        } = this;

        const highlightedDatum = highlightManager.getActiveHighlight();
        const isDatumHighlighted =
            highlight && highlightedDatum?.series === this && formatIndex === highlightedDatum.itemId;

        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity } = mergeDefaults(
            isDatumHighlighted && this.highlightStyle.item,
            {
                fill: fills.length > 0 ? fills[formatIndex % fills.length] : undefined,
                fillOpacity: this.fillOpacity,
                stroke: strokes.length > 0 ? strokes[formatIndex % strokes.length] : undefined,
                strokeWidth: this.getStrokeWidth(this.strokeWidth),
                strokeOpacity: this.getOpacity(),
            }
        );

        let format: AgPieSeriesFormat | undefined;
        if (formatter) {
            format = callbackCache.call(formatter, {
                datum,
                angleKey,
                radiusKey,
                fill,
                stroke,
                fills,
                strokes,
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
            strokeOpacity: format?.strokeOpacity ?? strokeOpacity,
        };
    }

    getInnerRadius() {
        const { radius, innerRadiusRatio, innerRadiusOffset } = this;
        const innerRadius = radius * innerRadiusRatio + innerRadiusOffset;
        if (innerRadius === radius || innerRadius < 0) {
            return 0;
        }
        return innerRadius;
    }

    getOuterRadius() {
        return Math.max(this.radius * this.outerRadiusRatio + this.outerRadiusOffset, 0);
    }

    updateRadiusScale(resize: boolean) {
        const newRange = [this.getInnerRadius(), this.getOuterRadius()];
        this.radiusScale.range = newRange;

        if (resize) {
            this.previousRadiusScale.range = newRange;
        }

        this.nodeData = this.nodeData.map(({ radius, ...d }) => {
            return {
                ...d,
                radius,
                innerRadius: Math.max(this.radiusScale.convert(0), 0),
                outerRadius: Math.max(this.radiusScale.convert(radius), 0),
            };
        });
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

        const newNodeDataDependencies = {
            seriesRectWidth: seriesRect?.width,
            seriesRectHeight: seriesRect?.height,
        };
        const resize = jsonDiff(this.nodeDataDependencies, newNodeDataDependencies) != null;
        if (resize) {
            this.nodeDataDependencies = newNodeDataDependencies;
        }

        await this.maybeRefreshNodeData();
        this.updateTitleNodes();
        this.updateRadiusScale(resize);

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

    private updateNodeMidPoint() {
        this.nodeData.forEach((d) => {
            const radius = d.innerRadius + (d.outerRadius - d.innerRadius) / 2;
            d.midPoint = {
                x: d.midCos * Math.max(0, radius),
                y: d.midSin * Math.max(0, radius),
            };
        });
    }

    private async updateSelections() {
        await this.updateGroupSelection();
        this.updateInnerCircleSelection();
    }

    private async updateGroupSelection() {
        const { itemSelection, highlightSelection, calloutLabelSelection, sectorLabelSelection, innerLabelsSelection } =
            this;

        const update = (selection: typeof this.itemSelection, clone: boolean) => {
            let nodeData = this.nodeData;
            if (clone) {
                // Allow mutable sectorFormat, so formatted sector styles can be updated and varied
                // between normal and highlighted cases.
                nodeData = nodeData.map((datum) => ({ ...datum, sectorFormat: { ...datum.sectorFormat } }));
            }
            selection.update(nodeData);
            if (this.ctx.animationManager.isSkipped()) {
                selection.cleanup();
            }
        };

        update(itemSelection, false);
        update(highlightSelection, true);

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

    private updateInnerCircleSelection() {
        const { innerCircle } = this;

        let radius = 0;
        const innerRadius = this.getInnerRadius();
        if (innerRadius > 0) {
            const circleRadius = Math.min(innerRadius, this.getOuterRadius());
            const antiAliasingPadding = 1;
            radius = Math.ceil(circleRadius * 2 + antiAliasingPadding);
        }

        const datums = innerCircle ? [{ radius }] : [];
        this.innerCircleSelection.update(datums);
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

        this.innerCircleSelection.each((node, { radius }) => {
            node.setProperties({
                fill: this.innerCircle?.fill,
                opacity: this.innerCircle?.fillOpacity,
                size: radius,
            });
        });

        const updateSectorFn = (sector: Sector, datum: PieNodeDatum, _index: number, isDatumHighlighted: boolean) => {
            const format = this.getSectorFormat(datum.datum, datum.itemId, isDatumHighlighted);

            datum.sectorFormat.fill = format.fill;
            datum.sectorFormat.stroke = format.stroke;

            const animationDisabled = this.ctx.animationManager.isSkipped();
            if (animationDisabled) {
                sector.startAngle = datum.startAngle;
                sector.endAngle = datum.endAngle;
                sector.innerRadius = datum.innerRadius;
                sector.outerRadius = datum.outerRadius;
            }
            if (isDatumHighlighted || animationDisabled) {
                sector.fill = format.fill;
                sector.stroke = format.stroke;
            }

            sector.strokeWidth = format.strokeWidth!;
            sector.fillOpacity = format.fillOpacity!;
            sector.strokeOpacity = this.strokeOpacity;
            sector.lineDash = this.lineDash;
            sector.lineDashOffset = this.lineDashOffset;
            sector.fillShadow = this.shadow;
            sector.inset = (this.sectorSpacing + (format.stroke != null ? format.strokeWidth! : 0)) / 2;
        };

        this.itemSelection.each((node, datum, index) => updateSectorFn(node, datum, index, false));
        this.highlightSelection.each((node, datum, index) => {
            const isDatumHighlighted =
                highlightedDatum?.series === this && node.datum.itemId === highlightedDatum.itemId;

            updateSectorFn(node, datum, index, isDatumHighlighted);
            node.visible = isDatumHighlighted;
        });

        this.updateCalloutLineNodes();
        this.updateCalloutLabelNodes(seriesRect);
        this.updateSectorLabelNodes();
        this.updateInnerLabelNodes();

        this.animationState.transition('update');
    }

    updateCalloutLineNodes() {
        const { calloutLine } = this;
        const calloutLength = calloutLine.length;
        const calloutStrokeWidth = calloutLine.strokeWidth;
        const calloutColors = calloutLine.colors ?? this.strokes;
        const { offset } = this.calloutLabel;

        this.calloutLabelSelection.selectByTag<Line>(PieNodeTag.Callout).forEach((line, index) => {
            const datum = line.datum as PieNodeDatum;
            const { calloutLabel: label, outerRadius } = datum;

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
            return !label || datum.outerRadius === 0;
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

            const labelRadius = datum.outerRadius + calloutLine.length + offset;
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
                const { startAngle, endAngle, outerRadius } = datum;
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
        const { calloutLabel, calloutLine } = this;
        const calloutLength = calloutLine.length;
        const { offset, maxCollisionOffset, minSpacing } = calloutLabel;

        if (!calloutLabel.avoidCollisions) {
            return null;
        }

        await this.maybeRefreshNodeData();

        this.updateRadiusScale(false);
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
            if (!label || datum.outerRadius === 0) {
                return null;
            }

            const labelRadius = datum.outerRadius + calloutLength + offset;
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
            const { sectorLabel, outerRadius } = datum;

            let isTextVisible = false;
            if (sectorLabel && outerRadius !== 0) {
                const labelRadius = innerRadius * (1 - positionRatio) + outerRadius * positionRatio + positionOffset;

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

    protected override readonly NodeClickEvent = PieSeriesNodeClickEvent;

    private getDatumLegendName(nodeDatum: PieNodeDatum) {
        const { angleKey, calloutLabelKey, sectorLabelKey, legendItemKey } = this;
        const { sectorLabel, calloutLabel, legendItem } = nodeDatum;

        if (legendItemKey && legendItem !== undefined) {
            return legendItem.text;
        } else if (calloutLabelKey && calloutLabelKey !== angleKey && calloutLabel?.text !== undefined) {
            return calloutLabel.text;
        } else if (sectorLabelKey && sectorLabelKey !== angleKey && sectorLabel?.text !== undefined) {
            return sectorLabel.text;
        }
    }

    getTooltipHtml(nodeDatum: PieNodeDatum): string {
        if (!this.angleKey) {
            return '';
        }

        const {
            datum,
            angleValue,
            sectorFormat: { fill: color },
        } = nodeDatum;

        const title = sanitizeHtml(this.title?.text);
        const content = isNumber(angleValue) ? toFixed(angleValue) : String(angleValue);
        const labelText = this.getDatumLegendName(nodeDatum);

        return this.tooltip.toTooltipHtml(
            {
                title: title ?? labelText,
                content: title && labelText ? `${labelText}: ${content}` : content,
                backgroundColor: color,
            },
            {
                datum,
                title,
                color,
                seriesId: this.id,
                angleKey: this.angleKey,
                angleName: this.angleName,
                radiusKey: this.radiusKey,
                radiusName: this.radiusName,
                calloutLabelKey: this.calloutLabelKey,
                calloutLabelName: this.calloutLabelName,
                sectorLabelKey: this.sectorLabelKey,
                sectorLabelName: this.sectorLabelName,
            }
        );
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const { processedData, angleKey, calloutLabelKey, sectorLabelKey, legendItemKey, id, dataModel } = this;

        if (!dataModel || !processedData || processedData.data.length === 0 || legendType !== 'category') return [];

        if (
            !legendItemKey &&
            (!calloutLabelKey || calloutLabelKey === angleKey) &&
            (!sectorLabelKey || sectorLabelKey === angleKey)
        )
            return [];

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
            } else if (calloutLabelKey && calloutLabelKey !== angleKey && labels.calloutLabel?.text !== undefined) {
                labelParts.push(labels.calloutLabel?.text);
            } else if (sectorLabelKey && sectorLabelKey !== angleKey && labels.sectorLabel?.text !== undefined) {
                labelParts.push(labels.sectorLabel?.text);
            }

            if (labelParts.length === 0) continue;

            const sectorFormat = this.getSectorFormat(datum, index, false);

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

    override animateEmptyUpdateReady(_data?: PolarAnimationData) {
        const { animationManager } = this.ctx;

        const fns = preparePieSeriesAnimationFunctions(true, this.rotation, this.radiusScale, this.previousRadiusScale);
        fromToMotion(this.id, 'nodes', animationManager, [this.itemSelection, this.highlightSelection], fns.nodes);
        fromToMotion(this.id, `innerCircle`, animationManager, [this.innerCircleSelection], fns.innerCircle);

        seriesLabelFadeInAnimation(this, 'callout', animationManager, [this.calloutLabelSelection]);
        seriesLabelFadeInAnimation(this, 'sector', animationManager, [this.sectorLabelSelection]);
        seriesLabelFadeInAnimation(this, 'inner', animationManager, [this.innerLabelsSelection]);

        this.previousRadiusScale.range = this.radiusScale.range;
    }

    override animateWaitingUpdateReady() {
        const { itemSelection, highlightSelection, processedData, radiusScale, previousRadiusScale } = this;
        const { animationManager } = this.ctx;
        const diff = processedData?.reduced?.diff;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        const supportedDiff =
            (diff?.moved.length ?? 0) === 0 && diff?.addedIndices.every((i) => !diff.removedIndices.includes(i));
        const hasKeys = (processedData?.defs.keys.length ?? 0) > 0;
        const hasUniqueKeys = processedData?.reduced?.animationValidation?.uniqueKeys ?? true;
        if (!supportedDiff || !hasKeys || !hasUniqueKeys) {
            this.ctx.animationManager.skipCurrentBatch();
        }

        const fns = preparePieSeriesAnimationFunctions(false, this.rotation, radiusScale, previousRadiusScale);
        fromToMotion(
            this.id,
            'nodes',
            animationManager,
            [itemSelection, highlightSelection],
            fns.nodes,
            (_, datum) => this.getDatumId(datum),
            diff
        );
        fromToMotion(this.id, `innerCircle`, animationManager, [this.innerCircleSelection], fns.innerCircle);

        seriesLabelFadeInAnimation(this, 'callout', this.ctx.animationManager, [this.calloutLabelSelection]);
        seriesLabelFadeInAnimation(this, 'sector', this.ctx.animationManager, [this.sectorLabelSelection]);
        seriesLabelFadeInAnimation(this, 'inner', this.ctx.animationManager, [this.innerLabelsSelection]);

        this.previousRadiusScale.range = this.radiusScale.range;
    }

    override animateClearingUpdateEmpty() {
        const { itemSelection, highlightSelection, radiusScale, previousRadiusScale } = this;
        const { animationManager } = this.ctx;

        const fns = preparePieSeriesAnimationFunctions(false, this.rotation, radiusScale, previousRadiusScale);
        fromToMotion(this.id, 'nodes', animationManager, [itemSelection, highlightSelection], fns.nodes);
        fromToMotion(this.id, `innerCircle`, animationManager, [this.innerCircleSelection], fns.innerCircle);

        seriesLabelFadeOutAnimation(this, 'callout', this.ctx.animationManager, [this.calloutLabelSelection]);
        seriesLabelFadeOutAnimation(this, 'sector', this.ctx.animationManager, [this.sectorLabelSelection]);
        seriesLabelFadeOutAnimation(this, 'inner', this.ctx.animationManager, [this.innerLabelsSelection]);

        this.previousRadiusScale.range = this.radiusScale.range;
    }

    getDatumIdFromData(datum: any) {
        const { calloutLabelKey, sectorLabelKey, legendItemKey } = this;

        if (!this.processedData?.reduced?.animationValidation?.uniqueKeys) {
            return undefined;
        }

        if (legendItemKey) {
            return datum[legendItemKey];
        } else if (calloutLabelKey) {
            return datum[calloutLabelKey];
        } else if (sectorLabelKey) {
            return datum[sectorLabelKey];
        }
    }

    getDatumId(datum: PieNodeDatum) {
        const { index } = datum;

        return this.getDatumIdFromData(datum.datum) ?? `${index}`;
    }

    protected override onDataChange() {
        this.processSeriesItemEnabled();
    }
}
