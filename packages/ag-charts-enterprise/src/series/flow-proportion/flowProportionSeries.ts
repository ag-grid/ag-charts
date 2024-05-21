import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { FlowProportionSeriesProperties } from './flowProportionProperties';
import { computeNodeGraph } from './flowProportionUtil';

const { DataModelSeries, DataController, Validate, ARRAY, keyProperty, valueProperty } = _ModuleSupport;
const { Selection, Group, Text } = _Scene;

export enum FlowProportionDatumType {
    Link,
    Node,
}

export interface FlowProportionLinkDatum<TNodeDatum extends FlowProportionNodeDatum>
    extends _ModuleSupport.SeriesNodeDatum {
    type: FlowProportionDatumType.Link;
    fromNode: TNodeDatum;
    toNode: TNodeDatum;
    size: number;
}

export interface FlowProportionNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    type: FlowProportionDatumType.Node;
    id: string;
    label: string | undefined;
    fill: string;
    stroke: string;
}

export type TDatum<
    TNodeDatum extends FlowProportionNodeDatum,
    TLinkDatum extends FlowProportionLinkDatum<TNodeDatum>,
> = TLinkDatum | TNodeDatum;

export abstract class FlowProportionSeries<
        TNodeDatum extends FlowProportionNodeDatum,
        TLinkDatum extends FlowProportionLinkDatum<TNodeDatum>,
        TLabel,
        TPlacedLabel,
        TProps extends FlowProportionSeriesProperties<any>,
        TNode extends _Scene.Node,
        TLink extends _Scene.Node,
    >
    extends DataModelSeries<
        TDatum<TNodeDatum, TLinkDatum>,
        TProps,
        TLabel,
        _ModuleSupport.SeriesNodeDataContext<TDatum<TNodeDatum, TLinkDatum>, TLabel>
    >
    implements _ModuleSupport.FlowProportionSeries
{
    abstract override properties: TProps;

    @Validate(ARRAY, { optional: true, property: 'nodes' })
    private _chartNodes?: any[] = undefined;

    protected get nodes() {
        return this.properties.nodes ?? this._chartNodes;
    }

    private readonly nodesDataController = new DataController('standalone');
    protected nodesDataModel: _ModuleSupport.DataModel<any, any, true> | undefined = undefined;
    protected nodesProcessedData: _ModuleSupport.ProcessedData<any> | undefined = undefined;

    public contextNodeData?: _ModuleSupport.SeriesNodeDataContext<TDatum<TNodeDatum, TLinkDatum>, TLabel>;

    private readonly linkGroup = this.contentGroup.appendChild(new Group({ name: 'linkGroup' }));
    private readonly nodeGroup = this.contentGroup.appendChild(new Group({ name: 'nodeGroup' }));
    private readonly focusLinkGroup = this.highlightNode.appendChild(new Group({ name: 'linkGroup' }));
    private readonly focusNodeGroup = this.highlightNode.appendChild(new Group({ name: 'nodeGroup' }));
    private readonly highlightLinkGroup = this.highlightNode.appendChild(new Group({ name: 'linkGroup' }));
    private readonly highlightNodeGroup = this.highlightNode.appendChild(new Group({ name: 'nodeGroup' }));

    private labelSelection: _Scene.Selection<_Scene.Text, TPlacedLabel> = Selection.select(this.labelGroup, Text);
    public linkSelection: _Scene.Selection<TLink, TLinkDatum> = Selection.select(this.linkGroup, () =>
        this.linkFactory()
    );
    public nodeSelection: _Scene.Selection<TNode, TNodeDatum> = Selection.select(this.nodeGroup, () =>
        this.nodeFactory()
    );
    private focusLinkSelection: _Scene.Selection<TLink, TLinkDatum> = Selection.select(this.focusLinkGroup, () =>
        this.linkFactory()
    );
    private focusNodeSelection: _Scene.Selection<TNode, TNodeDatum> = Selection.select(this.focusNodeGroup, () =>
        this.nodeFactory()
    );
    private highlightLinkSelection: _Scene.Selection<TLink, TLinkDatum> = Selection.select(
        this.highlightLinkGroup,
        () => this.linkFactory()
    );
    private highlightNodeSelection: _Scene.Selection<TNode, TNodeDatum> = Selection.select(
        this.highlightNodeGroup,
        () => this.nodeFactory()
    );

    setChartNodes(nodes: any[] | undefined): void {
        this._chartNodes = nodes;
        if (this.nodes === nodes) {
            this.nodeDataRefresh = true;
        }
    }

    public override getNodeData(): TDatum<TNodeDatum, TLinkDatum>[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    protected abstract linkFactory(): TLink;
    protected abstract nodeFactory(): TNode;

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        const { nodesDataController, data, nodes } = this;

        if (data == null || !this.properties.isValid()) {
            return;
        }

        const { fromIdKey, toIdKey, sizeKey, nodeIdKey, labelKey } = this.properties;

        const linksDataModelPromise = this.requestDataModel<any, any, false>(dataController, data, {
            props: [
                valueProperty(fromIdKey, undefined, { id: 'fromIdValue', includeProperty: false }),
                valueProperty(toIdKey, undefined, { id: 'toIdValue', includeProperty: false }),
                ...(sizeKey != null
                    ? [valueProperty(sizeKey, undefined, { id: 'sizeValue', includeProperty: false })]
                    : []),
            ],
            groupByKeys: false,
        });

        const nodesDataModelPromise =
            nodes != null
                ? this.requestDataModel<any, any, true>(nodesDataController, nodes, {
                      props: [
                          keyProperty(nodeIdKey, undefined, { id: 'nodeIdValue', includeProperty: false }),
                          ...(labelKey != null
                              ? [valueProperty(labelKey, undefined, { id: 'labelValue', includeProperty: false })]
                              : []),
                      ],
                      groupByKeys: true,
                  })
                : null;

        if (nodes != null) {
            nodesDataController.execute();
        }

        const [nodesDataModel] = await Promise.all([nodesDataModelPromise, linksDataModelPromise]);

        this.nodesDataModel = nodesDataModel?.dataModel;
        this.nodesProcessedData = nodesDataModel?.processedData;
    }

    protected getNodeGraph(
        createNode: (node: FlowProportionNodeDatum) => TNodeDatum,
        createLink: (link: FlowProportionLinkDatum<TNodeDatum>) => TLinkDatum,
        { allowCircularReferences }: { allowCircularReferences: boolean }
    ) {
        const {
            nodesDataModel,
            nodesProcessedData,
            dataModel: linksDataModel,
            processedData: linksProcessedData,
        } = this;

        const nodesById = new Map<string, TNodeDatum>();
        const links: TLinkDatum[] = [];

        if (linksDataModel == null || linksProcessedData == null) {
            const { nodeGraph, maxPathLength } = computeNodeGraph(nodesById.values(), links, allowCircularReferences);
            return { nodeGraph, links, maxPathLength };
        }

        const { sizeKey, labelKey, fills, strokes } = this.properties;

        const fromIdIdx = linksDataModel.resolveProcessedDataIndexById(this, 'fromIdValue');
        const toIdIdx = linksDataModel.resolveProcessedDataIndexById(this, 'toIdValue');
        const sizeIdx = sizeKey != null ? linksDataModel.resolveProcessedDataIndexById(this, 'sizeValue') : undefined;

        let createImplicitNode: ((id: string) => TNodeDatum) | undefined = undefined;
        if (nodesDataModel != null && nodesProcessedData != null) {
            const nodeIdIdx = nodesDataModel.resolveProcessedDataIndexById(this, 'nodeIdValue');
            const labelIdx =
                labelKey != null ? nodesDataModel.resolveProcessedDataIndexById(this, 'labelValue') : undefined;

            nodesProcessedData.data.forEach(({ datum, keys, values }, index) => {
                const value = values[0];
                const id: string = keys[nodeIdIdx];
                const label: string | undefined = labelIdx != null ? value[labelIdx] : undefined;

                const fill = fills[index % fills.length];
                const stroke = strokes[index % strokes.length];

                const node = createNode({
                    series: this,
                    itemId: undefined,
                    datum,
                    type: FlowProportionDatumType.Node,
                    id,
                    label,
                    fill,
                    stroke,
                });
                nodesById.set(id, node);
            });
        } else {
            createImplicitNode = (id) => {
                const fill = fills[nodesById.size % fills.length];
                const stroke = strokes[nodesById.size % strokes.length];

                const node = createNode({
                    series: this,
                    itemId: undefined,
                    datum: undefined,
                    type: FlowProportionDatumType.Node,
                    id: id,
                    label: id,
                    fill,
                    stroke,
                });

                nodesById.set(id, node);

                return node;
            };
        }

        linksProcessedData.data.forEach(({ datum, values }) => {
            const fromId: string = values[fromIdIdx];
            const toId: string = values[toIdIdx];
            const size: number = sizeIdx != null ? values[sizeIdx] : 0;
            const fromNode = nodesById.get(fromId) ?? createImplicitNode?.(fromId);
            const toNode = nodesById.get(toId) ?? createImplicitNode?.(toId);
            if (fromNode == null || toNode == null) return;

            const link = createLink({
                series: this,
                itemId: undefined,
                datum,
                type: FlowProportionDatumType.Link,
                fromNode,
                toNode,
                size,
            });
            links.push(link);
        });

        const { nodeGraph, maxPathLength } = computeNodeGraph(nodesById.values(), links, allowCircularReferences);

        return { nodeGraph, links, maxPathLength };
    }

    async updateSelections(): Promise<void> {
        if (this.nodeDataRefresh) {
            this.contextNodeData = await this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    override async update(opts: { seriesRect?: _Scene.BBox | undefined }): Promise<void> {
        const { seriesRect } = opts;
        const newNodeDataDependencies = {
            seriesRectWidth: seriesRect?.width ?? 0,
            seriesRectHeight: seriesRect?.height ?? 0,
        };
        if (
            this._nodeDataDependencies == null ||
            this.nodeDataDependencies.seriesRectWidth !== newNodeDataDependencies.seriesRectWidth ||
            this.nodeDataDependencies.seriesRectHeight !== newNodeDataDependencies.seriesRectHeight
        ) {
            this._nodeDataDependencies = newNodeDataDependencies;
        }

        await this.updateSelections();

        let highlightedDatum: TDatum<TNodeDatum, TLinkDatum> | undefined =
            this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && highlightedDatum.series !== this) {
            highlightedDatum = undefined;
        }

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity =
            highlightedDatum != null ? this.properties.highlightStyle.series.dimOpacity ?? 1 : 1;

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];

        this.labelSelection = await this.updateLabelSelection({ labelData, labelSelection: this.labelSelection });
        await this.updateLabelNodes({ labelSelection: this.labelSelection });

        this.linkSelection = await this.updateLinkSelection({ nodeData, datumSelection: this.linkSelection });
        await this.updateLinkNodes({ datumSelection: this.linkSelection, isHighlight: false });

        this.nodeSelection = await this.updateNodeSelection({ nodeData, datumSelection: this.nodeSelection });
        await this.updateNodeNodes({ datumSelection: this.nodeSelection, isHighlight: false });

        let focusLinkSelection: TLinkDatum[];
        let focusNodeSelection: TNodeDatum[];
        let highlightLinkSelection: TLinkDatum[];
        let highlightNodeSelection: TNodeDatum[];
        if (highlightedDatum?.type === FlowProportionDatumType.Node) {
            focusLinkSelection = nodeData.filter((node): node is TLinkDatum => {
                return (
                    node.type === FlowProportionDatumType.Link &&
                    (node.toNode === highlightedDatum || node.fromNode === highlightedDatum)
                );
            });
            focusNodeSelection = focusLinkSelection.map((link) => {
                return link.fromNode === highlightedDatum ? link.toNode : link.fromNode;
            });
            focusNodeSelection.push(highlightedDatum);
            highlightLinkSelection = [];
            highlightNodeSelection = [highlightedDatum];
        } else if (highlightedDatum?.type === FlowProportionDatumType.Link) {
            focusLinkSelection = [highlightedDatum];
            focusNodeSelection = [highlightedDatum.fromNode, highlightedDatum.toNode];
            highlightLinkSelection = [highlightedDatum];
            highlightNodeSelection = [];
        } else {
            focusLinkSelection = [];
            focusNodeSelection = [];
            highlightLinkSelection = [];
            highlightNodeSelection = [];
        }

        this.focusLinkSelection = await this.updateLinkSelection({
            nodeData: focusLinkSelection,
            datumSelection: this.focusLinkSelection,
        });
        await this.updateLinkNodes({ datumSelection: this.focusLinkSelection, isHighlight: false });

        this.focusNodeSelection = await this.updateNodeSelection({
            nodeData: focusNodeSelection,
            datumSelection: this.focusNodeSelection,
        });
        await this.updateNodeNodes({ datumSelection: this.focusNodeSelection, isHighlight: false });

        this.highlightLinkSelection = await this.updateLinkSelection({
            nodeData: highlightLinkSelection,
            datumSelection: this.highlightLinkSelection,
        });
        await this.updateLinkNodes({ datumSelection: this.highlightLinkSelection, isHighlight: true });

        this.highlightNodeSelection = await this.updateNodeSelection({
            nodeData: highlightNodeSelection,
            datumSelection: this.highlightNodeSelection,
        });
        await this.updateNodeNodes({ datumSelection: this.highlightNodeSelection, isHighlight: true });
    }

    protected abstract updateLabelSelection(opts: {
        labelData: TLabel[];
        labelSelection: _Scene.Selection<_Scene.Text, TPlacedLabel>;
    }): Promise<_Scene.Selection<_Scene.Text, TPlacedLabel>>;

    protected abstract updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, TPlacedLabel>;
    }): Promise<void>;

    protected abstract updateNodeSelection(opts: {
        nodeData: TDatum<TNodeDatum, TLinkDatum>[];
        datumSelection: _Scene.Selection<TNode, TNodeDatum>;
    }): Promise<_Scene.Selection<TNode, TNodeDatum>>;

    protected abstract updateNodeNodes(opts: {
        datumSelection: _Scene.Selection<TNode, TNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;

    protected abstract updateLinkSelection(opts: {
        nodeData: TDatum<TNodeDatum, TLinkDatum>[];
        datumSelection: _Scene.Selection<TLink, TLinkDatum>;
    }): Promise<_Scene.Selection<TLink, TLinkDatum>>;

    protected abstract updateLinkNodes(opts: {
        datumSelection: _Scene.Selection<TLink, TLinkDatum>;
        isHighlight: boolean;
    }): Promise<void>;

    override resetAnimation(_chartAnimationPhase: _ModuleSupport.ChartAnimationPhase): void {}

    override getSeriesDomain(_direction: _ModuleSupport.ChartAxisDirection): any[] {
        return [];
    }

    override getLegendData(_legendType: unknown) {
        return [];
    }

    protected override computeFocusBounds(_opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined {
        return;
    }
}
