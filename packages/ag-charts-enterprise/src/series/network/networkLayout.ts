import type { _ModuleSupport } from 'ag-charts-community';
import type { Vertex } from 'ag-charts-core';

import type { NetworkGraph } from './networkGraph';

export abstract class NetworkLayout<TVertex, TEdge> {
    abstract update(
        graph: NetworkGraph<TVertex, TEdge>,
        vertices: Vertex<TVertex, TEdge>[],
        getDatumNodeBBox: (vertex: Vertex<TVertex, TEdge>) => _ModuleSupport.BBox | undefined,
        layoutDatumNode: (vertex: Vertex<TVertex, TEdge>, groupBBox: _ModuleSupport.BBox) => void,
        layoutLinkNode: (
            vertex: Vertex<TVertex, TEdge>,
            parentBBox: _ModuleSupport.BBox,
            childBBox: _ModuleSupport.BBox
        ) => void
    ): void;
}
