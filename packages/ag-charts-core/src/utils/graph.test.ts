import { describe, expect, it } from '@jest/globals';

import { AdjacencyListGraph } from './graph';

describe('AdjacencyListGraph', () => {
    it('should add vertices and edges', () => {
        const graph = new AdjacencyListGraph<number>();
        const v1 = graph.addVertex(1);
        const v2 = graph.addVertex(2);
        graph.addEdge(v1, v2, undefined);

        expect(graph.adjacent(v1, v2)).toBe(true);
        expect([...graph.neighbours(v1)].map((v) => graph.getVertexValue(v))).toEqual([2]);

        // Edges are directional, so v2 has no neighbours in the edge direction
        expect(graph.adjacent(v2, v1)).toBe(false);
        expect([...graph.neighbours(v2)].map((v) => graph.getVertexValue(v))).toEqual([]);

        // expect(graph.density()).toBe(0.5);
    });
});
