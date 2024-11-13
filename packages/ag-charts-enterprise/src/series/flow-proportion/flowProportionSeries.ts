import { _ModuleSupport } from 'ag-charts-community';

import type { FlowProportionSeriesProperties } from './flowProportionProperties';
import { computeNodeGraph } from './flowProportionUtil';

const {
    DataModelSeries,
    DataController,
    Validate,
    ARRAY,
    keyProperty,
    valueProperty,
    Selection,
    Group,
    TransformableText,
} = _ModuleSupport;

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
    index: number;
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
        TNode extends _ModuleSupport.Node & _ModuleSupport.DistantObject,
        TLink extends _ModuleSupport.Node & _ModuleSupport.DistantObject,
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

    protected nodeCount: number = 0;
    protected linkCount: number = 0;

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

    private labelSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, TLabel> = Selection.select(
        this.labelGroup,
        TransformableText
    );
    public linkSelection: _ModuleSupport.Selection<TLink, TLinkDatum> = Selection.select(this.linkGroup, () =>
        this.linkFactory()
    );
    public nodeSelection: _ModuleSupport.Selection<TNode, TNodeDatum> = Selection.select(this.nodeGroup, () =>
        this.nodeFactory()
    );
    private focusLinkSelection: _ModuleSupport.Selection<TLink, TLinkDatum> = Selection.select(
        this.focusLinkGroup,
        () => this.linkFactory()
    );
    private focusNodeSelection: _ModuleSupport.Selection<TNode, TNodeDatum> = Selection.select(
        this.focusNodeGroup,
        () => this.nodeFactory()
    );
    private highlightLinkSelection: _ModuleSupport.Selection<TLink, TLinkDatum> = Selection.select(
        this.highlightLinkGroup,
        () => this.linkFactory()
    );
    private highlightNodeSelection: _ModuleSupport.Selection<TNode, TNodeDatum> = Selection.select(
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
            const fromIdValues = linksDataModel.dataModel.resolveColumnById<string | undefined>(
                this,
                'fromValue',
                linksDataModel.processedData
            );
            const toIdValues = linksDataModel.dataModel.resolveColumnById<string | undefined>(
                this,
                'toValue',
                linksDataModel.processedData
            );

            const createImplicitNode = (id: string): FlowProportionNodeDatum => {
                const index = processedNodes.size;
                const label = id;
                const fill = fills[index % fills.length];
                const stroke = strokes[index % strokes.length];

                return {
                    series: this,
                    itemId: undefined,
                    datum: {}, // Must be a referential object for tooltips
                    type: FlowProportionDatumType.Node,
                    index,
                    id,
                    label,
                    fill,
                    stroke,
                };
            };

            linksDataModel.processedData.rawData.forEach((_datum, datumIndex) => {
                const fromId = fromIdValues[datumIndex];
                const toId = toIdValues[datumIndex];
                if (fromId == null || toId == null) return;

                if (!processedNodes.has(fromId)) {
                    processedNodes.set(fromId, createImplicitNode(fromId));
                }

                if (!processedNodes.has(toId)) {
                    processedNodes.set(toId, createImplicitNode(toId));
                }
            });
        } else {
            const nodeIdValues = nodesDataModel.dataModel.resolveColumnById<string>(
                this,
                'idValue',
                nodesDataModel.processedData
            );
            const labelValues =
                labelKey != null
                    ? nodesDataModel.dataModel.resolveColumnById<string | undefined>(
                          this,
                          'labelValue',
                          nodesDataModel.processedData
                      )
                    : undefined;

            nodesDataModel.processedData.rawData.forEach((datum, datumIndex) => {
                const id: string = nodeIdValues[datumIndex];
                const label: string | undefined = labelValues?.[datumIndex];

                const fill = fills[datumIndex % fills.length];
                const stroke = strokes[datumIndex % strokes.length];

                processedNodes.set(id, {
                    series: this,
                    itemId: undefined,
                    datum,
                    type: FlowProportionDatumType.Node,
                    index: datumIndex,
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

        if (linksDataModel == null || linksProcessedData == null || linksProcessedData.rawData.length === 0) {
            const { links, nodeGraph, maxPathLength } = computeNodeGraph(
                new Map<string, TNodeDatum>().values(),
                [],
                includeCircularReferences
            );

            this.nodeCount = 0;
            this.linkCount = 0;
            return { nodeGraph, links, maxPathLength };
        }

        const { sizeKey } = this.properties;

        const fromIdValues = linksDataModel.resolveColumnById<string>(this, 'fromValue', linksProcessedData);
        const toIdValues = linksDataModel.resolveColumnById<string>(this, 'toValue', linksProcessedData);
        const sizeValues =
            sizeKey != null
                ? linksDataModel.resolveColumnById<number>(this, 'sizeValue', linksProcessedData)
                : undefined;

        const nodesById = new Map<string, TNodeDatum>();
        this.processedNodes.forEach((datum) => {
            const node = createNode(datum);
            nodesById.set(datum.id, node);
        });

        const baseLinks: TLinkDatum[] = [];
        linksProcessedData.rawData.forEach((datum, datumIndex) => {
            const fromId: string = fromIdValues[datumIndex];
            const toId: string = toIdValues[datumIndex];
            const size: number = sizeValues != null ? sizeValues[datumIndex] : 1;
            const fromNode = nodesById.get(fromId);
            const toNode = nodesById.get(toId);
            if (size <= 0 || fromNode == null || toNode == null) return;

            const link = createLink({
                series: this,
                itemId: undefined,
                datum,
                type: FlowProportionDatumType.Link,
                index: datumIndex,
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

        this.nodeCount = nodeGraph.size;
        this.linkCount = links.length;

        return { nodeGraph, links, maxPathLength };
    }

    async updateSelections(): Promise<void> {
        if (this.nodeDataRefresh) {
            this.contextNodeData = await this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    override async update(opts: { seriesRect?: _ModuleSupport.BBox }): Promise<void> {
        const { seriesRect } = opts;
        const newNodeDataDependencies = {
            seriesRectWidth: seriesRect?.width ?? 0,
            seriesRectHeight: seriesRect?.height ?? 0,
        };
        if (
            this._nodeDataDependencies == null ||
            this._nodeDataDependencies.seriesRectWidth !== newNodeDataDependencies.seriesRectWidth ||
            this._nodeDataDependencies.seriesRectHeight !== newNodeDataDependencies.seriesRectHeight
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

        this.linkSelection = await this.updateLinkSelection({
            nodeData: nodeData.filter((d): d is TLinkDatum => d.type === FlowProportionDatumType.Link),
            datumSelection: this.linkSelection,
        });
        await this.updateLinkNodes({ datumSelection: this.linkSelection, isHighlight: false });

        this.nodeSelection = await this.updateNodeSelection({
            nodeData: nodeData.filter((d): d is TNodeDatum => d.type === FlowProportionDatumType.Node),
            datumSelection: this.nodeSelection,
        });
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
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, TLabel>;
    }): Promise<_ModuleSupport.Selection<_ModuleSupport.TransformableText, TLabel>>;

    protected abstract updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, TLabel>;
    }): Promise<void>;

    protected abstract updateNodeSelection(opts: {
        nodeData: TNodeDatum[];
        datumSelection: _ModuleSupport.Selection<TNode, TNodeDatum>;
    }): Promise<_ModuleSupport.Selection<TNode, TNodeDatum>>;

    protected abstract updateNodeNodes(opts: {
        datumSelection: _ModuleSupport.Selection<TNode, TNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;

    protected abstract updateLinkSelection(opts: {
        nodeData: TLinkDatum[];
        datumSelection: _ModuleSupport.Selection<TLink, TLinkDatum>;
    }): Promise<_ModuleSupport.Selection<TLink, TLinkDatum>>;

    protected abstract updateLinkNodes(opts: {
        datumSelection: _ModuleSupport.Selection<TLink, TLinkDatum>;
        isHighlight: boolean;
    }): Promise<void>;

    override resetAnimation(_chartAnimationPhase: _ModuleSupport.ChartAnimationPhase): void {
        // Does not reset any animations
    }

    override getSeriesDomain(_direction: _ModuleSupport.ChartAxisDirection): any[] {
        return [];
    }

    override getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        if (legendType !== 'category') return [];

        const { showInLegend } = this.properties;
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
                hideInLegend: !showInLegend,
            })
        );
    }

    override pickNodeClosestDatum({ x, y }: _ModuleSupport.Point): _ModuleSupport.SeriesNodePickMatch | undefined {
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

    getDatumAriaText(datum: TDatum<TNodeDatum, TLinkDatum>, description: string) {
        if (datum.type === FlowProportionDatumType.Link) {
            return this.ctx.localeManager.t('ariaAnnounceFlowProportionLink', {
                index: datum.index + 1,
                count: this.linkCount,
                from: datum.fromNode.id,
                to: datum.toNode.id,
                size: datum.size,
                sizeName: this.properties.sizeName ?? this.properties.sizeKey,
            });
        } else if (datum.type === FlowProportionDatumType.Node) {
            return this.ctx.localeManager.t('ariaAnnounceFlowProportionNode', {
                index: datum.index + 1,
                count: this.nodeCount,
                description,
            });
        }
    }
}
