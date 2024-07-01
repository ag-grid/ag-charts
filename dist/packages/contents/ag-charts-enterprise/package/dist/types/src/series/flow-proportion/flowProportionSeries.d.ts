import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { FlowProportionSeriesProperties } from './flowProportionProperties';
declare const DataModelSeries: typeof _ModuleSupport.DataModelSeries;
export declare enum FlowProportionDatumType {
    Link = 0,
    Node = 1
}
export interface FlowProportionLinkDatum<TNodeDatum extends FlowProportionNodeDatum> extends _ModuleSupport.SeriesNodeDatum {
    type: FlowProportionDatumType.Link;
    index: number;
    fromNode: TNodeDatum;
    toNode: TNodeDatum;
    size: number;
}
export interface FlowProportionNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    type: FlowProportionDatumType.Node;
    index: number;
    id: string;
    label: string | undefined;
    fill: string;
    stroke: string;
}
export type TDatum<TNodeDatum extends FlowProportionNodeDatum, TLinkDatum extends FlowProportionLinkDatum<TNodeDatum>> = TLinkDatum | TNodeDatum;
export declare abstract class FlowProportionSeries<TNodeDatum extends FlowProportionNodeDatum, TLinkDatum extends FlowProportionLinkDatum<TNodeDatum>, TLabel, TProps extends FlowProportionSeriesProperties<any>, TNode extends _Scene.Node & _ModuleSupport.DistantObject, TLink extends _Scene.Node & _ModuleSupport.DistantObject> extends DataModelSeries<TDatum<TNodeDatum, TLinkDatum>, TProps, TLabel, _ModuleSupport.SeriesNodeDataContext<TDatum<TNodeDatum, TLinkDatum>, TLabel>> implements _ModuleSupport.FlowProportionSeries {
    abstract properties: TProps;
    private _chartNodes?;
    protected get nodes(): any[] | undefined;
    protected nodeCount: number;
    protected linkCount: number;
    private readonly nodesDataController;
    protected nodesDataModel: _ModuleSupport.DataModel<any, any, true> | undefined;
    protected nodesProcessedData: _ModuleSupport.ProcessedData<any> | undefined;
    contextNodeData?: _ModuleSupport.SeriesNodeDataContext<TDatum<TNodeDatum, TLinkDatum>, TLabel>;
    private processedNodes;
    private readonly linkGroup;
    private readonly nodeGroup;
    private readonly focusLinkGroup;
    private readonly focusNodeGroup;
    private readonly highlightLinkGroup;
    private readonly highlightNodeGroup;
    private labelSelection;
    linkSelection: _Scene.Selection<TLink, TLinkDatum>;
    nodeSelection: _Scene.Selection<TNode, TNodeDatum>;
    private focusLinkSelection;
    private focusNodeSelection;
    private highlightLinkSelection;
    private highlightNodeSelection;
    setChartNodes(nodes: any[] | undefined): void;
    getNodeData(): TDatum<TNodeDatum, TLinkDatum>[] | undefined;
    protected abstract linkFactory(): TLink;
    protected abstract nodeFactory(): TNode;
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    protected getNodeGraph(createNode: (node: FlowProportionNodeDatum) => TNodeDatum, createLink: (link: FlowProportionLinkDatum<TNodeDatum>) => TLinkDatum, { includeCircularReferences }: {
        includeCircularReferences: boolean;
    }): {
        nodeGraph: Map<string, import("./flowProportionUtil").NodeGraphEntry<TNodeDatum, TLinkDatum>>;
        links: TLinkDatum[];
        maxPathLength: number;
    };
    updateSelections(): Promise<void>;
    update(opts: {
        seriesRect?: _Scene.BBox | undefined;
    }): Promise<void>;
    protected abstract updateLabelSelection(opts: {
        labelData: TLabel[];
        labelSelection: _Scene.Selection<_Scene.Text, TLabel>;
    }): Promise<_Scene.Selection<_Scene.Text, TLabel>>;
    protected abstract updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, TLabel>;
    }): Promise<void>;
    protected abstract updateNodeSelection(opts: {
        nodeData: TNodeDatum[];
        datumSelection: _Scene.Selection<TNode, TNodeDatum>;
    }): Promise<_Scene.Selection<TNode, TNodeDatum>>;
    protected abstract updateNodeNodes(opts: {
        datumSelection: _Scene.Selection<TNode, TNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected abstract updateLinkSelection(opts: {
        nodeData: TLinkDatum[];
        datumSelection: _Scene.Selection<TLink, TLinkDatum>;
    }): Promise<_Scene.Selection<TLink, TLinkDatum>>;
    protected abstract updateLinkNodes(opts: {
        datumSelection: _Scene.Selection<TLink, TLinkDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    resetAnimation(_chartAnimationPhase: _ModuleSupport.ChartAnimationPhase): void;
    getSeriesDomain(_direction: _ModuleSupport.ChartAxisDirection): any[];
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    pickNodeClosestDatum({ x, y }: _Scene.Point): _ModuleSupport.SeriesNodePickMatch | undefined;
    getDatumAriaText(datum: TDatum<TNodeDatum, TLinkDatum>, description: string): string | undefined;
}
export {};
