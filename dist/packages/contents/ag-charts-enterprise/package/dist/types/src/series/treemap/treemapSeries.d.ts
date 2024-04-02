import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { TreemapSeriesProperties } from './treemapSeriesProperties';
export declare class TreemapSeries<TDatum extends _ModuleSupport.SeriesNodeDatum = _ModuleSupport.SeriesNodeDatum> extends _ModuleSupport.HierarchySeries<_Scene.Group, TreemapSeriesProperties, TDatum> {
    static readonly className = "TreemapSeries";
    static readonly type: "treemap";
    properties: TreemapSeriesProperties;
    groupSelection: _Scene.Selection<_Scene.Group, any>;
    private highlightSelection;
    private labelData?;
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
