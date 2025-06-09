import type { RequireOptional } from 'ag-charts-core';
import {
    type AgErrorBoundSeriesTooltipRendererParams,
    type AgScatterSeriesLabelFormatterParams,
    type FillOptions,
    type LineDashOptions,
    type StrokeOptions,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
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
import { valueProperty } from '../../data/processors';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { Marker } from '../../marker/marker';
import { type TooltipContent, type TooltipContentDataRow } from '../../tooltip/tooltip';
import { type PickFocusInputs, SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import type { CartesianAnimationData } from './cartesianSeries';
import {
    CartesianSeries,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { computeMarkerFocusBounds, markerScaleInAnimation, resetMarkerFn } from './markerUtil';
import { type ScatterNodeDatum, ScatterSeriesProperties } from './scatterSeriesProperties';

type ScatterAnimationData = CartesianAnimationData<Group, ScatterNodeDatum>;

export class ScatterSeries extends CartesianSeries<Group, ScatterSeriesProperties, ScatterNodeDatum> {
    static readonly className = 'ScatterSeries';
    static readonly type = 'scatter' as const;

    override properties = new ScatterSeriesProperties();

    override get pickModeAxis() {
        return 'main-category' as const;
    }

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            propertyKeys: {
                ...DEFAULT_CARTESIAN_DIRECTION_KEYS,
                label: ['labelKey'],
            },
            propertyNames: {
                ...DEFAULT_CARTESIAN_DIRECTION_NAMES,
                label: ['labelName'],
            },
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
                marker: resetMarkerFn,
                label: resetLabelFn,
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
        const { xKey, yKey, xFilterKey, yFilterKey, labelKey } = this.properties;

        await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                valueProperty(xKey, xScaleType, { id: `xValue` }),
                valueProperty(yKey, yScaleType, { id: `yValue` }),
                ...(xFilterKey != null ? [valueProperty(xFilterKey, xScaleType, { id: 'xFilterValue' })] : []),
                ...(yFilterKey != null ? [valueProperty(yFilterKey, yScaleType, { id: 'yFilterValue' })] : []),
                ...(labelKey ? [valueProperty(labelKey, 'band', { id: `labelValue` })] : []),
            ],
        });

        this.animationState.transition('updateData');
    }

    override xCoordinateRange(xValue: any, pixelSize: number): [number, number] {
        const x = this.axes[ChartAxisDirection.X]!.scale.convert(xValue);
        const r = 0.5 * this.properties.size * pixelSize;
        return [x - r, x + r];
    }

    override yCoordinateRange(yValues: any[], pixelSize: number): [number, number] {
        const y = this.axes[ChartAxisDirection.Y]!.scale.convert(yValues[0]);
        const r = 0.5 * this.properties.size * pixelSize;
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

        const ext = this.domainForClippedRange(direction, [id], crossId);
        return fixNumericExtent(extent(ext));
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [any, any]): any[] {
        return this.domainForVisibleRange(ChartAxisDirection.Y, ['yValue'], 'xValue', visibleRange);
    }

    override getVisibleItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number],
        minVisibleItems: number
    ): number {
        return this.countVisibleItems('xValue', ['yValue'], xVisibleRange, yVisibleRange, minVisibleItems);
    }

    override createNodeData() {
        const { axes, dataModel, processedData, visible } = this;
        const { xKey, yKey, xFilterKey, yFilterKey, labelKey, xName, yName, labelName, marker, label } =
            this.properties;
        const { placement } = label;
        const anchor = Marker.anchor(marker.shape);

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(dataModel && processedData && visible && xAxis && yAxis)) return;

        const xDataValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yDataValues = dataModel.resolveColumnById(this, `yValue`, processedData);
        const labelDataValues =
            labelKey != null ? dataModel.resolveColumnById<string>(this, `labelValue`, processedData) : undefined;
        const xFilterDataValues =
            xFilterKey != null ? dataModel.resolveColumnById(this, `xFilterValue`, processedData) : undefined;
        const yFilterDataValues =
            yFilterKey != null ? dataModel.resolveColumnById(this, `yFilterValue`, processedData) : undefined;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const nodeData: ScatterNodeDatum[] = [];

        const labelDomain = labelKey == null ? [] : this.getSeriesDomain(ChartAxisDirection.Y);

        const textMeasurer = CachedTextMeasurerPool.getMeasurer({ font: label });
        const rawData = processedData.dataSources.get(this.id) ?? [];
        rawData.forEach((datum, datumIndex) => {
            const xDatum = xDataValues[datumIndex];
            const yDatum = yDataValues[datumIndex];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;
            const selected =
                xFilterDataValues != null && yFilterDataValues != null
                    ? xFilterDataValues[datumIndex] === xDatum && yFilterDataValues[datumIndex] === yDatum
                    : undefined;

            const labelValue = labelDataValues != null ? labelDataValues?.[datumIndex] : yDatum;
            const labelText = this.getLabelText<AgScatterSeriesLabelFormatterParams>(
                labelValue,
                datum,
                labelKey ?? yKey,
                labelKey != null ? 'label' : 'y',
                labelDomain,
                label,
                { value: labelValue, datum, xKey, yKey, labelKey, xName, yName, labelName }
            );

            const size = textMeasurer.measureText(labelText);

            nodeData.push({
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                datum,
                datumIndex,
                xValue: xDatum,
                yValue: yDatum,
                capDefaults: { lengthRatioMultiplier: marker.getDiameter(), lengthMax: Infinity },
                point: { x, y, size: marker.size },
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
        nodeData: ScatterNodeDatum[];
        markerSelection: Selection<Marker, ScatterNodeDatum>;
    }) {
        const { nodeData, markerSelection } = opts;

        if (this.properties.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }

        return markerSelection.update(this.properties.marker.enabled ? nodeData : []);
    }

    protected override updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, ScatterNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const { xKey, yKey, labelKey, marker, highlightStyle } = this.properties;
        const baseStyle = mergeDefaults(highlighted && highlightStyle.item, marker.getStyle());

        const fillBBox = this.getShapeFillBBox();

        markerSelection.each((node, datum) => {
            this.updateMarkerStyle(
                marker,
                node,
                datum.datum,
                datum.point,
                { xKey, yKey, labelKey },
                highlighted,
                baseStyle,
                fillBBox,
                { selected: datum.selected }
            );
        });

        if (!highlighted) {
            marker.markClean();
        }
    }

    public override updatePlacedLabelData(labelData: PlacedLabel<ScatterNodeDatum>[]) {
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

    protected updateLabelNodes(opts: { labelSelection: Selection<Text, ScatterNodeDatum> }) {
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
        const { xKey, xName, yKey, yName, labelKey, labelName, title, tooltip, marker } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) {
            return;
        }

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData)[datumIndex];

        const nodeDatum = this.contextNodeData?.nodeData[datumIndex];
        if (xValue == null || nodeDatum == null) return;

        const data: TooltipContentDataRow[] = [];

        if (this.isLabelEnabled() && labelKey != null) {
            const value = dataModel.resolveColumnById<number>(this, `labelValue`, processedData)[datumIndex];
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'category',
                value,
                datum,
                seriesId,
                key: labelKey,
                source: 'tooltip',
                property: 'label',
                domain: [],
                boundSeries: this.getFormatterContext('label'),
            });
            data.push({ label: labelName, fallbackLabel: labelKey, value: content ?? formatValue(value) });
        }

        data.push(
            { label: xName, fallbackLabel: xKey, value: xAxis.formatDatum(xValue, 'tooltip', datum, xKey) },
            { label: yName, fallbackLabel: yKey, value: yAxis.formatDatum(yValue, 'tooltip', datum, yKey) }
        );

        const activeStyle = this.getMarkerStyle(marker, nodeDatum.datum, {
            xKey,
            yKey,
            labelKey,
            highlighted: true,
        });

        return this.formatTooltipWithContext(
            tooltip,
            { symbol: this.legendItemSymbol(), title, data },
            {
                seriesId,
                datum,
                title: yName,
                xKey,
                xName,
                yKey,
                yName,
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

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const { yKey: itemId, yName, title, showInLegend } = this.properties;

        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

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
                hideInLegend: !showInLegend,
            },
        ];
    }

    override animateEmptyUpdateReady(data: ScatterAnimationData) {
        const { markerSelection, labelSelection, annotationSelections } = data;
        markerScaleInAnimation(this, this.ctx.animationManager, markerSelection);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
        seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, ...annotationSelections);
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected nodeFactory() {
        return new Group();
    }

    public getFormattedMarkerStyle(datum: ScatterNodeDatum) {
        const { xKey, yKey, labelKey } = this.properties;
        return this.getMarkerStyle(this.properties.marker, datum.datum, { xKey, yKey, labelKey }, true);
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }
}
