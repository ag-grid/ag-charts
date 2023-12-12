import type { AgErrorBarOptions, AgErrorBarThemeableOptions, _Scale } from 'ag-charts-community';
import { AgErrorBarSupportedSeriesTypes, _ModuleSupport, _Scene } from 'ag-charts-community';

import type {
    ErrorBarCapFormatter,
    ErrorBarFormatter,
    ErrorBarNodeDatum,
    ErrorBarStylingOptions,
} from './errorBarNode';
import { ErrorBarGroup, ErrorBarNode } from './errorBarNode';

const {
    fixNumericExtent,
    mergeDefaults,
    valueProperty,
    ChartAxisDirection,
    Validate,
    BOOLEAN,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    POSITIVE_NUMBER,
    STRING,
    RATIO,
} = _ModuleSupport;

type ErrorBoundCartesianSeries = Omit<
    _ModuleSupport.CartesianSeries<_Scene.Node, ErrorBarNodeDatum>,
    'highlightSelection'
>;

function toErrorBoundCartesianSeries(ctx: _ModuleSupport.SeriesContext): ErrorBoundCartesianSeries {
    for (const supportedType of AgErrorBarSupportedSeriesTypes) {
        if (supportedType == ctx.series.type) {
            return ctx.series as ErrorBoundCartesianSeries;
        }
    }
    throw new Error(
        `AG Charts - unsupported series type '${
            ctx.series.type
        }', error bars supported series types: ${AgErrorBarSupportedSeriesTypes.join(', ')}`
    );
}

type AnyDataModel = _ModuleSupport.DataModel<any, any, any>;
type AnyProcessedData = _ModuleSupport.ProcessedData<any>;
type AnyScale = _Scale.Scale<any, any, any>;
type HighlightNodeDatum = NonNullable<_ModuleSupport.HighlightChangeEvent['currentHighlight']>;
type PickNodeDatumResult = _ModuleSupport.PickNodeDatumResult;
type Point = _Scene.Point;
type SeriesDataProcessedEvent = _ModuleSupport.SeriesDataProcessedEvent;
type SeriesDataUpdateEvent = _ModuleSupport.SeriesDataUpdateEvent;
type SeriesVisibilityEvent = _ModuleSupport.SeriesVisibilityEvent;

class ErrorBarCap implements NonNullable<AgErrorBarOptions['cap']> {
    @Validate(BOOLEAN, { optional: true })
    visible?: boolean = undefined;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string = undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number = undefined;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number = undefined;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @Validate(POSITIVE_NUMBER, { optional: true })
    lineDashOffset?: number;

    @Validate(NUMBER, { optional: true })
    length?: number = undefined;

    @Validate(RATIO, { optional: true })
    lengthRatio?: number = undefined;

    @Validate(FUNCTION, { optional: true })
    formatter?: ErrorBarCapFormatter = undefined;
}

