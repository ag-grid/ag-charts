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
    index: number;
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
        TProps extends FlowProportionSeriesProperties<any>,
        TNode extends _Scene.Node & _ModuleSupport.DistantObject,
        TLink extends _Scene.Node & _ModuleSupport.DistantObject,
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

    private processedNodes = new Map<string, FlowProportionNodeDatum>();

    private readonly linkGroup = this.contentGroup.appendChild(new Group({ name: 'linkGroup' }));
    private readonly nodeGroup = this.contentGroup.appendChild(new Group({ name: 'nodeGroup' }));
    private readonly focusLinkGroup = this.highlightNode.appendChild(new Group({ name: 'linkGroup' }));
    private readonly focusNodeGroup = this.highlightNode.appendChild(new Group({ name: 'nodeGroup' }));
    private readonly highlightLinkGroup = this.highlightNode.appendChild(new Group({ name: 'linkGroup' }));
    private readonly highlightNodeGroup = this.highlightNode.appendChild(new Group({ name: 'nodeGroup' }));

    private labelSelection: _Scene.Selection<_Scene.Text, TLabel> = Selection.select(this.labelGroup, Text);
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

        const { fromKey, toKey, sizeKey, idKey, labelKey } = this.properties;

        const nodesDataModelPromise =
            nodes != null
                ? nodesDataController.request<any, any, true>(this.id, nodes, {
                      props: [
                          keyProperty(idKey, undefined, { id: 'idValue', includeProperty: false }),
                          ...(labelKey != null
                              ? [valueProperty(labelKey, undefined, { id: 'labelValue', includeProperty: false })]
                              : []),
                      ],
                      groupByKeys: true,
                  })
                : null;

        const linksDataModelPromise = this.requestDataModel<any, any, false>(dataController, data, {
            props: [
                valueProperty(fromKey, undefined, { id: 'fromValue', includeProperty: false }),
                valueProperty(toKey, undefined, { id: 'toValue', includeProperty: false }),
                ...(sizeKey != null
                    ? [valueProperty(sizeKey, undefined, { id: 'sizeValue', includeProperty: false, missingValue: 0 })]
                    : []),
            ],
            groupByKeys: false,
        });

        if (nodes != null) {
            nodesDataController.execute();
        }

        const [nodesDataModel, linksDataModel] = await Promise.all([nodesDataModelPromise, linksDataModelPromise]);

        this.nodesDataModel = nodesDataModel?.dataModel;
        this.nodesProcessedData = nodesDataModel?.processedData;

        const { fills, strokes } = this.properties;
        const processedNodes = new Map<string, FlowProportionNodeDatum>();
        if (nodesDataModel == null) {
            const fromIdIdx = linksDataModel.dataModel.resolveProcessedDataIndexById(this, 'fromValue');
            const toIdIdx = linksDataModel.dataModel.resolveProcessedDataIndexById(this, 'toValue');

            const createImplicitNode = (id: string): FlowProportionNodeDatum => {
                const label = id;
                const fill = fills[processedNodes.size % fills.length];
                const stroke = strokes[processedNodes.size % strokes.length];

                return {
                    series: this,
                    itemId: undefined,
                    datum: {},
                    type: FlowProportionDatumType.Node,
                    id,
                    label,
                    fill,
                    stroke,
                };
            };

            linksDataModel.processedData.data.forEach(({ values }) => {
                const fromId: string | undefined = values[fromIdIdx];
                const toId: string | undefined = values[toIdIdx];
                if (fromId == null || toId == null) return;

                if (!processedNodes.has(fromId)) {
                    processedNodes.set(fromId, createImplicitNode(fromId));
                }

                if (!processedNodes.has(toId)) {
                    processedNodes.set(toId, createImplicitNode(toId));
                }
            });
        } else {
            const nodeIdIdx = nodesDataModel.dataModel.resolveProcessedDataIndexById(this, 'idValue');
            const labelIdx =
                labelKey != null
                    ? nodesDataModel.dataModel.resolveProcessedDataIndexById(this, 'labelValue')
                    : undefined;

            nodesDataModel.processedData.data.forEach(({ datum, keys, values }, index) => {
                const value = values[0];
                const id: string = keys[nodeIdIdx];
                const label: string | undefined = labelIdx != null ? value[labelIdx] : undefined;

                const fill = fills[index % fills.length];
                const stroke = strokes[index % strokes.length];

                processedNodes.set(id, {
                    series: this,
                    itemId: undefined,
                    datum,
                    type: FlowProportionDatumType.Node,
                    id,
                    label,
                    fill,
                    stroke,
                });
            });
        }

        this.processedNodes = processedNodes;
    }

    protected getNodeGraph(
        createNode: (node: FlowProportionNodeDatum) => TNodeDatum,
        createLink: (link: FlowProportionLinkDatum<TNodeDatum>) => TLinkDatum,
        { includeCircularReferences }: { includeCircularReferences: boolean }
    ) {
        const { dataModel: linksDataModel, processedData: linksProcessedData } = this;

        if (linksDataModel == null || linksProcessedData == null) {
            const { links, nodeGraph, maxPathLength } = computeNodeGraph(
                new Map<string, TNodeDatum>().values(),
                [],
                includeCircularReferences
            );
            return { nodeGraph, links, maxPathLength };
        }

        const { sizeKey } = this.properties;

        const fromIdIdx = linksDataModel.resolveProcessedDataIndexById(this, 'fromValue');
        const toIdIdx = linksDataModel.resolveProcessedDataIndexById(this, 'toValue');
        const sizeIdx = sizeKey != null ? linksDataModel.resolveProcessedDataIndexById(this, 'sizeValue') : undefined;

        const nodesById = new Map<string, TNodeDatum>();
        this.processedNodes.forEach((datum) => {
            const node = createNode(datum);
            nodesById.set(datum.id, node);
        });

        const baseLinks: TLinkDatum[] = [];
        const linkIndices = new Map<string, { value: number }>();
        const linkIndexId = (a: string, b: string) => JSON.stringify([a, b]);
        linksProcessedData.data.forEach(({ datum, values }) => {
            const fromId: string = values[fromIdIdx];
            const toId: string = values[toIdIdx];
            const size: number = sizeIdx != null ? values[sizeIdx] : 1;
            const fromNode = nodesById.get(fromId);
            const toNode = nodesById.get(toId);
            if (size <= 0 || fromNode == null || toNode == null) return;
            const indexId = linkIndexId(fromId, toId);
            let indexCell = linkIndices.get(indexId);
            if (indexCell == null) {
                indexCell = { value: 0 };
                linkIndices.set(indexId, indexCell);
            }

            const index = indexCell.value;
            indexCell.value += 1;

            const link = createLink({
                series: this,
                itemId: undefined,
                datum,
                type: FlowProportionDatumType.Link,
                index,
                fromNode,
                toNode,
                size,
            });
            baseLinks.push(link);
        });

        const { links, nodeGraph, maxPathLength } = computeNodeGraph(
            nodesById.values(),
            baseLinks,
            includeCircularReferences
        );

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

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];

        let highlightedDatum: TDatum<TNodeDatum, TLinkDatum> | undefined =
            this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum?.series === this && (highlightedDatum as any).type == null) {
            // Handle highlighting legend items
            const { itemId } = highlightedDatum;
            highlightedDatum =
                itemId != null
                    ? nodeData.find((node) => node.type === FlowProportionDatumType.Node && node.id === itemId)
                    : undefined;
        } else if (highlightedDatum?.series !== this) {
            highlightedDatum = undefined;
        }

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity =
            highlightedDatum != null ? this.properties.highlightStyle.series.dimOpacity ?? 1 : 1;

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
        labelSelection: _Scene.Selection<_Scene.Text, TLabel>;
    }): Promise<_Scene.Selection<_Scene.Text, TLabel>>;

    protected abstract updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, TLabel> }): Promise<void>;

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

    override getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        if (legendType !== 'category') return [];

        return Array.from(
            this.processedNodes.values(),
            ({ id, label, fill, stroke }): _ModuleSupport.CategoryLegendDatum => ({
                legendType: 'category',
                id: this.id,
                itemId: id,
                seriesId: this.id,
                enabled: true,
                label: { text: label ?? id },
                symbols: [
                    {
                        marker: {
                            fill,
                            fillOpacity: 1,
                            stroke,
                            strokeWidth: 0,
                            strokeOpacity: 1,
                        },
                    },
                ],
            })
        );
    }

    override pickNodeClosestDatum({ x, y }: _Scene.Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        let minDistanceSquared = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum | undefined;

        this.linkSelection.each((node, datum) => {
            // @todo(AG-11712) Links don't implement distance squared
            // const distanceSquared = node.distanceSquared(x, y);
            const distanceSquared = node.containsPoint(x, y) ? 0 : Infinity;
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
            }
        });
        this.nodeSelection.each((node, datum) => {
            const distanceSquared = node.distanceSquared(x, y);
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
            }
        });

        return minDatum != null ? { datum: minDatum, distance: Math.sqrt(minDistanceSquared) } : undefined;
    }

    protected override computeFocusBounds(_opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined {
        return;
    }
}
