import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
import { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import { ARRAY, Validate } from '../../../util/validation';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import type { ChartAxisDirection } from '../../chartAxisDirection';
import { DataController } from '../../data/dataController';
import type { DataModel, ProcessedData } from '../../data/dataModel';
import { DataModelSeries } from '../dataModelSeries';
import type { FlowProportionSeries as BaseFlowProportionSeries } from '../flowProportionSeries';
import { type PickFocusInputs, type SeriesNodeDataContext, keyProperty, valueProperty } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { FlowProportionSeriesProperties } from './flowProportionProperties';

export enum FlowProportionDatumType {
    Link,
    Node,
}

export interface FlowProportionLinkDatum<TNodeDatum extends FlowProportionNodeDatum> extends SeriesNodeDatum {
    type: FlowProportionDatumType.Link;
    fromNode: TNodeDatum;
    toNode: TNodeDatum;
    size: number;
}

export interface FlowProportionNodeDatum extends SeriesNodeDatum {
    type: FlowProportionDatumType.Node;
    id: string;
    label: string | undefined;
    size: number;
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
        TNode extends Node,
        TLink extends Node,
    >
    extends DataModelSeries<
        TDatum<TNodeDatum, TLinkDatum>,
        TProps,
        TLabel,
        SeriesNodeDataContext<TDatum<TNodeDatum, TLinkDatum>, TLabel>
    >
    implements BaseFlowProportionSeries
{
    abstract override properties: TProps;

    @Validate(ARRAY, { optional: true, property: 'nodes' })
    private _chartNodes?: any[] = undefined;

    protected get nodes() {
        return this.properties.nodes ?? this._chartNodes;
    }

    private readonly nodesDataController = new DataController('standalone');
    protected nodesDataModel: DataModel<any, any, true> | undefined = undefined;
    protected nodesProcessedData: ProcessedData<any> | undefined = undefined;

    public contextNodeData?: SeriesNodeDataContext<TDatum<TNodeDatum, TLinkDatum>, TLabel>;

    private readonly linkGroup = this.contentGroup.appendChild(new Group({ name: 'linkGroup' }));
    private readonly nodeGroup = this.contentGroup.appendChild(new Group({ name: 'nodeGroup' }));
    private readonly focusLinkGroup = this.highlightNode.appendChild(new Group({ name: 'linkGroup' }));
    private readonly focusNodeGroup = this.highlightNode.appendChild(new Group({ name: 'nodeGroup' }));
    private readonly highlightLinkGroup = this.highlightNode.appendChild(new Group({ name: 'linkGroup' }));
    private readonly highlightNodeGroup = this.highlightNode.appendChild(new Group({ name: 'nodeGroup' }));

    private labelSelection: Selection<Text, TPlacedLabel> = Selection.select(this.labelGroup, Text);
    public linkSelection: Selection<TLink, TLinkDatum> = Selection.select(this.linkGroup, () => this.linkFactory());
    public nodeSelection: Selection<TNode, TNodeDatum> = Selection.select(this.nodeGroup, () => this.nodeFactory());
    private focusLinkSelection: Selection<TLink, TLinkDatum> = Selection.select(this.focusLinkGroup, () =>
        this.linkFactory()
    );
    private focusNodeSelection: Selection<TNode, TNodeDatum> = Selection.select(this.focusNodeGroup, () =>
        this.nodeFactory()
    );
    private highlightLinkSelection: Selection<TLink, TLinkDatum> = Selection.select(this.highlightLinkGroup, () =>
        this.linkFactory()
    );
    private highlightNodeSelection: Selection<TNode, TNodeDatum> = Selection.select(this.highlightNodeGroup, () =>
        this.nodeFactory()
    );

    setChartNodes(nodes: any[] | undefined): void {
        this._chartNodes = nodes;
        if (this.nodes === nodes) {
            this.nodeDataRefresh = true;
        }
    }

    override get hasData() {
        return super.hasData && this.nodes != null;
    }

    public override getNodeData(): TDatum<TNodeDatum, TLinkDatum>[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    protected abstract linkFactory(): TLink;
    protected abstract nodeFactory(): TNode;

    override async processData(dataController: DataController): Promise<void> {
        const { nodesDataController, data, nodes } = this;

        if (data == null || nodes == null || !this.properties.isValid()) {
            return;
        }

        const { fromIdKey, toIdKey, sizeKey, nodeIdKey, labelKey, nodeSizeKey } = this.properties;

        const nodesDataModelPromise = this.requestDataModel<any, any, true>(nodesDataController, nodes, {
            props: [
                keyProperty(nodeIdKey, undefined, { id: 'nodeIdValue', includeProperty: false }),
                ...(labelKey != null
                    ? [valueProperty(labelKey, undefined, { id: 'labelValue', includeProperty: false })]
                    : []),
                ...(nodeSizeKey != null
                    ? [valueProperty(nodeSizeKey, undefined, { id: 'nodeSizeValue', includeProperty: false })]
                    : []),
            ],
            groupByKeys: true,
        });

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

        nodesDataController.execute();

        const [{ dataModel: nodesDataModel, processedData: nodesProcessedData }] = await Promise.all([
            nodesDataModelPromise,
            linksDataModelPromise,
        ]);

        this.nodesDataModel = nodesDataModel;
        this.nodesProcessedData = nodesProcessedData;
    }

    async updateSelections(): Promise<void> {
        if (this.nodeDataRefresh) {
            this.contextNodeData = await this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    override async update(opts: { seriesRect?: BBox | undefined }): Promise<void> {
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
        if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
            highlightedDatum = undefined;
        }

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity =
            highlightedDatum != null ? this.properties.highlightStyle.series.dimOpacity ?? 1 : 1;

        const nodeData = this.contextNodeData?.nodeData ?? [];

        this.labelSelection = await this.updateLabelSelection({ labelSelection: this.labelSelection });
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
        labelSelection: Selection<Text, TPlacedLabel>;
    }): Promise<Selection<Text, TPlacedLabel>>;

    protected abstract updateLabelNodes(opts: { labelSelection: Selection<Text, TPlacedLabel> }): Promise<void>;

    protected abstract updateNodeSelection(opts: {
        nodeData: TDatum<TNodeDatum, TLinkDatum>[];
        datumSelection: Selection<TNode, TNodeDatum>;
    }): Promise<Selection<TNode, TNodeDatum>>;

    protected abstract updateNodeNodes(opts: {
        datumSelection: Selection<TNode, TNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;

    protected abstract updateLinkSelection(opts: {
        nodeData: TDatum<TNodeDatum, TLinkDatum>[];
        datumSelection: Selection<TLink, TLinkDatum>;
    }): Promise<Selection<TLink, TLinkDatum>>;

    protected abstract updateLinkNodes(opts: {
        datumSelection: Selection<TLink, TLinkDatum>;
        isHighlight: boolean;
    }): Promise<void>;

    override resetAnimation(_chartAnimationPhase: ChartAnimationPhase): void {}

    override getSeriesDomain(_direction: ChartAxisDirection): any[] {
        return [];
    }

    override getLegendData(_legendType: unknown) {
        return [];
    }

    protected override computeFocusBounds(_opts: PickFocusInputs): BBox | undefined {
        return;
    }
}
