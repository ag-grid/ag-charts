import type {
    DynamicContext,
    LabelFit,
    NormalisedColorType,
    NormalisedDonutSeriesStyle,
    NormalisedPieSeriesStyle,
    NormalisedTextOrSegments,
} from 'ag-charts-core';
import {
    ChartAxisDirection,
    ChartUpdateType,
    DebugMetrics,
    type Has,
    type InternalAgColorType,
    type Point,
    PolarZIndexMap,
    type RequireOptional,
    type WrapOptions,
    anyOverlap,
    cachedTextMeasurer,
    canRenderTextOffscreen,
    extractDomain,
    fitLabelText,
    formatValue,
    isGradientFill,
    isStringFillArray,
    jsonDiff,
    mergeDefaults,
    modulus,
    normalizeAngle180,
    resolveLabelFit,
    toNumber,
    toPlainText,
    toRadians,
    wrapTextOrSegments,
} from 'ag-charts-core';
import type {
    AgDonutCalloutLineItemStylerParams,
    AgDonutCalloutLineItemStylerResult,
    AgDonutSeriesCalloutOptions,
    AgDonutSeriesItemStylerParams,
    AgDonutSeriesLabelFormatterParams,
    AgDonutSeriesOptions,
    AgDrawingMode,
    AgNumericValue,
    AgPieSeriesItemStylerParams,
    AgPieSeriesLabelFormatterParams,
    NormalisedCallbackParams,
} from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { LinearScale } from '../../../scale/linearScale';
import { BBox } from '../../../scene/bbox';
import type { GradientParams } from '../../../scene/gradient/gradient';
import { Group, TranslatableGroup } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { Selection } from '../../../scene/selection';
import { Line } from '../../../scene/shape/line';
import { Sector } from '../../../scene/shape/sector';
import { Text } from '../../../scene/shape/text';
import { boxOverlapsSector, clockwiseAngles, isPointInSector, sectorBox } from '../../../scene/util/sector';
import type { DataController } from '../../data/dataController';
import { DataModel, type ProcessedData, getMissCount } from '../../data/dataModel';
import {
    accumulativeValueProperty,
    animationValidation,
    createDatumId,
    diff,
    keyProperty,
    normalisePropertyTo,
    rangedValueProperty,
    valueProperty,
} from '../../data/processors';
import { Label, expandLabelPadding } from '../../label';
import { fitLabelToContainer, fitSectorLabelRect, getLabelStyles } from '../../labelUtil';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { Marker } from '../../marker/marker';
import { type TooltipContent } from '../../tooltip/tooltip';
import type { DataModelSeriesNodeDatum } from '../dataModelSeries';
import { type SeriesNodePickMatch, SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation, seriesLabelFadeOutAnimation } from '../seriesLabelUtil';
import { isUnselected } from '../seriesProperties';
import type { HighlightState } from '../seriesTypes';
import type { DonutInnerLabel, DonutTitle } from './donutSeriesProperties';
import { DonutSeriesProperties } from './donutSeriesProperties';
import {
    pickByMatchingAngle,
    pickSectorsInBBoxPredicate,
    preparePieSeriesAnimationFunctions,
    resetPieSelectionsFn,
} from './pieUtil';
import {
    DEFAULT_POLAR_DIRECTION_KEYS,
    DEFAULT_POLAR_DIRECTION_NAMES,
    type PolarAnimationData,
    PolarSeries,
} from './polarSeries';

interface PieDonutLabelDatum {
    readonly text: NormalisedTextOrSegments;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    hidden: boolean;
    collisionTextAlign?: CanvasTextAlign;
    collisionOffsetY: number;
    box?: BBox;
}

interface PieDonutNodeDatum extends DataModelSeriesNodeDatum {
    readonly radius: number; // in the [0, 1] range
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly angleValue: AgNumericValue;
    readonly radiusValue?: AgNumericValue;
    readonly startAngle: number;
    readonly endAngle: number;
    readonly midAngle: number;
    readonly midCos: number;
    readonly midSin: number;

    readonly calloutLabel?: PieDonutLabelDatum;

    readonly sectorLabel?: {
        readonly text: NormalisedTextOrSegments;
    };

    readonly sectorFormat: { [key in keyof Omit<Required<PieDonutSeriesStyle>, 'fill'>]: PieDonutSeriesStyle[key] } & {
        fill?: InternalAgColorType;
    };
    readonly legendItem?: { key: string; text: string };
    readonly legendItemValue?: string;
    enabled: boolean;
}

interface ProcessedDataValues {
    angleValues: number[];
    angleRawValues: AgNumericValue[];
    angleFilterValues: number[] | undefined;
    angleFilterRawValues: number[] | undefined;
    radiusValues: number[] | undefined;
    radiusRawValues: AgNumericValue[] | undefined;
    calloutLabelValues: string[] | undefined;
    sectorLabelValues: string[] | undefined;
    legendItemValues: string[] | undefined;
}

enum DonutNodeTag {
    CalloutLine,
    CalloutLabel,
}

interface PieDonutSeriesLabelFormatterParams
    extends AgDonutSeriesLabelFormatterParams, AgPieSeriesLabelFormatterParams {}
interface PieDonutSeriesStyle extends NormalisedDonutSeriesStyle, NormalisedPieSeriesStyle {}

type PieAnimationFns = ReturnType<typeof preparePieSeriesAnimationFunctions>;

// The sector animation tweens `fill`/`stroke` towards the datum's own sector style; a cutout node
// paints neither, and a tweened stroke on it would be drawn over the sector it is erasing beneath.
function prepareInnerCircleCutoutAnimationFunctions({ nodes }: PieAnimationFns): PieAnimationFns['nodes'] {
    return {
        fromFn: (...args) => {
            const { fill: _fill, stroke: _stroke, ...rest } = nodes.fromFn(...args);
            return rest;
        },
        toFn: (...args) => {
            const { fill: _fill, stroke: _stroke, ...rest } = nodes.toFn(...args);
            return rest;
        },
    };
}

export class DonutSeries extends PolarSeries<
    PieDonutNodeDatum,
    AgDonutSeriesOptions,
    DonutSeriesProperties,
    Sector<PieDonutNodeDatum>
