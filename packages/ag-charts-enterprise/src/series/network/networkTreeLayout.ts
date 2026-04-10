import { _ModuleSupport } from 'ag-charts-community';
import type { Vertex } from 'ag-charts-core';

import type { NetworkGraph } from './networkGraph';
import { NetworkLayout } from './networkLayout';

type TBBox = _ModuleSupport.BBox;
const { BBox } = _ModuleSupport;

export class NetworkTreeLayout extends NetworkLayout {
    constructor(
        private readonly verticalPadding = 40,
        private readonly outerPadding = 10,
        private readonly innerPadding = 10
    ) {
        super();
    }

    update(
        graph: NetworkGraph<any, any>,
        vertices: Vertex<any, any>[],
        getDatumNodeBBox: (vertex: Vertex<any, any>) => TBBox | undefined,
        layoutDatumNode: (vertex: Vertex<any, any>, groupBBox: TBBox) => void,
        layoutLinkNode: (vertex: Vertex<any, any>, parentBBox: TBBox, childBBox: TBBox) => void
    ) {
        this.updateChildren(graph, vertices, getDatumNodeBBox, layoutDatumNode, layoutLinkNode);

        // TODO: use `containerBBox` for global positioning of the network
    }

    private updateChildren(
        graph: NetworkGraph<any, any>,
        vertices: Vertex<any, any>[],
        getDatumNodeBBox: (vertex: Vertex<any, any>) => TBBox | undefined,
        layoutDatumNode: (vertex: Vertex<any, any>, groupBBox: TBBox) => void,
        layoutLinkNode: (vertex: Vertex<any, any>, parentBBox: TBBox, childBBox: TBBox) => void,
        groupBBox: TBBox = new BBox(0, 0, 0, 0)
    ): {
        containerBBox: TBBox;
        childrenBBoxes: { vertex: Vertex<any, any>; bbox: TBBox }[];
    } {
        const layoutBBoxes = [];

        // Iterate through the sibling vertices calculating their layout positions.
        let index = -1;
        for (const vertex of vertices) {
            index++;

            const nodeBBox = getDatumNodeBBox(vertex);

            // Layout children before their parent so that the parent can be aligned to match the children.
            const { descendentsContainerBBox, childrenBBoxes, mergedChildrenBBoxes } = this.findAndUpdateChildren(
                graph,
                vertex,
                getDatumNodeBBox,
                layoutDatumNode,
                layoutLinkNode,
                groupBBox,
                nodeBBox
            );

            // When the node has no bbox, set the group to be just the descendents. This should only occur for the
            // non-rendered root node.
            if (!nodeBBox) {
                if (descendentsContainerBBox) groupBBox = descendentsContainerBBox;
                continue;
            }

            const x = mergedChildrenBBoxes
                ? // When a node has children, align it centred to those immediate children, but not all descendents.
                  mergedChildrenBBoxes.x + mergedChildrenBBoxes.width / 2 - nodeBBox.width / 2
                : // Otherwise justify the node to the left against its siblings.
                  groupBBox.x + groupBBox.width;

            const layoutBBox = new BBox(x, groupBBox.y, nodeBBox.width, nodeBBox.height);
            layoutBBoxes.push({ vertex, bbox: layoutBBox });

            // Request the series to layout the node per the calculated bbox.
            layoutDatumNode(vertex, layoutBBox);

            // Merge the bboxes into the group.
            if (descendentsContainerBBox) {
                groupBBox = BBox.merge([groupBBox, descendentsContainerBBox, layoutBBox]);
            } else {
                groupBBox = BBox.merge([groupBBox, layoutBBox]);
            }

            // Add inner padding to the group except for the last node.
            if (index < vertices.length - 1) {
                groupBBox.width += this.innerPadding;
            }

            // Request the series to layout the links between children and their parents.
            if (childrenBBoxes) {
                for (const { vertex: childVertex, bbox } of childrenBBoxes) {
                    layoutLinkNode(childVertex, layoutBBox, bbox);
                }
            }
        }

        // Add outer padding between this set of siblings and their cousins.
        groupBBox.width += this.outerPadding;

        return { containerBBox: groupBBox, childrenBBoxes: layoutBBoxes };
    }

    private findAndUpdateChildren(
        graph: NetworkGraph<any, any>,
        vertex: Vertex<any, any>,
        getDatumNodeBBox: (vertex: Vertex<any, any>) => TBBox | undefined,
        layoutDatumNode: (vertex: Vertex<any, any>, groupBBox: TBBox) => void,
        layoutLinkNode: (vertex: Vertex<any, any>, parentBBox: TBBox, childBBox: TBBox) => void,
        groupBBox: TBBox,
        datumBBox?: TBBox
    ) {
        const children = graph.neighboursWithEdgeValue(vertex, 'child');
        if (!children) return {};

        const childrenGroupBBox = new BBox(groupBBox.x, groupBBox.y, groupBBox.width, groupBBox.height);
        if (datumBBox) childrenGroupBBox.y += datumBBox.height + this.verticalPadding;

        const { containerBBox, childrenBBoxes } = this.updateChildren(
            graph,
            children,
            getDatumNodeBBox,
            layoutDatumNode,
            layoutLinkNode,
            childrenGroupBBox
        );

        return {
            descendentsContainerBBox: containerBBox,
            childrenBBoxes,
            mergedChildrenBBoxes: BBox.merge(childrenBBoxes.map(({ bbox }) => bbox)),
        };
    }
}
