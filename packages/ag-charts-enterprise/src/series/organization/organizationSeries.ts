import {
    type AgActiveItemState,
    type AgOrganizationNodeTextFormatterParams,
    type AgOrganizationSeriesLinkItemStylerParams,
    type AgOrganizationSeriesLinkStyle,
    type AgOrganizationSeriesNodeItemStylerParams,
    type AgOrganizationSeriesNodeStyle,
    type AgOrganizationSeriesNodeTextStyle,
    type AgOrganizationSeriesNodeTextStylerParams,
    type Formatter,
    type Styler,
    type TextOrSegments,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type AxisID,
    type CallbackParamRules,
    ChartAxisDirection,
    type DeepRequired,
    type DynamicContext,
    type Point,
    Vertex,
    mergeDefaults,
    strictObjectKeys,
} from 'ag-charts-core';

import { NetworkLinkNode } from '../network/networkLinkNode';
import { AbstractNetworkSeries, type NetworkSeriesDatumIndex } from '../network/networkSeries';
import { NetworkTreeLayout, type NetworkTreeLayoutUpdateOptions } from '../network/networkTreeLayout';
import type { NetworkLinkInterpolation } from '../network/networkTypes';
import { OrganizationGraph } from './organizationGraph';
import { OrganizationNode } from './organizationNode';
import { OrganizationSeriesNodeTextProperties, OrganizationSeriesProperties } from './organizationSeriesProperties';
import type {
    OrganizationDatum,
    OrganizationEdge,
    OrganizationLinkDatum,
    OrganizationVertex,
    RequiredOrganizationNodeStyle,
    RequiredOrganizationNodeTextStyle,
} from './organizationTypes';

const { keyProperty, valueProperty } = _ModuleSupport;

const ISOTROPY_EPSILON = 1e-6;

// Keeps `[mid - range/2, mid + range/2]` inside `[0, 1]`.
function clampMid(mid: number, range: number): number {
    const half = range / 2;
    if (mid - half < 0) return half;
    if (mid + half > 1) return 1 - half;
    return mid;
}

export class OrganizationSeries extends AbstractNetworkSeries<
    OrganizationVertex,
    OrganizationEdge,
    OrganizationGraph,
    OrganizationNode,
    OrganizationDatum,
    OrganizationLinkDatum,
    NetworkTreeLayout<OrganizationVertex, OrganizationEdge>
