import type { _Scale } from 'ag-charts-community';
import { _Scene, _Util, _ModuleSupport } from 'ag-charts-community';
import type { ErrorBarPoints, ErrorBarNodeProperties } from './errorBarNode';
import { ErrorBarNode } from './errorBarNode';
import { ERROR_BARS_THEME } from './errorBarTheme';

const { ChartAxisDirection, Validate, BOOLEAN, OPT_STRING, NUMBER } = _ModuleSupport;

type CartesianSeries<
    C extends _ModuleSupport.SeriesNodeDataContext<any, any>,
    N extends _Scene.Node
> = _ModuleSupport.CartesianSeries<C, N>;

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

    private inheritProperties(
        src: OptionalErrorBarNodeProperties,
        parent: ErrorBarNodeProperties
    ): ErrorBarNodeProperties {
        return {
            visible: src.visible ?? parent.visible,
            stroke: src.stroke ?? parent.stroke,
            strokeWidth: src.strokeWidth ?? parent.strokeWidth,
            strokeOpacity: src.strokeOpacity ?? parent.strokeOpacity,
        };
    }

    private updateNode(node: ErrorBarNode, _datum: any, index: number) {
        const { nodeData } = this;
        const points = nodeData[index];
        if (points) {
            const whiskerProps = this.inheritProperties(this, ERROR_BARS_THEME.errorBar);
            node.updateData(points, whiskerProps);
            node.updatePath();
        }
    }

    private errorBarFactory(): ErrorBarNode {
        return new ErrorBarNode();
    }
}
