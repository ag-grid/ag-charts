import type {
    AgErrorBoundSeriesTooltipRendererParams,
    AgSeriesMarkerStyle,
    FillOptions,
    LineDashOptions,
    StrokeOptions,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { ColorScale } from '../../../scale/colorScale';
import { LinearScale } from '../../../scale/linearScale';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import type { PlacedLabel } from '../../../scene/util/labelPlacement';
import { extent } from '../../../util/array';
import { findRangeExtent } from '../../../util/number';
import { mergeDefaults } from '../../../util/object';
import { CachedTextMeasurerPool } from '../../../util/textMeasurer';
import type { RequireOptional } from '../../../util/types';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { fixNumericExtent } from '../../data/dataModel';
import { createDatumId, valueProperty } from '../../data/processors';
import type { CategoryLegendDatum } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { Marker } from '../../marker/marker';
import { type TooltipContent, type TooltipContentDataRow } from '../../tooltip/tooltip';
import type { PickFocusInputs, SeriesNodeEventTypes } from '../series';
import { SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { type BubbleNodeDatum, BubbleSeriesProperties } from './bubbleSeriesProperties';
import type { CartesianAnimationData } from './cartesianSeries';
import {
    CartesianSeries,
    CartesianSeriesNodeEvent,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { computeMarkerFocusBounds, markerScaleInAnimation, resetMarkerFn } from './markerUtil';

type BubbleAnimationData = CartesianAnimationData<Group, BubbleNodeDatum>;

class BubbleSeriesNodeEvent<TEvent extends string = SeriesNodeEventTypes> extends CartesianSeriesNodeEvent<TEvent> {
    readonly sizeKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: BubbleNodeDatum, series: BubbleSeries) {
        super(type, nativeEvent, datum, series);
        this.sizeKey = series.properties.sizeKey;
    }
}

export class BubbleSeries extends CartesianSeries<Group, BubbleSeriesProperties, BubbleNodeDatum> {
    static readonly className = 'BubbleSeries';
    static readonly type = 'bubble' as const;

    protected override readonly NodeEvent = BubbleSeriesNodeEvent;

    protected override clipFocusBox = false;

    override properties = new BubbleSeriesProperties();

    private readonly sizeScale = new LinearScale();

    private readonly colorScale = new ColorScale();

    override get pickModeAxis() {
        return 'main-category' as const;
    }

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            pickModes: [
                SeriesNodePickMode.AXIS_ALIGNED,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            pathsPerSeries: [],
            hasMarkers: true,
            markerSelectionGarbageCollection: false,
            animationResetFns: {
                label: resetLabelFn,
                marker: resetMarkerFn,
            },
            usesPlacedLabels: true,
        });
    }

    override async processData(dataController: DataController) {
        if (!this.properties.isValid() || this.data == null || !this.visible) return;

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const colorScaleType = this.colorScale.type;
        const sizeScaleType = this.sizeScale.type;
        const {
            xKey,
            yKey,
            sizeKey,
            xFilterKey,
            yFilterKey,
            sizeFilterKey,
            labelKey,
            colorDomain,
            colorRange,
            colorKey,
            marker,
        } = this.properties;
        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                valueProperty(xKey, xScaleType, { id: `xValue` }),
                valueProperty(yKey, yScaleType, { id: `yValue` }),
                ...(xFilterKey != null ? [valueProperty(xFilterKey, xScaleType, { id: `xFilterValue` })] : []),
                ...(yFilterKey != null ? [valueProperty(yFilterKey, yScaleType, { id: `yFilterValue` })] : []),
                ...(sizeFilterKey != null
                    ? [valueProperty(sizeFilterKey, sizeScaleType, { id: `sizeFilterValue` })]
                    : []),
                valueProperty(sizeKey, sizeScaleType, { id: `sizeValue` }),
                ...(colorKey ? [valueProperty(colorKey, colorScaleType, { id: `colorValue` })] : []),
                ...(labelKey ? [valueProperty(labelKey, 'band', { id: `labelValue` })] : []),
            ],
        });

        const sizeKeyIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`);
        const processedSize = processedData.domain.values[sizeKeyIdx] ?? [];
        this.sizeScale.domain = marker.domain ? marker.domain : processedSize;

        if (colorKey) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, `colorValue`);
            this.colorScale.domain = colorDomain ?? processedData.domain.values[colorKeyIdx] ?? [];
            this.colorScale.range = colorRange;
            this.colorScale.update();
        }

        this.animationState.transition('updateData');
    }

    override xCoordinateRange(xValue: any, index: number, pixelSize: number): [number, number] {
        const { properties, sizeScale } = this;
        const { size, sizeKey } = properties;
        const x = this.axes[ChartAxisDirection.X]!.scale.convert(xValue);
        const sizeValues =
            sizeKey != null ? this.dataModel!.resolveColumnById(this, `sizeValue`, this.processedData!) : undefined;
        const sizeValue = sizeValues != null ? sizeScale.convert(sizeValues[index]) : size;
        const r = 0.5 * sizeValue * pixelSize;
        return [x - r, x + r];
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        const id = direction === ChartAxisDirection.X ? `xValue` : `yValue`;
        const dataDef = dataModel.resolveProcessedDataDefById(this, id);
        const domain = dataModel.getDomain(this, id, 'value', processedData);
        if (dataDef?.def.type === 'value' && dataDef?.def.valueType === 'category') {
            return domain;
        }
        return fixNumericExtent(extent(domain));
    }

    override getSeriesRange(_direction: ChartAxisDirection, [r0, r1]: [any, any]): [number, number] {
        const { dataModel, processedData, sizeScale } = this;
        if (!dataModel || !processedData) return [NaN, NaN];

        const xScale = this.axes[ChartAxisDirection.X]!.scale;
        const xValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, `yValue`, processedData);
        const sizeValues = dataModel.resolveColumnById(this, `sizeValue`, processedData);
        const rScale = 0.5 * Math.abs(r1 - r0) * (findRangeExtent(xScale.range) / findRangeExtent(xScale.domain));

        let yMin = Infinity;
        let yMax = -Infinity;
        xValues.forEach((xValue, i) => {
            const x = xScale.convert(xValue);
            const r = rScale * sizeScale.convert(sizeValues[i]);
            if (x + r >= r0 && x - r <= r1) {
                const y = yValues[i];
                yMin = Math.min(yMin, y);
                yMax = Math.max(yMax, y);
            }
        });

        if (yMin > yMax) return [NaN, NaN];

        return [yMin, yMax];
    }

    override createNodeData() {
        const { axes, dataModel, processedData, colorScale, sizeScale, visible } = this;
        const {
            xKey,
            yKey,
            sizeKey,
            xFilterKey,
            yFilterKey,
            sizeFilterKey,
            labelKey,
            xName,
            yName,
            sizeName,
            labelName,
            label,
            colorKey,
            marker,
        } = this.properties;
        const { placement } = label;
        const anchor = Marker.anchor(marker.shape);

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(dataModel && processedData && visible && xAxis && yAxis)) {
            return;
        }

        const xDataValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yDataValues = dataModel.resolveColumnById(this, `yValue`, processedData);
        const sizeDataValues =
            sizeKey != null ? dataModel.resolveColumnById<number>(this, `sizeValue`, processedData) : undefined;
        const colorDataValues =
            colorKey != null ? dataModel.resolveColumnById<number>(this, `colorValue`, processedData) : undefined;
        const labelDataValues =
            labelKey != null ? dataModel.resolveColumnById(this, `labelValue`, processedData) : undefined;
        const xFilterDataValues =
            xFilterKey != null ? dataModel.resolveColumnById(this, `xFilterValue`, processedData) : undefined;
        const yFilterDataValues =
            yFilterKey != null ? dataModel.resolveColumnById(this, `yFilterValue`, processedData) : undefined;
        const sizeFilterDataValues =
            sizeFilterKey != null
                ? dataModel.resolveColumnById<number>(this, `sizeFilterValue`, processedData)
                : undefined;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const nodeData: BubbleNodeDatum[] = [];

        sizeScale.range = [marker.size, marker.maxSize];

        const font = label.getFont();
        const textMeasurer = CachedTextMeasurerPool.getMeasurer({ font });
        processedData.rawData.forEach((datum, datumIndex) => {
            const xDatum = xDataValues[datumIndex];
            const yDatum = yDataValues[datumIndex];
            const sizeValue = sizeDataValues?.[datumIndex];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            let selected: boolean | undefined;
            if (xFilterDataValues != null && yFilterDataValues != null) {
                selected = xFilterDataValues[datumIndex] === xDatum && yFilterDataValues[datumIndex] === yDatum;

                if (sizeFilterDataValues != null) {
                    selected &&= sizeFilterDataValues[datumIndex] === sizeValue;
                }
            }

            const labelText = this.getLabelText(label, {
                value: labelDataValues != null ? labelDataValues[datumIndex] : yDatum,
                datum,
                xKey,
                yKey,
                sizeKey,
                labelKey,
                xName,
                yName,
                sizeName,
                labelName,
            });

            const size = textMeasurer.measureText(String(labelText));
            const markerSize = sizeValue != null ? sizeScale.convert(sizeValue) : marker.size;
            const fill = colorDataValues != null ? colorScale.convert(colorDataValues[datumIndex]) : undefined;

            nodeData.push({
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                datum,
                datumIndex,
                xValue: xDatum,
                yValue: yDatum,
                sizeValue,
                point: { x, y, size: markerSize },
                midPoint: { x, y },
                fill,
                label: { text: labelText, ...size },
                anchor,
                placement,
                selected,
            });
        });

        return {
            itemId: yKey,
            nodeData,
            labelData: nodeData,
            scales: this.calculateScaling(),
            visible: this.visible,
        };
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.properties.marker.isDirty();
    }

    override getLabelData() {
        if (!this.isLabelEnabled()) return [];
        return this.contextNodeData?.labelData ?? [];
    }

    protected override updateMarkerSelection(opts: {
        nodeData: BubbleNodeDatum[];
        markerSelection: Selection<Marker, BubbleNodeDatum>;
    }) {
        const { nodeData, markerSelection } = opts;

        if (this.properties.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }

        const data = this.properties.marker.enabled ? nodeData : [];
        return markerSelection.update(data, undefined, (datum) =>
            createDatumId([datum.xValue, datum.yValue, datum.label.text])
        );
    }

    private getMarkerItemBaseStyle(
        highlighted: boolean
    ): RequireOptional<FillOptions & StrokeOptions & LineDashOptions> {
        const { properties } = this;

        const { marker } = properties;
        const highlightStyle = highlighted ? properties.highlightStyle.item : undefined;
        return {
            fill: highlightStyle?.fill ?? marker.fill,
            fillOpacity: highlightStyle?.fillOpacity ?? marker.fillOpacity,
            stroke: highlightStyle?.stroke ?? marker.stroke,
            strokeWidth: highlightStyle?.strokeWidth ?? marker.strokeWidth,
            strokeOpacity: highlightStyle?.strokeOpacity ?? marker.strokeOpacity,
            lineDash: highlightStyle?.lineDash ?? marker.lineDash,
            lineDashOffset: highlightStyle?.lineDashOffset ?? marker.lineDashOffset,
        };
    }

    private getMarkerItemStyleOverrides(
        datumId: string,
        datum: any,
        format: RequireOptional<FillOptions & StrokeOptions>,
        highlighted: boolean
    ) {
        const { id: seriesId, properties } = this;

        const { xKey, yKey, sizeKey, labelKey, marker } = properties;
        const { itemStyler } = marker;

        if (itemStyler == null) return;

        return this.cachedDatumCallback(createDatumId(datumId, highlighted ? 'highlight' : 'node'), () => {
            return itemStyler({
                seriesId,
                datum,
                xKey,
                yKey,
                sizeKey,
                labelKey,
                highlighted,
                ...format,
            });
        });
    }

    protected override updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, BubbleNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const { xKey, yKey, sizeKey, labelKey, marker } = this.properties;
        const { size, shape, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } =
            mergeDefaults(highlighted && this.properties.highlightStyle.item, marker.getStyle());
        const baseStyle = {
            size,
            shape,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        };

        this.sizeScale.range = [marker.size, marker.maxSize];

        markerSelection.each((node, datum) => {
            this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey, sizeKey, labelKey }, baseStyle, {
                selected: datum.selected,
            });
        });

        if (!highlighted) {
            this.properties.marker.markClean();
        }
    }

    public override updatePlacedLabelData(labelData: PlacedLabel<BubbleNodeDatum>[]) {
        this.labelSelection.update(
            labelData.map((v) => ({
                ...v.datum,
                point: {
                    x: v.x,
                    y: v.y,
                    size: v.datum.point.size,
                },
            })),
            (text) => {
                text.pointerEvents = PointerEvents.None;
            }
        );
        this.updateLabelNodes({ labelSelection: this.labelSelection });
    }

    protected updateLabelNodes(opts: { labelSelection: Selection<Text, BubbleNodeDatum> }) {
        const { label } = this.properties;

        opts.labelSelection.each((text, datum) => {
            text.text = datum.label.text;
            text.fill = label.color;
            text.x = datum.point?.x ?? 0;
            text.y = datum.point?.y ?? 0;
            text.fontStyle = label.fontStyle;
            text.fontWeight = label.fontWeight;
            text.fontSize = label.fontSize;
            text.fontFamily = label.fontFamily;
            text.textAlign = 'left';
            text.textBaseline = 'top';
        });
    }

    override getTooltipContent(nodeDatum: BubbleNodeDatum): TooltipContent | string | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties } = this;
        const { xKey, xName, yKey, yName, sizeKey, sizeName, labelKey, labelName, title, tooltip } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const { datumIndex } = nodeDatum;
        const datum = processedData.rawData[datumIndex];
        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData)[datumIndex];

        if (xValue == null) return;

        const data: TooltipContentDataRow[] = [
            { label: xName, fallbackLabel: xKey, value: xAxis.formatDatum(xValue) },
            { label: yName, fallbackLabel: yKey, value: yAxis.formatDatum(yValue) },
        ];

        if (sizeKey != null) {
            const sizeValue = dataModel.resolveColumnById<number>(this, `sizeValue`, processedData)[datumIndex];
            data.push({ label: sizeName, fallbackLabel: sizeKey, value: String(sizeValue) });
        }

        const format = this.getMarkerItemBaseStyle(false);
        Object.assign(format, this.getMarkerItemStyleOverrides(String(datumIndex), datum, format, false));

        return tooltip.formatTooltip(
            {
                title,
                symbol: this.legendItemSymbol(),
                data,
            },
            {
                seriesId,
                datum,
                title: yKey,
                xKey,
                xName,
                yKey,
                yName,
                sizeKey,
                sizeName,
                labelKey,
                labelName,
                ...format,
                ...(this.getModuleTooltipParams() as RequireOptional<AgErrorBoundSeriesTooltipRendererParams>),
            }
        );
    }

    private legendItemSymbol(): LegendSymbolOptions {
        const { marker } = this.properties;
        const { shape, fill, stroke, fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = marker;

        return {
            marker: {
                shape,
                fill: fill ?? 'rgba(0, 0, 0, 0)',
                stroke: stroke ?? 'rgba(0, 0, 0, 0)',
                fillOpacity,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
            },
        };
    }

    getLegendData(): CategoryLegendDatum[] {
        if (!this.properties.isValid()) {
            return [];
        }

        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        const { yKey: itemId, yName, title } = this.properties;

        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId }),
                label: {
                    text: title ?? yName ?? itemId,
                },
                symbol: this.legendItemSymbol(),
            },
        ];
    }

    override animateEmptyUpdateReady({ markerSelection, labelSelection }: BubbleAnimationData) {
        markerScaleInAnimation(this, this.ctx.animationManager, markerSelection);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected nodeFactory() {
        return new Group();
    }

    public getFormattedMarkerStyle(datum: BubbleNodeDatum): AgSeriesMarkerStyle & { size: number } {
        const { xKey, yKey, sizeKey, labelKey } = this.properties;
        return this.getMarkerStyle(this.properties.marker, {
            datum,
            xKey,
            yKey,
            sizeKey,
            labelKey,
            highlighted: false,
        });
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }
}
