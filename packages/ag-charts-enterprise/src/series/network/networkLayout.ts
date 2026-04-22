import { _ModuleSupport } from 'ag-charts-community';
import type { Point, Vertex } from 'ag-charts-core';

import type { NetworkGraph } from './networkGraph';
import type { NetworkLinkInterpolation } from './networkTypes';

export interface NetworkLayoutUpdateOptions<TVertex, TEdge> {
    height: number;
    width: number;
    regularDimensions: boolean;
    hiddenOnCollapse: boolean;
    offset: Point;
    graph: NetworkGraph<TVertex, TEdge>;
    vertices: Vertex<TVertex, TEdge>[];
    getDatumNodeBBox: (vertex: Vertex<TVertex, TEdge>) => _ModuleSupport.BBox | undefined;
    getLinkInterpolation: (from: Vertex<TVertex, TEdge>, to: Vertex<TVertex, TEdge>) => NetworkLinkInterpolation;
    getFocusedVertex: () => Vertex<TVertex, TEdge> | undefined;
    getDefaultFocusedVertices: () => Vertex<TVertex, TEdge>[] | undefined;
    layoutDatumNode: (
        vertex: Vertex<TVertex, TEdge>,
        groupBBox: _ModuleSupport.BBox,
        regularBBox?: _ModuleSupport.BBox
    ) => void;
    layoutLinkNode: (vertex: Vertex<TVertex, TEdge>, drawLink: (path: _ModuleSupport.ExtendedPath2D) => void) => void;
    updateOffset: (offset: Point) => void;
}

export abstract class NetworkLayout<TVertex, TEdge> {
    protected regularBBox?: _ModuleSupport.BBox;

    private readonly maxRegularDimensionsCount = 1000;

    abstract update(options: NetworkLayoutUpdateOptions<TVertex, TEdge>): void;

    protected calculateRegularDimensions(options: NetworkLayoutUpdateOptions<TVertex, TEdge>) {
        // Only calculate this once, to prevent it from changing when nodes are collapsed / expanded.
        if (this.regularBBox) return;

        let regularDimensionsCount = 0;
        let maxHeight = 0;
        let maxWidth = 0;

        for (const vertex of options.graph.vertices()) {
            const bbox = options.getDatumNodeBBox(vertex);
            if (!bbox) continue;

            maxHeight = Math.max(maxHeight, bbox.height);
            maxWidth = Math.max(maxWidth, bbox.width);

            regularDimensionsCount++;
            if (regularDimensionsCount >= this.maxRegularDimensionsCount) break;
        }

        if (maxWidth > 0 && maxHeight > 0) {
            this.regularBBox = new _ModuleSupport.BBox(0, 0, maxWidth, maxHeight);
        }
    }
}
