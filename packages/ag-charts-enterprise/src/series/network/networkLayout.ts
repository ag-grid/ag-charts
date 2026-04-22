import type { _ModuleSupport } from 'ag-charts-community';
import type { Point, Vertex } from 'ag-charts-core';

import type { NetworkGraph } from './networkGraph';
import type { NetworkLinkInterpolation } from './networkTypes';

export interface NetworkLayoutUpdateOptions<TVertex, TEdge> {
    height: number;
    width: number;
    offset: Point;
    graph: NetworkGraph<TVertex, TEdge>;
    vertices: Vertex<TVertex, TEdge>[];
    getDatumNodeBBox: (vertex: Vertex<TVertex, TEdge>) => _ModuleSupport.BBox | undefined;
    getLinkInterpolation: (from: Vertex<TVertex, TEdge>, to: Vertex<TVertex, TEdge>) => NetworkLinkInterpolation;
    getFocusedVertex: () => Vertex<TVertex, TEdge> | undefined;
    getDefaultFocusedVertices: () => Vertex<TVertex, TEdge>[] | undefined;
    layoutDatumNode: (vertex: Vertex<TVertex, TEdge>, groupBBox: _ModuleSupport.BBox) => void;
    layoutLinkNode: (vertex: Vertex<TVertex, TEdge>, drawLink: (path: _ModuleSupport.ExtendedPath2D) => void) => void;
    updateOffset: (offset: Point) => void;
}

export abstract class NetworkLayout<TVertex, TEdge> {
    abstract update(options: NetworkLayoutUpdateOptions<TVertex, TEdge>): void;
}
