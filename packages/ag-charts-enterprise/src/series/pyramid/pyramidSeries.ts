import { type AgTooltipRendererResult, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { FunnelConnector } from '../funnel/funnelConnector';
import { PyramidProperties } from './pyramidProperties';

const { valueProperty, SeriesNodePickMode, CachedTextMeasurerPool, TextUtils } = _ModuleSupport;
const { BBox, Group, Selection, Text, PointerEvents } = _Scene;
const { sanitizeHtml } = _Util;

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type PyramidNodeLabelDatum = Readonly<_Scene.Point> & {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
};

export interface PyramidNodeDatum extends _ModuleSupport.SeriesNodeDatum, Readonly<_Scene.Point> {
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

    public datumSelection: _Scene.Selection<FunnelConnector, PyramidNodeDatum> = Selection.select(this.itemGroup, () =>
        this.nodeFactory()
    );
    private labelSelection: _Scene.Selection<_Scene.Text, PyramidNodeLabelDatum> = Selection.select(
        this.itemLabelGroup,
        Text
    );
    private stageLabelSelection: _Scene.Selection<_Scene.Text, PyramidNodeLabelDatum> = Selection.select(
        this.stageLabelGroup,
        Text
    );
    private highlightDatumSelection: _Scene.Selection<FunnelConnector, PyramidNodeDatum> = Selection.select(
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

        const { stageKey, valueKey } = this.properties;

        const xScaleType = 'band';
        const yScaleType = 'number';

        const visibleProps = this.visible ? {} : { forceValue: 0 };
        await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                valueProperty(stageKey, xScaleType, { id: 'xValue' }),
                valueProperty(valueKey, yScaleType, { id: `yValue`, ...visibleProps }),
            ],
        });
    }

    override async createNodeData(): Promise<PyramidNodeDataContext | undefined> {
        const { id: seriesId, dataModel, processedData, properties } = this;
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

        if (dataModel == null || processedData == null) return;

        const horizontal = direction === 'horizontal';

        const xIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`);
        const yIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`);

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

        processedData.data.forEach(({ values }) => {
            const xValue: string = values[xIdx];
            const yValue = Number(values[yIdx]);

            yTotal += yValue;

            if (stageLabelData == null) return;

            const text = xValue;

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
            });
        });

        const seriesRectWidth = this._nodeDataDependencies?.seriesRectWidth ?? 0;
        const seriesRectHeight = this._nodeDataDependencies?.seriesRectHeight ?? 0;
        const totalSpacing = spacing * (processedData.data.length - 1);

        let bounds: _Scene.BBox;
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
        processedData.data.forEach(({ datum, values }, index) => {
            const xValue: string = values[xIdx];
            const yValue = Number(values[yIdx]);

            const yEnd = yStart + yValue;

            const yMidRatio = (yStart + yEnd) / (2 * yTotal);
            const yRangeRatio = (yEnd - yStart) / yTotal;

            const xOffset = horizontal ? availableWidth * yMidRatio + spacing * index : availableWidth * 0.5;
            const yOffset = horizontal ? availableHeight * 0.5 : availableHeight * yMidRatio + spacing * index;

            const x = bounds.x + xOffset;
            const y = bounds.y + yOffset;

            if (stageLabelData != null) {
                const stageLabelDatum = stageLabelData[index] as Writeable<PyramidNodeLabelDatum>;
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
            };

            labelData.push(labelDatum);

            const fill = fills[index % fills.length] ?? 'black';
            const stroke = strokes[index % strokes.length] ?? 'black';

            nodeData.push({
                series: this,
                itemId: valueKey,
                datum,
                index,
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

    override async update({ seriesRect }: { seriesRect?: _Scene.BBox }): Promise<void> {
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
        await this.updateLabelNodes({ labelSelection });

        this.stageLabelSelection = await this.updateStageLabelSelection({ stageLabelData, stageLabelSelection });
        await this.updateStageLabelNodes({ stageLabelSelection });

        this.highlightDatumSelection = await this.updateDatumSelection({
            nodeData: highlightedDatum != null ? [highlightedDatum] : [],
            datumSelection: highlightDatumSelection,
        });
        await this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });
    }

    private async updateDatumSelection(opts: {
        nodeData: PyramidNodeDatum[];
        datumSelection: _Scene.Selection<FunnelConnector, PyramidNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData);
    }

    private async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<FunnelConnector, PyramidNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset, shadow } = this.properties;
        const highlightStyle = isHighlight ? this.properties.highlightStyle.item : undefined;

        datumSelection.each((connector, { x, y, top, right, bottom, left, fill, stroke }) => {
            connector.x0 = x - top / 2;
            connector.x1 = x + top / 2;
            connector.x2 = x + bottom / 2;
            connector.x3 = x - bottom / 2;

            connector.y0 = y - left / 2;
            connector.y1 = y - right / 2;
            connector.y2 = y + right / 2;
            connector.y3 = y + left / 2;

            connector.fill = highlightStyle?.fill ?? fill;
            connector.fillOpacity = highlightStyle?.fillOpacity ?? fillOpacity;
            connector.stroke = highlightStyle?.stroke ?? stroke;
            connector.strokeOpacity = highlightStyle?.strokeOpacity ?? strokeOpacity;
            connector.strokeWidth = highlightStyle?.strokeWidth ?? strokeWidth;
            connector.lineDash = highlightStyle?.lineDash ?? lineDash;
            connector.lineDashOffset = highlightStyle?.lineDashOffset ?? lineDashOffset;
            connector.fillShadow = shadow;
        });
    }

    private async updateLabelSelection(opts: {
        labelData: PyramidNodeLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, PyramidNodeLabelDatum>;
    }) {
        return opts.labelSelection.update(this.properties.label.enabled ? opts.labelData : []);
    }

    private async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, PyramidNodeLabelDatum> }) {
        const { labelSelection } = opts;
        const { color: fill, fontSize, fontStyle, fontWeight, fontFamily } = this.properties.label;

        labelSelection.each((label, { x, y, text, textAlign, textBaseline }) => {
            label.visible = true;
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

    private async updateStageLabelSelection(opts: {
        stageLabelData: PyramidNodeLabelDatum[];
        stageLabelSelection: _Scene.Selection<_Scene.Text, PyramidNodeLabelDatum>;
    }) {
        return opts.stageLabelSelection.update(opts.stageLabelData);
    }

    private async updateStageLabelNodes(opts: {
        stageLabelSelection: _Scene.Selection<_Scene.Text, PyramidNodeLabelDatum>;
    }) {
        const { stageLabelSelection } = opts;
        const { color: fill, fontSize, fontStyle, fontWeight, fontFamily } = this.properties.stageLabel;

        stageLabelSelection.each((label, { x, y, text, textAlign, textBaseline }) => {
            label.visible = true;
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

    override resetAnimation(_chartAnimationPhase: _ModuleSupport.ChartAnimationPhase): void {}

    protected override computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | _Scene.Path | undefined {
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

    override getLabelData(): _Util.PointLabelDatum[] {
        return [];
    }

    override getSeriesDomain(_direction: _ModuleSupport.ChartAxisDirection): any[] {
        return [NaN, NaN];
    }

    override pickNodeClosestDatum({ x, y }: _Scene.Point): _ModuleSupport.SeriesNodePickMatch | undefined {
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

    override getLegendData(
        _legendType: unknown
    ): _ModuleSupport.CategoryLegendDatum[] | _ModuleSupport.GradientLegendDatum[] {
        return [];
    }
}
