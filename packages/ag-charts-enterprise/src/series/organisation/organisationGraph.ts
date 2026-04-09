import { Vertex } from 'ag-charts-core';

import { NetworkGraph } from '../network/networkGraph';

export type OrganisationVertex = string | string[] | number;

export type OrganisationEdge =
    | 'datumIndex'

    // The descendent edge from parent to child.
    | 'child'

    // The ancestor edge from child to parent.
    | 'parent'

    //
    | 'title'

    //
    | 'subtitle'

    //
    | 'labels';

/**
 *
 */
export class OrganisationGraph extends NetworkGraph<OrganisationVertex, OrganisationEdge> {
    constructor() {
        super({
            // Cache the child edges for optimal descendent traversal.
            cachedNeighboursEdge: 'child',

            singleValueEdges: new Set([
                'datumIndex',
                'parent', // Each child only has one parent in an Organisation graph.
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
        root: Vertex<OrganisationVertex, OrganisationEdge>
    ) {
        const verticesById: Record<string, Vertex<OrganisationVertex, OrganisationEdge>> = {};
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
        parent: Vertex<OrganisationVertex, OrganisationEdge>,
        child: Vertex<OrganisationVertex, OrganisationEdge>
    ) {
        this.addEdge(parent, child, 'child');
        this.addEdge(child, parent, 'parent');
    }
}
