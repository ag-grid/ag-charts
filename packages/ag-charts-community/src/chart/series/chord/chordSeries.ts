import type { ModuleContext } from '../../../module/moduleContext';
import type { AgChordSeriesFormatterParams, AgChordSeriesLinkStyle } from '../../../options/agChartOptions';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { Selection } from '../../../scene/selection';
import { Sector } from '../../../scene/shape/sector';
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
import {
    type PickFocusInputs,
    type SeriesNodeDataContext,
    SeriesNodePickMode,
    keyProperty,
    valueProperty,
} from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import { ChordLink } from './chordLink';
import { ChordSeriesProperties } from './chordSeriesProperties';

interface ChordLinkDatum extends SeriesNodeDatum {
    fromNode: ChordNodeDatum;
    toNode: ChordNodeDatum;
    size: number;
    centerX: number;
    centerY: number;
    radius: number;
    startAngle1: number;
    endAngle1: number;
    startAngle2: number;
    endAngle2: number;
}

interface ChordNodeDatum {
    id: string;
    index: number;
    label: string | undefined;
    size: number;
    centerX: number;
    centerY: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
}

interface ChordNodeLabelDatum {}

export interface ChordNodeDataContext extends SeriesNodeDataContext<ChordLinkDatum, ChordNodeLabelDatum> {
    nodes: ChordNodeDatum[];
}

export class ChordSeries extends DataModelSeries<
    ChordLinkDatum,
    ChordSeriesProperties,
    ChordNodeLabelDatum,
    ChordNodeDataContext
