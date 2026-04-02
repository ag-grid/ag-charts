import { Vertex } from 'ag-charts-core';

import { NetworkGraph } from '../network/networkGraph';

// export interface OrganisationVertex {
//     image?: string;
//     title?: string;
//     subtitle?: string;
//     labels?: string[];
// }

export type OrganisationVertex = string;

export type OrganisationEdge = 'child' | 'parent';

// The descendent edge from parent to child.
export const CHILD_EDGE = 'child';

// The ancestor edge from child to parent.
export const PARENT_EDGE = 'parent';

/**
 *
 */
export class OrganisationGraph extends NetworkGraph<OrganisationVertex, OrganisationEdge> {
    constructor() {
        super({
            // Cache the child edges for optimal descendent traversal.
            cachedNeighboursEdge: CHILD_EDGE,

            // Each child only has one parent in an Organisation graph.
            singleValueEdges: new Set([PARENT_EDGE]),
        });
    }

    buildFromIds(
        idValues: string[],
        parentIdValues: (string | undefined)[],
        root: Vertex<OrganisationVertex, OrganisationEdge>
    ) {
        const verticesById: Record<string, Vertex<OrganisationVertex, OrganisationEdge>> = {};
        let index = 0;
        for (const parentId of parentIdValues) {
            const childId = idValues[index];

            if (parentId != null) verticesById[parentId] ??= this.addVertex(parentId);
            verticesById[childId] ??= this.addVertex(childId);
            this.attachChild(parentId == null ? root : verticesById[parentId] ?? root, verticesById[childId]);

            index++;
        }
    }

    attachChild(
        parent: Vertex<OrganisationVertex, OrganisationEdge>,
        child: Vertex<OrganisationVertex, OrganisationEdge>
    ) {
        this.addEdge(parent, child, CHILD_EDGE);
        this.addEdge(child, parent, PARENT_EDGE);
    }
}
