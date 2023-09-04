import type { AgCartesianSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene } from 'ag-charts-community';

const {
    CartesianSeries,
    ChartAxisDirection,
    keyProperty,
    NUMBER,
    OPT_COLOR_STRING,
    OPT_STRING,
    SeriesNodePickMode,
    SeriesTooltip,
    Validate,
    valueProperty,
    updateRect,
} = _ModuleSupport;

interface BoxPlotNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum, Readonly<_Scene.Point> {
    readonly index: number;
    readonly xValue: number;
    readonly yValue: number;
    // readonly cumulativeValue: number;
    readonly width: number;
    readonly height: number;

    readonly fill: string;
    readonly stroke: string;
    readonly strokeWidth: number;
    // readonly label?: BarNodeLabelDatum;
}

export class BoxPlotSeries extends CartesianSeries<
    _ModuleSupport.SeriesNodeDataContext<BoxPlotNodeDatum>,
    _Scene.Rect
> {
    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 1,
            hasHighlightedLabels: true,
        });
    }

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    @Validate(OPT_STRING)
    minKey?: string = undefined;

    @Validate(OPT_STRING)
    minName?: string = undefined;

    @Validate(OPT_STRING)
    q1Key?: string = undefined;

    @Validate(OPT_STRING)
    q1Name?: string = undefined;

    @Validate(OPT_STRING)
    medianKey?: string = undefined;

    @Validate(OPT_STRING)
    medianName?: string = undefined;

    @Validate(OPT_STRING)
    q3Key?: string = undefined;

    @Validate(OPT_STRING)
    q3Name?: string = undefined;

    @Validate(OPT_STRING)
    maxKey?: string = undefined;

    @Validate(OPT_STRING)
    maxName?: string = undefined;

    @Validate(OPT_COLOR_STRING)
    fill: string = '#c16068';

    @Validate(OPT_COLOR_STRING)
    stroke: string = '#874349';

    @Validate(NUMBER(0))
    strokeWidth: number = 1;

    tooltip = new SeriesTooltip<AgCartesianSeriesTooltipRendererParams>();

    /**
     * Used to get the position of bars within each group.
     */
    private groupScale = new _Scale.BandScale<string>();

    getBandScalePadding() {
        return { inner: 0.2, outer: 0.3 };
    }

    async createNodeData() {
        const { visible, dataModel } = this;

        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        if (!(dataModel && visible && xAxis && yAxis)) {
            return [];
        }

        const { yKey = '', fill, stroke, strokeWidth, groupScale, processedData, ctx } = this;

        const domain = [];
        const { index: groupIndex, visibleGroupCount } = ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
        for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
            domain.push(String(groupIdx));
        }
        groupScale.domain = domain;

        // eslint-disable-next-line no-console
        console.log({ xAxis, yAxis, groupIndex, groupScale });

        const context: _ModuleSupport.SeriesNodeDataContext<BoxPlotNodeDatum> = {
            itemId: yKey,
            nodeData: [],
            labelData: [],
        };

        const yValueIndex = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
        const minValueIndex = dataModel.resolveProcessedDataIndexById(this, `minValue`).index;
        const q1ValueIndex = dataModel.resolveProcessedDataIndexById(this, `q1Value`).index;
        const medianValueIndex = dataModel.resolveProcessedDataIndexById(this, `medianValue`).index;
        const q3ValueIndex = dataModel.resolveProcessedDataIndexById(this, `q3Value`).index;
        const maxValueIndex = dataModel.resolveProcessedDataIndexById(this, `maxValue`).index;

        processedData?.data.forEach(({ keys, datum: seriesDatum, values }, dataIndex) => {
            const yValue = keys[yValueIndex];
            const minValue = values[minValueIndex];
            const q1Value = values[q1ValueIndex];
            const medianValue = values[medianValueIndex];
            const q3Value = values[q3ValueIndex];
            const maxValue = values[maxValueIndex];

            const low = Math.round(xAxis.scale.convert(minValue, { strict: false }));
            const high = Math.round(xAxis.scale.convert(maxValue, { strict: false }));

            // eslint-disable-next-line no-console
            console.log(dataIndex, yValue, [minValue, q1Value, medianValue, q3Value, maxValue], { low, high });

            const nodeData: BoxPlotNodeDatum = {
                index: dataIndex,
                datum: seriesDatum,
                series: this,
                itemId: yKey,
                width: high - low,
                height: yAxis.scale.bandwidth ?? 0,
                x: low,
                y: Math.round(yAxis.scale.convert(yValue)),
                xKey: '',
                xValue: 0,
                yKey,
                yValue,
                fill,
                stroke,
                strokeWidth,
            };

            context.nodeData.push(nodeData);
        });

        // eslint-disable-next-line no-console
        console.log('createNodeData', context);
        return [context];
    }

    async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        // eslint-disable-next-line no-console
        console.log('processData');
        const { yKey, minKey, q1Key, medianKey, q3Key, maxKey, data = [] } = this;

        if (!yKey || !minKey || !q1Key || !medianKey || !q3Key || !maxKey) return;

        // eslint-disable-next-line no-console
        console.log(yKey, data);

        const { dataModel, processedData } = await dataController.request(this.id, data, {
            props: [
                keyProperty(this, yKey, false, { id: `yValue` }), // Raw value pass-through.
                valueProperty(this, minKey, true, { id: `minValue` }), // Raw value pass-through.
                valueProperty(this, q1Key, true, { id: `q1Value` }), // Raw value pass-through.
                valueProperty(this, medianKey, true, { id: `medianValue` }), // Raw value pass-through.
                valueProperty(this, q3Key, true, { id: `q3Value` }), // Raw value pass-through.
                valueProperty(this, maxKey, true, { id: `maxValue` }), // Raw value pass-through.
            ],
            dataVisible: this.visible,
        });

        this.dataModel = dataModel;
        this.processedData = processedData;
    }

    // @ts-ignore
    getDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel)) return [];

        if (direction === ChartAxisDirection.X) {
            const minValues = dataModel.getDomain(this, `minValue`, 'value', processedData);
            const maxValues = dataModel.getDomain(this, `maxValue`, 'value', processedData);

            return this.fixNumericExtent(
                [Math.min(...minValues), Math.max(...maxValues)],
                this.axes[ChartAxisDirection.X]
            );
        } else {
            const yValueIndex = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
            return processedData.domain.keys[yValueIndex];
        }
    }

    protected nodeFactory() {
        return new _Scene.Rect();
    }

    getLegendData(): _ModuleSupport.ChartLegendDatum[] {
        return [];
    }

    // @ts-ignore
    getTooltipHtml(seriesDatum: any): string {
        return '';
    }

    protected isLabelEnabled(): boolean {
        return false;
    }

    protected async updateDatumSelection(opts: {
        nodeData: BoxPlotNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, BoxPlotNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data);
    }

    protected async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, BoxPlotNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection } = opts;
        datumSelection.each((rect, datum) => {
            const config: _ModuleSupport.RectConfig = {
                fill: datum.fill,
                stroke: datum.stroke,
                strokeWidth: datum.strokeWidth,
                fillOpacity: 1,
                strokeOpacity: 1,
                lineDash: [],
                lineDashOffset: 0,
            };

            rect.x = datum.x;
            rect.y = datum.y;
            rect.width = datum.width;
            rect.height = datum.height;

            updateRect({ rect, config });
        });
    }

    // @ts-ignore
    protected async updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, _ModuleSupport.SeriesNodeDataContext<any>>;
        seriesIdx: number;
    }) {}

    protected async updateLabelSelection(opts: {
        labelData: BoxPlotNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, BoxPlotNodeDatum>;
        seriesIdx: number;
    }) {
        const { labelData, labelSelection } = opts;
        return labelSelection.update(labelData);
    }
}
