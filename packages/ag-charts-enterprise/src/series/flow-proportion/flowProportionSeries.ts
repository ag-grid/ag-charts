import {
    type AgActiveItemState,
    type FillOptions,
    type LineDashOptions,
    type SelectionState,
    type StrokeOptions,
    _ModuleSupport,
} from 'ag-charts-community';
import type {
    ChartAnimationPhase,
    ChartAxisDirection,
    DistantObject,
    DomainWithMetadata,
    FillStrokeMorph,
    InternalAgColorType,
    Normalised,
    Point,
} from 'ag-charts-core';

import {
    type FlowLinkDatumIndex,
    type FlowNodeDatumIndex,
    FlowProportionDatumType,
    flowLinkDatumIndex,
    flowNodeDatumIndex,
    isFlowLinkDatumIndex,
    isFlowNodeDatumIndex,
    toFlowLinkAriaIndex,
    toFlowLinkOffset,
    toFlowNodeAriaIndex,
    toFlowNodeOffset,
} from './flowDatumIndex';
import type { FlowProportionSeriesProperties } from './flowProportionProperties';
import { computeNodeGraph } from './flowProportionUtil';

const {
    findNodeDatumInArray,
    keyProperty,
    valueProperty,
    DataController,
    DataSet,
    Group,
    HighlightState,
    Selection,
    Series,
    TransformableText,
} = _ModuleSupport;

type NodeStyle = Pick<FillOptions & StrokeOptions & LineDashOptions, 'fill' | 'stroke'> &
    Omit<Required<FillOptions & StrokeOptions & LineDashOptions>, 'fill' | 'stroke'>;

// Fill/stroke colour refs are resolved to concrete colours before reaching scene nodes and legend markers.
type NormalisedNodeStyle = Normalised<NodeStyle, never, FillStrokeMorph>;

export interface FlowProportionLinkDatum<
    TNodeDatum extends FlowProportionNodeDatum<TNodeDatum, TLinkDatum>,
    TLinkDatum extends FlowProportionLinkDatum<TNodeDatum, TLinkDatum>,
>
    extends _ModuleSupport.SeriesNodeDatum {
    type: FlowProportionDatumType.Link;
    readonly itemId: string;
    datumIndex: FlowLinkDatumIndex;
    fromNode: TNodeDatum;
    toNode: TNodeDatum;
    size: number;
    style: NormalisedNodeStyle;
}

export interface FlowProportionNodeDatum<
    TNodeDatum extends FlowProportionNodeDatum<TNodeDatum, TLinkDatum>,
    TLinkDatum extends FlowProportionLinkDatum<TNodeDatum, TLinkDatum>,
>
    extends _ModuleSupport.SeriesNodeDatum {
    type: FlowProportionDatumType.Node;
    readonly itemId: string;
    datumIndex: FlowNodeDatumIndex;
    linksBefore: TLinkDatum[];
    linksAfter: TLinkDatum[];
    id: string;
    size: number;
    label: string | undefined;
    style: NormalisedNodeStyle;
}

export interface FlowProportionSeriesContext<
    TNodeDatum extends FlowProportionNodeDatum<TNodeDatum, TLinkDatum>,
    TLinkDatum extends FlowProportionLinkDatum<TNodeDatum, TLinkDatum>,
    TLabel,
> extends _ModuleSupport.SeriesNodeDataContext<TDatum<TNodeDatum, TLinkDatum>, TLabel> {}

type TDatum<
    TNodeDatum extends FlowProportionNodeDatum<TNodeDatum, TLinkDatum>,
    TLinkDatum extends FlowProportionLinkDatum<TNodeDatum, TLinkDatum>,
> = TLinkDatum | TNodeDatum;

