import { _ModuleSupport } from 'ag-charts-community';
import { Vertex } from 'ag-charts-core';

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

/**
 *
 */
export class OrganizationSeries extends AbstractNetworkSeries<
    OrganizationVertex,
    OrganizationEdge,
    OrganizationGraph,
    OrganizationNode,
    OrganizationDatum,
    NetworkTreeLayout
> {
    override properties = new OrganizationSeriesProperties();

    private rootVertex?: Vertex<OrganizationVertex, OrganizationEdge>;

    createNetworkGraph() {
        return new OrganizationGraph();
    }

    createNetworkLayout() {
        return new NetworkTreeLayout();
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
            const shapeNode = new _ModuleSupport.Rect();
            node.appendChild(shapeNode);
            shapeNode.fill = nodeProps.fill;
            shapeNode.stroke = nodeProps.stroke;
            shapeNode.strokeWidth = nodeProps.strokeWidth;
            shapeNode.cornerRadius = nodeProps.cornerRadius;

            const childNodes = [];
            let y = padding;

            if (datum.datum.title) {
                const titleNode = new _ModuleSupport.Text();
                node.appendChild(titleNode);
                childNodes.push(titleNode);

                titleNode.text = datum.datum.title;
                titleNode.fontSize = title.fontSize;
                titleNode.fontWeight = title.fontWeight;
                titleNode.textAlign = 'left';
                titleNode.textBaseline = 'top';
                titleNode.x = padding;
                titleNode.y = y;

                y += titleNode.getBBox().height + title.spacing;
            }

            if (datum.datum.subtitle) {
                const subtitleNode = new _ModuleSupport.Text();
                node.appendChild(subtitleNode);
                childNodes.push(subtitleNode);

                subtitleNode.text = datum.datum.subtitle;
                subtitleNode.fontSize = subtitle.fontSize;
                subtitleNode.fontWeight = subtitle.fontWeight;
                subtitleNode.textAlign = 'left';
                subtitleNode.textBaseline = 'top';
                subtitleNode.x = padding;
                subtitleNode.y = y;

                y += subtitleNode.getBBox().height + subtitle.spacing;
            }

            if (datum.datum.labels) {
                let index = 0;
                for (const labelText of datum.datum.labels) {
                    const labelNode = new _ModuleSupport.Text();
                    node.appendChild(labelNode);
                    childNodes.push(labelNode);

                    labelNode.text = labelText;
                    labelNode.fontSize = labels[index].fontSize;
                    labelNode.fontWeight = labels[index].fontWeight;
                    labelNode.textAlign = 'left';
                    labelNode.textBaseline = 'top';
                    labelNode.x = padding;
                    labelNode.y = y;

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
        linkSelection.each((node) => {
            const path = new _ModuleSupport.Path();
            path.visible = false;

            path.fill = 'transparent';
            path.stroke = '#999';
            path.strokeWidth = 2;

            node.appendChild(path);
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
        const datumIndex = nodeData.length;
        this.graph.addEdge(vertex, this.graph.addVertex(datumIndex), 'datumIndex');

        const bbox = _ModuleSupport.BBox.zero.clone();
        const nodeDatum: OrganizationDatum = {
            series: this,
            datum: {
                title: this.graph.findNeighbourValue(vertex, 'title') as any,
                subtitle: this.graph.findNeighbourValue(vertex, 'subtitle') as any,
                labels: this.graph.findNeighbourValue(vertex, 'labels') as any,
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
