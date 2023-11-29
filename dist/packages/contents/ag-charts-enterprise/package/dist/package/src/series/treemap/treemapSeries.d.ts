import { type AgTreemapSeriesFormatterParams, type AgTreemapSeriesLabelFormatterParams, type AgTreemapSeriesStyle, type AgTreemapSeriesTooltipRendererParams, type TextAlign, type VerticalAlign, _ModuleSupport, _Scene } from 'ag-charts-community';
import { AutoSizeableLabel } from '../util/labelFormatter';
declare const HighlightStyle: typeof _ModuleSupport.HighlightStyle;
declare const Label: typeof _Scene.Label;
declare class TreemapGroupLabel extends Label<AgTreemapSeriesLabelFormatterParams> {
    spacing: number;
}
declare class TreemapSeriesGroup {
    readonly label: TreemapGroupLabel;
    gap: number;
    interactive: boolean;
    textAlign: TextAlign;
    fill?: string;
    fillOpacity: number;
    stroke?: string;
    strokeWidth: number;
    strokeOpacity: number;
    padding: number;
}
declare class TreemapTileLabel extends AutoSizeableLabel<AgTreemapSeriesLabelFormatterParams> {
    spacing: number;
}
declare class TreemapSeriesTile {
    readonly label: TreemapTileLabel;
    readonly secondaryLabel: AutoSizeableLabel<AgTreemapSeriesLabelFormatterParams<any>>;
    gap: number;
    fill?: string;
    fillOpacity: number;
    stroke?: string;
    strokeWidth: number;
    strokeOpacity: number;
    padding: number;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
}
declare class TreemapSeriesGroupHighlightStyle {
    readonly label: AutoSizeableLabel<AgTreemapSeriesLabelFormatterParams<any>>;
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
}
declare class TreemapSeriesTileHighlightStyle {
    readonly label: AutoSizeableLabel<AgTreemapSeriesLabelFormatterParams<any>>;
    readonly secondaryLabel: AutoSizeableLabel<AgTreemapSeriesLabelFormatterParams<any>>;
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
}
declare class TreemapSeriesHighlightStyle extends HighlightStyle {
    readonly group: TreemapSeriesGroupHighlightStyle;
    readonly tile: TreemapSeriesTileHighlightStyle;
}
export declare class TreemapSeries<TDatum extends _ModuleSupport.SeriesNodeDatum = _ModuleSupport.SeriesNodeDatum> extends _ModuleSupport.HierarchySeries<_Scene.Group, TDatum> {
    static className: string;
    static type: "treemap";
    groupSelection: _Scene.Selection<_Scene.Group, any>;
    private highlightSelection;
    private labelData?;
    readonly group: TreemapSeriesGroup;
    readonly tile: TreemapSeriesTile;
    readonly highlightStyle: TreemapSeriesHighlightStyle;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgTreemapSeriesTooltipRendererParams<any>>;
    sizeName?: string;
    labelKey?: string;
    secondaryLabelKey?: string;
    formatter?: (params: AgTreemapSeriesFormatterParams) => AgTreemapSeriesStyle;
    undocumentedGroupFills: string[];
    undocumentedGroupStrokes: string[];
    private groupTitleHeight;
    private getNodePadding;
    processData(): Promise<void>;
    /**
     * Squarified Treemap algorithm
     * https://www.win.tue.nl/~vanwijk/stm.pdf
     */
    private squarify;
    private applyGap;
    createNodeData(): Promise<never[]>;
    updateSelections(): Promise<void>;
    private getTileFormat;
    private getNodeFill;
    private getNodeStroke;
    updateNodes(): Promise<void>;
    private updateNodeMidPoint;
    getTooltipHtml(node: _ModuleSupport.HierarchyNode): string;
}
export {};
