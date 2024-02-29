import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import type { AgPieSeriesFormat } from '../../../options/agChartOptions';
import { LinearScale } from '../../../scale/linearScale';
import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { Selection } from '../../../scene/selection';
import { Line } from '../../../scene/shape/line';
import { Sector } from '../../../scene/shape/sector';
import { Text } from '../../../scene/shape/text';
import { boxCollidesSector, isPointInSector } from '../../../scene/util/sector';
import { normalizeAngle180, toRadians } from '../../../util/angle';
import { jsonDiff } from '../../../util/json';
import { Logger } from '../../../util/logger';
import { mod, toFixed } from '../../../util/number';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { isFiniteNumber } from '../../../util/type-guards';
import type { Has } from '../../../util/types';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { DataModel, getMissCount } from '../../data/dataModel';
import { animationValidation, diff, normalisePropertyTo } from '../../data/processors';
import type { LegendItemClickChartEvent } from '../../interaction/chartEventManager';
import { Layers } from '../../layers';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import { Circle } from '../../marker/circle';
import type { SeriesNodeEventTypes } from '../series';
import { SeriesNodeEvent, accumulativeValueProperty, keyProperty, rangedValueProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation, seriesLabelFadeOutAnimation } from '../seriesLabelUtil';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { DonutInnerLabel, PieTitle } from './pieSeriesProperties';
import { PieSeriesProperties } from './pieSeriesProperties';
import { preparePieSeriesAnimationFunctions, resetPieSelectionsFn } from './pieUtil';
import { type PolarAnimationData, PolarSeries } from './polarSeries';

class PieSeriesNodeEvent<TEvent extends string = SeriesNodeEventTypes> extends SeriesNodeEvent<PieNodeDatum, TEvent> {
    readonly angleKey: string;
    readonly radiusKey?: string;
    readonly calloutLabelKey?: string;
    readonly sectorLabelKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: PieNodeDatum, series: PieSeries) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.properties.angleKey;
        this.radiusKey = series.properties.radiusKey;
        this.calloutLabelKey = series.properties.calloutLabelKey;
        this.sectorLabelKey = series.properties.sectorLabelKey;
    }
}

interface PieCalloutLabelDatum {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    hidden: boolean;
    collisionTextAlign?: CanvasTextAlign;
    collisionOffsetY: number;
    box?: BBox;
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

    readonly calloutLabel?: PieCalloutLabelDatum;

    readonly sectorLabel?: {
        readonly text: string;
    };

    readonly sectorFormat: { [key in keyof Required<AgPieSeriesFormat>]: AgPieSeriesFormat[key] };
    readonly legendItem?: { key: string; text: string };
    readonly legendItemValue?: string;
}

enum PieNodeTag {
    Callout,
    Label,
}

export class PieSeries extends PolarSeries<PieNodeDatum, Sector> {
    static className = 'PieSeries';
    static type = 'pie' as const;

    override properties = new PieSeriesProperties();

    private readonly previousRadiusScale: LinearScale = new LinearScale();
    private readonly radiusScale: LinearScale = new LinearScale();
    private readonly calloutLabelSelection: Selection<Group, PieNodeDatum>;
    private readonly sectorLabelSelection: Selection<Text, PieNodeDatum>;
    private readonly innerLabelsSelection: Selection<Text, DonutInnerLabel>;
    private readonly innerCircleSelection: Selection<Circle, { radius: number }>;

    // The group node that contains the background graphics.
    readonly backgroundGroup = this.rootGroup.appendChild(
        new Group({
            name: `${this.id}-background`,
            layer: true,
            zIndex: Layers.SERIES_BACKGROUND_ZINDEX,
        })
    );

    // AG-6193 If the sum of all datums is 0, then we'll draw 1 or 2 rings to represent the empty series.
    readonly zerosumRingsGroup = this.backgroundGroup.appendChild(new Group({ name: `${this.id}-zerosumRings` }));
    readonly zerosumOuterRing = this.zerosumRingsGroup.appendChild(new Circle());
    readonly zerosumInnerRing = this.zerosumRingsGroup.appendChild(new Circle());

    readonly innerCircleGroup = this.backgroundGroup.appendChild(new Group({ name: `${this.id}-innerCircle` }));

