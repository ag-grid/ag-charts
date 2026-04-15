import {
    type AgOrganizationSeriesLinkItemStylerParams,
    type AgOrganizationSeriesLinkStyle,
    type AgOrganizationSeriesNodeItemStylerParams,
    type AgOrganizationSeriesNodeStyle,
    type AgOrganizationSeriesNodeTextStyle,
    type AgOrganizationSeriesNodeTextStylerParams,
    type CssColor,
    type FillOptions,
    type StrokeOptions,
    type Styler,
    _ModuleSupport,
} from 'ag-charts-community';
import { type CallbackParamRules, type DeepRequired, type FontOptions, Vertex, mergeDefaults } from 'ag-charts-core';

import {
    AbstractNetworkSeries,
    type NetworkLinkNode,
    type NetworkSeriesDatum,
    type NetworkSeriesLinkDatum,
} from '../network/networkSeries';
import { NetworkTreeLayout } from '../network/networkTreeLayout';
import type { NetworkLinkInterpolation } from '../network/networkTypes';
import { type OrganizationEdge, OrganizationGraph, type OrganizationVertex } from './organizationGraph';
import { OrganizationSeriesNodeTextProperties, OrganizationSeriesProperties } from './organizationSeriesProperties';

const { keyProperty, valueProperty } = _ModuleSupport;

interface OrganizationDatum extends NetworkSeriesDatum<OrganizationVertex, OrganizationEdge> {
    datum: { title?: string; subtitle?: string; labels?: string[] };
    nodeDatumIndex: number;
}

type OrganizationNode = _ModuleSupport.TranslatableGroup<OrganizationDatum>;
type OrganizationLinkDatum = NetworkSeriesLinkDatum<OrganizationVertex, OrganizationEdge>;
type OrganizationLinkNode = NetworkLinkNode<OrganizationVertex, OrganizationEdge>;

function applyFillStyles(node: _ModuleSupport.Shape, styles: FillOptions) {
    node.fill = styles.fill;
    node.fillOpacity = styles.fillOpacity ?? 1;
}

function applyStrokeStyles(
    node: _ModuleSupport.Shape,
    styles: StrokeOptions & { lineDash?: number[]; lineDashOffset?: number }
) {
    node.lineDash = styles.lineDash;
    node.lineDashOffset = styles.lineDashOffset ?? 0;
    node.stroke = styles.stroke;
    node.strokeOpacity = styles.strokeOpacity ?? 1;
    node.strokeWidth = styles.strokeWidth ?? 0;
}

