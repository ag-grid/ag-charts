import { _ModuleSupport } from 'ag-charts-community';
import { Property, Vertex } from 'ag-charts-core';

import { AbstractNetworkSeries, type NetworkSeriesDatum, NetworkSeriesProperties } from '../network/networkSeries';
import { CHILD_EDGE, type OrganisationEdge, OrganisationGraph, type OrganisationVertex } from './organisationGraph';

const { keyProperty, valueProperty } = _ModuleSupport;

class OrganisationSeriesProperties extends NetworkSeriesProperties {
    @Property
    idKey: string = 'id';

    @Property
    parentIdKey: string = 'parentId';
}

interface OrganisationSeriesDatum extends NetworkSeriesDatum<OrganisationVertex, OrganisationEdge> {}

/**
 *
 */
export class OrganisationSeries extends AbstractNetworkSeries<
    OrganisationVertex,
    OrganisationEdge,
    OrganisationGraph,
    _ModuleSupport.Rect
> {
    override properties = new OrganisationSeriesProperties();

    private rootVertex?: Vertex<OrganisationVertex, OrganisationEdge>;

    createNetworkGraph() {
        return new OrganisationGraph();
    }

    async processData(dataController: _ModuleSupport.DataController) {
        const { data } = this;
        if (data == null) return;

        const { idKey, parentIdKey } = this.properties;

        const { dataModel, processedData } = await dataController.request(this.id, data, {
            props: [
                keyProperty(idKey, undefined, { id: 'idValue' }),
                valueProperty(parentIdKey, undefined, { id: 'parentIdValue', allowNullKey: true }),
            ],
        });

        this.dataModel = dataModel;
        this.processedData = processedData;

        this.createGraphData();
    }

    createNodeData() {
        const nodeData: OrganisationSeriesDatum[] = [];

        if (this.rootVertex) {
            this.createNodeDataFromVertex(nodeData, this.rootVertex);
        }

        console.log(nodeData);

        return { itemId: this.id, nodeData, labelData: [] };
    }

    nodeFactory() {
        return new _ModuleSupport.Rect();
    }

    updateDatumNodes(
        datumSelection: _ModuleSupport.Selection<
            _ModuleSupport.Rect,
            NetworkSeriesDatum<OrganisationVertex, OrganisationEdge>
        >
    ) {
        console.log('OrganisationSeries.updateDatumNodes()', datumSelection.length);
        datumSelection.each((node, datum) => {
            console.log(node, datum);
        });
    }

    private createGraphData() {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return;

        this.graph.clear();
        this.rootVertex = this.graph.addVertex('root');

        const idValues = dataModel.resolveKeysById(this, 'idValue', processedData);
        const parentIdValues = dataModel.resolveColumnById(this, 'parentIdValue', processedData);

        this.graph.buildFromIds(idValues, parentIdValues, this.rootVertex);
    }

    private createNodeDataFromVertex(
        nodeData: OrganisationSeriesDatum[],
        vertex: Vertex<OrganisationVertex, OrganisationEdge>
    ) {
        const vertices = this.graph.neighboursWithEdgeValue(vertex, CHILD_EDGE);
        if (!vertices) return;

        for (const childVertex of vertices) {
            const nodeDatum: OrganisationSeriesDatum = {
                series: this,
                datum: {},
                datumIndex: nodeData.length,
                vertex: childVertex as Vertex<OrganisationVertex, OrganisationEdge>,
            };

            nodeData.push(nodeDatum);
        }
    }
}
