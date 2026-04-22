import { Graph, Vertex } from 'ag-charts-core';

export abstract class NetworkGraph<TVertex, TEdge> extends Graph<TVertex, TEdge> {
    abstract vertices(): Generator<Vertex<TVertex, TEdge>, void, undefined>;
}
