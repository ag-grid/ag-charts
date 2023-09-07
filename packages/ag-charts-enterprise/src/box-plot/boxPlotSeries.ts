import type {
    _Scene,
    AgBoxPlotSeriesFormat,
    AgBoxPlotSeriesFormatterParams,
    AgCartesianSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { BoxPlotGroup } from './boxPlotGroup';
import type { BoxPlotNodeDatum } from './boxPlotTypes';

const {
    CartesianSeries,
    ChartAxisDirection,
    keyProperty,
    NUMBER,
    OPT_COLOR_STRING,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_STRING,
    SeriesNodePickMode,
    SeriesTooltip,
    Validate,
    valueProperty,
} = _ModuleSupport;

class BoxPlotSeriesCap {
    @Validate(NUMBER(0, 1))
    lengthRatio = 0.5;
}

class BoxPlotSeriesWhisker {
    @Validate(OPT_COLOR_STRING)
    stroke?: string;

    @Validate(NUMBER(0))
    strokeWidth?: number;

    @Validate(NUMBER(0, 1))
    strokeOpacity?: number;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[];

    @Validate(NUMBER(0))
    lineDashOffset?: number;
}

export class BoxPlotSeries extends CartesianSeries<
    _ModuleSupport.SeriesNodeDataContext<BoxPlotNodeDatum>,
    BoxPlotGroup
> {
    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

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
    lineDash: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgBoxPlotSeriesFormatterParams<BoxPlotNodeDatum>) => AgBoxPlotSeriesFormat = undefined;

    cap = new BoxPlotSeriesCap();

    whisker = new BoxPlotSeriesWhisker();

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
        const { xKey, minKey, q1Key, medianKey, q3Key, maxKey, data = [] } = this;

        if (!xKey || !minKey || !q1Key || !medianKey || !q3Key || !maxKey) return;

        const { dataModel, processedData } = await dataController.request(this.id, data, {
            props: [
                keyProperty(this, xKey, false, { id: `xValue` }),
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
            const { index } = dataModel.resolveProcessedDataIndexById(this, `xValue`);
            return processedData.domain.keys[index];
        }
    }

    async createNodeData() {
        const {
            visible,
            dataModel,
            axes: { [ChartAxisDirection.X]: xAxis, [ChartAxisDirection.Y]: yAxis },
        } = this;

        if (!(dataModel && visible && xAxis && yAxis)) {
            return [];
        }

        const {
            xKey = '',
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cap,
            whisker,
        } = this;

        const context: _ModuleSupport.SeriesNodeDataContext<BoxPlotNodeDatum> = {
            itemId: xKey,
            nodeData: [],
            labelData: [],
        };

        const defs = dataModel.resolveProcessedDataDefsByIds(this, [
            'xValue',
            'minValue',
            'q1Value',
            `medianValue`,
            `q3Value`,
            `maxValue`,
        ]);

        this.processedData?.data.forEach(({ datum, keys, values }) => {
            const { xValue, minValue, q1Value, medianValue, q3Value, maxValue } =
                dataModel.resolveProcessedDataDefsValues(defs, { keys, values });

            if (minValue > q1Value || q1Value > medianValue || medianValue > q3Value || q3Value > maxValue) {
                return;
            }

            const nodeData: BoxPlotNodeDatum = {
                series: this,
                itemId: xValue,
                datum,
                xKey,
                yValue: 0,
                bandwidth: Math.round(yAxis.scale.bandwidth ?? 0),
                ...this.convertValuesToScaleByDefs(defs, { xValue, minValue, q1Value, medianValue, q3Value, maxValue }),
                cap,
                whisker,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            };

            context.nodeData.push(nodeData);
        });

        return [context];
    }

    getLegendData(): _ModuleSupport.ChartLegendDatum[] {
        return [];
    }

    getTooltipHtml(_seriesDatum: any): string {
        return '';
    }

    protected isLabelEnabled(): boolean {
        return false;
    }

    protected async updateDatumSelection(opts: {
        nodeData: BoxPlotNodeDatum[];
        datumSelection: _Scene.Selection<BoxPlotGroup, BoxPlotNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data);
    }

    protected async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<BoxPlotGroup, BoxPlotNodeDatum>;
        isHighlight: boolean;
    }) {
        opts.datumSelection.each((boxPlot, datum) => {
            let format: AgBoxPlotSeriesFormat | undefined;
            if (this.formatter) {
                format = this.formatter({
                    ...datum,
                    seriesId: this.id,
                    highlighted: false,
                });
            }
            boxPlot.updateDatumStyles(datum, format);
        });
    }

    protected async updateLabelNodes(_opts: {
        labelSelection: _Scene.Selection<_Scene.Text, BoxPlotNodeDatum>;
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
        return new BoxPlotGroup();
    }

    getBandScalePadding() {
        return { inner: 0.2, outer: 0.3 };
    }

    convertValuesToScaleByDefs<T extends string>(
        defs: [string, _ModuleSupport.ProcessedDataDef[]][],
        values: Record<T, unknown>
    ): Record<T, number> {
        const { [ChartAxisDirection.X]: xAxis, [ChartAxisDirection.Y]: yAxis } = this.axes;
        if (!(xAxis && yAxis)) {
            throw new Error('Axes must be defined');
        }
        const result: Record<string, number> = {};
        for (const [searchId, [{ def }]] of defs) {
            if (Object.prototype.hasOwnProperty.call(values, searchId)) {
                const { scale } = def.type === 'key' ? yAxis : xAxis;
                result[searchId] = Math.round(scale.convert((values as any)[searchId], { strict: false }));
            }
        }
        return result;
    }
}
