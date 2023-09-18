import type { _Scale} from 'ag-charts-community';
import { _Scene, _Util, _ModuleSupport } from 'ag-charts-community';

const { ChartAxisDirection, Validate, OPT_STRING } = _ModuleSupport;

type CartesianSeries<
    C extends _ModuleSupport.SeriesNodeDataContext<any, any>,
    N extends _Scene.Node
> = _ModuleSupport.CartesianSeries<C, N>;

export interface ErrorBarPoints {
    readonly yLowerPoint: _Scene.Point;
    readonly yUpperPoint: _Scene.Point;
}

export class ErrorBarNode extends _Scene.Path {
    public points: ErrorBarPoints = { yLowerPoint: { x: 0, y: 0 }, yUpperPoint: { x: 0, y: 0 } };

    updatePath() {
        // TODO(olegat) implement, this is just placeholder draw code
        const { path } = this;
        this.fill = 'black';
        this.stroke = 'black';
        this.strokeWidth = 1;
        this.fillOpacity = 1;
        this.strokeOpacity = 1;

        const { yLowerPoint, yUpperPoint } = this.points;

        path.clear();
        path.moveTo(yLowerPoint.x, yLowerPoint.y);
        path.lineTo(yUpperPoint.x, yUpperPoint.y);
        path.closePath();
    }
}

export class ErrorBars extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(OPT_STRING)
    yLowerKey: string = '';

    @Validate(OPT_STRING)
    yLowerName?: string = undefined;

    @Validate(OPT_STRING)
    yUpperKey: string = '';

    @Validate(OPT_STRING)
    yUpperName?: string = undefined;

    private readonly cartesianSeries: _ModuleSupport.CartesianSeries<any, any>;
    private readonly groupNode: _Scene.Group;
    private readonly selection: _Scene.Selection<ErrorBarNode>;
    private nodeData: (ErrorBarPoints | undefined)[] = [];

    constructor(ctx: _ModuleSupport.SeriesContext) {
        super();

        const supportedSeriesTypes = ['line'];
        if (!supportedSeriesTypes.includes(ctx.series.type)) {
            throw new Error(
                `AG Charts - unsupported series type '${
                    ctx.series.type
                }', error bars supported series types: ${supportedSeriesTypes.join(', ')}`
            );
        }
        this.cartesianSeries = ctx.series as CartesianSeries<any, any>;
        const { contentGroup } = this.cartesianSeries;

        this.groupNode = new _Scene.Group({ name: `${contentGroup.id}-series-errorBars` });
        contentGroup.appendChild(this.groupNode);
        this.selection = _Scene.Selection.select(this.groupNode, () => this.errorBarFactory());

        const listener = this.cartesianSeries.addListener('data-model', (event) => this.onDataProcessed(event));
        this.destroyFns.push(() => this.cartesianSeries.removeListener(listener));
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
        const { yLowerKey, yUpperKey, nodeData } = this;
        const xIndex = dataModel?.resolveProcessedDataIndexById(this.cartesianSeries, `xValue`).index;
        const xScale = this.cartesianSeries.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.cartesianSeries.axes[ChartAxisDirection.Y]?.scale;
        if (!xScale || !yScale || !yLowerKey || !yUpperKey || xIndex === undefined) {
            return;
        }

        const convert = (scale: _Scale.Scale<any, any, any>, value: any) => {
            const offset = (scale.bandwidth ?? 0) / 2;
            return scale.convert(value) + offset;
        };

        nodeData.length = processedData.data.length;

        for (let i = 0; i < processedData.data.length; i++) {
            const { datum, values } = processedData.data[i];
            const xDatum = values[xIndex];

            if (yLowerKey in datum && yUpperKey in datum) {
                nodeData[i] = {
                    yLowerPoint: { x: convert(xScale, xDatum), y: convert(yScale, datum[yLowerKey]) },
                    yUpperPoint: { x: convert(xScale, xDatum), y: convert(yScale, datum[yUpperKey]) },
                };
            } else {
                nodeData[i] = undefined;
            }
        }
    }

    update() {
        this.selection.update(this.nodeData, undefined, undefined);
        this.selection.each((node, datum, i) => this.updateNode(node, datum, i));
    }

    private updateNode(node: ErrorBarNode, _datum: any, index: number) {
        const { nodeData } = this;
        const points = nodeData[index];
        if (points) {
            node.points = points;
            node.updatePath();
        }
    }

    private errorBarFactory(): ErrorBarNode {
        return new ErrorBarNode();
    }
}