> {
    static readonly className = 'ChordSeries';
    static readonly type = 'chord' as const;

    override properties = new ChordSeriesProperties();

    @Validate(ARRAY, { optional: true, property: 'nodes' })
    private _chartNodes?: any[] = undefined;

    private get nodes() {
        return this.properties.nodes ?? this._chartNodes;
    }

    private readonly nodesDataController = new DataController('standalone');
    private nodesDataModel: DataModel<any, any, true> | undefined = undefined;
    private nodesProcessedData: ProcessedData<any> | undefined = undefined;

    public contextNodeData?: ChordNodeDataContext;

    private readonly linkGroup = this.contentGroup.appendChild(new Group({ name: 'linkGroup' }));
    private readonly nodeGroup = this.contentGroup.appendChild(new Group({ name: 'nodeGroup' }));

    public linkSelection: Selection<ChordLink, ChordLinkDatum> = Selection.select(this.linkGroup, () =>
        this.linkFactory()
    );
    public nodeSelection: Selection<Sector, ChordNodeDatum> = Selection.select(this.nodeGroup, () =>
        this.nodeFactory()
    );
    private highlightLinkSelection: Selection<ChordLink, ChordLinkDatum> = Selection.select(this.highlightNode, () =>
        this.linkFactory()
    );

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
        });

        this.nodeGroup.pointerEvents = PointerEvents.None;
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

    public override getNodeData(): ChordLinkDatum[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    private linkFactory() {
        return new ChordLink();
    }

    private nodeFactory() {
        return new Sector();
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

    override async createNodeData(): Promise<ChordNodeDataContext | undefined> {
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
            node: { height: nodeHeight, spacing: nodeSpacing },
        } = this.properties;
        const centerX = seriesRectWidth / 2;
        const centerY = seriesRectHeight / 2;
        const radius = Math.min(seriesRectWidth, seriesRectHeight) / 2 - nodeHeight;
        const innerRadius = radius;
        const outerRadius = radius + nodeHeight;

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

        const nodesById = new Map<string, ChordNodeDatum>();
        let totalSize = 0;
        nodesProcessedData.data.forEach(({ keys, values }, index) => {
            const value = values[0];
            const id = keys[nodeIdIdx];
            const label = labelIdx != null ? value[labelIdx] : undefined;
            const size = Math.max(
                nodeSizeIdx != null ? value[nodeSizeIdx] : 0,
                (entryNodeSize.get(id) ?? 0) + (exitNodeSize.get(id) ?? 0)
            );
            totalSize += size;
            nodesById.set(id, {
                id,
                index,
                label,
                size,
                centerX,
                centerY,
                innerRadius,
                outerRadius,
                startAngle: NaN,
                endAngle: NaN,
            });
        });

        const spacing = (nodesById.size * nodeSpacing) / (2 * Math.PI * radius);
        const sizeScale = (2 * Math.PI - nodesById.size * spacing) / totalSize;
        let currentAngle = 0;
        nodesById.forEach((node) => {
            const sweep = node.size * sizeScale;
            node.startAngle = currentAngle;
            node.endAngle = currentAngle + sweep;
            currentAngle += sweep + spacing;
        });

        const nodeData: ChordLinkDatum[] = [];
        const nodeAngles = new Map<string, number>();
        links.forEach(({ datum, fromId, toId, size }) => {
            const fromNode = nodesById.get(fromId);
            const toNode = nodesById.get(toId);
            if (fromNode == null || toNode == null) return;

            const sweep = size * sizeScale;
            const startAngle1 = fromNode.startAngle + (nodeAngles.get(fromId) ?? 0);
            const endAngle1 = startAngle1 + sweep;
            const startAngle2 = toNode.startAngle + (nodeAngles.get(toId) ?? 0);
            const endAngle2 = startAngle2 + sweep;

            nodeAngles.set(fromId, endAngle1 - startAngle1);
            nodeAngles.set(toId, endAngle2 - startAngle2);

            nodeData.push({
                series: this,
                itemId: undefined,
                datum,
                fromNode,
                toNode,
                size,
                centerX,
                centerY,
                radius,
                startAngle1,
                endAngle1,
                startAngle2,
                endAngle2,
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

        let highlightedDatum: ChordLinkDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
            highlightedDatum = undefined;
        }

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const nodes = this.contextNodeData?.nodes ?? [];

        this.nodeSelection = await this.updateNodeSelection({ nodeData: nodes, datumSelection: this.nodeSelection });
        await this.updateNodeNodes({ datumSelection: this.nodeSelection, isHighlight: false });

        this.linkSelection = await this.updateLinkSelection({ nodeData, datumSelection: this.linkSelection });
        await this.updateLinkNodes({ datumSelection: this.linkSelection, isHighlight: false });

        this.highlightLinkSelection = await this.updateLinkSelection({
            nodeData: highlightedDatum != null ? [highlightedDatum] : [],
            datumSelection: this.highlightLinkSelection,
        });
        await this.updateLinkNodes({ datumSelection: this.highlightLinkSelection, isHighlight: true });
    }

    private async updateNodeSelection(opts: {
        nodeData: ChordNodeDatum[];
        datumSelection: Selection<Sector, ChordNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.id));
    }

    private async updateNodeNodes(opts: { datumSelection: Selection<Sector, ChordNodeDatum>; isHighlight: boolean }) {
        const { datumSelection } = opts;
        const { fills, strokes } = this.properties;
        const { fill, fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
            this.properties.node;
        datumSelection.each((sector, datum) => {
            sector.centerX = datum.centerX;
            sector.centerY = datum.centerY;
            sector.innerRadius = datum.innerRadius;
            sector.outerRadius = datum.outerRadius;
            sector.startAngle = datum.startAngle;
            sector.endAngle = datum.endAngle;
            sector.fill = fill ?? fills[datum.index % fills.length];
            sector.fillOpacity = fillOpacity;
            sector.stroke = stroke ?? strokes[datum.index % strokes.length];
            sector.strokeOpacity = strokeOpacity;
            sector.strokeWidth = strokeWidth;
            sector.lineDash = lineDash;
            sector.lineDashOffset = lineDashOffset;
        });
    }

    private async updateLinkSelection(opts: {
        nodeData: ChordLinkDatum[];
        datumSelection: Selection<ChordLink, ChordLinkDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) =>
            createDatumId([datum.fromNode.id, datum.toNode.id])
        );
    }

    private async updateLinkNodes(opts: {
        datumSelection: Selection<ChordLink, ChordLinkDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const {
            id: seriesId,
            properties,
            ctx: { callbackCache },
        } = this;
        const {
            fromIdKey,
            toIdKey,
            nodeIdKey,
            labelKey,
            sizeKey,
            nodeSizeKey,
            positionKey,
            fills,
            strokes,
            formatter,
        } = properties;
        const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = properties.link;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;
        const strokeWidth = this.getStrokeWidth(properties.link.strokeWidth);

        datumSelection.each((link, datum) => {
            let format: AgChordSeriesLinkStyle | undefined;
            if (formatter != null) {
                const params: RequireOptional<AgChordSeriesFormatterParams> = {
                    seriesId,
                    datum: datum.datum,
                    itemId: datum.itemId,
                    fromIdKey,
                    toIdKey,
                    nodeIdKey,
                    labelKey,
                    sizeKey,
                    nodeSizeKey,
                    positionKey,
                    fill,
                    fillOpacity,
                    strokeOpacity,
                    stroke,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                    highlighted: isHighlight,
                };
                format = callbackCache.call(formatter, params as AgChordSeriesFormatterParams);
            }

            const index = datum.fromNode.index;

            link.centerX = datum.centerX;
            link.centerY = datum.centerY;
            link.radius = datum.radius;
            link.startAngle1 = datum.startAngle1;
            link.endAngle1 = datum.endAngle1;
            link.startAngle2 = datum.startAngle2;
            link.endAngle2 = datum.endAngle2;
            link.fill = highlightStyle?.fill ?? format?.fill ?? fill ?? fills[index % fills.length];
            link.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
            link.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke ?? strokes[index % strokes.length];
            link.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
            link.strokeWidth = highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth;
            link.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
            link.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
        });
    }

    override resetAnimation(_chartAnimationPhase: ChartAnimationPhase): void {}

    override getTooltipHtml(nodeDatum: ChordLinkDatum): TooltipContent {
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
            positionKey,
            positionName,
            formatter,
            tooltip,
        } = properties;
        const { fill, fillOpacity, strokeOpacity, stroke, strokeWidth, lineDash, lineDashOffset } = properties.link;
        const { datum, fromNode, toNode, size, itemId } = nodeDatum;

        const contentLines: string[] = [];
        contentLines.push(sanitizeHtml(`${fromIdName ?? fromIdKey}: ` + (fromNode.label ?? fromNode.id)));
        contentLines.push(sanitizeHtml(`${toIdName ?? toIdKey}: ` + (toNode.label ?? toNode.id)));
        contentLines.push(sanitizeHtml(`${sizeName ?? sizeKey}: ` + size));
        const content = contentLines.join('<br>');

        let format: AgChordSeriesLinkStyle | undefined;

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
                positionKey,
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
            { title: undefined, content, backgroundColor: color },
            {
                seriesId,
                datum,
                title: '',
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
                positionKey,
                positionName,
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
