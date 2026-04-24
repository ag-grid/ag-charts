import { _ModuleSupport } from 'ag-charts-community';
import { type Point, Vec2, type Vertex, clamp } from 'ag-charts-core';

import { NetworkLayout, type NetworkLayoutUpdateOptions } from './networkLayout';
import type { NetworkLinkInterpolation } from './networkTypes';

type TBBox = _ModuleSupport.BBox;
const { BBox } = _ModuleSupport;

export interface NetworkTreeLayoutUpdateOptions<TVertex, TEdge> extends NetworkLayoutUpdateOptions<TVertex, TEdge> {
    nodeHeight?: number;
    nodeWidth?: number;
    nodeMaxHeight?: number;
    nodeMaxWidth?: number;
    regularDimensions: boolean;
    hiddenOnCollapse: boolean;
    verticalSpacing: number;
    outerSpacing: number;
    innerSpacing: number;
}

/**
 * A Network Tree Layout presents the nodes in a hierarchical non-circular network, for example an org chart or family
 * tree.
 */
export class NetworkTreeLayout<TVertex, TEdge> extends NetworkLayout<TVertex, TEdge> {
    update(options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>) {
        this.calculateRegularDimensions(options);

        const { containerBBox } = this.updateNodes(options, undefined);
        this.updateOffset(options, containerBBox);
    }

    protected override calculateRegularDimensions(options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>) {
        if (options.regularDimensions && (options.nodeWidth == null || options.nodeHeight == null)) {
            super.calculateRegularDimensions(options);

            if (!this.regularBBox) return;

            if (options.nodeWidth != null) {
                this.regularBBox.width = options.nodeWidth;
            } else if (options.nodeMaxWidth != null) {
                this.regularBBox.width = Math.min(options.nodeMaxWidth, this.regularBBox.width);
            }

            if (options.nodeHeight != null) {
                this.regularBBox.height = options.nodeHeight;
            } else if (options.nodeMaxHeight != null) {
                this.regularBBox.height = Math.min(options.nodeMaxHeight, this.regularBBox.height);
            }
        } else if (options.nodeWidth != null && options.nodeHeight != null) {
            this.regularBBox = new BBox(0, 0, options.nodeWidth, options.nodeHeight);
        }
    }

    private updateNodes(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        offset: Point | undefined,
        groupBBox: TBBox = new BBox(0, 0, 0, 0)
    ): {
        containerBBox: TBBox;
        childrenBBoxes: { vertex: Vertex<TVertex, TEdge>; bbox: TBBox }[];
    } {
        const { getDatumNodeBBox, getLinkInterpolation, layoutDatumNode, layoutLinkNode, vertices } = options;
        const layoutBBoxes = [];

        // Iterate through the sibling vertices calculating their layout positions.
        let index = -1;
        let prevHasChildren = false;
        for (const vertex of vertices) {
            index++;

            let nodeBBox = getDatumNodeBBox(vertex);
            if (!nodeBBox && options.hiddenOnCollapse) continue;

            nodeBBox = this.regularBBox ?? nodeBBox;
            if (!nodeBBox) continue;

            // TODO: Fix outer padding, see `org-chart-tudor` example for issue.
            if (prevHasChildren) {
                groupBBox.width += options.outerSpacing;
            }

            // Layout children before their parent so that the parent can be aligned to match the children.
            const { descendentsContainerBBox, childrenBBoxes, mergedChildrenBBoxes, childrenCount } =
                this.updateChildren(options, vertex, offset, groupBBox, nodeBBox);

            const hasVisibleChildren =
                childrenCount > 0 && descendentsContainerBBox != null && descendentsContainerBBox.width > 0;
            prevHasChildren = hasVisibleChildren;

            const x = mergedChildrenBBoxes
                ? // When a node has children, align it centred to those immediate children, but not all descendents.
                  mergedChildrenBBoxes.x + mergedChildrenBBoxes.width / 2 - nodeBBox.width / 2
                : // Otherwise justify the node to the left against its siblings.
                  groupBBox.x + groupBBox.width;

            const layoutBBox = new BBox(x, groupBBox.y, nodeBBox.width, nodeBBox.height);
            layoutBBoxes.push({ vertex, bbox: layoutBBox });

            // Request the series to layout the node per the calculated bbox.
            layoutDatumNode(vertex, layoutBBox, this.regularBBox);

            // Merge the bboxes into the group.
            if (descendentsContainerBBox) {
                groupBBox = BBox.merge([groupBBox, descendentsContainerBBox, layoutBBox]);
            } else {
                groupBBox = BBox.merge([groupBBox, layoutBBox]);
            }

            // Add inner padding to childless siblings in the group except for the last node.
            // TODO: Fix outerSpacing and add `!hasVisibleChildren` condition here
            if (index < vertices.length - 1) {
                groupBBox.width += options.innerSpacing;
            }

            // Request the series to layout the links between children and their parents.
            if (childrenBBoxes) {
                for (const { vertex: childVertex, bbox } of childrenBBoxes) {
                    const interpolation = getLinkInterpolation(vertex, childVertex);
                    layoutLinkNode(childVertex, (path: _ModuleSupport.ExtendedPath2D) =>
                        this.drawLink(path, layoutBBox, bbox, interpolation)
                    );
                }
            }
        }

        // Add outer padding between this set of siblings and their cousins.
        // groupBBox.width += this.outerPadding;

        return { containerBBox: groupBBox, childrenBBoxes: layoutBBoxes };
    }

