import type { _Scale } from 'ag-charts-community';
import { _Scene, _Util, _ModuleSupport } from 'ag-charts-community';
import type { ErrorBarPoints, ErrorBarNodeProperties } from './errorBarNode';
import { ErrorBarNode } from './errorBarNode';
import { ERROR_BARS_THEME } from './errorBarTheme';

const { mergeDefaults, ChartAxisDirection, Validate, BOOLEAN, OPT_STRING, NUMBER } = _ModuleSupport;
type AnyScale = _Scale.Scale<any, any, any>;

type OptionalErrorBarNodeProperties = { [K in keyof ErrorBarNodeProperties]?: ErrorBarNodeProperties[K] };

class ErrorBarCapConfig implements OptionalErrorBarNodeProperties {
    @Validate(BOOLEAN)
    visible?: boolean = undefined;

    @Validate(OPT_STRING)
    stroke?: string = undefined;

    @Validate(NUMBER(1))
    strokeWidth?: number = undefined;

    @Validate(NUMBER(0, 1))
    strokeOpacity?: number = undefined;

    @Validate(NUMBER(0, 1))
    lengthRatio: number = 1;
}

export class ErrorBars
    extends _ModuleSupport.BaseModuleInstance
    implements _ModuleSupport.ModuleInstance, OptionalErrorBarNodeProperties
{
    @Validate(OPT_STRING)
    yLowerKey: string = '';

    @Validate(OPT_STRING)
    yLowerName?: string = undefined;

    @Validate(OPT_STRING)
    yUpperKey: string = '';

    @Validate(OPT_STRING)
    yUpperName?: string = undefined;

    @Validate(OPT_STRING)
    xLowerKey?: string = undefined;

    @Validate(OPT_STRING)
    xLowerName?: string = undefined;

    @Validate(OPT_STRING)
    xUpperKey?: string = undefined;

    @Validate(OPT_STRING)
    xUpperName?: string = undefined;

    @Validate(BOOLEAN)
    visible?: boolean = true;

    @Validate(OPT_STRING)
    stroke? = 'black';

    @Validate(NUMBER(1))
    strokeWidth?: number = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity?: number = 1;

    cap: ErrorBarCapConfig = new ErrorBarCapConfig();

    private readonly cartesianSeries: _ModuleSupport.CartesianSeries<any, any>;
    private readonly groupNode: _Scene.Group;
    private readonly selection: _Scene.Selection<ErrorBarNode>;
    private nodeData: (ErrorBarPoints | undefined)[] = [];

    constructor(ctx: _ModuleSupport.SeriesContext) {
        super();

        const supportedSeriesTypes = ['line', 'scatter'];
        if (!supportedSeriesTypes.includes(ctx.series.type)) {
            throw new Error(
                `AG Charts - unsupported series type '${
                    ctx.series.type
                }', error bars supported series types: ${supportedSeriesTypes.join(', ')}`
            );
        }
        this.cartesianSeries = ctx.series as _ModuleSupport.CartesianSeries<any, any>;
        const { contentGroup } = this.cartesianSeries;

        this.groupNode = new _Scene.Group({ name: `${contentGroup.id}-series-errorBars` });
        contentGroup.appendChild(this.groupNode);
        this.selection = _Scene.Selection.select(this.groupNode, () => this.errorBarFactory());

        this.destroyFns.push(this.cartesianSeries.addListener('data-model', (event) => this.onDataProcessed(event)));
    }

    onDataProcessed(event: {
        dataModel: _ModuleSupport.DataModel<any, any, any>;
        processedData: _ModuleSupport.ProcessedData<any>;
    }) {
        if (event.dataModel !== undefined && event.processedData !== undefined) {
            this.createNodeData(event.dataModel, event.processedData);
            this.update();
        }
    }

    createNodeData(
        dataModel: _ModuleSupport.DataModel<any, any, any>,
        processedData: _ModuleSupport.ProcessedData<any>
    ) {
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey, nodeData } = this;
        const xIndex = dataModel?.resolveProcessedDataIndexById(this.cartesianSeries, `xValue`).index;
        const yIndex = dataModel?.resolveProcessedDataIndexById(this.cartesianSeries, `yValue`).index;
        const xScale = this.cartesianSeries.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.cartesianSeries.axes[ChartAxisDirection.Y]?.scale;
        if (!xScale || !yScale || !yLowerKey || !yUpperKey || xIndex === undefined) {
            return;
        }

        nodeData.length = processedData.data.length;

        for (let i = 0; i < processedData.data.length; i++) {
            const { datum, values } = processedData.data[i];
            const xDatum = values[xIndex];
            const yDatum = values[yIndex];

            if (yLowerKey in datum && yUpperKey in datum) {
                let xPoints = undefined;
                if (this.cartesianSeries.type == 'scatter') {
                    if (xLowerKey !== undefined && xLowerKey in datum && xUpperKey != undefined && xUpperKey in datum) {
                        xPoints = this.calculatePoints(
                            xScale,
                            datum[xLowerKey],
                            datum[xUpperKey],
                            yScale,
                            yDatum,
                            yDatum
                        );
                    } else {
                        throw new Error(
                            `AG Charts - series type 'scatter' requires xLowerKey (= ${xLowerKey}) and xUpperKey (= ${xUpperKey}) to exist in all data points`
                        );
                    }
                }
                nodeData[i] = {
                    xBar: xPoints,
                    yBar: this.calculatePoints(xScale, xDatum, xDatum, yScale, datum[yLowerKey], datum[yUpperKey]),
                };
            } else {
                nodeData[i] = undefined;
            }
        }
    }

    private calculatePoints(xScale: AnyScale, xLower: any, xUpper: any, yScale: AnyScale, yLower: any, yUpper: any) {
        return {
            lowerPoint: this.calculatePoint(xScale, xLower, yScale, yLower),
            upperPoint: this.calculatePoint(xScale, xUpper, yScale, yUpper),
        };
    }

    private calculatePoint(xScale: AnyScale, x: any, yScale: AnyScale, y: any) {
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        return { x: xScale.convert(x) + xOffset, y: yScale.convert(y) + yOffset };
    }

    update() {
        this.selection.update(this.nodeData, undefined, undefined);
        this.selection.each((node, datum, i) => this.updateNode(node, datum, i));
    }

    private updateNode(node: ErrorBarNode, _datum: any, index: number) {
        const { nodeData } = this;
        const points = nodeData[index];
        if (points) {
            const defaults: ErrorBarNodeProperties = ERROR_BARS_THEME.errorBar;
            const whiskerProps = mergeDefaults(this, defaults);
            const capProps = mergeDefaults(this.cap, whiskerProps);
            node.update(points, whiskerProps, capProps);
        }
    }

    private errorBarFactory(): ErrorBarNode {
        return new ErrorBarNode();
    }
}
