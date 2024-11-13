import {
    type AgPyramidSeriesLabelFormatterParams,
    type AgPyramidSeriesStyle,
    type AgTooltipRendererResult,
    _ModuleSupport,
} from 'ag-charts-community';

import { FunnelConnector } from '../funnel/funnelConnector';
import { PyramidProperties } from './pyramidProperties';

const {
    valueProperty,
    SeriesNodePickMode,
    CachedTextMeasurerPool,
    TextUtils,
    sanitizeHtml,
    BBox,
    Group,
    Selection,
    Text,
    PointerEvents,
} = _ModuleSupport;

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type PyramidNodeLabelDatum = Readonly<_ModuleSupport.Point> & {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    readonly visible: boolean;
};

export interface PyramidNodeDatum extends _ModuleSupport.SeriesNodeDatum, Readonly<_ModuleSupport.Point> {
    readonly index: number;
    readonly xValue: string;
    readonly yValue: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
    readonly fill: string;
    readonly stroke: string;
    readonly label: PyramidNodeLabelDatum | undefined;
}

export interface PyramidNodeDataContext
    extends _ModuleSupport.SeriesNodeDataContext<PyramidNodeDatum, PyramidNodeLabelDatum> {
    stageLabelData: PyramidNodeLabelDatum[] | undefined;
}

export class PyramidSeries extends _ModuleSupport.DataModelSeries<
    PyramidNodeDatum,
    PyramidProperties,
    PyramidNodeLabelDatum,
    PyramidNodeDataContext
