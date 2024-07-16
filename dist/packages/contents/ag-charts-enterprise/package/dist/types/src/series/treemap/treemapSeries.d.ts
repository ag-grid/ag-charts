import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { TreemapSeriesProperties } from './treemapSeriesProperties';
declare class DistantGroup extends _Scene.Group implements _Scene.DistantObject {
    distanceSquared(x: number, y: number): number;
}
export declare class TreemapSeries<TDatum extends _ModuleSupport.SeriesNodeDatum = _ModuleSupport.SeriesNodeDatum> extends _ModuleSupport.HierarchySeries<DistantGroup, TreemapSeriesProperties, TDatum> {
    static readonly className = "TreemapSeries";
    static readonly type: "treemap";
    properties: TreemapSeriesProperties;
    groupSelection: _Scene.Selection<DistantGroup, any>;
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
    createNodeData(): Promise<undefined>;
    updateSelections(): Promise<void>;
    private getTileFormat;
    private getNodeFill;
    private getNodeStroke;
    updateNodes(): Promise<void>;
    private updateNodeMidPoint;
    protected pickNodeClosestDatum(point: _Scene.Point): _ModuleSupport.SeriesNodePickMatch | undefined;
    getTooltipHtml(node: _ModuleSupport.HierarchyNode): _ModuleSupport.TooltipContent;
}
export {};
