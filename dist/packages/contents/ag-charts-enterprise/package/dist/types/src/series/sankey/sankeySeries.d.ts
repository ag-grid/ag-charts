import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import { FlowProportionSeries } from '../flow-proportion/flowProportionSeries';
import { SankeyLink } from './sankeyLink';
import { type SankeyDatum, type SankeyLinkDatum, type SankeyNodeDatum, type SankeyNodeLabelDatum, SankeySeriesProperties } from './sankeySeriesProperties';
export interface SankeyNodeDataContext extends _ModuleSupport.SeriesNodeDataContext<SankeyDatum, SankeyNodeLabelDatum> {
}
export declare class SankeySeries extends FlowProportionSeries<SankeyNodeDatum, SankeyLinkDatum, SankeyNodeLabelDatum, SankeySeriesProperties, _Scene.Rect, SankeyLink> {
    static readonly className = "SankeySeries";
    static readonly type: "sankey";
    properties: SankeySeriesProperties;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    private isLabelEnabled;
    protected linkFactory(): SankeyLink;
    protected nodeFactory(): _Scene.Rect;
    createNodeData(): Promise<SankeyNodeDataContext | undefined>;
    protected updateLabelSelection(opts: {
        labelData: SankeyNodeLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, SankeyNodeLabelDatum>;
    }): Promise<_Scene.Selection<_Scene.Text, SankeyNodeLabelDatum>>;
    protected updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, SankeyNodeLabelDatum>;
    }): Promise<void>;
    protected updateNodeSelection(opts: {
        nodeData: SankeyNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, SankeyNodeDatum>;
    }): Promise<_Scene.Selection<_Scene.Rect, SankeyNodeDatum>>;
    protected updateNodeNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, SankeyNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLinkSelection(opts: {
        nodeData: SankeyLinkDatum[];
        datumSelection: _Scene.Selection<SankeyLink, SankeyLinkDatum>;
    }): Promise<_Scene.Selection<SankeyLink, SankeyLinkDatum>>;
    protected updateLinkNodes(opts: {
        datumSelection: _Scene.Selection<SankeyLink, SankeyLinkDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    getTooltipHtml(nodeDatum: SankeyDatum): _ModuleSupport.TooltipContent;
    getLabelData(): _Util.PointLabelDatum[];
    protected computeFocusBounds({ datumIndex, seriesRect, }: _ModuleSupport.PickFocusInputs): _Scene.BBox | _Scene.Path | undefined;
}
