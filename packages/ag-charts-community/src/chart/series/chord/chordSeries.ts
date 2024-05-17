import type { ModuleContext } from '../../../module/moduleContext';
import type { AgChordSeriesFormatterParams, AgChordSeriesLinkStyle } from '../../../options/agChartOptions';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { Selection } from '../../../scene/selection';
import { Sector } from '../../../scene/shape/sector';
import { Text } from '../../../scene/shape/text';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { angleBetween, isBetweenAngles, normalizeAngle360 } from '../../../util/angle';
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
import { computeNodeGraph } from '../sankey/sankeyUtil';
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

enum ChordDatumType {
    Link,
    Node,
}

interface ChordLinkDatum extends SeriesNodeDatum {
    type: ChordDatumType.Link;
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

interface ChordNodeDatum extends SeriesNodeDatum {
    type: ChordDatumType.Node;
    id: string;
    label: string | undefined;
    size: number;
    fill: string;
    stroke: string;
    centerX: number;
    centerY: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
}

type ChordDatum = ChordLinkDatum | ChordNodeDatum;

interface ChordNodeLabelDatum {
    id: string;
    text: string;
    centerX: number;
    centerY: number;
    angle: number;
    radius: number;
}

export interface ChordNodeDataContext extends SeriesNodeDataContext<ChordDatum, ChordNodeLabelDatum> {}

const nodeMidAngle = (node: ChordNodeDatum) => node.startAngle + angleBetween(node.startAngle, node.endAngle) / 2;
export class ChordSeries extends DataModelSeries<
    ChordDatum,
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
    private readonly focusLinkGroup = this.highlightNode.appendChild(new Group({ name: 'linkGroup' }));
    private readonly focusNodeGroup = this.highlightNode.appendChild(new Group({ name: 'nodeGroup' }));
    private readonly highlightLinkGroup = this.highlightNode.appendChild(new Group({ name: 'linkGroup' }));
    private readonly highlightNodeGroup = this.highlightNode.appendChild(new Group({ name: 'nodeGroup' }));

