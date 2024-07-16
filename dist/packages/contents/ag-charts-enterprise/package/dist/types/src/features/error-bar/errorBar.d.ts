import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { ErrorBarProperties } from './errorBarProperties';
type PickNodeDatumResult = _ModuleSupport.PickNodeDatumResult;
type Point = _Scene.Point;
type PropertyDefinitionOpts = Parameters<_ModuleSupport.SeriesOptionInstance['getPropertyDefinitions']>[0];
export declare class ErrorBars extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.SeriesOptionInstance {
    private readonly cartesianSeries;
    private readonly groupNode;
    private readonly selection;
    readonly properties: ErrorBarProperties;
    private dataModel?;
    private processedData?;
    constructor(ctx: _ModuleSupport.SeriesContext);
    private hasErrorBars;
    private isStacked;
    private getUnstackPropertyDefinition;
    private getStackPropertyDefinition;
    getPropertyDefinitions(opts: PropertyDefinitionOpts): _ModuleSupport.PropertyDefinition<unknown>[];
    private onDataProcessed;
    getDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    private onDataUpdate;
    private getNodeData;
    private createNodeData;
    private getMaybeFlippedKeys;
    private static getDatumKey;
    private getDatum;
    private convert;
    private update;
    private updateNode;
    pickNodeExact(point: Point): PickNodeDatumResult;
    pickNodeNearest(point: Point): PickNodeDatumResult;
    pickNodeMainAxisFirst(point: Point): PickNodeDatumResult;
    getTooltipParams(): {
        xLowerKey: string | undefined;
        xLowerName: string | undefined;
        xUpperKey: string | undefined;
        xUpperName: string | undefined;
        yLowerKey: string | undefined;
        yLowerName: string | undefined;
        yUpperKey: string | undefined;
        yUpperName: string | undefined;
    };
    private onToggleSeriesItem;
    private makeStyle;
    private getDefaultStyle;
    private getHighlightStyle;
    private restyleHighlightChange;
    private onHighlightChange;
    private errorBarFactory;
    private getWhiskerProperties;
}
export {};