> {
    static override readonly className = 'OrganizationSeries';
    static readonly type = 'organization' as const;

    override properties = new OrganizationSeriesProperties();

    private rootVertex?: Vertex<OrganizationVertex, OrganizationEdge>;

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super(ctx);
        this.cleanup.register(ctx.eventsHub.on('zoom:change-request', (event) => this.onZoomChangeRequest(event)));
    }

    createNetworkGraph() {
        return new OrganizationGraph();
    }

    createNetworkLayout() {
        return new NetworkTreeLayout<OrganizationVertex, OrganizationEdge>();
    }

    getRootVertices() {
        if (!this.rootVertex) return [];
        return (
            (this.graph.neighboursWithEdgeValue(this.rootVertex, 'child') as Vertex<
                OrganizationVertex,
                OrganizationEdge
            >[]) ?? []
        );
    }

    getFocusedVertex() {
        return undefined;
    }

    getDefaultFocusedVertices() {
        if (!this.rootVertex) return undefined;
        return this.graph.neighboursWithEdgeValue(this.rootVertex, 'child') as Vertex<
            OrganizationVertex,
            OrganizationEdge
        >[];
    }

    updateOffset(offset: Point) {
        this.dataNodeGroup.translationX = offset.x;
        this.dataNodeGroup.translationY = offset.y;

        this.linkGroup.translationX = offset.x;
        this.linkGroup.translationY = offset.y;
    }

    // Order matters: `applyNativePixelFloor` reads the post-clamp window mutated in-place by
    // `applyPanBoundaryClamp`.
    private onZoomChangeRequest(event: _ModuleSupport.ZoomChangeRequestEvent) {
        if (event.isReset) return;
        this.applyPanBoundaryClamp(event);
        this.applyNativePixelFloor(event);
    }

    // AG-17204: keep some of the zoom window inside `[0, 1]` so content stays visible.
    private applyPanBoundaryClamp(event: _ModuleSupport.ZoomChangeRequestEvent) {
        const clamped: _ModuleSupport.CoreZoomState = {};
        let didClamp = false;

        for (const id of strictObjectKeys(event.state)) {
            const entry = event.state[id];
            if (entry == null) continue;

            const { min, max, direction } = entry;
            const size = max - min;

            let clampedMin = min;
            let clampedMax = max;

            if (min >= 1) {
                clampedMax = 1;
                clampedMin = 1 - size;
                didClamp = true;
            } else if (max <= 0) {
                clampedMin = 0;
                clampedMax = size;
                didClamp = true;
            }

            // CoreZoomState wants the enum, not 'x'/'y' literals (runtime-equivalent).
            const coreDirection = direction === 'x' ? ChartAxisDirection.X : ChartAxisDirection.Y;
            clamped[id] = { min: clampedMin, max: clampedMax, direction: coreDirection };
        }

        if (didClamp) {
            event.constrainChanges(clamped);
        }
    }

    // Caps scale at native pixels (`s ≤ 1`) and projects off-isotropic states onto the
    // isotropic line `xRange/fitX = yRange/fitY` — less-zoomed axis wins, preserving content.
    private applyNativePixelFloor(event: _ModuleSupport.ZoomChangeRequestEvent) {
        const sMax = 1;
        const { seriesRect } = this;
        const contentBBox = this.layout.contentBBox;
        if (!seriesRect || !contentBBox || contentBBox.width <= 0 || contentBBox.height <= 0) return;

        const fitX = seriesRect.width / contentBBox.width;
        const fitY = seriesRect.height / contentBBox.height;

        let xId: AxisID | undefined;
        let yId: AxisID | undefined;
        for (const id of strictObjectKeys(event.state)) {
            const entry = event.state[id];
            if (entry == null) continue;
            if (entry.direction === 'x') xId = id;
            else yId = id;
        }
        if (!xId || !yId) return;

        const xEntry = event.state[xId]!;
        const yEntry = event.state[yId]!;
        const xRange = xEntry.max - xEntry.min;
        const yRange = yEntry.max - yEntry.min;
        if (xRange <= 0 || yRange <= 0) return;

        // Project to the isotropic line, then floor at sMax (t ≥ 1/sMax).
        const targetT = Math.max(xRange / fitX, yRange / fitY, 1 / sMax);
        const targetXRange = Math.min(1, targetT * fitX);
        const targetYRange = Math.min(1, targetT * fitY);

        const xMid = clampMid((xEntry.min + xEntry.max) / 2, targetXRange);
        const yMid = clampMid((yEntry.min + yEntry.max) / 2, targetYRange);

        const xChanged =
            Math.abs(xMid - targetXRange / 2 - xEntry.min) > ISOTROPY_EPSILON ||
            Math.abs(xMid + targetXRange / 2 - xEntry.max) > ISOTROPY_EPSILON;
        const yChanged =
            Math.abs(yMid - targetYRange / 2 - yEntry.min) > ISOTROPY_EPSILON ||
            Math.abs(yMid + targetYRange / 2 - yEntry.max) > ISOTROPY_EPSILON;

        if (xChanged || yChanged) {
            const constrained: _ModuleSupport.CoreZoomState = {};
            constrained[xId] = {
                min: xMid - targetXRange / 2,
                max: xMid + targetXRange / 2,
                direction: ChartAxisDirection.X,
            };
            constrained[yId] = {
                min: yMid - targetYRange / 2,
                max: yMid + targetYRange / 2,
                direction: ChartAxisDirection.Y,
            };
            event.constrainChanges(constrained);
        }
    }

    async processData(dataController: _ModuleSupport.DataController) {
        const { data } = this;
        if (data == null) return;

        this.layout.clear();

        const {
            idKey,
            parentIdKey,
            node: {
                image: { key: imageKey },
                title: { key: titleKey },
                subtitle: { key: subtitleKey },
                labels,
            },
        } = this.properties;

        const props = [
            keyProperty(idKey, undefined, { id: 'idValue' }),
            valueProperty(parentIdKey, undefined, { id: 'parentIdValue', allowNullKey: true }),
            valueProperty(imageKey, undefined, { id: 'imageValue', allowNullKey: true, missingValue: undefined }),
            valueProperty(titleKey, undefined, { id: 'titleValue', allowNullKey: true, missingValue: undefined }),
            valueProperty(subtitleKey, undefined, {
                id: 'subtitleValue',
                allowNullKey: true,
                missingValue: undefined,
            }),
        ];

        let index = 0;
        for (const label of labels) {
            props.push(
                valueProperty(label.key, undefined, {
                    id: `labelValue-${index}`,
                    allowNullKey: true,
                    missingValue: undefined,
                })
            );
            index++;
        }

        const { dataModel, processedData } = await dataController.request(this.id, data, { props });

        this.dataModel = dataModel;
        this.processedData = processedData;

        this.createGraphData();
        this.processPendingCollapse();
    }

    createNodeData() {
        const nodeData: OrganizationDatum[] = [];
        const linkData: OrganizationLinkDatum[] = [];

        this.vertexDatumIndex = {};

        if (this.rootVertex) {
            const vertices = this.graph.neighboursWithEdgeValue(this.rootVertex, 'child');
            if (vertices) {
                for (const vertex of vertices as Vertex<OrganizationVertex, OrganizationEdge>[]) {
                    linkData.push({ from: this.rootVertex, to: vertex });
                    this.createNodeDataFromVertex(nodeData, linkData, vertex);
                }
            }
        }

        return { itemId: this.id, nodeData, linkData, labelData: [] };
    }

    nodeFactory(): OrganizationNode {
        return new OrganizationNode();
    }

    hasItemStylers() {
        const { node, link, selection } = this.properties;
        return (
            selection.enabled ||
            node.itemStyler != null ||
            link.itemStyler != null ||
            node.title.itemStyler != null ||
            node.subtitle.itemStyler != null ||
            node.labels.some((label) => label.itemStyler != null)
        );
    }

    updateDatumSelection(
        nodeData: OrganizationDatum[],
        datumSelection: _ModuleSupport.Selection<OrganizationDatum, OrganizationNode>
    ) {
        datumSelection.update(nodeData);
    }

    updateDatumNodes(datumSelection: _ModuleSupport.Selection<OrganizationDatum, OrganizationNode>) {
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        datumSelection.each((node, datum) => {
            const datumIndex = this.graph.findNeighbourValue(datum.vertex, 'datumIndex') as number;
            const depth = this.graph.findNeighbourValue(datum.vertex, 'depth') as number;
            const descendantsCount = this.graph.findNeighbourValue(datum.vertex, 'descendants') as number;

            const isHighlight = highlightedDatum?.datumIndex === datum.datumIndex;
            const highlightState = this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex);
            // Only report `isCollapsed` for nodes whose descendants would actually be hidden;
            // a leaf id present in `collapsedManager` is a no-op visually and would mislead
            // styler consumers about the rendered tree state.
            const isCollapsed =
                descendantsCount > 0 && datum.itemId != null && this.ctx.collapsedManager.isCollapsed(datum.itemId);
            const styles = this.getNodeStyle(datumIndex, depth, isHighlight, highlightState, isCollapsed);

            const title = this.formatText(datum.datum.title, this.properties.node.title.formatter, datumIndex);
            const subtitle = this.formatText(datum.datum.subtitle, this.properties.node.subtitle.formatter, datumIndex);
            const labels = datum.datum.labels?.map((label, index) =>
                this.formatText(label, this.properties.node.labels[index]?.formatter, datumIndex)
            );

            node.update({ image: datum.datum.image, title, subtitle, labels }, descendantsCount, styles, isCollapsed);
        });
    }

    updateLinkNodes(
        linkSelection: _ModuleSupport.Selection<OrganizationLinkDatum, NetworkLinkNode<OrganizationLinkDatum>>
    ) {
        linkSelection.each((node, datum) => {
            const fromIndex = this.graph.findNeighbourValue(datum.from, 'datumIndex') as number;
            const toIndex = this.graph.findNeighbourValue(datum.to, 'datumIndex') as number;
            const styles = this.getLinkStyle(fromIndex, toIndex);

            node.update(styles);
        });
    }

    positionDatumNode(node: OrganizationNode, bbox: _ModuleSupport.BBox, regularBBox?: _ModuleSupport.BBox) {
        node.translationX = bbox.x;
        node.translationY = bbox.y;

        if (regularBBox) {
            node.updateBBox(regularBBox);
            node.realign(regularBBox);
        }
    }

    getLinkInterpolation(
        from: Vertex<OrganizationVertex, OrganizationEdge>,
        to: Vertex<OrganizationVertex, OrganizationEdge>
    ): NetworkLinkInterpolation {
        const fromIndex = this.graph.findNeighbourValue(from, 'datumIndex') as number;
        const toIndex = this.graph.findNeighbourValue(to, 'datumIndex') as number;
        const styles = this.getLinkStyle(fromIndex, toIndex);

        return { type: styles.interpolation.type, cornerRadius: styles.interpolation.cornerRadius };
    }

    expandNetworkToItem(itemIdOrIndex: string | number) {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return;

        const id = this.getItemId(itemIdOrIndex);
        if (id == null) return;

        let vertex = this.graph.findVertexById(id);
        if (!vertex) return;

        // Iterate up the parents until we reach the root node, which does not have a datumIndex, and expand the full
        // ancestry to ensure the active node is visible.
        const ids = [];
        const idValues = dataModel.resolveKeysById(this, 'idValue', processedData);
        while (
            (vertex = this.graph.findNeighbour(vertex, 'parent') as
                | Vertex<OrganizationVertex, OrganizationEdge>
                | undefined) != null
        ) {
            const datumIndex = this.graph.findNeighbourValue(vertex, 'datumIndex') as number | undefined;
            if (datumIndex == null) break;
            ids.push(idValues[datumIndex]);
        }

        this.expand(ids);
    }

    expandItem(itemIdOrIndex: string | number, _point: Point) {
        const id = this.getItemId(itemIdOrIndex);
        if (id == null) return;

        const vertex = this.graph.findVertexById(id);
        if (vertex == null) return;

        // const node = this.datumSelection.at(this.graph.findNeighbourValue(vertex, 'datumIndex') as number);
        // if (node == null || !node.expanderContainsPoint(point)) {
        //     return;
        // }

        this.ctx.collapsedManager.expand([id]);
    }

    collapseItem(itemIdOrIndex: string | number, _point: Point) {
        const id = this.getItemId(itemIdOrIndex);
        if (id == null) return;

        this.ctx.collapsedManager.collapseAppend([id]);
    }

    findNodeDatum(itemIdOrIndex: AgActiveItemState['itemId']): OrganizationDatum | undefined {
        if (typeof itemIdOrIndex === 'number') {
            return this.datumSelection.at(itemIdOrIndex)?.datum;
        }

        const vertex = this.graph.findVertexById(itemIdOrIndex);
        if (!vertex) return undefined;

        return this.createNodeDatumFromVertex(vertex);
    }

    override getTooltipContent(datumIndex: NetworkSeriesDatumIndex): _ModuleSupport.TooltipContent | undefined {
        const datum = this.processedData?.dataSources.get(this.id)?.data?.[datumIndex];
        if (datum == null) return;

        const nodeDatum = this.getDatumByDatumIndex(datumIndex);
        if (nodeDatum == null) return;

        return this.formatTooltipWithContext(
            this.properties.tooltip,
            { heading: nodeDatum.datum.title },
            {
                seriesId: this.id,
                datum: datum,
            }
        );
    }

    protected override makeLayoutUpdateOptions(): NetworkTreeLayoutUpdateOptions<OrganizationVertex, OrganizationEdge> {
        return {
            ...super.makeLayoutUpdateOptions(),
            nodeHeight: this.properties.node.height,
            nodeWidth: this.properties.node.width,
            nodeMaxHeight: this.properties.node.maxHeight,
            nodeMaxWidth: this.properties.node.maxWidth,
            expanderPillHeight: this.properties.expander.height,
            regularDimensions: true,
            hiddenOnCollapse: true,
            innerSpacing: this.properties.innerSpacing ?? 0,
            outerSpacing: this.properties.outerSpacing ?? 0,
            verticalSpacing: this.properties.verticalSpacing ?? 0,
        };
    }

    private createGraphData() {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return;

        this.graph.clear();
        this.rootVertex = this.graph.addVertex('root');

        const idValues = dataModel.resolveKeysById(this, 'idValue', processedData);
        const parentIdValues = dataModel.resolveColumnById(this, 'parentIdValue', processedData);
        const imageValues = dataModel.resolveColumnById(this, 'imageValue', processedData);
        const titleValues = dataModel.resolveColumnById(this, 'titleValue', processedData);
        const subtitleValues = dataModel.resolveColumnById(this, 'subtitleValue', processedData);

        const labelsValues = [];
        for (let i = 0; i < this.properties.node.labels.length; i++) {
            labelsValues.push(dataModel.resolveColumnById(this, `labelValue-${i}`, processedData));
        }

        // TODO: This is passing `any[]` in as the values, and the build fn then constrains the types without any safety.
        this.graph.build(
            idValues,
            parentIdValues,
            imageValues,
            titleValues,
            subtitleValues,
            labelsValues,
            this.rootVertex
        );

        this.graph.computeDescendants(this.getRootVertices());
    }

    private createNodeDataFromVertex(
        nodeData: OrganizationDatum[],
        linkData: OrganizationLinkDatum[],
        vertex: Vertex<OrganizationVertex, OrganizationEdge>,
        depth: number = 1
    ) {
        const nodeDatumIndex = nodeData.length;
        this.vertexDatumIndex[vertex.value as string] = nodeDatumIndex;

        this.graph.addEdge(vertex, this.graph.addVertex(depth), 'depth');

        const nodeDatum = this.createNodeDatumFromVertex(vertex);
        nodeData.push(nodeDatum);

        const children = this.graph.neighboursWithEdgeValue(vertex, 'child') as
            | Vertex<OrganizationVertex, OrganizationEdge>[]
            | undefined;
        if (!children) return;

        if (this.ctx.collapsedManager.isCollapsed(vertex.value as string)) {
            return;
        }

        for (const childVertex of children) {
            const linkDatum: OrganizationLinkDatum = {
                from: vertex,
                to: childVertex,
            };

            linkData.push(linkDatum);

            this.createNodeDataFromVertex(nodeData, linkData, childVertex, depth + 1);
        }
    }

    private formatText(
        text: TextOrSegments | undefined,
        formatter: Formatter<AgOrganizationNodeTextFormatterParams> | undefined,
        datumIndex: number | undefined
    ) {
        const { dataModel, processedData } = this;
        if (!formatter || !dataModel || !processedData || datumIndex == null) return text;

        return (
            this.callWithContext(
                formatter,
                this.makeNodeTextFormatterParams(dataModel, processedData, datumIndex, text)
            ) ?? text
        );
    }

    private createNodeDatumFromVertex(vertex: Vertex<OrganizationVertex, OrganizationEdge>): OrganizationDatum {
        return {
            series: this,
            datum: {
                image: this.graph.findNeighbourValue(vertex, 'image') as string | undefined,
                title: this.graph.findNeighbourValue(vertex, 'title') as string | undefined,
                subtitle: this.graph.findNeighbourValue(vertex, 'subtitle') as string | undefined,
                labels: this.graph.findNeighbourValue(vertex, 'labels') as string[] | undefined,
            },
            itemId: vertex.value as string,
            datumIndex: this.graph.findNeighbourValue(vertex, 'datumIndex') as number,
            vertex,
        };
    }

    private getLinkStyle(
        fromIndex: number | undefined,
        toIndex: number | undefined
    ): DeepRequired<AgOrganizationSeriesLinkStyle> {
        const { dataModel, processedData } = this;
        const { itemStyler: linkStyler } = this.properties.link;

        let style = this.getLinkDefaultStyle();

        if (linkStyler && dataModel && processedData && fromIndex != null && toIndex != null) {
            const overrides = this.cachedDatumCallback(
                _ModuleSupport.createDatumId(this.id, fromIndex, toIndex, 'link'),
                () => {
                    const params = this.makeLinkItemStylerParams(dataModel, processedData, fromIndex, toIndex, style);
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(linkStyler, params)
                    );
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, style);
            }
        }

        return style;
    }

    private getNodeStyle(
        datumIndex: number | undefined,
        depth: number,
        isHighlight: boolean,
        highlightState: _ModuleSupport.HighlightState | undefined,
        isCollapsed: boolean
    ): RequiredOrganizationNodeStyle {
        const { dataModel, processedData } = this;
        const { itemStyler } = this.properties.node;
        const { itemStyler: titleStyler } = this.properties.node.title;
        const { itemStyler: subtitleStyler } = this.properties.node.subtitle;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        const selectionStyle = this.getSelectionStyle(datumIndex);

        let style = mergeDefaults(selectionStyle, highlightStyle, this.getNodeDefaultStyle(), {
            title: this.getNodeTextDefaultStyle(this.properties.node.title),
            subtitle: this.getNodeTextDefaultStyle(this.properties.node.subtitle),
            labels: this.properties.node.labels.map((label) => this.getNodeTextDefaultStyle(label)),
            expander: { height: this.properties.expander.height, spacing: this.properties.expander.spacing },
        });

        if (itemStyler && dataModel && processedData && datumIndex != null) {
            const overrides = this.cachedDatumCallback(
                _ModuleSupport.createDatumId(this.id, datumIndex, 'node', isCollapsed),
                () => {
                    const params = this.makeNodeItemStylerParams(
                        dataModel,
                        processedData,
                        datumIndex,
                        depth,
                        highlightState,
                        isCollapsed,
                        style
                    );
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(itemStyler, params)
                    );
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, style);
            }
        }

        style.title = this.getNodeTextItemStylerStyle(
            titleStyler,
            style.title,
            'title',
            dataModel,
            processedData,
            datumIndex,
            depth,
            highlightState,
            isCollapsed
        );
        style.subtitle = this.getNodeTextItemStylerStyle(
            subtitleStyler,
            style.subtitle,
            'subtitle',
            dataModel,
            processedData,
            datumIndex,
            depth,
            highlightState,
            isCollapsed
        );

        let labelIndex = 0;
        for (const { itemStyler: labelStyler } of this.properties.node.labels) {
            style.labels[labelIndex] = this.getNodeTextItemStylerStyle(
                labelStyler,
                style.labels[labelIndex],
                _ModuleSupport.createDatumId('label', labelIndex),
                dataModel,
                processedData,
                datumIndex,
                depth,
                highlightState,
                isCollapsed
            );
            labelIndex++;
        }

        return style;
    }

    private getNodeDefaultStyle(): DeepRequired<AgOrganizationSeriesNodeStyle> {
        const {
            cornerRadius,
            fill,
            fillOpacity,
            height,
            image,
            lineDash,
            lineDashOffset,
            maxHeight,
            maxWidth,
            padding,
            stroke,
            strokeOpacity,
            strokeWidth,
            width,
        } = this.properties.node;
        return {
            cornerRadius,
            fill,
            fillOpacity,
            height: height ?? Number.NaN,
            image: {
                enabled: image.enabled,
                key: image.key,
                height: image.height,
                width: image.width,
                position: image.position,
                shape: image.shape,
                spacing: image.spacing,
            },
            lineDash,
            lineDashOffset: lineDashOffset ?? 0,
            maxHeight: maxHeight ?? Infinity,
            maxWidth: maxWidth ?? Infinity,
            padding,
            stroke,
            strokeOpacity,
            strokeWidth,
            width: width ?? Number.NaN,
        };
    }

    private getLinkDefaultStyle(): DeepRequired<AgOrganizationSeriesLinkStyle> {
        const { interpolation, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = this.properties.link;
        return {
            interpolation,
            lineDash,
            lineDashOffset: lineDashOffset ?? 0,
            stroke,
            strokeOpacity,
            strokeWidth,
        };
    }

    private getNodeTextDefaultStyle(props: OrganizationSeriesNodeTextProperties): RequiredOrganizationNodeTextStyle {
        return {
            color: props.color,
            enabled: props.enabled,
            fontFamily: props.fontFamily,
            fontSize: props.fontSize,
            fontStyle: props.fontStyle,
            fontWeight: props.fontWeight,
            overflowStrategy: props.overflowStrategy,
            spacing: props.spacing,
            textAlign: props.textAlign,
            wrapping: props.wrapping,
            fill: props.fill,
            fillOpacity: props.fillOpacity,
            stroke: props.stroke,
            strokeWidth: props.strokeWidth,
            strokeOpacity: props.strokeOpacity,
            cornerRadius: props.cornerRadius,
            padding: props.padding,
        };
    }

    private getNodeTextItemStylerStyle(
        styler:
            | Styler<AgOrganizationSeriesNodeTextStylerParams<unknown, unknown>, AgOrganizationSeriesNodeTextStyle>
            | undefined,
        style: RequiredOrganizationNodeTextStyle,
        datumIdSuffix: string,
        dataModel: _ModuleSupport.DataModel<any, any, any> | undefined,
        processedData: _ModuleSupport.ProcessedData<any> | undefined,
        datumIndex: number | undefined,
        depth: number,
        highlightState: _ModuleSupport.HighlightState | undefined,
        isCollapsed: boolean
    ) {
        if (!styler || !dataModel || !processedData || datumIndex == null) {
            return style;
        }

        const overrides = this.cachedDatumCallback(
            _ModuleSupport.createDatumId(this.id, datumIndex, datumIdSuffix, isCollapsed),
            () => {
                const params = this.makeNodeTextStylerParams(
                    dataModel,
                    processedData,
                    datumIndex,
                    depth,
                    highlightState,
                    isCollapsed,
                    style
                );
                return this.ctx.optionsGraphService.resolvePartial(
                    ['series', `${this.declarationOrder}`],
                    this.callWithContext(styler, params)
                );
            }
        );

        if (overrides) {
            style = mergeDefaults(overrides, style);
        }

        return style;
    }

    private makeLinkItemStylerParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        fromIndex: number,
        toIndex: number,
        style: Required<AgOrganizationSeriesLinkStyle>
    ): AgOrganizationSeriesLinkItemStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const fromDatum = processedData.dataSources.get(seriesId)?.data?.[fromIndex];
        const toDatum = processedData.dataSources.get(seriesId)?.data?.[toIndex];

        return {
            ...style,
            fromDatum,
            toDatum,
            seriesId,
            selectionState: 'unselected',
        } satisfies CallbackParamRules<AgOrganizationSeriesLinkItemStylerParams<unknown, unknown>>;
    }

    private makeNodeItemStylerParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        depth: number,
        highlightState: _ModuleSupport.HighlightState | undefined,
        isCollapsed: boolean,
        style: Required<AgOrganizationSeriesNodeStyle>
    ): AgOrganizationSeriesNodeItemStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...style,
            datum,
            depth,
            isCollapsed,
            seriesId,
            highlightState: highlightState == null ? 'none' : _ModuleSupport.toHighlightString(highlightState),
            selectionState: 'unselected',
        } satisfies CallbackParamRules<AgOrganizationSeriesNodeItemStylerParams<unknown, unknown>>;
    }

    private makeNodeTextStylerParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        depth: number,
        highlightState: _ModuleSupport.HighlightState | undefined,
        isCollapsed: boolean,
        style: RequiredOrganizationNodeTextStyle
    ): AgOrganizationSeriesNodeTextStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...style,
            datum,
            depth,
            isCollapsed,
            seriesId,
            highlightState: highlightState == null ? 'none' : _ModuleSupport.toHighlightString(highlightState),
            selectionState: 'unselected',
        } satisfies CallbackParamRules<AgOrganizationSeriesNodeTextStylerParams<unknown, unknown>>;
    }

    private makeNodeTextFormatterParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        value: any
    ): AgOrganizationNodeTextFormatterParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            datum,
            seriesId,
            value,
        } satisfies CallbackParamRules<AgOrganizationNodeTextFormatterParams<unknown, unknown>>;
    }

    private getItemId(itemIdOrIndex: string | number): string | undefined {
        if (typeof itemIdOrIndex === 'number') {
            return this.datumSelection.at(itemIdOrIndex)?.datum?.itemId;
        }
        return itemIdOrIndex;
    }

    private getDatumByDatumIndex(datumIndex: number) {
        const nodeDatumIndex = this.convertDatumIndexToNodeDatumIndex(datumIndex);
        if (nodeDatumIndex == null) return;

        return this.datumSelection.at(nodeDatumIndex)?.datum;
    }

    private convertDatumIndexToNodeDatumIndex(datumIndex: number) {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return;

        const idValues = dataModel.resolveKeysById(this, 'idValue', processedData);
        const vertex = this.graph.findVertexById(idValues[datumIndex]);
        if (!vertex) return;

        const nodeDatumIndex = this.vertexDatumIndex[vertex.value as string];
        if (nodeDatumIndex == null) return;

        return nodeDatumIndex;
    }
}
