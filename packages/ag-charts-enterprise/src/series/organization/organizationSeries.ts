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
import { type CallbackParamRules, type DeepRequired, type Point, Vertex, mergeDefaults } from 'ag-charts-core';

import { NetworkLinkNode } from '../network/networkLinkNode';
import { AbstractNetworkSeries, type NetworkSeriesDatumIndex } from '../network/networkSeries';
import { NetworkTreeLayout } from '../network/networkTreeLayout';
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
} from './organizationTypes';

const { keyProperty, valueProperty } = _ModuleSupport;

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
        const { node, link } = this.properties;
        return (
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

            const isHighlight = highlightedDatum?.datumIndex === datum.datumIndex;
            const highlightState = this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex);
            const styles = this.getNodeStyle(datumIndex, depth, isHighlight, highlightState);

            const title = this.formatText(datum.datum.title, this.properties.node.title.formatter, datumIndex);
            const subtitle = this.formatText(datum.datum.subtitle, this.properties.node.subtitle.formatter, datumIndex);
            const labels = datum.datum.labels?.map((label, index) =>
                this.formatText(label, this.properties.node.labels[index]?.formatter, datumIndex)
            );

            node.update({ image: datum.datum.image, title, subtitle, labels }, styles);
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

    expandItem(itemIdOrIndex: string | number) {
        const id = this.getItemId(itemIdOrIndex);
        if (id == null) return;

        this.ctx.collapsedManager.expand([id]);
    }

    collapseItem(itemIdOrIndex: string | number) {
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
        highlightState?: _ModuleSupport.HighlightState
    ): RequiredOrganizationNodeStyle {
        const { dataModel, processedData } = this;
        const { itemStyler } = this.properties.node;
        const { itemStyler: titleStyler } = this.properties.node.title;
        const { itemStyler: subtitleStyler } = this.properties.node.subtitle;

        // TODO: AG-17010 MVP does not include default highlight styles
        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);

        let style = mergeDefaults(highlightStyle, this.getNodeDefaultStyle(), {
            title: this.getNodeTextDefaultStyle(this.properties.node.title),
            subtitle: this.getNodeTextDefaultStyle(this.properties.node.subtitle),
            labels: this.properties.node.labels.map((label) => this.getNodeTextDefaultStyle(label)),
        });

        if (itemStyler && dataModel && processedData && datumIndex != null) {
            const overrides = this.cachedDatumCallback(
                _ModuleSupport.createDatumId(this.id, datumIndex, 'node'),
                () => {
                    const params = this.makeNodeItemStylerParams(
                        dataModel,
                        processedData,
                        datumIndex,
                        depth,
                        highlightState,
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
            highlightState
        );
        style.subtitle = this.getNodeTextItemStylerStyle(
            subtitleStyler,
            style.subtitle,
            'subtitle',
            dataModel,
            processedData,
            datumIndex,
            depth,
            highlightState
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
                highlightState
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
            height: height ?? NaN,
            image: {
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
            width: width ?? NaN,
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

    private getNodeTextDefaultStyle(
        props: OrganizationSeriesNodeTextProperties
    ): DeepRequired<AgOrganizationSeriesNodeTextStyle> {
        const { color, overflowStrategy, spacing, wrapping, fontFamily, fontSize, fontStyle, fontWeight } = props;
        return {
            color,
            overflowStrategy,
            spacing,
            wrapping,
            fontFamily,
            fontSize,
            fontStyle,
            fontWeight,
        };
    }

    private getNodeTextItemStylerStyle(
        styler:
            | Styler<AgOrganizationSeriesNodeTextStylerParams<unknown, unknown>, AgOrganizationSeriesNodeTextStyle>
            | undefined,
        style: DeepRequired<AgOrganizationSeriesNodeTextStyle>,
        datumIdSuffix: string,
        dataModel: _ModuleSupport.DataModel<any, any, any> | undefined,
        processedData: _ModuleSupport.ProcessedData<any> | undefined,
        datumIndex: number | undefined,
        depth: number,
        highlightState: _ModuleSupport.HighlightState | undefined
    ) {
        if (!styler || !dataModel || !processedData || datumIndex == null) {
            return style;
        }

        const overrides = this.cachedDatumCallback(
            _ModuleSupport.createDatumId(this.id, datumIndex, datumIdSuffix),
            () => {
                const params = this.makeNodeTextStylerParams(
                    dataModel,
                    processedData,
                    datumIndex,
                    depth,
                    highlightState,
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
            highlightState: 'none',
            selectionState: 'unselected',
        } satisfies CallbackParamRules<AgOrganizationSeriesLinkItemStylerParams<unknown, unknown>>;
    }

    private makeNodeItemStylerParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        depth: number,
        highlightState: _ModuleSupport.HighlightState | undefined,
        style: Required<AgOrganizationSeriesNodeStyle>
    ): AgOrganizationSeriesNodeItemStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...style,
            datum,
            depth,
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
        style: Required<AgOrganizationSeriesNodeTextStyle>
    ): AgOrganizationSeriesNodeTextStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...style,
            datum,
            depth,
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
