import { type FillOptions, type LineDashOptions, type StrokeOptions, _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType, Point } from 'ag-charts-core';

import type { FlowProportionSeriesProperties } from './flowProportionProperties';
import { computeNodeGraph } from './flowProportionUtil';

const { Series, DataController, keyProperty, valueProperty, Selection, Group, TransformableText, HighlightState } =
    _ModuleSupport;

export enum FlowProportionDatumType {
    Link,
    Node,
}

export type FlowProportionNodeDatumIndex = {
    type: FlowProportionDatumType;
    index: number;
};

type NodeStyle = Pick<FillOptions & StrokeOptions & LineDashOptions, 'fill' | 'stroke'> &
    Omit<Required<FillOptions & StrokeOptions & LineDashOptions>, 'fill' | 'stroke'>;

export interface FlowProportionLinkDatum<
    TNodeDatum extends FlowProportionNodeDatum<TNodeDatum, TLinkDatum>,
    TLinkDatum extends FlowProportionLinkDatum<TNodeDatum, TLinkDatum>,
> extends _ModuleSupport.SeriesNodeDatum<FlowProportionNodeDatumIndex> {
    type: FlowProportionDatumType.Link;
    readonly itemId: undefined;
    index: number;
    fromNode: TNodeDatum;
    toNode: TNodeDatum;
    size: number;
    style: NodeStyle;
}

export interface FlowProportionNodeDatum<
    TNodeDatum extends FlowProportionNodeDatum<TNodeDatum, TLinkDatum>,
    TLinkDatum extends FlowProportionLinkDatum<TNodeDatum, TLinkDatum>,
> extends _ModuleSupport.SeriesNodeDatum<FlowProportionNodeDatumIndex> {
    type: FlowProportionDatumType.Node;
    readonly itemId: undefined;
    index: number;
    linksBefore: TLinkDatum[];
    linksAfter: TLinkDatum[];
    id: string;
    size: number;
    label: string | undefined;
    style: NodeStyle;
}

export interface FlowProportionSeriesContext<
    TNodeDatum extends FlowProportionNodeDatum<TNodeDatum, TLinkDatum>,
    TLinkDatum extends FlowProportionLinkDatum<TNodeDatum, TLinkDatum>,
    TLabel,
> extends _ModuleSupport.SeriesNodeDataContext<FlowProportionNodeDatumIndex, TDatum<TNodeDatum, TLinkDatum>, TLabel> {}

type TDatum<
    TNodeDatum extends FlowProportionNodeDatum<TNodeDatum, TLinkDatum>,
    TLinkDatum extends FlowProportionLinkDatum<TNodeDatum, TLinkDatum>,
> = TLinkDatum | TNodeDatum;

