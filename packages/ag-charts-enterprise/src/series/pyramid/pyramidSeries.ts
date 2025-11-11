import {
    type AgPyramidSeriesLabelFormatterParams,
    type AgPyramidSeriesOptions,
    type AgPyramidSeriesStyle,
    type TextOrSegments,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type Point,
    StateMachine,
    type Writeable,
    cachedTextMeasurer,
    isArray,
    measureTextSegments,
    mergeDefaults,
    toPlainText,
} from 'ag-charts-core';

import { FunnelConnector } from '../funnel/funnelConnector';
import { PyramidProperties } from './pyramidProperties';
import { applyPyramidDatum, preparePyramidAnimationFunctions } from './pyramidUtil';

const {
    valueProperty,
    SeriesNodePickMode,
    createDatumId,
    BBox,
    Group,
    Selection,
    Text,
    PointerEvents,
    applyShapeStyle,
    fromToMotion,
    seriesLabelFadeInAnimation,
    getLabelStyles,
} = _ModuleSupport;

type PyramidNodeLabelDatum = Readonly<Point> & {
    readonly text: TextOrSegments;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    readonly visible: boolean;
};

interface PyramidNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum, Readonly<Point> {
    readonly itemId: string;
    readonly index: number;
    readonly xValue: string;
    readonly yValue: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
    readonly label: PyramidNodeLabelDatum | undefined;
    style: AgPyramidSeriesStyle;
}

interface PyramidNodeDataContext
    extends _ModuleSupport.DataModelSeriesNodeDataContext<PyramidNodeDatum, PyramidNodeLabelDatum> {
    stageLabelData: PyramidNodeLabelDatum[] | undefined;
    bounds: _ModuleSupport.BBox;
}

type PyramidAnimationState = 'empty' | 'ready';
type PyramidAnimationEvent = {
    update: undefined;
    clear: undefined;
    reset: undefined;
    skip: undefined;
};

