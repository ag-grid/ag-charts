import {
    type AgGradientFill,
    type AgPyramidSeriesLabelFormatterParams,
    type AgPyramidSeriesStyle,
    _ModuleSupport,
} from 'ag-charts-community';

import { FunnelConnector } from '../funnel/funnelConnector';
import { PyramidProperties } from './pyramidProperties';
import { applyPyramidDatum, preparePyramidAnimationFunctions } from './pyramidUtil';

const {
    StateMachine,
    valueProperty,
    SeriesNodePickMode,
    CachedTextMeasurerPool,
    TextUtils,
    createDatumId,
    BBox,
    Group,
    Selection,
    Text,
    PointerEvents,
    applyShapeStyle,
    fromToMotion,
    seriesLabelFadeInAnimation,
    isGradientFill,
} = _ModuleSupport;

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

type PyramidNodeLabelDatum = Readonly<_ModuleSupport.Point> & {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    readonly visible: boolean;
};

interface PyramidNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum, Readonly<_ModuleSupport.Point> {
    readonly index: number;
    readonly xValue: string;
    readonly yValue: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
    readonly label: PyramidNodeLabelDatum | undefined;
}

interface PyramidNodeDataContext
    extends _ModuleSupport.DataModelSeriesNodeDataContext<PyramidNodeDatum, PyramidNodeLabelDatum> {
    stageLabelData: PyramidNodeLabelDatum[] | undefined;
}

type ItemStyle = Pick<AgPyramidSeriesStyle, 'fill' | 'stroke'> &
    Required<Omit<AgPyramidSeriesStyle, 'fill' | 'stroke'>>;

type PyramidAnimationState = 'empty' | 'ready';
type PyramidAnimationEvent = {
    update: undefined;
    clear: undefined;
    reset: undefined;
    skip: undefined;
};

export class PyramidSeries extends _ModuleSupport.DataModelSeries<
    PyramidNodeDatum,
    PyramidProperties,
    PyramidNodeLabelDatum,
    PyramidNodeDataContext
