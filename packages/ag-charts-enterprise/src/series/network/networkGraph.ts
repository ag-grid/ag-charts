import { Graph, Vertex } from 'ag-charts-core';

export abstract class NetworkGraph<TVertex, TEdge> extends Graph<TVertex, TEdge> {
    abstract findVertexById(id: string | number): Vertex<TVertex, TEdge> | undefined;
    abstract vertices(): Generator<Vertex<TVertex, TEdge>, void, undefined>;
}
