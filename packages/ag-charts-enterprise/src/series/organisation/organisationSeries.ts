import { _ModuleSupport } from 'ag-charts-community';
import { Vertex } from 'ag-charts-core';

import {
    AbstractNetworkSeries,
    type NetworkLinkDatum,
    type NetworkLinkNode,
    type NetworkSeriesDatum,
} from '../network/networkSeries';
import { NetworkTreeLayout } from '../network/networkTreeLayout';
import { type OrganisationEdge, OrganisationGraph, type OrganisationVertex } from './organisationGraph';
import { OrganisationSeriesProperties } from './organisationSeriesProperties';

const { keyProperty, valueProperty } = _ModuleSupport;

interface OrganisationDatum extends NetworkSeriesDatum<OrganisationVertex, OrganisationEdge> {
    datum: { title?: string; subtitle?: string; labels?: string[] };
}

type OrganisationNode = _ModuleSupport.TranslatableGroup;

/**
 *
 */
export class OrganisationSeries extends AbstractNetworkSeries<
    OrganisationVertex,
    OrganisationEdge,
    OrganisationGraph,
    OrganisationNode,
    OrganisationDatum,
    NetworkTreeLayout
> {
    override properties = new OrganisationSeriesProperties();

    private rootVertex?: Vertex<OrganisationVertex, OrganisationEdge>;

    createNetworkGraph() {
        return new OrganisationGraph();
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
            },
        } = this.properties;

        const { dataModel, processedData } = await dataController.request(this.id, data, {
            props: [
                keyProperty(idKey, undefined, { id: 'idValue' }),
                valueProperty(parentIdKey, undefined, { id: 'parentIdValue', allowNullKey: true }),
                valueProperty(titleKey, undefined, { id: 'titleValue', allowNullKey: true, missingValue: undefined }),
                valueProperty(subtitleKey, undefined, {
                    id: 'subtitleValue',
                    allowNullKey: true,
                    missingValue: undefined,
                }),
                // valueProperty(labelsKey, undefined, { id: 'labelsValue', allowNullKey: true, missingValue: undefined }),
            ],
        });

        this.dataModel = dataModel;
        this.processedData = processedData;

        this.createGraphData();
    }

    createNodeData() {
        const nodeData: OrganisationDatum[] = [];

        if (this.rootVertex) {
            const vertices = this.graph.neighboursWithEdgeValue(this.rootVertex, 'child');
            if (vertices) {
                for (const vertex of vertices) {
                    this.createNodeDataFromVertex(nodeData, vertex as Vertex<OrganisationVertex, OrganisationEdge>);
                }
            }
        }

        return { itemId: this.id, nodeData, labelData: [] };
    }

    nodeFactory(): OrganisationNode {
        return new _ModuleSupport.TranslatableGroup();
    }

    updateDatumSelection(
        nodeData: OrganisationDatum[],
        datumSelection: _ModuleSupport.Selection<OrganisationNode, OrganisationDatum>
    ) {
        datumSelection.update(nodeData);
    }

    updateDatumNodes(datumSelection: _ModuleSupport.Selection<OrganisationNode, OrganisationDatum>) {
        const padding = 20;

        const { node: nodeProps } = this.properties;
        const { title, subtitle } = this.properties.node;

        datumSelection.each((node, datum) => {
            const shapeNode = new _ModuleSupport.Rect();
            node.appendChild(shapeNode);
            shapeNode.fill = nodeProps.fill;
            shapeNode.stroke = nodeProps.stroke;
            shapeNode.strokeWidth = nodeProps.strokeWidth;
            shapeNode.cornerRadius = nodeProps.cornerRadius;

            let y = padding;

            const titleNode = new _ModuleSupport.Text();
            node.appendChild(titleNode);
            titleNode.text = datum.datum.title;
            titleNode.fontSize = title.fontSize;
            titleNode.fontWeight = title.fontWeight;
            titleNode.textAlign = 'left';
            titleNode.textBaseline = 'top';
            titleNode.x = padding;
            titleNode.y = y;

            const subtitleNode = new _ModuleSupport.Text();
            node.appendChild(subtitleNode);
            subtitleNode.text = datum.datum.subtitle;
            subtitleNode.fontSize = 12;
            subtitleNode.fontWeight = 'normal';
            subtitleNode.textAlign = 'left';
            subtitleNode.textBaseline = 'top';
            subtitleNode.x = padding;
            subtitleNode.y = y += titleNode.getBBox().height + title.spacing;

            const labelNode = new _ModuleSupport.Text();
            node.appendChild(labelNode);
            labelNode.text = 'London HQ';
            labelNode.fontSize = 11;
            labelNode.fontWeight = 'normal';
            labelNode.textAlign = 'left';
            labelNode.textBaseline = 'top';
            labelNode.x = padding;
            labelNode.y = y += subtitleNode.getBBox().height + subtitle.spacing;

            const bbox = _ModuleSupport.Group.computeChildrenBBox([titleNode, subtitleNode, labelNode]).grow(padding);

            // shapeNode.x = 0;
            // shapeNode.y = 0;
            // shapeNode.width = width;
            // shapeNode.height = height;

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

    positionDatumNode(node: OrganisationNode, bbox: _ModuleSupport.BBox) {
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
        // const labelsValues = dataModel.resolveColumnById(this, 'labelsValue', processedData);

        console.log(idValues, parentIdValues, titleValues, subtitleValues);

        // TODO: This is passing `any[]` in as the values, and the build fn then constrains the types without any safety.
        this.graph.build(idValues, parentIdValues, titleValues, subtitleValues, [], this.rootVertex);
    }

    private createNodeDataFromVertex(
        nodeData: OrganisationDatum[],
        vertex: Vertex<OrganisationVertex, OrganisationEdge>
    ) {
        const datumIndex = nodeData.length;
        this.graph.addEdge(vertex, this.graph.addVertex(datumIndex), 'datumIndex');

        const bbox = _ModuleSupport.BBox.zero.clone();
        const nodeDatum: OrganisationDatum = {
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
            this.createNodeDataFromVertex(nodeData, childVertex as Vertex<OrganisationVertex, OrganisationEdge>);
        }
    }
}
