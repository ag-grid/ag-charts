import { _ModuleSupport } from 'ag-charts-community';
import { Vec2, type Vertex, clamp } from 'ag-charts-core';
import type { AgNetworkSeriesTreeLayoutAlignment, AgNetworkSeriesTreeLayoutDirection } from 'ag-charts-types';

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

    hiddenOnCollapse: boolean;
    regularDimensions: boolean;

    alignment: AgNetworkSeriesTreeLayoutAlignment;
    direction: AgNetworkSeriesTreeLayoutDirection;
    stackCollapsedChildren: boolean;
    depthSpacing: number;
    innerSpacing: number;
    outerSpacing: number;

    verticalSpacingExtra: number;
}

/**
 * A Network Tree Layout presents the nodes in a hierarchical non-circular network, for example an org chart or family
 * tree.
 */
export class NetworkTreeLayout<TVertex, TEdge> extends NetworkLayout<TVertex, TEdge> {
    private direction?: AgNetworkSeriesTreeLayoutDirection;
    private directionalLayout?: NetworkTreeDirectionalLayout<TVertex, TEdge>;

    update(options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>) {
        this.calculateRegularDimensions(options);

        if (this.direction !== options.direction || this.directionalLayout == null) {
            this.direction = options.direction;

            if (options.direction === 'left' || options.direction === 'right') {
                this.directionalLayout = new NetworkTreeHorizontalLayout<TVertex, TEdge>();
            } else {
                this.directionalLayout = new NetworkTreeVerticalLayout<TVertex, TEdge>();
            }
        }

        const acc = this.directionalLayout.contentBoundsAccumulator;
        acc.count = 0;

        const { containerBBox } = this.directionalLayout.updateNodes(options, undefined, this.regularBBox);
        this._contentBBox =
            acc.count > 0 ? new BBox(acc.left, acc.top, acc.right - acc.left, acc.bottom - acc.top) : containerBBox;

        // TODO: AG-17279 & AG-17206 – this is currently non-functional but will be required in the future when zoom &
        // focus is improved
        this.directionalLayout.updateOffset(options, containerBBox);
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
}

abstract class NetworkTreeDirectionalLayout<TVertex, TEdge> {
    // Avoids `containerBBox`, whose recursive sibling-merge over-accumulates height to O(N).
    readonly contentBoundsAccumulator: ContentBoundsAccumulator = {
        count: 0,
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
    };

    abstract updateNodes(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox?: TBBox,
        regularBBox?: TBBox
    ): {
        containerBBox: TBBox;
        childrenBBoxes: { vertex: Vertex<TVertex, TEdge>; bbox: TBBox }[];
    };

    abstract updateOffset(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        containerBBox: TBBox,
        regularBBox?: TBBox
    ): void;

