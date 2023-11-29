import { type AgSunburstSeriesFormatterParams, type AgSunburstSeriesLabelFormatterParams, type AgSunburstSeriesStyle, type AgSunburstSeriesTooltipRendererParams, _ModuleSupport, _Scene } from 'ag-charts-community';
import { AutoSizeableLabel } from '../util/labelFormatter';
declare const HighlightStyle: typeof _ModuleSupport.HighlightStyle;
declare class SunburstLabel extends AutoSizeableLabel<AgSunburstSeriesLabelFormatterParams> {
    spacing: number;
}
declare class SunburstSeriesTileHighlightStyle extends HighlightStyle {
    readonly label: AutoSizeableLabel<AgSunburstSeriesLabelFormatterParams<any>>;
    readonly secondaryLabel: AutoSizeableLabel<AgSunburstSeriesLabelFormatterParams<any>>;
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
}
export declare class SunburstSeries<TDatum extends _ModuleSupport.SeriesNodeDatum = _ModuleSupport.SeriesNodeDatum> extends _ModuleSupport.HierarchySeries<_Scene.Group, TDatum> {
    static className: string;
    static type: "sunburst";
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgSunburstSeriesTooltipRendererParams<any>>;
    groupSelection: _Scene.Selection<_Scene.Group, any>;
    private highlightSelection;
    private angleData;
    private labelData?;
    readonly highlightStyle: SunburstSeriesTileHighlightStyle;
    readonly label: SunburstLabel;
    readonly secondaryLabel: AutoSizeableLabel<AgSunburstSeriesLabelFormatterParams<any>>;
    sizeName?: string;
    labelKey?: string;
    secondaryLabelKey?: string;
    fillOpacity: number;
    strokeWidth: number;
    strokeOpacity: number;
    sectorSpacing?: number;
    padding?: number;
    formatter?: (params: AgSunburstSeriesFormatterParams) => AgSunburstSeriesStyle;
    processData(): Promise<void>;
    updateSelections(): Promise<void>;
    updateNodes(): Promise<void>;
    private getSectorFormat;
    getTooltipHtml(node: _ModuleSupport.HierarchyNode): string;
    createNodeData(): Promise<never[]>;
    protected animateEmptyUpdateReady({ datumSelections, }: _ModuleSupport.HierarchyAnimationData<_Scene.Group, TDatum>): void;
}
export {};
