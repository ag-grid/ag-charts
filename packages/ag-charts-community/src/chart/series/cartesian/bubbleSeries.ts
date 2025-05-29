import type { RequireOptional } from 'ag-charts-core';
import {
    type AgBubbleSeriesLabelFormatterParams,
    type AgErrorBoundSeriesTooltipRendererParams,
    type AgSeriesMarkerStyle,
    type FillOptions,
    type LineDashOptions,
    type StrokeOptions,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { LinearScale } from '../../../scale/linearScale';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import type { PlacedLabel } from '../../../scene/util/labelPlacement';
import { extent } from '../../../util/extent';
import { formatValue } from '../../../util/format.util';
import { mergeDefaults } from '../../../util/object';
import { CachedTextMeasurerPool } from '../../../util/textMeasurer';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { fixNumericExtent } from '../../data/dataModel';
import { createDatumId, valueProperty } from '../../data/processors';
import type { CategoryLegendDatum } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { Marker } from '../../marker/marker';
import { type TooltipContent, type TooltipContentDataRow } from '../../tooltip/tooltip';
import { type PickFocusInputs, SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import type { SeriesNodeEventTypes } from '../seriesTypes';
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

    override properties = new BubbleSeriesProperties();

    private readonly sizeScale = new LinearScale();

    override get pickModeAxis() {
        return 'main-category' as const;
    }

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            categoryKey: undefined,
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
            clipFocusBox: false,
        });
    }

    override async processData(dataController: DataController) {
        if (this.data == null || !this.visible) return;

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const sizeScaleType = this.sizeScale.type;
        const { xKey, yKey, sizeKey, xFilterKey, yFilterKey, sizeFilterKey, labelKey, marker } = this.properties;
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
                ...(labelKey ? [valueProperty(labelKey, 'band', { id: `labelValue` })] : []),
            ],
        });

        const sizeKeyIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`);
        const mutableMarkerDomain: [number, number] | undefined = marker.domain
            ? [marker.domain[0], marker.domain[1]]
            : undefined;
        this.sizeScale.domain = mutableMarkerDomain ?? processedData.domain.values[sizeKeyIdx] ?? [];

        this.animationState.transition('updateData');
    }

    override xCoordinateRange(xValue: any, pixelSize: number, index: number): [number, number] {
        const { properties, sizeScale } = this;
        const { size, sizeKey } = properties;
        const x = this.axes[ChartAxisDirection.X]!.scale.convert(xValue);
        const sizeValues =
            sizeKey != null ? this.dataModel!.resolveColumnById(this, `sizeValue`, this.processedData!) : undefined;
        const sizeValue = sizeValues != null ? sizeScale.convert(sizeValues[index]) : size;
        const r = 0.5 * sizeValue * pixelSize;
        return [x - r, x + r];
    }

    override yCoordinateRange(yValues: any[], pixelSize: number, index: number): [number, number] {
        const { properties, sizeScale } = this;
        const { size, sizeKey } = properties;
        const y = this.axes[ChartAxisDirection.Y]!.scale.convert(yValues[0]);
        const sizeValues =
            sizeKey != null ? this.dataModel!.resolveColumnById(this, `sizeValue`, this.processedData!) : undefined;
        const sizeValue = sizeValues != null ? sizeScale.convert(sizeValues[index]) : size;
        const r = 0.5 * sizeValue * pixelSize;
        return [y - r, y + r];
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        const dataValues: { [K in ChartAxisDirection]?: string } = {
            [ChartAxisDirection.X]: 'xValue',
            [ChartAxisDirection.Y]: 'yValue',
        };

        const id = dataValues[direction]!;
        const dataDef = dataModel.resolveProcessedDataDefById(this, id);
        const domain = dataModel.getDomain(this, id, 'value', processedData);
        if (dataDef?.def.type === 'value' && dataDef?.def.valueType === 'category') {
            return domain;
        }

        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;
        const crossId = dataValues[crossDirection]!;

        const ext = this.domainForClippedRange(direction, [id], crossId, false);
        return fixNumericExtent(extent(ext));
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [any, any]): any[] {
        return this.domainForVisibleRange(ChartAxisDirection.Y, ['yValue'], 'xValue', visibleRange, false);
    }

    override getVisibleItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number],
        minVisibleItems: number
    ): number {
        return this.countVisibleItems('xValue', ['yValue'], xVisibleRange, yVisibleRange, minVisibleItems);
    }

    override createNodeData() {
        const { axes, dataModel, processedData, sizeScale, visible } = this;
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

        const textMeasurer = CachedTextMeasurerPool.getMeasurer({ font: label });
        processedData.dataSources.get(this.id)?.forEach((datum, datumIndex) => {
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

            const labelValue = labelDataValues != null ? labelDataValues[datumIndex] : yDatum;
            const labelText = this.getLabelText<AgBubbleSeriesLabelFormatterParams>(
                labelValue,
                datum,
                labelKey ?? sizeKey,
                labelKey != null ? 'label' : 'size',
                label,
                { value: labelValue, datum, xKey, yKey, sizeKey, labelKey, xName, yName, sizeName, labelName }
            );

            const size = textMeasurer.measureText(String(labelText));
            const markerSize = sizeValue != null ? sizeScale.convert(sizeValue) : marker.size;

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
            createDatumId([datum.xValue, datum.yValue, datum.sizeValue, datum.label.text])
        );
    }

    protected override updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, BubbleNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const { xKey, yKey, sizeKey, labelKey, marker } = this.properties;
        const baseStyle = mergeDefaults(highlighted && this.properties.highlightStyle.item, marker.getStyle());

        this.sizeScale.range = [marker.size, marker.maxSize];
        const fillBBox = this.getShapeFillBBox();

        markerSelection.each((node, datum) => {
            this.updateMarkerStyle(
                marker,
                node,
                datum.datum,
                datum.point,
                { xKey, yKey, sizeKey, labelKey },
                highlighted,
                baseStyle,
                fillBBox,
                { selected: datum.selected }
            );
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

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties, ctx } = this;
        const { formatManager } = ctx;
        const { xKey, xName, yKey, yName, sizeKey, sizeName, labelKey, labelName, title, tooltip, marker } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData)[datumIndex];

        const nodeDatum = this.contextNodeData?.nodeData[datumIndex];
        if (xValue == null || nodeDatum == null) return;

        const data: TooltipContentDataRow[] = [
            { label: xName, fallbackLabel: xKey, value: xAxis.formatDatum(xValue, 'tooltip', datum, xKey) },
            { label: yName, fallbackLabel: yKey, value: yAxis.formatDatum(yValue, 'tooltip', datum, yKey) },
        ];

        if (sizeKey != null) {
            const value = dataModel.resolveColumnById<number>(this, `sizeValue`, processedData)[datumIndex];
            const content = formatManager.format({
                type: 'number',
                value,
                datum,
                key: sizeKey,
                source: 'tooltip',
                property: 'size',
                fractionDigits: undefined,
            });
            data.push({ label: sizeName, fallbackLabel: sizeKey, value: content ?? formatValue(value) });
        }

        const style = marker.getStyle();
        const activeStyle = this.getMarkerStyle(
            marker,
            datum,
            { xKey, yKey, sizeKey, labelKey, highlighted: true },
            false,
            undefined,
            style
        );

        return this.formatTooltipWithContext(
            tooltip,
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
                ...(activeStyle as RequireOptional<FillOptions & StrokeOptions & LineDashOptions>),
                ...(this.getModuleTooltipParams() as RequireOptional<AgErrorBoundSeriesTooltipRendererParams>),
            }
        );
    }

    private legendItemSymbol(): LegendSymbolOptions {
        const marker = this.getMarkerStyle(this.properties.marker);
        return {
            marker,
        };
    }

    getLegendData(): CategoryLegendDatum[] {
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
        const { xKey, yKey, sizeKey, labelKey, marker } = this.properties;
        return this.getMarkerStyle(marker, datum, { xKey, yKey, sizeKey, labelKey }, false, datum.point.size);
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }
}
