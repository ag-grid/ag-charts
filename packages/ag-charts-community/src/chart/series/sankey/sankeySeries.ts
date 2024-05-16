import type { ModuleContext } from '../../../module/moduleContext';
import type { AgSankeySeriesFormatterParams, AgSankeySeriesLinkStyle } from '../../../options/agChartOptions';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { sanitizeHtml } from '../../../util/sanitize';
import type { RequireOptional } from '../../../util/types';
import { ARRAY, Validate } from '../../../util/validation';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import type { ChartAxisDirection } from '../../chartAxisDirection';
import { DataController } from '../../data/dataController';
import type { DataModel, ProcessedData } from '../../data/dataModel';
import { createDatumId } from '../../data/processors';
import { EMPTY_TOOLTIP_CONTENT, type TooltipContent } from '../../tooltip/tooltip';
import { DataModelSeries } from '../dataModelSeries';
import type { FlowProportionSeries } from '../flowProportionSeries';
import {
    type PickFocusInputs,
    type SeriesNodeDataContext,
    SeriesNodePickMode,
    keyProperty,
    valueProperty,
} from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import { SankeyLink } from './sankeyLink';
import { SankeySeriesProperties } from './sankeySeriesProperties';
import { computeNodeGraph } from './sankeyUtil';

enum SankeyDatumType {
    Link,
    Node,
}
interface SankeyLinkDatum extends SeriesNodeDatum {
    type: SankeyDatumType.Link;
    fromNode: SankeyNodeDatum;
    toNode: SankeyNodeDatum;
    size: number;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    height: number;
}

