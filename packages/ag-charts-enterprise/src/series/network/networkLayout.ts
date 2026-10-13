import type { ExtendedPath2D, Vertex } from 'ag-charts-core';
import { BBox } from 'ag-charts-core';

import type { NetworkGraph } from './networkGraph';
import type { NetworkLinkInterpolation } from './networkTypes';

export interface NetworkLayoutUpdateOptions<TVertex, TEdge> {
    height: number;
    width: number;
    graph: NetworkGraph<TVertex, TEdge>;
    vertices: Vertex<TVertex, TEdge>[];
    getDatumNodeBBox: (vertex: Vertex<TVertex, TEdge>) => BBox | undefined;
    getLinkInterpolation: (from: Vertex<TVertex, TEdge>, to: Vertex<TVertex, TEdge>) => NetworkLinkInterpolation;
    layoutDatumNode: (vertex: Vertex<TVertex, TEdge>, groupBBox: BBox, regularBBox?: BBox) => BBox | undefined;
    layoutLinkNode: (vertex: Vertex<TVertex, TEdge>, drawLink: (path: ExtendedPath2D) => void) => void;
    isVertexCollapsed: (vertex: Vertex<TVertex, TEdge>) => boolean;
}

export abstract class NetworkLayout<TVertex, TEdge> {
    protected contentBBox?: BBox;
    protected regularBBox?: BBox;

    private readonly maxRegularDimensionsCount = 1000;

    abstract update(options: NetworkLayoutUpdateOptions<TVertex, TEdge>): void;
    abstract getNodeBBox(vertex: Vertex<TVertex, TEdge>): BBox | undefined;

    getContentBBox(): BBox | undefined {
        return this.contentBBox;
    }

    clear() {
        this.regularBBox = undefined;
        this.contentBBox = undefined;
    }

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
            this.regularBBox = new BBox(0, 0, maxWidth, maxHeight);
        }
    }
}