export class FlowProportionSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<_ModuleSupport.SeriesNodeDatum, TEvent> {
    readonly size?: number;
    readonly label?: string;
    constructor(
        type: TEvent,
        nativeEvent: Event,
        datum: _ModuleSupport.SeriesNodeDatum & { type?: FlowProportionDatumType },
        series: _ModuleSupport.ISeries<_ModuleSupport.SeriesNodeDatum, _ModuleSupport.ISeriesProperties, unknown> & {
            contextNodeData?: _ModuleSupport.SeriesNodeDataContext<
                TDatum<FlowProportionNodeDatum<any, any>, FlowProportionLinkDatum<any, any>>,
                _ModuleSupport.ISeriesProperties
            >;
        },
        selectionState: SelectionState | undefined,
        isCollapsed: boolean
    ) {
        super(type, nativeEvent, datum, series, selectionState, isCollapsed);
        const nodeDatum = series.contextNodeData?.nodeData.find(
            (d) => d.type === datum.type && d.datumIndex === datum.datumIndex
        );
        this.size = nodeDatum?.size;
        this.label = nodeDatum?.type === FlowProportionDatumType.Node ? nodeDatum?.label : undefined;
    }
}

export abstract class FlowProportionSeries<
    TNodeDatum extends FlowProportionNodeDatum<TNodeDatum, TLinkDatum>,
    TLinkDatum extends FlowProportionLinkDatum<TNodeDatum, TLinkDatum>,
    TLabel,
    TOpts extends object,
    TProps extends FlowProportionSeriesProperties<TOpts>,
    TNode extends _ModuleSupport.Node<TNodeDatum> & DistantObject,
    TLink extends _ModuleSupport.Node<TLinkDatum> & DistantObject,
> extends Series<
    TDatum<TNodeDatum, TLinkDatum>,
    TOpts,
    TProps,
    TLabel,
    _ModuleSupport.SeriesNodeDataContext<TDatum<TNodeDatum, TLinkDatum>, TLabel>
