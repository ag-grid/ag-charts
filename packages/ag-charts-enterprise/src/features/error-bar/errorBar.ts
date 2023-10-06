import type { _Scale } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { ErrorBarNodeProperties, ErrorBarPoints } from './errorBarNode';
import { ErrorBarNode } from './errorBarNode';
import { ERROR_BARS_THEME } from './errorBarTheme';

const {
    fixNumericExtent,
    mergeDefaults,
    valueProperty,
    ChartAxisDirection,
    Validate,
    NUMBER,
    OPT_BOOLEAN,
    OPT_COLOR_STRING,
    OPT_NUMBER,
    OPT_STRING,
} = _ModuleSupport;

const XVALUE_ERRORS_ID = 'xValue-errors';
const YVALUE_ERRORS_ID = 'yValue-errors';

type AnyCartesianSeries = _ModuleSupport.CartesianSeries<_Scene.Node, _ModuleSupport.CartesianSeriesNodeDatum>;
type AnyDataModel = _ModuleSupport.DataModel<any, any, any>;
type AnyProcessedData = _ModuleSupport.ProcessedData<any>;
type AnyScale = _Scale.Scale<any, any, any>;

type SeriesDataPrerequestEvent = _ModuleSupport.SeriesDataPrerequestEvent;
type SeriesDataProcessedEvent = _ModuleSupport.SeriesDataProcessedEvent;
type SeriesDataGetDomainEvent = _ModuleSupport.SeriesDataGetDomainEvent;
type SeriesDataUpdateEvent = _ModuleSupport.SeriesDataUpdateEvent;
type SeriesTooltipGetParamsEvent = _ModuleSupport.SeriesTooltipGetParamsEvent;
type SeriesVisibilityEvent = _ModuleSupport.SeriesVisibilityEvent;

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
    @Validate(OPT_STRING)
    yLowerKey?: string = undefined;

    @Validate(OPT_STRING)
    yLowerName?: string = undefined;

    @Validate(OPT_STRING)
    yUpperKey?: string = undefined;

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

    private readonly cartesianSeries: AnyCartesianSeries;
    private readonly groupNode: _Scene.Group;
    private readonly selection: _Scene.Selection<ErrorBarNode>;
    private nodeData: (ErrorBarPoints | undefined)[] = [];

    private dataModel?: AnyDataModel;
    private processedData?: AnyProcessedData;

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
        this.cartesianSeries = ctx.series as AnyCartesianSeries;
        const { contentGroup } = this.cartesianSeries;

        this.groupNode = new _Scene.Group({
            name: `${contentGroup.id}-series-errorBars`,
            zIndex: _ModuleSupport.Layers.SERIES_ERRORBAR_ZINDEX,
            zIndexSubOrder: this.cartesianSeries.getGroupZIndexSubOrder('error-bars'),
        });
        contentGroup.appendChild(this.groupNode);
        this.selection = _Scene.Selection.select(this.groupNode, () => this.errorBarFactory());

        const series = this.cartesianSeries;
        this.destroyFns.push(
            series.addListener('data-prerequest', (e: SeriesDataPrerequestEvent) => this.onPrerequestData(e)),
            series.addListener('data-processed', (e: SeriesDataProcessedEvent) => this.onDataProcessed(e)),
            series.addListener('data-getDomain', (e: SeriesDataGetDomainEvent) => this.onGetDomain(e)),
            series.addListener('data-update', (e: SeriesDataUpdateEvent) => this.onDataUpdate(e)),
            series.addListener('tooltip-getParams', (e: SeriesTooltipGetParamsEvent) => this.onTooltipGetParams(e)),
            series.addListener('visibility-changed', (e: SeriesVisibilityEvent) => this.onToggleSeriesItem(e))
        );
    }

    private onPrerequestData(event: SeriesDataPrerequestEvent) {
        const props: _ModuleSupport.PropertyDefinition<unknown>[] = [];
        const { cartesianSeries, xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this;
        const { isContinuousX, isContinuousY } = event;
        props.push(
            valueProperty(cartesianSeries, yLowerKey, isContinuousY, { id: YVALUE_ERRORS_ID }),
            valueProperty(cartesianSeries, yUpperKey, isContinuousY, { id: YVALUE_ERRORS_ID })
        );
        if (xLowerKey !== undefined && xUpperKey !== undefined) {
            props.push(
                valueProperty(cartesianSeries, xLowerKey, isContinuousX, { id: XVALUE_ERRORS_ID }),
                valueProperty(cartesianSeries, xUpperKey, isContinuousX, { id: XVALUE_ERRORS_ID })
            );
        }
        return props;
    }

    private onDataProcessed(event: SeriesDataProcessedEvent) {
        this.dataModel = event.dataModel;
        this.processedData = event.processedData;
    }

    private hasAxis(direction: _ModuleSupport.ChartAxisDirection): boolean {
        if (direction == ChartAxisDirection.X) {
            return this.xLowerKey !== undefined && this.xUpperKey != undefined;
        }
        return true;
    }

    private onGetDomain(event: SeriesDataGetDomainEvent) {
        if (this.hasAxis(event.direction)) {
            const { dataModel, processedData, cartesianSeries } = this;
            const axis = cartesianSeries.axes[event.direction];
            const id = { x: XVALUE_ERRORS_ID, y: YVALUE_ERRORS_ID }[event.direction];
            if (dataModel !== undefined && processedData !== undefined) {
                const domain = dataModel.getDomain(cartesianSeries, id, 'value', processedData);
                return fixNumericExtent(domain as any, axis);
            }
        }
    }

    private onDataUpdate(event: SeriesDataUpdateEvent) {
        this.dataModel = event.dataModel;
        this.processedData = event.processedData;
        if (event.dataModel !== undefined && event.processedData !== undefined) {
            this.createNodeData();
            this.update();
        }
    }

    private createNodeData() {
        const { nodeData } = this;
        const xScale = this.cartesianSeries.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.cartesianSeries.axes[ChartAxisDirection.Y]?.scale;
        if (!xScale || !yScale) {
            return;
        }

        nodeData.length = this.cartesianSeries.contextNodeData[0].nodeData.length;

        for (let i = 0; i < nodeData.length; i++) {
            const { midPoint, xLower, xUpper, yLower, yUpper } = this.getDatum(i);
            if (midPoint !== undefined) {
                let xBar = undefined;
                let yBar = undefined;
                if (xLower !== undefined && xUpper !== undefined) {
                    xBar = {
                        lowerPoint: { x: this.convert(xScale, xLower), y: midPoint.y },
                        upperPoint: { x: this.convert(xScale, xUpper), y: midPoint.y },
                    };
                }
                if (yLower !== undefined && yUpper !== undefined) {
                    yBar = {
                        lowerPoint: { x: midPoint.x, y: this.convert(yScale, yLower) },
                        upperPoint: { x: midPoint.x, y: this.convert(yScale, yUpper) },
                    };
                }
                nodeData[i] = { xBar, yBar };
            }
        }
    }

    private shouldFlipXY(): boolean {
        if (this.cartesianSeries.type === 'bar') {
            return (this.cartesianSeries as unknown as _ModuleSupport.BarSeries).direction === 'horizontal';
        }

        return false;
    }

    private getDatum(datumIndex: number) {
        const { cartesianSeries } = this;
        const datum = cartesianSeries.contextNodeData[0].nodeData[datumIndex];

        let { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this;
        if (this.shouldFlipXY()) {
            [xLowerKey, xUpperKey, yLowerKey, yUpperKey] = [yLowerKey, yUpperKey, xLowerKey, xUpperKey];
        }

        return {
            midPoint: datum.midPoint,
            xLower: datum.datum[xLowerKey ?? ''] ?? undefined,
            xUpper: datum.datum[xUpperKey ?? ''] ?? undefined,
            yLower: datum.datum[yLowerKey ?? ''] ?? undefined,
            yUpper: datum.datum[yUpperKey ?? ''] ?? undefined,
        };
    }

    private convert(scale: AnyScale, value: any) {
        const offset = (scale.bandwidth ?? 0) / 2;
        return scale.convert(value) + offset;
    }

    private update() {
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

    private onTooltipGetParams(event: SeriesTooltipGetParamsEvent) {
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this;
        let { xLowerName, xUpperName, yLowerName, yUpperName } = this;
        xLowerName ??= xLowerKey;
        xUpperName ??= xUpperKey;
        yLowerName ??= yLowerKey;
        yUpperName ??= yUpperKey;

        const datum: { [key: string]: any } = event.datum;
        const getValue = (key?: string) => {
            if (key !== undefined && key in datum) {
                return datum[key];
            }
        };
        const xLowerValue = getValue(xLowerKey);
        const xUpperValue = getValue(xUpperKey);
        const yLowerValue = getValue(yLowerKey);
        const yUpperValue = getValue(yUpperKey);

        return {
            xLowerKey,
            xLowerValue,
            xLowerName,
            xUpperKey,
            xUpperValue,
            xUpperName,
            yLowerKey,
            yLowerValue,
            yLowerName,
            yUpperKey,
            yUpperValue,
            yUpperName,
        };
    }
    private onToggleSeriesItem(event: SeriesVisibilityEvent): void {
        this.groupNode.visible = event.enabled;
    }

    private errorBarFactory(): ErrorBarNode {
        return new ErrorBarNode();
    }
}