    private nodeData: PieNodeDatum[] = [];
    private angleScale: LinearScale;

    // When a user toggles a series item (e.g. from the legend), its boolean state is recorded here.
    public seriesItemEnabled: boolean[] = [];

    private oldTitle?: PieTitle;

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
        this.innerCircleSelection = Selection.select(this.innerCircleGroup, Circle);

        for (const circle of [this.zerosumInnerRing, this.zerosumOuterRing]) {
            circle.fillOpacity = 0;
            circle.stroke = this.properties.calloutLabel.color;
            circle.strokeWidth = 1;
            circle.strokeOpacity = 1;
        }
    }

    override addChartEventListeners(): void {
        this.destroyFns.push(
            this.ctx.chartEventManager?.addListener('legend-item-click', (event) => this.onLegendItemClick(event))
        );
    }

    override get visible() {
        return (
            super.visible && (this.seriesItemEnabled.length === 0 || this.seriesItemEnabled.some((visible) => visible))
        );
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
        if (this.data == null || !this.properties.isValid()) {
            return;
        }

        let { data } = this;
        const { visible, seriesItemEnabled } = this;
        const { angleKey, radiusKey, calloutLabelKey, sectorLabelKey, legendItemKey } = this.properties;

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
                    min: this.properties.radiusMin ?? 0,
                    max: this.properties.radiusMax,
                }),
                valueProperty(this, radiusKey, true, { id: `radiusRaw` }), // Raw value pass-through.
                normalisePropertyTo(
                    this,
                    { id: 'radiusValue' },
                    [0, 1],
                    1,
                    this.properties.radiusMin ?? 0,
                    this.properties.radiusMax
                )
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

        data = data.map((d, idx) => (visible && seriesItemEnabled[idx] ? d : { ...d, [angleKey]: 0 }));

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
            const missCount = getMissCount(this, missing);
            if (id !== 'angleRaw' && missCount > 0) {
                Logger.warnOnce(
                    `no value was found for the key '${String(property)}' on ${missCount} data element${
                        missCount > 1 ? 's' : ''
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
        const radiusIdx = this.properties.radiusKey
            ? dataModel.resolveProcessedDataIndexById(this, `radiusValue`).index
            : -1;
        const calloutLabelIdx = this.properties.calloutLabelKey
            ? dataModel.resolveProcessedDataIndexById(this, `calloutLabelValue`).index
            : -1;
        const sectorLabelIdx = this.properties.sectorLabelKey
            ? dataModel.resolveProcessedDataIndexById(this, `sectorLabelValue`).index
            : -1;
        const legendItemIdx = this.properties.legendItemKey
            ? dataModel.resolveProcessedDataIndexById(this, `legendItemValue`).index
            : -1;

        return { angleIdx, radiusIdx, calloutLabelIdx, sectorLabelIdx, legendItemIdx };
    }

    async createNodeData() {
        const { id: seriesId, processedData, dataModel, angleScale } = this;
        const { rotation } = this.properties;

        if (!processedData || !dataModel || processedData.type !== 'ungrouped') return [];

        const { angleIdx, radiusIdx, calloutLabelIdx, sectorLabelIdx, legendItemIdx } =
            this.getProcessedDataIndexes(dataModel);

        let currentStart = 0;
        let sum = 0;
        const nodeData = processedData.data.map((group, index): PieNodeDatum => {
            const { datum, values } = group;
            const currentValue = values[angleIdx];

            const startAngle = angleScale.convert(currentStart) + toRadians(rotation);
            currentStart = currentValue;
            sum += currentValue;
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

        this.zerosumOuterRing.visible = sum === 0;
        const { innerRadiusRatio = 1 } = this.properties;
        this.zerosumInnerRing.visible = sum === 0 && innerRadiusRatio !== 1 && innerRadiusRatio > 0;

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
        const { calloutLabel, sectorLabel, legendItemKey } = this.properties;

        const calloutLabelKey = !skipDisabled || calloutLabel.enabled ? this.properties.calloutLabelKey : undefined;
        const sectorLabelKey = !skipDisabled || sectorLabel.enabled ? this.properties.sectorLabelKey : undefined;

        if (!calloutLabelKey && !sectorLabelKey && !legendItemKey) {
            return {};
        }

        const labelFormatterParams = {
            datum,
            angleKey: this.properties.angleKey,
            angleName: this.properties.angleName,
            radiusKey: this.properties.radiusKey,
            radiusName: this.properties.radiusName,
            calloutLabelKey: this.properties.calloutLabelKey,
            calloutLabelName: this.properties.calloutLabelName,
            sectorLabelKey: this.properties.sectorLabelKey,
            sectorLabelName: this.properties.sectorLabelName,
            legendItemKey: this.properties.legendItemKey,
        };

        const result: {
            calloutLabel?: PieCalloutLabelDatum;
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
        const { callbackCache, highlightManager } = this.ctx;
        const { angleKey, radiusKey, fills, strokes, formatter, sectorSpacing, __BACKGROUND_COLOR_DO_NOT_USE } =
            this.properties;

        const highlightedDatum = highlightManager.getActiveHighlight();
        const isDatumHighlighted =
            highlight && highlightedDatum?.series === this && formatIndex === highlightedDatum.itemId;

        let defaultStroke: string | undefined = strokes[formatIndex % strokes.length];
        if (sectorSpacing != null) {
            // @todo(AG-10275) Remove sectorSpacing null case
            defaultStroke ??= __BACKGROUND_COLOR_DO_NOT_USE;
        }
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity } = mergeDefaults(
            isDatumHighlighted && this.properties.highlightStyle.item,
            {
                fill: fills.length > 0 ? fills[formatIndex % fills.length] : undefined,
                fillOpacity: this.properties.fillOpacity,
                stroke: defaultStroke,
                strokeWidth: this.getStrokeWidth(this.properties.strokeWidth),
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
                seriesId: this.id,
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
        const { radius } = this;
        const { innerRadiusRatio = 1, innerRadiusOffset = 0 } = this.properties;
        const innerRadius = radius * innerRadiusRatio + innerRadiusOffset;
        if (innerRadius === radius || innerRadius < 0) {
            return 0;
        }
        return innerRadius;
    }

    getOuterRadius() {
        return Math.max(this.radius * this.properties.outerRadiusRatio + this.properties.outerRadiusOffset, 0);
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
        const spacing = this.properties.title?.spacing ?? 0;
        const titleOffset = 2 + spacing;
        const dy = Math.max(0, -outerRadius);
        return -outerRadius - titleOffset - dy;
    }

    async update({ seriesRect }: { seriesRect: BBox }) {
        const { title } = this.properties;

        const newNodeDataDependencies = {
            seriesRectWidth: seriesRect?.width,
            seriesRectHeight: seriesRect?.height,
        };
        const resize = jsonDiff(this.nodeDataDependencies, newNodeDataDependencies) != null;
        if (resize) {
            this._nodeDataDependencies = newNodeDataDependencies;
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
        const { oldTitle } = this;
        const { title } = this.properties;

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
            selection.update(nodeData, undefined, (datum) => this.getDatumId(datum));
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

        innerLabelsSelection.update(this.properties.innerLabels, (node) => {
            node.pointerEvents = PointerEvents.None;
        });
    }

    private updateInnerCircleSelection() {
        const { innerCircle } = this.properties;

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
        const isVisible = this.visible && this.seriesItemEnabled.indexOf(true) >= 0;
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
                fill: this.properties.innerCircle?.fill,
                opacity: this.properties.innerCircle?.fillOpacity,
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
            sector.strokeOpacity = this.properties.strokeOpacity;
            sector.lineDash = this.properties.lineDash;
            sector.lineDashOffset = this.properties.lineDashOffset;
            sector.fillShadow = this.properties.shadow;
            // @todo(AG-10275) Remove sectorSpacing null case
            sector.inset =
                this.properties.sectorSpacing != null
                    ? (this.properties.sectorSpacing + (format.stroke != null ? format.strokeWidth! : 0)) / 2
                    : 0;
            // @todo(AG-10275) Remove this line completely
            sector.lineJoin = this.properties.sectorSpacing != null ? 'miter' : 'round';
        };

        this.itemSelection.each((node, datum, index) => updateSectorFn(node, datum, index, false));
        this.highlightSelection.each((node, datum, index) => {
            const isDatumHighlighted =
                highlightedDatum?.series === this && node.datum.itemId === highlightedDatum.itemId;

            updateSectorFn(node, datum, index, true);
            node.visible = isDatumHighlighted;
        });

        this.updateCalloutLineNodes();
        this.updateCalloutLabelNodes(seriesRect);
        this.updateSectorLabelNodes();
        this.updateInnerLabelNodes();
        this.updateZerosumRings();

        this.animationState.transition('update');
    }

    updateCalloutLineNodes() {
        const { calloutLine } = this.properties;
        const calloutLength = calloutLine.length;
        const calloutStrokeWidth = calloutLine.strokeWidth;
        const calloutColors = calloutLine.colors ?? this.properties.strokes;
        const { offset } = this.properties.calloutLabel;

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

                const isMoved = label.collisionTextAlign ?? label.collisionOffsetY !== 0;
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
        const { radiusScale } = this;
        const { calloutLabel, calloutLine } = this.properties;
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
            tempTextNode.setFont(this.properties.calloutLabel);
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
        const { radiusScale } = this;
        const { calloutLabel, calloutLine } = this.properties;
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
            tempTextNode.setFont(this.properties.calloutLabel);
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
            text.setFont(this.properties.calloutLabel);
            text.setAlign(align);
            text.fill = color;
            text.visible = visible;
        });
    }

    override async computeLabelsBBox(options: { hideWhenNecessary: boolean }, seriesRect: BBox) {
        const { calloutLabel, calloutLine } = this.properties;
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
        const { title } = this.properties;
        if (title?.text && title.enabled) {
            const dy = this.getTitleTranslationY();
            if (isFinite(dy)) {
                text.text = title.text;
                text.x = 0;
                text.y = dy;
                text.setFont(title);
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
            text.setFont(this.properties.calloutLabel);
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
        const { fontSize, fontStyle, fontWeight, fontFamily, positionOffset, positionRatio, color } =
            this.properties.sectorLabel;

        const isDonut = innerRadius > 0;
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
                const shouldPutTextInCenter = !isDonut && singleVisibleSector;
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
            const { fontStyle, fontWeight, fontSize, fontFamily, color, margin = 2 } = datum;
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
            margins.push(margin);
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

    private updateZerosumRings() {
        // The Circle `size` is the diameter
        this.zerosumOuterRing.size = this.getOuterRadius() * 2;
        this.zerosumInnerRing.size = this.getInnerRadius() * 2;
    }

    protected override readonly NodeEvent = PieSeriesNodeEvent;

    private getDatumLegendName(nodeDatum: PieNodeDatum) {
        const { angleKey, calloutLabelKey, sectorLabelKey, legendItemKey } = this.properties;
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
        if (!this.properties.isValid()) {
            return '';
        }

        const {
            datum,
            angleValue,
            sectorFormat: { fill: color },
        } = nodeDatum;

        const title = sanitizeHtml(this.properties.title?.text);
        const content = isFiniteNumber(angleValue) ? toFixed(angleValue) : String(angleValue);
        const labelText = this.getDatumLegendName(nodeDatum);

        return this.properties.tooltip.toTooltipHtml(
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
                angleKey: this.properties.angleKey,
                angleName: this.properties.angleName,
                radiusKey: this.properties.radiusKey,
                radiusName: this.properties.radiusName,
                calloutLabelKey: this.properties.calloutLabelKey,
                calloutLabelName: this.properties.calloutLabelName,
                sectorLabelKey: this.properties.sectorLabelKey,
                sectorLabelName: this.properties.sectorLabelName,
            }
        );
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const { visible, processedData, dataModel } = this;

        if (!dataModel || !processedData?.data.length || legendType !== 'category') {
            return [];
        }

        const { angleKey, calloutLabelKey, sectorLabelKey, legendItemKey } = this.properties;

        if (
            !legendItemKey &&
            (!calloutLabelKey || calloutLabelKey === angleKey) &&
            (!sectorLabelKey || sectorLabelKey === angleKey)
        ) {
            return [];
        }

        const { calloutLabelIdx, sectorLabelIdx, legendItemIdx } = this.getProcessedDataIndexes(dataModel);

        const titleText = this.properties.title?.showInLegend && this.properties.title.text;
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
                id: this.id,
                itemId: index,
                seriesId: this.id,
                enabled: visible && this.seriesItemEnabled[index],
                label: {
                    text: labelParts.join(' - '),
                },
                marker: {
                    fill: sectorFormat.fill,
                    stroke: sectorFormat.stroke,
                    fillOpacity: this.properties.fillOpacity,
                    strokeOpacity: this.properties.strokeOpacity,
                    strokeWidth: this.properties.strokeWidth,
                },
                legendItemName: legendItemKey != null ? datum[legendItemKey] : undefined,
            });
        }

        return legendData;
    }

    onLegendItemClick(event: LegendItemClickChartEvent) {
        const { enabled, itemId, series, legendItemName } = event;

        if (series.id === this.id) {
            this.toggleSeriesItem(itemId, enabled);
        } else if (legendItemName != null) {
            this.toggleOtherSeriesItems(legendItemName, enabled);
        }
    }

    protected override toggleSeriesItem(itemId: number, enabled: boolean): void {
        this.seriesItemEnabled[itemId] = enabled;
        this.nodeDataRefresh = true;
    }

    toggleOtherSeriesItems(legendItemName: string, enabled: boolean): void {
        if (!this.properties.legendItemKey || !this.dataModel) {
            return;
        }

        const legendItemIdx = this.dataModel.resolveProcessedDataIndexById(this, `legendItemValue`).index;
        this.processedData?.data.forEach(({ values }, datumItemId) => {
            if (values[legendItemIdx] === legendItemName) {
                this.toggleSeriesItem(datumItemId, enabled);
            }
        });
    }

    override animateEmptyUpdateReady(_data?: PolarAnimationData) {
        const { animationManager } = this.ctx;

        const fns = preparePieSeriesAnimationFunctions(
            true,
            this.properties.rotation,
            this.radiusScale,
            this.previousRadiusScale
        );
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
        const dataDiff = processedData?.reduced?.diff;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        const supportedDiff =
            (dataDiff?.moved.length ?? 0) === 0 &&
            dataDiff?.addedIndices.every((i) => !dataDiff.removedIndices.includes(i));
        const hasKeys = (processedData?.defs.keys.length ?? 0) > 0;
        const hasUniqueKeys = processedData?.reduced?.animationValidation?.uniqueKeys ?? true;
        if (!supportedDiff || !hasKeys || !hasUniqueKeys) {
            this.ctx.animationManager.skipCurrentBatch();
        }

        const fns = preparePieSeriesAnimationFunctions(
            false,
            this.properties.rotation,
            radiusScale,
            previousRadiusScale
        );
        fromToMotion(
            this.id,
            'nodes',
            animationManager,
            [itemSelection, highlightSelection],
            fns.nodes,
            (_, datum) => this.getDatumId(datum),
            dataDiff
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

        const fns = preparePieSeriesAnimationFunctions(
            false,
            this.properties.rotation,
            radiusScale,
            previousRadiusScale
        );
        fromToMotion(this.id, 'nodes', animationManager, [itemSelection, highlightSelection], fns.nodes);
        fromToMotion(this.id, `innerCircle`, animationManager, [this.innerCircleSelection], fns.innerCircle);

        seriesLabelFadeOutAnimation(this, 'callout', this.ctx.animationManager, [this.calloutLabelSelection]);
        seriesLabelFadeOutAnimation(this, 'sector', this.ctx.animationManager, [this.sectorLabelSelection]);
        seriesLabelFadeOutAnimation(this, 'inner', this.ctx.animationManager, [this.innerLabelsSelection]);

        this.previousRadiusScale.range = this.radiusScale.range;
    }

    getDatumIdFromData(datum: any) {
        const { calloutLabelKey, sectorLabelKey, legendItemKey } = this.properties;

        if (!this.processedData?.reduced?.animationValidation?.uniqueKeys) {
            return;
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
        const { data, seriesItemEnabled } = this;
        this.seriesItemEnabled = data?.map((_, index) => seriesItemEnabled[index] ?? true) ?? [];
    }
}