> {
    static readonly className = 'PyramidSeries';
    static readonly type = 'pyramid' as const;

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

    private readonly animationState = new StateMachine<PyramidAnimationState, PyramidAnimationEvent>(
        'empty',
        {
            empty: {
                update: {
                    target: 'ready',
                    action: () => this.animateEmptyUpdateReady(),
                },
                reset: 'empty',
                skip: 'ready',
            },
            ready: {
                clear: 'empty',
                reset: 'empty',
                skip: 'ready',
            },
        },
        () => this.checkProcessedDataAnimatable()
    );

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            categoryKey: undefined,
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

    override resetAnimation(phase: _ModuleSupport.ChartAnimationPhase): void {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        } else if (phase === 'ready') {
            this.animationState.transition('skip');
        }
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

    override createNodeData() {
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
            direction,
            reverse = direction === 'horizontal',
            spacing,
            aspectRatio,
            label,
            stageLabel,
        } = properties;

        if (dataModel == null || processedData == null) return;

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

        const rawData = processedData.dataSources.get(this.id) ?? [];
        rawData.forEach((datum, datumIndex) => {
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
        const totalSpacing = spacing * (processedData.input.count - 1);

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
        rawData.forEach((datum, datumIndex) => {
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

            nodeData.push({
                series: this,
                itemId: valueKey,
                datum,
                datumIndex,
                index: datumIndex,
                xValue,
                yValue,
                x,
                y,
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

    updateSelections() {
        if (this.nodeDataRefresh) {
            this.contextNodeData = this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    protected override getFillBBox(fill?: AgGradientFill | string | undefined) {
        if (!isGradientFill(fill)) {
            return;
        }

        const { bounds = 'item' } = fill;

        if (bounds === 'item') {
            return;
        }

        const width = this._nodeDataDependencies?.seriesRectWidth ?? 0;
        const height = this._nodeDataDependencies?.seriesRectHeight ?? 0;
        return new BBox(0, 0, width, height);
    }

    override update({ seriesRect }: { seriesRect?: _ModuleSupport.BBox }) {
        this.checkResize(seriesRect);

        const { datumSelection, labelSelection, stageLabelSelection, highlightDatumSelection } = this;

        this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity = this.getOpacity();

        let highlightedDatum: PyramidNodeDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
            highlightedDatum = undefined;
        }

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];
        const stageLabelData = this.contextNodeData?.stageLabelData ?? [];

        this.datumSelection = this.updateDatumSelection({ nodeData, datumSelection });
        this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.labelSelection = this.updateLabelSelection({ labelData, labelSelection });
        this.updateLabelNodes({ labelSelection, labelProperties: this.properties.label });

        this.stageLabelSelection = this.updateStageLabelSelection({ stageLabelData, stageLabelSelection });
        this.updateLabelNodes({
            labelSelection: stageLabelSelection,
            labelProperties: this.properties.stageLabel,
        });

        this.highlightDatumSelection = this.updateDatumSelection({
            nodeData: highlightedDatum != null ? [highlightedDatum] : [],
            datumSelection: highlightDatumSelection,
        });
        this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });

        this.animationState.transition('update');
    }

    private updateDatumSelection(opts: {
        nodeData: PyramidNodeDatum[];
        datumSelection: _ModuleSupport.Selection<FunnelConnector, PyramidNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData);
    }

    private getItemBaseStyle(highlighted: boolean): ItemStyle {
        const { properties } = this;
        const highlightStyle = highlighted ? properties.highlightStyle.item : undefined;

        return {
            fill: highlightStyle?.fill,
            fillOpacity: highlightStyle?.fillOpacity ?? properties.fillOpacity,
            stroke: highlightStyle?.stroke,
            strokeWidth: highlightStyle?.strokeWidth ?? this.getStrokeWidth(properties.strokeWidth),
            strokeOpacity: highlightStyle?.strokeOpacity ?? properties.strokeOpacity,
            lineDash: highlightStyle?.lineDash ?? properties.lineDash,
            lineDashOffset: highlightStyle?.lineDashOffset ?? properties.lineDashOffset,
        };
    }

    protected getItemStyleOverrides(
        datumId: string,
        datum: any,
        datumIndex: number,
        format: ItemStyle,
        highlighted: boolean
    ) {
        const { id: seriesId, properties } = this;
        const { fills, strokes, stageKey, valueKey, itemStyler } = properties;

        const fill = format.fill ?? fills[datumIndex % fills.length];
        const stroke = format.stroke ?? strokes[datumIndex % strokes.length];
        const overrides: Partial<ItemStyle> = {};

        if (!highlighted) {
            overrides.fill = fill;
            overrides.stroke = stroke;
        }

        if (itemStyler != null) {
            const itemStyle = this.cachedDatumCallback(
                createDatumId(datumId, highlighted ? 'highlight' : 'node'),
                () => {
                    return this.callWithContext(itemStyler, {
                        seriesId,
                        datum,
                        stageKey,
                        valueKey,
                        highlighted,
                        fill,
                        stroke,
                        ...format,
                    });
                }
            );

            Object.assign(overrides, itemStyle);
        }

        return overrides;
    }

    private updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<FunnelConnector, PyramidNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { properties } = this;
        const { shadow } = properties;

        const style = this.getItemBaseStyle(isHighlight);
        const { defaultColorRange } = this.properties;

        datumSelection.each((connector, nodeDatum) => {
            const { datumIndex, datum } = nodeDatum;
            const overrides = this.getItemStyleOverrides(String(datumIndex), datum, datumIndex, style, isHighlight);

            const fillBBox = this.getFillBBox(overrides.fill);

            applyShapeStyle(connector, { ...style, defaultColorRange }, overrides, fillBBox);

            applyPyramidDatum(connector, nodeDatum);

            connector.fillShadow = shadow;
        });
    }

    private updateLabelSelection(opts: {
        labelData: PyramidNodeLabelDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, PyramidNodeLabelDatum>;
    }) {
        return opts.labelSelection.update(this.properties.label.enabled ? opts.labelData : []);
    }

    private updateStageLabelSelection(opts: {
        stageLabelData: PyramidNodeLabelDatum[];
        stageLabelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, PyramidNodeLabelDatum>;
    }) {
        return opts.stageLabelSelection.update(opts.stageLabelData);
    }

    private updateLabelNodes(opts: {
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

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const { stageKey, valueKey, tooltip } = properties;

        if (!dataModel || !processedData) return;

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const xValue = dataModel.resolveColumnById(this, 'xValue', processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData)[datumIndex];

        if (xValue == null) return;

        const value = this.getLabelText(this.properties.stageLabel, {
            datum: processedData.dataSources.get(this.id)?.[datumIndex],
            value: yValue,
            stageKey,
            valueKey,
        });

        const format = this.getItemBaseStyle(false) as any as Required<ItemStyle>;
        Object.assign(format, this.getItemStyleOverrides(String(datumIndex), datumIndex, datumIndex, format, false));

        return tooltip.formatTooltip(
            this.properties,
            {
                symbol: this.legendItemSymbol(datumIndex),
                data: [
                    {
                        label: String(xValue),
                        value: value,
                    },
                ],
            },
            {
                seriesId,
                datum,
                title: undefined,
                stageKey,
                valueKey,
                ...format,
            }
        );
    }

    override getSeriesDomain(): any[] {
        return [NaN, NaN];
    }

    override getSeriesRange(
        _direction: _ModuleSupport.ChartAxisDirection,
        _visibleRange: [any, any]
    ): [number, number] {
        return [NaN, NaN];
    }

    override pickNodeClosestDatum({ x, y }: _ModuleSupport.Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        let minDistanceSquared = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum<unknown> | undefined;

        this.datumSelection.each((node, datum) => {
            const distanceSquared = node.distanceSquared(x, y);
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
            }
        });

        return minDatum != null ? { datum: minDatum, distance: Math.sqrt(minDistanceSquared) } : undefined;
    }

    private legendItemSymbol(datumIndex: number) {
        const { fills, strokes, strokeWidth, fillOpacity, strokeOpacity, lineDash, lineDashOffset, defaultColorRange } =
            this.properties;
        const fill = fills[datumIndex % fills.length] ?? 'black';
        const stroke = strokes[datumIndex % strokes.length] ?? 'black';
        return {
            marker: {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                defaultColorRange,
            },
        };
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

        const { showInLegend } = this.properties;

        const legendData: _ModuleSupport.CategoryLegendDatum[] = [];
        const stageValues = dataModel.resolveColumnById<string>(this, `xValue`, processedData);

        const rawData = processedData.dataSources.get(this.id) ?? [];
        rawData.forEach((_datum, datumIndex) => {
            const stageValue = stageValues[datumIndex];

            legendData.push({
                legendType: 'category',
                id: seriesId,
                itemId: datumIndex,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId: datumIndex }),
                label: { text: stageValue },
                symbol: this.legendItemSymbol(datumIndex),
                hideInLegend: !showInLegend,
            });
        });

        return legendData;
    }

    protected animateReset() {
        this.ctx.animationManager.skipCurrentBatch();
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
    }

    private animateEmptyUpdateReady() {
        const { datumSelection, labelSelection, properties } = this;

        const fns = preparePyramidAnimationFunctions(properties.direction);
        fromToMotion(this.id, 'nodes', this.ctx.animationManager, [datumSelection], fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }
}
