import { _ModuleSupport } from 'ag-charts-community';
import type { Vertex } from 'ag-charts-core';

import type { NetworkGraph } from './networkGraph';
import { NetworkLayout } from './networkLayout';

export class NetworkTreeLayout extends NetworkLayout {
    constructor(
        private readonly verticalPadding = 40,
        // private readonly outerPadding = 0,
        private readonly innerPadding = 10
    ) {
        super();
    }

    update(
        graph: NetworkGraph<any, any>,
        vertices: Vertex<any, any>[],
        getDatumNodeBBox: (vertex: Vertex<any, any>) => _ModuleSupport.BBox | undefined,
        layoutDatumNode: (vertex: Vertex<any, any>, groupBBox: _ModuleSupport.BBox) => void,
        layoutLinkNode: (
            vertex: Vertex<any, any>,
            parentBBox: _ModuleSupport.BBox,
            childBBox: _ModuleSupport.BBox
        ) => void
    ) {
        this.updateChildren(graph, vertices, getDatumNodeBBox, layoutDatumNode, layoutLinkNode);

        // TODO: use `containerBBox` for global positioning of the network
    }

    private updateChildren(
        graph: NetworkGraph<any, any>,
        vertices: Vertex<any, any>[],
        getDatumNodeBBox: (vertex: Vertex<any, any>) => _ModuleSupport.BBox | undefined,
        layoutDatumNode: (vertex: Vertex<any, any>, groupBBox: _ModuleSupport.BBox) => void,
        layoutLinkNode: (
            vertex: Vertex<any, any>,
            parentBBox: _ModuleSupport.BBox,
            childBBox: _ModuleSupport.BBox
        ) => void,
        groupBBox?: _ModuleSupport.BBox
    ): {
        containerBBox: _ModuleSupport.BBox;
        childrenBBoxes: { vertex: Vertex<any, any>; bbox: _ModuleSupport.BBox }[];
    } {
        const layoutBBoxes = [];

        groupBBox ??= new _ModuleSupport.BBox(0, 0, 0, 0);

        let index = -1;
        for (const vertex of vertices) {
            index++;

            const datumBBox = getDatumNodeBBox(vertex);

            let childrenContainerBBox: _ModuleSupport.BBox | undefined;
            let childrenBBoxes: { vertex: Vertex<any, any>; bbox: _ModuleSupport.BBox }[] | undefined;

            const children = graph.neighboursWithEdgeValue(vertex, 'child');
            if (children) {
                const childrenGroupBBox = new _ModuleSupport.BBox(
                    groupBBox.x,
                    groupBBox.y,
                    groupBBox.width,
                    groupBBox.height
                );
                if (datumBBox) childrenGroupBBox.y += datumBBox.height + this.verticalPadding;

                const { containerBBox, childrenBBoxes: bboxes } = this.updateChildren(
                    graph,
                    children,
                    getDatumNodeBBox,
                    layoutDatumNode,
                    layoutLinkNode,
                    childrenGroupBBox
                );
                childrenContainerBBox = containerBBox;
                childrenBBoxes = bboxes;
            }

            // Root node ...
            if (!datumBBox) {
                if (childrenContainerBBox) groupBBox = childrenContainerBBox;
                continue;
            }

            let x = groupBBox.x + groupBBox.width;

            if (childrenContainerBBox) {
                x += (childrenContainerBBox.width - groupBBox.width) / 2;
                x -= datumBBox.width / 2;
            }

            const layoutBBox = new _ModuleSupport.BBox(x, groupBBox.y, datumBBox.width, datumBBox.height);
            layoutBBoxes.push({ vertex, bbox: layoutBBox });

            layoutDatumNode(vertex, layoutBBox);

            if (childrenContainerBBox) {
                groupBBox = _ModuleSupport.BBox.merge([groupBBox, childrenContainerBBox, layoutBBox]);
            } else {
                groupBBox = _ModuleSupport.BBox.merge([groupBBox, layoutBBox]);
            }

            if (index < vertices.length - 1) {
                groupBBox.width += this.innerPadding;
            }

            if (childrenBBoxes) {
                for (const { vertex: childVertex, bbox } of childrenBBoxes) {
                    layoutLinkNode(childVertex, layoutBBox, bbox);
                }
            }
        }

        // groupBBox.width += this.outerPadding;

        return { containerBBox: groupBBox, childrenBBoxes: layoutBBoxes };
    }
}
