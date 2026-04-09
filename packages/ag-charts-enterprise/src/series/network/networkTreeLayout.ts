import { _ModuleSupport } from 'ag-charts-community';
import type { Vertex } from 'ag-charts-core';

import type { NetworkGraph } from './networkGraph';
import { NetworkLayout } from './networkLayout';

export class NetworkTreeLayout extends NetworkLayout {
    constructor(
        private readonly verticalPadding = 40,
        private readonly outerPadding = 0,
        private readonly innerPadding = 10
    ) {
        super();
    }

    update(
        graph: NetworkGraph<any, any>,
        vertices: Vertex<any, any>[],
        getDatumNodeBBox: (vertex: Vertex<any, any>) => _ModuleSupport.BBox | undefined,
        layoutDatumNode: (vertex: Vertex<any, any>, groupBBox: _ModuleSupport.BBox) => void
    ) {
        const bbox = this.updateChildren(graph, vertices, getDatumNodeBBox, layoutDatumNode);
    }

    private updateChildren(
        graph: NetworkGraph<any, any>,
        vertices: Vertex<any, any>[],
        getDatumNodeBBox: (vertex: Vertex<any, any>) => _ModuleSupport.BBox | undefined,
        layoutDatumNode: (vertex: Vertex<any, any>, groupBBox: _ModuleSupport.BBox) => void,
        groupBBox?: _ModuleSupport.BBox
    ): _ModuleSupport.BBox {
        const start = new _ModuleSupport.BBox(200, 200, 0, 0);

        groupBBox ??= start;

        let index = -1;
        for (const vertex of vertices) {
            index++;

            const datumBBox = getDatumNodeBBox(vertex);

            let childrenBBox: _ModuleSupport.BBox | undefined;

            const children = graph.neighboursWithEdgeValue(vertex, 'child');
            if (children) {
                const childrenGroupBBox = datumBBox
                    ? new _ModuleSupport.BBox(
                          groupBBox.x,
                          groupBBox.y + datumBBox.height + this.verticalPadding,
                          groupBBox.width,
                          groupBBox.height
                      )
                    : new _ModuleSupport.BBox(groupBBox.x, groupBBox.y, groupBBox.width, groupBBox.height);
                childrenBBox = this.updateChildren(
                    graph,
                    children,
                    getDatumNodeBBox,
                    layoutDatumNode,
                    childrenGroupBBox
                );
            }

            if (!datumBBox) {
                if (childrenBBox) groupBBox = childrenBBox;
                continue;
            }

            let x = groupBBox.x + groupBBox.width;

            if (childrenBBox) {
                x += (childrenBBox.width - groupBBox.width) / 2;
                x -= datumBBox.width / 2;
            }

            const layoutBBox = new _ModuleSupport.BBox(x, groupBBox.y, datumBBox.width, datumBBox.height);

            layoutDatumNode(vertex, layoutBBox);

            if (childrenBBox) {
                groupBBox = _ModuleSupport.BBox.merge([groupBBox, childrenBBox, layoutBBox]);
            } else {
                groupBBox = _ModuleSupport.BBox.merge([groupBBox, layoutBBox]);
            }

            if (index < vertices.length - 1) {
                groupBBox.width += this.innerPadding;
            }
        }

        // groupBBox.width += this.outerPadding;

        return groupBBox;
    }
}
