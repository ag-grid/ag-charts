import type { _Scale } from 'ag-charts-community';
import { _Scene, _Util, _ModuleSupport } from 'ag-charts-community';
import type { ErrorBarPoints, ErrorBarNodeProperties } from './errorBarNode';
import { ErrorBarNode } from './errorBarNode';
import { ERROR_BARS_THEME } from './errorBarTheme';

const {
    mergeDefaults,
    valueProperty,
    ChartAxisDirection,
    Validate,
    NUMBER,
    STRING,
    OPT_BOOLEAN,
    OPT_COLOR_STRING,
    OPT_NUMBER,
    OPT_STRING,
} = _ModuleSupport;
const { Logger } = _Util;

type AnyScale = _Scale.Scale<any, any, any>;
type OptionalErrorBarNodeProperties = { [K in keyof ErrorBarNodeProperties]?: ErrorBarNodeProperties[K] };

class ErrorBarCapConfig implements OptionalErrorBarNodeProperties {
    @Validate(OPT_BOOLEAN)
    visible?: boolean = undefined;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = undefined;

    @Validate(OPT_NUMBER(1))
    strokeWidth?: number = undefined;

    @Validate(OPT_NUMBER(0, 1))
    strokeOpacity?: number = undefined;

    @Validate(NUMBER(0, 1))
    lengthRatio: number = 1;
}