> {
    protected override readonly NodeEvent = FlowProportionSeriesNodeEvent;

    abstract override properties: TProps;

    protected get nodes() {
        return this.properties.nodes;
    }

    protected nodeCount: number = 0;
    protected linkCount: number = 0;

    protected linksDataModel: _ModuleSupport.DataModel<any, any, false> | undefined = undefined;
    protected linksProcessedData: _ModuleSupport.ProcessedData<any> | undefined = undefined;

    protected nodesDataModel: _ModuleSupport.DataModel<any, any, true> | undefined = undefined;
    protected nodesProcessedData: _ModuleSupport.ProcessedData<any> | undefined = undefined;

    public contextNodeData?: _ModuleSupport.SeriesNodeDataContext<TDatum<TNodeDatum, TLinkDatum>, TLabel>;

    private processedNodes = new Map<string, FlowProportionNodeDatum<TNodeDatum, TLinkDatum>>();

    private readonly linkGroup = this.contentGroup.appendChild(new Group({ name: 'linkGroup' }));
    private readonly nodeGroup = this.contentGroup.appendChild(new Group({ name: 'nodeGroup' }));
    private readonly focusLinkGroup = this.highlightGroup.appendChild(new Group({ name: 'linkGroup' }));
    private readonly focusNodeGroup = this.highlightGroup.appendChild(new Group({ name: 'nodeGroup' }));
    private readonly highlightLinkGroup = this.highlightGroup.appendChild(new Group({ name: 'linkGroup' }));

    private labelSelection: _ModuleSupport.Selection<TLabel, _ModuleSupport.TransformableText<TLabel>> =
        Selection.select(this.labelGroup, TransformableText<TLabel>);
    public linkSelection: _ModuleSupport.Selection<TLinkDatum, TLink> = Selection.selectNoInference(
        this.linkGroup,
        () => this.linkFactory()
    );
    public nodeSelection: _ModuleSupport.Selection<TNodeDatum, TNode> = Selection.selectNoInference(
        this.nodeGroup,
        () => this.nodeFactory()
    );
    private focusLinkSelection: _ModuleSupport.Selection<TLinkDatum, TLink> = Selection.selectNoInference(
        this.focusLinkGroup,
        () => this.linkFactory()
    );
    private focusNodeSelection: _ModuleSupport.Selection<TNodeDatum, TNode> = Selection.selectNoInference(
        this.focusNodeGroup,
        () => this.nodeFactory()
    );
    private highlightLinkSelection: _ModuleSupport.Selection<TLinkDatum, TLink> = Selection.selectNoInference(
        this.highlightLinkGroup,
        () => this.linkFactory()
    );
    private highlightNodeSelection: _ModuleSupport.Selection<TNodeDatum, TNode> = Selection.selectNoInference(
        this.highlightNodeGroup,
        () => this.nodeFactory()
    );

    protected abstract linkFactory(): TLink;
    protected abstract nodeFactory(): TNode;

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        const { data, nodes } = this;

        if (data == null) return;

        const { fromKey, toKey, sizeKey, idKey, labelKey } = this.properties;

        const nodesDataController = new DataController(
            'standalone',
            dataController.suppressFieldDotNotation,
            this.ctx.eventsHub
        );
        const nodesDataModelPromise =
            nodes == null
                ? null
                : nodesDataController.request<any, any, true>(this.id, DataSet.wrap(nodes) ?? DataSet.empty(), {
                      props: [
                          keyProperty(idKey, undefined, { id: 'idValue', includeProperty: false }),
                          ...(labelKey == null
                              ? []
                              : [valueProperty(labelKey, undefined, { id: 'labelValue', includeProperty: false })]),
                      ],
                      groupByKeys: true,
                  });

        const linksDataModelPromise = dataController.request<any, any, false>(this.id, data, {
            props: [
                valueProperty(fromKey, undefined, { id: 'fromValue', includeProperty: false }),
                valueProperty(toKey, undefined, { id: 'toValue', includeProperty: false }),
                ...(sizeKey == null
                    ? []
                    : [
                          valueProperty(sizeKey, undefined, {
                              id: 'sizeValue',
                              includeProperty: false,
                              missingValue: 0,
                          }),
                      ]),
            ],
            groupByKeys: false,
        });

        if (nodes != null) {
            nodesDataController.execute(undefined, undefined);
        }

        const [nodesDataModel, linksDataModel] = await Promise.all([
            nodesDataModelPromise ?? Promise.resolve(null),
            linksDataModelPromise,
        ]);

        this.nodesDataModel = nodesDataModel?.dataModel;
        this.nodesProcessedData = nodesDataModel?.processedData;
        this.linksDataModel = linksDataModel?.dataModel;
        this.linksProcessedData = linksDataModel?.processedData;

        const processedNodes = new Map<string, FlowProportionNodeDatum<TNodeDatum, TLinkDatum>>();
        if (nodesDataModel == null) {
            const fromIdValues = linksDataModel.dataModel.resolveColumnById<string | undefined>(
                this,
                'fromValue',
                linksDataModel.processedData,
                'object'
            );
            const toIdValues = linksDataModel.dataModel.resolveColumnById<string | undefined>(
                this,
                'toValue',
                linksDataModel.processedData,
                'object'
            );

            const createImplicitNode = (id: string): FlowProportionNodeDatum<TNodeDatum, TLinkDatum> => {
                const datumIndex = flowNodeDatumIndex(processedNodes.size);
                const label = id;

                return {
                    series: this,
                    itemId: this.toFlowNodeItemId({}, datumIndex, { dataIdKey: undefined, nodeName: id }),
                    datum: {}, // Must be a referential object for tooltips
                    datumIndex,
                    type: FlowProportionDatumType.Node,
                    linksBefore: [],
                    linksAfter: [],
                    id,
                    size: 0,
                    label,
                    style: this.getNodeStyle(
                        {
                            datumIndex,
                            datum: {},
                            size: 0,
                            label,
                        } as Partial<TNodeDatum>,
                        datumIndex,
                        false
                    ),
                };
            };

            const linkData = linksDataModel.processedData.dataSources.get(this.id)?.data;
            if (linkData) {
                for (const [datumIndex] of linkData.entries()) {
                    const fromId = fromIdValues[datumIndex];
                    const toId = toIdValues[datumIndex];
                    if (fromId == null || toId == null) continue;

                    if (!processedNodes.has(fromId)) {
                        processedNodes.set(fromId, createImplicitNode(fromId));
                    }

                    if (!processedNodes.has(toId)) {
                        processedNodes.set(toId, createImplicitNode(toId));
                    }
                }
            }
        } else {
            const nodeIdValues = nodesDataModel.dataModel.resolveColumnById(
                this,
                'idValue',
                nodesDataModel.processedData,
                'string'
            );
            const labelValues =
                labelKey == null
                    ? undefined
                    : nodesDataModel.dataModel.resolveColumnById<string | undefined>(
                          this,
                          'labelValue',
                          nodesDataModel.processedData,
                          'object'
                      );

            const nodeDataIdKey = this.data?.dataIdKey;
            const nodeData = nodesDataModel.processedData.dataSources.get(this.id)?.data;
            if (nodeData) {
                for (const [offset, datum] of nodeData.entries()) {
                    const id: string = nodeIdValues[offset];
                    const label: string | undefined = labelValues?.[offset];
                    const datumIndex = flowNodeDatumIndex(offset);
                    processedNodes.set(id, {
                        series: this,
                        itemId: this.toFlowNodeItemId(datum, datumIndex, { dataIdKey: nodeDataIdKey, nodeName: id }),
                        datum,
                        datumIndex,
                        type: FlowProportionDatumType.Node,
                        linksBefore: [],
                        linksAfter: [],
                        id,
                        size: 0,
                        label,
                        style: this.getNodeStyle(
                            { datumIndex, datum, size: 0, label } as Partial<TNodeDatum>,
                            datumIndex,
                            false
                        ),
                    });
                }
            }
        }

        this.processedNodes = processedNodes;
    }

    private callGetItemId(params: { nodeName: string; index: number; datum: unknown }): string | undefined {
        const { getItemId } = this.properties;
        return getItemId == null ? undefined : this.cachedCallWithContext(getItemId, params);
    }

    override findNodeDatum(itemId: AgActiveItemState['itemId']): TDatum<TNodeDatum, TLinkDatum> | undefined {
        return findNodeDatumInArray(itemId, this.contextNodeData?.nodeData, this.data?.dataIdKey);
    }

    protected abstract getNodeStyle(
        nodeDatum: Partial<TNodeDatum>,
        fromNodeDatumIndex: FlowNodeDatumIndex,
        isHighlight: boolean
    ): Required<NormalisedNodeStyle>;

    protected abstract getLinkStyle(
        datum: TLinkDatum['datum'],
        datumIndex: FlowLinkDatumIndex,
        fromNodeDatumIndex: FlowNodeDatumIndex,
        isHighlight: boolean
    ): Required<NormalisedNodeStyle>;

    protected getNodeGraph(
        createNode: (node: FlowProportionNodeDatum<TNodeDatum, TLinkDatum>) => TNodeDatum,
        createLink: (link: FlowProportionLinkDatum<TNodeDatum, TLinkDatum>) => TLinkDatum,
        { includeCircularReferences }: { includeCircularReferences: boolean }
    ) {
        const { linksDataModel, linksProcessedData } = this;

        if (linksDataModel == null || linksProcessedData == null) {
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

        const fromIdValues = linksDataModel.resolveColumnById(this, 'fromValue', linksProcessedData, 'string');
        const toIdValues = linksDataModel.resolveColumnById(this, 'toValue', linksProcessedData, 'string');
        const sizeValues =
            sizeKey == null
                ? undefined
                : linksDataModel.resolveColumnById(this, 'sizeValue', linksProcessedData, 'number');

        const nodesById = new Map<string, TNodeDatum>();
        for (const datum of this.processedNodes.values()) {
            const node = createNode(datum);
            nodesById.set(datum.id, node);
        }

        const baseLinks: TLinkDatum[] = [];
        const dataIdKey = this.data?.dataIdKey;
        const linkData = linksProcessedData.dataSources.get(this.id)?.data;
        if (linkData) {
            for (const [index, datum] of linkData.entries()) {
                const fromId: string = fromIdValues[index];
                const toId: string = toIdValues[index];
                // Node sizes drive visual proportions/angles, so narrow a bigint sizeKey to Number here; the
                // downstream accumulation (acc + size, totalSize +=, ratios * size) mixes it with Numbers.
                const size: number = sizeValues == null ? 1 : Number(sizeValues[index]);
                const fromNode = nodesById.get(fromId);
                const toNode = nodesById.get(toId);
                if (size <= 0 || fromNode == null || toNode == null) continue;

                const datumIndex = flowLinkDatumIndex(index);
                const link = createLink({
                    series: this,
                    itemId: this.toFlowLinkItemId(datum, datumIndex, { dataIdKey }),
                    datum,
                    datumIndex,
                    type: FlowProportionDatumType.Link,
                    fromNode,
                    toNode,
                    size,
                    style: this.getLinkStyle(datum, datumIndex, fromNode.datumIndex, false),
                });
                baseLinks.push(link);
            }
        }

        const { links, nodeGraph, maxPathLength } = computeNodeGraph(
            nodesById.values(),
            baseLinks,
            includeCircularReferences
        );

        for (const node of nodeGraph.values()) {
            node.datum.linksBefore = node.linksBefore.map((linkedNode) => linkedNode.link);
            node.datum.linksAfter = node.linksAfter.map((linkedNode) => linkedNode.link);
        }

        this.nodeCount = nodeGraph.size;
        this.linkCount = links.length;

        return { nodeGraph, links, maxPathLength };
    }

    updateSelections() {
        if (this.nodeDataRefresh) {
            this.contextNodeData = this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    override update(opts: { seriesRect?: _ModuleSupport.BBox }) {
        const { seriesRect } = opts;
        const newNodeDataDependencies = {
            seriesRectWidth: seriesRect?.width ?? 0,
            seriesRectHeight: seriesRect?.height ?? 0,
        };
        if (
            this._nodeDataDependencies?.seriesRectWidth !== newNodeDataDependencies.seriesRectWidth ||
            this._nodeDataDependencies.seriesRectHeight !== newNodeDataDependencies.seriesRectHeight
        ) {
            this._nodeDataDependencies = newNodeDataDependencies;
        }

        this.updateSelections();

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];

        const highlightedDatum = this.getHighlightedDatum();

        this.contentGroup.visible = this.visible;
        const highlightState = highlightedDatum == null ? HighlightState.None : HighlightState.OtherItem;
        this.contentGroup.opacity = this.properties.highlight.getStyle(highlightState).opacity ?? 1;

        this.labelSelection = this.updateLabelSelection({ labelData, labelSelection: this.labelSelection });
        this.updateLabelNodes({ labelSelection: this.labelSelection });

        this.linkSelection = this.updateLinkSelection({
            nodeData: nodeData.filter((d): d is TLinkDatum => d.type === FlowProportionDatumType.Link),
            datumSelection: this.linkSelection,
        });
        this.updateLinkNodes({ datumSelection: this.linkSelection, isHighlight: false });

        this.nodeSelection = this.updateNodeSelection({
            nodeData: nodeData.filter((d): d is TNodeDatum => d.type === FlowProportionDatumType.Node),
            datumSelection: this.nodeSelection,
        });
        this.updateNodeNodes({ datumSelection: this.nodeSelection, isHighlight: false });

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

        this.focusLinkSelection = this.updateLinkSelection({
            nodeData: focusLinkSelection,
            datumSelection: this.focusLinkSelection,
        });
        this.updateLinkNodes({ datumSelection: this.focusLinkSelection, isHighlight: false });

        this.focusNodeSelection = this.updateNodeSelection({
            nodeData: focusNodeSelection,
            datumSelection: this.focusNodeSelection,
        });
        this.updateNodeNodes({ datumSelection: this.focusNodeSelection, isHighlight: false });

        this.highlightLinkSelection = this.updateLinkSelection({
            nodeData: highlightLinkSelection,
            datumSelection: this.highlightLinkSelection,
        });
        this.updateLinkNodes({ datumSelection: this.highlightLinkSelection, isHighlight: true });

        this.highlightNodeSelection = this.updateNodeSelection({
            nodeData: highlightNodeSelection,
            datumSelection: this.highlightNodeSelection,
        });
        this.updateNodeNodes({ datumSelection: this.highlightNodeSelection, isHighlight: true });
    }

    protected getHighlightedDatum() {
        let highlightedDatum: TDatum<TNodeDatum, TLinkDatum> | undefined =
            this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum?.series === this && (highlightedDatum as any).type == null) {
            // Handle highlighting legend items
            const { itemId } = highlightedDatum;
            const nodeData = this.contextNodeData?.nodeData ?? [];
            highlightedDatum =
                itemId == null
                    ? undefined
                    : nodeData.find((node) => node.type === FlowProportionDatumType.Node && node.id === itemId);
        } else if (highlightedDatum?.series !== this) {
            highlightedDatum = undefined;
        }

        return highlightedDatum;
    }

    protected isLabelHighlighted(datum: TNodeDatum, activeHighlight?: TNodeDatum | TLinkDatum): boolean {
        if (activeHighlight == null) return false;

        if (activeHighlight.type === FlowProportionDatumType.Node) {
            return activeHighlight === datum;
        }

        if (activeHighlight.type === FlowProportionDatumType.Link) {
            return activeHighlight.fromNode === datum || activeHighlight.toNode === datum;
        }

        return false;
    }

    protected abstract updateLabelSelection(opts: {
        labelData: TLabel[];
        labelSelection: _ModuleSupport.Selection<TLabel, _ModuleSupport.TransformableText<TLabel>>;
    }): _ModuleSupport.Selection<TLabel, _ModuleSupport.TransformableText<TLabel>>;

    protected abstract updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<TLabel, _ModuleSupport.Text<TLabel>>;
    }): void;

    protected abstract updateNodeSelection(opts: {
        nodeData: TNodeDatum[];
        datumSelection: _ModuleSupport.Selection<TNodeDatum, TNode>;
    }): _ModuleSupport.Selection<TNodeDatum, TNode>;

    protected abstract updateNodeNodes(opts: {
        datumSelection: _ModuleSupport.Selection<TNodeDatum, TNode>;
        isHighlight: boolean;
    }): void;

    protected abstract updateLinkSelection(opts: {
        nodeData: TLinkDatum[];
        datumSelection: _ModuleSupport.Selection<TLinkDatum, TLink>;
    }): _ModuleSupport.Selection<TLinkDatum, TLink>;

    protected abstract updateLinkNodes(opts: {
        datumSelection: _ModuleSupport.Selection<TLinkDatum, TLink>;
        isHighlight: boolean;
    }): void;

    override resetAnimation(_chartAnimationPhase: ChartAnimationPhase): void {
        // Does not reset any animations
    }

    override dataCount(): number {
        return Number.NaN; // Not used
    }

    override getSeriesDomain(_direction: ChartAxisDirection): DomainWithMetadata<any> {
        return { domain: [] };
    }

    override getSeriesRange(_direction: ChartAxisDirection, _visibleRange: [any, any]): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    protected legendItemSymbol(
        _type: FlowProportionDatumType,
        nodeIndex: FlowNodeDatumIndex,
        format: {
            fill?: InternalAgColorType;
            fillOpacity?: number;
            stroke?: string;
            strokeWidth?: number;
            strokeOpacity?: number;
            lineDash?: number[];
            lineDashOffset?: number;
        } = {}
    ): _ModuleSupport.LegendSymbolOptions {
        const { fills, strokes } = this.properties;

        const {
            fill = fills[nodeIndex % fills.length],
            fillOpacity = 1,
            stroke = strokes[nodeIndex % strokes.length],
            strokeWidth = 0,
            strokeOpacity = 1,
            lineDash = [0],
            lineDashOffset = 0,
        } = format;

        return {
            marker: {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            },
        };
    }

    override getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        if (legendType !== 'category') return [];

        const { showInLegend } = this.properties;
        return Array.from(
            this.processedNodes.values(),
            ({ id, label }, index): _ModuleSupport.CategoryLegendDatum => ({
                legendType: 'category',
                id: this.id,
                itemId: id,
                seriesId: this.id,
                enabled: true,
                label: { text: label ?? id },
                symbol: this.legendItemSymbol(FlowProportionDatumType.Node, flowNodeDatumIndex(index)),
                hideInLegend: !showInLegend,
                isFixed: true,
            })
        );
    }

    override pickNodeClosestDatum({ x, y }: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        let minDistanceSquared = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum | undefined;
        let minNode: _ModuleSupport.Node<unknown> | undefined;

        this.linkSelection.each((node, datum) => {
            const distanceSquared = node.distanceSquared(x, y);
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
                minNode = node;
            }
        });
        this.nodeSelection.each((node, datum) => {
            const distanceSquared = node.distanceSquared(x, y);
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
                minNode = node;
            }
        });

        return minDatum == null || minNode == null
            ? undefined
            : { datum: minDatum, distance: Math.sqrt(minDistanceSquared), target: minNode };
    }

    getDatumAriaText(datum: TDatum<TNodeDatum, TLinkDatum>, description: string) {
        if (datum.type === FlowProportionDatumType.Link) {
            return this.ctx.localeManager.t('ariaAnnounceFlowProportionLink', {
                index: toFlowLinkAriaIndex(datum.datumIndex),
                count: this.linkCount,
                from: datum.fromNode.id,
                to: datum.toNode.id,
                size: datum.size,
                sizeName: this.properties.sizeName ?? this.properties.sizeKey,
            });
        } else if (datum.type === FlowProportionDatumType.Node) {
            return this.ctx.localeManager.t('ariaAnnounceFlowProportionNode', {
                index: toFlowNodeAriaIndex(datum.datumIndex),
                count: this.nodeCount,
                description,
            });
        }
    }

    protected abstract computeFocusBounds(node: TNode | TLink): _ModuleSupport.BBox | _ModuleSupport.Path | undefined;

    public override pickFocus(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.PickFocusOutputs | undefined {
        const { datumIndexDelta: childDelta, otherIndexDelta: depthDelta } = opts;

        const currentNodeDatum = this.contextNodeData?.nodeData[opts.datumIndex - opts.datumIndexDelta];
        let nextNodeDatum: TNodeDatum | TLinkDatum | undefined = currentNodeDatum;

        if (depthDelta !== 0 || childDelta === 0) return;

        if (currentNodeDatum?.type === FlowProportionDatumType.Link) {
            const allLinks = Array.from(this.linkSelection, (link) => link.datum);
            const selfIndex = allLinks.indexOf(currentNodeDatum);
            const nextIndex = selfIndex + childDelta;
            if (nextIndex >= 0 && nextIndex < allLinks.length) {
                nextNodeDatum = allLinks[nextIndex];
            } else if (nextIndex > 0) {
                nextNodeDatum = allLinks.at(-1);
            } else {
                const allNodes = Array.from(this.nodeSelection, (node) => node.datum);
                nextNodeDatum = allNodes.at(-1);
            }
        } else if (currentNodeDatum?.type === FlowProportionDatumType.Node) {
            const allNodes = Array.from(this.nodeSelection, (node) => node.datum);
            const selfIndex = allNodes.indexOf(currentNodeDatum);
            const nextIndex = selfIndex + childDelta;
            if (nextIndex >= 0 && nextIndex < allNodes.length) {
                nextNodeDatum = allNodes[nextIndex];
            } else if (nextIndex < 0) {
                nextNodeDatum = allNodes[0];
            } else {
                const allLinks = Array.from(this.linkSelection, (link) => link.datum);
                nextNodeDatum = allLinks[0];
            }
        }

        if (nextNodeDatum == null) return;

        const nodeDatum =
            nextNodeDatum.type === FlowProportionDatumType.Node
                ? Array.from(this.nodeSelection).find((n) => n.datum === nextNodeDatum)
                : Array.from(this.linkSelection).find((n) => n.datum === nextNodeDatum);
        if (nodeDatum == null) return;

        const bounds = this.computeFocusBounds(nodeDatum.node);
        if (bounds == null) return;

        return {
            datum: nodeDatum.datum,
            datumIndex: this.contextNodeData?.nodeData.indexOf(nodeDatum.datum) ?? 0,
            otherIndex: 0,
            bounds,
            clipFocusBox: true,
        };
    }

    private readUserDatum(datumIndex: _ModuleSupport.DatumIndex): unknown {
        if (isFlowLinkDatumIndex(datumIndex)) {
            return this.linksProcessedData?.dataSources.get(this.id)?.data[toFlowLinkOffset(datumIndex)];
        } else if (isFlowNodeDatumIndex(datumIndex)) {
            return this.nodesProcessedData?.dataSources.get(this.id)?.data[toFlowNodeOffset(datumIndex)];
        }
    }

    override getTooltipContent(datumIndex: _ModuleSupport.DatumIndex): _ModuleSupport.TooltipContent | undefined {
        const {
            id: seriesId,
            properties,
            ctx: { formatManager },
        } = this;
        const { fromKey, toKey, sizeKey, sizeName, tooltip } = properties;

        // This needs refactoring
        const seriesDatum = this.contextNodeData?.nodeData.find((d) => d.datumIndex === datumIndex);
        if (seriesDatum == null) return;

        const nodeIndex =
            seriesDatum.type === FlowProportionDatumType.Link
                ? seriesDatum.fromNode.datumIndex
                : seriesDatum.datumIndex;
        const title =
            seriesDatum.type === FlowProportionDatumType.Link
                ? `${seriesDatum.fromNode.label} - ${seriesDatum.toNode.label}`
                : seriesDatum.label;
        const datum = this.readUserDatum(datumIndex);
        const size = seriesDatum.size;

        let format: Required<NormalisedNodeStyle>;
        if (seriesDatum.type === FlowProportionDatumType.Link) {
            format = this.getLinkStyle(datum, seriesDatum.datumIndex, nodeIndex, false);
        } else {
            format = this.getNodeStyle(seriesDatum, nodeIndex, false);
        }

        const data: _ModuleSupport.TooltipContentDataRow[] = [];
        if (sizeKey != null) {
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value: size,
                datum,
                seriesId,
                legendItemName: undefined,
                key: sizeKey,
                source: 'tooltip',
                property: 'size',
                domain: [],
                boundSeries: this.getFormatterContext('size'),
                fractionDigits: undefined,
                visibleDomain: undefined,
            });
            data.push({ label: sizeName, fallbackLabel: sizeKey, value: content ?? String(size) });
        }

        return this.formatTooltipWithContext(
            tooltip,
            {
                title,
                symbol: this.legendItemSymbol(seriesDatum.type, nodeIndex, format),
                data,
            },
            {
                context: undefined,
                seriesId,
                datum,
                title,
                fromKey,
                toKey,
                sizeKey,
                sizeName,
                size,
                ...format,
            }
        );
    }
    getCategoryValue(_datumIndex: _ModuleSupport.DatumIndex): any {
        return;
    }

    datumIndexForCategoryValue(_categoryValue: any): _ModuleSupport.DatumIndex | undefined {
        return;
    }

    private readDataIdKey(datum: unknown, info: { dataIdKey?: string }): string | undefined {
        return info.dataIdKey == null ? undefined : (datum as any)?.[info.dataIdKey];
    }

    private toFlowNodeItemId(
        datum: unknown,
        datumIndex: FlowNodeDatumIndex,
        info: { dataIdKey: string | undefined; nodeName: string }
    ): string {
        const { nodeName } = info;
        const nodeIdValue = this.readDataIdKey(datum, info);
        const offset = toFlowNodeOffset(datumIndex);
        const computedId = this.callGetItemId({ nodeName, index: offset, datum });
        return computedId ?? (nodeIdValue == null ? nodeName : String(nodeIdValue));
    }

    private toFlowLinkItemId(
        datum: unknown,
        datumIndex: FlowLinkDatumIndex,
        info: { dataIdKey: string | undefined }
    ): string {
        const linkIdValue = this.readDataIdKey(datum, info);
        return linkIdValue == null ? `link-${datumIndex}` : String(linkIdValue);
    }
}