export class FlowProportionSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<_ModuleSupport.SeriesNodeDatum<FlowProportionNodeDatumIndex>, TEvent> {
    readonly size?: number;
    readonly label?: string;
    constructor(
        type: TEvent,
        nativeEvent: Event,
        datum: _ModuleSupport.SeriesNodeDatum<FlowProportionNodeDatumIndex>,
        series: _ModuleSupport.ISeries<
            FlowProportionNodeDatumIndex,
            _ModuleSupport.SeriesNodeDatum<FlowProportionNodeDatumIndex>,
            unknown
        > & {
            contextNodeData?: _ModuleSupport.SeriesNodeDataContext<
                FlowProportionNodeDatumIndex,
                TDatum<FlowProportionNodeDatum<any, any>, FlowProportionLinkDatum<any, any>>,
                unknown
            >;
        }
    ) {
        super(type, nativeEvent, datum, series);
        const { datumIndex } = datum;
        const nodeDatum = series.contextNodeData?.nodeData.find(
            (d) => d.datumIndex.type === datumIndex.type && d.datumIndex.index === datumIndex.index
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
    TNode extends _ModuleSupport.Node & _ModuleSupport.DistantObject,
    TLink extends _ModuleSupport.Node & _ModuleSupport.DistantObject,
> extends Series<
    FlowProportionNodeDatumIndex,
    TDatum<TNodeDatum, TLinkDatum>,
    TOpts,
    TProps,
    TLabel,
    _ModuleSupport.SeriesNodeDataContext<FlowProportionNodeDatumIndex, TDatum<TNodeDatum, TLinkDatum>, TLabel>
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

    public contextNodeData?: _ModuleSupport.SeriesNodeDataContext<
        FlowProportionNodeDatumIndex,
        TDatum<TNodeDatum, TLinkDatum>,
        TLabel
    >;

    private processedNodes = new Map<string, FlowProportionNodeDatum<TNodeDatum, TLinkDatum>>();

    private readonly linkGroup = this.contentGroup.appendChild(new Group({ name: 'linkGroup' }));
    private readonly nodeGroup = this.contentGroup.appendChild(new Group({ name: 'nodeGroup' }));
    private readonly focusLinkGroup = this.highlightGroup.appendChild(new Group({ name: 'linkGroup' }));
    private readonly focusNodeGroup = this.highlightGroup.appendChild(new Group({ name: 'nodeGroup' }));
    private readonly highlightLinkGroup = this.highlightGroup.appendChild(new Group({ name: 'linkGroup' }));

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

    protected abstract linkFactory(): TLink;
    protected abstract nodeFactory(): TNode;

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        const { data, nodes } = this;

        if (data == null) return;

        const { fromKey, toKey, sizeKey, idKey, labelKey } = this.properties;

        const nodesDataController = new DataController('standalone', dataController.suppressFieldDotNotation);
        const nodesDataModelPromise =
            nodes == null
                ? null
                : nodesDataController.request<any, any, true>(
                      this.id,
                      _ModuleSupport.DataSet.wrap(nodes) ?? _ModuleSupport.DataSet.empty(),
                      {
                          props: [
                              keyProperty(idKey, undefined, { id: 'idValue', includeProperty: false }),
                              ...(labelKey == null
                                  ? []
                                  : [valueProperty(labelKey, undefined, { id: 'labelValue', includeProperty: false })]),
                          ],
                          groupByKeys: true,
                      }
                  );

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
            nodesDataController.execute();
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
                linksDataModel.processedData
            );
            const toIdValues = linksDataModel.dataModel.resolveColumnById<string | undefined>(
                this,
                'toValue',
                linksDataModel.processedData
            );

            const createImplicitNode = (id: string): FlowProportionNodeDatum<TNodeDatum, TLinkDatum> => {
                const datumIndex = processedNodes.size;
                const label = id;

                return {
                    series: this,
                    itemId: undefined,
                    datum: {}, // Must be a referential object for tooltips
                    datumIndex: { type: FlowProportionDatumType.Node, index: datumIndex },
                    type: FlowProportionDatumType.Node,
                    index: datumIndex,
                    linksBefore: [],
                    linksAfter: [],
                    id,
                    size: 0,
                    label,
                    style: this.getNodeStyle(
                        {
                            datumIndex: { type: FlowProportionDatumType.Node, index: datumIndex },
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
            const nodeIdValues = nodesDataModel.dataModel.resolveColumnById<string>(
                this,
                'idValue',
                nodesDataModel.processedData
            );
            const labelValues =
                labelKey == null
                    ? undefined
                    : nodesDataModel.dataModel.resolveColumnById<string | undefined>(
                          this,
                          'labelValue',
                          nodesDataModel.processedData
                      );

            const nodeData = nodesDataModel.processedData.dataSources.get(this.id)?.data;
            if (nodeData) {
                for (const [datumIndex, datum] of nodeData.entries()) {
                    const id: string = nodeIdValues[datumIndex];
                    const label: string | undefined = labelValues?.[datumIndex];

                    const nodeDatumIndex = { type: FlowProportionDatumType.Node, index: datumIndex };

                    processedNodes.set(id, {
                        series: this,
                        itemId: undefined,
                        datum,
                        datumIndex: nodeDatumIndex,
                        type: FlowProportionDatumType.Node,
                        index: datumIndex,
                        linksBefore: [],
                        linksAfter: [],
                        id,
                        size: 0,
                        label,
                        style: this.getNodeStyle(
                            { datumIndex: nodeDatumIndex, datum, size: 0, label } as Partial<TNodeDatum>,
                            datumIndex,
                            false
                        ),
                    });
                }
            }
        }

        this.processedNodes = processedNodes;
    }

    protected abstract getNodeStyle(
        datum: Partial<TNodeDatum>,
        fromNodeDatumIndex: number,
        isHighlight: boolean
    ): NodeStyle;

    protected abstract getLinkStyle(
        { datumIndex, datum }: Partial<TLinkDatum>,
        fromNodeDatumIndex: FlowProportionNodeDatumIndex,
        isHighlight: boolean
    ): NodeStyle;

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

        const fromIdValues = linksDataModel.resolveColumnById<string>(this, 'fromValue', linksProcessedData);
        const toIdValues = linksDataModel.resolveColumnById<string>(this, 'toValue', linksProcessedData);
        const sizeValues =
            sizeKey == null
                ? undefined
                : linksDataModel.resolveColumnById<number>(this, 'sizeValue', linksProcessedData);

        const nodesById = new Map<string, TNodeDatum>();
        for (const datum of this.processedNodes.values()) {
            const node = createNode(datum);
            nodesById.set(datum.id, node);
        }

        const baseLinks: TLinkDatum[] = [];
        const linkData = linksProcessedData.dataSources.get(this.id)?.data;
        if (linkData) {
            for (const [datumIndex, datum] of linkData.entries()) {
                const fromId: string = fromIdValues[datumIndex];
                const toId: string = toIdValues[datumIndex];
                const size: number = sizeValues == null ? 1 : sizeValues[datumIndex];
                const fromNode = nodesById.get(fromId);
                const toNode = nodesById.get(toId);
                if (size <= 0 || fromNode == null || toNode == null) continue;

                const linkNodeDatumIndex = { type: FlowProportionDatumType.Link, index: datumIndex };

                const link = createLink({
                    series: this,
                    itemId: undefined,
                    datum,
                    datumIndex: linkNodeDatumIndex,
                    type: FlowProportionDatumType.Link,
                    index: datumIndex,
                    fromNode,
                    toNode,
                    size,
                    style: this.getLinkStyle(
                        { datum, datumIndex: linkNodeDatumIndex } as Partial<TLinkDatum>,
                        fromNode.datumIndex,
                        false
                    ),
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
            this._nodeDataDependencies == null ||
            this._nodeDataDependencies.seriesRectWidth !== newNodeDataDependencies.seriesRectWidth ||
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
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.TransformableText, TLabel>;
    }): _ModuleSupport.Selection<_ModuleSupport.TransformableText, TLabel>;

    protected abstract updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, TLabel>;
    }): void;

    protected abstract updateNodeSelection(opts: {
        nodeData: TNodeDatum[];
        datumSelection: _ModuleSupport.Selection<TNode, TNodeDatum>;
    }): _ModuleSupport.Selection<TNode, TNodeDatum>;

    protected abstract updateNodeNodes(opts: {
        datumSelection: _ModuleSupport.Selection<TNode, TNodeDatum>;
        isHighlight: boolean;
    }): void;

    protected abstract updateLinkSelection(opts: {
        nodeData: TLinkDatum[];
        datumSelection: _ModuleSupport.Selection<TLink, TLinkDatum>;
    }): _ModuleSupport.Selection<TLink, TLinkDatum>;

    protected abstract updateLinkNodes(opts: {
        datumSelection: _ModuleSupport.Selection<TLink, TLinkDatum>;
        isHighlight: boolean;
    }): void;

    override resetAnimation(_chartAnimationPhase: _ModuleSupport.ChartAnimationPhase): void {
        // Does not reset any animations
    }

    override dataCount(): number {
        return Number.NaN; // Not used
    }

    override getSeriesDomain(_direction: _ModuleSupport.ChartAxisDirection): any[] {
        return [];
    }

    override getSeriesRange(
        _direction: _ModuleSupport.ChartAxisDirection,
        _visibleRange: [any, any]
    ): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    protected legendItemSymbol(
        _type: FlowProportionDatumType,
        nodeIndex: number,
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
            ({ id, label }, nodeIndex): _ModuleSupport.CategoryLegendDatum => ({
                legendType: 'category',
                id: this.id,
                itemId: id,
                seriesId: this.id,
                enabled: true,
                label: { text: label ?? id },
                symbol: this.legendItemSymbol(FlowProportionDatumType.Node, nodeIndex),
                hideInLegend: !showInLegend,
                isFixed: true,
            })
        );
    }

    override pickNodeClosestDatum({ x, y }: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        let minDistanceSquared = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum<_ModuleSupport.DatumIndexType> | undefined;

        this.linkSelection.each((node, datum) => {
            const distanceSquared = node.distanceSquared(x, y);
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

        return minDatum == null ? undefined : { datum: minDatum, distance: Math.sqrt(minDistanceSquared) };
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

    protected abstract computeFocusBounds(node: TNode | TLink): _ModuleSupport.BBox | _ModuleSupport.Path | undefined;

    public override pickFocus(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.PickFocusOutputs | undefined {
        const { datumIndexDelta: childDelta, otherIndexDelta: depthDelta } = opts;

        const currentNodeDatum = this.contextNodeData?.nodeData[opts.datumIndex - opts.datumIndexDelta] as
            | TNodeDatum
            | TLinkDatum
            | undefined;
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

    getCategoryValue(_datumIndex: FlowProportionNodeDatumIndex): any {
        return;
    }

    datumIndexForCategoryValue(_categoryValue: any): FlowProportionNodeDatumIndex | undefined {
        return;
    }
}
