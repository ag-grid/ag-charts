import type { AgRadialSeriesFormat } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { RadialColumnSeriesBaseProperties } from './radialColumnSeriesBaseProperties';
declare class RadialColumnSeriesNodeClickEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.SeriesNodeClickEvent<RadialColumnNodeDatum, TEvent> {
    readonly angleKey?: string;
    readonly radiusKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: RadialColumnNodeDatum, series: RadialColumnSeriesBase<any>);
}
interface RadialColumnLabelNodeDatum {
    text: string;
    x: number;
    y: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}
export interface RadialColumnNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly label?: RadialColumnLabelNodeDatum;
    readonly angleValue: any;
    readonly radiusValue: any;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly startAngle: number;
    readonly endAngle: number;
    readonly axisInnerRadius: number;
    readonly axisOuterRadius: number;
    readonly columnWidth: number;
    readonly index: number;
}
export declare abstract class RadialColumnSeriesBase<ItemPathType extends _Scene.Sector | _Scene.RadialColumnShape> extends _ModuleSupport.PolarSeries<RadialColumnNodeDatum, ItemPathType> {
    protected readonly NodeClickEvent: typeof RadialColumnSeriesNodeClickEvent;
    abstract properties: RadialColumnSeriesBaseProperties<any>;
    protected nodeData: RadialColumnNodeDatum[];
    private groupScale;
    constructor(moduleCtx: _ModuleSupport.ModuleContext, { animationResetFns, }: {
        animationResetFns?: {
            item?: (node: ItemPathType, datum: RadialColumnNodeDatum) => _ModuleSupport.AnimationValue & Partial<ItemPathType>;
        };
    });
    addChartEventListeners(): void;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    protected abstract getStackId(): string;
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    protected circleCache: {
        r: number;
        cx: number;
        cy: number;
    };
    protected didCircleChange(): boolean;
    protected isRadiusAxisReversed(): boolean | undefined;
    maybeRefreshNodeData(): Promise<void>;
    protected getAxisInnerRadius(): number;
    createNodeData(): Promise<{
        itemId: string;
        nodeData: RadialColumnNodeDatum[];
        labelData: RadialColumnNodeDatum[];
    }[]>;
    protected getColumnWidth(_startAngle: number, _endAngle: number): number;
    update({ seriesRect }: {
        seriesRect?: _Scene.BBox;
    }): Promise<void>;
    protected abstract updateItemPath(node: ItemPathType, datum: RadialColumnNodeDatum, highlight: boolean, format: AgRadialSeriesFormat | undefined): void;
    protected updateSectorSelection(selection: _Scene.Selection<ItemPathType, RadialColumnNodeDatum>, highlight: boolean): void;
    protected updateLabels(): void;
    protected abstract getColumnTransitionFunctions(): {
        fromFn: _Scene.FromToMotionPropFn<any, any, any>;
        toFn: _Scene.FromToMotionPropFn<any, any, any>;
    };
    protected animateEmptyUpdateReady(): void;
    animateClearingUpdateEmpty(): void;
    getTooltipHtml(nodeDatum: RadialColumnNodeDatum): string;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    onLegendItemClick(event: _ModuleSupport.LegendItemClickChartEvent): void;
    onLegendItemDoubleClick(event: _ModuleSupport.LegendItemDoubleClickChartEvent): void;
    computeLabelsBBox(): null;
}
export {};
