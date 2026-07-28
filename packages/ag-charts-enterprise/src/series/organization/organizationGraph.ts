import { type Logger, Vertex } from 'ag-charts-core';

import { NetworkGraph } from '../network/networkGraph';
import type { OrganizationEdge, OrganizationVertex } from './organizationTypes';

export class OrganizationGraph extends NetworkGraph<OrganizationVertex, OrganizationEdge> {
    private verticesById: Record<string, Vertex<OrganizationVertex, OrganizationEdge>> = {};

    constructor(private readonly logger: Logger) {
        super({
            // Cache the child edges for optimal descendent traversal.
            cachedNeighboursEdge: 'child',

            singleValueEdges: new Set([
                'datumIndex',
                'parent', // Each child only has one parent in an Organization graph.
                'depth',
                'image',
                'title',
                'subtitle',
                'labels',
            ]),
        });
    }

    build(
        idValues: string[],
        parentIdValues: (string | undefined)[],
        imageValues: (string | undefined)[],
        titleValues: (string | undefined)[],
        subtitleValues: (string | undefined)[],
        labelsValues: (string[] | undefined)[],
        root: Vertex<OrganizationVertex, OrganizationEdge>
    ) {
        this.verticesById = {};

        let index = 0;
        for (const id of idValues) {
            const vertex = this.addVertex(id);

            if (imageValues[index] != null) {
                this.addEdge(vertex, this.addVertex(imageValues[index] as string), 'image');
            }
            if (titleValues[index] != null) {
                this.addEdge(vertex, this.addVertex(titleValues[index] as string), 'title');
            }
            if (subtitleValues[index] != null) {
                this.addEdge(vertex, this.addVertex(subtitleValues[index] as string), 'subtitle');
            }
            // Keep undefined slots — filtering shifts values out of sync with `labels[i]` styles.
            const labels = labelsValues.map((ls) => ls?.[index]);
            this.addEdge(vertex, this.addVertex(labels), 'labels');
            this.addEdge(vertex, this.addVertex(index), 'datumIndex');

            this.verticesById[id] = vertex;

            index++;
        }

        index = 0;

        for (const parentId of parentIdValues) {
            const childId = idValues[index];
            const childVertex = this.verticesById[childId];

            if (childVertex == null) {
                // throw an error?
                return;
            }

            if (parentId == null) {
                this.attachChild(root, childVertex);
                index++;
                continue;
            }

            const parentVertex = this.verticesById[parentId];
            if (!parentVertex) {
                this.logger.warnOnce(`Could not find parentId [${parentId}] on node [${childId}], skipping.`);
                return;
            }

            this.attachChild(parentVertex, childVertex);

            index++;
        }
    }

    computeDescendants(vertices: Vertex<OrganizationVertex, OrganizationEdge>[]) {
        let totalDescendants = vertices.length;

        for (const vertex of vertices) {
            const children = this.neighboursWithEdgeValue(vertex, 'child') as
                | Vertex<OrganizationVertex, OrganizationEdge>[]
                | undefined;
            const descendants = children ? this.computeDescendants(children) : 0;
            totalDescendants += descendants;
            this.addEdge(vertex, this.addVertex(descendants), 'descendants');
        }

        return totalDescendants;
    }

    findVertexById(id: string | number): Vertex<OrganizationVertex, OrganizationEdge> | undefined {
        return this.verticesById[id];
    }

    *vertices(): Generator<Vertex<OrganizationVertex, OrganizationEdge>, void, undefined> {
        for (const vertex of Object.values(this.verticesById)) {
            yield vertex;
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