    protected accumulateContentBounds(bbox: TBBox) {
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
}

class NetworkTreeVerticalLayout<TVertex, TEdge> extends NetworkTreeDirectionalLayout<TVertex, TEdge> {
    updateNodes(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox: TBBox = new BBox(0, 0, 0, 0),
        regularBBox?: TBBox
    ): {
        containerBBox: TBBox;
        childrenBBoxes: { vertex: Vertex<TVertex, TEdge>; bbox: TBBox }[];
    } {
        const { getDatumNodeBBox, getLinkInterpolation, layoutDatumNode, layoutLinkNode, vertices } = options;
        const layoutBBoxes = [];

        // Iterate through the sibling vertices calculating their layout positions.
        let index = -1;
        let prevHasVisibleChildren = false;
        for (const vertex of vertices) {
            index++;

            let nodeBBox = getDatumNodeBBox(vertex);
            if (!nodeBBox && options.hiddenOnCollapse) continue;

            nodeBBox = regularBBox ?? nodeBBox;
            if (!nodeBBox) continue;

            // Add spacing to the left if the previous sibling has visible children.
            if (prevHasVisibleChildren) {
                groupBBox.width += options.outerSpacing;
            }

            // Layout children before their parent so that the parent can be aligned to match the children.
            const { descendentsContainerBBox, childrenBBoxes, mergedChildrenBBoxes, childrenCount } =
                this.updateChildren(
                    options,
                    vertex,
                    groupBBox,
                    nodeBBox,
                    regularBBox,
                    prevHasVisibleChildren || index === 0
                );

            const hasVisibleChildren =
                childrenCount > 0 && mergedChildrenBBoxes != null && mergedChildrenBBoxes.width > 0;
            prevHasVisibleChildren = hasVisibleChildren;

            const x = mergedChildrenBBoxes
                ? // When a node has children, align it centred to those immediate children, but not all descendents.
                  mergedChildrenBBoxes.x + mergedChildrenBBoxes.width / 2 - nodeBBox.width / 2
                : // Otherwise justify the node to the left against its siblings.
                  groupBBox.x + groupBBox.width;

            const layoutBBox = new BBox(x, groupBBox.y, nodeBBox.width, nodeBBox.height);

            // Request the series to layout the node per the calculated bbox. Override the layoutBBox for the accumulator
            // if the node extends outside its default size, e.g. for an expander pill.
            const overrideAccumulateBBox = layoutDatumNode(vertex, layoutBBox, regularBBox);

            layoutBBoxes.push({ vertex, bbox: layoutBBox });
            this.accumulateContentBounds(overrideAccumulateBBox ?? layoutBBox);

            // Merge the bboxes into the group.
            if (descendentsContainerBBox) {
                const containerBBox = new BBox(
                    descendentsContainerBBox.x,
                    options.direction === 'up' ? groupBBox.y : descendentsContainerBBox.y,
                    descendentsContainerBBox.width,
                    descendentsContainerBBox.height
                );
                groupBBox = BBox.merge([groupBBox, containerBBox, layoutBBox]);
            } else {
                groupBBox = BBox.merge([groupBBox, layoutBBox]);
            }

            // Add inner padding to childless siblings in the group except for the last node.
            if (index < vertices.length - 1 && !hasVisibleChildren) {
                groupBBox.width += options.innerSpacing;
            }

            // Request the series to layout the links between children and their parents.
            if (childrenBBoxes) {
                for (const { vertex: childVertex, bbox } of childrenBBoxes) {
                    const interpolation = getLinkInterpolation(vertex, childVertex);
                    layoutLinkNode(childVertex, (path: _ModuleSupport.ExtendedPath2D) =>
                        this.drawLink(path, layoutBBox, bbox, interpolation, options)
                    );
                }
            }
        }

        return { containerBBox: groupBBox, childrenBBoxes: layoutBBoxes };
    }

    updateOffset(options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>, containerBBox: TBBox, regularBBox?: TBBox) {
        let offset = {
            x: containerBBox.x + containerBBox.width / 2,
            y: 0,
        };

        const focusedVertex = options.getFocusedVertex();
        if (focusedVertex) {
            const focusedBBox = options.getDatumNodeBBox(focusedVertex);
            if (focusedBBox) {
                offset = {
                    x: options.width / 2 - focusedBBox.x - (regularBBox?.width ?? focusedBBox.width) / 2,
                    y: -focusedBBox.y,
                };
            }
        } else {
            const defaultFocusedVertices = options.getDefaultFocusedVertices();
            const bboxes = defaultFocusedVertices?.map((vertex) => options.getDatumNodeBBox(vertex)).filter(Boolean);
            if (bboxes && bboxes.length > 0) {
                const focusedBBox = BBox.merge(bboxes as TBBox[]);
                offset = {
                    x: options.width / 2 - focusedBBox.x - (regularBBox?.width ?? focusedBBox.width) / 2,
                    y: -focusedBBox.y,
                };
            }
        }

        // Auto-centre only — Zoom feature owns pan/clamp.
        options.updateOffset(offset);
    }

