import type { AgErrorBarThemeableOptions, AgSeriesVisibilityChange } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    Logger,
    type PickNodeDatumResult,
    type Point,
    type PropertyDefinitionOpts,
    type Scale,
    type ScaleType,
    type SeriesPluginModuleInstance,
    extractDomain,
    isDefined,
    mergeDefaults,
} from 'ag-charts-core';

import { readDatum } from '../../utils/datum';
import type { ErrorBarNodeDatum, ErrorBarStylingOptions } from './errorBarNode';
import { ErrorBarGroup, ErrorBarNode } from './errorBarNode';
import { ErrorBarProperties } from './errorBarProperties';

const { fixNumericExtent, groupAccumulativeValueProperty, valueProperty, ChartAxisDirection } = _ModuleSupport;

type ErrorBoundCartesianSeries = Omit<
    _ModuleSupport.CartesianSeries<
        _ModuleSupport.Node,
        object,
        _ModuleSupport.CartesianSeriesProperties<any>,
        ErrorBarNodeDatum
    >,
    'highlightSelection'
>;

type AnyDataModel = _ModuleSupport.DataModel<any, any, any>;
type AnyProcessedData = _ModuleSupport.ProcessedData<any>;
type HighlightNodeDatum = NonNullable<_ModuleSupport.HighlightChangeEvent['currentHighlight']>;
type SeriesDataEvent = _ModuleSupport.SeriesDataEvent;

export class ErrorBars extends AbstractModuleInstance implements SeriesPluginModuleInstance {
    private readonly cartesianSeries: ErrorBoundCartesianSeries;
    private readonly groupNode: ErrorBarGroup;
    private readonly selection: _ModuleSupport.Selection<ErrorBarNode>;

    readonly properties = new ErrorBarProperties();

    private dataModel?: AnyDataModel;
    private processedData?: AnyProcessedData;

    constructor(ctx: _ModuleSupport.SeriesContext) {
        super();

        const series = ctx.series as ErrorBoundCartesianSeries;
        const { annotationGroup, annotationSelections } = series;

        this.cartesianSeries = series;
        this.groupNode = new ErrorBarGroup({
            name: `${annotationGroup.id}-errorBars`,
        });

        annotationGroup.appendChild(this.groupNode);
        this.selection = _ModuleSupport.Selection.select(this.groupNode, () => this.errorBarFactory());
        annotationSelections.add(this.selection);

        series.addEventListener('seriesVisibilityChange', (e: AgSeriesVisibilityChange) => this.onToggleSeriesItem(e));
        this.cleanup.register(
            series.events.on('data-processed', (e) => this.onDataProcessed(e)),
            series.events.on('data-update', (e) => this.onDataUpdate(e)),
            ctx.eventsHub.on('highlight:change', (event) => this.onHighlightChange(event)),
            () => this.groupNode.remove(),
            () => annotationSelections.delete(this.selection)
        );
    }

    private hasErrorBars(): boolean {
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this.properties;
        return (isDefined(xLowerKey) && isDefined(xUpperKey)) || (isDefined(yLowerKey) && isDefined(yUpperKey));
    }

    private isStacked(): boolean {
        const stackCount = this.cartesianSeries.seriesGrouping?.stackCount;
        return stackCount == null ? false : stackCount > 0;
    }

    private getUnstackPropertyDefinition(opts: PropertyDefinitionOpts) {
        const props: _ModuleSupport.PropertyDefinition<unknown>[] = [];
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey, xErrorsID, yErrorsID } = this.getMaybeFlippedKeys();
        const { xScaleType, yScaleType } = opts;