export class ErrorBars
    extends _ModuleSupport.BaseModuleInstance
    implements _ModuleSupport.ModuleInstance, _ModuleSupport.SeriesOptionInstance, AgErrorBarOptions
{
    @Validate(STRING, { optional: true })
    yLowerKey?: string = undefined;

    @Validate(STRING, { optional: true })
    yLowerName?: string = undefined;

    @Validate(STRING, { optional: true })
    yUpperKey?: string = undefined;

    @Validate(STRING, { optional: true })
    yUpperName?: string = undefined;

    @Validate(STRING, { optional: true })
    xLowerKey?: string = undefined;

    @Validate(STRING, { optional: true })
    xLowerName?: string = undefined;

    @Validate(STRING, { optional: true })
    xUpperKey?: string = undefined;

    @Validate(STRING, { optional: true })
    xUpperName?: string = undefined;

    @Validate(BOOLEAN, { optional: true })
    visible?: boolean = true;

    @Validate(COLOR_STRING, { optional: true })
    stroke? = 'black';

    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number = 1;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number = 1;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @Validate(POSITIVE_NUMBER, { optional: true })
    lineDashOffset?: number;

    @Validate(FUNCTION, { optional: true })
    formatter?: ErrorBarFormatter = undefined;

    cap: ErrorBarCap = new ErrorBarCap();

    private readonly cartesianSeries: ErrorBoundCartesianSeries;
    private readonly groupNode: ErrorBarGroup;
    private readonly selection: _Scene.Selection<ErrorBarNode>;

    private dataModel?: AnyDataModel;
    private processedData?: AnyProcessedData;

    constructor(ctx: _ModuleSupport.SeriesContext) {
        super();

        this.cartesianSeries = toErrorBoundCartesianSeries(ctx);
        const { annotationGroup, annotationSelections } = this.cartesianSeries;

        this.groupNode = new ErrorBarGroup({
            name: `${annotationGroup.id}-errorBars`,
            zIndex: _ModuleSupport.Layers.SERIES_LAYER_ZINDEX,
            zIndexSubOrder: this.cartesianSeries.getGroupZIndexSubOrder('annotation'),
        });
        annotationGroup.appendChild(this.groupNode);
        this.selection = _Scene.Selection.select(this.groupNode, () => this.errorBarFactory());
        annotationSelections.add(this.selection);

        const series = this.cartesianSeries;
        this.destroyFns.push(
            series.addListener('data-processed', (e: SeriesDataProcessedEvent) => this.onDataProcessed(e)),
            series.addListener('data-update', (e: SeriesDataUpdateEvent) => this.onDataUpdate(e)),
            series.addListener('visibility-changed', (e: SeriesVisibilityEvent) => this.onToggleSeriesItem(e)),
            ctx.highlightManager.addListener('highlight-change', (event) => this.onHighlightChange(event)),
            () => annotationGroup.removeChild(this.groupNode),
            () => annotationSelections.delete(this.selection)
        );
    }

    getPropertyDefinitions(opts: { isContinuousX: boolean; isContinuousY: boolean }) {
        const props: _ModuleSupport.PropertyDefinition<unknown>[] = [];
        const { cartesianSeries } = this;
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey, xErrorsID, yErrorsID } = this.getMaybeFlippedKeys();
        const { isContinuousX, isContinuousY } = opts;
        if (yLowerKey !== undefined && yUpperKey !== undefined) {
            props.push(
                valueProperty(cartesianSeries, yLowerKey, isContinuousY, { id: yErrorsID }),
                valueProperty(cartesianSeries, yUpperKey, isContinuousY, { id: yErrorsID })
            );
        }
        if (xLowerKey !== undefined && xUpperKey !== undefined) {
            props.push(
                valueProperty(cartesianSeries, xLowerKey, isContinuousX, { id: xErrorsID }),
                valueProperty(cartesianSeries, xUpperKey, isContinuousX, { id: xErrorsID })
            );
        }
        return props;
    }

    private onDataProcessed(event: SeriesDataProcessedEvent) {
        this.dataModel = event.dataModel;
        this.processedData = event.processedData;
    }

    getDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { xLowerKey, xUpperKey, xErrorsID, yLowerKey, yUpperKey, yErrorsID } = this.getMaybeFlippedKeys();
        let hasAxisErrors: boolean = false;
        if (direction == ChartAxisDirection.X) {
            hasAxisErrors = xLowerKey !== undefined && xUpperKey != undefined;
        } else {
            hasAxisErrors = yLowerKey !== undefined && yUpperKey != undefined;
        }

        if (hasAxisErrors) {
            const { dataModel, processedData, cartesianSeries } = this;
            const axis = cartesianSeries.axes[direction];
            const id = { x: xErrorsID, y: yErrorsID }[direction];
            if (dataModel !== undefined && processedData !== undefined) {
                const domain = dataModel.getDomain(cartesianSeries, id, 'value', processedData);
                return fixNumericExtent(domain as any, axis);
            }
        }
        return [];
    }

    private onDataUpdate(event: SeriesDataUpdateEvent) {
        this.dataModel = event.dataModel;
        this.processedData = event.processedData;
        if (event.dataModel !== undefined && event.processedData !== undefined) {
            this.createNodeData();
            this.update();
        }
    }

    private getNodeData(): ErrorBarNodeDatum[] | undefined {
        const { contextNodeData } = this.cartesianSeries;
        if (contextNodeData.length > 0) {
            return contextNodeData[0].nodeData;
        }
    }

    private createNodeData() {
        const nodeData = this.getNodeData();
        const xScale = this.cartesianSeries.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.cartesianSeries.axes[ChartAxisDirection.Y]?.scale;
        if (!xScale || !yScale || !nodeData) {
            return;
        }

        for (let i = 0; i < nodeData.length; i++) {
            const { midPoint, xLower, xUpper, yLower, yUpper } = this.getDatum(nodeData, i);
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
                nodeData[i].xBar = xBar;
                nodeData[i].yBar = yBar;
            }
        }
    }

    private getMaybeFlippedKeys() {
        let { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this;
        let [xErrorsID, yErrorsID] = ['xValue-errors', 'yValue-errors'];
        if (this.cartesianSeries.shouldFlipXY()) {
            [xLowerKey, yLowerKey] = [yLowerKey, xLowerKey];
            [xUpperKey, yUpperKey] = [yUpperKey, xUpperKey];
            [xErrorsID, yErrorsID] = [yErrorsID, xErrorsID];
        }
        return { xLowerKey, xUpperKey, xErrorsID, yLowerKey, yUpperKey, yErrorsID };
    }

    private getDatum(nodeData: ErrorBarNodeDatum[], datumIndex: number) {
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this.getMaybeFlippedKeys();
        const datum = nodeData[datumIndex];

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
        const nodeData = this.getNodeData();
        if (nodeData !== undefined) {
            this.selection.update(nodeData, undefined, undefined);
            this.selection.each((node, datum, i) => this.updateNode(node, datum, i));
        }
    }

    private updateNode(node: ErrorBarNode, datum: ErrorBarNodeDatum, _index: number) {
        const style = this.getDefaultStyle();
        node.datum = datum;
        node.update(style, this, false);
        node.updateBBoxes();
    }

    pickNodeExact(point: Point): PickNodeDatumResult {
        const { x, y } = this.groupNode.transformPoint(point.x, point.y);
        const node = this.groupNode.pickNode(x, y);
        if (node !== undefined) {
            return { datum: node.datum, distanceSquared: 0 };
        }
    }

    pickNodeNearest(point: Point): PickNodeDatumResult {
        return this.groupNode.nearestSquared(point);
    }

    pickNodeMainAxisFirst(point: Point): PickNodeDatumResult {
        return this.groupNode.nearestSquared(point);
    }

    getTooltipParams() {
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this;
        let { xLowerName, xUpperName, yLowerName, yUpperName } = this;
        xLowerName ??= xLowerKey;
        xUpperName ??= xUpperKey;
        yLowerName ??= yLowerKey;
        yUpperName ??= yUpperKey;

        return {
            xLowerKey,
            xLowerName,
            xUpperKey,
            xUpperName,
            yLowerKey,
            yLowerName,
            yUpperKey,
            yUpperName,
        };
    }

    private onToggleSeriesItem(event: SeriesVisibilityEvent): void {
        this.groupNode.visible = event.enabled;
    }

    private makeStyle(baseStyle: ErrorBarStylingOptions): AgErrorBarThemeableOptions {
        return {
            visible: baseStyle.visible,
            lineDash: baseStyle.lineDash,
            lineDashOffset: baseStyle.lineDashOffset,
            stroke: baseStyle.stroke,
            strokeWidth: baseStyle.strokeWidth,
            strokeOpacity: baseStyle.strokeOpacity,
            cap: mergeDefaults(this.cap, baseStyle),
        };
    }

    private getDefaultStyle(): AgErrorBarThemeableOptions {
        return this.makeStyle(this.getWhiskerProperties());
    }

    private getHighlightStyle(): AgErrorBarThemeableOptions {
        // FIXME - at some point we should allow customising this
        return this.makeStyle(this.getWhiskerProperties());
    }

    private restyleHightlightChange(
        highlightChange: HighlightNodeDatum,
        style: AgErrorBarThemeableOptions,
        highlighted: boolean
    ) {
        const nodeData = this.getNodeData();
        if (nodeData === undefined) return;

        // Search for the ErrorBarNode that matches this highlight change. This
        // isn't a good solution in terms of performance. However, it's assumed
        // that the typical use case for error bars includes few data points
        // (because the chart will get cluttered very quickly if there are many
        // data points with error bars).
        for (let i = 0; i < nodeData.length; i++) {
            if (highlightChange === nodeData[i]) {
                this.selection.nodes()[i].update(style, this, highlighted);
                break;
            }
        }
    }

    private onHighlightChange(event: _ModuleSupport.HighlightChangeEvent) {
        const { previousHighlight, currentHighlight } = event;
        const { cartesianSeries: thisSeries } = this;

        if (currentHighlight?.series === thisSeries) {
            // Highlight this node:
            this.restyleHightlightChange(currentHighlight, this.getHighlightStyle(), true);
        }

        if (previousHighlight?.series === thisSeries) {
            // Unhighlight this node:
            this.restyleHightlightChange(previousHighlight, this.getDefaultStyle(), false);
        }

        this.groupNode.opacity = this.cartesianSeries.getOpacity();
    }

    private errorBarFactory(): ErrorBarNode {
        return new ErrorBarNode();
    }

    private getWhiskerProperties(): Omit<AgErrorBarThemeableOptions, 'cap'> {
        const { stroke, strokeWidth, visible, strokeOpacity, lineDash, lineDashOffset } = this;
        return { stroke, strokeWidth, visible, strokeOpacity, lineDash, lineDashOffset };
    }
}
