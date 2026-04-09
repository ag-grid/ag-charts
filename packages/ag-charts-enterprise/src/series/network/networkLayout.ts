import type { _ModuleSupport } from 'ag-charts-community';
import type { Vertex } from 'ag-charts-core';

import type { NetworkGraph } from './networkGraph';

export abstract class NetworkLayout {
    abstract update(
        graph: NetworkGraph<any, any>,
        vertices: Vertex<any, any>[],
        getDatumNodeBBox: (vertex: Vertex<any, any>) => _ModuleSupport.BBox | undefined,
        layoutDatumNode: (vertex: Vertex<any, any>, groupBBox: _ModuleSupport.BBox) => void,
        layoutLinkNode: (
            vertex: Vertex<any, any>,
            parentBBox: _ModuleSupport.BBox,
            childBBox: _ModuleSupport.BBox
        ) => void
    ): void;
}
