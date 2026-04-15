import { Vertex } from 'ag-charts-core';

import { NetworkGraph } from '../network/networkGraph';

export type OrganizationVertex = string | string[] | number;

export type OrganizationEdge =
    | 'datumIndex' // The index of the datum within the series' data array.
    | 'nodeDatumIndex' // The index of the datum within the series' nodeData array.
    | 'child' // The descending edge from parent to child.
    | 'parent' // The ascending edge from child to parent.
    | 'depth'
    | 'title'
    | 'subtitle'
    | 'labels';

export class OrganizationGraph extends NetworkGraph<OrganizationVertex, OrganizationEdge> {
    constructor() {
        super({
            // Cache the child edges for optimal descendent traversal.
            cachedNeighboursEdge: 'child',

            singleValueEdges: new Set([
                'datumIndex',
                'nodeDatumIndex',
                'parent', // Each child only has one parent in an Organization graph.
                'title',
                'subtitle',
                'labels',
            ]),
        });
    }

    build(
        idValues: string[],
        parentIdValues: (string | undefined)[],
        titleValues: (string | undefined)[],
        subtitleValues: (string | undefined)[],
        labelsValues: (string[] | undefined)[],
        root: Vertex<OrganizationVertex, OrganizationEdge>
    ) {
        const verticesById: Record<string, Vertex<OrganizationVertex, OrganizationEdge>> = {};
        let index = 0;
        for (const id of idValues) {
            const vertex = this.addVertex(id);

            if (titleValues[index] != null) {
                this.addEdge(vertex, this.addVertex(titleValues[index] as string), 'title');
            }
            if (subtitleValues[index] != null) {
                this.addEdge(vertex, this.addVertex(subtitleValues[index] as string), 'subtitle');
            }
            const labels = labelsValues.map((ls) => ls?.[index]).filter(Boolean) as string[];
            this.addEdge(vertex, this.addVertex(labels), 'labels');
            this.addEdge(vertex, this.addVertex(index), 'datumIndex');

            verticesById[id] = vertex;

            index++;
        }

        index = 0;

        for (const parentId of parentIdValues) {
            const childId = idValues[index];
            const childVertex = verticesById[childId];

            if (childVertex == null) {
                // throw an error?
                return;
            }

            if (parentId == null) {
                this.attachChild(root, childVertex);
                index++;
                continue;
            }

            const parentVertex = verticesById[parentId];
            if (!parentVertex) {
                // throw an error?
                return;
            }

            this.attachChild(parentVertex, childVertex);

            index++;
        }
    }

    private attachChild(
        parent: Vertex<OrganizationVertex, OrganizationEdge>,
        child: Vertex<OrganizationVertex, OrganizationEdge>
    ) {
        this.addEdge(parent, child, 'child');
        this.addEdge(child, parent, 'parent');
    }
}
