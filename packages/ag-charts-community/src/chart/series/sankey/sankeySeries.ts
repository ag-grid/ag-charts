import type { ModuleContext } from '../../../module/moduleContext';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { ARRAY, Validate } from '../../../util/validation';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import type { ChartAxisDirection } from '../../chartAxisDirection';
import { DataController } from '../../data/dataController';
import type { DataModel, ProcessedData } from '../../data/dataModel';
import { createDatumId } from '../../data/processors';
import type { TooltipContent } from '../../tooltip/tooltip';
import { DataModelSeries } from '../dataModelSeries';
import { type PickFocusInputs, type SeriesNodeDataContext, keyProperty, valueProperty } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import { SankeyLink } from './sankeyLink';
import { SankeySeriesProperties } from './sankeySeriesProperties';
import { type NodePathLengthEntry, computePathLength } from './sankeyUtil';

interface SankeyLinkDatum extends SeriesNodeDatum {
    fromId: string;
    toId: string;
    size: number;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    height: number;
}

interface SankeyNodeDatum {
    id: string;
    label: string | undefined;
    size: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface SankeyNodeLabelDatum {}

export interface SankeyNodeDataContext extends SeriesNodeDataContext<SankeyLinkDatum, SankeyNodeLabelDatum> {
    nodes: SankeyNodeDatum[];
}

export class SankeySeries extends DataModelSeries<
    SankeyLinkDatum,
    SankeySeriesProperties,
    SankeyNodeLabelDatum,
    SankeyNodeDataContext
> {
    static readonly className = 'SankeySeries';
    static readonly type = 'sankey' as const;

    override properties = new SankeySeriesProperties();

    @Validate(ARRAY, { optional: true, property: 'nodes' })
    private _chartNodes?: any[] = undefined;

    private get nodes() {
        return this.properties.nodes ?? this._chartNodes;
    }

    private readonly nodesDataController = new DataController('standalone');
    private nodesDataModel: DataModel<any, any, true> | undefined = undefined;
    private nodesProcessedData: ProcessedData<any> | undefined = undefined;

    public contextNodeData?: SankeyNodeDataContext;

    private readonly linkGroup = this.contentGroup.appendChild(new Group({ name: 'linkGroup' }));
    private readonly nodeGroup = this.contentGroup.appendChild(new Group({ name: 'nodeGroup' }));

    public linkSelection: Selection<SankeyLink, SankeyLinkDatum> = Selection.select(this.linkGroup, () =>
        this.linkFactory()
    );
    public nodeSelection: Selection<Rect, SankeyNodeDatum> = Selection.select(this.nodeGroup, () => this.nodeFactory());

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
        });
    }

    setChartNodes(nodes: any): void {
        this._chartNodes = nodes;
        if (this.nodes === nodes) {
            this.nodeDataRefresh = true;
        }
    }

    override get hasData() {
        return super.hasData && this.nodes != null;
    }

    public override getNodeData(): SankeyLinkDatum[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    private linkFactory() {
        return new SankeyLink();
    }

    private nodeFactory() {
        return new Rect();
    }

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

    override async createNodeData(): Promise<SankeyNodeDataContext | undefined> {
        const {
            id: seriesId,
            _nodeDataDependencies: { seriesRectWidth, seriesRectHeight } = { seriesRectWidth: 0, seriesRectHeight: 0 },
            nodesDataModel,
            nodesProcessedData,
            dataModel: linksDataModel,
            processedData: linksProcessedData,
        } = this;

        if (
            nodesDataModel == null ||
            nodesProcessedData == null ||
            linksDataModel == null ||
            linksProcessedData == null
        ) {
            return;
        }

        const { sizeKey, labelKey, nodeSizeKey, nodeWidth } = this.properties;

        const fromIdIdx = linksDataModel.resolveProcessedDataIndexById(this, 'fromIdValue');
        const toIdIdx = linksDataModel.resolveProcessedDataIndexById(this, 'toIdValue');
        const sizeIdx = sizeKey != null ? linksDataModel.resolveProcessedDataIndexById(this, 'sizeValue') : undefined;

        const nodeIdIdx = nodesDataModel.resolveProcessedDataIndexById(this, 'nodeIdValue');
        const labelIdx =
            labelKey != null ? nodesDataModel.resolveProcessedDataIndexById(this, 'labelValue') : undefined;
        const nodeSizeIdx =
            nodeSizeKey != null ? nodesDataModel.resolveProcessedDataIndexById(this, 'nodeSizeValue') : undefined;

        const entryNodeSize = new Map<string, number>();
        const exitNodeSize = new Map<string, number>();
        const links = linksProcessedData.data.map(({ datum, values }) => {
            const fromId: string = values[fromIdIdx];
            const toId: string = values[toIdIdx];
            const size: number = sizeIdx != null ? values[sizeIdx] : 0;
            exitNodeSize.set(fromId, (exitNodeSize.get(fromId) ?? 0) + size);
            entryNodeSize.set(toId, (entryNodeSize.get(toId) ?? 0) + size);
            return { datum, fromId, toId, size };
        });

        const nodesById = new Map<string, SankeyNodeDatum>();
        const nodePathsById = new Map<string, NodePathLengthEntry & { ratio: number }>();
        nodesProcessedData.data.forEach(({ keys, values }) => {
            const value = values[0];
            const id = keys[nodeIdIdx];
            const label = labelIdx != null ? value[labelIdx] : undefined;
            const size = Math.max(
                nodeSizeIdx != null ? value[nodeSizeIdx] : 0,
                entryNodeSize.get(id) ?? 0,
                exitNodeSize.get(id) ?? 0
            );
            nodesById.set(id, {
                id,
                label,
                size,
                x: NaN,
                y: NaN,
                width: nodeWidth,
                height: NaN,
            });
            nodePathsById.set(id, {
                id,
                maxPathLengthBefore: -1,
                maxPathLengthAfter: -1,
                ratio: NaN,
            });
        });

        let maxPathLength = 0;
        nodePathsById.forEach((node) => {
            maxPathLength = Math.max(
                maxPathLength,
                computePathLength(nodePathsById, links, node, -1) + computePathLength(nodePathsById, links, node, 1) + 1
            );
        });

        const nodeGroups = new Map<number, { size: number; nodes: SankeyNodeDatum[] }>();
        nodePathsById.forEach(({ id, maxPathLengthBefore, maxPathLengthAfter, ratio }) => {
            const node = nodesById.get(id)!;

            if (!Number.isFinite(ratio)) {
                ratio = maxPathLengthBefore / (maxPathLengthBefore + maxPathLengthAfter);
            }

            ratio = Math.min(Math.max(Math.round(ratio * 100) / 100, 0), 1);
            node.x = (seriesRectWidth - nodeWidth) * ratio;

            let nodeGroup = nodeGroups.get(ratio);
            if (nodeGroup == null) {
                nodeGroup = { size: 0, nodes: [node] };
                nodeGroups.set(ratio, nodeGroup);
            } else {
                nodeGroup.nodes.push(node);
            }
            nodeGroup.size += node.size;
        });

        const maxPaddingRatio = 0.5;
        const minPaddingRatio = 0.25;
        let maximumSizeScale = Infinity;
        nodeGroups.forEach(({ size, nodes }) => {
            const sizeScale = (1 - (nodes.length - 1) * minPaddingRatio) / size;
            maximumSizeScale = Math.min(maximumSizeScale, sizeScale);
        });

        nodeGroups.forEach(({ nodes, size }) => {
            const nodesHeight = seriesRectHeight * size * maximumSizeScale;
            const gaps = nodes.length - 1;
            const gap =
                gaps > 0 ? Math.min((seriesRectHeight - nodesHeight) / gaps, seriesRectHeight * maxPaddingRatio) : 0;
            const outerPadding = (seriesRectHeight - (nodesHeight + gap * gaps)) / 2;
            let y = outerPadding;
            nodes.forEach((node) => {
                const height = seriesRectHeight * node.size * maximumSizeScale;
                node.y = y;
                node.height = height;
                y += height + gap;
            });
        });

        const nodeData: SankeyLinkDatum[] = [];
        const leadingNodeYs = new Map<string, number>();
        const trailingNodeYs = new Map<string, number>();
        links.forEach(({ datum, fromId, toId, size }) => {
            const fromNode = nodesById.get(fromId);
            const toNode = nodesById.get(toId);
            if (fromNode == null || toNode == null) return;

            const height = seriesRectHeight * size * maximumSizeScale;
            const x1 = fromNode.x + nodeWidth;
            const x2 = toNode.x;
            const y1 = trailingNodeYs.get(fromId) ?? fromNode.y;
            const y2 = leadingNodeYs.get(toId) ?? toNode.y;

            trailingNodeYs.set(fromId, y1 + height);
            leadingNodeYs.set(toId, y2 + height);

            nodeData.push({
                series: this,
                itemId: undefined,
                datum,
                fromId,
                toId,
                size,
                x1,
                x2,
                y1,
                y2,
                height,
            });
        });

        return {
            itemId: seriesId,
            nodeData,
            labelData: [],
            nodes: Array.from(nodesById.values()),
        };
    }

    async updateSelections(): Promise<void> {
        if (this.nodeDataRefresh) {
            this.contextNodeData = await this.createNodeData();
            this.nodeDataRefresh = false;
        }

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const nodes = this.contextNodeData?.nodes ?? [];

        this.nodeSelection = await this.updateDatumSelection({ nodeData: nodes, datumSelection: this.nodeSelection });
        await this.updateDatumNodes({ datumSelection: this.nodeSelection, isHighlight: false });

        this.linkSelection = await this.updateLinkSelection({ nodeData, datumSelection: this.linkSelection });
        await this.updateLinkNodes({ datumSelection: this.linkSelection, isHighlight: false });
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
    }

    private async updateDatumSelection(opts: {
        nodeData: SankeyNodeDatum[];
        datumSelection: Selection<Rect, SankeyNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.id));
    }

    private async updateDatumNodes(opts: { datumSelection: Selection<Rect, SankeyNodeDatum>; isHighlight: boolean }) {
        const { datumSelection } = opts;
        datumSelection.each((rect, datum) => {
            rect.x = datum.x;
            rect.y = datum.y;
            rect.width = datum.width;
            rect.height = datum.height;
            rect.fill = 'red';
        });
    }

    private async updateLinkSelection(opts: {
        nodeData: SankeyLinkDatum[];
        datumSelection: Selection<SankeyLink, SankeyLinkDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) =>
            createDatumId([datum.fromId, datum.toId])
        );
    }

    private async updateLinkNodes(opts: {
        datumSelection: Selection<SankeyLink, SankeyLinkDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection } = opts;
        datumSelection.each((link, { x1, x2, y1, y2, height }) => {
            link.x1 = x1;
            link.y1 = y1;
            link.x2 = x2;
            link.y2 = y2;
            link.height = height;
            link.fill = 'red';
            link.opacity = 0.5;
        });
    }

    override resetAnimation(_chartAnimationPhase: ChartAnimationPhase): void {}

    override getTooltipHtml(_seriesDatum: any): TooltipContent {
        return { html: '', ariaLabel: '' };
    }

    override getSeriesDomain(_direction: ChartAxisDirection): any[] {
        return [];
    }

    override getLabelData(): PointLabelDatum[] {
        return [];
    }

    override getLegendData(_legendType: unknown) {
        return [];
    }

    protected override computeFocusBounds(_opts: PickFocusInputs): BBox | undefined {
        return;
    }
}