    private updateChildren(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        vertex: Vertex<TVertex, TEdge>,
        groupBBox: TBBox,
        nodeBBox: TBBox,
        regularBBox: TBBox | undefined,
        prevHasVisibleChildren: boolean
    ) {
        const { graph } = options;
        const children = graph.neighboursWithEdgeValue(vertex, 'child' as TEdge) as Vertex<TVertex, TEdge>[];
        if (!children || children.length == 0) return { childrenCount: 0 };

        let adjustY = nodeBBox.height + options.depthSpacing + options.verticalSpacingExtra;
        if (options.direction === 'up') adjustY *= -1;
        const childrenGroupBBox = new BBox(groupBBox.x, groupBBox.y + adjustY, groupBBox.width, groupBBox.height);

        // Add spacing to the left if the parent's previous sibling does not have visible children.
        if (!prevHasVisibleChildren) {
            childrenGroupBBox.x += options.outerSpacing - options.innerSpacing;
        }

        const { containerBBox, childrenBBoxes } = this.updateNodes(
            { ...options, vertices: children },
            childrenGroupBBox,
            regularBBox
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
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>
    ) {
        const start = Vec2.from(
            parentBBox.x + parentBBox.width / 2,
            options.direction === 'up'
                ? parentBBox.y - options.verticalSpacingExtra
                : parentBBox.y + parentBBox.height + options.verticalSpacingExtra
        );
        const end = Vec2.from(
            childBBox.x + childBBox.width / 2,
            options.direction === 'up' ? childBBox.y + childBBox.height : childBBox.y
        );

        const elbowDist = (end.y - start.y) / 2;

        const elbow1 = Vec2.add(start, Vec2.from(0, elbowDist));
        const elbow2 = Vec2.sub(end, Vec2.from(0, elbowDist));

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
                if (options.direction === 'up') {
                    path.arc(
                        elbow2.x + cornerRadius,
                        elbow2.y - cornerRadius,
                        cornerRadius,
                        Math.PI / 2,
                        Math.PI,
                        false
                    );
                } else {
                    path.arc(
                        elbow2.x + cornerRadius,
                        elbow2.y + cornerRadius,
                        cornerRadius,
                        -Math.PI / 2,
                        Math.PI,
                        true
                    );
                }
            } else if (start.x < end.x) {
                path.lineTo(elbow2.x - cornerRadius, elbow2.y);
                if (options.direction === 'up') {
                    path.arc(elbow2.x - cornerRadius, elbow2.y - cornerRadius, cornerRadius, Math.PI / 2, 0, true);
                } else {
                    path.arc(elbow2.x - cornerRadius, elbow2.y + cornerRadius, cornerRadius, -Math.PI / 2, 0, false);
                }
            }
        } else {
            path.lineTo(elbow2.x, elbow2.y);
        }
        path.lineTo(end.x, end.y);
    }
}

class NetworkTreeHorizontalLayout<TVertex, TEdge> extends NetworkTreeDirectionalLayout<TVertex, TEdge> {
    updateNodes(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox: TBBox = new BBox(0, 0, 0, 0),
        regularBBox?: TBBox
    ): {
        containerBBox: TBBox;
        childrenBBoxes: { vertex: Vertex<TVertex, TEdge>; bbox: TBBox }[];
    } {
        const { getDatumNodeBBox, getLinkInterpolation, layoutDatumNode, layoutLinkNode, vertices } = options;
        const layoutBBoxes = [];

        // Iterate through the sibling vertices calculating their layout positions.
        let index = -1;
        let prevHasVisibleChildren = false;
        for (const vertex of vertices) {
            index++;

            let nodeBBox = getDatumNodeBBox(vertex);
            if (!nodeBBox && options.hiddenOnCollapse) continue;

            nodeBBox = regularBBox ?? nodeBBox;
            if (!nodeBBox) continue;

            // Add spacing to the top if the previous sibling has visible children.
            if (prevHasVisibleChildren) {
                groupBBox.height += options.outerSpacing;
            }

            // Layout children before their parent so that the parent can be aligned to match the children.
            const { descendentsContainerBBox, childrenBBoxes, mergedChildrenBBoxes, childrenCount } =
                this.updateChildren(
                    options,
                    vertex,
                    groupBBox,
                    nodeBBox,
                    regularBBox,
                    prevHasVisibleChildren || index === 0
                );

            const hasVisibleChildren =
                childrenCount > 0 && mergedChildrenBBoxes != null && mergedChildrenBBoxes.width > 0;
            prevHasVisibleChildren = hasVisibleChildren;

            const y = mergedChildrenBBoxes
                ? // When a node has children, align it centred to those immediate children, but not all descendents.
                  mergedChildrenBBoxes.y + mergedChildrenBBoxes.height / 2 - nodeBBox.height / 2
                : // Otherwise justify the node to the top against its siblings.
                  groupBBox.y + groupBBox.height;

            const layoutBBox = new BBox(groupBBox.x, y, nodeBBox.width, nodeBBox.height);

            // Request the series to layout the node per the calculated bbox. Override the layoutBBox for the accumulator
            // if the node extends outside its default size, e.g. for an expander pill.
            const overrideAccumulateBBox = layoutDatumNode(vertex, layoutBBox, regularBBox);

            layoutBBoxes.push({ vertex, bbox: layoutBBox });
            this.accumulateContentBounds(overrideAccumulateBBox ?? layoutBBox);

            // Merge the bboxes into the group.
            if (descendentsContainerBBox) {
                const containerBBox = new BBox(
                    options.direction === 'left' ? groupBBox.x : descendentsContainerBBox.x,
                    descendentsContainerBBox.y,
                    descendentsContainerBBox.width,
                    descendentsContainerBBox.height
                );
                groupBBox = BBox.merge([groupBBox, containerBBox, layoutBBox]);
            } else {
                groupBBox = BBox.merge([groupBBox, layoutBBox]);
            }

            // Add inner padding to childless siblings in the group except for the last node.
            if (index < vertices.length - 1 && !hasVisibleChildren) {
                groupBBox.height += options.innerSpacing;
            }

            // Request the series to layout the links between children and their parents.
            if (childrenBBoxes) {
                for (const { vertex: childVertex, bbox } of childrenBBoxes) {
                    const interpolation = getLinkInterpolation(vertex, childVertex);
                    layoutLinkNode(childVertex, (path: _ModuleSupport.ExtendedPath2D) =>
                        this.drawLink(path, layoutBBox, bbox, interpolation, options)
                    );
                }
            }
        }

        return { containerBBox: groupBBox, childrenBBoxes: layoutBBoxes };
    }

