import type { _ModuleSupport } from 'ag-charts-community';
import type { Vertex } from 'ag-charts-core';

import type { NetworkGraph } from './networkGraph';
import type { NetworkLinkInterpolation } from './networkSeries';

export abstract class NetworkLayout<TVertex, TEdge> {
    abstract update(
        graph: NetworkGraph<TVertex, TEdge>,
        vertices: Vertex<TVertex, TEdge>[],
        getDatumNodeBBox: (vertex: Vertex<TVertex, TEdge>) => _ModuleSupport.BBox | undefined,
        getLinkInterpolation: (from: Vertex<TVertex, TEdge>, to: Vertex<TVertex, TEdge>) => NetworkLinkInterpolation,
        layoutDatumNode: (vertex: Vertex<TVertex, TEdge>, groupBBox: _ModuleSupport.BBox) => void,
        layoutLinkNode: (
            vertex: Vertex<TVertex, TEdge>,
            drawLink: (path: _ModuleSupport.ExtendedPath2D) => void
        ) => void
    ): void;
}
