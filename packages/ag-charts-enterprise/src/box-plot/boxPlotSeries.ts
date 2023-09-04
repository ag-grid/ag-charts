import type { AgCartesianSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';

const {
    CartesianSeries,
    ChartAxisDirection,
    keyProperty,
    NUMBER,
    OPT_COLOR_STRING,
    OPT_STRING,
    OPT_LINE_DASH,
    SeriesNodePickMode,
    SeriesTooltip,
    Validate,
    valueProperty,
} = _ModuleSupport;

enum GroupTags {
    Box,
    Median,
    Outline,
    Whisker,
    Cap,
}

interface BoxPlotNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly index: number;
    readonly xValue: number;
    readonly bandwidth: number;

    readonly yValue: number;
    readonly minValue: number;
    readonly q1Value: number;
    readonly medianValue: number;
    readonly q3Value: number;
    readonly maxValue: number;

    readonly fill: string;
    readonly fillOpacity: number;
    readonly stroke: string;
    readonly strokeWidth: number;
    readonly strokeOpacity: number;
    readonly lineDash: number[];
    readonly lineDashOffset: number;
}

export class BoxPlotSeries extends CartesianSeries<_ModuleSupport.SeriesNodeDataContext<BoxPlotNodeDatum>> {
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

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(OPT_COLOR_STRING)
    stroke: string = '#333';

    @Validate(NUMBER(0))
    strokeWidth: number = 3;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    tooltip = new SeriesTooltip<AgCartesianSeriesTooltipRendererParams>();

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

        const {
            yKey = '',
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            processedData,
        } = this;

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

            const nodeData: BoxPlotNodeDatum = {
                index: dataIndex,
                datum: seriesDatum,
                series: this,
                itemId: yKey,
                xKey: '',
                xValue: 0,
                yKey,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash: lineDash ?? [0],
                lineDashOffset,
                bandwidth: yAxis.scale.bandwidth ?? 0,
                yValue: Math.round(yAxis.scale.convert(yValue, { strict: false })),
                minValue: Math.round(xAxis.scale.convert(minValue, { strict: false })),
                q1Value: Math.round(xAxis.scale.convert(q1Value, { strict: false })),
                medianValue: Math.round(xAxis.scale.convert(medianValue, { strict: false })),
                q3Value: Math.round(xAxis.scale.convert(q3Value, { strict: false })),
                maxValue: Math.round(xAxis.scale.convert(maxValue, { strict: false })),
            };

            context.nodeData.push(nodeData);
        });

        return [context];
    }

    async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        const { yKey, minKey, q1Key, medianKey, q3Key, maxKey, data = [] } = this;

        if (!yKey || !minKey || !q1Key || !medianKey || !q3Key || !maxKey) return;

        const { dataModel, processedData } = await dataController.request(this.id, data, {
            props: [
                keyProperty(this, yKey, false, { id: `yValue` }),
                valueProperty(this, minKey, true, { id: `minValue` }),
                valueProperty(this, q1Key, true, { id: `q1Value` }),
                valueProperty(this, medianKey, true, { id: `medianValue` }),
                valueProperty(this, q3Key, true, { id: `q3Value` }),
                valueProperty(this, maxKey, true, { id: `maxValue` }),
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
        datumSelection: _Scene.Selection<_Scene.Group, BoxPlotNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(
            data.filter(
                (datum) =>
                    datum.minValue <= datum.q1Value &&
                    datum.q1Value <= datum.medianValue &&
                    datum.medianValue <= datum.q3Value &&
                    datum.q3Value <= datum.maxValue
            )
        );
    }

    protected async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Group, BoxPlotNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection } = opts;

        datumSelection.each((group, datum) => {
            const selection = _Scene.Selection.select(group, _Scene.Rect);
            const [outline] = selection.selectByTag<_Scene.Rect>(GroupTags.Outline);
            const boxes = selection.selectByTag<_Scene.Rect>(GroupTags.Box);
            const [median] = selection.selectByTag<_Scene.Line>(GroupTags.Median);
            const whiskers = selection.selectByTag<_Scene.Line>(GroupTags.Whisker);
            const caps = selection.selectByTag<_Scene.Line>(GroupTags.Cap);

            // TODO cleanup; preferably with generic methods
            outline.x = datum.q1Value;
            outline.y = datum.yValue;
            outline.width = datum.q3Value - datum.q1Value;
            outline.height = datum.bandwidth;

            boxes[0].x = datum.q1Value;
            boxes[0].y = datum.yValue;
            boxes[0].width = Math.round(datum.medianValue - datum.q1Value + datum.strokeWidth / 2);
            boxes[0].height = datum.bandwidth;

            boxes[1].x = Math.round(datum.medianValue - datum.strokeWidth / 2);
            boxes[1].y = datum.yValue;
            boxes[1].width = Math.floor(datum.q3Value - datum.medianValue + datum.strokeWidth / 2);
            boxes[1].height = datum.bandwidth;

            median.x1 = median.x2 = datum.medianValue;
            median.y1 = datum.yValue + datum.strokeWidth;
            median.y2 = datum.yValue + datum.bandwidth - datum.strokeWidth;

            caps[0].x1 = caps[0].x2 = datum.minValue;
            caps[1].x1 = caps[1].x2 = datum.maxValue;
            caps[0].y1 = caps[1].y1 = datum.yValue + datum.bandwidth * 0.25;
            caps[0].y2 = caps[1].y2 = datum.yValue + datum.bandwidth * 0.75;

            whiskers[0].x1 = Math.round(datum.minValue + datum.strokeWidth / 2);
            whiskers[0].x2 = datum.q1Value;
            whiskers[1].x1 = datum.q3Value;
            whiskers[1].x2 = Math.round(datum.maxValue - datum.strokeWidth / 2);
            whiskers[0].y1 = whiskers[0].y2 = whiskers[1].y1 = whiskers[1].y2 = datum.yValue + datum.bandwidth * 0.5;

            outline.fillOpacity = 0;

            boxes[0].fill = boxes[1].fill = datum.fill;
            boxes[0].fillOpacity = boxes[1].fillOpacity = datum.fillOpacity;
            boxes[0].strokeWidth = boxes[1].strokeWidth = datum.strokeWidth * 2;
            boxes[0].strokeOpacity = boxes[1].strokeOpacity = 0;

            // elements with stroke
            for (const element of [outline, median, ...whiskers, ...caps]) {
                element.stroke = datum.stroke;
                element.strokeWidth = datum.strokeWidth;
                element.strokeOpacity = datum.strokeOpacity;
                element.lineDash = datum.lineDash;
                element.lineDashOffset = datum.lineDashOffset;
            }
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

    protected nodeFactory() {
        const group = new _Scene.Group({ layer: true });
        const nodes = [
            new _Scene.Rect(),
            new _Scene.Rect(),
            new _Scene.Rect(),
            new _Scene.Line(),
            new _Scene.Line(),
            new _Scene.Line(),
            new _Scene.Line(),
            new _Scene.Line(),
        ];
        // TODO move tags to Shape constructor?
        nodes[0].tag = nodes[1].tag = GroupTags.Box;
        nodes[2].tag = GroupTags.Outline;
        nodes[3].tag = GroupTags.Median;
        nodes[4].tag = nodes[5].tag = GroupTags.Whisker;
        nodes[6].tag = nodes[7].tag = GroupTags.Cap;
        group.append(nodes);
        return group;
    }
}
