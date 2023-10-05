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
    STRING,
    OPT_BOOLEAN,
    OPT_COLOR_STRING,
    OPT_NUMBER,
    OPT_STRING,
} = _ModuleSupport;

const XVALUE_ERRORS_ID = 'xValue-errors';
const YVALUE_ERRORS_ID = 'yValue-errors';

type AnyDataModel = _ModuleSupport.DataModel<any, any, any>;
type AnyProcessedData = _ModuleSupport.ProcessedData<any>;
type ChartAxis = _ModuleSupport.ChartAxis;
type ChartAxisDirection = _ModuleSupport.ChartAxisDirection;

type SeriesEventType = _ModuleSupport.SeriesEventType;
type BaseSeriesEvent<T extends SeriesEventType> = _ModuleSupport.BaseSeriesEvent<T>;
type SeriesDataPrerequestEvent = _ModuleSupport.SeriesDataPrerequestEvent;
type SeriesDataProcessedEvent = _ModuleSupport.SeriesDataProcessedEvent;
type SeriesDataGetDomainEvent = _ModuleSupport.SeriesDataGetDomainEvent;
type SeriesDataUpdateEvent = _ModuleSupport.SeriesDataUpdateEvent;
type SeriesTooltipGetParamsEvent = _ModuleSupport.SeriesTooltipGetParamsEvent;
type SeriesVisibilityEvent = _ModuleSupport.SeriesVisibilityEvent;

type ErrorBarDatum<X, Y> = {
    xDatum?: X;
    xLower?: X;
    xUpper?: X;
    yDatum?: Y;
    yLower?: Y;
    yUpper?: Y;
};

type ErrorBarKeys = {
    yLowerKey?: string;
    yUpperKey: string;
    xLowerKey?: string;
    xUpperKey?: string;
};

function getElem<T, D extends object>(obj: D | undefined, key: string | number | undefined) {
    if (key === undefined || obj === undefined) {
        return undefined;
    } else {
        return (obj as Record<string | number, T>)[key] ?? undefined;
    }
}

function getDataItem<K, V, D>(
    processedData: AnyProcessedData | undefined,
    datumIndex: number
): { keys: K[]; values: V[]; datum: D[] } {
    return processedData?.data[datumIndex] ?? { keys: [], values: [], datum: [] };
}

// Error bars are implemented very similar on line and scatter series, so this
// base class is intended to be used for those series types. Bar series are
// quite different, so some methods are overriden for that.
//
// This simplifies the implementation of ErrorBars class which just needs to
// handle the interactions between the community and enterprise packages.
class CartesianInterface<
    TNode extends _Scene.Node,
    TDatum extends _ModuleSupport.CartesianSeriesNodeDatum,
    TSeries extends _ModuleSupport.CartesianSeries<TNode, TDatum>,
> {
    public ctx: _ModuleSupport.SeriesContext;
    protected series: TSeries;

    protected dataModel?: AnyDataModel;
    protected processedData?: AnyProcessedData;
    protected xIndex?: number;
    protected yIndex?: number;

    constructor(ctx: _ModuleSupport.SeriesContext, series: TSeries) {
        this.ctx = ctx;
        this.series = series;
    }

    setData(event: { dataModel: AnyDataModel; processedData: AnyProcessedData }) {
        this.dataModel = event.dataModel;
        this.processedData = event.processedData;
        this.updateDatumIndices();
    }

    getData(): { dataModel?: AnyDataModel; processedData?: AnyProcessedData } {
        const { dataModel, processedData } = this;
        return { dataModel, processedData };
    }

    getScopeProvider(): _ModuleSupport.ScopeProvider {
        return this.series;
    }

    getContentGroup() {
        return this.series.contentGroup;
    }

    getAxis(direction: ChartAxisDirection): ChartAxis | undefined {
        return this.series.axes[direction];
    }

    getDatum<X, Y>(datumIndex: number, errorkeys: ErrorBarKeys): ErrorBarDatum<X, Y> {
        // Get ungrouped data:
        const { datum, values } = getDataItem(this.processedData, datumIndex);
        return {
            xDatum: getElem(values, this.xIndex),
            xLower: getElem(datum, errorkeys.xLowerKey),
            xUpper: getElem(datum, errorkeys.xUpperKey),
            yDatum: getElem(values, this.yIndex),
            yLower: getElem(datum, errorkeys.yLowerKey),
            yUpper: getElem(datum, errorkeys.yUpperKey),
        };
    }

    getDataLength(): number {
        return this.processedData?.data.length ?? 0;
    }

    addListener<T extends SeriesEventType, E extends BaseSeriesEvent<T>, R = void>(t: T, l: (e: E) => R): () => void {
        return this.series.addListener(t, l);
    }

    convert<X, Y>(x: X, y: Y) {
        const xScale = this.getAxis(ChartAxisDirection.X)?.scale;
        const yScale = this.getAxis(ChartAxisDirection.Y)?.scale;
        const xConvert = xScale?.convert(x) ?? 0;
        const yConvert = yScale?.convert(y) ?? 0;
        const xOffset = (xScale?.bandwidth ?? 0) / 2;
        const yOffset = (yScale?.bandwidth ?? 0) / 2;
        return { x: xConvert + xOffset, y: yConvert + yOffset };
    }

    protected updateDatumIndices() {
        const scope = this.getScopeProvider();
        this.xIndex = this.dataModel?.resolveProcessedDataIndexById(scope, 'xValue').index;
        this.yIndex = this.dataModel?.resolveProcessedDataIndexById(scope, 'yValue').index;
    }
}