function applyTextStyles(node: _ModuleSupport.Text, styles: FontOptions & { color: CssColor }) {
    node.fill = styles.color;
    node.fontFamily = styles.fontFamily;
    node.fontSize = styles.fontSize;
    node.fontStyle = styles.fontStyle;
    node.fontWeight = styles.fontWeight;
    node.textAlign = 'left';
    node.textBaseline = 'top';
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

    createNetworkGraph() {
        return new OrganizationGraph();
    }

    createNetworkLayout() {
        return new NetworkTreeLayout<OrganizationVertex, OrganizationEdge>();
    }

    getRootVertices() {
        if (!this.rootVertex) return [];
        return [this.rootVertex];
    }

    async processData(dataController: _ModuleSupport.DataController) {
        const { data } = this;
        if (data == null) return;

        const {
            idKey,
            parentIdKey,
            node: {
                title: { key: titleKey },
                subtitle: { key: subtitleKey },
                labels,
            },
        } = this.properties;

        const props = [
            keyProperty(idKey, undefined, { id: 'idValue' }),
            valueProperty(parentIdKey, undefined, { id: 'parentIdValue', allowNullKey: true }),
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
    }

    createNodeData() {
        const nodeData: OrganizationDatum[] = [];
        const linkData: OrganizationLinkDatum[] = [];

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
        return new _ModuleSupport.TranslatableGroup();
    }

    updateDatumSelection(
        nodeData: OrganizationDatum[],
        datumSelection: _ModuleSupport.Selection<OrganizationDatum, OrganizationNode>
    ) {
        datumSelection.update(nodeData);
    }

    updateDatumNodes(datumSelection: _ModuleSupport.Selection<OrganizationDatum, OrganizationNode>) {
        const padding = 20;

        datumSelection.each((node, datum) => {
            const children = node.children();
            const datumIndex = this.graph.findNeighbourValue(datum.vertex, 'datumIndex') as number;
            const depth = this.graph.findNeighbourValue(datum.vertex, 'depth') as number;
            const styles = this.getNodeStyle(datumIndex, depth, false, undefined);

            const shapeNode =
                (children.next().value as _ModuleSupport.Rect) ?? node.appendChild(new _ModuleSupport.Rect());
            shapeNode.cornerRadius = styles.cornerRadius;
            applyFillStyles(shapeNode, styles);
            applyStrokeStyles(shapeNode, styles);

            const childNodes = [];
            let y = padding;

            if (datum.datum.title) {
                const titleNode =
                    (children.next().value as _ModuleSupport.Text) ?? node.appendChild(new _ModuleSupport.Text());
                childNodes.push(titleNode);

                titleNode.text = datum.datum.title;
                titleNode.x = padding;
                titleNode.y = y;
                applyTextStyles(titleNode, styles.title);

                y += titleNode.getBBox().height + styles.title.spacing;
            }

            if (datum.datum.subtitle) {
                const subtitleNode =
                    (children.next().value as _ModuleSupport.Text) ?? node.appendChild(new _ModuleSupport.Text());
                childNodes.push(subtitleNode);

                subtitleNode.text = datum.datum.subtitle;
                subtitleNode.x = padding;
                subtitleNode.y = y;
                applyTextStyles(subtitleNode, styles.subtitle);

                y += subtitleNode.getBBox().height + styles.subtitle.spacing;
            }

            if (datum.datum.labels) {
                let index = 0;
                for (const labelText of datum.datum.labels) {
                    const labelNode =
                        (children.next().value as _ModuleSupport.Text) ?? node.appendChild(new _ModuleSupport.Text());
                    childNodes.push(labelNode);

                    labelNode.text = labelText;
                    labelNode.x = padding;
                    labelNode.y = y;
                    applyTextStyles(labelNode, styles.labels[index]);

                    y += labelNode.getBBox().height + styles.labels[index].spacing;

                    index++;
                }
            }

            const bbox = _ModuleSupport.Group.computeChildrenBBox(childNodes).grow(padding);

            shapeNode.x = 0;
            shapeNode.y = 0;
            shapeNode.width = bbox.width;
            shapeNode.height = bbox.height;
        });
    }

    updateLinkNodes(linkSelection: _ModuleSupport.Selection<OrganizationLinkDatum, OrganizationLinkNode>) {
        linkSelection.each((node, datum) => {
            const fromIndex = this.graph.findNeighbourValue(datum.from, 'datumIndex') as number;
            const toIndex = this.graph.findNeighbourValue(datum.to, 'datumIndex') as number;
            const styles = this.getLinkStyle(fromIndex, toIndex);

            const path =
                (node.children().next().value as _ModuleSupport.Text) ?? node.appendChild(new _ModuleSupport.Path());
            path.visible = false;
            path.fill = 'transparent';
            applyStrokeStyles(path, styles);
        });
    }

    positionDatumNode(node: OrganizationNode, bbox: _ModuleSupport.BBox) {
        node.translationX = bbox.x;
        node.translationY = bbox.y;
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

    private createGraphData() {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return;

        this.graph.clear();
        this.rootVertex = this.graph.addVertex('root');

        const idValues = dataModel.resolveKeysById(this, 'idValue', processedData);
        const parentIdValues = dataModel.resolveColumnById(this, 'parentIdValue', processedData);
        const titleValues = dataModel.resolveColumnById(this, 'titleValue', processedData);
        const subtitleValues = dataModel.resolveColumnById(this, 'subtitleValue', processedData);

        const labelsValues = [];
        for (let i = 0; i < this.properties.node.labels.length; i++) {
            labelsValues.push(dataModel.resolveColumnById(this, `labelValue-${i}`, processedData));
        }

        // TODO: This is passing `any[]` in as the values, and the build fn then constrains the types without any safety.
        this.graph.build(idValues, parentIdValues, titleValues, subtitleValues, labelsValues, this.rootVertex);
    }

    private createNodeDataFromVertex(
        nodeData: OrganizationDatum[],
        linkData: OrganizationLinkDatum[],
        vertex: Vertex<OrganizationVertex, OrganizationEdge>,
        depth: number = 1
    ) {
        const nodeDatumIndex = nodeData.length;
        this.graph.removeEdges(vertex, 'nodeDatumIndex');
        this.graph.addEdge(vertex, this.graph.addVertex(nodeDatumIndex), 'nodeDatumIndex');
        this.graph.addEdge(vertex, this.graph.addVertex(depth), 'depth');

        const bbox = _ModuleSupport.BBox.zero.clone();
        const nodeDatum: OrganizationDatum = {
            series: this,
            datum: {
                title: this.graph.findNeighbourValue(vertex, 'title') as string,
                subtitle: this.graph.findNeighbourValue(vertex, 'subtitle') as string,
                labels: this.graph.findNeighbourValue(vertex, 'labels') as string[],
            },
            datumIndex: this.graph.findNeighbourValue(vertex, 'datumIndex') as number,
            nodeDatumIndex,
            vertex,
            bbox,
        };

        nodeData.push(nodeDatum);

        const vertices = this.graph.neighboursWithEdgeValue(vertex, 'child');
        if (!vertices) return;

        for (const childVertex of vertices as Vertex<OrganizationVertex, OrganizationEdge>[]) {
            const linkDatum: OrganizationLinkDatum = {
                from: vertex,
                to: childVertex,
            };

            linkData.push(linkDatum);

            this.createNodeDataFromVertex(nodeData, linkData, childVertex, depth + 1);
        }
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
    ): DeepRequired<
        AgOrganizationSeriesNodeStyle & {
            title: AgOrganizationSeriesNodeTextStyle;
            subtitle: AgOrganizationSeriesNodeTextStyle;
            labels: AgOrganizationSeriesNodeTextStyle[];
        }
    > {
        const { dataModel, processedData } = this;
        const { itemStyler } = this.properties.node;
        const { itemStyler: titleStyler } = this.properties.node.title;
        const { itemStyler: subtitleStyler } = this.properties.node.subtitle;

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
                        // isHighlight,
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
            depth
        );
        style.subtitle = this.getNodeTextItemStylerStyle(
            subtitleStyler,
            style.subtitle,
            'subtitle',
            dataModel,
            processedData,
            datumIndex,
            depth
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
                depth
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
            lineDash,
            lineDashOffset,
            maxHeight,
            maxWidth,
            stroke,
            strokeOpacity,
            strokeWidth,
        } = this.properties.node;
        return {
            cornerRadius,
            fill,
            fillOpacity,
            lineDash,
            lineDashOffset: lineDashOffset ?? 0,
            maxHeight: maxHeight ?? Infinity,
            maxWidth: maxWidth ?? Infinity,
            stroke,
            strokeOpacity,
            strokeWidth,
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
        depth: number
    ) {
        if (!styler || !dataModel || !processedData || datumIndex == null) {
            return style;
        }

        const overrides = this.cachedDatumCallback(
            _ModuleSupport.createDatumId(this.id, datumIndex, datumIdSuffix),
            () => {
                const params = this.makeNodeTextStylerParams(dataModel, processedData, datumIndex, depth, style);
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
        } satisfies CallbackParamRules<AgOrganizationSeriesLinkItemStylerParams<unknown, unknown>>;
    }

    private makeNodeItemStylerParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        depth: number,
        style: Required<AgOrganizationSeriesNodeStyle>
    ): AgOrganizationSeriesNodeItemStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...style,
            datum,
            depth,
            seriesId,
            highlightState: 'none',
            selectionState: 'unselected',
        } satisfies CallbackParamRules<AgOrganizationSeriesNodeItemStylerParams<unknown, unknown>>;
    }

    private makeNodeTextStylerParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        depth: number,
        style: Required<AgOrganizationSeriesNodeTextStyle>
    ): AgOrganizationSeriesNodeTextStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...style,
            datum,
            depth,
            seriesId,
            highlightState: 'none',
            selectionState: 'unselected',
        } satisfies CallbackParamRules<AgOrganizationSeriesNodeTextStylerParams<unknown, unknown>>;
    }
}