> {
    static override readonly className: string = 'DonutSeries';
    static readonly type: string = 'donut';

    override properties = new DonutSeriesProperties();

    private phantomNodeData: PieDonutNodeDatum[] | undefined = undefined;
    private get calloutNodeData() {
        return this.phantomNodeData ?? this.nodeData;
    }

    readonly backgroundGroup = new TranslatableGroup({
        name: `${this.id}-background`,
        zIndex: PolarZIndexMap.BACKGROUND,
    });

    private noVisibleData: boolean = false;

    private readonly previousRadiusScale: LinearScale = new LinearScale();
    private readonly radiusScale: LinearScale = new LinearScale();
    protected phantomGroup = this.contentGroup.appendChild(new Group({ name: 'phantom', zIndex: -1 }));
    private readonly phantomSelection = Selection.select<Sector<PieDonutNodeDatum>>(
        this.phantomGroup,
        () => this.nodeFactory(),
        false
    );
    protected phantomHighlightGroup = this.highlightGroup.appendChild(new Group({ name: 'phantom', zIndex: -1 }));
    private readonly phantomHighlightSelection = Selection.select<Sector<PieDonutNodeDatum>>(
        this.phantomHighlightGroup,
        () => this.nodeFactory(),
        false
    );
    private readonly calloutLabelGroup = this.contentGroup.appendChild(new Group({ name: 'pieCalloutLabels' }));
    private readonly calloutLabelSelection = Selection.select<Group<PieDonutNodeDatum>>(this.calloutLabelGroup, Group);

    // When every datum sums to 0 these rings stand in for the empty series.
    readonly zerosumRingsGroup = this.backgroundGroup.appendChild(new Group({ name: `${this.id}-zerosumRings` }));
    readonly zerosumOuterRing = this.zerosumRingsGroup.appendChild(new Marker({ shape: 'circle' }));
    readonly zerosumInnerRing = this.zerosumRingsGroup.appendChild(new Marker({ shape: 'circle' }));

    readonly innerLabelsGroup = this.contentGroup.appendChild(new Group({ name: 'innerLabels' }));
    readonly innerCircleGroup = this.backgroundGroup.appendChild(new Group({ name: `${this.id}-innerCircle` }));
    readonly innerLabelsSelection = Selection.select<Text<DonutInnerLabel>>(this.innerLabelsGroup, Text);
    readonly innerCircleSelection = Selection.select<Marker<{ radius: number }>>(
        this.innerCircleGroup,
        () => new Marker({ shape: 'circle' })
    );
    // `destination-out` erases everything already on its canvas, so the cutouts must live only in
    // the inner circle's group, which composites offscreen while they are present.
    private readonly innerCircleCutoutGroup = this.innerCircleGroup.appendChild(
        new Group({ name: `${this.id}-innerCircleCutout` })
    );
    readonly innerCircleCutoutSelection = Selection.select<Sector<PieDonutNodeDatum>>(
        this.innerCircleCutoutGroup,
        () => this.nodeFactory(),
        false
    );

    private readonly angleScale: LinearScale;

    private oldTitle?: DonutTitle;

    override surroundingRadius?: number = undefined;

    constructor(moduleCtx: DynamicContext<ChartRegistry>) {
        super({
            moduleCtx,
            categoryKey: undefined,
            propertyKeys: {
                ...DEFAULT_POLAR_DIRECTION_KEYS,
                sectorLabel: ['sectorLabelKey'],
                calloutLabel: ['calloutLabelKey'],
            },
            propertyNames: {
                ...DEFAULT_POLAR_DIRECTION_NAMES,
                sectorLabel: ['sectorLabelName'],
                calloutLabel: ['calloutLabelName'],
            },
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            animationResetFns: { item: resetPieSelectionsFn, label: resetLabelFn },
        });

        this.angleScale = new LinearScale();
        // Each sector is a ratio of the whole, where all ratios add up to 1.
        this.angleScale.domain = [0, 1];
        // Add 90 deg to start the first pie at 12 o'clock.
        this.angleScale.range = [-Math.PI, Math.PI].map((angle) => angle + Math.PI / 2);

        this.phantomGroup.opacity = 0.2;
        this.phantomHighlightGroup.opacity = 0.2;

        this.innerLabelsGroup.pointerEvents = PointerEvents.None;
    }

    override attachSeries(seriesContentNode: Group, seriesNode: Group, annotationNode: Group | undefined): void {
        super.attachSeries(seriesContentNode, seriesNode, annotationNode);

        seriesContentNode?.appendChild(this.backgroundGroup);
    }

    override detachSeries(
        seriesContentNode: Group | undefined,
        seriesNode: Group,
        annotationNode: Group | undefined
    ): void {
        super.detachSeries(seriesContentNode, seriesNode, annotationNode);

        this.backgroundGroup.remove();
    }

    override setZIndex(zIndex: number) {
        super.setZIndex(zIndex);

        this.backgroundGroup.zIndex = [PolarZIndexMap.BACKGROUND, zIndex];
    }

    protected override nodeFactory(): Sector<PieDonutNodeDatum> {
        const sector = new Sector<PieDonutNodeDatum>();
        sector.miterLimit = 1e9;
        return sector;
    }

    override getSeriesDomain(direction: ChartAxisDirection) {
        if (direction === ChartAxisDirection.Angle) {
            return { domain: this.angleScale.domain };
        } else {
            return { domain: this.radiusScale.domain };
        }
    }

    override async processData(dataController: DataController) {
        if (this.data == null) return;

        const {
            visible,
            id: seriesId,
            ctx: { legendManager },
        } = this;
        const { angleKey, angleFilterKey, radiusKey, calloutLabelKey, sectorLabelKey, legendItemKey } = this.properties;

        const processor = () => (value: unknown, index: number) => {
            if (visible && (legendManager?.getItemEnabled({ seriesId, itemId: index }) ?? true)) {
                return value;
            }
            return 0;
        };

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const allowNullKey = this.properties.allowNullKeys ?? false;
        const extraKeyProps = [];
        const extraProps = [];

        // Order here should match `getDatumIdFromData()`.
        if (legendItemKey) {
            extraKeyProps.push(keyProperty(legendItemKey, 'category', { id: `legendItemKey`, allowNullKey }));
        } else if (calloutLabelKey) {
            extraKeyProps.push(keyProperty(calloutLabelKey, 'category', { id: `calloutLabelKey`, allowNullKey }));
        } else if (sectorLabelKey) {
            extraKeyProps.push(keyProperty(sectorLabelKey, 'category', { id: `sectorLabelKey`, allowNullKey }));
        }

        const radiusScaleType = this.radiusScale.type;
        const angleScaleType = this.angleScale.type;

        if (radiusKey) {
            extraProps.push(
                rangedValueProperty(radiusKey, {
                    id: 'radiusValue',
                    min: this.properties.radiusMin ?? 0,
                    max: this.properties.radiusMax,
                    missingValue: this.properties.radiusMax ?? 1,
                    processor,
                }),
                valueProperty(radiusKey, radiusScaleType, { id: `radiusRaw`, processor }), // Raw value pass-through.
                normalisePropertyTo('radiusValue', [0, 1], 1, this.properties.radiusMin ?? 0, this.properties.radiusMax)
            );
        }
        if (calloutLabelKey) {
            extraProps.push(valueProperty(calloutLabelKey, 'category', { id: `calloutLabelValue`, allowNullKey }));
        }
        if (sectorLabelKey) {
            extraProps.push(valueProperty(sectorLabelKey, 'category', { id: `sectorLabelValue`, allowNullKey }));
        }
        if (legendItemKey) {
            extraProps.push(valueProperty(legendItemKey, 'category', { id: `legendItemValue`, allowNullKey }));
        }
        if (angleFilterKey) {
            extraProps.push(
                accumulativeValueProperty(angleFilterKey, angleScaleType, {
                    id: `angleFilterValue`,
                    onlyPositive: true,
                    invalidValue: 0,
                    processor,
                }),
                valueProperty(angleFilterKey, angleScaleType, { id: `angleFilterRaw` }),
                normalisePropertyTo('angleFilterValue', [0, 1], 0, 0)
            );
        }
        if (
            animationEnabled &&
            this.processedData?.reduced?.animationValidation?.uniqueKeys &&
            extraKeyProps.length > 0
        ) {
            extraProps.push(diff(this.id, this.processedData));
        }
        extraProps.push(animationValidation());

        await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                ...extraKeyProps,
                accumulativeValueProperty(angleKey, angleScaleType, {
                    id: `angleValue`,
                    onlyPositive: true,
                    invalidValue: 0,
                    processor,
                }),
                valueProperty(angleKey, angleScaleType, { id: `angleRaw` }), // Raw value pass-through.
                normalisePropertyTo('angleValue', [0, 1], 0, 0),
                ...extraProps,
            ],
        });

        // Warn about missing data.
        for (const valueDef of this.processedData?.defs?.values ?? []) {
            // 'angleRaw' is internal, and its misses are always mirrored by 'angleValue' misses.
            const { id, missing, property } = valueDef;
            const missCount = getMissCount(this, missing);
            if (id !== 'angleRaw' && missCount > 0) {
                this.ctx.logger.warnOnce(
                    `no value was found for the key '${String(property)}' on ${missCount} data element${
                        missCount > 1 ? 's' : ''
                    }`
                );
            }
        }

        this.animationState.transition('updateData');
    }

    maybeRefreshNodeData() {
        if (!this.nodeDataRefresh) return;
        const { nodeData = [], phantomNodeData } = this.createNodeData() ?? {};
        this.nodeData = nodeData;
        this.phantomNodeData = phantomNodeData;
        if (nodeData.length > 0) {
            DebugMetrics.record(`${this.type}:nodeData`, nodeData.length);
        }
        this.nodeDataRefresh = false;
    }

    private getProcessedDataValues(dataModel: DataModel<any>, processedData: ProcessedData<any>) {
        const angleValues = dataModel.resolveColumnById(this, `angleValue`, processedData, 'number');
        // Mixed-numeric so a bigint datum reaches the node datum and tooltip exactly.
        const angleRawValues = dataModel.resolveColumnById(this, `angleRaw`, processedData, 'mixed-numeric');
        const angleFilterValues =
            this.properties.angleFilterKey == null
                ? undefined
                : dataModel.resolveColumnById(this, `angleFilterValue`, processedData, 'number');
        const angleFilterRawValues =
            this.properties.angleFilterKey == null
                ? undefined
                : dataModel.resolveColumnById(this, `angleFilterRaw`, processedData, 'number');
        const radiusValues = this.properties.radiusKey
            ? dataModel.resolveColumnById(this, `radiusValue`, processedData, 'number')
            : undefined;
        const radiusRawValues = this.properties.radiusKey
            ? dataModel.resolveColumnById(this, `radiusRaw`, processedData, 'mixed-numeric')
            : undefined;
        const calloutLabelValues = this.properties.calloutLabelKey
            ? dataModel.resolveColumnById<string>(this, `calloutLabelValue`, processedData, 'object')
            : undefined;
        const sectorLabelValues = this.properties.sectorLabelKey
            ? dataModel.resolveColumnById<string>(this, `sectorLabelValue`, processedData, 'object')
            : undefined;
        const legendItemValues = this.properties.legendItemKey
            ? dataModel.resolveColumnById<string>(this, `legendItemValue`, processedData, 'object')
            : undefined;

        return {
            angleValues,
            angleRawValues,
            angleFilterValues,
            angleFilterRawValues,
            radiusValues,
            radiusRawValues,
            calloutLabelValues,
            sectorLabelValues,
            legendItemValues,
        };
    }

    override createNodeData() {
        const {
            id: seriesId,
            processedData,
            dataModel,
            angleScale,
            ctx: { legendManager },
            visible,
        } = this;
        const { rotation, innerRadiusRatio } = this.properties;

        if (!dataModel || processedData?.type !== 'ungrouped') return;

        const processedDataValues = this.getProcessedDataValues(dataModel, processedData);
        const {
            angleValues,
            angleRawValues,
            angleFilterValues,
            angleFilterRawValues,
            radiusValues,
            radiusRawValues,
            legendItemValues,
        } = processedDataValues;

        const useFilterAngles =
            angleFilterRawValues?.some((filterRawValue, index) => {
                return filterRawValue > angleRawValues[index];
            }) ?? false;

        let currentStart = 0;
        let sum = 0;
        const nodes: PieDonutNodeDatum[] = [];
        const phantomNodes: PieDonutNodeDatum[] | undefined = angleFilterRawValues == null ? undefined : [];
        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        const invalidData = processedData.invalidData?.get(this.id);
        const { calloutLabel } = this.properties;
        const calloutLabelFit = resolveLabelFit(calloutLabel, false);
        for (const [datumIndex, datum] of rawData.entries()) {
            if (invalidData?.[datumIndex] === true) continue;
            const currentValue = useFilterAngles ? angleFilterValues![datumIndex] : angleValues[datumIndex];
            const crossFilterScale =
                angleFilterRawValues != null && !useFilterAngles
                    ? // Narrow so a bigint raw angle divides as a float rather than truncating (or throwing in Math.sqrt).
                      Math.sqrt(toNumber(angleFilterRawValues[datumIndex]) / toNumber(angleRawValues[datumIndex]))
                    : 1;

            const startAngle = angleScale.convert(currentStart) + toRadians(rotation);
            currentStart = currentValue;
            sum += currentValue;
            const endAngle = angleScale.convert(currentStart) + toRadians(rotation);
            const span = Math.abs(endAngle - startAngle);
            const midAngle = startAngle + span / 2;

            const angleValue = angleRawValues[datumIndex];
            const radiusRaw = radiusValues?.[datumIndex] ?? 1;
            const radius = radiusRaw * crossFilterScale;
            const radiusValue = radiusRawValues?.[datumIndex];
            const legendItemValue = legendItemValues?.[datumIndex];

            const nodeLabels = this.getLabels(datumIndex, datum, midAngle, span, processedDataValues, calloutLabelFit);
            const sectorFormat = this.getItemStyle({ datum, datumIndex }, false, false);

            const node = {
                series: this,
                datum,
                datumIndex,
                angleValue,
                midAngle,
                midCos: Math.cos(midAngle),
                midSin: Math.sin(midAngle),
                startAngle,
                endAngle,
                radius,
                innerRadius: Math.max(this.radiusScale.convert(0), 0),
                outerRadius: Math.max(this.radiusScale.convert(radius), 0),
                sectorFormat,
                radiusValue,
                legendItemValue,
                enabled: visible && (legendManager?.getItemEnabled({ seriesId, itemId: datumIndex }) ?? true),
                focusable: true,
                ...nodeLabels,
            };
            nodes.push(node);

            if (phantomNodes != null) {
                phantomNodes.push({
                    ...node,
                    radius: 1,
                    innerRadius: Math.max(this.radiusScale.convert(0), 0),
                    outerRadius: Math.max(this.radiusScale.convert(1), 0),
                    focusable: false,
                });
            }
        }

        this.zerosumOuterRing.visible = sum === 0;
        this.zerosumInnerRing.visible =
            sum === 0 && innerRadiusRatio != null && innerRadiusRatio !== 1 && innerRadiusRatio > 0;

        return {
            itemId: seriesId,
            nodeData: nodes,
            labelData: nodes,
            phantomNodeData: phantomNodes,
        };
    }

    private getLabelContent(
        datumIndex: number,
        datum: any,
        values: Pick<ProcessedDataValues, 'calloutLabelValues' | 'sectorLabelValues' | 'legendItemValues'>,
        calloutLabelFit: LabelFit | undefined
    ) {
        const { id: seriesId, ctx, properties } = this;
        const { formatManager } = ctx;
        const { calloutLabel, sectorLabel, calloutLabelKey, sectorLabelKey, legendItemKey } = properties;
        const allowNullKeys = properties.allowNullKeys ?? false;

        const calloutLabelValue = values.calloutLabelValues?.[datumIndex];
        const sectorLabelValue = values.sectorLabelValues?.[datumIndex];
        const legendItemValue = values.legendItemValues?.[datumIndex];

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
            callout: NormalisedTextOrSegments | undefined;
            sector: NormalisedTextOrSegments | undefined;
            legendItem: string | undefined;
        } = {
            callout: undefined,
            sector: undefined,
            legendItem: undefined,
        };

        if (calloutLabelKey) {
            result.callout = fitLabelText(
                this.getLabelText<PieDonutSeriesLabelFormatterParams>(
                    calloutLabelValue,
                    datum,
                    calloutLabelKey,
                    'calloutLabel',
                    [],
                    calloutLabel,
                    { ...labelFormatterParams, value: calloutLabelValue },
                    allowNullKeys
                ),
                calloutLabelFit,
                calloutLabel
            );
        }

        if (sectorLabelKey) {
            result.sector = this.getLabelText<PieDonutSeriesLabelFormatterParams>(
                sectorLabelValue,
                datum,
                sectorLabelKey,
                'sectorLabel',
                [],
                sectorLabel,
                { ...labelFormatterParams, value: sectorLabelValue },
                allowNullKeys
            );
        }

        if (legendItemKey != null && (legendItemValue != null || allowNullKeys)) {
            const legendItemDisplay = legendItemValue ?? '';
            result.legendItem =
                formatManager.format(this.callWithContext.bind(this), {
                    type: 'category',
                    value: allowNullKeys ? (legendItemValue as string) : legendItemDisplay,
                    datum,
                    seriesId,
                    legendItemName: undefined,
                    key: legendItemKey,
                    source: 'legend-label',
                    property: 'legendItem',
                    domain: [],
                    boundSeries: this.getFormatterContext('legendItem'),
                }) ?? legendItemDisplay;
        }

        return result;
    }

    private getLabels(
        datumIndex: number,
        datum: any,
        midAngle: number,
        span: number,
        values: ProcessedDataValues,
        calloutLabelFit: LabelFit | undefined
    ) {
        const { properties } = this;
        const { calloutLabel, sectorLabel, legendItemKey } = properties;

        const formats = this.getLabelContent(datumIndex, datum, values, calloutLabelFit);
        const result: {
            calloutLabel?: PieDonutLabelDatum;
            sectorLabel?: { text: NormalisedTextOrSegments };
            legendItem?: { key: string; text: string };
        } = {};

        if (calloutLabel.enabled && formats.callout && span >= toRadians(calloutLabel.minAngle)) {
            result.calloutLabel = {
                ...this.getTextAlignment(midAngle),
                text: formats.callout,
                hidden: false,
                collisionTextAlign: undefined,
                collisionOffsetY: 0,
                box: undefined,
            };
        }

        if (sectorLabel.enabled && formats.sector) {
            result.sectorLabel = { text: formats.sector };
        }

        if (legendItemKey && formats.legendItem) {
            result.legendItem = { key: legendItemKey, text: formats.legendItem };
        }

        return result;
    }

    private getTextAlignment(midAngle: number) {
        const quadrantTextOpts: { textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline }[] = [
            { textAlign: 'center', textBaseline: 'bottom' },
            { textAlign: 'left', textBaseline: 'middle' },
            { textAlign: 'center', textBaseline: 'top' },
            { textAlign: 'right', textBaseline: 'middle' },
        ];

        const midAngle180 = normalizeAngle180(midAngle);

        // Split the circle into quadrants like so: ⊗
        const quadrantStart = -0.75 * Math.PI; // same as `normalizeAngle180(toRadians(-135))`
        const quadrantOffset = midAngle180 - quadrantStart;
        const quadrant = Math.floor(quadrantOffset / (Math.PI / 2));
        const quadrantIndex = modulus(quadrant, quadrantTextOpts.length);

        return quadrantTextOpts[quadrantIndex];
    }

    private getFillParams(
        fill: InternalAgColorType,
        innerRadius: number,
        outerRadius: number
    ): GradientParams | undefined {
        if (!isGradientFill(fill) || fill.bounds === 'item') return;

        return {
            centerX: 0,
            centerY: 0,
            innerRadius,
            outerRadius,
        };
    }

    private getItemStyle(
        { datum, datumIndex }: Pick<PieDonutNodeDatum, 'datum' | 'datumIndex'>,
        isHighlight: boolean,
        withSelection: boolean,
        highlightState?: HighlightState,
        legendItemValues?: string[]
    ) {
        const { fills, strokes, itemStyler } = this.properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState, legendItemValues);
        const selectionStyle = withSelection ? this.getSelectionStyle(datumIndex) : undefined;
        const defaultStyle = { fill: fills[datumIndex], stroke: strokes[datumIndex] };

        const {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cornerRadius,
            opacity,
        } = mergeDefaults(selectionStyle, highlightStyle, defaultStyle, this.properties);

        let overrides: PieDonutSeriesStyle | undefined;
        if (itemStyler) {
            overrides = this.cachedDatumCallback(
                this.getDatumId(datumIndex) + (isHighlight ? '-highlight' : '-hide'),
                () => {
                    const params = this.makeItemStylerParams(datum, datumIndex, isHighlight, {
                        fill,
                        fillOpacity,
                        stroke,
                        strokeWidth,
                        strokeOpacity,
                        lineDash,
                        lineDashOffset,
                        cornerRadius,
                    });
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(itemStyler, params),
                        { proxyPaths: { fill: ['fills', `${datumIndex}`], stroke: ['strokes', `${datumIndex}`] } }
                    );
                }
            );
        }

        return {
            fill: overrides?.fill ?? fill,
            fillOpacity: overrides?.fillOpacity ?? fillOpacity,
            stroke: overrides?.stroke ?? stroke,
            strokeWidth: overrides?.strokeWidth ?? strokeWidth,
            strokeOpacity: overrides?.strokeOpacity ?? strokeOpacity,
            lineDash: overrides?.lineDash ?? lineDash,
            lineDashOffset: overrides?.lineDashOffset ?? lineDashOffset,
            cornerRadius: overrides?.cornerRadius ?? cornerRadius,
            opacity,
        };
    }

    private makeItemStylerParams(
        datum: unknown,
        datumIndex: number,
        isHighlight: boolean,
        style: Required<NormalisedPieSeriesStyle>
    ) {
        const { angleKey, radiusKey, calloutLabelKey, sectorLabelKey, legendItemKey } = this.properties;

        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            datum,
            angleKey,
            radiusKey,
            calloutLabelKey,
            sectorLabelKey,
            legendItemKey,
            ...style,
            fill,
            highlightState: this.getHighlightStateString(
                this.ctx.highlightManager?.getActiveHighlight(),
                isHighlight,
                datumIndex
            ),
            selectionState: this.getSelectionStateString(datumIndex),
            candidateState: this.getCandidateStateString(datumIndex),
            seriesId: this.id,
        } satisfies NormalisedCallbackParams<
            AgDonutSeriesItemStylerParams<unknown, unknown> | AgPieSeriesItemStylerParams<unknown, unknown>,
            { fill?: NormalisedColorType; stroke?: NormalisedColorType }
        >;
    }

    private getCalloutLineStyle(nodeDatum: PieDonutNodeDatum, highlighted: boolean) {
        type TResult = AgDonutCalloutLineItemStylerResult &
            Pick<AgDonutSeriesCalloutOptions<unknown, unknown>, 'colors'>;
        const { properties } = this;
        let itemStylerResult: AgDonutCalloutLineItemStylerResult = {};
        if (properties.calloutLine.itemStyler) {
            const highlightState = this.getHighlightStateString(
                this.ctx.highlightManager?.getActiveHighlight(),
                highlighted,
                nodeDatum.datumIndex
            );
            const selectionState = this.getSelectionStateString(nodeDatum.datumIndex);
            const candidateState = this.getCandidateStateString(nodeDatum.datumIndex);
            const params: RequireOptional<Omit<AgDonutCalloutLineItemStylerParams<unknown, unknown>, 'context'>> = {
                angleKey: properties.angleKey,
                angleName: properties.angleName ?? properties.angleKey,
                calloutLabelKey: properties.calloutLabelKey,
                calloutLabelName: properties.calloutLabelName ?? properties.calloutLabelKey,
                datum: nodeDatum.datum,
                highlightState,
                selectionState,
                candidateState,
                legendItemKey: properties.legendItemKey,
                radiusKey: properties.radiusKey,
                radiusName: properties.radiusName ?? properties.radiusKey,
                sectorLabelKey: properties.sectorLabelKey,
                sectorLabelName: properties.sectorLabelName ?? properties.sectorLabelKey,
                seriesId: this.id,
            };
            itemStylerResult = this.cachedCallWithContext(properties.calloutLine.itemStyler, params) ?? {};
        }
        return {
            length: itemStylerResult.length ?? properties.calloutLine.length,
            strokeWidth: itemStylerResult.strokeWidth ?? properties.calloutLine.strokeWidth,
            color: itemStylerResult.color,
            colors: properties.calloutLine.colors,
        } satisfies RequireOptional<TResult>;
    }

    override getInnerRadius() {
        const { radius } = this;
        const { innerRadiusRatio = 1, innerRadiusOffset = 0 } = this.properties;
        const innerRadius = radius * innerRadiusRatio + innerRadiusOffset;
        if (innerRadius === radius || innerRadius < 0) {
            return 0;
        }
        return innerRadius;
    }

    getOuterRadius() {
        const { outerRadiusRatio, outerRadiusOffset } = this.properties;
        return Math.max(this.radius * outerRadiusRatio + outerRadiusOffset, 0);
    }

    updateRadiusScale(resize: boolean) {
        const newRange = [this.getInnerRadius(), this.getOuterRadius()];
        this.radiusScale.range = newRange;

        if (resize) {
            this.previousRadiusScale.range = newRange;
        }

        const setRadii = (d: PieDonutNodeDatum): PieDonutNodeDatum => ({
            ...d,
            innerRadius: Math.max(this.radiusScale.convert(0), 0),
            outerRadius: Math.max(this.radiusScale.convert(d.radius), 0),
        });

        this.nodeData = this.nodeData.map(setRadii);
        this.phantomNodeData = this.phantomNodeData?.map(setRadii);
    }

    private getTitleTranslationY() {
        const outerRadius = Math.max(0, this.radiusScale.range[1]);
        if (outerRadius === 0) {
            return Number.NaN;
        }
        const spacing = this.properties.title?.spacing ?? 0;
        const titleOffset = 2 + spacing;
        const dy = Math.max(0, -outerRadius);
        return -outerRadius - titleOffset - dy;
    }

    update({ seriesRect }: { seriesRect: BBox }) {
        const { title } = this.properties;

        const newNodeDataDependencies = {
            seriesRectWidth: seriesRect?.width,
            seriesRectHeight: seriesRect?.height,
        };
        const resize = jsonDiff(this.nodeDataDependencies, newNodeDataDependencies) != null;
        if (resize) {
            this._nodeDataDependencies = newNodeDataDependencies;
        }

        this.maybeRefreshNodeData();
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
            title.node.y = Number.isFinite(dy) ? dy : 0;

            const titleBox = title.node.getBBox();
            title.node.visible =
                title.enabled && Number.isFinite(dy) && !this.bboxIntersectsSurroundingSeries(titleBox);
        }

        for (const circle of [this.zerosumInnerRing, this.zerosumOuterRing]) {
            circle.fillOpacity = 0;
            circle.stroke = this.properties.calloutLabel.color;
            circle.strokeWidth = 1;
            circle.strokeOpacity = 1;
        }

        this.updateNodeMidPoint();

        this.updateSelections();
        this.updateNodes(seriesRect);
    }

    private updateTitleNodes() {
        const { oldTitle } = this;
        const { title } = this.properties;

        if (oldTitle !== title) {
            if (oldTitle) {
                oldTitle.node.remove();
            }

            if (title) {
                title.node.textBaseline = 'bottom';
                this.labelGroup?.appendChild(title.node);
            }

            this.oldTitle = title;
        }
    }

    private updateNodeMidPoint() {
        const setMidPoint = (d: PieDonutNodeDatum) => {
            const radius = d.innerRadius + (d.outerRadius - d.innerRadius) / 2;
            d.midPoint = {
                x: d.midCos * Math.max(0, radius),
                y: d.midSin * Math.max(0, radius),
            };
        };
        for (const datum of this.nodeData) {
            setMidPoint(datum);
        }
        if (this.phantomNodeData) {
            for (const datum of this.phantomNodeData) {
                setMidPoint(datum);
            }
        }
    }

    private updateSelections() {
        this.updateGroupSelection();
        this.updateInnerCircleSelection();
        this.updateInnerCircleCutoutSelection();
    }

    private updateGroupSelection() {
        const {
            itemSelection,
            highlightSelection,
            phantomSelection,
            phantomHighlightSelection,
            calloutLabelSelection,
            labelSelection,
            highlightLabelSelection,
            innerLabelsSelection,
        } = this;
        const highlightedNodeData = this.nodeData.map((datum) => ({
            ...datum,
            // Allow mutable sectorFormat, so formatted sector styles can be updated and varied
            // between normal and highlighted cases.
            sectorFormat: { ...datum.sectorFormat },
        }));
        const phantomHighlightedNodeData = this.phantomNodeData?.map((datum) => ({
            ...datum,
            // Allow mutable sectorFormat, so formatted sector styles can be updated and varied
            // between normal and highlighted cases.
            sectorFormat: { ...datum.sectorFormat },
        }));

        const update = (selection: typeof this.itemSelection, nodeData: PieDonutNodeDatum[]) => {
            selection.update(nodeData, undefined, (datum) => this.getDatumId(datum.datumIndex));
            if (this.ctx.animationManager.isSkipped()) {
                selection.cleanup();
            }
        };

        update(itemSelection, this.nodeData);
        update(highlightSelection, highlightedNodeData);
        update(phantomSelection, this.phantomNodeData ?? []);
        update(phantomHighlightSelection, phantomHighlightedNodeData ?? []);

        calloutLabelSelection.update(this.calloutNodeData, (group) => {
            const line = new Line();
            line.tag = DonutNodeTag.CalloutLine;
            line.pointerEvents = PointerEvents.None;
            group.appendChild(line);

            const text = new Text();
            text.tag = DonutNodeTag.CalloutLabel;
            text.pointerEvents = PointerEvents.None;
            group.appendChild(text);
        });

        labelSelection.update(this.nodeData);
        highlightLabelSelection.update(highlightedNodeData);

        innerLabelsSelection.update(this.properties.innerLabels, (node) => {
            node.pointerEvents = PointerEvents.None;
        });
    }

    // Rounded inner corners leave crescents of chart background that `innerCircle.fill` must
    // cover, so the fill extends to where the corner arcs top out.
    private getInnerCircleFillRadius() {
        const innerRadius = this.getInnerRadius();
        const { fill } = this.properties.innerCircle;
        if (innerRadius <= 0 || fill == null || fill === 'transparent') return innerRadius;

        let fillRadius = innerRadius;
        for (const datum of this.nodeData) {
            const { cornerRadius = 0, stroke, strokeWidth = 0 } = datum.sectorFormat;
            if (cornerRadius <= 0) continue;

            // `inset` pulls the sector's painted edges inwards from its radii.
            const inset = Math.max((this.properties.sectorSpacing + (stroke == null ? 0 : strokeWidth)) / 2, 0);
            const paintedInnerRadius = datum.innerRadius > 0 ? datum.innerRadius + inset : 0;
            const paintedOuterRadius = Math.max(datum.outerRadius - inset, 0);
            if (paintedInnerRadius <= 0 || paintedOuterRadius <= paintedInnerRadius) continue;

            // Mirrors the clamping `Sector` applies to its own corner radii: half the radial band,
            // and half the chord between the sector's two inner corners.
            const { startAngle, endAngle } = clockwiseAngles(datum.startAngle, datum.endAngle);
            const sweepAngle = endAngle - startAngle - (2 * inset) / paintedInnerRadius;
            const cornerDistance = sweepAngle > 0 ? 2 * paintedInnerRadius * Math.sin(sweepAngle / 2) : 0;
            const radialLength = paintedOuterRadius - paintedInnerRadius;
            const appliedCornerRadius = Math.floor(Math.min(cornerRadius, cornerDistance / 2, radialLength / 2));

            fillRadius = Math.max(fillRadius, paintedInnerRadius + appliedCornerRadius);
        }
        return Math.min(fillRadius, this.getOuterRadius());
    }

    private updateInnerCircleSelection() {
        const { innerCircle } = this.properties;

        let radius = 0;
        if (this.getInnerRadius() > 0) {
            const antiAliasingPadding = 1;
            radius = Math.ceil(this.getInnerCircleFillRadius() * 2 + antiAliasingPadding);
        }

        const datums = innerCircle ? [{ radius }] : [];
        this.innerCircleSelection.update(datums);
    }

    // The grown circle reaches under the sectors, which a translucent sector would show through;
    // erasing each sector's outline leaves only the crescents and spacing strips filled.
    private updateInnerCircleCutoutSelection() {
        // Mirrors the predicate Group applies to `renderToOffscreenCanvas`: without that isolation
        // the cutout would erase the chart behind the series along with the circle.
        const enabled = this.getInnerCircleFillRadius() > this.getInnerRadius() && canRenderTextOffscreen();
        const datumId = (datum: PieDonutNodeDatum) => this.getDatumId(datum.datumIndex);

        this.innerCircleGroup.renderToOffscreenCanvas = enabled;
        this.innerCircleCutoutSelection.update(enabled ? this.nodeData : [], undefined, datumId);
        if (this.ctx.animationManager.isSkipped()) {
            this.innerCircleCutoutSelection.cleanup();
        }
    }

    private applySectorSpacing(sector: Sector, hasStroke: boolean, strokeWidth: number) {
        const inset = Math.max((this.properties.sectorSpacing + (hasStroke ? strokeWidth : 0)) / 2, 0);
        sector.inset = inset;
        sector.lineJoin = this.properties.sectorSpacing >= 0 || inset > 0 ? 'miter' : 'round';
    }

    private applySelectedOffset(sector: Sector, datumIndex: number) {
        const datumSelectionState = this.ctx.dataSelectionService?.getDataSelectionState(this, datumIndex);
        const { selectedOffset } = this.properties.selection;
        if (!isUnselected(datumSelectionState) && selectedOffset > 0) {
            const midAngle = (sector.endAngle + sector.startAngle) / 2;
            sector.centerX = selectedOffset * Math.cos(midAngle);
            sector.centerY = selectedOffset * Math.sin(midAngle);
        } else {
            sector.centerX = 0;
            sector.centerY = 0;
        }
    }

    private updateNodes(seriesRect: BBox) {
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        const { visible, dataModel, processedData } = this;
        this.backgroundGroup.visible = visible;
        this.contentGroup.visible = visible;

        if (!dataModel || !processedData) return;
        const { legendItemValues } = this.getProcessedDataValues(dataModel, processedData);
        const seriesHighlighted = this.isSeriesHighlighted(highlightedDatum, legendItemValues);

        const drawingMode = this.ctx.chartService.highlight?.drawingMode ?? 'overlay';
        this.highlightGroup.visible = visible && seriesHighlighted;
        this.labelGroup.visible = visible;

        this.innerCircleSelection.each((node, { radius }) => {
            node.setProperties({
                fill: this.properties.innerCircle?.fill,
                opacity: this.properties.innerCircle?.fillOpacity,
                size: radius,
            });
        });

        const innerRadius = this.radiusScale.range[0];
        const outerRadius = this.radiusScale.range[1];

        const fillBBox = this.getShapeFillBBox();

        const animationDisabled = this.ctx.animationManager.isSkipped();
        const updateSectorFn = (
            sector: Sector,
            datum: PieDonutNodeDatum,
            _index: number,
            isDatumHighlighted: boolean,
            mode: AgDrawingMode
        ) => {
            const format = this.getItemStyle(datum, isDatumHighlighted, true, undefined, legendItemValues);

            datum.sectorFormat.fill = format.fill;
            datum.sectorFormat.stroke = format.stroke;

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

            const fillParams = this.getFillParams(format.fill, innerRadius, outerRadius);
            sector.setStyleProperties(format, fillBBox, fillParams);

            sector.drawingMode = mode;
            sector.cornerRadius = format.cornerRadius;
            sector.fillShadow = this.properties.shadow;
            this.applySectorSpacing(sector, format.stroke != null, format.strokeWidth);
            this.applySelectedOffset(sector, datum.datumIndex);
        };

        this.itemSelection.each((node, datum, index) => updateSectorFn(node, datum, index, false, 'overlay'));
        this.phantomSelection.each((node, datum, index) => updateSectorFn(node, datum, index, false, 'overlay'));

        this.innerCircleCutoutSelection.each((sector, datum) => {
            // Resolved exactly as the real sector's is, so the erased outline matches what is drawn.
            const format = this.getItemStyle(datum, false, true, undefined, legendItemValues);

            if (animationDisabled) {
                sector.startAngle = datum.startAngle;
                sector.endAngle = datum.endAngle;
                sector.innerRadius = datum.innerRadius;
                sector.outerRadius = datum.outerRadius;
            }

            sector.fill = undefined;
            sector.stroke = undefined;
            sector.strokeWidth = 0;
            sector.fillShadow = undefined;
            sector.drawingMode = 'cutout';
            sector.cornerRadius = format.cornerRadius;

            this.applySectorSpacing(sector, format.stroke != null, format.strokeWidth);
            this.applySelectedOffset(sector, datum.datumIndex);
        });

        this.highlightSelection.each((node, datum, index) => {
            updateSectorFn(node, datum, index, true, drawingMode);

            node.visible = datum.datumIndex === highlightedDatum?.datumIndex;
        });
        this.phantomHighlightSelection.each((node, datum, index) => {
            updateSectorFn(node, datum, index, true, drawingMode);

            node.visible = datum.datumIndex === highlightedDatum?.datumIndex;
        });

        this.updateCalloutLineNodes();
        this.updateCalloutLabelNodes(seriesRect);
        this.updateSectorLabelNodes();
        this.updateInnerLabelNodes();
        this.updateZerosumRings();

        this.animationState.transition('update');
    }

    updateCalloutLineNodes() {
        const { strokes } = this.properties;
        const { offset } = this.properties.calloutLabel;
        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
        const seriesHighlighted = this.isSeriesHighlighted(highlightedDatum);

        for (const line of this.calloutLabelSelection.selectByTag<Line>(DonutNodeTag.CalloutLine)) {
            const datum = line.unsafeClosestDatum() as PieDonutNodeDatum;
            const isDatumHighlighted =
                seriesHighlighted && this.isItemHighlighted(highlightedDatum, datum.datumIndex) === true;
            const { length: calloutLength, strokeWidth, color, colors } = this.getCalloutLineStyle(datum, false);
            const calloutStrokeWidth = strokeWidth;
            const calloutColors: string[] = isStringFillArray(colors) ? colors : strokes;
            const { calloutLabel: label, outerRadius, datumIndex } = datum;

            if (label?.text && !label.hidden && outerRadius !== 0) {
                line.visible = true;
                line.strokeWidth = calloutStrokeWidth;
                line.stroke = color ?? calloutColors[datumIndex % calloutColors.length];
                line.strokeOpacity = this.getHighlightStyle(isDatumHighlighted, datum.datumIndex).opacity ?? 1;
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
        }
    }

    private getLabelOverflow(box: BBox, seriesRect: BBox) {
        const seriesLeft = -this.centerX;
        const seriesRight = seriesLeft + seriesRect.width;
        const seriesTop = -this.centerY;
        const seriesBottom = seriesTop + seriesRect.height;
        const errPx = 1; // Prevents errors related to floating point calculations
        let maxWidth = box.width;
        if (box.x + errPx < seriesLeft) {
            maxWidth = (box.x + box.width - seriesLeft) / box.width;
        } else if (box.x + box.width - errPx > seriesRight) {
            maxWidth = (seriesRight - box.x) / box.width;
        }

        const hasVerticalOverflow = box.y + errPx < seriesTop || box.y + box.height - errPx > seriesBottom;
        const hasSurroundingSeriesOverflow = this.bboxIntersectsSurroundingSeries(box);
        return { maxWidth, hasVerticalOverflow, hasSurroundingSeriesOverflow };
    }

    private bboxIntersectsSurroundingSeries(box: BBox) {
        const { surroundingRadius } = this;
        if (surroundingRadius == null) {
            return false;
        }
        const corners = [
            { x: box.x, y: box.y },
            { x: box.x + box.width, y: box.y },
            { x: box.x + box.width, y: box.y + box.height },
            { x: box.x, y: box.y + box.height },
        ];
        const sur2 = surroundingRadius ** 2;
        return corners.some((corner) => corner.x ** 2 + corner.y ** 2 > sur2);
    }

    private getCalloutLabelBBox(datum: Has<'calloutLabel', PieDonutNodeDatum>): BBox {
        const { calloutLabel } = this.properties;
        const label = datum.calloutLabel;

        const style = this.getLabelStyle(datum, calloutLabel, 'calloutLabel');
        const padding = expandLabelPadding(style);
        const calloutLength = this.getCalloutLineStyle(datum, false).length;

        const labelRadius = datum.outerRadius + calloutLength + calloutLabel.offset;
        const x = datum.midCos * labelRadius;
        const y = datum.midSin * labelRadius + label.collisionOffsetY;

        const textAlign = label.collisionTextAlign ?? label.textAlign;
        const textBaseline = label.textBaseline;
        return Text.measureBBox(label.text, x, y, {
            font: calloutLabel,
            textAlign,
            textBaseline,
        }).grow(padding);
    }

    private computeCalloutLabelCollisionOffsets() {
        const { radiusScale } = this;
        const { minSpacing } = this.properties.calloutLabel;
        const innerRadius = radiusScale.convert(0);

        const shouldSkip = (datum: PieDonutNodeDatum) => {
            const label = datum.calloutLabel;
            return !label || datum.outerRadius === 0;
        };

        const fullData = this.calloutNodeData;
        const data = fullData.filter((t): t is Has<'calloutLabel', PieDonutNodeDatum> => !shouldSkip(t));
        for (const datum of data) {
            const label = datum.calloutLabel;
            if (label == null) continue;

            label.hidden = false;
            label.collisionTextAlign = undefined;
            label.collisionOffsetY = 0;
        }

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

        const avoidNeighbourYCollision = (
            label: (typeof data)[number],
            next: (typeof data)[number],
            direction: 'to-top' | 'to-bottom'
        ) => {
            const box = this.getCalloutLabelBBox(label).grow(minSpacing / 2);
            const other = this.getCalloutLabelBBox(next).grow(minSpacing / 2);
            // The full collision is not detected, because sometimes
            // the next label can appear behind the label with offset
            const collidesOrBehind =
                box.x < other.x + other.width &&
                box.x + box.width > other.x &&
                (direction === 'to-top' ? box.y < other.y + other.height : box.y + box.height > other.y);
            if (collidesOrBehind) {
                next.calloutLabel.collisionOffsetY =
                    direction === 'to-top' ? box.y - other.y - other.height : box.y + box.height - other.y;
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

        const sectorObstacles = fullData.map((datum) => {
            const { startAngle, endAngle, outerRadius } = datum;
            const sector = { startAngle, endAngle, innerRadius, outerRadius };
            return { box: sectorBox(sector), ref: sector };
        });

        const avoidXCollisions = (labels: typeof data) => {
            const labelsCollideLabelsByY = data.some((datum) => datum.calloutLabel.collisionOffsetY !== 0);

            const boxes = labels.map((label) => this.getCalloutLabelBBox(label));
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

            const labelsCollideSectors = anyOverlap(boxes, sectorObstacles, boxOverlapsSector);

            if (!labelsCollideLabelsByX && !labelsCollideLabelsByY && !labelsCollideSectors) return;

            for (const d of labels) {
                if (d.calloutLabel.textAlign !== 'center') continue;
                const label = d.calloutLabel;
                if (d.midCos < 0) {
                    label.collisionTextAlign = 'right';
                } else if (d.midCos > 0) {
                    label.collisionTextAlign = 'left';
                } else {
                    label.collisionTextAlign = 'center';
                }
            }
        };

        avoidYCollisions(leftLabels);
        avoidYCollisions(rightLabels);
        avoidXCollisions(topLabels);
        avoidXCollisions(bottomLabels);
    }

    private getLabelStyle(
        datum: PieDonutNodeDatum,
        label: Label<AgDonutSeriesLabelFormatterParams>,
        labelPath: string,
        isHighlight = false
    ) {
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        return getLabelStyles(this, datum, this.properties, label, isHighlight, activeHighlight, [
            'series',
            `${this.declarationOrder}`,
            labelPath,
        ]);
    }

    private updateCalloutLabelNodes(seriesRect: BBox) {
        const { radiusScale } = this;
        const { calloutLabel } = this.properties;

        const tempTextNode = new Text();
        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
        const seriesHighlighted = this.isSeriesHighlighted(highlightedDatum);

        for (const text of this.calloutLabelSelection.selectByTag<Text>(DonutNodeTag.CalloutLabel)) {
            const datum: PieDonutNodeDatum = text.unsafeClosestDatum();
            const label = datum.calloutLabel;
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);

            if (!label?.text || outerRadius === 0 || label.hidden) {
                text.visible = false;
                continue;
            }

            const isDatumHighlighted =
                seriesHighlighted && this.isItemHighlighted(highlightedDatum, datum.datumIndex) === true;

            const style = this.getLabelStyle(datum, calloutLabel, 'calloutLabel', isDatumHighlighted);
            const calloutLength = this.getCalloutLineStyle(datum, false).length;

            const labelRadius = outerRadius + calloutLength + calloutLabel.offset;
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
            tempTextNode.setFont(style);
            tempTextNode.setAlign(align);
            tempTextNode.setBoxing(style);
            const box = tempTextNode.getBBox();

            let displayText = label.text;
            let visible = true;
            if (calloutLabel.avoidCollisions) {
                const { maxWidth, hasVerticalOverflow } = this.getLabelOverflow(box, seriesRect);
                if (box.width > maxWidth) {
                    const options: WrapOptions = {
                        font: this.properties.calloutLabel,
                        textWrap: 'on-space',
                        overflow: 'hide',
                        maxWidth,
                    };
                    displayText = wrapTextOrSegments(label.text, options);
                }
                visible = !hasVerticalOverflow;
            }

            text.text = displayText;
            text.x = x;
            text.y = y;
            text.setFont(style);
            text.setAlign(align);
            text.setBoxing(style);
            text.fill = style.color;
            text.fillOpacity = this.getHighlightStyle(isDatumHighlighted, datum.datumIndex).opacity ?? 1;
            text.visible = visible;
        }
    }

    override computeLabelsBBox(options: { hideWhenNecessary: boolean }, seriesRect: BBox) {
        const { calloutLabel } = this.properties;
        const { offset, maxCollisionOffset, minSpacing } = calloutLabel;

        if (!calloutLabel.avoidCollisions) {
            return null;
        }

        this.maybeRefreshNodeData();

        this.updateRadiusScale(false);
        this.computeCalloutLabelCollisionOffsets();

        const textBoxes: BBox[] = [];
        const text = new Text();

        let titleBox: BBox | undefined = undefined;
        const { title } = this.properties;
        if (title?.text && title.enabled) {
            const dy = this.getTitleTranslationY();
            if (Number.isFinite(dy)) {
                text.text = title.text;
                text.x = 0;
                text.y = dy;
                text.setFont(title);
                text.setAlign({
                    textBaseline: 'bottom',
                    textAlign: 'center',
                });
                titleBox = text.getBBox();
                textBoxes.push(titleBox);
            }
        }

        for (const datum of this.calloutNodeData) {
            const label = datum.calloutLabel;
            if (!label || datum.outerRadius === 0) {
                continue;
            }

            const style = this.getLabelStyle(datum, calloutLabel, 'calloutLabel');
            const calloutLength = this.getCalloutLineStyle(datum, false).length;
            const labelRadius = datum.outerRadius + calloutLength + offset;
            const x = datum.midCos * labelRadius;
            const y = datum.midSin * labelRadius + label.collisionOffsetY;
            text.text = label.text;
            text.x = x;
            text.y = y;
            text.setFont(style);
            text.setAlign({
                textAlign: label.collisionTextAlign ?? label.textAlign,
                textBaseline: label.textBaseline,
            });
            text.setBoxing(style);
            const box = text.getBBox();
            label.box = box;

            // Hide labels that where pushed too far by the collision avoidance algorithm
            if (Math.abs(label.collisionOffsetY) > maxCollisionOffset) {
                label.hidden = true;
                continue;
            }

            // Hide labels intersecting or above the title
            if (titleBox) {
                const seriesTop = -this.centerY;
                const titleCleanArea = new BBox(
                    titleBox.x - minSpacing,
                    seriesTop,
                    titleBox.width + 2 * minSpacing,
                    titleBox.y + titleBox.height + minSpacing - seriesTop
                );
                if (box.collidesBBox(titleCleanArea)) {
                    label.hidden = true;
                    continue;
                }
            }

            if (options.hideWhenNecessary) {
                const { maxWidth, hasVerticalOverflow, hasSurroundingSeriesOverflow } = this.getLabelOverflow(
                    box,
                    seriesRect
                );
                const isTooShort = box.width > maxWidth;

                if (hasVerticalOverflow || isTooShort || hasSurroundingSeriesOverflow) {
                    label.hidden = true;
                    continue;
                }
            }

            label.hidden = false;
            textBoxes.push(box);
        }
        if (textBoxes.length === 0) {
            return null;
        }
        return BBox.merge(textBoxes);
    }

    private updateSectorLabelNodes() {
        const { properties } = this;
        const { positionOffset, positionRatio } = this.properties.sectorLabel;
        // Fitting only engages when the user opts into wrapping/truncation; otherwise the sector text renders in
        // full (and hides if it overruns the wedge, as before), so the default path stays untouched.
        const sectorFit = resolveLabelFit(this.properties.sectorLabel, false);

        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
        const seriesHighlighted = this.isSeriesHighlighted(highlightedDatum);

        const innerRadius = this.radiusScale.convert(0);
        const shouldPutTextInCenter =
            innerRadius <= 0 && // is donut?
            this.ctx.legendManager?.getData(this.id)?.filter((d) => d.enabled).length === 1; // single visible sector?

        const align = { textAlign: 'center', textBaseline: 'middle' } as const;
        const updateSelection = (selection: Selection<PieDonutNodeDatum, Text<PieDonutNodeDatum>>) =>
            selection.each((text, datum) => {
                const { outerRadius, startAngle, endAngle } = datum;

                const isDatumHighlighted =
                    seriesHighlighted && this.isItemHighlighted(highlightedDatum, datum.datumIndex) === true;

                let isTextVisible = false;
                if (datum.sectorLabel && outerRadius !== 0) {
                    const style = this.getLabelStyle(datum, properties.sectorLabel, 'sectorLabel', isDatumHighlighted);
                    const labelRadius =
                        innerRadius * (1 - positionRatio) + outerRadius * positionRatio + positionOffset;
                    const sectorBounds = { startAngle, endAngle, innerRadius, outerRadius };

                    text.fill = style.color;
                    text.fillOpacity = this.getHighlightStyle(isDatumHighlighted, datum.datumIndex).opacity ?? 1;
                    if (sectorFit == null) {
                        text.x = shouldPutTextInCenter ? 0 : datum.midCos * labelRadius;
                        text.y = shouldPutTextInCenter ? 0 : datum.midSin * labelRadius;
                        text.text = datum.sectorLabel.text;
                    } else if (shouldPutTextInCenter) {
                        // A centred single-sector label fits the square inscribed in the pie, like the inner label.
                        text.x = 0;
                        text.y = 0;
                        const holeExtent = outerRadius * Math.SQRT2;
                        const container = { width: holeExtent, height: holeExtent };
                        text.text = fitLabelToContainer(datum.sectorLabel.text, sectorFit, style, container);
                    } else {
                        const anchor = { x: datum.midCos * labelRadius, y: datum.midSin * labelRadius };
                        const rect = fitSectorLabelRect(anchor, sectorBounds, cachedTextMeasurer(style).lineHeight());
                        text.x = rect.centerX;
                        text.y = rect.centerY;
                        const container = { width: rect.width, height: rect.height };
                        text.text = fitLabelToContainer(datum.sectorLabel.text, sectorFit, style, container);
                    }
                    text.setFont(style);
                    text.setAlign(align);
                    text.setBoxing(style);

                    const bbox = text.getBBox();
                    const corners = [
                        [bbox.x, bbox.y],
                        [bbox.x + bbox.width, bbox.y],
                        [bbox.x + bbox.width, bbox.y + bbox.height],
                        [bbox.x, bbox.y + bbox.height],
                    ];
                    if (corners.every(([x, y]) => isPointInSector(x, y, sectorBounds))) {
                        isTextVisible = true;
                    }
                }
                text.visible = isTextVisible;
            });

        updateSelection(this.labelSelection);
        updateSelection(this.highlightLabelSelection);
    }

    private updateInnerLabelNodes() {
        const textBBoxes: BBox[] = [];
        const margins: number[] = [];
        const innerRadius = this.getInnerRadius();
        // The inner labels fit the square inscribed in the hole circle (diagonal 2·r ⇒ side r·√2).
        const holeExtent = (innerRadius > 0 ? innerRadius : this.getOuterRadius()) * Math.SQRT2;
        const holeBox = { width: holeExtent, height: holeExtent };
        this.innerLabelsSelection.each((text, datum) => {
            const { fontStyle, fontWeight, fontSize, fontFamily, color } = datum;
            text.fontStyle = fontStyle;
            text.fontWeight = fontWeight;
            text.fontSize = fontSize;
            text.fontFamily = fontFamily;
            text.text = fitLabelToContainer(datum.text, resolveLabelFit(datum, false), datum, holeBox);
            text.x = 0;
            text.y = 0;
            text.fill = color;
            text.textAlign = 'center';
            textBBoxes.push(text.getBBox());
            margins.push(datum.spacing);
        });
        const getMarginTop = (index: number) => (index === 0 ? 0 : margins[index]);
        const getMarginBottom = (index: number) => (index === margins.length - 1 ? 0 : margins[index]);
        const totalWidth = textBBoxes.reduce((max, bbox) => Math.max(max, bbox.width), 0);
        const totalHeight = textBBoxes.reduce(
            (sum, bbox, i) => sum + bbox.height + getMarginTop(i) + getMarginBottom(i),
            0
        );
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
            text.visible = labelsVisible;
            text.y = textBottoms[index];
        });
    }

    private updateZerosumRings() {
        // The Circle `size` is the diameter
        this.zerosumOuterRing.size = this.getOuterRadius() * 2;
        this.zerosumInnerRing.size = this.getInnerRadius() * 2;
    }

    override createNodeParams(datum: PieDonutNodeDatum) {
        return {
            ...super.createNodeParams(datum),
            angleKey: this.properties.angleKey,
            radiusKey: this.properties.radiusKey,
            calloutLabelKey: this.properties.calloutLabelKey,
            sectorLabelKey: this.properties.sectorLabelKey,
        };
    }

    protected override pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        return pickByMatchingAngle(this, point);
    }

    protected override pickNodesInBBoxPredicate() {
        return pickSectorsInBBoxPredicate(this);
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const {
            id: seriesId,
            dataModel,
            processedData,
            properties,
            ctx: { formatManager },
        } = this;
        const {
            legendItemKey,
            calloutLabelKey,
            calloutLabelName,
            sectorLabelKey,
            sectorLabelName,
            angleKey,
            angleName,
            radiusKey,
            radiusName,
            tooltip,
        } = properties;
        const title = this.properties.title.node.getPlainText();

        if (!dataModel || !processedData) return;

        const datum = processedData.dataSources.get(this.id)?.data?.[datumIndex];
        const processedDataValues = this.getProcessedDataValues(dataModel, processedData);
        const { angleRawValues } = processedDataValues;
        const angleRawValue = angleRawValues[datumIndex];

        const { calloutLabel } = this.properties;
        const calloutLabelFit = resolveLabelFit(calloutLabel, false);
        const labelValues = this.getLabelContent(datumIndex, datum, processedDataValues, calloutLabelFit);
        const label = labelValues.legendItem ?? labelValues.callout ?? labelValues.sector ?? angleName;

        const domain = extractDomain(dataModel.getDomain(this, `angleRaw`, 'value', processedData));
        const angleContent =
            formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value: angleRawValue,
                datum,
                seriesId,
                legendItemName: undefined,
                key: angleKey,
                source: 'tooltip',
                property: 'angle',
                domain,
                boundSeries: this.getFormatterContext('angle'),
                fractionDigits: undefined,
                visibleDomain: undefined,
            }) ?? formatValue(angleRawValue, 3);

        return this.formatTooltipWithContext(
            tooltip,
            {
                title,
                symbol: this.legendItemSymbol(datumIndex),
                data: [{ label: toPlainText(label), fallbackLabel: angleKey, value: angleContent }],
            },
            {
                seriesId,
                datum,
                title: angleName,
                legendItemKey,
                calloutLabelKey,
                calloutLabelName,
                sectorLabelKey,
                sectorLabelName,
                angleKey,
                angleName,
                radiusKey,
                radiusName,
                ...this.getItemStyle({ datum, datumIndex }, false, false),
            }
        );
    }

    private legendItemSymbol(datumIndex: number): LegendSymbolOptions {
        const datum = this.processedData?.dataSources.get(this.id)?.data?.[datumIndex];
        const sectorFormat = this.getItemStyle({ datum, datumIndex }, false, false);
        const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = this.properties;

        let { fill } = sectorFormat;
        const { stroke } = sectorFormat;
        if (isGradientFill(fill)) {
            fill = { ...fill, gradient: 'linear', rotation: 0, reverse: false };
        }

        return {
            marker: {
                fill,
                stroke,
                fillOpacity,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
            },
        };
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const {
            visible,
            processedData,
            dataModel,
            id: seriesId,
            ctx: { legendManager },
        } = this;

        if (!dataModel || !processedData || legendType !== 'category') {
            return [];
        }

        const { angleKey, calloutLabelKey, sectorLabelKey, legendItemKey, showInLegend } = this.properties;

        if (
            !legendItemKey &&
            (!calloutLabelKey || calloutLabelKey === angleKey) &&
            (!sectorLabelKey || sectorLabelKey === angleKey)
        ) {
            return [];
        }

        const processedDataValues = this.getProcessedDataValues(dataModel, processedData);
        const { angleRawValues } = processedDataValues;

        const titleText = this.properties.title?.showInLegend && this.properties.title.text;
        const legendData: CategoryLegendDatum[] = [];

        const hideZeros = this.properties.hideZeroValueSectorsInLegend;
        const rawData = processedData.dataSources.get(this.id)?.data;
        const invalidData = processedData.invalidData?.get(this.id);
        const { calloutLabel } = this.properties;
        const calloutLabelFit = resolveLabelFit(calloutLabel, false);
        for (let datumIndex = 0; datumIndex < processedData.input.count; datumIndex++) {
            const datum = rawData?.[datumIndex] as any;
            const angleRawValue = angleRawValues[datumIndex];

            if (invalidData?.[datumIndex] === true || (hideZeros && angleRawValue === 0)) {
                continue;
            }

            const labelParts = [];
            if (titleText) {
                labelParts.push(titleText);
            }
            const labels = this.getLabelContent(datumIndex, datum, processedDataValues, calloutLabelFit);

            if (legendItemKey && labels.legendItem !== undefined) {
                labelParts.push(labels.legendItem);
            } else if (calloutLabelKey && calloutLabelKey !== angleKey && labels.callout !== undefined) {
                labelParts.push(labels.callout);
            } else if (sectorLabelKey && sectorLabelKey !== angleKey && labels.sector !== undefined) {
                labelParts.push(labels.sector);
            }

            if (labelParts.length === 0) continue;

            legendData.push({
                legendType: 'category',
                id: seriesId,
                datum,
                itemId: datumIndex,
                seriesId,
                hideToggleOtherSeries: true,
                enabled: visible && (legendManager?.getItemEnabled({ seriesId, itemId: datumIndex }) ?? true),
                label: {
                    text: labelParts.map((s) => toPlainText(s)).join(' - '),
                },
                symbol: this.legendItemSymbol(datumIndex),
                legendItemName: legendItemKey == null ? undefined : datum[legendItemKey],
                hideInLegend: !showInLegend,
            });
        }

        return legendData;
    }

    // Used for grid
    setLegendState(enabledItems: boolean[]) {
        const {
            id: seriesId,
            ctx: { legendManager, eventsHub },
        } = this;
        for (const [itemId, enabled] of enabledItems.entries()) {
            legendManager?.toggleItem(enabled, seriesId, itemId);
        }
        eventsHub.emit('chart:request-update', { type: ChartUpdateType.SERIES_UPDATE });
    }

    override animateEmptyUpdateReady(_data?: PolarAnimationData) {
        const { animationManager } = this.ctx;

        const fns = preparePieSeriesAnimationFunctions(
            true,
            this.properties.rotation,
            this.radiusScale,
            this.previousRadiusScale
        );
        fromToMotion(
            this.id,
            'nodes',
            animationManager,
            [this.itemSelection, this.highlightSelection, this.phantomSelection, this.phantomHighlightSelection],
            fns.nodes,
            (node) => this.getDatumId(node.unsafeDatum.datumIndex)
        );
        fromToMotion(
            this.id,
            'innerCircleCutout',
            animationManager,
            [this.innerCircleCutoutSelection],
            prepareInnerCircleCutoutAnimationFunctions(fns),
            (node) => this.getDatumId(node.unsafeDatum.datumIndex)
        );
        fromToMotion(this.id, `innerCircle`, animationManager, [this.innerCircleSelection], fns.innerCircle);

        seriesLabelFadeInAnimation(this, 'callout', animationManager, this.calloutLabelSelection);
        seriesLabelFadeInAnimation(this, 'sector', animationManager, this.labelSelection, this.highlightLabelSelection);
        seriesLabelFadeInAnimation(this, 'inner', animationManager, this.innerLabelsSelection);

        this.previousRadiusScale.range = this.radiusScale.range;
    }

    override animateWaitingUpdateReady() {
        const {
            itemSelection,
            highlightSelection,
            phantomSelection,
            phantomHighlightSelection,
            processedData,
            radiusScale,
            previousRadiusScale,
        } = this;
        const { animationManager } = this.ctx;
        const dataDiff = processedData?.reduced?.diff?.[this.id];

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        const supportedDiff = (dataDiff?.moved.size ?? 0) === 0;
        const hasKeys = (processedData?.defs.keys.length ?? 0) > 0;
        const hasUniqueKeys = processedData?.reduced?.animationValidation?.uniqueKeys ?? true;
        if (!supportedDiff || !hasKeys || !hasUniqueKeys) {
            this.ctx.animationManager.skipCurrentBatch();
        }

        const noVisibleData = !this.nodeData.some((n) => n.enabled);
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
            [itemSelection, highlightSelection, phantomSelection, phantomHighlightSelection],
            fns.nodes,
            (node) => this.getDatumId(node.unsafeDatum.datumIndex),
            dataDiff
        );
        fromToMotion(
            this.id,
            'innerCircleCutout',
            animationManager,
            [this.innerCircleCutoutSelection],
            prepareInnerCircleCutoutAnimationFunctions(fns),
            (node) => this.getDatumId(node.unsafeDatum.datumIndex),
            dataDiff
        );
        fromToMotion(this.id, `innerCircle`, animationManager, [this.innerCircleSelection], fns.innerCircle);

        seriesLabelFadeInAnimation(this, 'callout', this.ctx.animationManager, this.calloutLabelSelection);
        seriesLabelFadeInAnimation(
            this,
            'sector',
            this.ctx.animationManager,
            this.labelSelection,
            this.highlightLabelSelection
        );

        if (this.noVisibleData !== noVisibleData) {
            this.noVisibleData = noVisibleData;
            seriesLabelFadeInAnimation(this, 'inner', this.ctx.animationManager, this.innerLabelsSelection);
        }

        this.previousRadiusScale.range = this.radiusScale.range;
    }

    override animateClearingUpdateEmpty() {
        const {
            itemSelection,
            highlightSelection,
            phantomSelection,
            phantomHighlightSelection,
            radiusScale,
            previousRadiusScale,
        } = this;
        const { animationManager } = this.ctx;

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
            [itemSelection, highlightSelection, phantomSelection, phantomHighlightSelection],
            fns.nodes,
            (node) => this.getDatumId(node.unsafeDatum.datumIndex)
        );
        fromToMotion(
            this.id,
            'innerCircleCutout',
            animationManager,
            [this.innerCircleCutoutSelection],
            prepareInnerCircleCutoutAnimationFunctions(fns),
            (node) => this.getDatumId(node.unsafeDatum.datumIndex)
        );
        fromToMotion(this.id, `innerCircle`, animationManager, [this.innerCircleSelection], fns.innerCircle);

        seriesLabelFadeOutAnimation(this, 'callout', this.ctx.animationManager, this.calloutLabelSelection);
        seriesLabelFadeOutAnimation(
            this,
            'sector',
            this.ctx.animationManager,
            this.labelSelection,
            this.highlightLabelSelection
        );
        seriesLabelFadeOutAnimation(this, 'inner', this.ctx.animationManager, this.innerLabelsSelection);

        this.previousRadiusScale.range = this.radiusScale.range;
    }

    getDatumId(datumIndex: number) {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) {
            return `${datumIndex}`;
        }

        const { calloutLabelKey, sectorLabelKey, legendItemKey } = this.properties;

        if (!processedData.reduced?.animationValidation?.uniqueKeys) {
            return `${datumIndex}`;
        }

        if (legendItemKey) {
            const legendItemKeys = dataModel.resolveKeysById(this, 'legendItemKey', processedData);
            return createDatumId(legendItemKeys[datumIndex]);
        } else if (calloutLabelKey) {
            const calloutLabelKeys = dataModel.resolveKeysById(this, 'calloutLabelKey', processedData);
            return createDatumId(calloutLabelKeys[datumIndex]);
        } else if (sectorLabelKey) {
            const sectorLabelKeys = dataModel.resolveKeysById(this, 'sectorLabelKey', processedData);
            return createDatumId(sectorLabelKeys[datumIndex]);
        }

        return `${datumIndex}`;
    }

    protected override hasItemStylers(): boolean {
        return !(
            !this.properties.selection.enabled &&
            this.properties.itemStyler == null &&
            this.properties.calloutLabel.itemStyler == null &&
            this.properties.sectorLabel.itemStyler == null &&
            this.properties.innerLabels.every((innerLabel) => innerLabel.itemStyler == null)
        );
    }
}