interface SankeyNodeDatum extends SeriesNodeDatum {
    type: SankeyDatumType.Node;
    id: string;
    label: string | undefined;
    size: number;
    fill: string;
    stroke: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

type SankeyDatum = SankeyLinkDatum | SankeyNodeDatum;

interface SankeyNodeLabelDatum {}

export interface SankeyNodeDataContext extends SeriesNodeDataContext<SankeyDatum, SankeyNodeLabelDatum> {}

export class SankeySeries
    extends DataModelSeries<SankeyDatum, SankeySeriesProperties, SankeyNodeLabelDatum, SankeyNodeDataContext>
    implements FlowProportionSeries
{
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
    private readonly focusLinkGroup = this.highlightNode.appendChild(new Group({ name: 'linkGroup' }));
    private readonly focusNodeGroup = this.highlightNode.appendChild(new Group({ name: 'nodeGroup' }));
    private readonly highlightLinkGroup = this.highlightNode.appendChild(new Group({ name: 'linkGroup' }));
    private readonly highlightNodeGroup = this.highlightNode.appendChild(new Group({ name: 'nodeGroup' }));

    public linkSelection: Selection<SankeyLink, SankeyLinkDatum> = Selection.select(this.linkGroup, () =>
        this.linkFactory()
    );
    public nodeSelection: Selection<Rect, SankeyNodeDatum> = Selection.select(this.nodeGroup, () => this.nodeFactory());
    private focusLinkSelection: Selection<SankeyLink, SankeyLinkDatum> = Selection.select(this.focusLinkGroup, () =>
        this.linkFactory()
    );
    private focusNodeSelection: Selection<Rect, SankeyNodeDatum> = Selection.select(this.focusNodeGroup, () =>
        this.nodeFactory()
    );
    private highlightLinkSelection: Selection<SankeyLink, SankeyLinkDatum> = Selection.select(
        this.highlightLinkGroup,
        () => this.linkFactory()
    );
    private highlightNodeSelection: Selection<Rect, SankeyNodeDatum> = Selection.select(this.highlightNodeGroup, () =>
        this.nodeFactory()
    );

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            contentGroupVirtual: false,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
        });
    }

    setChartNodes(nodes: any[] | undefined): void {
        this._chartNodes = nodes;
        if (this.nodes === nodes) {
            this.nodeDataRefresh = true;
        }
    }

    override get hasData() {
        return super.hasData && this.nodes != null;
    }

    public override getNodeData(): SankeyDatum[] | undefined {
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

        const {
            sizeKey,
            labelKey,
            nodeSizeKey,
            node: { spacing: nodeSpacing, width: nodeWidth, justify },
            fills,
            strokes,
        } = this.properties;

        const fromIdIdx = linksDataModel.resolveProcessedDataIndexById(this, 'fromIdValue');
        const toIdIdx = linksDataModel.resolveProcessedDataIndexById(this, 'toIdValue');
        const sizeIdx = sizeKey != null ? linksDataModel.resolveProcessedDataIndexById(this, 'sizeValue') : undefined;

        const nodeIdIdx = nodesDataModel.resolveProcessedDataIndexById(this, 'nodeIdValue');
        const labelIdx =
            labelKey != null ? nodesDataModel.resolveProcessedDataIndexById(this, 'labelValue') : undefined;
        const nodeSizeIdx =
            nodeSizeKey != null ? nodesDataModel.resolveProcessedDataIndexById(this, 'nodeSizeValue') : undefined;

        const nodeData: SankeyDatum[] = [];
        const nodesById = new Map<string, SankeyNodeDatum>();
        nodesProcessedData.data.forEach(({ datum, keys, values }, index) => {
            const value = values[0];
            const id = keys[nodeIdIdx];
            const label = labelIdx != null ? value[labelIdx] : undefined;
            const size = nodeSizeIdx != null ? value[nodeSizeIdx] : 0;

            const fill = fills[index % fills.length];
            const stroke = strokes[index % strokes.length];

            const node: SankeyNodeDatum = {
                series: this,
                itemId: undefined,
                datum,
                type: SankeyDatumType.Node,
                id,
                label,
                size,
                fill,
                stroke,
                x: NaN,
                y: NaN,
                width: nodeWidth,
                height: NaN,
            };
            nodesById.set(id, node);
            nodeData.push(node);
        });

        const links = linksProcessedData.data
            .map(({ datum, values }) => {
                const fromId: string = values[fromIdIdx];
                const toId: string = values[toIdIdx];
                const size: number = sizeIdx != null ? values[sizeIdx] : 0;
                const fromNode = nodesById.get(fromId)!;
                const toNode = nodesById.get(toId)!;
                return { datum, fromId, toId, fromNode, toNode, size, y1: NaN, y2: NaN };
            })
            .filter((link) => link.fromNode != null && link.toNode != null);

        const { nodeGraph, maxPathLength } = computeNodeGraph(nodesById, links, false);

        type Column = {
            nodes: SankeyNodeDatum[];
            size: number;
            readonly x: number;
        };
        const columns: Column[] = [];
        for (let i = 0; i < maxPathLength; i += 1) {
            const x = (seriesRectWidth - nodeWidth) * (i / (maxPathLength - 1));
            columns.push({ size: 0, nodes: [], x });
        }

        nodeGraph.forEach(({ datum: node, linksBefore, linksAfter, maxPathLengthBefore, maxPathLengthAfter }) => {
            const size = Math.max(
                node.size,
                linksBefore.reduce((acc, { link }) => acc + link.size, 0),
                linksAfter.reduce((acc, { link }) => acc + link.size, 0)
            );

            let column: Column;
            switch (justify) {
                case 'left':
                    column = columns[maxPathLengthBefore];
                    break;
                case 'right':
                    column = columns[maxPathLength - 1 - maxPathLengthAfter];
                    break;
                case 'center': {
                    if (linksBefore.length !== 0) {
                        column = columns[maxPathLengthBefore];
                        // eslint-disable-next-line no-negated-condition
                    } else if (linksAfter.length !== 0) {
                        const columnIndex =
                            linksAfter.reduce(
                                (acc, link) => Math.min(acc, link.node.maxPathLengthBefore),
                                maxPathLength
                            ) - 1;
                        column = columns[columnIndex];
                    } else {
                        column = columns[0];
                    }
                    break;
                }
                case 'justify': {
                    column = linksAfter.length === 0 ? columns[maxPathLength - 1] : columns[maxPathLengthBefore];
                    break;
                }
            }

            node.x = column.x;
            node.size = size;
            column.nodes.push(node);
            column.size += size;
        });

        const maximumSizeScale = columns.reduce((acc, { size, nodes }) => {
            const sizeScale = (1 - (nodes.length - 1) * (nodeSpacing / seriesRectHeight)) / size;
            return Math.min(acc, sizeScale);
        }, Infinity);

        columns.forEach(({ nodes, size }) => {
            const nodesHeight = seriesRectHeight * size * maximumSizeScale;
            const outerPadding = (seriesRectHeight - (nodesHeight + nodeSpacing * (nodes.length - 1))) / 2;
            let y = outerPadding;
            nodes.forEach((node) => {
                const height = seriesRectHeight * node.size * maximumSizeScale;
                node.y = y;
                node.height = height;
                y += height + nodeSpacing;
            });
        });

        nodeGraph.forEach(({ datum: { y }, linksBefore, linksAfter }) => {
            let y2 = y;
            linksBefore
                .sort((a, b) => a.node.datum.y - b.node.datum.y)
                .forEach(({ link }) => {
                    link.y2 = y2;
                    y2 += link.size * seriesRectHeight * maximumSizeScale;
                });

            let y1 = y;
            linksAfter
                .sort((a, b) => a.node.datum.y - b.node.datum.y)
                .forEach(({ link }) => {
                    link.y1 = y1;
                    y1 += link.size * seriesRectHeight * maximumSizeScale;
                });
        });

        links.forEach(({ datum, fromNode, toNode, size, y1, y2 }) => {
            const height = seriesRectHeight * size * maximumSizeScale;
            const x1 = fromNode.x + nodeWidth;
            const x2 = toNode.x;

            nodeData.push({
                series: this,
                itemId: undefined,
                datum,
                type: SankeyDatumType.Link,
                fromNode,
                toNode,
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
        };
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

        let highlightedDatum: SankeyDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
            highlightedDatum = undefined;
        }

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity =
            highlightedDatum != null ? this.properties.highlightStyle.series.dimOpacity ?? 1 : 1;

        const nodeData = this.contextNodeData?.nodeData ?? [];

        this.nodeSelection = await this.updateNodeSelection({ nodeData, datumSelection: this.nodeSelection });
        await this.updateNodeNodes({ datumSelection: this.nodeSelection, isHighlight: false });

        this.linkSelection = await this.updateLinkSelection({ nodeData, datumSelection: this.linkSelection });
        await this.updateLinkNodes({ datumSelection: this.linkSelection, isHighlight: false });

        if (highlightedDatum?.type === SankeyDatumType.Node) {
            const focusLinks = nodeData.filter((node): node is SankeyLinkDatum => {
                return (
                    node.type === SankeyDatumType.Link &&
                    (node.toNode === highlightedDatum || node.fromNode === highlightedDatum)
                );
            });
            const focusNodes = focusLinks.map((link) => {
                return link.fromNode === highlightedDatum ? link.toNode : link.fromNode;
            });
            focusNodes.push(highlightedDatum);

            this.focusNodeSelection = await this.updateNodeSelection({
                nodeData: focusNodes,
                datumSelection: this.focusNodeSelection,
            });
            await this.updateNodeNodes({ datumSelection: this.focusNodeSelection, isHighlight: false });

            this.focusLinkSelection = await this.updateLinkSelection({
                nodeData: focusLinks,
                datumSelection: this.focusLinkSelection,
            });
            await this.updateLinkNodes({ datumSelection: this.focusLinkSelection, isHighlight: false });

            this.highlightNodeSelection = await this.updateNodeSelection({
                nodeData: [highlightedDatum],
                datumSelection: this.highlightNodeSelection,
            });
            await this.updateNodeNodes({ datumSelection: this.highlightNodeSelection, isHighlight: true });

            this.highlightLinkSelection = await this.updateLinkSelection({
                nodeData: [],
                datumSelection: this.highlightLinkSelection,
            });
            await this.updateLinkNodes({ datumSelection: this.highlightLinkSelection, isHighlight: true });
        } else if (highlightedDatum?.type === SankeyDatumType.Link) {
            this.focusNodeSelection = await this.updateNodeSelection({
                nodeData: [highlightedDatum.fromNode, highlightedDatum.toNode],
                datumSelection: this.focusNodeSelection,
            });
            await this.updateNodeNodes({ datumSelection: this.focusNodeSelection, isHighlight: false });

            this.focusLinkSelection = await this.updateLinkSelection({
                nodeData: [highlightedDatum],
                datumSelection: this.focusLinkSelection,
            });
            await this.updateLinkNodes({ datumSelection: this.focusLinkSelection, isHighlight: false });

            this.highlightNodeSelection = await this.updateNodeSelection({
                nodeData: [],
                datumSelection: this.highlightNodeSelection,
            });
            await this.updateNodeNodes({ datumSelection: this.highlightNodeSelection, isHighlight: true });

            this.highlightLinkSelection = await this.updateLinkSelection({
                nodeData: [highlightedDatum],
                datumSelection: this.highlightLinkSelection,
            });
            await this.updateLinkNodes({ datumSelection: this.highlightLinkSelection, isHighlight: true });
        } else {
            this.focusNodeSelection = await this.updateNodeSelection({
                nodeData: [],
                datumSelection: this.focusNodeSelection,
            });
            await this.updateNodeNodes({ datumSelection: this.focusNodeSelection, isHighlight: false });

            this.focusLinkSelection = await this.updateLinkSelection({
                nodeData: [],
                datumSelection: this.focusLinkSelection,
            });
            await this.updateLinkNodes({ datumSelection: this.focusLinkSelection, isHighlight: false });

            this.highlightNodeSelection = await this.updateNodeSelection({
                nodeData: [],
                datumSelection: this.highlightNodeSelection,
            });
            await this.updateNodeNodes({ datumSelection: this.highlightNodeSelection, isHighlight: true });

            this.highlightLinkSelection = await this.updateLinkSelection({
                nodeData: [],
                datumSelection: this.highlightLinkSelection,
            });
            await this.updateLinkNodes({ datumSelection: this.highlightLinkSelection, isHighlight: true });
        }
    }

    private async updateNodeSelection(opts: {
        nodeData: SankeyDatum[];
        datumSelection: Selection<Rect, SankeyNodeDatum>;
    }) {
        return opts.datumSelection.update(
            opts.nodeData.filter((node): node is SankeyNodeDatum => node.type === SankeyDatumType.Node),
            undefined,
            (datum) => createDatumId([datum.type, datum.id])
        );
    }

    private async updateNodeNodes(opts: { datumSelection: Selection<Rect, SankeyNodeDatum>; isHighlight: boolean }) {
        const { datumSelection, isHighlight } = opts;
        const { properties } = this;
        const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = this.properties.node;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;
        const strokeWidth = this.getStrokeWidth(properties.link.strokeWidth);

        datumSelection.each((rect, datum) => {
            rect.x = datum.x;
            rect.y = datum.y;
            rect.width = datum.width;
            rect.height = datum.height;
            rect.fill = highlightStyle?.fill ?? fill ?? datum.fill;
            rect.fillOpacity = highlightStyle?.fillOpacity ?? fillOpacity;
            rect.stroke = highlightStyle?.stroke ?? stroke ?? datum.stroke;
            rect.strokeOpacity = highlightStyle?.strokeOpacity ?? strokeOpacity;
            rect.strokeWidth = highlightStyle?.strokeWidth ?? strokeWidth;
            rect.lineDash = highlightStyle?.lineDash ?? lineDash;
            rect.lineDashOffset = highlightStyle?.lineDashOffset ?? lineDashOffset;
        });
    }

    private async updateLinkSelection(opts: {
        nodeData: SankeyDatum[];
        datumSelection: Selection<SankeyLink, SankeyLinkDatum>;
    }) {
        return opts.datumSelection.update(
            opts.nodeData.filter((node): node is SankeyLinkDatum => node.type === SankeyDatumType.Link),
            undefined,
            (datum) => createDatumId([datum.type, datum.fromNode.id, datum.toNode.id])
        );
    }

    private async updateLinkNodes(opts: {
        datumSelection: Selection<SankeyLink, SankeyLinkDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const {
            id: seriesId,
            properties,
            ctx: { callbackCache },
        } = this;
        const { fromIdKey, toIdKey, nodeIdKey, labelKey, sizeKey, nodeSizeKey, formatter } = properties;
        const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = properties.link;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;
        const strokeWidth = this.getStrokeWidth(properties.link.strokeWidth);

        datumSelection.each((link, datum) => {
            let format: AgSankeySeriesLinkStyle | undefined;
            if (formatter != null) {
                const params: RequireOptional<AgSankeySeriesFormatterParams> = {
                    seriesId,
                    datum: datum.datum,
                    itemId: datum.itemId,
                    fromIdKey,
                    toIdKey,
                    nodeIdKey,
                    labelKey,
                    sizeKey,
                    nodeSizeKey,
                    fill,
                    fillOpacity,
                    strokeOpacity,
                    stroke,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                    highlighted: isHighlight,
                };
                format = callbackCache.call(formatter, params as AgSankeySeriesFormatterParams);
            }

            link.x1 = datum.x1;
            link.y1 = datum.y1;
            link.x2 = datum.x2;
            link.y2 = datum.y2;
            link.height = datum.height;
            link.fill = highlightStyle?.fill ?? format?.fill ?? fill ?? datum.fromNode.fill;
            link.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
            link.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke ?? datum.fromNode.stroke;
            link.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
            link.strokeWidth = highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth;
            link.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
            link.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
            link.inset = link.strokeWidth / 2;
        });
    }

    override resetAnimation(_chartAnimationPhase: ChartAnimationPhase): void {}

    override getTooltipHtml(nodeDatum: SankeyDatum): TooltipContent {
        const {
            id: seriesId,
            processedData,
            ctx: { callbackCache },
            properties,
        } = this;

        if (!processedData || !properties.isValid()) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const {
            fromIdKey,
            fromIdName,
            toIdKey,
            toIdName,
            nodeIdKey,
            nodeIdName,
            sizeKey,
            sizeName,
            labelKey,
            labelName,
            nodeSizeKey,
            nodeSizeName,
            formatter,
            tooltip,
        } = properties;
        const { fillOpacity, strokeOpacity, stroke, strokeWidth, lineDash, lineDashOffset } = properties.link;
        const { datum, itemId } = nodeDatum;

        let title: string;
        const contentLines: string[] = [];
        let fill: string;
        if (nodeDatum.type === SankeyDatumType.Link) {
            const { fromNode, toNode, size } = nodeDatum;
            title = `${fromNode.label ?? fromNode.id} - ${toNode.label ?? toNode.id}`;
            contentLines.push(sanitizeHtml(`${sizeName ?? sizeKey}: ` + size));
            fill = properties.link.fill ?? fromNode.fill;
        } else {
            const { id, label, size } = nodeDatum;
            title = label ?? id;
            contentLines.push(sanitizeHtml(`${sizeName ?? sizeKey}: ` + size));
            fill = properties.node.fill ?? nodeDatum.fill;
        }
        const content = contentLines.join('<br>');

        let format: AgSankeySeriesLinkStyle | undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                seriesId,
                datum: datum.datum,
                itemId: datum.itemId,
                fromIdKey,
                toIdKey,
                nodeIdKey,
                labelKey,
                sizeKey,
                nodeSizeKey,
                fill,
                fillOpacity,
                strokeOpacity,
                stroke,
                strokeWidth,
                lineDash,
                lineDashOffset,
                highlighted: false,
            });
        }

        const color = format?.fill ?? fill;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                datum,
                title,
                color,
                itemId,
                fromIdKey,
                fromIdName,
                toIdKey,
                toIdName,
                nodeIdKey,
                nodeIdName,
                sizeKey,
                sizeName,
                labelKey,
                labelName,
                nodeSizeKey,
                nodeSizeName,
                ...this.getModuleTooltipParams(),
            }
        );
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
