import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import { type FlowProportionLinkDatum, type FlowProportionNodeDatum, FlowProportionSeries } from '../flow-proportion/flowProportionSeries';
import { ChordLink } from './chordLink';
import { ChordSeriesProperties } from './chordSeriesProperties';
interface ChordNodeDatum extends FlowProportionNodeDatum {
    size: number;
    centerX: number;
    centerY: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
}
interface ChordLinkDatum extends FlowProportionLinkDatum<ChordNodeDatum> {
    centerX: number;
    centerY: number;
    radius: number;
    startAngle1: number;
    endAngle1: number;
    startAngle2: number;
    endAngle2: number;
}
type ChordDatum = ChordLinkDatum | ChordNodeDatum;
interface ChordNodeLabelDatum {
    id: string;
    text: string;
    centerX: number;
    centerY: number;
    angle: number;
    radius: number;
}
export interface ChordNodeDataContext extends _ModuleSupport.SeriesNodeDataContext<ChordDatum, ChordNodeLabelDatum> {
}
export declare class ChordSeries extends FlowProportionSeries<ChordNodeDatum, ChordLinkDatum, ChordNodeLabelDatum, ChordSeriesProperties, _Scene.Sector, ChordLink> {
    static readonly className = "ChordSeries";
    static readonly type: "chord";
    properties: ChordSeriesProperties;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    private isLabelEnabled;
    protected linkFactory(): ChordLink;
    protected nodeFactory(): _Scene.Sector;
    createNodeData(): Promise<ChordNodeDataContext | undefined>;
    protected updateLabelSelection(opts: {
        labelData: ChordNodeLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, ChordNodeLabelDatum>;
    }): Promise<_Scene.Selection<_Scene.Text, ChordNodeLabelDatum>>;
    protected updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, ChordNodeLabelDatum>;
    }): Promise<void>;
    protected updateNodeSelection(opts: {
        nodeData: ChordNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Sector, ChordNodeDatum>;
    }): Promise<_Scene.Selection<_Scene.Sector, ChordNodeDatum>>;
    protected updateNodeNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Sector, ChordNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLinkSelection(opts: {
        nodeData: ChordLinkDatum[];
        datumSelection: _Scene.Selection<ChordLink, ChordLinkDatum>;
    }): Promise<_Scene.Selection<ChordLink, ChordLinkDatum>>;
    protected updateLinkNodes(opts: {
        datumSelection: _Scene.Selection<ChordLink, ChordLinkDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    resetAnimation(_chartAnimationPhase: _ModuleSupport.ChartAnimationPhase): void;
    getTooltipHtml(nodeDatum: ChordDatum): _ModuleSupport.TooltipContent;
    getLabelData(): _Util.PointLabelDatum[];
    protected computeFocusBounds({ datumIndex, }: _ModuleSupport.PickFocusInputs): _Scene.BBox | _Scene.Path | undefined;
}
export {};