class BarInterface extends CartesianInterface<_Scene.Rect, _ModuleSupport.BarNodeDatum, _ModuleSupport.BarSeries> {
    override getDatum<X, Y>(datumIndex: number, errorkeys: ErrorBarKeys): ErrorBarDatum<X, Y> {
        // Get grouped data:
        const { datum, keys, values } = getDataItem<unknown, unknown[], unknown[]>(this.processedData, datumIndex);
        return {
            xDatum: getElem(keys, this.xIndex),
            xLower: undefined,
            xUpper: undefined,
            yDatum: getElem(values[0], this.yIndex),
            yLower: getElem(datum[0], errorkeys.yLowerKey),
            yUpper: getElem(datum[0], errorkeys.yUpperKey),
        };
    }

    override convert<X, Y>(x: X, y: Y) {
        const { series } = this;
        const { index } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(series);
        const band = this.series.getGroupScale();

        const catScale = this.series.getCategoryAxis()?.scale;
        const valScale = this.series.getValueAxis()?.scale;
        const catConvert = catScale?.convert(x) ?? 0;
        const valConvert = valScale?.convert(y) ?? 0;
        const catOffset = band.convert(String(index)) + this.series.getBarWidth() / 2;
        const valOffset = (valScale?.bandwidth ?? 0) / 2;

        if (series.direction !== 'horizontal') {
            return { x: catConvert + catOffset, y: valConvert + valOffset };
        } else {
            return { x: valConvert + valOffset, y: catConvert + catOffset };
        }
    }

    protected override updateDatumIndices() {
        const scope = this.getScopeProvider();
        this.xIndex = this.dataModel?.resolveProcessedDataIndexById(scope, 'xValue').index;
        this.yIndex = this.dataModel?.resolveProcessedDataIndexById(scope, 'yValue-end').index;
    }
}

type SomeCartesianSeries = _ModuleSupport.CartesianSeries<_Scene.Node, _ModuleSupport.CartesianSeriesNodeDatum>;
type SomeCartesianInterface = CartesianInterface<
    _Scene.Node,
    _ModuleSupport.CartesianSeriesNodeDatum,
    _ModuleSupport.CartesianSeries<_Scene.Node, _ModuleSupport.CartesianSeriesNodeDatum>
>;

function makeCartesianInterface(ctx: _ModuleSupport.SeriesContext): SomeCartesianInterface {
    const supportedSeriesTypes = ['bar', 'line', 'scatter'];
    if (!supportedSeriesTypes.includes(ctx.series.type)) {
        throw new Error(
            `AG Charts - unsupported series type '${
                ctx.series.type
            }', error bars supported series types: ${supportedSeriesTypes.join(', ')}`
        );
    }

    if (ctx.series.type == 'bar') {
        // TODO `as unknown as SomeCartesianInterface` shouldn't be necessary.
        return new BarInterface(ctx, ctx.series as _ModuleSupport.BarSeries) as unknown as SomeCartesianInterface;
    } else {
        return new CartesianInterface(ctx, ctx.series as SomeCartesianSeries);
    }
}

class ErrorBarCapConfig implements ErrorBarNodeProperties {
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
    implements _ModuleSupport.ModuleInstance, ErrorBarNodeProperties
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

    private readonly cartesian: SomeCartesianInterface;
    private readonly groupNode: _Scene.Group;
    private readonly selection: _Scene.Selection<ErrorBarNode>;
    private nodeData: (ErrorBarPoints | undefined)[] = [];

