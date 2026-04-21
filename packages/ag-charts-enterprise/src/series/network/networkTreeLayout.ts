import { _ModuleSupport } from 'ag-charts-community';
import { type Point, Vec2, type Vertex, clamp } from 'ag-charts-core';

import { NetworkLayout, type NetworkLayoutUpdateOptions } from './networkLayout';
import type { NetworkLinkInterpolation } from './networkTypes';

type TBBox = _ModuleSupport.BBox;
const { BBox } = _ModuleSupport;

/**
 * A Network Tree Layout presents the nodes in a hierarchical non-circular network, for example an org chart or family
 * tree.
 */
export class NetworkTreeLayout<TVertex, TEdge> extends NetworkLayout<TVertex, TEdge> {
    public interpolation: { type: 'step'; cornerRadius?: number } = { type: 'step' };

    private readonly verticalPadding = 40;
    private readonly outerPadding = 10;
    private readonly innerPadding = 10;

    update(options: NetworkLayoutUpdateOptions<TVertex, TEdge>) {
        const { containerBBox } = this.updateChildren(options, undefined);

        // Remove the last unused side of outer padding from the container
        containerBBox.width -= this.outerPadding;

        this.updateOffset(options, containerBBox);
    }

    private updateChildren(
        options: NetworkLayoutUpdateOptions<TVertex, TEdge>,
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
        for (const vertex of vertices) {
            index++;

            const nodeBBox = getDatumNodeBBox(vertex);

            // Layout children before their parent so that the parent can be aligned to match the children.
            const { descendentsContainerBBox, childrenBBoxes, mergedChildrenBBoxes } = this.findAndUpdateChildren(
                options,
                vertex,
                offset,
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
                    const interpolation = getLinkInterpolation(vertex, childVertex);
                    layoutLinkNode(childVertex, (path: _ModuleSupport.ExtendedPath2D) =>
                        this.drawLink(path, layoutBBox, bbox, interpolation)
                    );
                }
            }
        }

        // Add outer padding between this set of siblings and their cousins.
        groupBBox.width += this.outerPadding;

        return { containerBBox: groupBBox, childrenBBoxes: layoutBBoxes };
    }

    private findAndUpdateChildren(
        options: NetworkLayoutUpdateOptions<TVertex, TEdge>,
        vertex: Vertex<TVertex, TEdge>,
        offset: Point | undefined,
        groupBBox: TBBox,
        datumBBox?: TBBox
    ) {
        const { graph } = options;
        const children = graph.neighboursWithEdgeValue(vertex, 'child' as TEdge) as Vertex<TVertex, TEdge>[];
        if (!children) return {};

        const childrenGroupBBox = new BBox(groupBBox.x, groupBBox.y, groupBBox.width, groupBBox.height);
        if (datumBBox) childrenGroupBBox.y += datumBBox.height + this.verticalPadding;

        const { containerBBox, childrenBBoxes } = this.updateChildren(
            { ...options, vertices: children },
            offset,
            childrenGroupBBox
        );

        return {
            descendentsContainerBBox: containerBBox,
            childrenBBoxes,
            mergedChildrenBBoxes:
                childrenBBoxes.length > 0 ? BBox.merge(childrenBBoxes.map(({ bbox }) => bbox)) : undefined,
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

    private updateOffset(options: NetworkLayoutUpdateOptions<TVertex, TEdge>, containerBBox: TBBox) {
        let offset = {
            x: containerBBox.x + containerBBox.width / 2,
            y: 0,
        };

        const focusedVertex = options.getFocusedVertex();
        if (focusedVertex) {
            const focusedBBox = options.getDatumNodeBBox(focusedVertex);
            if (focusedBBox) {
                offset = {
                    x: options.width / 2 - focusedBBox.x - focusedBBox.width / 2,
                    y: -focusedBBox.y,
                };
            }
        } else {
            const defaultFocusedVertices = options.getDefaultFocusedVertices();
            const bboxes = defaultFocusedVertices?.map((vertex) => options.getDatumNodeBBox(vertex)).filter(Boolean);
            if (bboxes && bboxes.length > 0) {
                const focusedBBox = BBox.merge(bboxes as TBBox[]);
                offset = {
                    x: options.width / 2 - focusedBBox.x - focusedBBox.width / 2,
                    y: -focusedBBox.y,
                };
            }
        }

        // offset = this.clampOffset(offset, containerBBox, options);
        options.updateOffset(offset);
    }

    private clampOffset(
        offset: Point,
        containerBBox: TBBox,
        options: Pick<NetworkLayoutUpdateOptions<TVertex, TEdge>, 'height' | 'width'>
    ): Point {
        return {
            x: clamp(-containerBBox.width, offset.x, containerBBox.width),
            y: clamp(
                containerBBox.y - containerBBox.height + options.height,
                offset.y,
                containerBBox.y + options.height
            ),
        };
    }
}