export class ErrorBars
    extends _ModuleSupport.BaseModuleInstance
    implements _ModuleSupport.ModuleInstance, OptionalErrorBarNodeProperties
{
    @Validate(STRING)
    yLowerKey: string = '';

    @Validate(OPT_STRING)
    yLowerName?: string = undefined;

    @Validate(STRING)
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

    @Validate(OPT_BOOLEAN)
    visible?: boolean = true;

    @Validate(OPT_COLOR_STRING)
    stroke? = 'black';

    @Validate(OPT_NUMBER(1))
    strokeWidth?: number = 1;

    @Validate(OPT_NUMBER(0, 1))
    strokeOpacity?: number = 1;

    cap: ErrorBarCapConfig = new ErrorBarCapConfig();

    private readonly cartesianSeries: _ModuleSupport.CartesianSeries<any, any>;
    private readonly groupNode: _Scene.Group;
    private readonly selection: _Scene.Selection<ErrorBarNode>;
    private nodeData: (ErrorBarPoints | undefined)[] = [];

    constructor(ctx: _ModuleSupport.SeriesContext) {
        super();

        const supportedSeriesTypes = ['bar', 'line', 'scatter'];
        if (!supportedSeriesTypes.includes(ctx.series.type)) {
            throw new Error(
                `AG Charts - unsupported series type '${
                    ctx.series.type
                }', error bars supported series types: ${supportedSeriesTypes.join(', ')}`
            );
        }
        this.cartesianSeries = ctx.series as _ModuleSupport.CartesianSeries<any, any>;
        const { contentGroup } = this.cartesianSeries;

        this.groupNode = new _Scene.Group({
            name: `${contentGroup.id}-series-errorBars`,
            zIndex: _ModuleSupport.Layers.SERIES_ERRORBAR_ZINDEX,
            zIndexSubOrder: this.cartesianSeries.getGroupZIndexSubOrder('error-bars'),
        });
        contentGroup.appendChild(this.groupNode);
        this.selection = _Scene.Selection.select(this.groupNode, () => this.errorBarFactory());

        this.destroyFns.push(
            this.cartesianSeries.addListener(
                'processData-prerequest',
                (event: _ModuleSupport.SeriesPrerequestDataEvent) => this.onPrerequestData(event)
            )
        );
        this.destroyFns.push(
            this.cartesianSeries.addListener('data-model', (event: _ModuleSupport.SeriesDataEvent) =>
                this.onDataProcessed(event)
            )
        );
        this.destroyFns.push(
            this.cartesianSeries.addListener('visibility-changed', (event: _ModuleSupport.SeriesVisibilityEvent) =>
                this.onToggleSeriesItem(event)
            )
        );
    }

    onPrerequestData(event: {
        props: _ModuleSupport.PropertyDefinition<string>[];
        isContinuousX: boolean;
        isContinuousY: boolean;
    }) {
        const { cartesianSeries, xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this;
        const { isContinuousX, isContinuousY } = event;
        event.props.push(
            valueProperty(cartesianSeries, yLowerKey, isContinuousY, { id: 'yValue' }),
            valueProperty(cartesianSeries, yUpperKey, isContinuousY, { id: 'yValue' })
        );
        if (xLowerKey !== undefined && xUpperKey !== undefined) {
            event.props.push(
                valueProperty(cartesianSeries, xLowerKey, isContinuousX, { id: 'xValue' }),
                valueProperty(cartesianSeries, xUpperKey, isContinuousX, { id: 'xValue' })
            );
        }
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
        const { nodeData } = this;
        const { xIndex, yIndex } = this.getDatumIndices(dataModel);
        const xScale = this.cartesianSeries.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.cartesianSeries.axes[ChartAxisDirection.Y]?.scale;
        // xIndex is required because all series must have a y-axis error bar.
        // yIndex is optional because only the scatter series has a x-axis error bar.
        if (!xScale || !yScale || xIndex === undefined) {
            return;
        }

        nodeData.length = processedData.data.length;

        for (let i = 0; i < processedData.data.length; i++) {
            const { xDatum, xLower, xUpper, yDatum, yLower, yUpper } = this.getDatum(processedData, i, xIndex, yIndex);
            const xBar = this.calculatePoints(xScale, xLower, xUpper, yScale, yDatum, yDatum);
            const yBar = this.calculatePoints(xScale, xDatum, xDatum, yScale, yLower, yUpper);
            if (yBar !== undefined) {
                nodeData[i] = { xBar, yBar };
            } else {
                nodeData[i] = undefined;
            }
        }
    }

    private getDatumIndices(dataModel: _ModuleSupport.DataModel<any, any, any>) {
        const xIndex = 'xValue';
        const yIndex = this.cartesianSeries.type == 'bar' ? 'yValue-end' : 'yValue';
        return {
            xIndex: dataModel.resolveProcessedDataIndexById(this.cartesianSeries, xIndex).index,
            yIndex: dataModel.resolveProcessedDataIndexById(this.cartesianSeries, yIndex).index,
        };
    }

    private getDatum(
        processedData: _ModuleSupport.ProcessedData<any>,
        datumIndex: number,
        xIndex: number,
        yIndex: number
    ) {
        const { type } = this.cartesianSeries;
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this;
        const { datum, keys, values } = processedData.data[datumIndex];

        if (type === 'bar') {
            return {
                xDatum: keys[xIndex],
                xLower: undefined,
                xUpper: undefined,
                yDatum: values[0][yIndex],
                yLower: datum[0][yLowerKey] ?? undefined,
                yUpper: datum[0][yUpperKey] ?? undefined,
            };
        } else if (type === 'line') {
            return {
                xDatum: values[xIndex],
                xLower: undefined,
                xUpper: undefined,
                yDatum: values[yIndex],
                yLower: datum[yLowerKey] ?? undefined,
                yUpper: datum[yUpperKey] ?? undefined,
            };
        } else if (type === 'scatter') {
            const xLower = xLowerKey === undefined ? undefined : datum[xLowerKey] ?? undefined;
            const xUpper = xUpperKey === undefined ? undefined : datum[xUpperKey] ?? undefined;
            if (xLower === undefined || xUpper == undefined) {
                Logger.warnOnce(
                    `AG Charts - series type 'scatter' requires xLowerKey (= ${xLowerKey}) and xUpperKey (= ${xUpperKey}) to exist in all data points`
                );
            }

            return {
                xDatum: values[xIndex],
                xLower: xLower,
                xUpper: xUpper,
                yDatum: values[yIndex],
                yLower: datum[yLowerKey] ?? undefined,
                yUpper: datum[yUpperKey] ?? undefined,
            };
        } else {
            throw new Error(`Expected series type '${type}`);
        }
    }

    private calculatePoints(xScale: AnyScale, xLower: any, xUpper: any, yScale: AnyScale, yLower: any, yUpper: any) {
        if ([xLower, xUpper, yLower, yUpper].includes(undefined)) {
            return undefined;
        }
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

    private onToggleSeriesItem(event: { enabled: boolean }): void {
        this.groupNode.visible = event.enabled;
    }

    private errorBarFactory(): ErrorBarNode {
        return new ErrorBarNode();
    }
}
