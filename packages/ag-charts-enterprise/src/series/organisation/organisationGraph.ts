import { Vertex } from 'ag-charts-core';

import { NetworkGraph } from '../network/networkGraph';

export interface OrganisationVertex {
    image?: string;
    title?: string;
    subtitle?: string;
    labels?: string[];
}

export type OrganisationEdge = 'child' | 'parent';

// The descendent edge from parent to child.
const CHILD_EDGE = 'child';

// The ancestor edge from child to parent.
const PARENT_EDGE = 'parent';

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

    /**
     * Append a child to a parent with it's bidirectional descendent and ancestor edges.
     */
    addChild(parent: Vertex<OrganisationVertex, OrganisationEdge>, childData: OrganisationVertex) {
        const child = this.addVertex(childData);
        this.addEdge(parent, child, CHILD_EDGE);
        this.addEdge(child, parent, PARENT_EDGE);

        return child;
    }
}
