import type { AgErrorBarThemeableOptions, _Scale } from 'ag-charts-community';
import { AgErrorBarSupportedSeriesTypes, _ModuleSupport, _Scene } from 'ag-charts-community';

import type { ErrorBarNodeDatum, ErrorBarStylingOptions } from './errorBarNode';
import { ErrorBarGroup, ErrorBarNode } from './errorBarNode';
import { ErrorBarProperties } from './errorBarProperties';

const { isDefined, fixNumericExtent, mergeDefaults, valueProperty, ChartAxisDirection } = _ModuleSupport;

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

export class ErrorBars extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.SeriesOptionInstance {
    private readonly cartesianSeries: ErrorBoundCartesianSeries;
    private readonly groupNode: ErrorBarGroup;
    private readonly selection: _Scene.Selection<ErrorBarNode>;

    readonly properties = new ErrorBarProperties();

    private dataModel?: AnyDataModel;
    private processedData?: AnyProcessedData;

    constructor(ctx: _ModuleSupport.SeriesContext) {
        super();

        const series = toErrorBoundCartesianSeries(ctx);
        const { annotationGroup, annotationSelections } = series;

        this.cartesianSeries = series;
        this.groupNode = new ErrorBarGroup({
            name: `${annotationGroup.id}-errorBars`,
            zIndex: _ModuleSupport.Layers.SERIES_LAYER_ZINDEX,
            zIndexSubOrder: series.getGroupZIndexSubOrder('annotation'),
        });

        annotationGroup.appendChild(this.groupNode);
        this.selection = _Scene.Selection.select(this.groupNode, () => this.errorBarFactory());
        annotationSelections.add(this.selection);

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
        const hasAxisErrors =
            direction === ChartAxisDirection.X
                ? isDefined(xLowerKey) && isDefined(xUpperKey)
                : isDefined(yLowerKey) && isDefined(yUpperKey);

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
        if (isDefined(event.dataModel) && isDefined(event.processedData)) {
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
                let xBar, yBar;
                if (isDefined(xLower) && isDefined(xUpper)) {
                    xBar = {
                        lowerPoint: { x: this.convert(xScale, xLower), y: midPoint.y },
                        upperPoint: { x: this.convert(xScale, xUpper), y: midPoint.y },
                    };
                }
                if (isDefined(yLower) && isDefined(yUpper)) {
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
        let { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this.properties;
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
            xLower: datum.datum[xLowerKey ?? ''],
            xUpper: datum.datum[xUpperKey ?? ''],
            yLower: datum.datum[yLowerKey ?? ''],
            yUpper: datum.datum[yUpperKey ?? ''],
        };
    }

    private convert(scale: AnyScale, value: any) {
        const offset = (scale.bandwidth ?? 0) / 2;
        return scale.convert(value) + offset;
    }

    private update() {
        const nodeData = this.getNodeData();
        if (nodeData !== undefined) {
            this.selection.update(nodeData);
            this.selection.each((node, datum, i) => this.updateNode(node, datum, i));
        }
    }

    private updateNode(node: ErrorBarNode, datum: ErrorBarNodeDatum, _index: number) {
        node.datum = datum;
        node.update(this.getDefaultStyle(), this.properties, false);
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
        const {
            xLowerKey,
            xUpperKey,
            yLowerKey,
            yUpperKey,
            xLowerName = xLowerKey,
            xUpperName = xUpperKey,
            yLowerName = yLowerKey,
            yUpperName = yUpperKey,
        } = this.properties;
        return { xLowerKey, xLowerName, xUpperKey, xUpperName, yLowerKey, yLowerName, yUpperKey, yUpperName };
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
            cap: mergeDefaults(this.properties.cap, baseStyle),
        };
    }

    private getDefaultStyle(): AgErrorBarThemeableOptions {
        return this.makeStyle(this.getWhiskerProperties());
    }

    private getHighlightStyle(): AgErrorBarThemeableOptions {
        // FIXME - at some point we should allow customising this
        return this.makeStyle(this.getWhiskerProperties());
    }

    private restyleHighlightChange(
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
                this.selection.nodes()[i].update(style, this.properties, highlighted);
                break;
            }
        }
    }

    private onHighlightChange(event: _ModuleSupport.HighlightChangeEvent) {
        const { previousHighlight, currentHighlight } = event;

        if (currentHighlight?.series === this.cartesianSeries) {
            // Highlight this node:
            this.restyleHighlightChange(currentHighlight, this.getHighlightStyle(), true);
        }

        if (previousHighlight?.series === this.cartesianSeries) {
            // Remove node highlight:
            this.restyleHighlightChange(previousHighlight, this.getDefaultStyle(), false);
        }

        this.groupNode.opacity = this.cartesianSeries.getOpacity();
    }

    private errorBarFactory(): ErrorBarNode {
        return new ErrorBarNode();
    }

    private getWhiskerProperties(): Omit<AgErrorBarThemeableOptions, 'cap'> {
        const { stroke, strokeWidth, visible, strokeOpacity, lineDash, lineDashOffset } = this.properties;
        return { stroke, strokeWidth, visible, strokeOpacity, lineDash, lineDashOffset };
    }
}