    constructor(ctx: _ModuleSupport.SeriesContext) {
        super();

        const series = makeCartesianInterface(ctx);
        const contentGroup = series.getContentGroup();

        this.groupNode = new _Scene.Group({
            name: `${contentGroup.id}-series-errorBars`,
            zIndex: _ModuleSupport.Layers.SERIES_ERRORBAR_ZINDEX,
            zIndexSubOrder: ctx.seriesLayerManager.getGroupZIndexSubOrder(ctx.series.id, 'error-bars'),
        });
        contentGroup.appendChild(this.groupNode);
        this.selection = _Scene.Selection.select(this.groupNode, () => this.errorBarFactory());

        this.destroyFns.push(
            series.addListener('data-prerequest', (e: SeriesDataPrerequestEvent) => this.onPrerequestData(e)),
            series.addListener('data-processed', (e: SeriesDataProcessedEvent) => this.onDataProcessed(e)),
            series.addListener('data-getDomain', (e: SeriesDataGetDomainEvent) => this.onGetDomain(e)),
            series.addListener('data-update', (e: SeriesDataUpdateEvent) => this.onDataUpdate(e)),
            series.addListener('tooltip-getParams', (e: SeriesTooltipGetParamsEvent) => this.onTooltipGetParams(e)),
            series.addListener('visibility-changed', (e: SeriesVisibilityEvent) => this.onToggleSeriesItem(e))
        );
        this.cartesian = series;
    }

    private onPrerequestData(event: SeriesDataPrerequestEvent) {
        const props: _ModuleSupport.PropertyDefinition<unknown>[] = [];
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this;
        const { isContinuousX, isContinuousY } = event;
        const scopeProvider = this.cartesian.getScopeProvider();
        props.push(
            valueProperty(scopeProvider, yLowerKey, isContinuousY, { id: YVALUE_ERRORS_ID }),
            valueProperty(scopeProvider, yUpperKey, isContinuousY, { id: YVALUE_ERRORS_ID })
        );
        if (xLowerKey !== undefined && xUpperKey !== undefined) {
            props.push(
                valueProperty(scopeProvider, xLowerKey, isContinuousX, { id: XVALUE_ERRORS_ID }),
                valueProperty(scopeProvider, xUpperKey, isContinuousX, { id: XVALUE_ERRORS_ID })
            );
        }
        return props;
    }

    private onDataProcessed(event: SeriesDataProcessedEvent) {
        this.cartesian.setData(event);
    }

    private hasAxis(direction: _ModuleSupport.ChartAxisDirection): boolean {
        if (direction == ChartAxisDirection.X) {
            return this.xLowerKey !== undefined && this.xUpperKey != undefined;
        }
        return true;
    }

    private onGetDomain(event: SeriesDataGetDomainEvent) {
        if (this.hasAxis(event.direction)) {
            const { cartesian } = this;
            const { dataModel, processedData } = cartesian.getData();
            const scopeProvider = cartesian.getScopeProvider();
            const axis = cartesian.getAxis(event.direction);
            const id = { x: XVALUE_ERRORS_ID, y: YVALUE_ERRORS_ID }[event.direction];

            if (dataModel !== undefined && processedData !== undefined) {
                const domain = dataModel.getDomain(scopeProvider, id, 'value', processedData);
                return fixNumericExtent(domain as any, axis);
            }
        }
    }

    private onDataUpdate(event: SeriesDataUpdateEvent) {
        const { nodeData, cartesian } = this;
        cartesian.setData(event);

        if (event.dataModel !== undefined && event.processedData !== undefined) {
            nodeData.length = cartesian.getDataLength();
            for (let i = 0; i < nodeData.length; i++) {
                const { xDatum, xLower, xUpper, yDatum, yLower, yUpper } = cartesian.getDatum(i, this);
                const xBar = this.calculatePoints(xLower, xUpper, yDatum, yDatum);
                const yBar = this.calculatePoints(xDatum, xDatum, yLower, yUpper);
                if (yBar !== undefined) {
                    nodeData[i] = { xBar, yBar };
                } else {
                    nodeData[i] = undefined;
                }
            }
            this.update();
        }
    }

    private calculatePoints<X, Y>(xLower: X, xUpper: X, yLower: Y, yUpper: Y) {
        return {
            lowerPoint: this.cartesian.convert(xLower, yLower),
            upperPoint: this.cartesian.convert(xUpper, yUpper),
        };
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

        return {
            xLowerKey,
            xLowerValue: getElem(datum, xLowerKey),
            xLowerName,
            xUpperKey,
            xUpperValue: getElem(datum, xUpperKey),
            xUpperName,
            yLowerKey,
            yLowerValue: getElem(datum, yLowerKey),
            yLowerName,
            yUpperKey,
            yUpperValue: getElem(datum, yUpperKey),
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
