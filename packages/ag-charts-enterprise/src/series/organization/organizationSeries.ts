import { type CssColor, type FillOptions, type StrokeOptions, _ModuleSupport } from 'ag-charts-community';
import { type FontOptions, Vertex } from 'ag-charts-core';

import {
    AbstractNetworkSeries,
    type NetworkLinkDatum,
    type NetworkLinkNode,
    type NetworkSeriesDatum,
} from '../network/networkSeries';
import { NetworkTreeLayout } from '../network/networkTreeLayout';
import { type OrganizationEdge, OrganizationGraph, type OrganizationVertex } from './organizationGraph';
import { OrganizationSeriesProperties } from './organizationSeriesProperties';

const { keyProperty, valueProperty } = _ModuleSupport;

interface OrganizationDatum extends NetworkSeriesDatum<OrganizationVertex, OrganizationEdge> {
    datum: { title?: string; subtitle?: string; labels?: string[] };
}

type OrganizationNode = _ModuleSupport.TranslatableGroup;

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
    NetworkTreeLayout<OrganizationVertex, OrganizationEdge>
> {
    static override readonly className = 'OrganizationSeries';
    static readonly type = 'organization' as const;

    override properties = new OrganizationSeriesProperties((interpolation) => {
        this.layout.interpolation = interpolation;
    });

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

        if (this.rootVertex) {
            const vertices = this.graph.neighboursWithEdgeValue(this.rootVertex, 'child');
            if (vertices) {
                for (const vertex of vertices) {
                    this.createNodeDataFromVertex(nodeData, vertex as Vertex<OrganizationVertex, OrganizationEdge>);
                }
            }
        }

        return { itemId: this.id, nodeData, labelData: [] };
    }

    nodeFactory(): OrganizationNode {
        return new _ModuleSupport.TranslatableGroup();
    }

    updateDatumSelection(
        nodeData: OrganizationDatum[],
        datumSelection: _ModuleSupport.Selection<OrganizationNode, OrganizationDatum>
    ) {
        datumSelection.update(nodeData);
    }

    updateDatumNodes(datumSelection: _ModuleSupport.Selection<OrganizationNode, OrganizationDatum>) {
        const padding = 20;

        const { node: nodeProps } = this.properties;
        const { title, subtitle, labels } = this.properties.node;

        datumSelection.each((node, datum) => {
            const children = node.children();

            const shapeNode =
                (children.next().value as _ModuleSupport.Rect) ?? node.appendChild(new _ModuleSupport.Rect());
            shapeNode.cornerRadius = nodeProps.cornerRadius;
            applyFillStyles(shapeNode, nodeProps);
            applyStrokeStyles(shapeNode, nodeProps);

            const childNodes = [];
            let y = padding;

            if (datum.datum.title) {
                const titleNode =
                    (children.next().value as _ModuleSupport.Text) ?? node.appendChild(new _ModuleSupport.Text());
                childNodes.push(titleNode);

                titleNode.text = datum.datum.title;
                titleNode.x = padding;
                titleNode.y = y;
                applyTextStyles(titleNode, title);

                y += titleNode.getBBox().height + title.spacing;
            }

            if (datum.datum.subtitle) {
                const subtitleNode =
                    (children.next().value as _ModuleSupport.Text) ?? node.appendChild(new _ModuleSupport.Text());
                childNodes.push(subtitleNode);

                subtitleNode.text = datum.datum.subtitle;
                subtitleNode.x = padding;
                subtitleNode.y = y;
                applyTextStyles(subtitleNode, subtitle);

                y += subtitleNode.getBBox().height + subtitle.spacing;
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
                    applyTextStyles(labelNode, labels[index]);

                    y += labelNode.getBBox().height + labels[index].spacing;

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

    updateLinkNodes(linkSelection: _ModuleSupport.Selection<NetworkLinkNode, NetworkLinkDatum>) {
        const { link } = this.properties;

        linkSelection.each((node) => {
            const path =
                (node.children().next().value as _ModuleSupport.Text) ?? node.appendChild(new _ModuleSupport.Path());
            path.visible = false;
            path.fill = 'transparent';
            applyStrokeStyles(path, link);
        });
    }

    positionDatumNode(node: OrganizationNode, bbox: _ModuleSupport.BBox) {
        node.translationX = bbox.x;
        node.translationY = bbox.y;
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
        vertex: Vertex<OrganizationVertex, OrganizationEdge>
    ) {
        // This `datumIndex` does _not_ correlate with the index within the `data` array.
        const datumIndex = nodeData.length;
        this.graph.removeEdges(vertex, 'datumIndex');
        this.graph.addEdge(vertex, this.graph.addVertex(datumIndex), 'datumIndex');

        const bbox = _ModuleSupport.BBox.zero.clone();
        const nodeDatum: OrganizationDatum = {
            series: this,
            datum: {
                title: this.graph.findNeighbourValue(vertex, 'title') as string,
                subtitle: this.graph.findNeighbourValue(vertex, 'subtitle') as string,
                labels: this.graph.findNeighbourValue(vertex, 'labels') as string[],
            },
            datumIndex,
            vertex,
            bbox,
        };

        nodeData.push(nodeDatum);

        const vertices = this.graph.neighboursWithEdgeValue(vertex, 'child');
        if (!vertices) return;

        for (const childVertex of vertices) {
            this.createNodeDataFromVertex(nodeData, childVertex as Vertex<OrganizationVertex, OrganizationEdge>);
        }
    }
}