export class PyramidSeries extends _ModuleSupport.DataModelSeries<
    PyramidNodeDatum,
    AgPyramidSeriesOptions,
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
    private highlightLabelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, PyramidNodeLabelDatum> =
        Selection.select(this.highlightLabelGroup, Text);
    private highlightDatumSelection: _ModuleSupport.Selection<FunnelConnector, PyramidNodeDatum> = Selection.select(
        this.highlightNodeGroup,
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

        this.cleanup.register(this.ctx.eventsHub.on('legend:item-click', (event) => this.onLegendItemClick(event)));
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
        if (this.data == null) return;

        const {
            id: seriesId,
            visible,
            ctx: { legendManager },
        } = this;

        const { stageKey, valueKey } = this.properties;

        const xScaleType = 'category';
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

        const xDomain = dataModel.getDomain(this, 'xValue', 'value', processedData);
        const yDomain = dataModel.getDomain(this, 'yValue', 'value', processedData);

        const textMeasurer = cachedTextMeasurer(stageLabel);

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

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        for (const [datumIndex, datum] of rawData.entries()) {
            const xValue = xValues[datumIndex];
            const yValue = yValues[datumIndex];
            const enabled = visible && legendManager.getItemEnabled({ seriesId, itemId: datumIndex });

            yTotal += yValue;

            if (stageLabelData == null) continue;

            const text = this.getLabelText<AgPyramidSeriesLabelFormatterParams>(
                xValue,
                datum,
                stageKey,
                'x',
                xDomain,
                this.properties.stageLabel,
                { datum, value: yValue, stageKey, valueKey }
            );

            const { width, height } = isArray(text)
                ? measureTextSegments(text, label)
                : textMeasurer.measureLines(text);
            maxLabelWidth = Math.max(maxLabelWidth, width);
            maxLabelHeight = Math.max(maxLabelHeight, height);

            stageLabelData.push({
                x: Number.NaN,
                y: Number.NaN,
                text,
                textAlign,
                textBaseline,
                visible: enabled,
            });
        }

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
        for (const [datumIndex, datum] of rawData.entries()) {
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

            const text = this.getLabelText<AgPyramidSeriesLabelFormatterParams>(
                yValue,
                datum,
                valueKey,
                'y',
                yDomain,
                label,
                {
                    datum,
                    value: yValue,
                    stageKey,
                    valueKey,
                }
            );
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
                style: this.getItemStyle({ datumIndex, datum }, false),
            });

            yStart = yEnd;
        }

        return {
            itemId: seriesId,
            nodeData,
            labelData,
            stageLabelData,
            bounds,
        };
    }

    updateSelections() {
        if (this.nodeDataRefresh) {
            this.contextNodeData = this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    override update({ seriesRect }: { seriesRect?: _ModuleSupport.BBox }) {
        this.checkResize(seriesRect);

        const {
            datumSelection,
            labelSelection,
            stageLabelSelection,
            highlightDatumSelection,
            highlightLabelSelection,
        } = this;

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
        this.updateDatumStyles({ datumSelection, isHighlight: false });
        this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.labelSelection = this.updateLabelSelection({ labelData, labelSelection });
        this.updateLabelNodes({ labelSelection, labelProperties: this.properties.label });

        this.stageLabelSelection = this.updateStageLabelSelection({ stageLabelData, stageLabelSelection });
        this.updateLabelNodes({
            labelSelection: stageLabelSelection,
            labelProperties: this.properties.stageLabel,
        });

        const highlightLabelData = this.getHighlightLabelData(labelData, highlightedDatum) ?? [];
        this.highlightLabelSelection = highlightLabelSelection.update(highlightLabelData);
        this.updateLabelNodes({
            labelSelection: this.highlightLabelSelection,
            labelProperties: this.properties.label,
            isHighlight: true,
        });

        this.highlightDatumSelection = this.updateDatumSelection({
            nodeData: highlightedDatum == null ? [] : [highlightedDatum],
            datumSelection: highlightDatumSelection,
        });
        this.updateDatumStyles({ datumSelection: highlightDatumSelection, isHighlight: true });
        this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });

        this.animationState.transition('update');
    }

    private updateDatumSelection(opts: {
        nodeData: PyramidNodeDatum[];
        datumSelection: _ModuleSupport.Selection<FunnelConnector, PyramidNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData);
    }

    protected getItemStyle(
        { datumIndex, datum }: Partial<PyramidNodeDatum>,
        isHighlight: boolean
    ): Required<AgPyramidSeriesStyle> {
        const { properties } = this;
        const { itemStyler } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const baseStyle = mergeDefaults(highlightStyle, properties.getStyle(datumIndex));
        let style = baseStyle;

        if (itemStyler != null && datumIndex != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(datum, datumIndex, isHighlight, style);
                    return this.callWithContext(itemStyler, params);
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, style);
            }
        }

        return style;
    }

    private makeItemStylerParams(
        datum: unknown,
        datumIndex: number,
        isHighlight: boolean,
        style: Required<AgPyramidSeriesStyle>
    ) {
        const { id: seriesId, properties } = this;
        const { stageKey, valueKey } = properties;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum,
            stageKey,
            valueKey,
            highlighted: isHighlight,
            highlightState,
            ...style,
            fill,
        };
    }

    private updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<FunnelConnector, PyramidNodeDatum>;
        isHighlight: boolean;
    }) {
        datumSelection.each((_, nodeDatum) => {
            nodeDatum.style = this.getItemStyle(nodeDatum, isHighlight);
        });
    }

    private updateDatumNodes({
        datumSelection,
    }: {
        datumSelection: _ModuleSupport.Selection<FunnelConnector, PyramidNodeDatum>;
        isHighlight: boolean;
    }) {
        const { properties } = this;
        const { shadow } = properties;

        const bounds = this.contextNodeData?.bounds;
        const fillBBox: _ModuleSupport.ShapeFillBBox | undefined = bounds
            ? { series: bounds, axis: bounds }
            : undefined;

        datumSelection.each((connector, nodeDatum) => {
            applyShapeStyle(connector, nodeDatum.style, fillBBox);

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
        isHighlight?: boolean;
    }) {
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const { labelSelection, labelProperties, isHighlight = false } = opts;

        labelSelection.each((label, nodeDatum, datumIndex) => {
            const { visible, x, y, text, textAlign, textBaseline } = nodeDatum;
            const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);

            const style = getLabelStyles(
                this,
                undefined,
                this.properties,
                labelProperties,
                isHighlight,
                activeHighlight
            );

            const { color: fill, fontSize, fontStyle, fontWeight, fontFamily } = style;
            label.visible = visible;
            label.x = x;
            label.y = y;
            label.text = text;
            label.fill = fill;
            label.opacity = (highlightStyle.opacity ?? 1) * (style.fillOpacity ?? 1);
            label.fillOpacity = (highlightStyle.opacity ?? 1) * (style.fillOpacity ?? 1);
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;
            label.fontSize = fontSize;
            label.fontFamily = fontFamily;
            label.textAlign = textAlign;
            label.textBaseline = textBaseline;
            label.setBoxing(style);
        });
    }

    protected getHighlightLabelData(
        _labelData: PyramidNodeLabelDatum[],
        highlightedItem?: PyramidNodeDatum
    ): PyramidNodeLabelDatum[] | undefined {
        if (highlightedItem?.label) {
            return [{ ...highlightedItem.label }];
        }

        return undefined;
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

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const xValue = dataModel.resolveColumnById(this, 'xValue', processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData)[datumIndex];

        if (xValue == null) return;

        const label = this.getLabelText<AgPyramidSeriesLabelFormatterParams>(
            xValue,
            datum,
            stageKey,
            'x',
            dataModel.getDomain(this, 'xValue', 'value', processedData),
            this.properties.stageLabel,
            { datum, value: xValue, stageKey, valueKey }
        );

        const format = this.getItemStyle({ datumIndex, datum }, false);
        return this.formatTooltipWithContext(
            tooltip,
            {
                symbol: this.legendItemSymbol(datumIndex),
                data: [{ label: toPlainText(label), value: toPlainText(yValue) }],
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
        return [Number.NaN, Number.NaN];
    }

    override getSeriesRange(
        _direction: _ModuleSupport.ChartAxisDirection,
        _visibleRange: [any, any]
    ): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    override pickNodeClosestDatum({ x, y }: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        let minDistanceSquared = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum<_ModuleSupport.DatumIndexType> | undefined;

        this.datumSelection.each((node, datum) => {
            const distanceSquared = node.distanceSquared(x, y);
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
            }
        });

        return minDatum == null ? undefined : { datum: minDatum, distance: Math.sqrt(minDistanceSquared) };
    }

    private legendItemSymbol(datumIndex: number) {
        const { fills, strokes, strokeWidth, fillOpacity, strokeOpacity, lineDash, lineDashOffset } = this.properties;
        const fill = fills[datumIndex] ?? 'black';
        const stroke = strokes[datumIndex] ?? 'black';
        return {
            marker: {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
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

        if (!dataModel || !processedData || legendType !== 'category') {
            return [];
        }

        const { showInLegend } = this.properties;

        const legendData: _ModuleSupport.CategoryLegendDatum[] = [];
        const stageValues = dataModel.resolveColumnById<string>(this, `xValue`, processedData);

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        for (const [datumIndex] of rawData.entries()) {
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
        }

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

    protected override hasItemStylers(): boolean {
        return this.properties.itemStyler != null || this.properties.label.itemStyler != null;
    }
}