    private updateChildren(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        vertex: Vertex<TVertex, TEdge>,
        offset: Point | undefined,
        groupBBox: TBBox,
        datumBBox?: TBBox
    ) {
        const { graph } = options;
        const children = graph.neighboursWithEdgeValue(vertex, 'child' as TEdge) as Vertex<TVertex, TEdge>[];
        if (!children) return { childrenCount: 0 };

        const childrenGroupBBox = new BBox(groupBBox.x, groupBBox.y, groupBBox.width, groupBBox.height);
        if (datumBBox) childrenGroupBBox.y += datumBBox.height + options.verticalSpacing;

        const { containerBBox, childrenBBoxes } = this.updateNodes(
            { ...options, vertices: children },
            offset,
            childrenGroupBBox
        );

        return {
            descendentsContainerBBox: containerBBox,
            childrenBBoxes,
            mergedChildrenBBoxes:
                childrenBBoxes.length > 0 ? BBox.merge(childrenBBoxes.map(({ bbox }) => bbox)) : undefined,
            childrenCount: children.length,
        };
    }

    private drawLink(
        path: _ModuleSupport.ExtendedPath2D,
        parentBBox: TBBox,
        childBBox: TBBox,
        interpolation: NetworkLinkInterpolation = { type: 'step' }
    ) {
        const start = Vec2.from(parentBBox.x + parentBBox.width / 2, parentBBox.y + parentBBox.height);
        const end = Vec2.from(childBBox.x + childBBox.width / 2, childBBox.y);
        const elbowDist = Vec2.from(0, (end.y - start.y) / 2);

        const elbow1 = Vec2.add(start, elbowDist);
        const elbow2 = Vec2.sub(end, elbowDist);

        const cornerRadius = clamp(
            0,
            interpolation.cornerRadius ?? 0,
            Math.min(Math.abs(start.x - end.x), Math.abs(start.y - end.y))
        );

        path.clear();
        path.moveTo(start.x, start.y);
        path.lineTo(elbow1.x, elbow1.y);
        if (cornerRadius > 0) {
            if (start.x > end.x) {
                path.lineTo(elbow2.x + cornerRadius, elbow2.y);
                path.arc(elbow2.x + cornerRadius, elbow2.y + cornerRadius, cornerRadius, -Math.PI / 2, Math.PI, true);
            } else if (start.x < end.x) {
                path.lineTo(elbow2.x - cornerRadius, elbow2.y);
                path.arc(elbow2.x - cornerRadius, elbow2.y + cornerRadius, cornerRadius, -Math.PI / 2, 0, false);
            }
        } else {
            path.lineTo(elbow2.x, elbow2.y);
        }
        path.lineTo(end.x, end.y);
    }

    private updateOffset(options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>, containerBBox: TBBox) {
        let offset = {
            x: containerBBox.x + containerBBox.width / 2,
            y: 0,
        };

        const focusedVertex = options.getFocusedVertex();
        if (focusedVertex) {
            const focusedBBox = options.getDatumNodeBBox(focusedVertex);
            if (focusedBBox) {
                offset = {
                    x: options.width / 2 - focusedBBox.x - (this.regularBBox?.width ?? focusedBBox.width) / 2,
                    y: -focusedBBox.y,
                };
            }
        } else {
            const defaultFocusedVertices = options.getDefaultFocusedVertices();
            const bboxes = defaultFocusedVertices?.map((vertex) => options.getDatumNodeBBox(vertex)).filter(Boolean);
            if (bboxes && bboxes.length > 0) {
                const focusedBBox = BBox.merge(bboxes as TBBox[]);
                offset = {
                    x: options.width / 2 - focusedBBox.x - (this.regularBBox?.width ?? focusedBBox.width) / 2,
                    y: -focusedBBox.y,
                };
            }
        }

        offset = Vec2.add(offset, options.offset);

        // TODO: clamp the offset so that any one node is always visible

        options.updateOffset(offset);
    }
}