    private labelSelection: Selection<Text, ChordNodeLabelDatum> = Selection.select(this.labelGroup, Text);
    public linkSelection: Selection<ChordLink, ChordLinkDatum> = Selection.select(this.linkGroup, () =>
        this.linkFactory()
    );
    public nodeSelection: Selection<Sector, ChordNodeDatum> = Selection.select(this.nodeGroup, () =>
        this.nodeFactory()
    );
    private focusLinkSelection: Selection<ChordLink, ChordLinkDatum> = Selection.select(this.focusLinkGroup, () =>
        this.linkFactory()
    );
    private focusNodeSelection: Selection<Sector, ChordNodeDatum> = Selection.select(this.focusNodeGroup, () =>
        this.nodeFactory()
    );
    private highlightLinkSelection: Selection<ChordLink, ChordLinkDatum> = Selection.select(
        this.highlightLinkGroup,
        () => this.linkFactory()
    );
    private highlightNodeSelection: Selection<Sector, ChordNodeDatum> = Selection.select(this.highlightNodeGroup, () =>
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

    private isLabelEnabled() {
        return this.properties.labelKey != null && this.properties.label.enabled;
    }

    override get hasData() {
        return super.hasData && this.nodes != null;
    }

    public override getNodeData(): (ChordLinkDatum | ChordNodeDatum)[] | undefined {
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
            label: { spacing: labelSpacing, maxWidth: labelMaxWidth, fontSize, fontFamily },
            node: { height: nodeHeight, spacing: nodeSpacing },
            fills,
            strokes,
        } = this.properties;
        const centerX = seriesRectWidth / 2;
        const centerY = seriesRectHeight / 2;
        const canvasFont = `${fontSize}px ${fontFamily}`;

        const fromIdIdx = linksDataModel.resolveProcessedDataIndexById(this, 'fromIdValue');
        const toIdIdx = linksDataModel.resolveProcessedDataIndexById(this, 'toIdValue');
        const sizeIdx = sizeKey != null ? linksDataModel.resolveProcessedDataIndexById(this, 'sizeValue') : undefined;

        const nodeIdIdx = nodesDataModel.resolveProcessedDataIndexById(this, 'nodeIdValue');
        const labelIdx =
            labelKey != null ? nodesDataModel.resolveProcessedDataIndexById(this, 'labelValue') : undefined;
        const nodeSizeIdx =
            nodeSizeKey != null ? nodesDataModel.resolveProcessedDataIndexById(this, 'nodeSizeValue') : undefined;

        const nodeData: ChordDatum[] = [];
        let labelData: ChordNodeLabelDatum[] = [];
        const nodesById = new Map<string, ChordNodeDatum>();

        let labelInset = 0;
        if (labelKey != null) {
            let maxMeasuredLabelWidth = 0;
            nodesProcessedData.data.forEach(({ keys, values }) => {
                const id: string = keys[nodeIdIdx];
                const value = values[0];
                const label: string | undefined = labelIdx != null ? value[labelIdx] : undefined;
                if (label == null) return;

                const text = Text.wrap(label, labelMaxWidth, Infinity, this.properties.label, 'never', 'ellipsis');
                const { width } = Text.measureText(text, canvasFont, 'middle', 'left');
                maxMeasuredLabelWidth = Math.max(width, maxMeasuredLabelWidth);

                labelData.push({
                    id,
                    text,
                    centerX,
                    centerY,
                    angle: NaN,
                    radius: NaN,
                });
            });

            labelInset = maxMeasuredLabelWidth + labelSpacing;
        }

        const nodeCount = nodesProcessedData.data.length;
        let radius = Math.min(seriesRectWidth, seriesRectHeight) / 2 - nodeHeight - labelInset;
        let spacingSweep = nodeSpacing / radius;

        if (labelInset != null && nodeCount * spacingSweep >= 1.5 * Math.PI) {
            // Spacing taking up more than 3/4 the circle
            labelData = [];
            radius = Math.min(seriesRectWidth, seriesRectHeight) / 2 - nodeHeight;
            spacingSweep = nodeSpacing / radius;
        }

        if (nodeCount * spacingSweep >= 2 * Math.PI) {
            return {
                itemId: this.id,
                nodeData: [],
                labelData: [],
            };
        }

        const innerRadius = radius;
        const outerRadius = radius + nodeHeight;

        nodesProcessedData.data.forEach(({ datum, keys, values }, index) => {
            const value = values[0];
            const id: string = keys[nodeIdIdx];
            const label: string | undefined = labelIdx != null ? value[labelIdx] : undefined;
            const size: number = nodeSizeIdx != null ? value[nodeSizeIdx] : 0;

            const fill = fills[index % fills.length];
            const stroke = strokes[index % strokes.length];

            const node: ChordNodeDatum = {
                series: this,
                itemId: undefined,
                datum,
                type: ChordDatumType.Node,
                id,
                label,
                size,
                fill,
                stroke,
                centerX,
                centerY,
                innerRadius,
                outerRadius,
                startAngle: NaN,
                endAngle: NaN,
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
                return { datum, fromId, toId, fromNode, toNode, size, angle1: NaN, angle2: NaN };
            })
            .filter((link) => link.fromNode != null && link.toNode != null);

        const { nodeGraph } = computeNodeGraph(nodesById, links, true);

        let totalSize = 0;
        nodeGraph.forEach(({ datum: node, linksBefore, linksAfter }) => {
            const size = Math.max(
                node.size,
                linksBefore.reduce((acc, { link }) => acc + link.size, 0) +
                    linksAfter.reduce((acc, { link }) => acc + link.size, 0)
            );
            node.size = size;
            totalSize += node.size;
        });

        const sizeScale = Math.max((2 * Math.PI - nodesById.size * spacingSweep) / totalSize, 0);
        let nodeAngle = 0;
        nodesById.forEach((node) => {
            const sweep = node.size * sizeScale;
            node.startAngle = nodeAngle;
            node.endAngle = nodeAngle + sweep;
            nodeAngle += sweep + spacingSweep;
        });

        nodeGraph.forEach(({ datum, linksBefore, linksAfter }) => {
            const midAngle = nodeMidAngle(datum);

            const combinedLinks = [
                ...linksBefore.map(({ link, node }) => ({
                    link,
                    distance: angleBetween(nodeMidAngle(node.datum), midAngle),
                    after: false,
                })),
                ...linksAfter.map(({ link, node }) => ({
                    link,
                    distance: angleBetween(nodeMidAngle(node.datum), midAngle),
                    after: true,
                })),
            ];

            let angle = datum.startAngle;
            combinedLinks
                .sort((a, b) => a.distance - b.distance)
                .forEach(({ link, after }) => {
                    if (after) {
                        link.angle1 = angle;
                    } else {
                        link.angle2 = angle;
                    }
                    angle += link.size * sizeScale;
                });
        });

        links.forEach(({ datum, fromNode, toNode, size, angle1, angle2 }) => {
            const sweep = size * sizeScale;
            const startAngle1 = angle1;
            const endAngle1 = startAngle1 + sweep;
            const startAngle2 = angle2;
            const endAngle2 = startAngle2 + sweep;

            nodeData.push({
                series: this,
                itemId: undefined,
                datum,
                type: ChordDatumType.Link,
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

        labelData.forEach((label) => {
            const node = nodesById.get(label.id);
            if (node == null) return;
            label.radius = outerRadius + labelSpacing;
            label.angle = normalizeAngle360(node.startAngle + angleBetween(node.startAngle, node.endAngle) / 2);
        });
        labelData.sort((a, b) => a.angle - b.angle);

        let minAngle = Infinity;
        let maxAngle = -Infinity;
        labelData = labelData.filter((label) => {
            const labelHeight = fontSize * Text.defaultLineHeightRatio;
            const da = Math.atan2(labelHeight / 2, label.radius);

            const a0 = label.angle - da;
            const a1 = label.angle + da;

            if (isBetweenAngles(minAngle, a0, a1)) return false;
            if (isBetweenAngles(maxAngle, a0, a1)) return false;

            minAngle = Math.min(a0, minAngle);
            maxAngle = Math.max(a1, maxAngle);

            return true;
        });

        return {
            itemId: seriesId,
            nodeData,
            labelData,
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

        let highlightedDatum: ChordDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
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

        this.linkSelection = await this.updateLinkSelection({ nodeData, datumSelection: this.linkSelection });
        await this.updateLinkNodes({ datumSelection: this.linkSelection, isHighlight: false });

        this.nodeSelection = await this.updateNodeSelection({ nodeData, datumSelection: this.nodeSelection });
        await this.updateNodeNodes({ datumSelection: this.nodeSelection, isHighlight: false });

        let focusLinkSelection: ChordLinkDatum[];
        let focusNodeSelection: ChordNodeDatum[];
        let highlightLinkSelection: ChordLinkDatum[];
        let highlightNodeSelection: ChordNodeDatum[];
        if (highlightedDatum?.type === ChordDatumType.Node) {
            focusLinkSelection = nodeData.filter((node): node is ChordLinkDatum => {
                return (
                    node.type === ChordDatumType.Link &&
                    (node.toNode === highlightedDatum || node.fromNode === highlightedDatum)
                );
            });
            focusNodeSelection = focusLinkSelection.map((link) => {
                return link.fromNode === highlightedDatum ? link.toNode : link.fromNode;
            });
            focusNodeSelection.push(highlightedDatum);
            highlightLinkSelection = [];
            highlightNodeSelection = [highlightedDatum];
        } else if (highlightedDatum?.type === ChordDatumType.Link) {
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

    private async updateLabelSelection(opts: {
        labelData: ChordNodeLabelDatum[];
        labelSelection: Selection<Text, ChordNodeLabelDatum>;
    }) {
        const labels = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(labels);
    }

    private async updateLabelNodes(opts: { labelSelection: Selection<Text, ChordNodeLabelDatum> }) {
        const { labelSelection } = opts;
        const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = this.properties.label;

        labelSelection.each((label, { text, centerX, centerY, radius, angle }) => {
            label.visible = true;
            label.translationX = centerX + radius * Math.cos(angle);
            label.translationY = centerY + radius * Math.sin(angle);
            label.text = text;
            label.fill = fill;
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;
            label.fontSize = fontSize;
            label.fontFamily = fontFamily;
            label.textBaseline = 'middle';
            if (Math.cos(angle) >= 0) {
                label.textAlign = 'left';
                label.rotation = angle;
            } else {
                label.textAlign = 'right';
                label.rotation = angle - Math.PI;
            }
        });
    }

    private async updateNodeSelection(opts: {
        nodeData: ChordDatum[];
        datumSelection: Selection<Sector, ChordNodeDatum>;
    }) {
        return opts.datumSelection.update(
            opts.nodeData.filter((node): node is ChordNodeDatum => node.type === ChordDatumType.Node),
            undefined,
            (datum) => createDatumId([datum.type, datum.id])
        );
    }

    private async updateNodeNodes(opts: { datumSelection: Selection<Sector, ChordNodeDatum>; isHighlight: boolean }) {
        const { datumSelection, isHighlight } = opts;
        const { properties } = this;
        const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = properties.node;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;
        const strokeWidth = this.getStrokeWidth(properties.link.strokeWidth);

        datumSelection.each((sector, datum) => {
            sector.centerX = datum.centerX;
            sector.centerY = datum.centerY;
            sector.innerRadius = datum.innerRadius;
            sector.outerRadius = datum.outerRadius;
            sector.startAngle = datum.startAngle;
            sector.endAngle = datum.endAngle;
            sector.fill = highlightStyle?.fill ?? fill ?? datum.fill;
            sector.fillOpacity = highlightStyle?.fillOpacity ?? fillOpacity;
            sector.stroke = highlightStyle?.stroke ?? stroke ?? datum.fill;
            sector.strokeOpacity = highlightStyle?.strokeOpacity ?? strokeOpacity;
            sector.strokeWidth = highlightStyle?.strokeWidth ?? strokeWidth;
            sector.lineDash = highlightStyle?.lineDash ?? lineDash;
            sector.lineDashOffset = highlightStyle?.lineDashOffset ?? lineDashOffset;
            sector.inset = sector.strokeWidth / 2;
        });
    }

    private async updateLinkSelection(opts: {
        nodeData: ChordDatum[];
        datumSelection: Selection<ChordLink, ChordLinkDatum>;
    }) {
        return opts.datumSelection.update(
            opts.nodeData.filter((node): node is ChordLinkDatum => node.type === ChordDatumType.Link),
            undefined,
            (datum) => createDatumId([datum.type, datum.fromNode.id, datum.toNode.id])
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
        const { fromIdKey, toIdKey, nodeIdKey, labelKey, sizeKey, nodeSizeKey, formatter } = properties;
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

            link.centerX = datum.centerX;
            link.centerY = datum.centerY;
            link.radius = datum.radius;
            link.startAngle1 = datum.startAngle1;
            link.endAngle1 = datum.endAngle1;
            link.startAngle2 = datum.startAngle2;
            link.endAngle2 = datum.endAngle2;
            link.fill = highlightStyle?.fill ?? format?.fill ?? fill ?? datum.fromNode.fill;
            link.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
            link.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke ?? datum.fromNode.stroke;
            link.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
            link.strokeWidth = highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth;
            link.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
            link.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
        });
    }

    override resetAnimation(_chartAnimationPhase: ChartAnimationPhase): void {}

    override getTooltipHtml(nodeDatum: ChordDatum): TooltipContent {
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
        if (nodeDatum.type === ChordDatumType.Link) {
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