        if (yLowerKey != null && yUpperKey != null) {
            props.push(
                valueProperty(yLowerKey, yScaleType, { id: `${yErrorsID}-lower` }),
                valueProperty(yUpperKey, yScaleType, { id: `${yErrorsID}-upper` })
            );
        }
        if (xLowerKey != null && xUpperKey != null) {
            props.push(
                valueProperty(xLowerKey, xScaleType, { id: `${xErrorsID}-lower` }),
                valueProperty(xUpperKey, xScaleType, { id: `${xErrorsID}-upper` })
            );
        }
        return props;
    }

    private getStackPropertyDefinition(opts: PropertyDefinitionOpts) {
        const props: _ModuleSupport.PropertyDefinition<unknown>[] = [];
        const { cartesianSeries } = this;
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey, xErrorsID, yErrorsID } = this.getMaybeFlippedKeys();
        const { xScaleType, yScaleType } = opts;

        const groupIndex = cartesianSeries.seriesGrouping?.groupIndex ?? cartesianSeries.id;
        const groupOpts = {
            invalidValue: null,
            missingValue: 0,
            separateNegative: true,
            ...(cartesianSeries.visible ? {} : { forceValue: 0 }),
        };
        const makeErrorProperty = (key: string, id: string, type: 'lower' | 'upper', scaleType?: ScaleType) => {
            return groupAccumulativeValueProperty(
                key,
                'normal',
                {
                    id: `${id}-${type}`,
                    groupId: `errorGroup-${groupIndex}-${type}`,
                    ...groupOpts,
                },
                scaleType
            );
        };
        const pushErrorProperties = (lowerKey: string, upperKey: string, id: string, scaleType?: ScaleType) => {
            props.push(
                ...makeErrorProperty(lowerKey, id, 'lower', scaleType),
                ...makeErrorProperty(upperKey, id, 'upper', scaleType)
            );
        };

        if (yLowerKey != null && yUpperKey != null) {
            pushErrorProperties(yLowerKey, yUpperKey, yErrorsID, yScaleType);
        }

        if (xLowerKey != null && xUpperKey != null) {
            pushErrorProperties(xLowerKey, xUpperKey, xErrorsID, xScaleType);
        }

        return props;
    }

    getPropertyDefinitions(opts: PropertyDefinitionOpts) {
        if (this.isStacked()) {
            return this.getStackPropertyDefinition(opts);
        } else {
            return this.getUnstackPropertyDefinition(opts);
        }
    }

    private onDataProcessed(event: SeriesDataEvent) {
        this.dataModel = event.dataModel;
        this.processedData = event.processedData;
    }

    getDomain(direction: _ModuleSupport.ChartAxisDirection.X | _ModuleSupport.ChartAxisDirection.Y): any[] {
        const { xLowerKey, xUpperKey, xErrorsID, yLowerKey, yUpperKey, yErrorsID } = this.getMaybeFlippedKeys();
        const hasAxisErrors =
            direction === ChartAxisDirection.X
                ? isDefined(xLowerKey) && isDefined(xUpperKey)
                : isDefined(yLowerKey) && isDefined(yUpperKey);

        if (hasAxisErrors) {
            const { dataModel, processedData, cartesianSeries: series } = this;

            if (dataModel != null && processedData != null) {
                const id = { x: xErrorsID, y: yErrorsID }[direction];
                const lowerDomain = extractDomain(dataModel.getDomain(series, `${id}-lower`, 'value', processedData));
                const upperDomain = extractDomain(dataModel.getDomain(series, `${id}-upper`, 'value', processedData));
                const domain = [Math.min(...lowerDomain, ...upperDomain), Math.max(...lowerDomain, ...upperDomain)];
                return fixNumericExtent(domain);
            }
        }
        return [];
    }

    private onDataUpdate(event: SeriesDataEvent) {
        this.dataModel = event.dataModel;
        this.processedData = event.processedData;
        if (isDefined(event.dataModel) && isDefined(event.processedData)) {
            this.createNodeData();
            this.update();
        }
    }

    private getNodeData(): ErrorBarNodeDatum[] | undefined {
        return this.hasErrorBars() ? this.cartesianSeries.contextNodeData?.nodeData : undefined;
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
            if (midPoint != null) {
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

    private static getDatumKey(
        nodeDatum: ErrorBarNodeDatum,
        key: string | undefined,
        offset: number
    ): number | undefined {
        // Check if the user input datum has the error value for `key`:
        if (key == null) {
            return;
        }
        const datum = readDatum(nodeDatum);
        const value: unknown = datum?.[key];
        if (value == null) {
            return;
        }

        // The datum has an error value for `key`. TempValidate this user input value:
        if (typeof value !== 'number') {
            Logger.warnOnce(`Found [${key}] error value of type ${typeof value}. Expected number type`);
            return;
        }

        return value + offset;
    }

    private getDatum(nodeData: ErrorBarNodeDatum[], datumIndex: number) {
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this.getMaybeFlippedKeys();
        const datum = nodeData[datumIndex];

        // In stacked bar series, we need to calculate the cumulative error values.
        // But generally, these offsets will both be 0.
        const d = datum.cumulativeValue == null || !this.isStacked() ? 0 : datum.cumulativeValue - datum.yValue;
        const [xOffset, yOffset] = this.cartesianSeries.shouldFlipXY() ? [d, 0] : [0, d];

        return {
            midPoint: datum.midPoint,
            xLower: ErrorBars.getDatumKey(datum, xLowerKey, xOffset),
            xUpper: ErrorBars.getDatumKey(datum, xUpperKey, xOffset),
            yLower: ErrorBars.getDatumKey(datum, yLowerKey, yOffset),
            yUpper: ErrorBars.getDatumKey(datum, yUpperKey, yOffset),
        };
    }

    private convert(scale: Scale<any, any, any>, value: any) {
        const offset = (scale.bandwidth ?? 0) / 2;
        return scale.convert(value) + offset;
    }

    private update() {
        const nodeData = this.getNodeData();
        if (nodeData != null) {
            this.selection.update(nodeData);
            this.selection.each((node, datum, i) => this.updateNode(node, datum, i));
        }
    }

    private updateNode(node: ErrorBarNode, datum: ErrorBarNodeDatum, _index: number) {
        node.datum = datum;
        node.update(this.getDefaultStyle(), this.properties, this.cartesianSeries, false, 'none');
        node.updateBBoxes();
    }

    pickNodeExact(point: Point): PickNodeDatumResult {
        const { x, y } = point;
        const node = this.groupNode.pickNode(x, y);
        if (node != null) {
            return { datum: node.datum, distanceSquared: 0 };
        }
    }

    pickNodeNearest(point: Point): PickNodeDatumResult {
        return this.groupNode.nearestSquared(point.x, point.y);
    }

    pickNodeMainAxisFirst(
        point: Point,
        majorDirection: _ModuleSupport.ChartAxisDirection
    ): PickNodeDatumResult | undefined {
        let closestDatum;
        let closestDistance = [Infinity, Infinity];
        const referencePoints = [point.x, point.y];
        if (majorDirection === ChartAxisDirection.Y) {
            referencePoints.reverse();
        }
        for (const child of this.groupNode.children()) {
            const childBBox = child.getBBox();
            const childReferencePoints = [childBBox.x + childBBox.width / 2, childBBox.y + childBBox.height / 2];
            if (majorDirection === ChartAxisDirection.Y) {
                childReferencePoints.reverse();
            }
            const childDistances = [];
            for (let i = 0; i < referencePoints.length; i++) {
                childDistances.push(Math.abs(referencePoints[i] - childReferencePoints[i]));
            }
            if (
                childDistances[0] < closestDistance[0] ||
                (childDistances[0] == closestDistance[0] && childDistances[1] < closestDistance[1])
            ) {
                closestDatum = child.datum;
                closestDistance = childDistances;
            }
        }

        if (closestDatum) {
            return {
                datum: closestDatum,
                distanceSquared: Math.pow(closestDistance[0], 2) + Math.pow(closestDistance[1], 2),
            };
        }
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

    private onToggleSeriesItem(event: AgSeriesVisibilityChange): void {
        this.groupNode.visible = event.visible;
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
        if (nodeData == null) return;

        // Search for the ErrorBarNode that matches this highlight change. This
        // isn't a good solution in terms of performance. However, it's assumed
        // that the typical use case for error bars includes few data points
        // (because the chart will get cluttered very quickly if there are many
        // data points with error bars).
        for (let i = 0; i < nodeData.length; i++) {
            if (highlightChange === nodeData[i]) {
                this.selection
                    .at(i)
                    ?.update(
                        style,
                        this.properties,
                        this.cartesianSeries,
                        highlighted,
                        highlighted ? 'highlighted-item' : 'unhighlighted-item'
                    );
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