> {
    override properties = new PyramidProperties();

    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));
    private readonly itemLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemLabelGroup' }));
    private readonly stageLabelGroup = this.contentGroup.appendChild(new Group({ name: 'stageLabelGroup' }));

    public datumSelection: _ModuleSupport.Selection<FunnelConnector, PyramidNodeDatum> = Selection.select(
        this.itemGroup,
        () => this.nodeFactory()
    );
    private labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, PyramidNodeLabelDatum> = Selection.select(
        this.itemLabelGroup,
        Text
    );
    private stageLabelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, PyramidNodeLabelDatum> =
        Selection.select(this.stageLabelGroup, Text);
    private highlightDatumSelection: _ModuleSupport.Selection<FunnelConnector, PyramidNodeDatum> = Selection.select(
        this.highlightNode,
        () => this.nodeFactory()
    );

    public contextNodeData?: PyramidNodeDataContext;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH, SeriesNodePickMode.NEAREST_NODE],
        });

        this.itemLabelGroup.pointerEvents = PointerEvents.None;
        this.stageLabelGroup.pointerEvents = PointerEvents.None;
    }

    override addChartEventListeners(): void {
        this.destroyFns.push(
            this.ctx.chartEventManager?.addListener('legend-item-click', (event) => this.onLegendItemClick(event))
        );
    }

    private nodeFactory(): FunnelConnector {
        return new FunnelConnector();
    }

    public override getNodeData(): PyramidNodeDatum[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (this.data == null || !this.properties.isValid()) {
            return;
        }

        const {
            id: seriesId,
            visible,
            ctx: { legendManager },
        } = this;

        const { stageKey, valueKey } = this.properties;

        const xScaleType = 'band';
        const yScaleType = 'number';

        const validation = (_value: unknown, _datum: unknown, index: number) =>
            visible && legendManager.getItemEnabled({ seriesId, itemId: index });
        const visibleProps = this.visible ? {} : { forceValue: 0 };
        await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                valueProperty(stageKey, xScaleType, { id: 'xValue' }),
                valueProperty(valueKey, yScaleType, { id: `yValue`, ...visibleProps, validation, invalidValue: 0 }),
            ],
        });
    }

    override async createNodeData(): Promise<PyramidNodeDataContext | undefined> {
        const {
            id: seriesId,
            dataModel,
            processedData,
            properties,
            visible,
            ctx: { legendManager },
        } = this;
        const {
            stageKey,
            valueKey,
            fills,
            strokes,
            direction,
            reverse = direction === 'horizontal',
            spacing,
            aspectRatio,
            label,
            stageLabel,
        } = properties;

        if (dataModel == null || processedData == null || processedData.rawData.length === 0) return;

        const horizontal = direction === 'horizontal';

        const xValues = dataModel.resolveColumnById<string>(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById<number>(this, `yValue`, processedData);

        const textMeasurer = CachedTextMeasurerPool.getMeasurer({ font: stageLabel.getFont() });

        let textAlign: CanvasTextAlign;
        let textBaseline: CanvasTextBaseline;
        if (horizontal) {
            textAlign = 'center';
            textBaseline = stageLabel.placement === 'before' ? 'bottom' : 'top';
        } else {
            textAlign = stageLabel.placement === 'after' ? 'left' : 'right';
            textBaseline = 'middle';
        }

        const stageLabelData: PyramidNodeLabelDatum[] | undefined = stageLabel.enabled ? [] : undefined;
        let maxLabelWidth = 0;
        let maxLabelHeight = 0;
        let yTotal = 0;

        processedData.rawData.forEach((datum, datumIndex) => {
            const xValue = xValues[datumIndex];
            const yValue = yValues[datumIndex];
            const enabled = visible && legendManager.getItemEnabled({ seriesId, itemId: datumIndex });

            yTotal += yValue;

            if (stageLabelData == null) return;

            const text = this.getLabelText(this.properties.stageLabel, {
                datum,
                value: xValue,
                stageKey,
                valueKey,
            });

            const { width } = textMeasurer.measureText(text);
            const height = text.split('\n').length * TextUtils.getLineHeight(label.fontSize);
            maxLabelWidth = Math.max(maxLabelWidth, width);
            maxLabelHeight = Math.max(maxLabelHeight, height);

            stageLabelData.push({
                x: NaN,
                y: NaN,
                text,
                textAlign,
                textBaseline,
                visible: enabled,
            });
        });

        const seriesRectWidth = this._nodeDataDependencies?.seriesRectWidth ?? 0;
        const seriesRectHeight = this._nodeDataDependencies?.seriesRectHeight ?? 0;
        const totalSpacing = spacing * (processedData.rawData.length - 1);

        let bounds: _ModuleSupport.BBox;
        if (horizontal) {
            const verticalInset = maxLabelHeight + stageLabel.spacing;
            bounds = new BBox(
                0,
                stageLabel.placement === 'before' ? verticalInset : 0,
                seriesRectWidth,
                seriesRectHeight - verticalInset
            );
        } else {
            const horizontalInset = maxLabelWidth + stageLabel.spacing;
            bounds = new BBox(
                stageLabel.placement === 'after' ? 0 : horizontalInset,
                0,
                seriesRectWidth - horizontalInset,
                seriesRectHeight
            );
        }

        if (aspectRatio != null && aspectRatio !== 0) {
            const directionalAspectRatio = direction === 'horizontal' ? 1 / aspectRatio : aspectRatio;
            const constrainedWidth = Math.min(bounds.width, bounds.height * directionalAspectRatio);
            const constrainedHeight = constrainedWidth / directionalAspectRatio;

            bounds = new BBox(
                bounds.x + (bounds.width - constrainedWidth) / 2,
                bounds.y + (bounds.height - constrainedHeight) / 2,
                constrainedWidth,
                constrainedHeight
            );
        }

        let labelX: number | undefined;
        let labelY: number | undefined;
        if (horizontal) {
            labelY =
                stageLabel.placement === 'before'
                    ? bounds.y - stageLabel.spacing
                    : bounds.y + bounds.height + stageLabel.spacing;
        } else {
            labelX =
                stageLabel.placement === 'after'
                    ? bounds.x + bounds.width + stageLabel.spacing
                    : bounds.x - stageLabel.spacing;
        }

        const availableWidth = bounds.width - (horizontal ? totalSpacing : 0);
        const availableHeight = bounds.height - (horizontal ? 0 : totalSpacing);

        if (availableWidth < 0 || availableHeight < 0) return;

        const nodeData: PyramidNodeDatum[] = [];
        const labelData: PyramidNodeLabelDatum[] = [];
        let yStart = 0;
        processedData.rawData.forEach((datum, datumIndex) => {
            const xValue = xValues[datumIndex];
            const yValue = yValues[datumIndex];

            const enabled = visible && legendManager.getItemEnabled({ seriesId, itemId: datumIndex });

            const yEnd = yStart + yValue;

            const yMidRatio = (yStart + yEnd) / (2 * yTotal);
            const yRangeRatio = (yEnd - yStart) / yTotal;

            const xOffset = horizontal ? availableWidth * yMidRatio + spacing * datumIndex : availableWidth * 0.5;
            const yOffset = horizontal ? availableHeight * 0.5 : availableHeight * yMidRatio + spacing * datumIndex;

            const x = bounds.x + xOffset;
            const y = bounds.y + yOffset;

            if (stageLabelData != null) {
                const stageLabelDatum = stageLabelData[datumIndex] as Writeable<PyramidNodeLabelDatum>;
                stageLabelDatum.x = labelX ?? x;
                stageLabelDatum.y = labelY ?? y;
            }

            let top: number;
            let right: number;
            let bottom: number;
            let left: number;
            if (horizontal) {
                const barWidth = availableWidth * yRangeRatio;
                top = barWidth;
                bottom = barWidth;

                const y0 = (xOffset + barWidth / 2) * (availableHeight / bounds.width);
                const y1 = (xOffset - barWidth / 2) * (availableHeight / bounds.width);
                right = reverse ? bounds.height - y0 : y0;
                left = reverse ? bounds.height - y1 : y1;
            } else {
                const barHeight = availableHeight * yRangeRatio;
                right = barHeight;
                left = barHeight;

                const x0 = (yOffset - barHeight / 2) * (availableWidth / bounds.height);
                const x1 = (yOffset + barHeight / 2) * (availableWidth / bounds.height);
                top = reverse ? bounds.width - x0 : x0;
                bottom = reverse ? bounds.width - x1 : x1;
            }

            const text = this.getLabelText(label, {
                datum,
                value: yValue,
                stageKey,
                valueKey,
            });
            const labelDatum: PyramidNodeLabelDatum = {
                x,
                y,
                text,
                textAlign: 'center',
                textBaseline: 'middle',
                visible: enabled,
            };

            labelData.push(labelDatum);

            const fill = fills[datumIndex % fills.length] ?? 'black';
            const stroke = strokes[datumIndex % strokes.length] ?? 'black';

            nodeData.push({
                series: this,
                itemId: valueKey,
                datum,
                index: datumIndex,
                xValue,
                yValue,
                x,
                y,
                fill,
                stroke,
                top,
                right,
                bottom,
                left,
                label: labelDatum,
                enabled,
                midPoint: {
                    x,
                    y,
                },
            });

            yStart = yEnd;
        });

        return {
            itemId: seriesId,
            nodeData,
            labelData,
            stageLabelData,
        };
    }

    async updateSelections(): Promise<void> {
        if (this.nodeDataRefresh) {
            this.contextNodeData = await this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    override async update({ seriesRect }: { seriesRect?: _ModuleSupport.BBox }): Promise<void> {
        this.checkResize(seriesRect);

        const { datumSelection, labelSelection, stageLabelSelection, highlightDatumSelection } = this;

        await this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity = this.getOpacity();

        let highlightedDatum: PyramidNodeDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
            highlightedDatum = undefined;
        }

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];
        const stageLabelData = this.contextNodeData?.stageLabelData ?? [];

        this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
        await this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.labelSelection = await this.updateLabelSelection({ labelData, labelSelection });
        await this.updateLabelNodes({ labelSelection, labelProperties: this.properties.label });

        this.stageLabelSelection = await this.updateStageLabelSelection({ stageLabelData, stageLabelSelection });
        await this.updateLabelNodes({
            labelSelection: stageLabelSelection,
            labelProperties: this.properties.stageLabel,
        });

        this.highlightDatumSelection = await this.updateDatumSelection({
            nodeData: highlightedDatum != null ? [highlightedDatum] : [],
            datumSelection: highlightDatumSelection,
        });
        await this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });
    }

    private async updateDatumSelection(opts: {
        nodeData: PyramidNodeDatum[];
        datumSelection: _ModuleSupport.Selection<FunnelConnector, PyramidNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData);
    }

    private async updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<FunnelConnector, PyramidNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { properties } = this;
        const { stageKey, valueKey, shadow, itemStyler } = this.properties;
        const highlightStyle = isHighlight ? this.properties.highlightStyle.item : undefined;

        datumSelection.each((connector, nodeDatum) => {
            const { x, y, top, right, bottom, left } = nodeDatum;
            connector.x0 = x - top / 2;
            connector.x1 = x + top / 2;
            connector.x2 = x + bottom / 2;
            connector.x3 = x - bottom / 2;

            connector.y0 = y - left / 2;
            connector.y1 = y - right / 2;
            connector.y2 = y + right / 2;
            connector.y3 = y + left / 2;

            const fill = highlightStyle?.fill ?? nodeDatum.fill;
            const fillOpacity = highlightStyle?.fillOpacity ?? properties.fillOpacity;
            const stroke = highlightStyle?.stroke ?? nodeDatum.stroke;
            const strokeOpacity = highlightStyle?.strokeOpacity ?? properties.strokeOpacity;
            const strokeWidth = highlightStyle?.strokeWidth ?? properties.strokeWidth;
            const lineDash = highlightStyle?.lineDash ?? properties.lineDash;
            const lineDashOffset = highlightStyle?.lineDashOffset ?? properties.lineDashOffset;

            let itemStyle: AgPyramidSeriesStyle | undefined;
            if (itemStyler != null) {
                itemStyle = itemStyler({
                    datum: nodeDatum.datum,
                    seriesId: this.id,
                    highlighted: isHighlight,
                    stageKey,
                    valueKey,
                    fill,
                    fillOpacity,
                    stroke,
                    strokeOpacity,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                });
            }

            connector.fill = itemStyle?.fill ?? fill;
            connector.fillOpacity = itemStyle?.fillOpacity ?? fillOpacity;
            connector.stroke = itemStyle?.stroke ?? stroke;
            connector.strokeOpacity = itemStyle?.strokeOpacity ?? strokeOpacity;
            connector.strokeWidth = itemStyle?.strokeWidth ?? strokeWidth;
            connector.lineDash = itemStyle?.lineDash ?? lineDash;
            connector.lineDashOffset = itemStyle?.lineDashOffset ?? lineDashOffset;
            connector.fillShadow = shadow;
        });
    }

    private async updateLabelSelection(opts: {
        labelData: PyramidNodeLabelDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, PyramidNodeLabelDatum>;
    }) {
        return opts.labelSelection.update(this.properties.label.enabled ? opts.labelData : []);
    }

    private async updateStageLabelSelection(opts: {
        stageLabelData: PyramidNodeLabelDatum[];
        stageLabelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, PyramidNodeLabelDatum>;
    }) {
        return opts.stageLabelSelection.update(opts.stageLabelData);
    }

    private async updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, PyramidNodeLabelDatum>;
        labelProperties: _ModuleSupport.Label<AgPyramidSeriesLabelFormatterParams>;
    }) {
        const { labelSelection, labelProperties } = opts;
        const { color: fill, fontSize, fontStyle, fontWeight, fontFamily } = labelProperties;

        labelSelection.each((label, { visible, x, y, text, textAlign, textBaseline }) => {
            label.visible = visible;
            label.x = x;
            label.y = y;
            label.text = text;
            label.fill = fill;
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;
            label.fontSize = fontSize;
            label.fontFamily = fontFamily;
            label.textAlign = textAlign;
            label.textBaseline = textBaseline;
        });
    }

    override resetAnimation(_chartAnimationPhase: _ModuleSupport.ChartAnimationPhase): void {
        // Does not reset any animations
    }

    protected override computeFocusBounds(
        opts: _ModuleSupport.PickFocusInputs
    ): _ModuleSupport.BBox | _ModuleSupport.Path | undefined {
        const datum = this.getNodeData()?.[opts.datumIndex];
        if (datum === undefined) return;

        for (const node of this.datumSelection) {
            if (node.datum === datum) {
                return node.node;
            }
        }
    }

    override getTooltipHtml(nodeDatum: any): _ModuleSupport.TooltipContent {
        const {
            id: seriesId,
            ctx: { callbackCache },
        } = this;

        if (!this.properties.isValid()) {
            return _ModuleSupport.EMPTY_TOOLTIP_CONTENT;
        }

        const { stageKey, valueKey, itemStyler, tooltip } = this.properties;
        const { strokeWidth, fillOpacity, strokeOpacity, lineDash, lineDashOffset } = this.properties;
        const { datum, xValue, yValue, fill, stroke } = nodeDatum;

        let format;
        if (itemStyler) {
            format = callbackCache.call(itemStyler, {
                highlighted: false,
                seriesId,
                datum,
                stageKey,
                valueKey,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            });
        }

        const color = format?.fill ?? fill ?? 'gray';

        const title = sanitizeHtml(String(xValue));
        const content = sanitizeHtml(String(yValue));

        const defaults: AgTooltipRendererResult = {
            title,
            content,
            backgroundColor: color,
        };

        return tooltip.toTooltipHtml(defaults, {
            itemId: undefined,
            datum,
            stageKey,
            valueKey,
            color,
            seriesId,
            title,
        });
    }

    override getLabelData(): _ModuleSupport.PointLabelDatum[] {
        return [];
    }

    override getSeriesDomain(): any[] {
        return [NaN, NaN];
    }

    override pickNodeClosestDatum({ x, y }: _ModuleSupport.Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        let minDistanceSquared = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum | undefined;

        this.datumSelection.each((node, datum) => {
            const distanceSquared = node.distanceSquared(x, y);
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
            }
        });

        return minDatum != null ? { datum: minDatum, distance: Math.sqrt(minDistanceSquared) } : undefined;
    }

    override getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const {
            processedData,
            dataModel,
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        if (!dataModel || !processedData || legendType !== 'category' || !this.properties.isValid()) {
            return [];
        }

        const { fills, strokes, strokeWidth, fillOpacity, strokeOpacity, showInLegend } = this.properties;

        const legendData: _ModuleSupport.CategoryLegendDatum[] = [];
        const stageValues = dataModel.resolveColumnById<string>(this, `xValue`, processedData);

        processedData.rawData.forEach((_datum, datumIndex) => {
            const stageValue = stageValues[datumIndex];
            const fill = fills[datumIndex % fills.length] ?? 'black';
            const stroke = strokes[datumIndex % strokes.length] ?? 'black';

            legendData.push({
                legendType: 'category',
                id: seriesId,
                itemId: datumIndex,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId: datumIndex }),
                label: { text: stageValue },
                symbols: [{ marker: { fill, fillOpacity, stroke, strokeWidth, strokeOpacity } }],
                hideInLegend: !showInLegend,
            });
        });

        return legendData;
    }
}
