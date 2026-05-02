import { _ModuleSupport } from 'ag-charts-community';
import { Vec2, type Vertex, clamp } from 'ag-charts-core';

import { NetworkLayout, type NetworkLayoutUpdateOptions } from './networkLayout';
import type { NetworkLinkInterpolation } from './networkTypes';

type TBBox = _ModuleSupport.BBox;
const { BBox } = _ModuleSupport;

interface ContentBoundsAccumulator {
    count: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface NetworkTreeLayoutUpdateOptions<TVertex, TEdge> extends NetworkLayoutUpdateOptions<TVertex, TEdge> {
    nodeHeight?: number;
    nodeWidth?: number;
    nodeMaxHeight?: number;
    nodeMaxWidth?: number;
    expanderPillHeight: number;
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
    // Avoids `containerBBox`, whose recursive sibling-merge over-accumulates height to O(N).
    private readonly contentBoundsAccumulator: ContentBoundsAccumulator = {
        count: 0,
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
    };

    update(options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>) {
        this.calculateRegularDimensions(options);

        const acc = this.contentBoundsAccumulator;
        acc.count = 0;
        const { containerBBox } = this.updateNodes(options);
        this._contentBBox =
            acc.count > 0 ? new BBox(acc.left, acc.top, acc.right - acc.left, acc.bottom - acc.top) : containerBBox;
        this.updateOffset(options, containerBBox);
    }

    private accumulateContentBounds(bbox: TBBox) {
        const acc = this.contentBoundsAccumulator;
        if (acc.count === 0) {
            acc.left = bbox.x;
            acc.top = bbox.y;
            acc.right = bbox.x + bbox.width;
            acc.bottom = bbox.y + bbox.height;
            acc.count = 1;
            return;
        }
        if (bbox.x < acc.left) acc.left = bbox.x;
        if (bbox.y < acc.top) acc.top = bbox.y;
        if (bbox.x + bbox.width > acc.right) acc.right = bbox.x + bbox.width;
        if (bbox.y + bbox.height > acc.bottom) acc.bottom = bbox.y + bbox.height;
        acc.count++;
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

            // Pre-check whether this vertex has children. The structural graph check is
            // used (rather than post-layout visibility) so that gaps between siblings stay
            // stable across collapse/expand toggles, and so the decision can be made
            // before laying out descendants.
            const currentHasChildren =
                (options.graph.neighboursWithEdgeValue(vertex, 'child' as TEdge)?.length ?? 0) > 0;

            // Apply spacing between this vertex and the previous one. outerSpacing
            // protects subtree boundaries when either side roots a subtree (cousin gap);
            // innerSpacing is the tighter gap reserved for two leaf siblings sharing a
            // parent.
            if (index > 0) {
                groupBBox.width += prevHasChildren || currentHasChildren ? options.outerSpacing : options.innerSpacing;
            }

            // Layout children before their parent so that the parent can be aligned to match the children.
            const { descendentsContainerBBox, childrenBBoxes, mergedChildrenBBoxes } = this.updateChildren(
                options,
                vertex,
                groupBBox,
                nodeBBox
            );

            prevHasChildren = currentHasChildren;

            const x = mergedChildrenBBoxes
                ? // When a node has children, align it centred to those immediate children, but not all descendents.
                  mergedChildrenBBoxes.x + mergedChildrenBBoxes.width / 2 - nodeBBox.width / 2
                : // Otherwise justify the node to the left against its siblings.
                  groupBBox.x + groupBBox.width;

            const layoutBBox = new BBox(x, groupBBox.y, nodeBBox.width, nodeBBox.height);
            layoutBBoxes.push({ vertex, bbox: layoutBBox });
            this.accumulateContentBounds(layoutBBox);

            // Request the series to layout the node per the calculated bbox.
            layoutDatumNode(vertex, layoutBBox, this.regularBBox);

            // Merge the bboxes into the group.
            if (descendentsContainerBBox) {
                groupBBox = BBox.merge([groupBBox, descendentsContainerBBox, layoutBBox]);
            } else {
                groupBBox = BBox.merge([groupBBox, layoutBBox]);
            }

            // Request the series to layout the links between children and their parents.
            if (childrenBBoxes) {
                for (const { vertex: childVertex, bbox } of childrenBBoxes) {
                    const interpolation = getLinkInterpolation(vertex, childVertex);
                    layoutLinkNode(childVertex, (path: _ModuleSupport.ExtendedPath2D) =>
                        this.drawLink(path, layoutBBox, bbox, interpolation, options.expanderPillHeight)
                    );
                }
            }
        }

        return { containerBBox: groupBBox, childrenBBoxes: layoutBBoxes };
    }

    private updateChildren(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        vertex: Vertex<TVertex, TEdge>,
        groupBBox: TBBox,
        datumBBox?: TBBox
    ) {
        const { graph } = options;
        const children = graph.neighboursWithEdgeValue(vertex, 'child' as TEdge) as Vertex<TVertex, TEdge>[];
        if (!children) return { childrenCount: 0 };

        const childrenGroupBBox = new BBox(groupBBox.x, groupBBox.y, groupBBox.width, groupBBox.height);
        if (datumBBox) childrenGroupBBox.y += datumBBox.height + options.verticalSpacing + options.expanderPillHeight;

        const { containerBBox, childrenBBoxes } = this.updateNodes(
            { ...options, vertices: children },
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
        interpolation: NetworkLinkInterpolation = { type: 'step' },
        expanderPillHeight: number
    ) {
        const start = Vec2.from(parentBBox.x + parentBBox.width / 2, parentBBox.y + parentBBox.height);
        const end = Vec2.from(childBBox.x + childBBox.width / 2, childBBox.y);

        const elbowDist = (end.y - start.y) / 2;

        const elbow1 = Vec2.add(start, Vec2.from(0, elbowDist + expanderPillHeight / 2));
        const elbow2 = Vec2.sub(end, Vec2.from(0, elbowDist - expanderPillHeight / 2));

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

        // Auto-centre only — Zoom feature owns pan/clamp.
        options.updateOffset(offset);
    }
}
