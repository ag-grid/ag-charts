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

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 1,
            hasHighlightedLabels: true,
        });
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

    getDomain(direction: _ModuleSupport.ChartAxisDirection) {
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

            if (minValue > q1Value || q1Value > medianValue || medianValue > q3Value || q3Value > maxValue) {
                return;
            }

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
        return datumSelection.update(data);
    }

    protected async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Group, BoxPlotNodeDatum>;
        isHighlight: boolean;
    }) {
        opts.datumSelection.each((group, datum) => {
            const {
                bandwidth,
                minValue,
                q1Value,
                medianValue,
                q3Value,
                maxValue,
                yValue,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            } = datum;

            const selection = _Scene.Selection.select(group, _Scene.Rect);
            const boxes = selection.selectByTag<_Scene.Rect>(GroupTags.Box);
            const [outline] = selection.selectByTag<_Scene.Rect>(GroupTags.Outline);
            const [median] = selection.selectByTag<_Scene.Line>(GroupTags.Median);
            const whiskers = selection.selectByTag<_Scene.Line>(GroupTags.Whisker);
            const caps = selection.selectByTag<_Scene.Line>(GroupTags.Cap);

            outline.setStyles({ x: q1Value, y: yValue, width: q3Value - q1Value, height: bandwidth });

            boxes[0].setStyles({
                x: q1Value,
                y: yValue,
                width: Math.round(medianValue - q1Value + strokeWidth / 2),
                height: bandwidth,
            });

            boxes[1].setStyles({
                x: Math.round(medianValue - strokeWidth / 2),
                y: yValue,
                width: Math.floor(q3Value - medianValue + strokeWidth / 2),
                height: bandwidth,
            });

            median.setStyles({
                x: medianValue,
                y1: yValue + strokeWidth,
                y2: yValue + bandwidth - strokeWidth,
            });

            const capSize = 0.5;
            const capY1 = yValue + bandwidth * capSize * 0.5;
            const capY2 = yValue + bandwidth * capSize * 1.5;

            caps[0].setStyles({ x: minValue, y1: capY1, y2: capY2 });
            caps[1].setStyles({ x: maxValue, y1: capY1, y2: capY2 });

            whiskers[0].setStyles({
                x1: Math.round(minValue + strokeWidth / 2),
                x2: q1Value,
                y: yValue + bandwidth * 0.5,
            });

            whiskers[1].setStyles({
                x1: q3Value,
                x2: Math.round(maxValue - strokeWidth / 2),
                y: yValue + bandwidth * 0.5,
            });

            // fill only elements
            for (const element of boxes) {
                element.fill = fill;
                element.fillOpacity = fillOpacity;
                element.strokeWidth = strokeWidth * 2;
                element.strokeOpacity = 0;
            }

            // stroke only elements
            for (const element of [outline, median, ...whiskers, ...caps]) {
                element.fillOpacity = 0;
                element.stroke = stroke;
                element.strokeWidth = strokeWidth;
                element.strokeOpacity = strokeOpacity;
                element.lineDash = lineDash;
                element.lineDashOffset = lineDashOffset;
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
        group.append([
            new _Scene.Rect({ tag: GroupTags.Box }),
            new _Scene.Rect({ tag: GroupTags.Box }),
            new _Scene.Rect({ tag: GroupTags.Outline }),
            new _Scene.Line({ tag: GroupTags.Median }),
            new _Scene.Line({ tag: GroupTags.Whisker }),
            new _Scene.Line({ tag: GroupTags.Whisker }),
            new _Scene.Line({ tag: GroupTags.Cap }),
            new _Scene.Line({ tag: GroupTags.Cap }),
        ]);
        return group;
    }

    getBandScalePadding() {
        return { inner: 0.2, outer: 0.3 };
    }
}