    updateOffset(
        _options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        _containerBBox: TBBox,
        _regularBBox?: TBBox
    ) {
        // TODO
    }

    private updateChildren(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        vertex: Vertex<TVertex, TEdge>,
        groupBBox: TBBox,
        nodeBBox: TBBox,
        regularBBox: TBBox | undefined,
        prevHasVisibleChildren: boolean
    ) {
        const { graph } = options;
        const children = graph.neighboursWithEdgeValue(vertex, 'child' as TEdge) as Vertex<TVertex, TEdge>[];
        if (!children || children.length == 0) return { childrenCount: 0 };

        let adjustX = nodeBBox.width + options.depthSpacing + options.verticalSpacingExtra;
        if (options.direction === 'left') adjustX *= -1;
        const childrenGroupBBox = new BBox(groupBBox.x + adjustX, groupBBox.y, groupBBox.width, groupBBox.height);

        // Add spacing to the top if the parent's previous sibling does not have visible children.
        if (!prevHasVisibleChildren) {
            childrenGroupBBox.y += options.outerSpacing - options.innerSpacing;
        }

        const { containerBBox, childrenBBoxes } = this.updateNodes(
            { ...options, vertices: children },
            childrenGroupBBox,
            regularBBox
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
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>
    ) {
        const start = Vec2.from(
            options.direction === 'left'
                ? parentBBox.x - options.verticalSpacingExtra
                : parentBBox.x + parentBBox.width + options.verticalSpacingExtra,
            parentBBox.y + parentBBox.height / 2
        );
        const end = Vec2.from(
            options.direction === 'left' ? childBBox.x + childBBox.width : childBBox.x,
            childBBox.y + childBBox.height / 2
        );

        const elbowDist = (end.x - start.x) / 2;

        const elbow1 = Vec2.add(start, Vec2.from(elbowDist, 0));
        const elbow2 = Vec2.sub(end, Vec2.from(elbowDist, 0));

        const cornerRadius = clamp(
            0,
            interpolation.cornerRadius ?? 0,
            Math.min(Math.abs(start.x - end.x), Math.abs(start.y - end.y))
        );

        path.clear();
        path.moveTo(start.x, start.y);
        path.lineTo(elbow1.x, elbow1.y);
        if (cornerRadius > 0) {
            if (start.y > end.y) {
                path.lineTo(elbow2.x, elbow2.y + cornerRadius);
                if (options.direction === 'left') {
                    path.arc(elbow2.x - cornerRadius, elbow2.y + cornerRadius, cornerRadius, 0, -Math.PI / 2, true);
                } else {
                    path.arc(
                        elbow2.x + cornerRadius,
                        elbow2.y + cornerRadius,
                        cornerRadius,
                        -Math.PI,
                        -Math.PI / 2,
                        false
                    );
                }
            } else if (start.y < end.y) {
                path.lineTo(elbow2.x, elbow2.y - cornerRadius);
                if (options.direction === 'left') {
                    path.arc(elbow2.x - cornerRadius, elbow2.y - cornerRadius, cornerRadius, 0, Math.PI / 2, false);
                } else {
                    path.arc(
                        elbow2.x + cornerRadius,
                        elbow2.y - cornerRadius,
                        cornerRadius,
                        Math.PI,
                        Math.PI / 2,
                        true
                    );
                }
            }
        } else {
            path.lineTo(elbow2.x, elbow2.y);
        }
        path.lineTo(end.x, end.y);
    }
}
